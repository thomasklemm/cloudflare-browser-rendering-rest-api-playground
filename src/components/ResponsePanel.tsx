import { Clock, AlertCircle } from 'lucide-react'
import type { ApiResponse, ResponseType } from '../types/api'
import { JsonViewer } from './viewers/JsonViewer'
import { HtmlViewer } from './viewers/HtmlViewer'
import { ImageViewer } from './viewers/ImageViewer'
import { PdfViewer } from './viewers/PdfViewer'
import { MarkdownViewer } from './viewers/MarkdownViewer'

interface ResponsePanelProps {
  response: ApiResponse | null
  responseType: ResponseType
  loading: boolean
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
    return (
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400 font-medium">API Error</p>
        </div>
        <JsonViewer data={response.data} />
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

export function ResponsePanel({ response, responseType, loading }: ResponsePanelProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-surface-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-surface-400 border-t-accent-500 rounded-full animate-spin" />
          <span className="text-sm">Sending request...</span>
        </div>
      </div>
    )
  }

  if (!response) {
    return (
      <div className="flex-1 flex items-center justify-center text-surface-500">
        <p className="text-sm">Send a request to see the response</p>
      </div>
    )
  }

  const statusColor =
    response.status >= 200 && response.status < 300
      ? 'text-green-400'
      : response.status >= 400
        ? 'text-red-400'
        : 'text-yellow-400'

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-4 px-4 py-2 border-b border-surface-300 bg-surface-100 shrink-0">
        <span className={`text-sm font-medium ${statusColor}`}>
          {response.status} {response.statusText}
        </span>
        <span className="flex items-center gap-1 text-xs text-surface-500">
          <Clock className="w-3.5 h-3.5" />
          {response.duration}ms
        </span>
        <span className="text-xs text-surface-500">{response.contentType}</span>
      </div>
      <div className="flex-1 overflow-auto">
        <ResponseViewer response={response} responseType={responseType} />
      </div>
    </div>
  )
}
