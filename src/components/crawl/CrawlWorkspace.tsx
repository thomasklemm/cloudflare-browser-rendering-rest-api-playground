import { useState } from 'react'
import { X } from 'lucide-react'
import { JsonViewer } from '../viewers/JsonViewer'
import type {
  CrawlInspectorTab,
  CrawlJobSummary as CrawlJobSummaryType,
  CrawlRecord,
  CrawlRecordStatus,
} from '../../types/crawl'
import { CrawlEmptyState } from './CrawlEmptyState'
import { CrawlJobSummary } from './CrawlJobSummary'
import { CrawlRecordInspector } from './CrawlRecordInspector'
import { CrawlRecordList } from './CrawlRecordList'

interface CrawlWorkspaceProps {
  availableInspectorTabs: CrawlInspectorTab[]
  cancelling: boolean
  cancelCurl: string
  exporting: boolean
  filteredRecordIndexes: Array<{ index: number }>
  filters: { pageSize: number; search: string; status: '' | CrawlRecordStatus }
  hasNextPage: boolean
  hasPreviousPage: boolean
  job: CrawlJobSummaryType | null
  jobError: string | null
  jobStartedAt: number | null
  lastRefreshedAt: number | null
  onCancel: () => Promise<void> | void
  onExport: () => Promise<void> | void
  onNextPage: () => Promise<void> | void
  onPageSizeChange: (pageSize: number) => Promise<void> | void
  onPreviousPage: () => Promise<void> | void
  onRefresh: () => Promise<void> | void
  onSearchChange: (value: string) => void
  onSelectRecord: (index: number) => void
  onStatusChange: (status: '' | CrawlRecordStatus) => Promise<void> | void
  pageIndex: number
  pollCurl: string
  polling: boolean
  records: Array<{
    finalUrl?: string
    httpStatus?: number
    index: number
    status: CrawlRecordStatus
    title?: string
    url: string
  }>
  refreshingResults: boolean
  refreshingSummary: boolean
  resultsError: string | null
  selectedInspectorTab: CrawlInspectorTab
  selectedRecord: CrawlRecord | null
  selectedRecordIndex: number | null
  setInspectorTab: (tab: CrawlInspectorTab) => void
}

export function CrawlWorkspace({
  availableInspectorTabs,
  cancelling,
  cancelCurl,
  exporting,
  filteredRecordIndexes,
  filters,
  hasNextPage,
  hasPreviousPage,
  job,
  jobError,
  jobStartedAt,
  lastRefreshedAt,
  onCancel,
  onExport,
  onNextPage,
  onPageSizeChange,
  onPreviousPage,
  onRefresh,
  onSearchChange,
  onSelectRecord,
  onStatusChange,
  pageIndex,
  pollCurl,
  polling,
  records,
  refreshingResults,
  refreshingSummary,
  resultsError,
  selectedInspectorTab,
  selectedRecord,
  selectedRecordIndex,
  setInspectorTab,
}: CrawlWorkspaceProps) {
  const [showRawJob, setShowRawJob] = useState(false)

  if (!job) {
    return (
      <div className="h-full rounded-xl overflow-hidden shadow-2xl animate-fade-scale">
        <CrawlEmptyState
          title="No crawl job yet"
          description="Configure a starting URL and launch a crawl from the left panel. Results will appear here once the job has been created."
        />
      </div>
    )
  }

  return (
    <>
      <div className="h-full flex flex-col gap-4 rounded-xl overflow-hidden shadow-2xl animate-fade-scale">
        <CrawlJobSummary
          cancelling={cancelling}
          cancelCurl={cancelCurl}
          exporting={exporting}
          job={job}
          jobError={jobError}
          jobStartedAt={jobStartedAt}
          lastRefreshedAt={lastRefreshedAt}
          onCancel={onCancel}
          onExport={onExport}
          onRefresh={onRefresh}
          onViewRawJob={() => setShowRawJob(true)}
          pollCurl={pollCurl}
          polling={polling}
          refreshingSummary={refreshingSummary}
        />

        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-4">
          <CrawlRecordList
            filters={filters}
            filteredRecordIndexes={filteredRecordIndexes}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            loading={refreshingResults}
            onNextPage={onNextPage}
            onPageSizeChange={onPageSizeChange}
            onPreviousPage={onPreviousPage}
            onSearchChange={onSearchChange}
            onSelect={onSelectRecord}
            onStatusChange={onStatusChange}
            pageIndex={pageIndex}
            records={records}
            resultsError={resultsError}
            selectedRecordIndex={selectedRecordIndex}
          />

          <div className="min-h-0">
            {job.status === 'running' && records.length === 0 && !refreshingResults && !resultsError ? (
              <CrawlEmptyState
                title="No records loaded yet"
                description="The crawl is running. Use Refresh to load the current page of partial results without waiting for the job to finish."
              />
            ) : (
              <CrawlRecordInspector
                activeTab={selectedInspectorTab}
                availableTabs={availableInspectorTabs}
                onTabChange={setInspectorTab}
                record={selectedRecord}
              />
            )}
          </div>
        </div>
      </div>

      {showRawJob && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center px-4">
          <div className="w-full max-w-4xl max-h-[85vh] glass-panel rounded-2xl overflow-hidden border border-surface-300 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-300 bg-surface-100">
              <p className="text-sm text-surface-900">Raw job JSON</p>
              <button
                type="button"
                onClick={() => setShowRawJob(false)}
                className="p-2 rounded-lg text-surface-500 hover:text-surface-800 hover:bg-surface-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[calc(85vh-56px)] overflow-auto">
              <JsonViewer data={JSON.stringify(job.raw, null, 2)} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
