import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import type { EndpointId, InputMode, Settings, WorkersPlan } from './types/api'
import { endpoints } from './config/endpoints'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useBatchApiRequest } from './hooks/useBatchApiRequest'
import { buildCurlCommand } from './lib/buildRequest'
import { Header } from './components/Header'
import { SettingsPanel } from './components/SettingsPanel'
import { EndpointTabs } from './components/EndpointTabs'
import { EndpointForm } from './components/EndpointForm'
import { CurlPreview } from './components/CurlPreview'
import { ResponsePanel } from './components/ResponsePanel'

interface SettingsPreferences {
  accountId: string
  plan: WorkersPlan
  rememberApiToken: boolean
}

export default function App() {
  const [settingsPrefs, setSettingsPrefs] = useLocalStorage<SettingsPreferences>('cf-br-settings', {
    accountId: '',
    plan: 'free',
    rememberApiToken: false,
  })
  const [sessionApiToken, setSessionApiToken] = useLocalStorage<string>('cf-br-api-token-session', '', 'session')
  const [rememberedApiToken, setRememberedApiToken] = useLocalStorage<string>('cf-br-api-token', '')
  const [showSettings, setShowSettings] = useState(false)
  const [activeEndpoint, setActiveEndpoint] = useState<EndpointId>('screenshot')
  const [formValues, setFormValues] = useLocalStorage<Record<string, Record<string, string>>>(
    'cf-br-form-values',
    {},
  )
  // Shared URL input — persists across endpoint tabs
  const [urlInput, setUrlInput] = useLocalStorage<string>('cf-br-urls', '')
  const [inputMode, setInputMode] = useLocalStorage<InputMode>('cf-br-input-mode', 'url')

  const legacySettingsMigrated = useRef(false)

  const { entries, activeIndex, setActiveIndex, loading, execute, switchTo } = useBatchApiRequest()

  const endpoint = endpoints.find((e) => e.id === activeEndpoint)!
  const settings = useMemo<Settings>(
    () => ({
      accountId: settingsPrefs.accountId,
      apiToken: settingsPrefs.rememberApiToken ? rememberedApiToken : sessionApiToken,
      plan: settingsPrefs.plan,
      rememberApiToken: settingsPrefs.rememberApiToken,
    }),
    [settingsPrefs, rememberedApiToken, sessionApiToken],
  )
  const currentValues = useMemo(
    () => formValues[activeEndpoint] || {},
    [formValues, activeEndpoint],
  )

  // Migrate legacy localStorage token from previous settings shape.
  useEffect(() => {
    if (legacySettingsMigrated.current) return
    legacySettingsMigrated.current = true

    const legacyToken = (settingsPrefs as SettingsPreferences & { apiToken?: string }).apiToken
    if (!legacyToken || rememberedApiToken || sessionApiToken) return

    setRememberedApiToken(legacyToken)
    setSettingsPrefs((prev) => ({ ...prev, rememberApiToken: true }))
  }, [settingsPrefs, rememberedApiToken, sessionApiToken, setRememberedApiToken, setSettingsPrefs])

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

  const handleEndpointChange = useCallback(
    (id: EndpointId) => {
      setActiveEndpoint(id)
      switchTo(id)
    },
    [switchTo],
  )

  const handleSettingsChange = useCallback(
    (next: Settings) => {
      setSettingsPrefs({
        accountId: next.accountId,
        plan: next.plan,
        rememberApiToken: next.rememberApiToken,
      })

      if (next.rememberApiToken) {
        setRememberedApiToken(next.apiToken)
        setSessionApiToken('')
      } else {
        setSessionApiToken(next.apiToken)
        setRememberedApiToken('')
      }
    },
    [setSettingsPrefs, setRememberedApiToken, setSessionApiToken],
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
  const curl = buildCurlCommand(endpoint, settings, curlValues)

  // Active response for the selected tab
  const activeEntry = entries[activeIndex] || null

  return (
    <div className="h-screen flex flex-col">
      <Header
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings((s) => !s)}
      />

      {showSettings && (
        <SettingsPanel settings={settings} onChange={handleSettingsChange} onClose={() => setShowSettings(false)} />
      )}

      <EndpointTabs
        endpoints={endpoints}
        activeId={activeEndpoint}
        onSelect={handleEndpointChange}
      />

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 px-6 pb-6 gap-6">
        {/* Left: Form + Curl */}
        <div className="lg:w-[400px] shrink-0 flex flex-col gap-6 overflow-y-auto glass-panel rounded-xl shadow-2xl p-4 animate-slide-left">
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
          <CurlPreview curl={curl} />
        </div>

        {/* Right: Response */}
        <div className="flex-1 flex flex-col min-h-0 rounded-xl overflow-hidden shadow-2xl animate-fade-scale">
          <ResponsePanel
            entries={entries}
            activeIndex={activeIndex}
            onSelectIndex={setActiveIndex}
            responseType={endpoint.responseType}
            loading={loading}
            response={activeEntry?.response || null}
            entryLoading={activeEntry?.loading || false}
          />
        </div>
      </div>
    </div>
  )
}
