# Cloudflare Browser Rendering REST API Playground

Interactive web playground for exploring all 8 [Cloudflare Browser Rendering REST API](https://developers.cloudflare.com/browser-rendering/rest-api/) endpoints.

Configure your credentials, fill in endpoint-specific parameters, see the generated curl command, and view responses (HTML, images, PDFs, JSON, markdown) inline.

## Endpoints

| Endpoint | Response | Viewer |
|----------|----------|--------|
| `/content` | HTML | Sandboxed iframe + source view |
| `/screenshot` | Image (png/jpeg/webp) | Inline image + download |
| `/pdf` | PDF | Inline PDF viewer + download |
| `/json` | JSON | Collapsible JSON tree |
| `/markdown` | Text | Rendered markdown + raw view |
| `/snapshot` | JSON (HTML + base64 screenshot) | Combined HTML + image viewer |
| `/scrape` | JSON | JSON tree |
| `/links` | JSON | JSON tree |

## Features

- **Data-driven forms** — endpoint configs drive dynamic form rendering
- **URL/HTML toggle** — provide a URL or paste raw HTML
- **Live curl preview** — see the exact curl command with copy-to-clipboard
- **Binary response handling** — images and PDFs render inline via blob URLs
- **Cmd+Enter** to send requests
- **Persistent settings** — credentials and form values stored in localStorage
- **Cookie banner dismissal** — two-layer approach: blocks CMP script URLs via `rejectRequestPattern` + injects a cleanup script via `addScriptTag` covering 18+ CMP providers (OneTrust, Cookiebot, Usercentrics, consentmanager.net, and more)
- **Load all images** — scrolls the page to trigger lazy-loaded images (IntersectionObserver, `data-src` patterns), then waits for completion via a sentinel element

## Setup

```sh
npm install
npm run dev
```

Open http://localhost:5173 and configure your Cloudflare Account ID and API Token in the settings panel.

## Deployment

This app can be deployed to Cloudflare Workers with automatic GitHub Actions integration.

### Quick Deploy

```bash
# Authenticate with Cloudflare (first time only)
npx wrangler login

# Build and deploy
npm run deploy
```

### Automatic Deployment (GitHub Actions)

Pushing to the `main` branch automatically deploys to Cloudflare Workers.

**Setup steps:**
1. Create a Cloudflare API token at https://dash.cloudflare.com/profile/api-tokens
2. Add it as `CLOUDFLARE_API_TOKEN` secret in GitHub repo settings
3. Push to `main` branch

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### API Token

Create an API token at https://dash.cloudflare.com/profile/api-tokens with the permission **Account > Browser Rendering > Edit**.

### CORS

The Vite dev server proxies requests through `/api/cf` to `https://api.cloudflare.com` to avoid CORS issues. The curl preview shows the real Cloudflare URL.

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS v4
- lucide-react, react-markdown, react-json-view-lite
