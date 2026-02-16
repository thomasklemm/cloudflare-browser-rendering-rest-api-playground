/**
 * Cloudflare Worker that serves the static frontend and proxies API requests
 * to the Cloudflare Browser Rendering API
 */

import manifestJSON from '__STATIC_CONTENT_MANIFEST'
import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

const assetManifest = JSON.parse(manifestJSON)

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
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
        }
      )
    } catch {
      // If asset not found, serve index.html for client-side routing (SPA)
      try {
        const indexRequest = new Request(`${url.origin}/index.html`, request)

        const indexResponse = await getAssetFromKV(
          {
            request: indexRequest,
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: assetManifest,
          }
        )

        // Return index.html with 200 status for SPA routing
        return new Response(indexResponse.body, {
          status: 200,
          headers: indexResponse.headers,
        })
      } catch (err) {
        // If even index.html fails, return error
        const errorMessage = err instanceof Error ? err.message : String(err)
        return new Response(`Error loading page: ${errorMessage}`, {
          status: 500,
          headers: { 'Content-Type': 'text/plain' },
        })
      }
    }
  },
}

/**
 * Proxies requests to the Cloudflare Browser Rendering API
 * Strips /api/cf prefix and forwards to api.cloudflare.com
 */
async function handleApiProxy(request: Request, url: URL): Promise<Response> {
  // Remove /api/cf prefix to get the actual CF API path
  const targetPath = url.pathname.replace(/^\/api\/cf/, '')
  const targetUrl = `https://api.cloudflare.com${targetPath}${url.search}`

  // Clone the request but with the new URL
  const proxyRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    duplex: 'half',
  } as RequestInit)

  // Forward to Cloudflare API
  const response = await fetch(proxyRequest)

  // Return response with CORS headers
  const proxyResponse = new Response(response.body, response)
  proxyResponse.headers.set('Access-Control-Allow-Origin', '*')
  proxyResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  proxyResponse.headers.set('Access-Control-Allow-Headers', '*')

  return proxyResponse
}
