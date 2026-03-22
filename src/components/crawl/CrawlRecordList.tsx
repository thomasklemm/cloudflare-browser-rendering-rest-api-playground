import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import {
  CRAWL_PAGE_SIZE_OPTIONS,
  CRAWL_RECORD_STATUS_LABELS,
  CRAWL_RECORD_STATUS_OPTIONS,
} from '../../config/crawl'
import type { CrawlFilters, CrawlRecordStatus } from '../../types/crawl'
import { CrawlEmptyState } from './CrawlEmptyState'

interface CrawlRecordListProps {
  filters: CrawlFilters
  filteredRecordIndexes: Array<{ index: number }>
  hasNextPage: boolean
  hasPreviousPage: boolean
  loading: boolean
  onNextPage: () => Promise<void> | void
  onPageSizeChange: (pageSize: number) => Promise<void> | void
  onPreviousPage: () => Promise<void> | void
  onSearchChange: (value: string) => void
  onSelect: (index: number) => void
  onStatusChange: (status: '' | CrawlRecordStatus) => Promise<void> | void
  pageIndex: number
  records: Array<{
    finalUrl?: string
    httpStatus?: number
    index: number
    status: CrawlRecordStatus
    title?: string
    url: string
  }>
  resultsError: string | null
  selectedRecordIndex: number | null
}

export function CrawlRecordList({
  filters,
  filteredRecordIndexes,
  hasNextPage,
  hasPreviousPage,
  loading,
  onNextPage,
  onPageSizeChange,
  onPreviousPage,
  onSearchChange,
  onSelect,
  onStatusChange,
  pageIndex,
  records,
  resultsError,
  selectedRecordIndex,
}: CrawlRecordListProps) {
  const visibleIndexes = useMemo(
    () => new Set(filteredRecordIndexes.map(({ index }) => index)),
    [filteredRecordIndexes],
  )

  return (
    <div className="h-full flex flex-col glass-panel rounded-xl border border-surface-300 overflow-hidden">
      <div className="border-b border-surface-300 p-3 bg-surface-100 space-y-3">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-xs text-surface-500 mb-1">Status filter</label>
            <select
              value={filters.status}
              onChange={(event) => void onStatusChange(event.target.value as '' | CrawlRecordStatus)}
              className="w-full px-3 py-2 bg-surface-200 border border-surface-300 rounded-lg text-sm text-surface-900 focus:outline-none"
            >
              {CRAWL_RECORD_STATUS_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-surface-500 mb-1">Page size</label>
            <select
              value={filters.pageSize}
              onChange={(event) => void onPageSizeChange(Number(event.target.value))}
              className="w-full px-3 py-2 bg-surface-200 border border-surface-300 rounded-lg text-sm text-surface-900 focus:outline-none"
            >
              {CRAWL_PAGE_SIZE_OPTIONS.map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize} records
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-surface-500 mb-1">
              Search current page only
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Filter by URL, title, status, or HTTP code"
              className="w-full px-3 py-2 bg-surface-200 border border-surface-300 rounded-lg text-sm text-surface-900 placeholder:text-surface-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-surface-500">
          <span>{filteredRecordIndexes.length} visible on this page</span>
          <span>Page {pageIndex + 1}</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {resultsError ? (
          <CrawlEmptyState
            title="Could not load crawl records"
            description={resultsError}
          />
        ) : loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex items-center gap-2 text-surface-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Refreshing records…</span>
            </div>
          </div>
        ) : records.length === 0 ? (
          <CrawlEmptyState
            title="No records on this page"
            description="Try a different status filter or refresh the crawl once more results are available."
          />
        ) : filteredRecordIndexes.length === 0 ? (
          <CrawlEmptyState
            title="No visible matches"
            description="The current-page search did not match any records. Clear the search box or inspect the raw page records."
          />
        ) : (
          <div className="divide-y divide-surface-300">
            {records
              .filter((record) => visibleIndexes.has(record.index))
              .map((record) => {
                const selected = selectedRecordIndex === record.index
                return (
                  <button
                    key={`${record.index}-${record.url}`}
                    type="button"
                    onClick={() => onSelect(record.index)}
                    className={`w-full text-left px-3 py-3 transition-colors ${
                      selected ? 'bg-surface-200' : 'hover:bg-surface-200/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-surface-900 truncate">
                          {record.title || record.url}
                        </p>
                        <p className="text-xs text-surface-500 truncate">{record.url}</p>
                        {record.finalUrl && record.finalUrl !== record.url && (
                          <p className="text-[11px] text-surface-500 truncate">
                            Final: {record.finalUrl}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="inline-flex items-center rounded-full border border-surface-300 px-2 py-0.5 text-[11px] text-surface-700">
                          {CRAWL_RECORD_STATUS_LABELS[record.status]}
                        </span>
                        {record.httpStatus !== undefined && (
                          <p className="mt-1 text-[11px] text-surface-500">HTTP {record.httpStatus}</p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
          </div>
        )}
      </div>

      <div className="border-t border-surface-300 px-3 py-2 bg-surface-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => void onPreviousPage()}
          disabled={!hasPreviousPage || loading}
          className="px-3 py-1.5 rounded-lg border border-surface-300 text-xs text-surface-700 hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => void onNextPage()}
          disabled={!hasNextPage || loading}
          className="px-3 py-1.5 rounded-lg border border-surface-300 text-xs text-surface-700 hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  )
}
