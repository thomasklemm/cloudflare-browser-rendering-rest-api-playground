import { useState } from 'react'
import JSZip from 'jszip'
import { Clock, AlertCircle, Loader2, Download, FolderDown, Info } from 'lucide-react'
import type { ApiResponse, ResponseType, BatchResponseEntry } from '../types/api'
import { JsonViewer } from './viewers/JsonViewer'
import { HtmlViewer } from './viewers/HtmlViewer'
import { ImageViewer } from './viewers/ImageViewer'
import { PdfViewer } from './viewers/PdfViewer'
import { MarkdownViewer } from './viewers/MarkdownViewer'

interface ResponsePanelProps {
  entries: BatchResponseEntry[]
  activeIndex: number
  onSelectIndex: (index: number) => void
  responseType: ResponseType
  loading: boolean
  response: ApiResponse | null
  entryLoading: boolean
}

function SnapshotViewer({ screenshot, html }: { screenshot: string | null; html: string | null }) {
  const [tab, setTab] = useState<'screenshot' | 'html'>(screenshot ? 'screenshot' : 'html')

  const tabCls = (active: boolean) =>
    `px-3 py-1.5 text-xs border-b-2 transition-colors ${
      active
        ? 'border-accent-500 text-surface-900'
        : 'border-transparent text-surface-500 hover:text-surface-700'
    }`

  return (
    <div className="h-full flex flex-col">
      {(screenshot || html) && (
        <div className="flex items-center border-b border-surface-300 bg-surface-100 shrink-0">
          {screenshot && (
            <button onClick={() => setTab('screenshot')} className={tabCls(tab === 'screenshot')}>
              Screenshot
            </button>
          )}
          {html && (
            <button onClick={() => setTab('html')} className={tabCls(tab === 'html')}>
              HTML
            </button>
          )}
          {tab === 'screenshot' && screenshot && (
            <a
              href={`data:image/png;base64,${screenshot}`}
              download={`snapshot-screenshot-${timestamp()}.png`}
              className="ml-auto flex items-center gap-1 px-3 text-xs text-surface-500 hover:text-surface-700 transition-colors"
            >
              <Download className="w-3 h-3" />
              Save image
            </a>
          )}
          {tab === 'html' && html && (
            <button
              onClick={() => downloadText(html, `snapshot-html-${timestamp()}.html`, 'text/html')}
              className="ml-auto flex items-center gap-1 px-3 text-xs text-surface-500 hover:text-surface-700 transition-colors"
            >
              <Download className="w-3 h-3" />
              Save HTML
            </button>
          )}
        </div>
      )}
      <div className="flex-1 min-h-0">
        {tab === 'screenshot' && screenshot && (
          <div className="h-full overflow-auto p-4">
            <img
              src={`data:image/png;base64,${screenshot}`}
              alt="Snapshot screenshot"
              className="max-w-full rounded-lg border border-surface-300"
            />
          </div>
        )}
        {tab === 'html' && html && (
          <HtmlViewer data={html} />
        )}
        {!screenshot && !html && (
          <p className="p-4 text-sm text-surface-500">No screenshot or HTML content in response.</p>
        )}
      </div>
    </div>
  )
}

/**
 * Try to unwrap a CF API JSON envelope like {"success":true,"result":"..."}.
 * Returns the extracted result string and remaining metadata, or null if not applicable.
 */
function unwrapCfEnvelope(data: string): { result: string; meta: Record<string, unknown> } | null {
  try {
    const parsed = JSON.parse(data) as Record<string, unknown>
    if (typeof parsed.result === 'string' && parsed.result) {
      const { result, ...meta } = parsed
      return { result: result as string, meta }
    }
  } catch { /* not JSON */ }
  return null
}

/**
 * Unwrap a CF /snapshot envelope like {"success":true,"result":{"screenshot":"...","content":"..."}}.
 * Returns the extracted screenshot + html and remaining metadata, or null if not applicable.
 */
function unwrapSnapshotEnvelope(data: string): {
  screenshot: string | null
  html: string | null
  meta: Record<string, unknown>
} | null {
  try {
    const parsed = JSON.parse(data) as Record<string, unknown>
    const result = parsed.result as Record<string, unknown> | undefined
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      const screenshot = typeof result.screenshot === 'string' ? result.screenshot : null
      const html = typeof result.content === 'string' ? result.content : null
      if (screenshot || html) {
        const { result: _result, ...meta } = parsed
        return { screenshot, html, meta }
      }
    }
  } catch { /* not JSON */ }
  return null
}

/** Render a plain object as indented YAML-style key/value lines. */
function YamlTree({ data, depth = 0 }: { data: Record<string, unknown>; depth?: number }) {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return null
  return (
    <div style={depth > 0 ? { paddingLeft: `${depth * 12}px` } : undefined}>
      {entries.map(([key, val]) => {
        if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
          return (
            <div key={key}>
              <p className="text-xs text-surface-500">{key}:</p>
              <YamlTree data={val as Record<string, unknown>} depth={depth + 1} />
            </div>
          )
        }
        const display = Array.isArray(val) ? JSON.stringify(val) : String(val)
        return (
          <p key={key} className="text-xs text-surface-500">
            {key}: <span className="text-surface-700">{display}</span>
          </p>
        )
      })}
    </div>
  )
}

function ResponseViewer({ response, responseType }: { response: ApiResponse; responseType: ResponseType }) {
  if (response.error || !response.data) {
    return (
      <div className="p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-red-400 font-medium">
            {response.error || 'No response data'}
          </p>
          {typeof response.data === 'string' && response.data && (
            <pre className="mt-2 text-xs text-surface-600 whitespace-pre-wrap">
              {response.data}
            </pre>
          )}
        </div>
      </div>
    )
  }

  if (response.status >= 400 && typeof response.data === 'string') {
    let rawAiResponse: string | null = null
    try {
      const parsed = JSON.parse(response.data) as { rawAiResponse?: string }
      if (parsed.rawAiResponse) rawAiResponse = parsed.rawAiResponse
    } catch { /* not JSON */ }

    return (
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400 font-medium">API Error</p>
        </div>
        <JsonViewer data={response.data} />
        {rawAiResponse && (
          <div className="mt-4">
            <h4 className="text-xs text-surface-500 mb-2">Raw AI Response (unparsed)</h4>
            <pre className="p-3 bg-surface-200 border border-surface-300 rounded-lg text-xs text-surface-700 whitespace-pre-wrap overflow-auto max-h-64">
              {rawAiResponse}
            </pre>
          </div>
        )}
      </div>
    )
  }

  const data = response.data as string

  // For html/markdown, the CF API wraps the result in a JSON envelope
  // like {"success":true,"result":"<actual content>"}. Unwrap it.
  if (responseType === 'html' || responseType === 'markdown') {
    const unwrapped = unwrapCfEnvelope(data)
    if (unwrapped) {
      return responseType === 'html' ? (
        <HtmlViewer data={unwrapped.result} />
      ) : (
        <MarkdownViewer data={unwrapped.result} />
      )
    }
  }

  // For snapshot, unwrap the CF envelope to get screenshot + content
  if (responseType === 'snapshot') {
    const unwrapped = unwrapSnapshotEnvelope(data)
    if (unwrapped) {
      return <SnapshotViewer screenshot={unwrapped.screenshot} html={unwrapped.html} />
    }
  }

  switch (responseType) {
    case 'html':
      return <HtmlViewer data={data} />
    case 'image':
      return <ImageViewer blobUrl={data} />
    case 'pdf':
      return <PdfViewer blobUrl={data} />
    case 'json':
      return <JsonViewer data={data} />
    case 'markdown':
      return <MarkdownViewer data={data} />
    case 'snapshot':
      return <SnapshotViewer screenshot={null} html={null} />
    default:
      return (
        <pre className="p-4 text-sm text-surface-700 whitespace-pre-wrap">{data}</pre>
      )
  }
}

function StatusDot({ entry }: { entry: BatchResponseEntry }) {
  if (entry.loading) {
    return <Loader2 className="w-3 h-3 animate-spin text-surface-500" />
  }
  if (!entry.response) {
    return <span className="w-2 h-2 rounded-full bg-surface-400" />
  }
  if (entry.response.error || entry.response.status >= 400) {
    return <span className="w-2 h-2 rounded-full bg-red-400" />
  }
  return <span className="w-2 h-2 rounded-full bg-green-400" />
}

function timestamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

function urlSlug(url: string): string {
  if (!url || url === '__html__') return 'html'
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '').replace(/\./g, '-')
    const path = u.pathname
      .replace(/^\/|\/$/g, '')
      .replace(/[/\s]+/g, '-')
      .replace(/[^a-zA-Z0-9-]/g, '')
    return path ? `${host}-${path}` : host
  } catch {
    return 'page'
  }
}

const RESPONSE_TYPE_EXT: Record<ResponseType, string> = {
  image: 'png',
  pdf: 'pdf',
  html: 'html',
  json: 'json',
  markdown: 'md',
  snapshot: 'json',
}

const RESPONSE_TYPE_LABEL: Record<ResponseType, string> = {
  image: 'screenshot',
  pdf: 'document',
  html: 'content',
  json: 'data',
  markdown: 'markdown',
  snapshot: 'snapshot',
}

function buildDownloadName(url: string, responseType: ResponseType): string {
  const ext = RESPONSE_TYPE_EXT[responseType] || 'bin'
  const label = RESPONSE_TYPE_LABEL[responseType] || 'response'
  return `${urlSlug(url)}-${label}-${timestamp()}.${ext}`
}

function isBinaryResponse(responseType: ResponseType): boolean {
  return responseType === 'image' || responseType === 'pdf'
}

function downloadText(content: string, filename: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function base64ToBlob(base64: string, contentType = 'image/png'): Blob {
  const byteCharacters = atob(base64)
  const byteArray = new Uint8Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i)
  }
  return new Blob([byteArray], { type: contentType })
}

/** Extract the content to zip/download for a given response, unwrapping CF envelopes for html/markdown/snapshot. */
function extractContent(
  data: string,
  responseType: ResponseType,
): string | { screenshot: string | null; html: string | null; raw: string } {
  if (responseType === 'html' || responseType === 'markdown') {
    const unwrapped = unwrapCfEnvelope(data)
    if (unwrapped) return unwrapped.result
  }
  if (responseType === 'snapshot') {
    const unwrapped = unwrapSnapshotEnvelope(data)
    if (unwrapped) {
      return { screenshot: unwrapped.screenshot, html: unwrapped.html, raw: data }
    }
  }
  return data
}

async function downloadAllAsZip(
  entries: BatchResponseEntry[],
  responseType: ResponseType,
): Promise<void> {
  const zip = new JSZip()
  const ext = RESPONSE_TYPE_EXT[responseType] || 'bin'
  const label = RESPONSE_TYPE_LABEL[responseType] || 'response'
  const binary = isBinaryResponse(responseType)

  // Deduplicate filenames
  const usedNames = new Set<string>()

  const dedupName = (base: string, extension: string): string => {
    let name = `${base}.${extension}`
    if (usedNames.has(name)) {
      let i = 2
      while (usedNames.has(`${base}-${i}.${extension}`)) i++
      name = `${base}-${i}.${extension}`
    }
    usedNames.add(name)
    return name
  }

  for (const entry of entries) {
    if (!entry.response || entry.response.status >= 400 || !entry.response.data) continue

    const slug = urlSlug(entry.url)

    if (binary) {
      const res = await fetch(entry.response.data as string)
      const blob = await res.blob()
      zip.file(dedupName(`${slug}-${label}`, ext), blob)
    } else {
      const content = extractContent(entry.response.data as string, responseType)

      if (typeof content === 'object' && 'raw' in content) {
        // Snapshot: add up to 3 files
        if (content.screenshot) {
          zip.file(dedupName(`${slug}-screenshot`, 'png'), base64ToBlob(content.screenshot))
        }
        if (content.html) {
          zip.file(dedupName(`${slug}-content`, 'html'), content.html)
        }
        zip.file(dedupName(`${slug}-envelope`, 'json'), content.raw)
      } else {
        zip.file(dedupName(`${slug}-${label}`, ext), content as string)
      }
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${label}s-${timestamp()}.zip`
  a.click()
  URL.revokeObjectURL(url)
}

function truncateUrl(url: string, maxLen = 30): string {
  if (url === '__html__') return 'HTML'
  try {
    const u = new URL(url)
    const display = u.hostname + u.pathname
    return display.length > maxLen ? display.slice(0, maxLen) + '...' : display
  } catch {
    return url.length > maxLen ? url.slice(0, maxLen) + '...' : url
  }
}

export function ResponsePanel({
  entries,
  activeIndex,
  onSelectIndex,
  responseType,
  loading,
  response,
  entryLoading,
}: ResponsePanelProps) {
  const [zipping, setZipping] = useState(false)
  const hasEntries = entries.length > 0
  const showTabs = entries.length > 1
  const completedCount = entries.filter(
    (e) => e.response && !e.loading && e.response.status < 400 && e.response.data,
  ).length
  const canDownloadAll = showTabs && completedCount >= 2

  // No entries yet — show placeholder
  if (!hasEntries && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-surface-500">
        <p className="text-sm">Send a request to see the response</p>
      </div>
    )
  }

  // Loading with no entries yet (shouldn't happen but be safe)
  if (!hasEntries && loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-surface-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-surface-400 border-t-accent-500 rounded-full animate-spin" />
          <span className="text-sm">Sending requests...</span>
        </div>
      </div>
    )
  }

  const statusColor = response
    ? response.status >= 200 && response.status < 300
      ? 'text-green-400'
      : response.status >= 400
        ? 'text-red-400'
        : 'text-yellow-400'
    : 'text-surface-500'

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* URL tabs (only when multiple) */}
      {showTabs && (
        <div className="flex items-center border-b border-surface-300 bg-surface-100 shrink-0">
          <div className="flex items-center gap-0 overflow-x-auto flex-1 min-w-0">
            {entries.map((entry, i) => (
              <button
                key={i}
                onClick={() => onSelectIndex(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs whitespace-nowrap border-b-2 transition-colors ${
                  i === activeIndex
                    ? 'border-accent-500 text-surface-900 bg-surface-50'
                    : 'border-transparent text-surface-500 hover:text-surface-700 hover:bg-surface-200'
                }`}
              >
                <StatusDot entry={entry} />
                {truncateUrl(entry.url)}
              </button>
            ))}
          </div>
          {canDownloadAll && (() => {
            const zipBtn = 'flex items-center gap-1.5 px-3 py-1.5 text-xs text-surface-500 hover:text-surface-800 whitespace-nowrap shrink-0 transition-colors'

            if (zipping) {
              return (
                <span className={zipBtn}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Zipping...
                </span>
              )
            }

            return (
              <button
                onClick={async () => {
                  setZipping(true)
                  try { await downloadAllAsZip(entries, responseType) } finally { setZipping(false) }
                }}
                className={zipBtn}
              >
                <FolderDown className="w-3.5 h-3.5" />
                Save All ({completedCount})
              </button>
            )
          })()}
        </div>
      )}

      {/* Status bar */}
      {response && !entryLoading && (
        <div className="flex items-center gap-4 px-4 py-2 border-b border-surface-300 bg-surface-100 shrink-0">
          <span className={`text-sm font-medium ${statusColor}`}>
            {response.status} {response.statusText}
          </span>
          <span className="flex items-center gap-1 text-xs text-surface-500">
            <Clock className="w-3.5 h-3.5" />
            {response.duration}ms
          </span>
          {(() => {
            const data = response.data as string
            const binary = isBinaryResponse(responseType)
            const unwrapped = !binary ? unwrapCfEnvelope(data) : null
            const snapshotUnwrapped = !binary && responseType === 'snapshot' ? unwrapSnapshotEnvelope(data) : null
            const envelopeMeta = unwrapped?.meta ?? snapshotUnwrapped?.meta ?? null
            const activeUrl = entries[activeIndex]?.url || ''
            const btnCls = 'flex items-center gap-1.5 px-2.5 py-1 text-xs text-surface-600 hover:text-surface-800 border border-surface-300 hover:bg-surface-200 transition-colors'

            return (
              <>
                {envelopeMeta ? (
                  <span className="relative group">
                    <span className="flex items-center gap-1 text-xs text-surface-500 cursor-default">
                      {response.contentType}
                      <Info className="w-3.5 h-3.5" />
                    </span>
                    <div className="absolute top-full left-0 mt-1 z-50 hidden group-hover:block">
                      <div className="bg-surface-100 border border-surface-300 rounded-lg shadow-lg p-3 min-w-48">
                        <p className="text-[10px] uppercase tracking-wider text-surface-500 mb-1.5">Response envelope</p>
                        <YamlTree data={envelopeMeta} />
                        <button
                          onClick={() => {
                            const slug = urlSlug(activeUrl)
                            const label = RESPONSE_TYPE_LABEL[responseType] || 'response'
                            downloadText(data, `${slug}-${label}-${timestamp()}.json`)
                          }}
                          className="mt-2 flex items-center gap-1 text-xs text-accent-400 hover:text-accent-500 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          Save JSON
                        </button>
                      </div>
                    </div>
                  </span>
                ) : (
                  <span className="text-xs text-surface-500">{response.contentType}</span>
                )}
                {response.status < 400 && response.data && responseType !== 'snapshot' && (() => {
                  if (binary) {
                    return (
                      <a
                        href={data}
                        download={buildDownloadName(activeUrl, responseType)}
                        className={`ml-auto ${btnCls} rounded-lg`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Save
                      </a>
                    )
                  }

                  // For snapshot, always download the full raw JSON envelope
                  const content = snapshotUnwrapped ? data : (unwrapped ? unwrapped.result : data)

                  return (
                    <button
                      onClick={() => downloadText(content, buildDownloadName(activeUrl, responseType))}
                      className={`ml-auto ${btnCls} rounded-lg`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Save
                    </button>
                  )
                })()}
              </>
            )
          })()}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {entryLoading ? (
          <div className="flex-1 flex items-center justify-center text-surface-500 h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-surface-400 border-t-accent-500 rounded-full animate-spin" />
              <span className="text-sm">Sending request...</span>
            </div>
          </div>
        ) : response ? (
          <ResponseViewer response={response} responseType={responseType} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-surface-500 h-full">
            <p className="text-sm">Waiting for response...</p>
          </div>
        )}
      </div>
    </div>
  )
}
