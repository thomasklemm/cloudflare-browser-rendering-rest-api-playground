# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm run dev      # Start Vite dev server at http://localhost:5173
npm run build    # Type-check (tsc -b) then build for production
npm run lint     # ESLint across all .ts/.tsx files
npm run preview  # Serve production build locally
```

## Architecture

Single-page React app (Vite + TypeScript + Tailwind CSS v4) for interacting with all 8 Cloudflare Browser Rendering REST API endpoints. Dark theme only, monospace font throughout.

### Data-driven endpoint system

Endpoints are defined declaratively in `src/config/endpoints.ts` as `EndpointConfig[]`. Each config specifies the API path, HTTP method, response type, and a `fields` array that drives dynamic form rendering. Adding a new endpoint means adding an entry here — the form, curl preview, and response viewer all derive from it.

Shared field definitions (viewport, auth, headers, request filtering, injection, navigation) are composed into each endpoint config. Endpoint-specific fields come first, shared fields follow.

Types live in `src/types/api.ts` (`EndpointConfig`, `FieldConfig`, `ApiResponse`, `Settings`, `BatchResponseEntry`, `BatchResult`).

### Request pipeline

`src/lib/buildRequest.ts` contains three key functions:
- `buildBody()` — converts flat form values into the nested JSON body the CF API expects (handles dot-notation field names like `screenshotOptions.type` via `setNested()`). Injects cookie-dismissal scripts and lazy-load-images scripts when toggled, merging with any user-provided `addScriptTag`/`rejectRequestPattern` values.
- `buildFetchOptions()` — builds the proxied fetch URL (`/api/cf/...`) with auth headers.
- `buildCurlCommand()` — generates the equivalent curl command with the real Cloudflare URL (not the proxied one).

### Multi-URL batch requests

`src/hooks/useBatchApiRequest.ts` handles parallel fetching for multiple URLs:
- Takes an array of URLs, fires all requests simultaneously
- Results stream in — UI updates as each response completes
- Per-response blob URL management with cleanup
- AbortController support for canceling in-flight requests
- HTML mode uses `'__html__'` sentinel instead of a real URL

### CORS proxy

Vite dev server proxies `/api/cf` → `https://api.cloudflare.com` (configured in `vite.config.ts`). The curl preview shows the real Cloudflare URL, but actual requests go through the proxy.

### Response rendering

`ResponsePanel` provides tabbed responses when multiple URLs are submitted:
- URL tabs with status indicators (spinner/green dot/red dot)
- Status bar showing HTTP status, duration, content-type
- Dispatches to type-specific viewers in `src/components/viewers/`:
  - `HtmlViewer` — sandboxed iframe + source toggle
  - `ImageViewer` — inline image via blob URL + download
  - `PdfViewer` — embedded PDF viewer + download
  - `JsonViewer` — collapsible tree (react-json-view-lite)
  - `MarkdownViewer` — rendered markdown (react-markdown + remark-gfm) + raw toggle
  - `SnapshotViewer` (inline in ResponsePanel) — combined base64 image + HTML

Binary responses (images, PDFs) use blob URLs managed by `useBatchApiRequest` hook with proper cleanup via `URL.revokeObjectURL`.

### State management

All state is in `App.tsx` using React hooks. Four `useLocalStorage` instances persist:
- `cf-br-settings` — credentials (accountId, apiToken)
- `cf-br-form-values` — per-endpoint form field values
- `cf-br-urls` — shared URL input (persists across endpoint tabs)
- `cf-br-input-mode` — URL vs HTML mode

### Cookie banner dismissal

Two-layer approach in `buildRequest.ts`:
1. `rejectRequestPattern` — regex array blocking 18+ CMP provider script URLs
2. `addScriptTag` — injected JS that clicks reject/accept buttons across known CMPs, falling back to generic selectors and text-based scanning, and finally DOM removal

### API reference

Full API documentation is in `docs/cloudflare-browser-rendering-api.md` with all parameters for all 8 endpoints.

### Custom color tokens

Tailwind v4 theme tokens defined in `src/index.css` under `@theme`: `surface-50` through `surface-900` (dark grays) and `accent-400/500/600` (Cloudflare orange). Use these instead of default Tailwind colors.
