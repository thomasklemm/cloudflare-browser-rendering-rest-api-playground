import type { RefObject } from 'react'
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Play, Loader2, AlertTriangle, Globe, Code } from 'lucide-react'
import type { EndpointConfig, FieldConfig, InputMode } from '../types/api'

interface EndpointFormProps {
  endpoint: EndpointConfig
  values: Record<string, string>
  onChange: (name: string, value: string) => void
  onSubmit: () => void
  loading: boolean
  settingsReady: boolean
  submitRef?: RefObject<HTMLButtonElement | null>
}

function FieldInput({
  field,
  value,
  onChange,
  error,
}: {
  field: FieldConfig
  value: string
  onChange: (value: string) => void
  error: boolean
}) {
  const border = error
    ? 'border-red-500/60 focus:border-red-400'
    : 'border-surface-300 focus:border-accent-500'

  switch (field.type) {
    case 'textarea':
    case 'json':
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={field.type === 'json' ? 4 : 3}
          className={`w-full px-3 py-2 bg-surface-200 border ${border} rounded-lg text-sm text-surface-900 placeholder:text-surface-500 focus:outline-none resize-y font-mono`}
        />
      )
    case 'select':
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 bg-surface-200 border ${border} rounded-lg text-sm text-surface-900 focus:outline-none`}
        >
          <option value="">-- select --</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )
    case 'boolean':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value === 'true'}
            onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
            className="w-4 h-4 rounded border-surface-400 accent-accent-500"
          />
          <span className="text-sm text-surface-700">{value === 'true' ? 'Yes' : 'No'}</span>
        </label>
      )
    default:
      return (
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={`w-full px-3 py-2 bg-surface-200 border ${border} rounded-lg text-sm text-surface-900 placeholder:text-surface-500 focus:outline-none`}
        />
      )
  }
}

function getMissingRequired(
  endpoint: EndpointConfig,
  values: Record<string, string>,
  inputMode: InputMode,
): Set<string> {
  const missing = new Set<string>()

  // Validate URL/HTML input
  if (endpoint.hasUrlHtmlInput) {
    const activeField = inputMode === 'url' ? 'url' : 'html'
    if (!values[activeField]?.trim()) {
      missing.add(activeField)
    }
  }

  for (const field of endpoint.fields) {
    if (field.required && !values[field.name]?.trim()) {
      missing.add(field.name)
    }
  }
  return missing
}

export function EndpointForm({ endpoint, values, onChange, onSubmit, loading, settingsReady, submitRef }: EndpointFormProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)
  const [inputMode, setInputModeState] = useState<InputMode>(
    (values.html?.trim() && !values.url?.trim()) ? 'html' : 'url',
  )

  const setInputMode = (mode: InputMode) => {
    setInputModeState(mode)
    // Clear the other field when switching modes
    if (mode === 'url') {
      onChange('html', '')
    } else {
      onChange('url', '')
    }
  }

  // Reset submitted state when switching endpoints
  useEffect(() => {
    setSubmitted(false)
  }, [endpoint.id])

  const missingRequired = getMissingRequired(endpoint, values, inputMode)
  const formReady = missingRequired.size === 0

  const handleSubmit = () => {
    setSubmitted(true)
    if (!formReady) return
    onSubmit()
  }

  const mainFields = endpoint.fields.filter((f) => !f.section)
  const sections = new Map<string, FieldConfig[]>()
  for (const field of endpoint.fields) {
    if (field.section) {
      if (!sections.has(field.section)) sections.set(field.section, [])
      sections.get(field.section)!.push(field)
    }
  }

  const toggleSection = (name: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const showError = (field: FieldConfig) =>
    submitted && !!field.required && missingRequired.has(field.name)

  const urlHtmlError = (name: string) =>
    submitted && missingRequired.has(name)

  return (
    <div className="space-y-4">
      <p className="text-xs text-surface-500">{endpoint.description}</p>

      {/* URL / HTML input toggle */}
      {endpoint.hasUrlHtmlInput && (
        <div>
          <div className="flex items-center gap-1 mb-2">
            <button
              type="button"
              onClick={() => setInputMode('url')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                inputMode === 'url'
                  ? 'bg-surface-300 text-surface-900'
                  : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              URL
            </button>
            <button
              type="button"
              onClick={() => setInputMode('html')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                inputMode === 'html'
                  ? 'bg-surface-300 text-surface-900'
                  : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              HTML
            </button>
          </div>

          {inputMode === 'url' ? (
            <div>
              <input
                type="text"
                value={values.url || ''}
                onChange={(e) => onChange('url', e.target.value)}
                placeholder="https://example.com"
                className={`w-full px-3 py-2 bg-surface-200 border ${
                  urlHtmlError('url')
                    ? 'border-red-500/60 focus:border-red-400'
                    : 'border-surface-300 focus:border-accent-500'
                } rounded-lg text-sm text-surface-900 placeholder:text-surface-500 focus:outline-none`}
              />
              {urlHtmlError('url') && (
                <p className="text-xs text-red-400 mt-1">URL is required</p>
              )}
            </div>
          ) : (
            <div>
              <textarea
                value={values.html || ''}
                onChange={(e) => onChange('html', e.target.value)}
                placeholder="<html><body><h1>Hello</h1></body></html>"
                rows={4}
                className={`w-full px-3 py-2 bg-surface-200 border ${
                  urlHtmlError('html')
                    ? 'border-red-500/60 focus:border-red-400'
                    : 'border-surface-300 focus:border-accent-500'
                } rounded-lg text-sm text-surface-900 placeholder:text-surface-500 focus:outline-none resize-y font-mono`}
              />
              {urlHtmlError('html') && (
                <p className="text-xs text-red-400 mt-1">HTML is required</p>
              )}
            </div>
          )}
        </div>
      )}

      {mainFields.map((field) => (
        <div key={field.name}>
          <label className="block text-xs text-surface-600 mb-1">
            {field.label}
            {field.required && <span className="text-accent-500 ml-1">*</span>}
          </label>
          <FieldInput
            field={field}
            value={values[field.name] || ''}
            onChange={(v) => onChange(field.name, v)}
            error={showError(field)}
          />
          {showError(field) ? (
            <p className="text-xs text-red-400 mt-1">{field.label} is required</p>
          ) : field.hint ? (
            <p className="text-xs text-surface-500 mt-1">{field.hint}</p>
          ) : null}
        </div>
      ))}

      {[...sections.entries()].map(([name, fields]) => (
        <div key={name} className="border border-surface-300 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection(name)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-surface-600 hover:bg-surface-200 transition-colors"
            type="button"
          >
            {expandedSections.has(name) ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            {name}
          </button>
          {expandedSections.has(name) && (
            <div className="px-3 pb-3 space-y-3">
              {fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-xs text-surface-600 mb-1">
                    {field.label}
                    {field.required && <span className="text-accent-500 ml-1">*</span>}
                  </label>
                  <FieldInput
                    field={field}
                    value={values[field.name] || ''}
                    onChange={(v) => onChange(field.name, v)}
                    error={showError(field)}
                  />
                  {showError(field) ? (
                    <p className="text-xs text-red-400 mt-1">{field.label} is required</p>
                  ) : field.hint ? (
                    <p className="text-xs text-surface-500 mt-1">{field.hint}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {!settingsReady && (
        <div className="flex items-start gap-2.5 px-3 py-2.5 bg-accent-500/10 border border-accent-500/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-accent-500 shrink-0 mt-0.5" />
          <p className="text-xs text-surface-700">
            Configure your <span className="text-surface-900">Account ID</span> and{' '}
            <span className="text-surface-900">API Token</span> in the settings panel above before sending requests.
          </p>
        </div>
      )}

      <button
        ref={submitRef}
        onClick={handleSubmit}
        disabled={loading || !settingsReady}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-500 hover:bg-accent-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        {loading ? 'Sending...' : 'Send Request'}
        {!loading && (
          <kbd className="ml-2 text-xs opacity-60 hidden sm:inline">Cmd+Enter</kbd>
        )}
      </button>
    </div>
  )
}
