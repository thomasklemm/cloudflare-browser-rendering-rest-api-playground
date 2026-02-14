import type { RefObject } from 'react'
import { useState } from 'react'
import { ChevronDown, ChevronRight, Play, Loader2, AlertTriangle, Globe, Code, Cookie, ImageDown, Ruler } from 'lucide-react'
import type { EndpointConfig, FieldConfig, InputMode } from '../types/api'
import { JsonSchemaBuilder } from './JsonSchemaBuilder'

// Quick-start examples for the /json endpoint.
// Ordered: broad/any-page → landing pages → content verticals → technical.
interface JsonExample {
  label: string
  group: string
  prompt: string
  schema: string
}

const JSON_EXAMPLES: JsonExample[] = [
  // --- Works on any page ---
  {
    label: 'Page links',
    group: 'Any page',
    prompt: 'Extract all links from this page with their text and URLs',
    schema: JSON.stringify({
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          links: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                url: { type: 'string' },
              },
              required: ['text', 'url'],
            },
          },
        },
        required: ['links'],
      },
    }),
  },
  {
    label: 'Headings',
    group: 'Any page',
    prompt: 'Extract all headings from the page organized by level',
    schema: JSON.stringify({
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          h1: { type: 'string' },
          h2: { type: 'array', items: { type: 'string' } },
          h3: { type: 'array', items: { type: 'string' } },
        },
        required: ['h1'],
      },
    }),
  },
  {
    label: 'SEO meta',
    group: 'Any page',
    prompt: 'Extract SEO metadata including title, description, Open Graph tags, and canonical URL',
    schema: JSON.stringify({
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          canonical_url: { type: 'string' },
          og_title: { type: 'string' },
          og_description: { type: 'string' },
          og_image: { type: 'string' },
        },
        required: ['title'],
      },
    }),
  },
  // --- Homepages & landing pages ---
  {
    label: 'Company overview',
    group: 'Landing pages',
    prompt: 'Extract the company or product name, tagline, and a brief description of what they do',
    schema: JSON.stringify({
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          tagline: { type: 'string' },
          description: { type: 'string' },
          industry: { type: 'string' },
          founded: { type: 'string' },
        },
        required: ['name'],
      },
    }),
  },
  {
    label: 'Features',
    group: 'Landing pages',
    prompt: 'Extract all product features or benefits listed on this page',
    schema: JSON.stringify({
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          features: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
              },
              required: ['name'],
            },
          },
        },
        required: ['features'],
      },
    }),
  },
  {
    label: 'Testimonials',
    group: 'Landing pages',
    prompt: 'Extract all customer testimonials or reviews from this page',
    schema: JSON.stringify({
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          testimonials: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                quote: { type: 'string' },
                author: { type: 'string' },
                role: { type: 'string' },
                company: { type: 'string' },
              },
              required: ['quote'],
            },
          },
        },
        required: ['testimonials'],
      },
    }),
  },
  // --- Content verticals ---
  {
    label: 'Article',
    group: 'Content',
    prompt: 'Extract the article title, author, publication date, and a brief summary',
    schema: JSON.stringify({
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          author: { type: 'string' },
          date: { type: 'string' },
          summary: { type: 'string' },
        },
        required: ['title'],
      },
    }),
  },
  {
    label: 'Product info',
    group: 'Content',
    prompt: 'Extract product information from this page',
    schema: JSON.stringify({
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          price: { type: 'number' },
          currency: { type: 'string' },
          description: { type: 'string' },
          availability: { type: 'string' },
        },
        required: ['name', 'price'],
      },
    }),
  },
  {
    label: 'Pricing',
    group: 'Content',
    prompt: 'Extract all pricing plans and their features from this page',
    schema: JSON.stringify({
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          plans: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                price: { type: 'string' },
                billing_period: { type: 'string' },
                features: { type: 'array', items: { type: 'string' } },
              },
              required: ['name', 'price'],
            },
          },
        },
        required: ['plans'],
      },
    }),
  },
  {
    label: 'Contact info',
    group: 'Content',
    prompt: 'Extract business contact information from this page',
    schema: JSON.stringify({
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          company_name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'string' },
          social_links: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                platform: { type: 'string' },
                url: { type: 'string' },
              },
              required: ['platform', 'url'],
            },
          },
        },
        required: ['company_name'],
      },
    }),
  },
  {
    label: 'Events',
    group: 'Content',
    prompt: 'Extract all events or scheduled items from this page',
    schema: JSON.stringify({
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                date: { type: 'string' },
                time: { type: 'string' },
                location: { type: 'string' },
                description: { type: 'string' },
              },
              required: ['name'],
            },
          },
        },
        required: ['events'],
      },
    }),
  },
  // --- Technical / structural ---
  {
    label: 'Table data',
    group: 'Content',
    prompt: 'Extract all tabular data from this page as structured rows',
    schema: JSON.stringify({
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          tables: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                caption: { type: 'string' },
                headers: { type: 'array', items: { type: 'string' } },
                rows: { type: 'array', items: { type: 'array', items: { type: 'string' } } },
              },
              required: ['headers', 'rows'],
            },
          },
        },
        required: ['tables'],
      },
    }),
  },
]

interface EndpointFormProps {
  endpoint: EndpointConfig
  values: Record<string, string>
  onChange: (name: string, value: string) => void
  onSubmit: () => void
  loading: boolean
  settingsReady: boolean
  submitRef?: RefObject<HTMLButtonElement | null>
  urlInput: string
  onUrlInputChange: (value: string) => void
  inputMode: InputMode
  onInputModeChange: (mode: InputMode) => void
  urlCount: number
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
  urlCount: number,
): Set<string> {
  const missing = new Set<string>()

  // Validate URL/HTML input
  if (endpoint.hasUrlHtmlInput) {
    if (inputMode === 'url') {
      if (urlCount === 0) missing.add('url')
    } else {
      if (!values.html?.trim()) missing.add('html')
    }
  }

  for (const field of endpoint.fields) {
    if (field.required && !values[field.name]?.trim()) {
      missing.add(field.name)
    }
  }
  return missing
}

export function EndpointForm({
  endpoint,
  values,
  onChange,
  onSubmit,
  loading,
  settingsReady,
  submitRef,
  urlInput,
  onUrlInputChange,
  inputMode,
  onInputModeChange,
  urlCount,
}: EndpointFormProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  // Track which endpoint was submitted to auto-reset when switching
  const [submittedEndpoint, setSubmittedEndpoint] = useState<string | null>(null)
  const submitted = submittedEndpoint === endpoint.id

  const missingRequired = getMissingRequired(endpoint, values, inputMode, urlCount)
  const formReady = missingRequired.size === 0

  const handleSubmit = () => {
    setSubmittedEndpoint(endpoint.id)
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

  // Dynamic submit button label
  const submitLabel = loading
    ? 'Sending...'
    : inputMode === 'html'
      ? 'Send Request'
      : urlCount <= 1
        ? 'Send Request'
        : `Send ${urlCount} Requests`

  return (
    <div className="space-y-4">
      <p className="text-xs text-surface-500">{endpoint.description}</p>

      {/* URL / HTML input toggle */}
      {endpoint.hasUrlHtmlInput && (
        <div>
          <div className="flex items-center gap-1 mb-2">
            <button
              type="button"
              onClick={() => onInputModeChange('url')}
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
              onClick={() => onInputModeChange('html')}
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
              <textarea
                value={urlInput}
                onChange={(e) => onUrlInputChange(e.target.value)}
                placeholder={"https://example.com\nhttps://another.com"}
                rows={Math.max(2, Math.min(6, urlInput.split('\n').length + 1))}
                className={`w-full px-3 py-2 bg-surface-200 border ${
                  urlHtmlError('url')
                    ? 'border-red-500/60 focus:border-red-400'
                    : 'border-surface-300 focus:border-accent-500'
                } rounded-lg text-sm text-surface-900 placeholder:text-surface-500 focus:outline-none resize-y font-mono`}
              />
              {urlCount > 1 && (
                <p className="text-xs text-surface-500 mt-1">{urlCount} URLs (one per line)</p>
              )}
              {urlHtmlError('url') && (
                <p className="text-xs text-red-400 mt-1">At least one URL is required</p>
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

      {/* Script injection toggles */}
      {endpoint.hasUrlHtmlInput && (
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer px-3 py-2 bg-surface-200 border border-surface-300 rounded-lg">
            <input
              type="checkbox"
              checked={values._dismissCookies === 'true'}
              onChange={(e) => onChange('_dismissCookies', e.target.checked ? 'true' : 'false')}
              className="w-4 h-4 rounded border-surface-400 accent-accent-500"
            />
            <Cookie className="w-3.5 h-3.5 text-surface-500" />
            <div>
              <span className="text-xs text-surface-800">Dismiss cookie banners</span>
              <p className="text-xs text-surface-500">Blocks CMP scripts and clicks reject/accept buttons</p>
            </div>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer px-3 py-2 bg-surface-200 border border-surface-300 rounded-lg">
            <input
              type="checkbox"
              checked={values._loadAllImages === 'true'}
              onChange={(e) => onChange('_loadAllImages', e.target.checked ? 'true' : 'false')}
              className="w-4 h-4 rounded border-surface-400 accent-accent-500"
            />
            <ImageDown className="w-3.5 h-3.5 text-surface-500" />
            <div>
              <span className="text-xs text-surface-800">Load all images</span>
              <p className="text-xs text-surface-500">Swaps lazy-load attributes to force all images to load</p>
            </div>
          </label>
          {inputMode === 'url' && ['screenshot', 'snapshot', 'pdf'].includes(endpoint.id) && (
            <label className="flex items-center gap-2.5 cursor-pointer px-3 py-2 bg-surface-200 border border-surface-300 rounded-lg">
              <input
                type="checkbox"
                checked={values._detectWidth === 'true'}
                onChange={(e) => onChange('_detectWidth', e.target.checked ? 'true' : 'false')}
                className="w-4 h-4 rounded border-surface-400 accent-accent-500"
              />
              <Ruler className="w-3.5 h-3.5 text-surface-500" />
              <div>
                <span className="text-xs text-surface-800">Auto-detect content width</span>
                <p className="text-xs text-surface-500">Two sequential requests per URL — first detects the page's max-width, then uses it as the viewport width</p>
              </div>
            </label>
          )}
        </div>
      )}

      {/* Quick-start examples for /json endpoint */}
      {endpoint.id === 'json' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-600">Quick start</span>
            {(values.prompt || values.response_format) && (
              <button
                type="button"
                onClick={() => {
                  onChange('prompt', '')
                  onChange('response_format', '')
                }}
                className="px-2 py-0.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
              >
                Clear prompt & schema
              </button>
            )}
          </div>
          {(() => {
            const groups: { name: string; items: JsonExample[] }[] = []
            for (const ex of JSON_EXAMPLES) {
              const last = groups[groups.length - 1]
              if (last && last.name === ex.group) {
                last.items.push(ex)
              } else {
                groups.push({ name: ex.group, items: [ex] })
              }
            }
            return groups.map((g) => (
              <div key={g.name} className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-surface-500 w-full">{g.name}</span>
                {g.items.map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => {
                      onChange('prompt', ex.prompt)
                      onChange('response_format', ex.schema)
                    }}
                    className="px-2.5 py-1 text-xs bg-surface-200 border border-surface-300 rounded-md text-surface-700 hover:bg-surface-300 hover:text-surface-900 transition-colors"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            ))
          })()}
        </div>
      )}

      {mainFields.map((field) =>
        field.name === 'response_format' ? (
          <JsonSchemaBuilder
            key={field.name}
            value={values[field.name] || ''}
            onChange={(v) => onChange(field.name, v)}
          />
        ) : (
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
        ),
      )}

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
        {submitLabel}
        {!loading && (
          <kbd className="ml-2 text-xs opacity-60 hidden sm:inline">Cmd+Enter</kbd>
        )}
      </button>
    </div>
  )
}
