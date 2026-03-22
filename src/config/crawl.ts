import type {
  CrawlCreateFormValues,
  CrawlFormat,
  CrawlInspectorTab,
  CrawlJobStatus,
  CrawlPurpose,
  CrawlRecordStatus,
  CrawlSource,
} from '../types/crawl'

export const CRAWL_DEFAULTS: CrawlCreateFormValues = {
  url: '',
  limit: '25',
  depth: '2',
  source: 'all',
  formats: ['markdown'],
  render: true,
  maxAge: '',
  modifiedSince: '',
  crawlPurposes: ['search'],
  includeExternalLinks: false,
  includeSubdomains: false,
  includePatterns: '',
  excludePatterns: '',
  dismissCookies: false,
  gotoWaitUntil: '',
  gotoTimeout: '',
  waitForSelector: '',
  setJavaScriptEnabled: true,
  addScriptTag: '',
  addStyleTag: '',
  rejectRequestPattern: '',
  allowRequestPattern: '',
  rejectResourceTypes: '',
  allowResourceTypes: '',
  jsonPrompt: '',
  jsonResponseFormat: '',
  jsonCustomAi: '',
}

export const CRAWL_PAGE_SIZE_DEFAULT = 50

export const CRAWL_SOURCE_OPTIONS: { label: string; value: CrawlSource; hint: string }[] = [
  { label: 'All', value: 'all', hint: 'Discover URLs from both sitemaps and links.' },
  { label: 'Sitemaps', value: 'sitemaps', hint: 'Use sitemap discovery only.' },
  { label: 'Links', value: 'links', hint: 'Follow page links only.' },
]

export const CRAWL_FORMAT_OPTIONS: { label: string; value: CrawlFormat; hint: string }[] = [
  { label: 'Markdown', value: 'markdown', hint: 'Best default for content inspection.' },
  { label: 'HTML', value: 'html', hint: 'Keep the rendered page source.' },
  { label: 'JSON', value: 'json', hint: 'AI extraction via Workers AI or custom models.' },
]

export const CRAWL_PURPOSE_OPTIONS: { label: string; value: CrawlPurpose; hint: string }[] = [
  { label: 'Search', value: 'search', hint: 'Safest default for site policy compatibility.' },
  { label: 'AI Input', value: 'ai-input', hint: 'Declare content use for AI systems.' },
  { label: 'AI Train', value: 'ai-train', hint: 'May be blocked by site Content Signals.' },
]

export const CRAWL_RECORD_STATUS_OPTIONS: {
  label: string
  value: '' | CrawlRecordStatus
  hint: string
}[] = [
  { label: 'All records', value: '', hint: 'No status filter.' },
  { label: 'Completed', value: 'completed', hint: 'Only successful records.' },
  { label: 'Errored', value: 'errored', hint: 'Origin errors and blocked pages.' },
  { label: 'Queued', value: 'queued', hint: 'Discovered but not processed yet.' },
  { label: 'Disallowed', value: 'disallowed', hint: 'Rejected by robots or policy.' },
  { label: 'Skipped', value: 'skipped', hint: 'Skipped due to crawl filters.' },
  { label: 'Cancelled', value: 'cancelled', hint: 'Cancelled before completion.' },
]

export const CRAWL_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export const CRAWL_JOB_STATUS_LABELS: Record<CrawlJobStatus, string> = {
  running: 'Running',
  completed: 'Completed',
  cancelled_due_to_timeout: 'Timed out',
  cancelled_due_to_limits: 'Cancelled by limits',
  cancelled_by_user: 'Cancelled by user',
  errored: 'Errored',
}

export const CRAWL_RECORD_STATUS_LABELS: Record<CrawlRecordStatus, string> = {
  queued: 'Queued',
  completed: 'Completed',
  disallowed: 'Disallowed',
  skipped: 'Skipped',
  errored: 'Errored',
  cancelled: 'Cancelled',
}

export const CRAWL_TAB_ORDER: CrawlInspectorTab[] = ['markdown', 'json', 'html', 'raw']
