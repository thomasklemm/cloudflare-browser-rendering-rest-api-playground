import type { EndpointConfig, FieldConfig } from '../types/api'

// --- Shared field definitions ---

const waitForSelectorField: FieldConfig = {
  name: 'waitForSelector',
  label: 'Wait for Selector',
  type: 'text',
  placeholder: '#content',
  section: 'Navigation',
  hint: 'CSS selector to wait for before completing',
}

const rewriteUrlField: FieldConfig = {
  name: 'rewriteUrl',
  label: 'Rewrite URL',
  type: 'text',
  placeholder: 'https://example.com/rewritten',
  section: 'Navigation',
}

const gotoOptionsFields: FieldConfig[] = [
  {
    name: 'gotoOptions.waitUntil',
    label: 'Wait Until',
    type: 'select',
    options: [
      { label: 'load', value: 'load' },
      { label: 'domcontentloaded', value: 'domcontentloaded' },
      { label: 'networkidle0', value: 'networkidle0' },
      { label: 'networkidle2', value: 'networkidle2' },
    ],
    section: 'Navigation',
    hint: 'When to consider navigation complete',
  },
  {
    name: 'gotoOptions.timeout',
    label: 'Goto Timeout (ms)',
    type: 'number',
    placeholder: '30000',
    section: 'Navigation',
  },
]

const viewportFields: FieldConfig[] = [
  {
    name: 'viewport.width',
    label: 'Width',
    type: 'number',
    placeholder: '1280',
    section: 'Viewport',
  },
  {
    name: 'viewport.height',
    label: 'Height',
    type: 'number',
    placeholder: '720',
    section: 'Viewport',
  },
  {
    name: 'viewport.deviceScaleFactor',
    label: 'Device Scale Factor',
    type: 'number',
    placeholder: '1',
    section: 'Viewport',
    hint: 'Device pixel ratio (e.g. 2 for Retina)',
  },
]

const authFields: FieldConfig[] = [
  {
    name: 'authenticate.username',
    label: 'Username',
    type: 'text',
    placeholder: 'user',
    section: 'Authentication',
  },
  {
    name: 'authenticate.password',
    label: 'Password',
    type: 'text',
    placeholder: 'pass',
    section: 'Authentication',
  },
  {
    name: 'cookies',
    label: 'Cookies',
    type: 'json',
    placeholder: '[{"name": "session", "value": "abc", "domain": ".example.com"}]',
    section: 'Authentication',
    hint: 'Array of cookie objects (name, value, domain, path, secure, httpOnly, sameSite, expires)',
  },
]

const headersFields: FieldConfig[] = [
  {
    name: 'userAgent',
    label: 'User Agent',
    type: 'text',
    placeholder: 'Mozilla/5.0 ...',
    section: 'Headers',
    hint: 'Does not bypass bot protection',
  },
  {
    name: 'setExtraHTTPHeaders',
    label: 'Extra HTTP Headers',
    type: 'json',
    placeholder: '{"Accept-Language": "en-US"}',
    section: 'Headers',
    hint: 'Key-value pairs sent with every request',
  },
]

const requestFilteringFields: FieldConfig[] = [
  {
    name: 'rejectResourceTypes',
    label: 'Block Resource Types',
    type: 'json',
    placeholder: '["image", "stylesheet", "font"]',
    section: 'Request Filtering',
    hint: 'Resource types to block (image, stylesheet, font, script, etc.)',
  },
  {
    name: 'allowResourceTypes',
    label: 'Allow Resource Types',
    type: 'json',
    placeholder: '["document", "script"]',
    section: 'Request Filtering',
    hint: 'Only allow these resource types',
  },
  {
    name: 'rejectRequestPattern',
    label: 'Block URL Patterns',
    type: 'json',
    placeholder: '["ads\\\\.example\\\\.com", "tracking"]',
    section: 'Request Filtering',
    hint: 'Regex patterns — matching request URLs are blocked',
  },
  {
    name: 'allowRequestPattern',
    label: 'Allow URL Patterns',
    type: 'json',
    placeholder: '["example\\\\.com"]',
    section: 'Request Filtering',
    hint: 'Regex patterns — only matching request URLs are allowed',
  },
]

const injectionFields: FieldConfig[] = [
  {
    name: 'addScriptTag',
    label: 'Inject Scripts',
    type: 'json',
    placeholder: '[{"content": "console.log(1)"}]',
    section: 'Injection',
    hint: 'Array of scripts ({content, url, or path})',
  },
  {
    name: 'addStyleTag',
    label: 'Inject Styles',
    type: 'json',
    placeholder: '[{"content": "body { background: red }"}]',
    section: 'Injection',
    hint: 'Array of styles ({content or url})',
  },
]

const jsEnabledField: FieldConfig = {
  name: 'setJavaScriptEnabled',
  label: 'JavaScript Enabled',
  type: 'boolean',
  defaultValue: true,
  section: 'Navigation',
}

// Shared "advanced" fields included on every endpoint
const sharedFields: FieldConfig[] = [
  ...gotoOptionsFields,
  waitForSelectorField,
  rewriteUrlField,
  jsEnabledField,
  ...viewportFields,
  ...authFields,
  ...headersFields,
  ...requestFilteringFields,
  ...injectionFields,
]

export const endpoints: EndpointConfig[] = [
  // Reordered by importance and logical use case flow
  {
    id: 'screenshot',
    label: 'Screenshot',
    shortDesc: 'Visual capture',
    method: 'POST',
    path: '/screenshot',
    description: 'Capture high-quality screenshots (PNG, JPEG, WebP) - full page or specific elements',
    responseType: 'image',
    contentType: 'image/png',
    hasUrlHtmlInput: true,
    fields: [
      // Endpoint-specific
      {
        name: 'screenshotOptions.type',
        label: 'Image Type',
        type: 'select',
        options: [
          { label: 'png', value: 'png' },
          { label: 'jpeg', value: 'jpeg' },
          { label: 'webp', value: 'webp' },
        ],
        section: 'Screenshot',
      },
      {
        name: 'screenshotOptions.fullPage',
        label: 'Full Page',
        type: 'boolean',
        defaultValue: false,
        section: 'Screenshot',
      },
      {
        name: 'screenshotOptions.quality',
        label: 'Quality (1-100)',
        type: 'number',
        placeholder: '80',
        section: 'Screenshot',
        hint: 'Only for jpeg/webp',
      },
      {
        name: 'screenshotOptions.omitBackground',
        label: 'Omit Background',
        type: 'boolean',
        defaultValue: false,
        section: 'Screenshot',
        hint: 'Transparent background (PNG/WebP only)',
      },
      {
        name: 'screenshotOptions.captureBeyondViewport',
        label: 'Capture Beyond Viewport',
        type: 'boolean',
        defaultValue: false,
        section: 'Screenshot',
      },
      {
        name: 'selector',
        label: 'Element Selector',
        type: 'text',
        placeholder: '#main-content',
        section: 'Screenshot',
        hint: 'Screenshot a specific element instead of the page',
      },
      {
        name: 'screenshotOptions.clip.x',
        label: 'Clip X',
        type: 'number',
        placeholder: '0',
        section: 'Clip Region',
      },
      {
        name: 'screenshotOptions.clip.y',
        label: 'Clip Y',
        type: 'number',
        placeholder: '0',
        section: 'Clip Region',
      },
      {
        name: 'screenshotOptions.clip.width',
        label: 'Clip Width',
        type: 'number',
        placeholder: '800',
        section: 'Clip Region',
      },
      {
        name: 'screenshotOptions.clip.height',
        label: 'Clip Height',
        type: 'number',
        placeholder: '600',
        section: 'Clip Region',
      },
      // Shared
      ...sharedFields,
    ],
  },
  {
    id: 'pdf',
    label: 'PDF',
    shortDesc: 'Document export',
    method: 'POST',
    path: '/pdf',
    description: 'Generate print-ready PDFs with custom page sizes, margins, and headers/footers',
    responseType: 'pdf',
    contentType: 'application/pdf',
    hasUrlHtmlInput: true,
    fields: [
      // Endpoint-specific
      {
        name: 'pdfOptions.format',
        label: 'Page Format',
        type: 'select',
        options: [
          { label: 'Letter', value: 'letter' },
          { label: 'Legal', value: 'legal' },
          { label: 'Tabloid', value: 'tabloid' },
          { label: 'Ledger', value: 'ledger' },
          { label: 'A0', value: 'a0' },
          { label: 'A1', value: 'a1' },
          { label: 'A2', value: 'a2' },
          { label: 'A3', value: 'a3' },
          { label: 'A4', value: 'a4' },
          { label: 'A5', value: 'a5' },
          { label: 'A6', value: 'a6' },
        ],
        section: 'PDF Options',
      },
      {
        name: 'pdfOptions.printBackground',
        label: 'Print Background',
        type: 'boolean',
        defaultValue: true,
        section: 'PDF Options',
      },
      {
        name: 'pdfOptions.landscape',
        label: 'Landscape',
        type: 'boolean',
        defaultValue: false,
        section: 'PDF Options',
      },
      {
        name: 'pdfOptions.scale',
        label: 'Scale',
        type: 'number',
        placeholder: '1',
        section: 'PDF Options',
        hint: 'Zoom level (0.1 to 2)',
      },
      {
        name: 'pdfOptions.preferCSSPageSize',
        label: 'Prefer CSS Page Size',
        type: 'boolean',
        defaultValue: false,
        section: 'PDF Options',
        hint: 'Use CSS-defined page size instead of format',
      },
      {
        name: 'pdfOptions.omitBackground',
        label: 'Omit Background',
        type: 'boolean',
        defaultValue: false,
        section: 'PDF Options',
      },
      {
        name: 'pdfOptions.tagged',
        label: 'Tagged (Accessible)',
        type: 'boolean',
        defaultValue: false,
        section: 'PDF Options',
      },
      {
        name: 'pdfOptions.outline',
        label: 'Generate Outline',
        type: 'boolean',
        defaultValue: false,
        section: 'PDF Options',
        hint: 'Add bookmarks to the PDF',
      },
      {
        name: 'pdfOptions.pageRanges',
        label: 'Page Ranges',
        type: 'text',
        placeholder: '1-5, 8',
        section: 'PDF Options',
        hint: 'e.g. "1-5", "1,3,5-7". Empty = all pages',
      },
      {
        name: 'pdfOptions.width',
        label: 'Custom Width',
        type: 'text',
        placeholder: '8.5in',
        section: 'PDF Page Size',
        hint: 'Overrides format. Use units: px, in, cm, mm',
      },
      {
        name: 'pdfOptions.height',
        label: 'Custom Height',
        type: 'text',
        placeholder: '11in',
        section: 'PDF Page Size',
      },
      {
        name: 'pdfOptions.margin.top',
        label: 'Top',
        type: 'text',
        placeholder: '1cm',
        section: 'PDF Margins',
      },
      {
        name: 'pdfOptions.margin.bottom',
        label: 'Bottom',
        type: 'text',
        placeholder: '1cm',
        section: 'PDF Margins',
      },
      {
        name: 'pdfOptions.margin.left',
        label: 'Left',
        type: 'text',
        placeholder: '1cm',
        section: 'PDF Margins',
      },
      {
        name: 'pdfOptions.margin.right',
        label: 'Right',
        type: 'text',
        placeholder: '1cm',
        section: 'PDF Margins',
      },
      {
        name: 'pdfOptions.displayHeaderFooter',
        label: 'Show Header/Footer',
        type: 'boolean',
        defaultValue: false,
        section: 'PDF Header/Footer',
      },
      {
        name: 'pdfOptions.headerTemplate',
        label: 'Header Template',
        type: 'textarea',
        placeholder: '<div style="font-size:10px; text-align:center; width:100%;"><span class="title"></span></div>',
        section: 'PDF Header/Footer',
        hint: 'HTML with classes: pageNumber, totalPages, title, date, url',
      },
      {
        name: 'pdfOptions.footerTemplate',
        label: 'Footer Template',
        type: 'textarea',
        placeholder: '<div style="font-size:10px; text-align:center; width:100%;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
        section: 'PDF Header/Footer',
      },
      {
        name: 'pdfOptions.timeout',
        label: 'PDF Timeout (ms)',
        type: 'number',
        placeholder: '30000',
        section: 'PDF Options',
      },
      // Shared
      ...sharedFields,
    ],
  },
  {
    id: 'json',
    label: 'JSON',
    shortDesc: 'AI extraction',
    method: 'POST',
    path: '/json',
    description: 'Extract structured JSON from a page using AI - highlight the power of AI-powered data extraction',
    responseType: 'json',
    hasUrlHtmlInput: true,
    fields: [
      // Endpoint-specific
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        placeholder: 'Extract all product names and prices from this page',
        required: true,
        hint: 'Describe the data you want. Works best paired with a response schema.',
      },
      {
        name: 'response_format',
        label: 'Response Schema',
        type: 'json',
        placeholder: '{"type": "json_schema", "schema": {"type": "object", "properties": {"title": {"type": "string"}}, "required": ["title"]}}',
        hint: 'Do not use with Claude models.',
      },
      {
        name: 'custom_ai',
        label: 'Custom AI Models',
        type: 'json',
        placeholder: '[{"model": "openai/gpt-4", "authorization": "Bearer sk-..."}]',
        section: 'AI Model',
        hint: 'Array of {model, authorization} for custom models with fallback',
      },
      // Shared
      ...sharedFields,
    ],
  },
  {
    id: 'content',
    label: 'Content',
    shortDesc: 'Rendered HTML',
    method: 'POST',
    path: '/content',
    description: 'Get the fully rendered HTML content after JavaScript execution',
    responseType: 'html',
    hasUrlHtmlInput: true,
    fields: [
      ...sharedFields,
    ],
  },
  {
    id: 'markdown',
    label: 'Markdown',
    shortDesc: 'Clean text',
    method: 'POST',
    path: '/markdown',
    description: 'Convert web pages to clean Markdown - perfect for LLM processing and documentation',
    responseType: 'markdown',
    hasUrlHtmlInput: true,
    fields: [
      ...sharedFields,
    ],
  },
  {
    id: 'snapshot',
    label: 'Snapshot',
    shortDesc: 'Combined output',
    method: 'POST',
    path: '/snapshot',
    description: 'Get both rendered HTML and a base64-encoded screenshot in one request',
    responseType: 'snapshot',
    hasUrlHtmlInput: true,
    fields: [
      // Endpoint-specific
      {
        name: 'screenshotOptions.fullPage',
        label: 'Full Page Screenshot',
        type: 'boolean',
        defaultValue: false,
        section: 'Snapshot Options',
      },
      // Shared
      ...sharedFields,
    ],
  },
  {
    id: 'scrape',
    label: 'Scrape',
    shortDesc: 'Targeted extraction',
    method: 'POST',
    path: '/scrape',
    description: 'Extract specific elements using CSS selectors - precise, code-based data scraping',
    responseType: 'json',
    hasUrlHtmlInput: true,
    fields: [
      // Endpoint-specific
      {
        name: 'elements',
        label: 'Elements Config',
        type: 'json',
        placeholder: '[{"selector": "h1"}, {"selector": "a"}]',
        required: true,
        hint: 'Array of {selector} objects',
      },
      // Shared
      ...sharedFields,
    ],
  },
  {
    id: 'links',
    label: 'Links',
    shortDesc: 'URL extraction',
    method: 'POST',
    path: '/links',
    description: 'Extract all links from a page - useful for sitemaps, crawling, and link analysis',
    responseType: 'json',
    hasUrlHtmlInput: true,
    fields: [
      // Endpoint-specific
      {
        name: 'visibleLinksOnly',
        label: 'Visible Links Only',
        type: 'boolean',
        defaultValue: false,
        hint: 'Exclude hidden links',
      },
      {
        name: 'excludeExternalLinks',
        label: 'Exclude External Links',
        type: 'boolean',
        defaultValue: false,
        hint: 'Only include same-domain links',
      },
      // Shared
      ...sharedFields,
    ],
  },
]
