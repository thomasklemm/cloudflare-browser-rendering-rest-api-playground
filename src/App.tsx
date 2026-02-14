import { useState, useCallback, useEffect, useRef } from 'react'
import type { EndpointId, Settings } from './types/api'
import { endpoints } from './config/endpoints'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useApiRequest } from './hooks/useApiRequest'
import { buildCurlCommand } from './lib/buildRequest'
import { Header } from './components/Header'
import { SettingsPanel } from './components/SettingsPanel'
import { EndpointTabs } from './components/EndpointTabs'
import { EndpointForm } from './components/EndpointForm'
import { CurlPreview } from './components/CurlPreview'
import { ResponsePanel } from './components/ResponsePanel'

export default function App() {
  const [settings, setSettings] = useLocalStorage<Settings>('cf-br-settings', {
    accountId: '',
    apiToken: '',
  })
  const [showSettings, setShowSettings] = useState(!settings.accountId || !settings.apiToken)
  const [activeEndpoint, setActiveEndpoint] = useState<EndpointId>('content')
  const [formValues, setFormValues] = useLocalStorage<Record<string, Record<string, string>>>(
    'cf-br-form-values',
    {},
  )

  const { loading, response, execute, reset } = useApiRequest()

  const endpoint = endpoints.find((e) => e.id === activeEndpoint)!
  const currentValues = formValues[activeEndpoint] || {}

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

  // Sync URL across tabs: when switching endpoints, copy url from previous
  const handleEndpointChange = useCallback(
    (id: EndpointId) => {
      const currentUrl = formValues[activeEndpoint]?.url
      if (currentUrl && !formValues[id]?.url) {
        setFormValues((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            url: currentUrl,
          },
        }))
      }
      setActiveEndpoint(id)
      reset()
    },
    [activeEndpoint, formValues, setFormValues, reset],
  )

  const settingsReady = Boolean(settings.accountId && settings.apiToken)
  const formSubmitRef = useRef<HTMLButtonElement>(null)

  const handleSubmit = useCallback(() => {
    if (!settingsReady) {
      setShowSettings(true)
      return
    }
    execute(endpoint, settings, currentValues)
  }, [settingsReady, endpoint, settings, currentValues, execute])

  // Cmd+Enter shortcut -- click the form's submit button so validation runs
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

  const curl = buildCurlCommand(endpoint, settings, currentValues)

  return (
    <div className="h-screen flex flex-col bg-surface-50">
      <Header
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings((s) => !s)}
      />

      {showSettings && (
        <SettingsPanel settings={settings} onChange={setSettings} />
      )}

      <EndpointTabs
        endpoints={endpoints}
        activeId={activeEndpoint}
        onSelect={handleEndpointChange}
      />

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left: Form + Curl */}
        <div className="lg:w-[420px] shrink-0 border-r border-surface-300 overflow-y-auto p-6 space-y-6">
          <EndpointForm
            endpoint={endpoint}
            values={currentValues}
            onChange={handleFieldChange}
            onSubmit={handleSubmit}
            loading={loading}
            settingsReady={settingsReady}
            submitRef={formSubmitRef}
          />
          <CurlPreview curl={curl} />
        </div>

        {/* Right: Response */}
        <div className="flex-1 flex flex-col min-h-0">
          <ResponsePanel
            response={response}
            responseType={endpoint.responseType}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}
