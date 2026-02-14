import type { EndpointConfig, Settings } from '../types/api'

// --- Cookie banner dismissal: two-layer approach ---
//
// Layer 1: Block CMP script URLs via rejectRequestPattern (prevents banner from loading)
// Layer 2: Fallback cleanup script via addScriptTag (catches inline/custom banners)
//
// rejectRequestPattern regexes block the JS that renders cookie consent banners.
// Covers: OneTrust, Cookiebot, Quantcast, Didomi, TrustArc, Usercentrics, Klaro,
// Osano, Termly, CookieYes, Complianz, Iubenda, Axeptio, Sourcepoint, CookieFirst,
// Borlabs, CIVIC, consentmanager.net, and generic cookie/consent/gdpr patterns.
const CMP_BLOCK_PATTERNS: string[] = [
  // OneTrust
  'cdn\\.cookielaw\\.org',
  'optanon\\.blob\\.core',
  'onetrust\\.com',
  // Cookiebot
  'consent\\.cookiebot\\.com',
  'consentcdn\\.cookiebot\\.com',
  // Quantcast
  'quantcast\\.mgr\\.consensu\\.org',
  'cmp\\.quantcast\\.com',
  // Didomi
  'sdk\\.privacy-center\\.org',
  'api\\.privacy-center\\.org',
  'cdn\\.didomi\\.io',
  // TrustArc
  'consent\\.trustarc\\.com',
  'consent-pref\\.trustarc\\.com',
  // Usercentrics (V2: app/sdk, V3: web.cmp/privacy-proxy)
  '\\.usercentrics\\.eu',
  // Klaro
  'cdn\\.kiprotect\\.com/klaro',
  // Osano
  'cmp\\.osano\\.com',
  // Termly
  'app\\.termly\\.io',
  // CookieYes
  'cdn-cookieyes\\.com',
  'app\\.cookieyes\\.com',
  // Complianz
  'complianz\\.io',
  // Iubenda
  'cdn\\.iubenda\\.com/cs',
  // Axeptio
  'client\\.axept\\.io',
  'static\\.axept\\.io',
  // Sourcepoint
  'sourcepoint\\.mgr\\.consensu\\.org',
  'cdn\\.privacy-mgmt\\.com',
  // CookieFirst
  'consent\\.cookiefirst\\.com',
  // Borlabs
  'cdn\\.borlabs\\.io',
  // CIVIC
  'cc\\.cdn\\.civiccomputing\\.com',
  // consentmanager.net
  'cdn\\.consentmanager\\.net',
  'delivery\\.consentmanager\\.net',
  'consentmanager\\.mgr\\.consensu\\.org',
  // Generic patterns (catch custom implementations)
  '/cookie-consent',
  '/cookieconsent',
  '/cookie-banner',
  '/gdpr-consent',
  '/consent-manager',
]

// Fallback cleanup script for banners that still appear (inline/custom implementations).
// Approach based on reject_all_cookies, DuckDuckGo autoconsent, and screenshotone.com.
const DISMISS_COOKIES_SCRIPT = `
(function() {
  function isVisible(el) {
    if (!el || el.hidden || el.style.display === 'none') return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function clickEl(el) {
    if (!el) return false;
    el.click();
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return true;
  }

  function trySelectors(selectors, root) {
    root = root || document;
    for (var i = 0; i < selectors.length; i++) {
      try {
        var el = root.querySelector(selectors[i]);
        if (el && isVisible(el)) return clickEl(el);
      } catch(e) {}
    }
    return false;
  }

  // --- Step 0: Shadow DOM CMPs (Usercentrics v2 renders inside shadow root) ---
  try {
    var ucRoot = document.querySelector('#usercentrics-root');
    if (ucRoot && ucRoot.shadowRoot) {
      var sr = ucRoot.shadowRoot;
      if (trySelectors([
        '[data-testid="uc-deny-all-button"]',
        '[data-testid="uc-accept-all-button"]',
      ], sr)) return;
    }
  } catch(e) {}

  // Programmatic Usercentrics API fallback
  try {
    if (window.UC_UI && typeof window.UC_UI.denyAllConsents === 'function') {
      window.UC_UI.denyAllConsents();
      return;
    }
  } catch(e) {}

  // --- Step 1: CMP-specific reject buttons ---
  var cmpReject = [
    // OneTrust
    '#onetrust-reject-all-handler',
    '.ot-reject-all-handler',
    // Cookiebot
    '#CybotCookiebotDialogBodyButtonDecline',
    '#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll',
    '.CybotCookiebotDialogBodyButton[data-function="decline"]',
    // Quantcast
    '.qc-cmp2-summary-buttons button[mode="secondary"]',
    '.qc-cmp2-summary-buttons .qc-cmp2-reject-all',
    // Didomi
    '#didomi-notice-disagree-button',
    '.didomi-button-secondary',
    // TrustArc
    '#truste-consent-required .truste-button2',
    '.truste-consent-required .truste-button2',
    // Usercentrics
    '[data-testid="uc-deny-all-button"]',
    '.uc-deny-all-button',
    // Klaro
    '.klaro .cn-decline',
    '.klaro .cm-btn-decline',
    // Cookiefirst
    '.cookiefirst-reject-all',
    '.cookiefirst-button-secondary',
    // Termly
    '.termly-reject-all-button',
    '#termly-code-snippet-reject-all',
    // Osano
    '.osano-cm-reject-all',
    '.osano-cm-denyAll',
    // Complianz
    '.cmplz-deny',
    '#cmplz-deny-all',
    // CookieYes / CookieLaw
    '.cky-btn-reject',
    '[data-cky-tag="reject-button"]',
    // Borlabs
    '.BorlabsCookie ._brlbs-refuse-btn',
    // CIVIC Cookie Control
    '#ccc-reject',
    // Iubenda
    '.iubenda-cs-reject-btn',
    // Axeptio
    '#axeptio_btn_dismiss',
    // Sourcepoint / GDPR
    'button[title="Reject"]',
    'button[title="Reject All"]',
    // consentmanager.net
    '#cmpwelcomebtnno a',
    '#cmpbntnono',
  ];
  if (trySelectors(cmpReject)) return;

  // --- Step 2: Generic reject buttons by attribute patterns ---
  var genericReject = [
    '[data-testid*="reject" i]',
    '[data-testid*="decline" i]',
    '[data-testid*="deny" i]',
    'button[class*="reject" i]',
    'button[class*="decline" i]',
    'button[class*="deny" i]',
    'button[class*="refuse" i]',
    'button[id*="reject" i]',
    'button[id*="decline" i]',
    'button[id*="deny" i]',
    '[aria-label*="reject" i]',
    '[aria-label*="decline" i]',
    '[aria-label*="deny" i]',
    '[aria-label*="refuse" i]',
    '.cmp-reject-all-button',
    '.reject-all-cookies',
    '.cookie-reject-all',
    '.gdpr-reject-all',
    '#rejectAllCookies',
    '#declineAllCookies',
  ];
  if (trySelectors(genericReject)) return;

  // --- Step 3: Text-based scan for reject buttons ---
  var rejectKeywords = [
    'reject all', 'reject cookies', 'decline all', 'decline cookies',
    'deny all', 'deny cookies', 'refuse all', 'refuse cookies',
    'essential only', 'necessary only', 'nur notwendige',
    'alle ablehnen', 'tout refuser', 'rechazar todo',
    'reject', 'decline', 'deny', 'refuse'
  ];
  var acceptKeywords = ['accept', 'allow', 'agree', 'consent', 'akzeptieren', 'accepter'];

  var clickables = document.querySelectorAll(
    'button, a[role="button"], div[role="button"], span[role="button"], ' +
    '[class*="cookie" i] a, [class*="consent" i] a, [id*="cookie" i] a'
  );
  for (var i = 0; i < clickables.length; i++) {
    var el = clickables[i];
    if (!isVisible(el)) continue;
    var text = ((el.textContent || '') + ' ' + (el.getAttribute('aria-label') || '')).toLowerCase().trim();
    if (!text) continue;

    var isAccept = false;
    for (var a = 0; a < acceptKeywords.length; a++) {
      if (text.indexOf(acceptKeywords[a]) !== -1) { isAccept = true; break; }
    }
    if (isAccept) continue;

    for (var r = 0; r < rejectKeywords.length; r++) {
      if (text.indexOf(rejectKeywords[r]) !== -1) {
        if (clickEl(el)) return;
      }
    }
  }

  // --- Step 4: Fallback - accept/close buttons (better than leaving the banner) ---
  var fallbackAccept = [
    '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
    '#CybotCookiebotDialogBodyButtonAccept',
    '#onetrust-accept-btn-handler',
    // consentmanager.net
    '#cmpwelcomebtnyes a',
    '#cmpbntnotxt',
    '.didomi-button-highlight',
    '#didomi-notice-agree-button',
    '[data-testid="uc-accept-all-button"]',
    '.qc-cmp2-summary-buttons button[mode="primary"]',
    '.osano-cm-accept-all',
    '.cky-btn-accept',
    '[data-cky-tag="accept-button"]',
    '.cmplz-accept',
    '.iubenda-cs-accept-btn',
    '.cc-accept', '.cc-allow', '.cc-dismiss',
    '[aria-label*="accept" i]',
    '[aria-label*="allow" i]',
    '[aria-label*="dismiss" i]',
    'button[class*="accept" i]',
    'button[class*="allow" i]',
    'button[id*="accept" i]',
  ];
  if (trySelectors(fallbackAccept)) return;

  // Text-based accept scan
  var acceptTexts = ['accept all', 'accept cookies', 'allow all', 'allow cookies',
    'i agree', 'got it', 'ok', 'continue', 'alle akzeptieren', 'tout accepter'];
  for (var i = 0; i < clickables.length; i++) {
    var el = clickables[i];
    if (!isVisible(el)) continue;
    var text = (el.textContent || '').toLowerCase().trim();
    for (var a = 0; a < acceptTexts.length; a++) {
      if (text === acceptTexts[a] || text.indexOf(acceptTexts[a]) !== -1) {
        if (clickEl(el)) return;
      }
    }
  }

  // --- Step 5: Last resort - hide banners via DOM removal + CSS ---
  var bannerSelectors = [
    '#onetrust-consent-sdk', '#onetrust-banner-sdk',
    '#CybotCookiebotDialog', '#CybotCookiebotDialogBodyUnderlay',
    '.qc-cmp2-container',
    '#truste-consent-track', '.truste-consent-overlay',
    '.didomi-notice', '.didomi-popup-backdrop',
    '.cookiefirst-root',
    '.termly-styles',
    '.osano-cm-window', '.osano-cm-dialog',
    '.uc-banner-wrap', '#usercentrics-root', '#usercentrics-cmp',
    '.klaro',
    '#cmpbox', '#cmpbox2',
    '[id*="cookie-banner" i]', '[id*="cookiebanner" i]', '[id*="cookie-consent" i]',
    '[class*="cookie-banner" i]', '[class*="cookiebanner" i]', '[class*="cookie-consent" i]',
    '[id*="consent-banner" i]', '[class*="consent-banner" i]',
    '[id*="gdpr-banner" i]', '[class*="gdpr-banner" i]',
    '.cc-banner', '.cc-window', '.cc-overlay',
    '#gdpr-banner', '#cookie-notice', '#cookieNotice',
  ];
  var removed = false;
  for (var i = 0; i < bannerSelectors.length; i++) {
    try {
      var els = document.querySelectorAll(bannerSelectors[i]);
      els.forEach(function(el) { el.remove(); removed = true; });
    } catch(e) {}
  }

  // Remove any lingering overlays/backdrops that block interaction
  if (removed) {
    var style = document.createElement('style');
    style.textContent =
      'body { overflow: auto !important; }' +
      'html { overflow: auto !important; }' +
      '.modal-backdrop, .overlay, [class*="backdrop"], [class*="overlay"] { display: none !important; }';
    document.head.appendChild(style);
  }
})();
`.trim()

// Script that scrolls the page to trigger lazy-loaded images (IntersectionObserver),
// then removes loading="lazy" attributes and scrolls back to top.
const LOAD_ALL_IMAGES_SCRIPT = `
(async function() {
  // Remove loading="lazy" so images start fetching immediately once in view
  document.querySelectorAll('img[loading="lazy"]').forEach(function(img) {
    img.removeAttribute('loading');
  });

  // Scroll down the page one viewport at a time to trigger IntersectionObservers
  var totalHeight = document.body.scrollHeight;
  var viewportHeight = window.innerHeight;
  var scrollPos = 0;

  while (scrollPos < totalHeight) {
    scrollPos += viewportHeight;
    window.scrollTo(0, scrollPos);
    await new Promise(function(r) { setTimeout(r, 100); });
    // Page height may grow (infinite scroll, dynamic content)
    totalHeight = document.body.scrollHeight;
  }

  // Scroll back to top
  window.scrollTo(0, 0);

  // Wait for images to finish loading
  var images = Array.from(document.querySelectorAll('img[src]'));
  await Promise.all(images.map(function(img) {
    if (img.complete) return Promise.resolve();
    return new Promise(function(r) {
      img.addEventListener('load', r, { once: true });
      img.addEventListener('error', r, { once: true });
      setTimeout(r, 3000);
    });
  }));
})();
`.trim()

function setNested(obj: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split('.')
  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) {
      current[keys[i]] = {}
    }
    current = current[keys[i]] as Record<string, unknown>
  }
  current[keys[keys.length - 1]] = value
}

export function buildBody(
  endpoint: EndpointConfig,
  formValues: Record<string, string>,
): Record<string, unknown> {
  const body: Record<string, unknown> = {}

  // Handle url/html input (only include the one with a value)
  if (endpoint.hasUrlHtmlInput) {
    if (formValues.url?.trim()) {
      body.url = formValues.url.trim()
    } else if (formValues.html?.trim()) {
      body.html = formValues.html.trim()
    }
  }

  // Injected scripts (cookie dismissal, lazy-load images)
  const scripts: { content: string }[] = []

  if (formValues._dismissCookies === 'true') {
    body.rejectRequestPattern = CMP_BLOCK_PATTERNS
    scripts.push({ content: DISMISS_COOKIES_SCRIPT })
  }

  if (formValues._loadAllImages === 'true') {
    scripts.push({ content: LOAD_ALL_IMAGES_SCRIPT })
  }

  if (scripts.length > 0) {
    body.addScriptTag = scripts
  }

  for (const field of endpoint.fields) {
    const raw = formValues[field.name]
    if (raw === undefined || raw === '') continue

    let value: unknown = raw
    if (field.type === 'number') {
      value = Number(raw)
    } else if (field.type === 'boolean') {
      value = raw === 'true'
    } else if (field.type === 'json') {
      try {
        value = JSON.parse(raw)
      } catch {
        value = raw
      }
    }

    if (field.name.includes('.')) {
      setNested(body, field.name, value)
    } else {
      body[field.name] = value
    }
  }

  return body
}

export function buildFetchOptions(
  endpoint: EndpointConfig,
  settings: Settings,
  formValues: Record<string, string>,
) {
  const path = `/api/cf/client/v4/accounts/${settings.accountId}/browser-rendering${endpoint.path}`
  const body = buildBody(endpoint, formValues)

  return {
    url: path,
    options: {
      method: endpoint.method,
      headers: {
        Authorization: `Bearer ${settings.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  }
}

export function buildCurlCommand(
  endpoint: EndpointConfig,
  settings: Settings,
  formValues: Record<string, string>,
  maskToken = true,
): string {
  const realUrl = `https://api.cloudflare.com/client/v4/accounts/${settings.accountId || '<ACCOUNT_ID>'}/browser-rendering${endpoint.path}`
  const body = buildBody(endpoint, formValues)
  const token = maskToken ? '<API_TOKEN>' : (settings.apiToken || '<API_TOKEN>')

  const parts = [
    `curl -X ${endpoint.method}`,
    `  "${realUrl}"`,
    `  -H "Authorization: Bearer ${token}"`,
    `  -H "Content-Type: application/json"`,
  ]

  if (Object.keys(body).length > 0) {
    parts.push(`  -d '${JSON.stringify(body, null, 2)}'`)
  }

  return parts.join(' \\\n')
}
