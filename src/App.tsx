import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import type { EndpointId, InputMode, Settings } from './types/api'
import { CRAWL_DEFAULTS } from './config/crawl'
import { endpoints } from './config/endpoints'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useBatchApiRequest } from './hooks/useBatchApiRequest'
import { buildCurlCommand } from './lib/buildRequest'
import {
  buildCrawlCreateCurlCommand,
  buildCrawlDeleteCurlCommand,
  buildCrawlGetCurlCommand,
  validateCrawlFormValues,
} from './lib/crawl'
import { useCrawlJob } from './hooks/useCrawlJob'
import { Header } from './components/Header'
import { SettingsPanel } from './components/SettingsPanel'
import { EndpointTabs } from './components/EndpointTabs'
import { EndpointForm } from './components/EndpointForm'
import { CurlPreview } from './components/CurlPreview'
import { ResponsePanel } from './components/ResponsePanel'
import { CrawlForm } from './components/crawl/CrawlForm'
import { CrawlWorkspace } from './components/crawl/CrawlWorkspace'
import type { CrawlCreateFormValues } from './types/crawl'
import type { CrawlFieldErrors } from './lib/crawl'

export default function App() {
  const [settings, setSettings] = useLocalStorage<Settings>('cf-br-settings', {
    accountId: '',
    apiToken: '',
    plan: 'free',
  })
  const [showSettings, setShowSettings] = useState(false)
  const [activeEndpoint, setActiveEndpoint] = useState<EndpointId>('screenshot')
  const [formValues, setFormValues] = useLocalStorage<Record<string, Record<string, string>>>(
    'cf-br-form-values',
    {},
  )
  // Shared URL input — persists across endpoint tabs
  const [urlInput, setUrlInput] = useLocalStorage<string>('cf-br-urls', '')
  const [inputMode, setInputMode] = useLocalStorage<InputMode>('cf-br-input-mode', 'url')
  const [crawlFormValues, setCrawlFormValues] = useLocalStorage<CrawlCreateFormValues>(
    'cf-br-crawl-form-values',
    CRAWL_DEFAULTS,
  )
  const [crawlErrors, setCrawlErrors] = useState<CrawlFieldErrors>({})

  const { entries, activeIndex, setActiveIndex, loading, execute, switchTo } = useBatchApiRequest()
  const crawlJob = useCrawlJob(settings)

  const endpoint = endpoints.find((e) => e.id === activeEndpoint)!
  const currentValues = useMemo(
    () => formValues[activeEndpoint] || {},
    [formValues, activeEndpoint],
  )

  const handleFieldChange = useCallback(
    (name: string, value: string) => {
      setFormValues((prev) => ({
        ...prev,
        [activeEndpoint]: {
          ...prev[activeEndpoint],
          [name]: value,
        },
      }))
    },
    [activeEndpoint, setFormValues],
  )

  const handleCrawlFieldChange = useCallback(
    <K extends keyof CrawlCreateFormValues>(name: K, value: CrawlCreateFormValues[K]) => {
      setCrawlErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        if (name === 'formats') {
          delete next.formats
          delete next.jsonPrompt
          delete next.jsonResponseFormat
        }
        return next
      })
      setCrawlFormValues((prev) => ({
        ...prev,
        [name]: value,
      }))
    },
    [setCrawlFormValues],
  )

  const handleEndpointChange = useCallback(
    (id: EndpointId) => {
      setActiveEndpoint(id)
      switchTo(id)
    },
    [switchTo],
  )

  const settingsReady = Boolean(settings.accountId && settings.apiToken)
  const formSubmitRef = useRef<HTMLButtonElement>(null)

  // Parse URLs from the textarea (one per line)
  const urls = urlInput
    .split('\n')
    .map((u) => u.trim())
    .filter(Boolean)

  const handleSubmit = useCallback(() => {
    if (!settingsReady) {
      setShowSettings(true)
      return
    }

    if (inputMode === 'html') {
      // HTML mode: single request
      execute(endpoint, settings, { ...currentValues, html: currentValues.html || '' }, ['__html__'])
    } else {
      // URL mode: batch requests
      execute(endpoint, settings, currentValues, urls)
    }
  }, [settingsReady, endpoint, settings, currentValues, urls, inputMode, execute])

  const handleCrawlSubmit = useCallback(async () => {
    if (!settingsReady) {
      setShowSettings(true)
      return
    }

    const errors = validateCrawlFormValues(crawlFormValues, settings.plan)
    setCrawlErrors(errors)

    if (Object.keys(errors).length > 0) {
      return
    }

    if (crawlJob.job && !window.confirm('Start a new crawl and replace the current in-memory crawl job state?')) {
      return
    }

    await crawlJob.startJob(crawlFormValues)
  }, [crawlFormValues, crawlJob, settings.plan, settingsReady])

  // Cmd+Enter shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        formSubmitRef.current?.click()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Build curl for the currently selected response tab's URL
  const activeUrl = entries[activeIndex]?.url || urls[0] || ''
  const curlValues = inputMode === 'html'
    ? { ...currentValues, html: currentValues.html || '' }
    : { ...currentValues, url: activeUrl }
  const curl = activeEndpoint === 'crawl'
    ? buildCrawlCreateCurlCommand(settings, crawlFormValues)
    : buildCurlCommand(endpoint, settings, curlValues)
  const pollCurl = buildCrawlGetCurlCommand(
    settings,
    crawlJob.job?.id || '<JOB_ID>',
    { limit: 1 },
  )
  const cancelCurl = buildCrawlDeleteCurlCommand(settings, crawlJob.job?.id || '<JOB_ID>')

  // Active response for the selected tab
  const activeEntry = entries[activeIndex] || null
  const crawlRecords = useMemo(
    () => (crawlJob.resultsPage?.records || []).map((record, index) => ({
      finalUrl: record.finalUrl,
      httpStatus: record.httpStatus,
      index,
      status: record.status,
      title: record.title,
      url: record.url,
    })),
    [crawlJob.resultsPage],
  )

  return (
    <div className="h-screen flex flex-col">
      <Header
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings((s) => !s)}
      />

      {showSettings && (
        <SettingsPanel settings={settings} onChange={setSettings} onClose={() => setShowSettings(false)} />
      )}

      <EndpointTabs
        endpoints={endpoints}
        activeId={activeEndpoint}
        onSelect={handleEndpointChange}
      />

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 px-6 pb-6 gap-6">
        {/* Left: Form + Curl */}
        <div className="lg:w-[400px] shrink-0 flex flex-col gap-6 overflow-y-auto glass-panel rounded-xl shadow-2xl p-4 animate-slide-left">
          {activeEndpoint === 'crawl' ? (
            <CrawlForm
              errors={crawlErrors}
              jobExists={Boolean(crawlJob.job)}
              loading={crawlJob.creating}
              onChange={handleCrawlFieldChange}
              onSubmit={() => { void handleCrawlSubmit() }}
              settingsReady={settingsReady}
              submitRef={formSubmitRef}
              values={crawlFormValues}
            />
          ) : (
            <EndpointForm
              endpoint={endpoint}
              values={currentValues}
              onChange={handleFieldChange}
              onSubmit={handleSubmit}
              loading={loading}
              settingsReady={settingsReady}
              submitRef={formSubmitRef}
              urlInput={urlInput}
              onUrlInputChange={setUrlInput}
              inputMode={inputMode}
              onInputModeChange={setInputMode}
              urlCount={urls.length}
            />
          )}
          <CurlPreview curl={curl} />
        </div>

        {/* Right: Response */}
        <div className="flex-1 flex flex-col min-h-0 rounded-xl overflow-hidden shadow-2xl animate-fade-scale">
          {activeEndpoint === 'crawl' ? (
            <CrawlWorkspace
              availableInspectorTabs={crawlJob.availableInspectorTabs}
              cancelling={crawlJob.cancelling}
              cancelCurl={cancelCurl}
              exporting={crawlJob.exporting}
              filteredRecordIndexes={crawlJob.filteredRecordIndexes}
              filters={crawlJob.filters}
              hasNextPage={crawlJob.hasNextPage}
              hasPreviousPage={crawlJob.hasPreviousPage}
              job={crawlJob.job}
              jobError={crawlJob.jobError}
              jobStartedAt={crawlJob.jobStartedAt}
              lastRefreshedAt={crawlJob.lastRefreshedAt}
              onCancel={crawlJob.cancelJob}
              onExport={crawlJob.exportFilteredResults}
              onNextPage={crawlJob.goToNextPage}
              onPageSizeChange={crawlJob.setPageSize}
              onPreviousPage={crawlJob.goToPreviousPage}
              onRefresh={crawlJob.refreshAll}
              onSearchChange={crawlJob.setSearch}
              onSelectRecord={crawlJob.selectRecord}
              onStatusChange={crawlJob.setStatusFilter}
              pageIndex={crawlJob.pageIndex}
              pollCurl={pollCurl}
              polling={crawlJob.polling}
              records={crawlRecords}
              refreshingResults={crawlJob.refreshingResults}
              refreshingSummary={crawlJob.refreshingSummary}
              resultsError={crawlJob.resultsError}
              selectedInspectorTab={crawlJob.selectedInspectorTab}
              selectedRecord={crawlJob.selectedRecord}
              selectedRecordIndex={crawlJob.selectedRecordIndex}
              setInspectorTab={crawlJob.setInspectorTab}
            />
          ) : (
            <ResponsePanel
              entries={entries}
              activeIndex={activeIndex}
              onSelectIndex={setActiveIndex}
              responseType={endpoint.responseType}
              loading={loading}
              response={activeEntry?.response || null}
              entryLoading={activeEntry?.loading || false}
            />
          )}
        </div>
      </div>
    </div>
  )
}
