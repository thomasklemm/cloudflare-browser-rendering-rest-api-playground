# Cloudflare Browser Rendering REST API Reference

> Source: https://developers.cloudflare.com/browser-rendering/rest-api/
> Fetched: 2026-02-14

## Overview

The Cloudflare Browser Rendering REST API provides a RESTful interface for common browser actions such as capturing screenshots, extracting HTML content, generating PDFs, and more.

**Base URL:** `https://api.cloudflare.com/client/v4/accounts/{accountId}/browser-rendering`

**Authentication:** Bearer token via `Authorization: Bearer <apiToken>` header. Requires a custom API token with the `Browser Rendering - Edit` permission.

**Monitoring:** The `X-Browser-Ms-Used` response header indicates milliseconds of browser time consumed per request.

**Request body size limit:** 50 MB (applies to all endpoints).

**Note:** The `userAgent` parameter does not bypass bot protection. Requests from Browser Rendering will always be identified as a bot.

---

## Shared Parameters (Common to All Endpoints)

All endpoints accept `POST` requests with a JSON body. The following parameters are shared across all (or most) endpoints:

### Primary Input (one required)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Conditional | Target webpage URL to render. Either `url` or `html` must be provided. |
| `html` | string | Conditional | Raw HTML content to render directly. Either `url` or `html` must be provided. |

### Page Loading & Navigation

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `gotoOptions` | object | No | - | Page load behavior settings. See nested params below. |
| `gotoOptions.waitUntil` | string | No | `"load"` | When to consider navigation complete. Values: `"load"`, `"domcontentloaded"`, `"networkidle0"` (no connections for 500ms), `"networkidle2"` (<=2 connections for 500ms). |
| `gotoOptions.timeout` | number | No | 30000 | Maximum wait time in milliseconds for page navigation. |
| `waitForSelector` | string/object | No | - | CSS selector to wait for before completing the operation. Can be a string or object with `selector` and `options` properties. |

### Viewport

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `viewport` | object | No | - | Browser viewport dimensions. |
| `viewport.width` | number | No | 1920 | Viewport width in pixels. |
| `viewport.height` | number | No | 1080 | Viewport height in pixels. |
| `viewport.deviceScaleFactor` | number | No | 1 | Device scale factor (DPR) for high-resolution rendering. |

### Authentication & Cookies

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `authenticate` | object | No | HTTP Basic Authentication credentials. |
| `authenticate.username` | string | No | HTTP auth username. |
| `authenticate.password` | string | No | HTTP auth password. |
| `cookies` | array | No | Cookies to set before page load. |
| `cookies[].name` | string | Yes | Cookie name. |
| `cookies[].value` | string | Yes | Cookie value. |
| `cookies[].domain` | string | No | Cookie domain. |
| `cookies[].path` | string | No | Cookie path. |
| `cookies[].secure` | boolean | No | Whether cookie requires HTTPS. |
| `cookies[].httpOnly` | boolean | No | Whether cookie is HTTP-only. |
| `cookies[].sameSite` | string | No | SameSite attribute: `"Strict"`, `"Lax"`, `"None"`. |
| `cookies[].expires` | number | No | Cookie expiration as Unix timestamp. |

### Request Headers & User Agent

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userAgent` | string | No | Custom user agent string. Does NOT bypass bot protection. |
| `setExtraHTTPHeaders` | object | No | Additional HTTP headers as key-value pairs to send with every request. |

### Request Filtering

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `rejectRequestPattern` | string[] | No | Array of regex patterns; matching requests are blocked. |
| `allowRequestPattern` | string[] | No | Array of regex patterns; only matching requests are allowed. |
| `rejectResourceTypes` | string[] | No | Block specific resource types (e.g., `"image"`, `"stylesheet"`, `"font"`, `"script"`). |
| `allowResourceTypes` | string[] | No | Only allow specified resource types. |

### Script & Style Injection

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `addScriptTag` | array | No | Array of scripts to inject into the page. |
| `addScriptTag[].content` | string | No | Inline JavaScript code to inject. |
| `addScriptTag[].url` | string | No | URL of an external script to load. |
| `addScriptTag[].path` | string | No | Path to a local script file. |
| `addStyleTag` | array | No | Array of styles to inject into the page. |
| `addStyleTag[].content` | string | No | Inline CSS to inject. |
| `addStyleTag[].url` | string | No | URL of an external stylesheet to load. |

### Other

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `setJavaScriptEnabled` | boolean | No | true | Enable or disable JavaScript execution on the page. |

---

## 1. Content Endpoint (`/content`)

**POST** `https://api.cloudflare.com/client/v4/accounts/{accountId}/browser-rendering/content`

Returns the fully rendered HTML content of a page after JavaScript execution.

**Docs:** https://developers.cloudflare.com/browser-rendering/rest-api/content-endpoint/

### Endpoint-Specific Parameters

This endpoint uses only the shared parameters listed above. No additional endpoint-specific parameters.

### Response

Returns the rendered HTML as a plain text/HTML string (not wrapped in JSON).

**Content-Type:** `text/html`

### Example Request

```json
{
  "url": "https://example.com",
  "gotoOptions": {
    "waitUntil": "networkidle0"
  }
}
```

### Example Response

```html
<!DOCTYPE html><html><head>...</head><body>...</body></html>
```

---

## 2. Screenshot Endpoint (`/screenshot`)

**POST** `https://api.cloudflare.com/client/v4/accounts/{accountId}/browser-rendering/screenshot`

Captures a screenshot of a rendered page. Returns binary image data.

**Docs:** https://developers.cloudflare.com/browser-rendering/rest-api/screenshot-endpoint/

### Endpoint-Specific Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `selector` | string | No | - | CSS selector for capturing a specific element instead of the full page/viewport. |
| `screenshotOptions` | object | No | - | Screenshot capture configuration. |
| `screenshotOptions.type` | string | No | `"png"` | Output format: `"png"`, `"jpeg"`, or `"webp"`. |
| `screenshotOptions.quality` | number | No | - | Image quality (1-100). Only for `jpeg` and `webp` formats. Incompatible with `png`. |
| `screenshotOptions.fullPage` | boolean | No | false | Capture the entire scrollable page instead of just the viewport. |
| `screenshotOptions.omitBackground` | boolean | No | false | Hide default white background for transparency (PNG/WebP only). |
| `screenshotOptions.clip` | object | No | - | Capture a specific rectangular region. |
| `screenshotOptions.clip.x` | number | No | - | X coordinate of the clip region. |
| `screenshotOptions.clip.y` | number | No | - | Y coordinate of the clip region. |
| `screenshotOptions.clip.width` | number | No | - | Width of the clip region. |
| `screenshotOptions.clip.height` | number | No | - | Height of the clip region. |
| `screenshotOptions.captureBeyondViewport` | boolean | No | - | Capture content beyond the viewport boundaries. |
| `screenshotOptions.encoding` | string | No | `"binary"` | Output encoding: `"binary"` or `"base64"`. |

### Response

Returns binary image data (PNG, JPEG, or WebP).

**Content-Type:** `image/png`, `image/jpeg`, or `image/webp` depending on `screenshotOptions.type`.

### Example Request

```json
{
  "url": "https://cloudflare.com/",
  "screenshotOptions": {
    "type": "png",
    "fullPage": true,
    "omitBackground": false
  },
  "viewport": {
    "width": 1280,
    "height": 720
  },
  "gotoOptions": {
    "waitUntil": "networkidle0",
    "timeout": 45000
  }
}
```

### Example with Element Selector

```json
{
  "url": "https://example.com",
  "selector": "#main-content"
}
```

### Example with Clip Region

```json
{
  "url": "https://example.com",
  "screenshotOptions": {
    "clip": {
      "x": 0,
      "y": 0,
      "width": 800,
      "height": 600
    }
  }
}
```

---

## 3. PDF Endpoint (`/pdf`)

**POST** `https://api.cloudflare.com/client/v4/accounts/{accountId}/browser-rendering/pdf`

Generates a PDF document from a rendered page. Returns binary PDF data.

**Docs:** https://developers.cloudflare.com/browser-rendering/rest-api/pdf-endpoint/

### Endpoint-Specific Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `pdfOptions` | object | No | - | PDF generation configuration. |
| `pdfOptions.format` | string | No | `"Letter"` | Paper size. Values: `"Letter"`, `"Legal"`, `"Tabloid"`, `"Ledger"`, `"A0"`, `"A1"`, `"A2"`, `"A3"`, `"A4"`, `"A5"`, `"A6"`. |
| `pdfOptions.landscape` | boolean | No | false | Page orientation. `true` for landscape, `false` for portrait. |
| `pdfOptions.printBackground` | boolean | No | false | Include background colors and images in the PDF. |
| `pdfOptions.preferCSSPageSize` | boolean | No | false | Use CSS-defined page size instead of `format`. |
| `pdfOptions.displayHeaderFooter` | boolean | No | false | Show header and footer on each page. |
| `pdfOptions.scale` | number | No | 1 | Scale/zoom level for rendering. Range: 0.1 to 2. |
| `pdfOptions.width` | string/number | No | - | Paper width (overrides `format`). Accepts numbers (pixels) or strings with units (e.g., `"8.5in"`, `"21cm"`). |
| `pdfOptions.height` | string/number | No | - | Paper height (overrides `format`). Same unit rules as `width`. |
| `pdfOptions.headerTemplate` | string | No | - | HTML template for the page header. Supports special CSS classes for dynamic values. |
| `pdfOptions.footerTemplate` | string | No | - | HTML template for the page footer. Supports special CSS classes for dynamic values. |
| `pdfOptions.margin` | object | No | - | Page margins. |
| `pdfOptions.margin.top` | string/number | No | - | Top margin (e.g., `"1cm"`, `"0.5in"`, `20`). |
| `pdfOptions.margin.bottom` | string/number | No | - | Bottom margin. |
| `pdfOptions.margin.left` | string/number | No | - | Left margin. |
| `pdfOptions.margin.right` | string/number | No | - | Right margin. |
| `pdfOptions.pageRanges` | string | No | - | Page ranges to print (e.g., `"1-5"`, `"1,3,5-7"`). Empty string means all pages. |
| `pdfOptions.timeout` | number | No | 30000 | PDF rendering timeout in milliseconds. |
| `pdfOptions.omitBackground` | boolean | No | false | Hide default white background for transparency. |
| `pdfOptions.tagged` | boolean | No | false | Generate a tagged (accessible) PDF. |
| `pdfOptions.outline` | boolean | No | false | Generate a document outline (bookmarks). |

### Header/Footer Template Placeholders

When `displayHeaderFooter` is `true`, these CSS classes can be used in `headerTemplate` and `footerTemplate`:

| Class | Description |
|-------|-------------|
| `<span class="pageNumber"></span>` | Current page number |
| `<span class="totalPages"></span>` | Total number of pages |
| `<span class="title"></span>` | Document title |
| `<span class="date"></span>` | Current date |
| `<span class="url"></span>` | Document URL |

### Response

Returns binary PDF data.

**Content-Type:** `application/pdf`

### Example Request

```json
{
  "url": "https://example.com",
  "pdfOptions": {
    "format": "A4",
    "printBackground": true,
    "landscape": false,
    "margin": {
      "top": "1cm",
      "bottom": "1cm",
      "left": "1cm",
      "right": "1cm"
    }
  }
}
```

### Example with Header/Footer

```json
{
  "url": "https://example.com",
  "pdfOptions": {
    "format": "A4",
    "displayHeaderFooter": true,
    "headerTemplate": "<div style='font-size:10px; text-align:center; width:100%;'><span class='title'></span></div>",
    "footerTemplate": "<div style='font-size:10px; text-align:center; width:100%;'>Page <span class='pageNumber'></span> of <span class='totalPages'></span></div>",
    "margin": {
      "top": "2cm",
      "bottom": "2cm"
    }
  }
}
```

---

## 4. JSON Endpoint (`/json`)

**POST** `https://api.cloudflare.com/client/v4/accounts/{accountId}/browser-rendering/json`

Extracts structured JSON data from a page using AI. Requires Workers AI (incurs additional charges).

**Docs:** https://developers.cloudflare.com/browser-rendering/rest-api/json-endpoint/

### Endpoint-Specific Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | Conditional | - | Instructions guiding the AI extraction process. At least one of `prompt` or `response_format` is required. |
| `response_format` | object | Conditional | - | Defines the expected output structure via JSON Schema. At least one of `prompt` or `response_format` is required. **Note:** Do NOT use `response_format` with Anthropic/Claude models. |
| `response_format.type` | string | Yes | - | Must be `"json_schema"`. |
| `response_format.schema` | object | Yes | - | JSON Schema definition for the response structure. |
| `response_format.schema.type` | string | Yes | - | Schema type (typically `"object"`). |
| `response_format.schema.properties` | object | Yes | - | Schema property definitions. |
| `response_format.schema.required` | string[] | No | - | Required property names. |
| `custom_ai` | array | No | - | Specify custom AI models with fallback support. |
| `custom_ai[].model` | string | Yes | - | Model identifier in format `<provider>/<model_name>`. |
| `custom_ai[].authorization` | string | Yes | - | Bearer token for the model provider. |

### Response

```json
{
  "success": true,
  "result": {
    // Structured data matching the prompt/schema
  }
}
```

**Content-Type:** `application/json`

### Example Request with Prompt

```json
{
  "url": "https://example.com",
  "prompt": "Extract the main heading and all navigation links from this page"
}
```

### Example Request with Schema

```json
{
  "url": "https://example.com",
  "prompt": "Extract product information",
  "response_format": {
    "type": "json_schema",
    "schema": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "price": { "type": "number" },
        "description": { "type": "string" }
      },
      "required": ["title", "price"]
    }
  }
}
```

### Example with Custom AI Model

```json
{
  "url": "https://example.com",
  "prompt": "Extract all product names and prices",
  "custom_ai": [
    {
      "model": "openai/gpt-4",
      "authorization": "Bearer sk-..."
    }
  ]
}
```

---

## 5. Markdown Endpoint (`/markdown`)

**POST** `https://api.cloudflare.com/client/v4/accounts/{accountId}/browser-rendering/markdown`

Converts rendered page content to Markdown format.

**Docs:** https://developers.cloudflare.com/browser-rendering/rest-api/markdown-endpoint/

### Endpoint-Specific Parameters

This endpoint uses only the shared parameters listed above. No additional endpoint-specific parameters.

### Response

```json
{
  "success": true,
  "result": "# Page Title\n\nPage content in markdown format..."
}
```

**Content-Type:** `application/json`

### Example Request

```json
{
  "url": "https://example.com"
}
```

### Example with Request Filtering

```json
{
  "url": "https://example.com",
  "rejectRequestPattern": ["/^.*\\.(css)/"]
}
```

---

## 6. Snapshot Endpoint (`/snapshot`)

**POST** `https://api.cloudflare.com/client/v4/accounts/{accountId}/browser-rendering/snapshot`

Captures both the rendered HTML content and a base64-encoded screenshot in a single request.

**Docs:** https://developers.cloudflare.com/browser-rendering/rest-api/snapshot/

### Endpoint-Specific Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `screenshotOptions` | object | No | - | Screenshot configuration (subset of screenshot endpoint options). |
| `screenshotOptions.fullPage` | boolean | No | false | Capture entire scrollable page. |

### Response

```json
{
  "success": true,
  "result": {
    "screenshot": "iVBORw0KGgo...",
    "content": "<!DOCTYPE html><html>...</html>"
  }
}
```

- `result.screenshot` - Base64-encoded PNG screenshot
- `result.content` - Fully rendered HTML content

**Content-Type:** `application/json`

### Example Request

```json
{
  "url": "https://example.com/",
  "screenshotOptions": {
    "fullPage": true
  },
  "viewport": {
    "width": 1280,
    "height": 720,
    "deviceScaleFactor": 2
  },
  "gotoOptions": {
    "waitUntil": "networkidle0"
  }
}
```

### Example with Script Injection

```json
{
  "url": "https://example.com/",
  "addScriptTag": [
    { "content": "document.body.innerHTML = 'Modified Page';" }
  ]
}
```

---

## 7. Scrape Endpoint (`/scrape`)

**POST** `https://api.cloudflare.com/client/v4/accounts/{accountId}/browser-rendering/scrape`

Extracts structured data from specific HTML elements using CSS selectors.

**Docs:** https://developers.cloudflare.com/browser-rendering/rest-api/scrape-endpoint/

### Endpoint-Specific Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `elements` | array | Yes | Array of element selector configurations. |
| `elements[].selector` | string | Yes | CSS selector to target elements (e.g., `"h1"`, `".product-card"`, `"#main a"`). |

### Response

```json
{
  "success": true,
  "result": [
    {
      "selector": "h1",
      "results": [
        {
          "text": "Page Heading",
          "html": "<h1>Page Heading</h1>",
          "attributes": [
            { "name": "class", "value": "title" }
          ],
          "width": 800,
          "height": 40,
          "top": 100,
          "left": 50
        }
      ]
    }
  ]
}
```

Each matched element returns:
- `text` (string) - Text content of the element
- `html` (string) - Outer HTML of the element
- `attributes` (array) - Array of `{name, value}` attribute objects
- `width` (number) - Element width in pixels
- `height` (number) - Element height in pixels
- `top` (number) - Top position in pixels
- `left` (number) - Left position in pixels

**Content-Type:** `application/json`

### Example Request

```json
{
  "url": "https://example.com",
  "elements": [
    { "selector": "h1" },
    { "selector": "a" },
    { "selector": "meta[name='description']" }
  ]
}
```

---

## 8. Links Endpoint (`/links`)

**POST** `https://api.cloudflare.com/client/v4/accounts/{accountId}/browser-rendering/links`

Extracts all hyperlinks from a rendered page.

**Docs:** https://developers.cloudflare.com/browser-rendering/rest-api/links-endpoint/

### Endpoint-Specific Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `visibleLinksOnly` | boolean | No | false | Return only user-visible links (excludes hidden elements). |
| `excludeExternalLinks` | boolean | No | false | Exclude links pointing to external domains. |

### Response

```json
{
  "success": true,
  "result": [
    "https://example.com/page1",
    "https://example.com/page2",
    "https://example.com/about"
  ]
}
```

**Content-Type:** `application/json`

### Example Request

```json
{
  "url": "https://developers.cloudflare.com/",
  "visibleLinksOnly": true,
  "excludeExternalLinks": true
}
```

### Example with Full Options

```json
{
  "url": "https://example.com",
  "visibleLinksOnly": true,
  "excludeExternalLinks": false,
  "gotoOptions": {
    "waitUntil": "networkidle0"
  }
}
```

---

## Coverage: App vs. API

All documented API parameters are implemented in the app's endpoint configuration (`src/config/endpoints.ts`).

Every endpoint includes the full set of shared parameters (viewport, authentication, cookies, headers, request filtering, script/style injection, JavaScript toggle) plus all endpoint-specific parameters.

The only parameter not exposed as a form field is `screenshotOptions.encoding` (binary vs base64) — the app always uses binary encoding and renders images directly via blob URLs.
