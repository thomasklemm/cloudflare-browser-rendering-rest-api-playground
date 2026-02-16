# Cloudflare Browser Rendering REST API Playground

An interactive web playground for exploring all 8 [Cloudflare Browser Rendering REST API](https://developers.cloudflare.com/browser-rendering/rest-api/) endpoints. Built by fans of Cloudflare's Browser Rendering API to make it easier for developers to test, learn, and build with this powerful tool.

> **Note:** This is an independent, community-driven project and is not officially affiliated with, maintained by, or endorsed by Cloudflare, Inc. We're just enthusiastic users who wanted to make the Browser Rendering API more accessible to the developer community.

**[Live Demo](https://cloudflare-browser-rendering-playground.tjk-ventures-o.workers.dev)** — try it in your browser (bring your own Cloudflare API credentials)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.2-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1-38bdf8.svg)

## What is Cloudflare Browser Rendering?

Cloudflare Browser Rendering is a powerful API that lets you control headless Chrome browsers running on Cloudflare's global network. It enables you to:

- Take screenshots of web pages
- Generate PDFs
- Extract structured data with AI
- Convert pages to Markdown
- Scrape content with CSS selectors
- Extract links
- And more

This playground provides an intuitive interface to explore all these capabilities without writing any code. **Unique to this playground**: test multiple URLs simultaneously with parallel batch processing — a feature not available in the raw API that makes it easy to evaluate API behavior across different websites and compare results side-by-side.

## Features

### Core Functionality

- **All 8 API Endpoints** — Complete support for every Browser Rendering endpoint
- **Multi-URL Batch Processing** — Query multiple URLs simultaneously and see all results side-by-side. This playground-exclusive feature (not available in the raw API) makes it easy to evaluate API behavior across different websites, compare response times, and test configurations at scale.
- **URL or HTML Input** — Provide URLs or paste raw HTML for processing
- **Live Curl Preview** — See the exact API call with copy-to-clipboard
- **Keyboard Shortcuts** — Cmd/Ctrl+Enter to send requests
- **Persistent Settings** — Credentials and form values stored locally

### Advanced Capabilities

- **Cookie Banner Dismissal** — Two-layer approach that blocks 18+ CMP providers (OneTrust, Cookiebot, Usercentrics, etc.) by intercepting their scripts and injecting cleanup code
- **Lazy-Load Image Handler** — Automatically scrolls and waits for lazy-loaded images to render
- **Binary Response Handling** — Images and PDFs render inline with download options
- **JSON Schema Support** — Define response schemas for structured data extraction
- **Custom AI Models** — Configure OpenAI, Claude, or custom models for JSON endpoint

### Developer Experience

- **Data-Driven Forms** — Dynamic form generation from endpoint configurations
- **Type-Safe** — Full TypeScript coverage
- **Dark Theme** — Monospace font throughout for a developer-friendly experience
- **Responsive UI** — Works on desktop and tablet devices
- **Real-Time Status** — Visual indicators for request progress (spinner/success/error dots)

## API Endpoints Supported

| Endpoint | Description | Response Type | Use Cases |
| -------- | ----------- | ------------- | --------- |
| `/screenshot` | Capture high-quality screenshots (PNG, JPEG, WebP) | Image | Visual testing, thumbnails, archiving |
| `/pdf` | Generate print-ready PDFs with custom formatting | PDF | Reports, invoices, documentation |
| `/json` | Extract structured JSON using AI | JSON | AI-powered data extraction |
| `/content` | Get fully rendered HTML after JS execution | HTML | Web scraping, monitoring |
| `/markdown` | Convert web pages to clean Markdown | Markdown | LLM processing, documentation |
| `/snapshot` | Get HTML + base64 screenshot in one request | JSON | Combined visual + content capture |
| `/scrape` | Extract specific elements using CSS selectors | JSON | Precise data scraping |
| `/links` | Extract all links from a page | JSON | Sitemaps, crawling, link analysis |

## Quick Start

### Prerequisites

- Node.js 20+
- A Cloudflare account with Browser Rendering enabled
- Cloudflare Account ID and API Token
- Workers Free or Paid plan (see [Rate Limits](#rate-limits) below)

### Getting Your Cloudflare Credentials

1. **Account ID**: Find it in your [Cloudflare Dashboard](https://dash.cloudflare.com/) (right sidebar on any page)
2. **API Token**: Create one at [API Tokens page](https://dash.cloudflare.com/profile/api-tokens)
   - Click "Create Token"
   - Use "Create Custom Token"
   - Add permission: **Account > Browser Rendering > Edit**
   - Optionally restrict to specific account and IP addresses
   - Copy the token (you won't see it again)

### Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/cloudflare-browser-rendering-rest-api-playground.git
cd cloudflare-browser-rendering-rest-api-playground

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

### First Steps

1. Click the settings icon (gear) in the top-right corner
2. Enter your Cloudflare Account ID and API Token
3. Select your Workers plan (Free or Paid) to use appropriate rate limits
4. Click "Save Settings"
5. Select an endpoint (e.g., "Screenshot")
6. Enter one or more URLs (e.g., `https://example.com`) — add multiple URLs (one per line) to test in parallel
7. Click "Send Request" or press Cmd/Ctrl+Enter
8. View the response(s) in the right panel — switch between results using the tabs when testing multiple URLs

## Rate Limits

Cloudflare Browser Rendering enforces different rate limits based on your Workers plan. **Select your plan in the settings** to ensure optimal performance and avoid 429 errors.

### Workers Free Plan

- **6 requests per minute** (1 every 10 seconds)
- **3 concurrent browsers**
- **3 new browsers per minute**
- **10 minutes of browser time per day**

**Batch processing on Free:** For 6 URLs, expect ~50 seconds total (2 concurrent, 10s spacing).

### Workers Paid Plan

- **180 requests per minute** (3 per second)
- **30 concurrent browsers**
- **30 new browsers per minute**
- **Unlimited browser time**

**Batch processing on Paid:** For 6 URLs, expect ~1.8 seconds total (10 concurrent, 350ms spacing).

### Important Notes

- Rate limits use **fixed per-second fill rate**, not burst allowance
- Requests must be spread evenly throughout the minute
- The playground automatically adjusts concurrency and spacing based on your selected plan
- 429 errors trigger exponential backoff retries with server-provided `retry-after` headers

**Learn more:** [Browser Rendering Limits Documentation](https://developers.cloudflare.com/browser-rendering/limits/)

## Deployment

Deploy this playground to Cloudflare Workers to run it on Cloudflare's global network.

### One-Time Setup

```bash
# Authenticate with Cloudflare
npx wrangler login

# Deploy to production
npm run deploy
```

Your playground will be live at `https://cloudflare-browser-rendering-playground.YOUR_SUBDOMAIN.workers.dev`

### Automatic Deployment with GitHub Actions

Every push to the `main` branch automatically deploys to Cloudflare Workers.

**Setup:**

1. Fork this repository
2. Create a Cloudflare API token at https://dash.cloudflare.com/profile/api-tokens
   - Permission: **Account > Cloudflare Workers > Edit**
3. Add it as a GitHub secret:
   - Go to your repo's Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: Your API token
4. Push to `main` — deployment happens automatically

The GitHub Actions workflow is defined in `.github/workflows/deploy.yml`.

## Development

### Project Structure

```text
/
├── src/
│   ├── components/        # React components
│   │   ├── viewers/       # Response viewers (HTML, PDF, Image, JSON, etc.)
│   │   ├── Header.tsx
│   │   ├── SettingsPanel.tsx
│   │   ├── EndpointForm.tsx
│   │   ├── CurlPreview.tsx
│   │   └── ResponsePanel.tsx
│   ├── config/
│   │   └── endpoints.ts   # Endpoint configurations (declarative API)
│   ├── hooks/
│   │   ├── useLocalStorage.ts
│   │   └── useBatchApiRequest.ts
│   ├── lib/
│   │   └── buildRequest.ts  # Request building logic
│   ├── types/
│   │   └── api.ts         # TypeScript types
│   ├── App.tsx            # Main application
│   └── index.css          # Tailwind v4 config
├── worker/
│   └── index.ts           # Cloudflare Workers entry point
├── docs/
│   └── cloudflare-browser-rendering-api.md  # API documentation
├── CLAUDE.md              # AI assistant guidance
└── wrangler.toml          # Cloudflare Workers config
```

### Available Commands

```bash
npm run dev          # Start Vite dev server at http://localhost:5173
npm run build        # Type-check and build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build locally
npm run deploy       # Build and deploy to Cloudflare Workers (production)
npm run deploy:dev   # Build and deploy to development environment
npm run wrangler:dev # Run Cloudflare Workers in local dev mode
```

### Tech Stack

- **Frontend Framework**: React 19.2 with TypeScript 5.9
- **Build Tool**: Vite 7.3
- **Styling**: Tailwind CSS v4 (with custom dark theme tokens)
- **HTTP Client**: Native `fetch` API
- **UI Components**:
  - `lucide-react` — Icons
  - `react-markdown` + `remark-gfm` — Markdown rendering
  - `react-json-view-lite` — JSON tree viewer
  - `jszip` — ZIP archive handling
- **Deployment**: Cloudflare Workers with Workers Sites
- **CI/CD**: GitHub Actions

### Adding a New Endpoint

The playground uses a data-driven architecture. To add a new endpoint:

1. Open `src/config/endpoints.ts`
2. Add a new `EndpointConfig` object to the `endpoints` array
3. Define the endpoint-specific fields
4. The form, curl preview, and response handling automatically update

Example:

```typescript
{
  id: 'new-endpoint',
  label: 'New Endpoint',
  shortDesc: 'Short description',
  method: 'POST',
  path: '/new-endpoint',
  description: 'Full description',
  responseType: 'json', // or 'html', 'image', 'pdf', 'markdown', 'snapshot'
  hasUrlHtmlInput: true,
  fields: [
    {
      name: 'customParam',
      label: 'Custom Parameter',
      type: 'text',
      placeholder: 'Enter value',
      hint: 'Optional hint text',
    },
    ...sharedFields, // Includes common fields like viewport, auth, etc.
  ],
}
```

## Contributing

Contributions are welcome! This is a community project, and we'd love your help making it better.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run linting: `npm run lint`
5. Test locally: `npm run dev`
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Contribution Ideas

- Add support for new Browser Rendering endpoints (as they're released)
- Improve error handling and user feedback
- Add more response viewers
- Enhance the cookie banner dismissal logic
- Improve mobile responsiveness
- Add unit/integration tests
- Improve documentation
- Fix bugs

### Code Style

- Follow the existing TypeScript patterns
- Use functional React components with hooks
- Prefer composition over inheritance
- Keep components focused and single-purpose
- Use Tailwind utility classes (custom theme tokens defined in `src/index.css`)

## Known Limitations

- **CORS in Development**: The Vite dev server proxies `/api/cf` → `https://api.cloudflare.com`. In production (Cloudflare Workers), requests go directly to the API.
- **Binary Response Size**: Large images/PDFs may be slow to load depending on your network.
- **Cookie Banner Coverage**: The dismissal logic covers 18+ CMP providers but may not catch every custom implementation.
- **Browser Compatibility**: Tested in modern browsers (Chrome, Firefox, Safari, Edge). IE is not supported.
- **Rate Limits**: Ensure you've selected the correct Workers plan in settings. Free plan is limited to 6 requests/minute with 10-second spacing between requests.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

You are free to use, modify, and distribute this software. Attribution is appreciated but not required.

## Acknowledgments

- **Cloudflare** — For building the incredible Browser Rendering API
- **The Cloudflare Community** — For inspiration and feedback
- **Open Source Contributors** — For the libraries that made this possible

## Disclaimer

This project is an independent, community-driven effort and is not officially affiliated with, maintained by, or endorsed by Cloudflare, Inc. "Cloudflare" and related trademarks are the property of Cloudflare, Inc.

We are simply enthusiastic fans of Cloudflare's Browser Rendering API who wanted to create a better developer experience for exploring its capabilities.

## Support

If you find this project helpful:

- Star the repository on GitHub
- Share it with other developers
- Contribute improvements
- Report bugs and suggest features via GitHub Issues

For questions about the Cloudflare Browser Rendering API itself, please refer to the [official documentation](https://developers.cloudflare.com/browser-rendering/).

## Related Resources

- [Cloudflare Browser Rendering Documentation](https://developers.cloudflare.com/browser-rendering/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Browser Rendering REST API](https://developers.cloudflare.com/browser-rendering/rest-api/)

---

## Credits

Made with enthusiasm by developers who love Cloudflare's Browser Rendering API
