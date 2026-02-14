import type { Settings } from '../types/api'

// Script injected into the page to detect the max content width.
// Checks getComputedStyle(el).maxWidth on common container selectors.
// Writes the detected pixel value to body[data-detected-width].
const DETECT_WIDTH_SCRIPT = `
(function() {
  var selectors = [
    'main', '[role="main"]',
    '.container', '.wrapper', '.content', '.page',
    '#app', '#root', '#__next', '#__nuxt',
    '.mx-auto',
    '[class*="container"]', '[class*="wrapper"]',
    'article', '.post', '.entry'
  ];
  var widths = [];
  for (var i = 0; i < selectors.length; i++) {
    try {
      var els = document.querySelectorAll(selectors[i]);
      for (var j = 0; j < els.length; j++) {
        var style = getComputedStyle(els[j]);
        var mw = style.maxWidth;
        if (mw && mw !== 'none' && mw !== '0px') {
          var px = parseFloat(mw);
          if (px > 0 && px < 3000) widths.push(px);
        }
      }
    } catch(e) {}
  }
  var detected = widths.length > 0 ? Math.max.apply(null, widths) : 0;
  document.body.setAttribute('data-detected-width', String(Math.round(detected)));
})();
`

/**
 * Detect the content max-width of a URL by making a lightweight /scrape call.
 * Returns the detected width in pixels, or null if detection fails.
 */
export async function detectContentWidth(
  settings: Settings,
  url: string,
  signal?: AbortSignal,
): Promise<number | null> {
  const apiPath = `/api/cf/client/v4/accounts/${settings.accountId}/browser-rendering/scrape`

  const body = {
    url,
    addScriptTag: [{ content: DETECT_WIDTH_SCRIPT }],
    elements: [{ selector: 'body' }],
    // Fast: don't wait for full load, just need the DOM containers
    gotoOptions: { waitUntil: 'domcontentloaded', timeout: 15000 },
    // Block images/fonts/media to speed up detection
    rejectResourceTypes: ['image', 'media', 'font'],
  }

  try {
    const res = await fetch(apiPath, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    })

    if (!res.ok) return null

    const data = await res.json()

    // Response shape: { success: true, result: [{ selector: "body", results: [{ attributes: [...] }] }] }
    const results = data?.result?.[0]?.results?.[0]?.attributes
    if (!Array.isArray(results)) return null

    const attr = results.find(
      (a: { name: string; value: string }) => a.name === 'data-detected-width',
    )
    if (!attr) return null

    const width = parseInt(attr.value, 10)
    if (!width || width <= 0) return null

    // Add small padding for scrollbar + breathing room
    return width + 40
  } catch {
    return null
  }
}
