# Deployment Guide

This guide explains how to deploy the Cloudflare Browser Rendering REST API Playground to Cloudflare Workers.

## Architecture

The deployment uses Cloudflare Workers Sites:
- **Static Frontend**: Built React app served from Workers Sites (KV storage)
- **API Proxy**: Worker handles `/api/cf/*` requests and proxies them to `api.cloudflare.com`

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install via npm (included in devDependencies)
3. **Node.js**: Version 18 or higher

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Authenticate Wrangler

First time setup - authenticate with your Cloudflare account:

```bash
npx wrangler login
```

This opens a browser window to authorize Wrangler.

### 3. Configure wrangler.toml (Optional)

The `wrangler.toml` file is pre-configured. You may want to customize:

```toml
name = "cloudflare-browser-rendering-playground"  # Change to your preferred worker name
```

## Deployment

### Production Deployment

Build the frontend and deploy to Cloudflare Workers:

```bash
npm run deploy
```

This will:
1. Run TypeScript type checking
2. Build the React app with Vite
3. Deploy the worker and upload static assets to KV

After deployment, Wrangler will output your worker URL:
```
✨ Published cloudflare-browser-rendering-playground (X.XX sec)
   https://cloudflare-browser-rendering-playground.YOUR-SUBDOMAIN.workers.dev
```

### Development Deployment

Deploy to a development environment:

```bash
npm run deploy:dev
```

### Local Testing with Wrangler

Test the Worker locally before deployment:

```bash
npm run wrangler:dev
```

This runs the Worker in local development mode with the built frontend.

## Post-Deployment

### Custom Domain (Optional)

To use a custom domain:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages
2. Select your worker
3. Go to "Triggers" → "Custom Domains"
4. Add your domain (must be on Cloudflare)

### Environment Variables (Optional)

If you need to add environment variables:

1. Edit `wrangler.toml`:
   ```toml
   [vars]
   ENVIRONMENT = "production"
   ```

2. Or set them in the Cloudflare Dashboard → Workers & Pages → your worker → Settings → Variables

### Secrets (Optional)

For sensitive data (API keys, tokens):

```bash
npx wrangler secret put SECRET_NAME
```

Access in worker:
```typescript
env.SECRET_NAME
```

## Architecture Details

### Static Asset Serving

The Worker uses `@cloudflare/kv-asset-handler` to serve built frontend files from KV storage:
- All static assets (JS, CSS, images) served from `dist/`
- Client-side routing: 404s fallback to `index.html`

### API Proxy

Requests to `/api/cf/*` are proxied to `https://api.cloudflare.com`:
- Path rewriting: `/api/cf/client/v4/...` → `https://api.cloudflare.com/client/v4/...`
- CORS headers added automatically
- Request headers (auth tokens) forwarded to CF API

### Local Development

During local development (`npm run dev`), Vite's dev server handles the proxy:
- Vite config in `vite.config.ts` proxies `/api/cf` → `api.cloudflare.com`
- No Worker needed for local dev
- Hot module replacement works normally

## Troubleshooting

### Build Failures

If build fails:
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Worker Deploy Fails

Check your account limits:
- Free tier: 100,000 requests/day
- Workers KV storage limits

View worker logs:
```bash
npx wrangler tail
```

### CORS Issues

The Worker adds CORS headers automatically. If you still see CORS errors:
- Check that requests go through `/api/cf/*` path
- Verify the proxy is working in browser DevTools Network tab

### KV Storage Limits

Free tier has KV storage limits. If deployment fails due to size:
- Check `dist/` folder size
- Consider using Cloudflare Pages instead for larger static sites

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

Get API token from: [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) → Create Token → Edit Cloudflare Workers

## Cost Estimates

Cloudflare Workers pricing (as of 2025):
- **Free tier**: 100,000 requests/day
- **Paid ($5/month)**: 10 million requests/month + overage
- **KV storage**: Included in Workers plan

This app should fit comfortably in the free tier for personal use.

## Alternative: Cloudflare Pages

For a simpler static-only deployment (without the Worker proxy), use Cloudflare Pages:

1. Push code to GitHub
2. Connect repo to Cloudflare Pages
3. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`

**Note**: With Pages, you'll need to update the app to make API calls directly to `api.cloudflare.com` (no proxy) or use Pages Functions for the proxy.
