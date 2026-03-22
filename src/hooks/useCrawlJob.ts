import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { CRAWL_PAGE_SIZE_DEFAULT, CRAWL_TAB_ORDER } from '../config/crawl'
import {
  buildCrawlCreateFetchOptions,
  buildCrawlDeleteUrl,
  buildCrawlGetUrl,
  downloadCrawlResultsZip,
  extractErrorMessage,
  normalizeCrawlCreateResponse,
  normalizeCrawlJobSummary,
  normalizeCrawlResultsPage,
} from '../lib/crawl'
import { waitForRateLimit } from '../lib/rateLimits'
import type { Settings } from '../types/api'
import type {
  CrawlCreateFormValues,
  CrawlCursor,
  CrawlFilters,
  CrawlInspectorTab,
  CrawlJobSummary,
  CrawlRecord,
  CrawlRecordStatus,
  CrawlResultsPage,
} from '../types/crawl'

const CRAWL_REQUEST_TIMEOUT_MS = 20000

function buildFriendlyError(status: number, message: string | null): string {
  const normalized = (message || '').toLowerCase()

  if (status === 400 && (normalized.includes('content signal') || normalized.includes('crawlpurpose'))) {
    return 'This crawl was rejected by the target site Content Signals. Reduce crawl purposes to "search" and try again.'
  }

  if (status === 429) {
    return message || 'Cloudflare rate limited this request. Wait a moment and try again.'
  }

  return message || `Cloudflare returned ${status}.`
}

function getAvailableTabs(record: CrawlRecord | null): CrawlInspectorTab[] {
  if (!record) return ['raw']

  return CRAWL_TAB_ORDER.filter((tab) => {
    switch (tab) {
      case 'markdown':
        return Boolean(record.markdown)
      case 'json':
        return Boolean(record.json)
      case 'html':
        return Boolean(record.html)
      case 'raw':
        return true
    }
  })
}

function matchesSearch(record: CrawlRecord, query: string): boolean {
  if (!query) return true

  const haystack = [
    record.url,
    record.finalUrl,
    record.title,
    record.status,
    record.httpStatus?.toString(),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(query)
}

function createPlaceholderJob(id: string): CrawlJobSummary {
  return {
    id,
    status: 'running',
    browserSecondsUsed: 0,
    finished: 0,
    total: 0,
    skipped: 0,
    raw: {
      success: true,
      result: id,
    },
  }
}

export function useCrawlJob(settings: Settings) {
  const [job, setJob] = useState<CrawlJobSummary | null>(null)
  const [resultsPage, setResultsPage] = useState<CrawlResultsPage | null>(null)
  const [filters, setFilters] = useState<CrawlFilters>({
    status: '',
    pageSize: CRAWL_PAGE_SIZE_DEFAULT,
    search: '',
  })
  const [selectedRecordIndex, setSelectedRecordIndex] = useState<number | null>(null)
  const [selectedInspectorTab, setSelectedInspectorTab] = useState<CrawlInspectorTab>('markdown')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageCursors, setPageCursors] = useState<Array<CrawlCursor | undefined>>([undefined])
  const [creating, setCreating] = useState(false)
  const [refreshingSummary, setRefreshingSummary] = useState(false)
  const [refreshingResults, setRefreshingResults] = useState(false)
  const [polling, setPolling] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [jobError, setJobError] = useState<string | null>(null)
  const [resultsError, setResultsError] = useState<string | null>(null)
  const [jobStartedAt, setJobStartedAt] = useState<number | null>(null)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null)
  const [visibilityState, setVisibilityState] = useState<DocumentVisibilityState>(() => document.visibilityState)
  const deferredSearch = useDeferredValue(filters.search)

  const isMountedRef = useRef(true)
  const jobRef = useRef<CrawlJobSummary | null>(null)
  const resultsPageRef = useRef<CrawlResultsPage | null>(null)
  const filtersRef = useRef(filters)
  const pageIndexRef = useRef(pageIndex)
  const pageCursorsRef = useRef(pageCursors)
  const summaryRequestIdRef = useRef(0)
  const resultsRequestIdRef = useRef(0)

  useEffect(() => {
    jobRef.current = job
  }, [job])

  useEffect(() => {
    resultsPageRef.current = resultsPage
  }, [resultsPage])

  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  useEffect(() => {
    pageIndexRef.current = pageIndex
  }, [pageIndex])

  useEffect(() => {
    pageCursorsRef.current = pageCursors
  }, [pageCursors])

  useEffect(() => {
    const handleVisibilityChange = () => setVisibilityState(document.visibilityState)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const filteredRecordIndexes = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    return (resultsPage?.records || [])
      .map((record, index) => ({ record, index }))
      .filter(({ record }) => matchesSearch(record, query))
  }, [deferredSearch, resultsPage])

  const selectedRecord = useMemo(() => {
    if (!resultsPage || selectedRecordIndex === null) return null
    return resultsPage.records[selectedRecordIndex] || null
  }, [resultsPage, selectedRecordIndex])

  const availableInspectorTabs = useMemo(
    () => getAvailableTabs(selectedRecord),
    [selectedRecord],
  )

  useEffect(() => {
    if (!filteredRecordIndexes.length) {
      setSelectedRecordIndex(null)
      return
    }

    const visibleIndexes = new Set(filteredRecordIndexes.map(({ index }) => index))
    if (selectedRecordIndex === null || !visibleIndexes.has(selectedRecordIndex)) {
      setSelectedRecordIndex(filteredRecordIndexes[0].index)
    }
  }, [filteredRecordIndexes, selectedRecordIndex])

  useEffect(() => {
    if (!availableInspectorTabs.includes(selectedInspectorTab)) {
      setSelectedInspectorTab(availableInspectorTabs[0] || 'raw')
    }
  }, [availableInspectorTabs, selectedInspectorTab])

  const fetchEnvelope = useCallback(async (
    url: string,
    init: RequestInit,
    options: {
      skipRateLimit?: boolean
    } = {},
  ): Promise<unknown> => {
    if (!options.skipRateLimit) {
      await waitForRateLimit(settings.plan)
    }
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), CRAWL_REQUEST_TIMEOUT_MS)

    let response: Response
    try {
      response = await fetch(url, {
        ...init,
        signal: controller.signal,
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Cloudflare did not respond to the crawl request within 20 seconds.')
      }
      throw error
    } finally {
      window.clearTimeout(timeout)
    }

    let payload: unknown = null
    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    if (!response.ok) {
      throw new Error(buildFriendlyError(response.status, extractErrorMessage(payload)))
    }

    return payload
  }, [settings.plan])

  const resetResultsState = useCallback(() => {
    resultsPageRef.current = null
    pageIndexRef.current = 0
    pageCursorsRef.current = [undefined]
    setResultsPage(null)
    setResultsError(null)
    setSelectedRecordIndex(null)
    setSelectedInspectorTab('markdown')
    setPageIndex(0)
    setPageCursors([undefined])
  }, [])

  const fetchResultsPage = useCallback(async (
    options: {
      cursor?: CrawlCursor
      targetPageIndex?: number
      resetPagination?: boolean
      skipRateLimit?: boolean
    } = {},
  ) => {
    if (!jobRef.current) return

    const requestId = ++resultsRequestIdRef.current
    const targetPageIndex = options.resetPagination ? 0 : (options.targetPageIndex ?? pageIndexRef.current)
    const cursor = options.resetPagination
      ? undefined
      : (options.cursor ?? pageCursorsRef.current[targetPageIndex])

    setRefreshingResults(true)
    setResultsError(null)

    try {
      const payload = await fetchEnvelope(
        buildCrawlGetUrl(settings, jobRef.current.id, {
          cursor,
          limit: filtersRef.current.pageSize,
          status: filtersRef.current.status,
        }),
        {
          headers: {
            Authorization: `Bearer ${settings.apiToken}`,
          },
        },
        {
          skipRateLimit: options.skipRateLimit,
        },
      )

      if (!isMountedRef.current || requestId !== resultsRequestIdRef.current) return

      const page = normalizeCrawlResultsPage(payload)
      resultsPageRef.current = page
      setResultsPage(page)
      setPageIndex(targetPageIndex)
      setPageCursors((prev) => {
        if (options.resetPagination) return [undefined]
        const next = prev.slice(0, Math.max(targetPageIndex + 1, prev.length))
        if (next[targetPageIndex] === undefined && cursor !== undefined) {
          next[targetPageIndex] = cursor
        }
        return next
      })
      setSelectedRecordIndex(page.records.length > 0 ? 0 : null)
      setLastRefreshedAt(Date.now())
    } catch (error) {
      if (!isMountedRef.current || requestId !== resultsRequestIdRef.current) return
      setResultsError(error instanceof Error ? error.message : 'Failed to fetch crawl results.')
    } finally {
      if (isMountedRef.current && requestId === resultsRequestIdRef.current) {
        setRefreshingResults(false)
      }
    }
  }, [fetchEnvelope, settings])

  const refreshSummary = useCallback(async (
    options: { origin?: 'manual' | 'poll' | 'create' | 'cancel'; jobId?: string; skipRateLimit?: boolean } = {},
  ) => {
    const activeJobId = options.jobId || jobRef.current?.id
    if (!activeJobId) return

    const requestId = ++summaryRequestIdRef.current

    if (options.origin === 'poll') {
      setPolling(true)
    } else {
      setRefreshingSummary(true)
    }

    setJobError(null)

    try {
      const payload = await fetchEnvelope(
        buildCrawlGetUrl(settings, activeJobId, {
          limit: 1,
        }),
        {
          headers: {
            Authorization: `Bearer ${settings.apiToken}`,
          },
        },
        {
          skipRateLimit: options.skipRateLimit,
        },
      )

      if (!isMountedRef.current || requestId !== summaryRequestIdRef.current) return

      const previousStatus = jobRef.current?.status
      const summary = normalizeCrawlJobSummary(payload)
      let hasEmbeddedResults = false

      try {
        const embeddedPage = normalizeCrawlResultsPage(payload)
        hasEmbeddedResults = embeddedPage.records.length > 0 || embeddedPage.cursor !== undefined
      } catch {
        hasEmbeddedResults = false
      }

      jobRef.current = summary
      setJob(summary)
      setLastRefreshedAt(Date.now())

      if (previousStatus === 'running' && summary.status !== 'running') {
        void fetchResultsPage({
          resetPagination: true,
          skipRateLimit: options.skipRateLimit,
          targetPageIndex: 0,
        })
      } else if (
        summary.status === 'running' &&
        !resultsPageRef.current &&
        (
          summary.finished > 0 ||
          summary.total > 0 ||
          summary.browserSecondsUsed > 0 ||
          hasEmbeddedResults
        )
      ) {
        void fetchResultsPage({
          resetPagination: true,
          skipRateLimit: options.skipRateLimit,
          targetPageIndex: 0,
        })
      }
    } catch (error) {
      if (!isMountedRef.current || requestId !== summaryRequestIdRef.current) return
      setJobError(error instanceof Error ? error.message : 'Failed to refresh crawl status.')
    } finally {
      const shouldResetLoading = isMountedRef.current && requestId === summaryRequestIdRef.current
      if (shouldResetLoading) {
        setPolling(false)
        setRefreshingSummary(false)
      }
    }
  }, [fetchEnvelope, fetchResultsPage, settings])

  const startJob = useCallback(async (values: CrawlCreateFormValues) => {
    setCreating(true)
    setJobError(null)
    setResultsError(null)
    resetResultsState()
    filtersRef.current = {
      pageSize: CRAWL_PAGE_SIZE_DEFAULT,
      search: '',
      status: '',
    }
    setFilters({
      pageSize: CRAWL_PAGE_SIZE_DEFAULT,
      search: '',
      status: '',
    })

    try {
      const { url, options } = buildCrawlCreateFetchOptions(settings, values)
      const payload = await fetchEnvelope(url, options)
      const jobId = normalizeCrawlCreateResponse(payload)
      const placeholder = createPlaceholderJob(jobId)
      setJobStartedAt(Date.now())
      jobRef.current = placeholder
      setJob(placeholder)
      await refreshSummary({ jobId, origin: 'create', skipRateLimit: true })
    } catch (error) {
      setJobStartedAt(null)
      jobRef.current = null
      setJob(null)
      setJobError(error instanceof Error ? error.message : 'Failed to start crawl.')
    } finally {
      if (isMountedRef.current) {
        setCreating(false)
      }
    }
  }, [fetchEnvelope, refreshSummary, resetResultsState, settings])

  const refreshAll = useCallback(async () => {
    await refreshSummary({ origin: 'manual', skipRateLimit: true })
    await fetchResultsPage({ skipRateLimit: true, targetPageIndex: pageIndexRef.current })
  }, [fetchResultsPage, refreshSummary])

  const cancelJob = useCallback(async () => {
    if (!jobRef.current) return

    setCancelling(true)
    setJobError(null)

    try {
      await fetchEnvelope(
        buildCrawlDeleteUrl(settings, jobRef.current.id),
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${settings.apiToken}`,
          },
        },
      )

      await refreshSummary({ origin: 'cancel' })
      await fetchResultsPage({ targetPageIndex: pageIndexRef.current })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel crawl.'
      setJobError(message)

      if (message.toLowerCase().includes('already completed') || message.toLowerCase().includes('cannot be cancelled')) {
        await refreshSummary({ origin: 'manual', skipRateLimit: true })
        void fetchResultsPage({ skipRateLimit: true, targetPageIndex: pageIndexRef.current })
      }
    } finally {
      if (isMountedRef.current) {
        setCancelling(false)
      }
    }
  }, [fetchEnvelope, fetchResultsPage, refreshSummary, settings])

  const goToNextPage = useCallback(async () => {
    if (!resultsPage?.cursor) return

    const nextIndex = pageIndexRef.current + 1
    setPageCursors((prev) => {
      const next = prev.slice()
      next[nextIndex] = resultsPage.cursor
      return next
    })

    await fetchResultsPage({
      cursor: resultsPage.cursor,
      targetPageIndex: nextIndex,
    })
  }, [fetchResultsPage, resultsPage])

  const goToPreviousPage = useCallback(async () => {
    if (pageIndexRef.current === 0) return

    const nextIndex = pageIndexRef.current - 1
    await fetchResultsPage({
      cursor: pageCursorsRef.current[nextIndex],
      targetPageIndex: nextIndex,
    })
  }, [fetchResultsPage])

  const setStatusFilter = useCallback(async (status: '' | CrawlRecordStatus) => {
    filtersRef.current = { ...filtersRef.current, status }
    setFilters(filtersRef.current)
    await fetchResultsPage({
      resetPagination: true,
      targetPageIndex: 0,
    })
  }, [fetchResultsPage])

  const setPageSize = useCallback(async (pageSize: number) => {
    filtersRef.current = { ...filtersRef.current, pageSize }
    setFilters(filtersRef.current)
    await fetchResultsPage({
      resetPagination: true,
      targetPageIndex: 0,
    })
  }, [fetchResultsPage])

  const setSearch = useCallback((search: string) => {
    filtersRef.current = { ...filtersRef.current, search }
    setFilters(filtersRef.current)
  }, [])

  const exportFilteredResults = useCallback(async () => {
    if (!jobRef.current || jobRef.current.status === 'running') return

    setExporting(true)
    setJobError(null)

    try {
      const collected: CrawlRecord[] = []
      let cursor: CrawlCursor | undefined

      while (true) {
        const payload = await fetchEnvelope(
          buildCrawlGetUrl(settings, jobRef.current.id, {
            cursor,
            limit: filtersRef.current.pageSize,
            status: filtersRef.current.status,
          }),
          {
            headers: {
              Authorization: `Bearer ${settings.apiToken}`,
            },
          },
        )

        const page = normalizeCrawlResultsPage(payload)
        collected.push(...page.records)

        if (page.cursor === undefined) break
        cursor = page.cursor
      }

      await downloadCrawlResultsZip(jobRef.current, collected)
    } catch (error) {
      setJobError(error instanceof Error ? error.message : 'Failed to export crawl results.')
    } finally {
      if (isMountedRef.current) {
        setExporting(false)
      }
    }
  }, [fetchEnvelope, settings])

  const selectRecord = useCallback((index: number) => {
    setSelectedRecordIndex(index)
  }, [])

  useEffect(() => {
    if (!job || job.status !== 'running') return

    const delay = settings.plan === 'free'
      ? (visibilityState === 'hidden' ? 30000 : 15000)
      : (visibilityState === 'hidden' ? 15000 : 5000)

    const timer = window.setTimeout(() => {
      void refreshSummary({ origin: 'poll' })
    }, delay)

    return () => window.clearTimeout(timer)
  }, [job, refreshSummary, settings.plan, visibilityState, lastRefreshedAt])

  return {
    availableInspectorTabs,
    cancelling,
    creating,
    exportFilteredResults,
    exporting,
    filteredRecordIndexes,
    filters,
    goToNextPage,
    goToPreviousPage,
    hasNextPage: Boolean(resultsPage?.cursor),
    hasPreviousPage: pageIndex > 0,
    job,
    jobError,
    jobStartedAt,
    lastRefreshedAt,
    pageIndex,
    polling,
    refreshAll,
    refreshingResults,
    refreshingSummary,
    resultsError,
    resultsPage,
    selectedInspectorTab,
    selectedRecord,
    selectedRecordIndex,
    selectRecord,
    setInspectorTab: setSelectedInspectorTab,
    setPageSize,
    setSearch,
    setStatusFilter,
    startJob,
    cancelJob,
  }
}
