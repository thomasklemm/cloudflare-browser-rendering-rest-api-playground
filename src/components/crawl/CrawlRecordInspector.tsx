import { ExternalLink } from 'lucide-react'
import { CRAWL_RECORD_STATUS_LABELS } from '../../config/crawl'
import type { CrawlInspectorTab, CrawlRecord } from '../../types/crawl'
import { HtmlViewer } from '../viewers/HtmlViewer'
import { JsonViewer } from '../viewers/JsonViewer'
import { MarkdownViewer } from '../viewers/MarkdownViewer'
import { CrawlEmptyState } from './CrawlEmptyState'

interface CrawlRecordInspectorProps {
  activeTab: CrawlInspectorTab
  availableTabs: CrawlInspectorTab[]
  onTabChange: (tab: CrawlInspectorTab) => void
  record: CrawlRecord | null
}

const TAB_LABELS: Record<CrawlInspectorTab, string> = {
  markdown: 'Markdown',
  html: 'HTML',
  json: 'JSON',
  raw: 'Raw',
}

function RecordViewer({
  activeTab,
  record,
}: {
  activeTab: CrawlInspectorTab
  record: CrawlRecord
}) {
  switch (activeTab) {
    case 'markdown':
      return record.markdown ? <MarkdownViewer data={record.markdown} /> : null
    case 'html':
      return record.html ? <HtmlViewer data={record.html} /> : null
    case 'json':
      return record.json ? <JsonViewer data={JSON.stringify(record.json, null, 2)} /> : null
    case 'raw':
      return <JsonViewer data={JSON.stringify(record.raw, null, 2)} />
  }
}

export function CrawlRecordInspector({
  activeTab,
  availableTabs,
  onTabChange,
  record,
}: CrawlRecordInspectorProps) {
  if (!record) {
    return (
      <CrawlEmptyState
        title="No record selected"
        description="Select a record from the list to inspect its payload, markdown, HTML, or raw envelope."
      />
    )
  }

  return (
    <div className="h-full flex flex-col glass-panel rounded-xl border border-surface-300 overflow-hidden">
      <div className="border-b border-surface-300 px-4 py-3 bg-surface-100">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-surface-300 px-2 py-0.5 text-[11px] text-surface-700">
            {CRAWL_RECORD_STATUS_LABELS[record.status]}
          </span>
          {record.httpStatus !== undefined && (
            <span className="inline-flex items-center rounded-full border border-surface-300 px-2 py-0.5 text-[11px] text-surface-700">
              HTTP {record.httpStatus}
            </span>
          )}
          {record.title && (
            <span className="text-xs text-surface-500 truncate">{record.title}</span>
          )}
        </div>
        <p className="mt-2 text-sm text-surface-900 break-all">{record.url}</p>
        {record.finalUrl && record.finalUrl !== record.url && (
          <p className="mt-1 text-xs text-surface-500 break-all">
            Final URL:{' '}
            <a
              href={record.finalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-500 hover:text-accent-400 inline-flex items-center gap-1"
            >
              {record.finalUrl}
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 border-b border-surface-300 px-3 py-2 bg-surface-100">
        {availableTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              activeTab === tab
                ? 'bg-surface-300 text-surface-900'
                : 'text-surface-600 hover:text-surface-800'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        <RecordViewer activeTab={activeTab} record={record} />
      </div>
    </div>
  )
}
