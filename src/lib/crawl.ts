import JSZip from 'jszip'
import { CMP_BLOCK_PATTERNS, DISMISS_COOKIES_SCRIPT } from './buildRequest'
import type { Settings, WorkersPlan } from '../types/api'
import type {
  CrawlCreateFormValues,
  CrawlCursor,
  CrawlJobSummary,
  CrawlRecord,
  CrawlRecordStatus,
  CrawlResultsPage,
} from '../types/crawl'

type JsonExpectation = 'array' | 'object' | 'any'

export type CrawlFieldErrors = Partial<Record<keyof CrawlCreateFormValues, string>>

function parseJsonField(
  raw: string,
  expectation: JsonExpectation,
): unknown {
  const parsed = JSON.parse(raw)

  if (expectation === 'array' && !Array.isArray(parsed)) {
    throw new Error('Must be a JSON array.')
  }

  if (expectation === 'object' && (!parsed || Array.isArray(parsed) || typeof parsed !== 'object')) {
    throw new Error('Must be a JSON object.')
  }

  return parsed
}

export function validateCrawlFormValues(
  values: CrawlCreateFormValues,
  plan: WorkersPlan,
): CrawlFieldErrors {
  const errors: CrawlFieldErrors = {}
  const urlTokens = values.url.trim().split(/\s+/).filter(Boolean)

  if (urlTokens.length === 0) {
    errors.url = 'A starting URL is required.'
  } else if (urlTokens.length > 1) {
    errors.url = 'Enter exactly one starting URL.'
  }

  if (values.formats.length === 0) {
    errors.formats = 'Select at least one output format.'
  }

  if (plan === 'free' && values.limit.trim()) {
    const limit = Number(values.limit)
    if (!Number.isFinite(limit) || limit > 100) {
      errors.limit = 'Workers Free plan is limited to 100 pages per crawl.'
    }
  }

  if (values.formats.includes('json') && !values.jsonPrompt.trim() && !values.jsonResponseFormat.trim()) {
    errors.jsonPrompt = 'JSON format requires a prompt or response schema.'
    errors.jsonResponseFormat = 'JSON format requires a prompt or response schema.'
  }

  const jsonFields: Array<[keyof CrawlCreateFormValues, JsonExpectation]> = [
    ['includePatterns', 'array'],
    ['excludePatterns', 'array'],
    ['jsonResponseFormat', 'object'],
    ['jsonCustomAi', 'array'],
    ['addScriptTag', 'array'],
    ['addStyleTag', 'array'],
    ['rejectRequestPattern', 'array'],
    ['allowRequestPattern', 'array'],
    ['rejectResourceTypes', 'array'],
    ['allowResourceTypes', 'array'],
  ]

  for (const [field, expectation] of jsonFields) {
    const raw = values[field]
    if (typeof raw !== 'string' || !raw.trim()) continue

    try {
      parseJsonField(raw, expectation)
    } catch (error) {
      errors[field] = error instanceof Error ? error.message : 'Invalid JSON.'
    }
  }

  return errors
}

function maybeSetNumber(
  target: Record<string, unknown>,
  key: string,
  raw: string,
) {
  if (!raw.trim()) return
  const value = Number(raw)
  if (!Number.isNaN(value)) {
    target[key] = value
  }
}

function maybeSetJson(
  target: Record<string, unknown>,
  key: string,
  raw: string,
  expectation: JsonExpectation,
) {
  if (!raw.trim()) return
  target[key] = parseJsonField(raw, expectation)
}

export function buildCrawlCreateBody(
  values: CrawlCreateFormValues,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    url: values.url.trim(),
    source: values.source,
    render: values.render,
    formats: values.formats,
    crawlPurposes: values.crawlPurposes,
  }

  maybeSetNumber(body, 'limit', values.limit)
  maybeSetNumber(body, 'depth', values.depth)
  maybeSetNumber(body, 'maxAge', values.maxAge)
  maybeSetNumber(body, 'modifiedSince', values.modifiedSince)

  const options: Record<string, unknown> = {
    includeExternalLinks: values.includeExternalLinks,
    includeSubdomains: values.includeSubdomains,
  }

  maybeSetJson(options, 'includePatterns', values.includePatterns, 'array')
  maybeSetJson(options, 'excludePatterns', values.excludePatterns, 'array')

  if (Object.keys(options).length > 0) {
    body.options = options
  }

  if (values.formats.includes('json')) {
    const jsonOptions: Record<string, unknown> = {}

    if (values.jsonPrompt.trim()) {
      jsonOptions.prompt = values.jsonPrompt.trim()
    }

    maybeSetJson(jsonOptions, 'response_format', values.jsonResponseFormat, 'object')
    maybeSetJson(jsonOptions, 'custom_ai', values.jsonCustomAi, 'array')

    if (Object.keys(jsonOptions).length > 0) {
      body.jsonOptions = jsonOptions
    }
  }

  if (values.render) {
    const gotoOptions: Record<string, unknown> = {}
    if (values.gotoWaitUntil) {
      gotoOptions.waitUntil = values.gotoWaitUntil
    }
    maybeSetNumber(gotoOptions, 'timeout', values.gotoTimeout)
    if (Object.keys(gotoOptions).length > 0) {
      body.gotoOptions = gotoOptions
    }

    if (values.waitForSelector.trim()) {
      body.waitForSelector = { selector: values.waitForSelector.trim() }
    }

    if (!values.setJavaScriptEnabled) {
      body.setJavaScriptEnabled = false
    }

    maybeSetJson(body, 'addScriptTag', values.addScriptTag, 'array')
    maybeSetJson(body, 'addStyleTag', values.addStyleTag, 'array')
    maybeSetJson(body, 'rejectRequestPattern', values.rejectRequestPattern, 'array')
    maybeSetJson(body, 'allowRequestPattern', values.allowRequestPattern, 'array')
    maybeSetJson(body, 'rejectResourceTypes', values.rejectResourceTypes, 'array')
    maybeSetJson(body, 'allowResourceTypes', values.allowResourceTypes, 'array')

    if (values.dismissCookies) {
      const currentScripts = Array.isArray(body.addScriptTag) ? body.addScriptTag as unknown[] : []
      const currentRejectPatterns = Array.isArray(body.rejectRequestPattern)
        ? body.rejectRequestPattern as string[]
        : []

      body.addScriptTag = [{ content: DISMISS_COOKIES_SCRIPT }, ...currentScripts]
      body.rejectRequestPattern = [...CMP_BLOCK_PATTERNS, ...currentRejectPatterns]
    }
  }

  return body
}

function buildAuthHeaders(settings: Settings) {
  return {
    Authorization: `Bearer ${settings.apiToken}`,
    'Content-Type': 'application/json',
  }
}

export function buildCrawlCreateFetchOptions(
  settings: Settings,
  values: CrawlCreateFormValues,
) {
  return {
    url: `/api/cf/client/v4/accounts/${settings.accountId}/browser-rendering/crawl`,
    options: {
      method: 'POST',
      headers: buildAuthHeaders(settings),
      body: JSON.stringify(buildCrawlCreateBody(values)),
    },
  }
}

export function buildCrawlGetUrl(
  settings: Settings,
  jobId: string,
  params: { limit?: number; cursor?: CrawlCursor; status?: '' | CrawlRecordStatus } = {},
) {
  const query = new URLSearchParams()

  if (params.limit !== undefined) query.set('limit', String(params.limit))
  if (params.cursor !== undefined) query.set('cursor', String(params.cursor))
  if (params.status) query.set('status', params.status)

  const suffix = query.toString() ? `?${query.toString()}` : ''
  return `/api/cf/client/v4/accounts/${settings.accountId}/browser-rendering/crawl/${jobId}${suffix}`
}

export function buildCrawlDeleteUrl(
  settings: Settings,
  jobId: string,
) {
  return `/api/cf/client/v4/accounts/${settings.accountId}/browser-rendering/crawl/${jobId}`
}

function buildCurlCommand(
  method: 'GET' | 'POST' | 'DELETE',
  url: string,
  token: string,
  body?: Record<string, unknown>,
) {
  const parts = [
    `curl -X ${method}`,
    `  "${url}"`,
    `  -H "Authorization: Bearer ${token}"`,
  ]

  if (body) {
    parts.push('  -H "Content-Type: application/json"')
    parts.push(`  -d '${JSON.stringify(body, null, 2)}'`)
  }

  return parts.join(' \\\n')
}

export function buildCrawlCreateCurlCommand(
  settings: Settings,
  values: CrawlCreateFormValues,
  maskToken = true,
) {
  const token = maskToken ? '<API_TOKEN>' : (settings.apiToken || '<API_TOKEN>')
  const url = `https://api.cloudflare.com/client/v4/accounts/${settings.accountId || '<ACCOUNT_ID>'}/browser-rendering/crawl`
  return buildCurlCommand('POST', url, token, buildCrawlCreateBody(values))
}

export function buildCrawlGetCurlCommand(
  settings: Settings,
  jobId: string,
  params: { limit?: number; cursor?: CrawlCursor; status?: '' | CrawlRecordStatus } = {},
  maskToken = true,
) {
  const token = maskToken ? '<API_TOKEN>' : (settings.apiToken || '<API_TOKEN>')
  const path = buildCrawlGetUrl(
    { ...settings, accountId: settings.accountId || '<ACCOUNT_ID>' },
    jobId,
    params,
  )
  return buildCurlCommand('GET', `https://api.cloudflare.com${path.replace(/^\/api\/cf/, '')}`, token)
}

export function buildCrawlDeleteCurlCommand(
  settings: Settings,
  jobId: string,
  maskToken = true,
) {
  const token = maskToken ? '<API_TOKEN>' : (settings.apiToken || '<API_TOKEN>')
  const path = buildCrawlDeleteUrl(
    { ...settings, accountId: settings.accountId || '<ACCOUNT_ID>' },
    jobId,
  )
  return buildCurlCommand('DELETE', `https://api.cloudflare.com${path.replace(/^\/api\/cf/, '')}`, token)
}

type CrawlEnvelopeResult = Record<string, unknown> | string

interface CrawlEnvelope {
  result: CrawlEnvelopeResult
  success?: boolean
  errors?: Array<{ code?: number; message?: string }>
}

function normalizeCursor(value: unknown): CrawlCursor | undefined {
  if (typeof value === 'string' || typeof value === 'number') return value
  return undefined
}

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function normalizeRecord(raw: Record<string, unknown>): CrawlRecord {
  const metadataRaw = (raw.metadata && typeof raw.metadata === 'object' && !Array.isArray(raw.metadata))
    ? raw.metadata as Record<string, unknown>
    : {}

  const jsonRaw = raw.json
  return {
    url: typeof raw.url === 'string' ? raw.url : '',
    status: typeof raw.status === 'string' ? raw.status as CrawlRecordStatus : 'queued',
    httpStatus: normalizeNumber(metadataRaw.status),
    finalUrl: typeof metadataRaw.url === 'string' ? metadataRaw.url : undefined,
    title: typeof metadataRaw.title === 'string' ? metadataRaw.title : undefined,
    html: typeof raw.html === 'string' ? raw.html : undefined,
    markdown: typeof raw.markdown === 'string' ? raw.markdown : undefined,
    json: jsonRaw && typeof jsonRaw === 'object' && !Array.isArray(jsonRaw)
      ? jsonRaw as Record<string, unknown>
      : undefined,
    metadata: {
      status: normalizeNumber(metadataRaw.status) ?? 0,
      url: typeof metadataRaw.url === 'string' ? metadataRaw.url : '',
      title: typeof metadataRaw.title === 'string' ? metadataRaw.title : undefined,
    },
    raw,
  }
}

export function extractErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  const envelope = payload as CrawlEnvelope
  if (!Array.isArray(envelope.errors) || envelope.errors.length === 0) return null
  return envelope.errors
    .map((error) => error.message)
    .filter((message): message is string => Boolean(message))
    .join(' ')
}

export function normalizeCrawlCreateResponse(payload: unknown): string {
  const envelope = payload as CrawlEnvelope
  if (typeof envelope.result !== 'string' || !envelope.result) {
    throw new Error('Cloudflare did not return a crawl job ID.')
  }
  return envelope.result
}

export function normalizeCrawlJobSummary(payload: unknown): CrawlJobSummary {
  const envelope = payload as CrawlEnvelope
  if (!envelope.result || typeof envelope.result !== 'object' || Array.isArray(envelope.result)) {
    throw new Error('Cloudflare did not return crawl job details.')
  }

  const result = envelope.result as Record<string, unknown>
  return {
    id: typeof result.id === 'string' ? result.id : '',
    status: typeof result.status === 'string' ? result.status as CrawlJobSummary['status'] : 'errored',
    browserSecondsUsed: normalizeNumber(result.browserSecondsUsed) ?? 0,
    finished: normalizeNumber(result.finished) ?? 0,
    total: normalizeNumber(result.total) ?? 0,
    skipped: normalizeNumber(result.skipped) ?? 0,
    cursor: normalizeCursor(result.cursor),
    raw: envelope as unknown as Record<string, unknown>,
  }
}

export function normalizeCrawlResultsPage(payload: unknown): CrawlResultsPage {
  const envelope = payload as CrawlEnvelope
  if (!envelope.result || typeof envelope.result !== 'object' || Array.isArray(envelope.result)) {
    throw new Error('Cloudflare did not return crawl records.')
  }

  const result = envelope.result as Record<string, unknown>
  const records = Array.isArray(result.records)
    ? result.records
        .filter((record): record is Record<string, unknown> => Boolean(record) && typeof record === 'object' && !Array.isArray(record))
        .map(normalizeRecord)
    : []

  return {
    records,
    cursor: normalizeCursor(result.cursor),
    raw: envelope as unknown as Record<string, unknown>,
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'record'
}

function buildRecordSlug(record: CrawlRecord, index: number) {
  return `${String(index + 1).padStart(4, '0')}-${slugify(record.finalUrl || record.url)}`
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function downloadCrawlResultsZip(
  job: CrawlJobSummary,
  records: CrawlRecord[],
) {
  const zip = new JSZip()

  zip.file(
    'job.json',
    JSON.stringify(
      {
        summary: {
          id: job.id,
          status: job.status,
          browserSecondsUsed: job.browserSecondsUsed,
          finished: job.finished,
          total: job.total,
          skipped: job.skipped,
          cursor: job.cursor ?? null,
        },
        rawEnvelope: job.raw,
      },
      null,
      2,
    ),
  )
  zip.file('records.jsonl', records.map((record) => JSON.stringify(record.raw)).join('\n'))

  records.forEach((record, index) => {
    const slug = buildRecordSlug(record, index)
    if (record.markdown) {
      zip.file(`markdown/${slug}.md`, record.markdown)
    }
    if (record.html) {
      const folder = record.status === 'errored' ? 'errors' : 'html'
      zip.file(`${folder}/${slug}.html`, record.html)
    }
    if (record.json) {
      zip.file(`json/${slug}.json`, JSON.stringify(record.json, null, 2))
    }
  })

  const blob = await zip.generateAsync({ type: 'blob' })
  triggerBlobDownload(blob, `crawl-${job.id}.zip`)
}
