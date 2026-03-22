export type CrawlJobStatus =
  | 'running'
  | 'completed'
  | 'cancelled_due_to_timeout'
  | 'cancelled_due_to_limits'
  | 'cancelled_by_user'
  | 'errored'

export type CrawlRecordStatus =
  | 'queued'
  | 'completed'
  | 'disallowed'
  | 'skipped'
  | 'errored'
  | 'cancelled'

export type CrawlCursor = string | number

export type CrawlFormat = 'html' | 'markdown' | 'json'
export type CrawlSource = 'all' | 'sitemaps' | 'links'
export type CrawlPurpose = 'search' | 'ai-input' | 'ai-train'
export type CrawlInspectorTab = 'markdown' | 'html' | 'json' | 'raw'

export interface CrawlCreateFormValues {
  url: string
  limit: string
  depth: string
  source: CrawlSource
  formats: CrawlFormat[]
  render: boolean
  maxAge: string
  modifiedSince: string
  crawlPurposes: CrawlPurpose[]
  includeExternalLinks: boolean
  includeSubdomains: boolean
  includePatterns: string
  excludePatterns: string
  dismissCookies: boolean
  gotoWaitUntil: '' | 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'
  gotoTimeout: string
  waitForSelector: string
  setJavaScriptEnabled: boolean
  addScriptTag: string
  addStyleTag: string
  rejectRequestPattern: string
  allowRequestPattern: string
  rejectResourceTypes: string
  allowResourceTypes: string
  jsonPrompt: string
  jsonResponseFormat: string
  jsonCustomAi: string
}

export interface CrawlRecordMetadata {
  status: number
  url: string
  title?: string
}

export interface CrawlRecord {
  url: string
  status: CrawlRecordStatus
  httpStatus?: number
  finalUrl?: string
  title?: string
  html?: string
  json?: Record<string, unknown>
  markdown?: string
  metadata: CrawlRecordMetadata
  raw: Record<string, unknown>
}

export interface CrawlJobSummary {
  id: string
  status: CrawlJobStatus
  browserSecondsUsed: number
  finished: number
  total: number
  skipped: number
  cursor?: CrawlCursor
  raw: Record<string, unknown>
}

export interface CrawlResultsPage {
  records: CrawlRecord[]
  cursor?: CrawlCursor
  raw: Record<string, unknown>
}

export interface CrawlFilters {
  status: '' | CrawlRecordStatus
  pageSize: number
  search: string
}
