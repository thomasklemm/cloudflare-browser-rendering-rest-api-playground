<p align="center">
  <img src="public/icon.png" alt="Browser Bolt" width="128" height="128" />
</p>

<h1 align="center">Cloudflare Browser Rendering Playground</h1>

<p align="center">
  A visual playground for the <a href="https://developers.cloudflare.com/browser-rendering/rest-api/">Cloudflare Browser Rendering REST API</a>.<br/>
  Take screenshots, generate PDFs, extract data, and run full-site crawls — no code required.
</p>

<p align="center">
  <a href="https://cloudflare-browser-rendering-playground.tjk-ventures-o.workers.dev"><strong>Live Demo</strong></a> &nbsp;&middot;&nbsp;
  <a href="https://developers.cloudflare.com/browser-rendering/rest-api/">API Docs</a> &nbsp;&middot;&nbsp;
  <a href="#quick-start">Quick Start</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/React-19-61dafb.svg" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178c6.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8.svg" alt="Tailwind CSS" />
</p>

> **Note:** This is an independent, community-driven project — not affiliated with or endorsed by Cloudflare, Inc.

---

## Why This Exists

Cloudflare Browser Rendering gives you headless Chrome on Cloudflare's edge — screenshots, PDFs, AI data extraction, markdown conversion, scraping, and more. But testing it means writing fetch calls and parsing binary responses by hand.

This playground gives you a GUI for the entire API. Pick an endpoint, enter a URL, hit send, see the result.

- **Batch URLs** — test multiple sites in parallel, compare results side-by-side
- **First-class crawl workflow** — start async `/crawl` jobs, poll progress, inspect records, paginate, and export results
- **Live curl preview** — see the exact API call, copy it to your terminal
- **Inline rendering** — images, PDFs, JSON trees, and markdown render directly in the response panel
- **Cookie banner dismissal** — blocks 18+ consent providers for clean screenshots
- **Persistent state** — credentials and form values survive page refreshes

## Quick Start

**Prerequisites:** Node.js 20+, a Cloudflare account with [Browser Rendering](https://developers.cloudflare.com/browser-rendering/) enabled, and an API token with **Account > Browser Rendering > Edit** permission.

```bash
git clone https://github.com/thomasklemm/cloudflare-browser-rendering-rest-api-playground.git
cd cloudflare-browser-rendering-rest-api-playground
npm install
npm run dev
```

Open http://localhost:5173, click the gear icon, enter your Account ID and API Token, and start testing.

## Deploy

### To Cloudflare Workers

```bash
npx wrangler login
npm run deploy
```

### Via GitHub Actions

Add your `CLOUDFLARE_API_TOKEN` as a repository secret (Settings > Secrets > Actions). Every push to `main` deploys automatically via `.github/workflows/deploy.yml`.

## Rate Limits

Each API request spins up a new browser instance. Rate limits use a fixed per-second fill rate — requests must be spread evenly.

| | Free Plan | Paid Plan |
| --- | --- | --- |
| REST API requests | **6**/min (1 every 10s) | **600**/min (10/sec) |
| Concurrent browsers | 3 | 30 |
| Browser time | 10 min/day | Unlimited |
| `/crawl` jobs | 5/day, 100 pages/crawl | Account limits apply |

Select your plan in settings — the playground adjusts request spacing automatically and validates free-plan crawl caps.

## Development

```bash
npm run dev          # Vite dev server at localhost:5173
npm run build        # Type-check + production build
npm run lint         # ESLint
npm run deploy       # Build and deploy to Workers
```

### Architecture

The app has two UI paths:

- Single-request endpoints stay data-driven through `src/config/endpoints.ts`, `src/lib/buildRequest.ts`, and `src/hooks/useBatchApiRequest.ts`.
- `/crawl` is a dedicated async workflow with its own request builders, hook, and inspector UI because the API is job-based (`POST` create, `GET` poll/results, `DELETE` cancel).

```
src/
├── config/endpoints.ts    # Endpoint tab definitions
├── config/crawl.ts        # Crawl-specific defaults and labels
├── components/
│   ├── crawl/             # Crawl form + inspector-first async workspace
│   ├── forms/             # Shared field primitives
│   ├── viewers/           # Response viewers (HTML, Image, PDF, JSON, Markdown)
│   ├── EndpointForm.tsx   # Dynamic form from endpoint config
│   ├── CurlPreview.tsx    # Live curl command
│   └── ResponsePanel.tsx  # Tabbed response display
├── hooks/
│   ├── useBatchApiRequest.ts  # Parallel multi-URL fetching
│   └── useCrawlJob.ts         # Async crawl job lifecycle
├── lib/
│   ├── buildRequest.ts    # Single-request request building + cookie dismissal
│   ├── crawl.ts           # Crawl request/response normalization + export helpers
│   └── rateLimits.ts      # Shared plan-aware rate limiting
└── types/
    ├── api.ts
    └── crawl.ts
```

### Tech Stack

React 19 + TypeScript 5.9, Vite 7, Tailwind CSS v4 (custom dark theme), deployed on Cloudflare Workers with GitHub Actions CI/CD.

## Contributing

1. Fork and clone
2. Create a branch (`git checkout -b feature/your-idea`)
3. Make changes, run `npm run lint`, test with `npm run dev`
4. Open a PR

## License

[MIT](LICENSE)

---

<p align="center">
  Built by developers who love Cloudflare's Browser Rendering API.<br/>
  <a href="https://developers.cloudflare.com/browser-rendering/">Cloudflare Docs</a> &nbsp;&middot;&nbsp;
  <a href="https://developers.cloudflare.com/browser-rendering/rest-api/">REST API Reference</a> &nbsp;&middot;&nbsp;
  <a href="https://developers.cloudflare.com/browser-rendering/limits/">Rate Limits</a>
</p>
