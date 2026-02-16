/**
 * Cloudflare Worker that serves the static frontend and proxies API requests
 * to the Cloudflare Browser Rendering API
 */

// @ts-ignore - Workers Sites assets
import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
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
          waitUntil(promise) {
            return ctx.waitUntil(promise)
          },
        },
        {
          // @ts-ignore
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: JSON.parse(env.__STATIC_CONTENT_MANIFEST),
        }
      )
    } catch (e) {
      // If asset not found, serve index.html for client-side routing
      try {
        const notFoundResponse = await getAssetFromKV(
          {
            request: new Request(`${url.origin}/index.html`, request),
            waitUntil(promise) {
              return ctx.waitUntil(promise)
            },
          },
          {
            // @ts-ignore
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: JSON.parse(env.__STATIC_CONTENT_MANIFEST),
          }
        )
        return new Response(notFoundResponse.body, {
          ...notFoundResponse,
          status: 200,
        })
      } catch {
        return new Response('Not Found', { status: 404 })
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
    // @ts-ignore
    duplex: 'half',
  })

  // Forward to Cloudflare API
  const response = await fetch(proxyRequest)

  // Return response with CORS headers
  const proxyResponse = new Response(response.body, response)
  proxyResponse.headers.set('Access-Control-Allow-Origin', '*')
  proxyResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  proxyResponse.headers.set('Access-Control-Allow-Headers', '*')

  return proxyResponse
}
