/**
 * Cloudflare Worker that serves the static frontend and proxies API requests
 * to the Cloudflare Browser Rendering API
 */

import manifestJSON from '__STATIC_CONTENT_MANIFEST'
import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

const assetManifest = JSON.parse(manifestJSON)
const BROWSER_RENDERING_PATH_RE = /^\/client\/v4\/accounts\/[^/]+\/browser-rendering(?:\/.*)?$/
const BROWSER_RENDERING_ORIGIN = 'https://api.cloudflare.com'
const ALLOWED_API_METHODS = new Set(['POST', 'OPTIONS'])

interface Env {
  __STATIC_CONTENT: KVNamespace
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    // Proxy /api/cf/* to Cloudflare Browser Rendering API
    if (url.pathname.startsWith('/api/cf/')) {
      return handleApiProxy(request, url)
    }

    // Serve static assets from Workers Sites
    try {
      const response = await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
        }
      )

      return withSecurityHeaders(response, { includeCsp: isHtmlResponse(response) })
    } catch {
      // If asset not found, serve index.html for client-side routing (SPA)
      try {
        const indexRequest = new Request(`${url.origin}/index.html`, request)

        const response = await getAssetFromKV(
          {
            request: indexRequest,
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: assetManifest,
          }
        )

        const indexResponse = new Response(response.body, {
          status: 200,
          headers: response.headers,
        })

        return withSecurityHeaders(indexResponse, { includeCsp: true })
      } catch (err) {
        // If even index.html fails, return a generic error to avoid leaking internals.
        const response = new Response('Internal Server Error', {
          status: 500,
          headers: { 'Content-Type': 'text/plain' },
        })

        ctx.waitUntil(
          Promise.resolve().then(() => console.error('Error loading static assets', err))
        )

        return withSecurityHeaders(response)
      }
    }
  },
}

/**
 * Proxies requests to the Cloudflare Browser Rendering API
 * Strips /api/cf prefix and forwards to api.cloudflare.com
 */
async function handleApiProxy(request: Request, url: URL): Promise<Response> {
  if (!ALLOWED_API_METHODS.has(request.method)) {
    return withSecurityHeaders(new Response('Method Not Allowed', { status: 405 }))
  }

  const originCheck = validateBrowserOrigin(request, url)
  if (!originCheck.allowed) {
    return withSecurityHeaders(new Response('Forbidden', { status: 403 }))
  }

  if (request.method === 'OPTIONS') {
    return withSecurityHeaders(new Response(null, { status: 204 }), {
      corsOrigin: originCheck.origin,
    })
  }

  const authorization = request.headers.get('Authorization')
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return withSecurityHeaders(new Response('Missing or invalid Authorization header', { status: 400 }), {
      corsOrigin: originCheck.origin,
    })
  }

  const contentType = request.headers.get('Content-Type') || ''
  if (!contentType.toLowerCase().includes('application/json')) {
    return withSecurityHeaders(new Response('Unsupported Content-Type', { status: 415 }), {
      corsOrigin: originCheck.origin,
    })
  }

  // Remove /api/cf prefix to get the actual CF API path
  const targetPath = url.pathname.replace(/^\/api\/cf/, '')
  if (!BROWSER_RENDERING_PATH_RE.test(targetPath)) {
    return withSecurityHeaders(new Response('Invalid API path', { status: 400 }), {
      corsOrigin: originCheck.origin,
    })
  }

  const targetUrl = `${BROWSER_RENDERING_ORIGIN}${targetPath}${url.search}`
  const upstreamHeaders = buildUpstreamHeaders(request.headers)

  let upstreamResponse: Response
  try {
    upstreamResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: upstreamHeaders,
      body: request.body,
    })
  } catch {
    return withSecurityHeaders(new Response('Upstream request failed', { status: 502 }), {
      corsOrigin: originCheck.origin,
    })
  }

  const proxyResponse = new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: upstreamResponse.headers,
  })

  return withSecurityHeaders(proxyResponse, { corsOrigin: originCheck.origin })
}

function buildUpstreamHeaders(incoming: Headers): Headers {
  const headers = new Headers()

  const authorization = incoming.get('Authorization')
  if (authorization) headers.set('Authorization', authorization)

  const contentType = incoming.get('Content-Type')
  if (contentType) headers.set('Content-Type', contentType)

  const accept = incoming.get('Accept')
  if (accept) headers.set('Accept', accept)

  return headers
}

function isHtmlResponse(response: Response): boolean {
  const contentType = response.headers.get('Content-Type') || ''
  return contentType.includes('text/html')
}

function validateBrowserOrigin(request: Request, url: URL): { allowed: boolean; origin: string | null } {
  const origin = request.headers.get('Origin')

  // Allow non-browser callers that don't send Origin.
  if (!origin) return { allowed: true, origin: null }

  return {
    allowed: origin === url.origin,
    origin: origin === url.origin ? origin : null,
  }
}

function appendVary(headers: Headers, value: string) {
  const existing = headers.get('Vary')
  if (!existing) {
    headers.set('Vary', value)
    return
  }

  const parts = existing
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)

  if (!parts.includes(value.toLowerCase())) {
    headers.set('Vary', `${existing}, ${value}`)
  }
}

function withSecurityHeaders(
  response: Response,
  options: { includeCsp?: boolean; corsOrigin?: string | null } = {},
): Response {
  const headers = new Headers(response.headers)

  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  if (options.includeCsp) {
    headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://api.cloudflare.com; frame-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
    )
  }

  if (options.corsOrigin) {
    headers.set('Access-Control-Allow-Origin', options.corsOrigin)
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept')
    headers.set('Access-Control-Max-Age', '600')
    appendVary(headers, 'Origin')
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
