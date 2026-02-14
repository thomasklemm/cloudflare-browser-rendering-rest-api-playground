import { useState } from 'react'
import JSZip from 'jszip'
import { Clock, AlertCircle, Loader2, Download, FolderDown } from 'lucide-react'
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

function SnapshotViewer({ data }: { data: string }) {
  let parsed: { html?: string; screenshot?: string }
  try {
    parsed = JSON.parse(data) as { html?: string; screenshot?: string }
  } catch {
    return <JsonViewer data={data} />
  }

  return (
    <div className="space-y-4 p-4">
      {parsed.screenshot && (
        <div>
          <h3 className="text-xs text-surface-500 mb-2">Screenshot</h3>
          <img
            src={`data:image/png;base64,${parsed.screenshot}`}
            alt="Snapshot screenshot"
            className="max-w-full rounded-lg border border-surface-300"
          />
        </div>
      )}
      {parsed.html && (
        <div>
          <h3 className="text-xs text-surface-500 mb-2">HTML Content</h3>
          <HtmlViewer data={parsed.html} />
        </div>
      )}
      {!parsed.screenshot && !parsed.html && <JsonViewer data={data} />}
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
      return <SnapshotViewer data={data} />
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

  for (const entry of entries) {
    if (!entry.response || entry.response.status >= 400 || !entry.response.data) continue

    let name = `${urlSlug(entry.url)}-${label}.${ext}`
    if (usedNames.has(name)) {
      let i = 2
      while (usedNames.has(`${urlSlug(entry.url)}-${label}-${i}.${ext}`)) i++
      name = `${urlSlug(entry.url)}-${label}-${i}.${ext}`
    }
    usedNames.add(name)

    if (binary) {
      // Fetch the blob from the blob URL
      const res = await fetch(entry.response.data as string)
      const blob = await res.blob()
      zip.file(name, blob)
    } else {
      zip.file(name, entry.response.data as string)
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
          {canDownloadAll && (
            <button
              onClick={async () => {
                setZipping(true)
                try {
                  await downloadAllAsZip(entries, responseType)
                } finally {
                  setZipping(false)
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-surface-500 hover:text-surface-800 whitespace-nowrap shrink-0 transition-colors"
            >
              {zipping ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FolderDown className="w-3.5 h-3.5" />
              )}
              {zipping ? 'Zipping...' : `Download All (${completedCount})`}
            </button>
          )}
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
          <span className="text-xs text-surface-500">{response.contentType}</span>
          {response.status < 400 && (responseType === 'image' || responseType === 'pdf') && (
            <a
              href={response.data as string}
              download={buildDownloadName(entries[activeIndex]?.url || '', responseType)}
              className="ml-auto flex items-center gap-1.5 px-2.5 py-1 text-xs text-surface-600 hover:text-surface-800 border border-surface-300 rounded-lg hover:bg-surface-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          )}
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
