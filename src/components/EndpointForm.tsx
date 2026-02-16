import type { RefObject } from 'react'
import { useState } from 'react'
import { ChevronDown, ChevronRight, Play, Loader2, AlertTriangle, Globe, Code, Cookie, ImageDown, Info } from 'lucide-react'
import type { EndpointConfig, FieldConfig, InputMode } from '../types/api'
import { JsonSchemaBuilder } from './JsonSchemaBuilder'
import { Toggle } from './Toggle'

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
    label: 'Page summary',
    group: 'Any page',
    prompt: 'Summarize this page: extract the title, write a concise summary, identify the main topics, classify the content type (e.g. article, product page, landing page, documentation), and detect the language',
    schema: JSON.stringify({
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          summary: { type: 'string' },
          topics: { type: 'array', items: { type: 'string' } },
          content_type: { type: 'string' },
          language: { type: 'string' },
        },
        required: ['title', 'summary'],
      },
    }),
  },
  {
    label: 'Content outline',
    group: 'Any page',
    prompt: 'Analyze this page and produce a structured content outline: identify the main topic, then break down the key sections with a brief summary of what each section covers',
    schema: JSON.stringify({
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          main_topic: { type: 'string' },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                heading: { type: 'string' },
                summary: { type: 'string' },
              },
              required: ['heading', 'summary'],
            },
          },
        },
        required: ['main_topic', 'sections'],
      },
    }),
  },
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
        <Toggle
          checked={value === 'true'}
          onChange={(checked) => onChange(checked ? 'true' : 'false')}
          label={value === 'true' ? 'Yes' : 'No'}
        />
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

function FeatureToggle({
  icon: Icon,
  label,
  description,
  detail,
  checked,
  onChange,
}: {
  icon: typeof Cookie
  label: string
  description: string
  detail: string[]
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-surface-200 border border-surface-300 rounded-lg">
      <div className="flex items-center gap-2.5 px-3 py-2">
        <Icon className="w-3.5 h-3.5 text-surface-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs text-surface-800">{label}</span>
          <p className="text-xs text-surface-500">{description}</p>
        </div>
        <Toggle checked={checked} onChange={onChange} />
      </div>
      <div className="px-3 pb-1.5">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] text-surface-500 hover:text-surface-600 transition-colors"
        >
          <Info className="w-3 h-3" />
          How it works
        </button>
        {expanded && (
          <ul className="mt-1.5 mb-1 space-y-1 text-[11px] text-surface-500 list-disc list-inside">
            {detail.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function FeatureToggles({
  values,
  onChange,
}: {
  values: Record<string, string>
  onChange: (name: string, value: string) => void
}) {
  return (
    <div className="space-y-2">
      <FeatureToggle
        icon={Cookie}
        label="Dismiss cookie banners"
        description="Blocks CMP scripts and clicks reject/accept buttons"
        detail={[
          'Blocks script URLs from 18+ consent providers (OneTrust, Cookiebot, Quantcast, Didomi, Usercentrics, and more) via rejectRequestPattern',
          'Injects a cleanup script that tries CMP-specific reject buttons first, then generic reject selectors, then text-based scanning for reject/decline keywords',
          'Falls back to accepting cookies if no reject option is found, to clear the banner',
          'As a last resort, removes banner DOM elements and overlay backdrops directly',
        ]}
        checked={values._dismissCookies === 'true'}
        onChange={(checked) => onChange('_dismissCookies', checked ? 'true' : 'false')}
      />
      <FeatureToggle
        icon={ImageDown}
        label="Load all images"
        description="Forces lazy-loaded images to load without scrolling"
        detail={[
          'Removes loading="lazy" attributes so the browser fetches images eagerly',
          'Swaps data-src, data-lazy-src, and data-original attributes to src for common lazy-load libraries',
          'Copies data-srcset to srcset on img and source elements for responsive images',
          'Applies data-bg and data-background-image to inline background styles',
          'Waits for all images to finish loading, then signals completion via a sentinel element',
        ]}
        checked={values._loadAllImages === 'true'}
        onChange={(checked) => onChange('_loadAllImages', checked ? 'true' : 'false')}
      />
    </div>
  )
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
        <FeatureToggles values={values} onChange={onChange} />
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
            <div className="px-3 pt-2 pb-3 space-y-3">
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
