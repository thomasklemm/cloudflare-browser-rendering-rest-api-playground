import type { RefObject } from 'react'
import { useState } from 'react'
import { ChevronDown, ChevronRight, Loader2, Play } from 'lucide-react'
import {
  CRAWL_FORMAT_OPTIONS,
  CRAWL_PURPOSE_OPTIONS,
  CRAWL_SOURCE_OPTIONS,
} from '../../config/crawl'
import type { CrawlFieldErrors } from '../../lib/crawl'
import type { FieldConfig } from '../../types/api'
import type { CrawlCreateFormValues, CrawlFormat, CrawlPurpose } from '../../types/crawl'
import { JsonSchemaBuilder } from '../JsonSchemaBuilder'
import { Toggle } from '../Toggle'
import { FieldControl } from '../forms/FieldControl'
import { FormField } from '../forms/FormField'

const LIMIT_FIELD: FieldConfig = {
  hint: 'Workers Free plan: maximum 100 pages per crawl.',
  label: 'Page limit',
  name: 'limit',
  placeholder: '25',
  type: 'number',
}

const DEPTH_FIELD: FieldConfig = {
  hint: 'Maximum link depth from the starting URL.',
  label: 'Depth',
  name: 'depth',
  placeholder: '2',
  type: 'number',
}

const SOURCE_FIELD: FieldConfig = {
  hint: 'Choose how the crawler discovers more URLs.',
  label: 'Discovery source',
  name: 'source',
  options: CRAWL_SOURCE_OPTIONS.map((option) => ({ label: option.label, value: option.value })),
  type: 'select',
}

const MAX_AGE_FIELD: FieldConfig = {
  hint: 'Maximum cache age in seconds before the crawler refetches content.',
  label: 'Max age (seconds)',
  name: 'maxAge',
  placeholder: '86400',
  type: 'number',
}

const MODIFIED_SINCE_FIELD: FieldConfig = {
  hint: 'Unix timestamp in seconds to skip older pages.',
  label: 'Modified since',
  name: 'modifiedSince',
  placeholder: '1704067200',
  type: 'number',
}

const GOTO_WAIT_UNTIL_FIELD: FieldConfig = {
  hint: 'Navigation completion signal for rendered crawls.',
  label: 'Wait until',
  name: 'gotoWaitUntil',
  options: [
    { label: 'load', value: 'load' },
    { label: 'domcontentloaded', value: 'domcontentloaded' },
    { label: 'networkidle0', value: 'networkidle0' },
    { label: 'networkidle2', value: 'networkidle2' },
  ],
  type: 'select',
}

const GOTO_TIMEOUT_FIELD: FieldConfig = {
  hint: 'Navigation timeout in milliseconds.',
  label: 'Goto timeout (ms)',
  name: 'gotoTimeout',
  placeholder: '30000',
  type: 'number',
}

const WAIT_FOR_SELECTOR_FIELD: FieldConfig = {
  hint: 'Wait for a selector before capturing the rendered page.',
  label: 'Wait for selector',
  name: 'waitForSelector',
  placeholder: '#content',
  type: 'text',
}

const INCLUDE_PATTERNS_FIELD: FieldConfig = {
  hint: 'JSON array of wildcard URL patterns to include.',
  label: 'Include patterns',
  name: 'includePatterns',
  placeholder: '["https://example.com/docs/**"]',
  type: 'json',
}

const EXCLUDE_PATTERNS_FIELD: FieldConfig = {
  hint: 'JSON array of wildcard URL patterns to exclude.',
  label: 'Exclude patterns',
  name: 'excludePatterns',
  placeholder: '["https://example.com/docs/archive/**"]',
  type: 'json',
}

const ADD_SCRIPT_TAG_FIELD: FieldConfig = {
  hint: 'JSON array of scripts to inject before capture.',
  label: 'Inject scripts',
  name: 'addScriptTag',
  placeholder: '[{"content":"console.log(1)"}]',
  type: 'json',
}

const ADD_STYLE_TAG_FIELD: FieldConfig = {
  hint: 'JSON array of styles to inject before capture.',
  label: 'Inject styles',
  name: 'addStyleTag',
  placeholder: '[{"content":"body { background: red; }"}]',
  type: 'json',
}

const REJECT_REQUEST_PATTERN_FIELD: FieldConfig = {
  hint: 'JSON array of regex strings for blocked requests.',
  label: 'Block request URL patterns',
  name: 'rejectRequestPattern',
  placeholder: '["ads\\\\.example\\\\.com"]',
  type: 'json',
}

const ALLOW_REQUEST_PATTERN_FIELD: FieldConfig = {
  hint: 'JSON array of regex strings for allowed requests only.',
  label: 'Allow request URL patterns',
  name: 'allowRequestPattern',
  placeholder: '["example\\\\.com"]',
  type: 'json',
}

const REJECT_RESOURCE_TYPES_FIELD: FieldConfig = {
  hint: 'JSON array of resource types to block.',
  label: 'Block resource types',
  name: 'rejectResourceTypes',
  placeholder: '["image","font"]',
  type: 'json',
}

const ALLOW_RESOURCE_TYPES_FIELD: FieldConfig = {
  hint: 'JSON array of resource types to allow.',
  label: 'Allow resource types',
  name: 'allowResourceTypes',
  placeholder: '["document","script"]',
  type: 'json',
}

const JSON_PROMPT_FIELD: FieldConfig = {
  hint: 'Describe the structured data to extract from each crawled page.',
  label: 'JSON prompt',
  name: 'jsonPrompt',
  placeholder: 'Extract product name, price, and availability',
  type: 'textarea',
}

const JSON_CUSTOM_AI_FIELD: FieldConfig = {
  hint: 'JSON array of custom models with authorization headers.',
  label: 'Custom AI models',
  name: 'jsonCustomAi',
  placeholder: '[{"model":"openai/gpt-4o-mini","authorization":"Bearer ..."}]',
  type: 'json',
}

function ChoiceChip({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${
        active
          ? 'border-accent-500 bg-accent-500/15 text-accent-500'
          : 'border-surface-300 text-surface-600 hover:text-surface-800 hover:bg-surface-200'
      }`}
    >
      {label}
    </button>
  )
}

function ConfigField({
  error,
  field,
  onChange,
  value,
}: {
  error?: string
  field: FieldConfig
  onChange: (value: string) => void
  value: string
}) {
  return (
    <FormField error={error} hint={field.hint} label={field.label}>
      <FieldControl
        error={Boolean(error)}
        field={field}
        onChange={onChange}
        value={value}
      />
    </FormField>
  )
}

interface CrawlFormProps {
  errors: CrawlFieldErrors
  jobExists: boolean
  loading: boolean
  onChange: <K extends keyof CrawlCreateFormValues>(field: K, value: CrawlCreateFormValues[K]) => void
  onSubmit: () => void
  settingsReady: boolean
  submitRef?: RefObject<HTMLButtonElement | null>
  values: CrawlCreateFormValues
}

export function CrawlForm({
  errors,
  jobExists,
  loading,
  onChange,
  onSubmit,
  settingsReady,
  submitRef,
  values,
}: CrawlFormProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (name: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const toggleFormat = (format: CrawlFormat) => {
    const next = values.formats.includes(format)
      ? values.formats.filter((value) => value !== format)
      : [...values.formats, format]
    onChange('formats', next)
  }

  const togglePurpose = (purpose: CrawlPurpose) => {
    const next = values.crawlPurposes.includes(purpose)
      ? values.crawlPurposes.filter((value) => value !== purpose)
      : [...values.crawlPurposes, purpose]
    onChange('crawlPurposes', next)
  }

  const submitLabel = loading
    ? 'Starting crawl…'
    : jobExists
      ? 'Start New Crawl'
      : 'Start Crawl'

  const renderAdvancedSections = values.render

  return (
    <div className="space-y-4">
      <div className="pb-3 border-b border-surface-300">
        <h2 className="text-base font-medium text-accent-primary mb-1">/crawl</h2>
        <p className="text-sm text-surface-700 leading-relaxed">
          Crawl an entire site as an async Browser Rendering job, then inspect records page by page without leaving the playground.
        </p>
      </div>

      <FormField
        error={errors.url}
        hint="Single starting URL only. Crawl jobs run asynchronously and keep their state in this session."
        label="Starting URL"
        required
      >
        <input
          type="text"
          value={values.url}
          onChange={(event) => onChange('url', event.target.value)}
          placeholder="https://developers.cloudflare.com/workers/"
          className={`w-full px-3 py-2 bg-surface-200 border rounded-lg text-sm text-surface-900 placeholder:text-surface-500 focus:outline-none ${
            errors.url ? 'border-red-500/60 focus:border-red-400' : 'border-surface-300 focus:border-accent-500'
          }`}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ConfigField
          error={errors.limit}
          field={LIMIT_FIELD}
          onChange={(value) => onChange('limit', value)}
          value={values.limit}
        />
        <ConfigField
          error={errors.depth}
          field={DEPTH_FIELD}
          onChange={(value) => onChange('depth', value)}
          value={values.depth}
        />
      </div>

      <ConfigField
        error={errors.source}
        field={SOURCE_FIELD}
        onChange={(value) => onChange('source', value as CrawlCreateFormValues['source'])}
        value={values.source}
      />

      <FormField
        error={errors.formats}
        hint="Markdown is the best default for inspection. JSON uses Workers AI or your custom model settings."
        label="Output formats"
        required
      >
        <div className="flex flex-wrap gap-2">
          {CRAWL_FORMAT_OPTIONS.map((option) => (
            <ChoiceChip
              key={option.value}
              active={values.formats.includes(option.value)}
              label={option.label}
              onClick={() => toggleFormat(option.value)}
            />
          ))}
        </div>
      </FormField>

      <FormField
        hint="Declare the intended use of crawled content. `search` is the safest default for Content Signals compatibility."
        label="Crawl purposes"
      >
        <div className="flex flex-wrap gap-2">
          {CRAWL_PURPOSE_OPTIONS.map((option) => (
            <ChoiceChip
              key={option.value}
              active={values.crawlPurposes.includes(option.value)}
              label={option.label}
              onClick={() => togglePurpose(option.value)}
            />
          ))}
        </div>
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField
          hint="Disable browser rendering for faster static HTML fetches."
          label="Render pages in a browser"
        >
          <Toggle
            checked={values.render}
            label={values.render ? 'On' : 'Off'}
            onChange={(checked) => onChange('render', checked)}
          />
        </FormField>
        <FormField
          hint="Follow links outside the starting domain."
          label="Include external links"
        >
          <Toggle
            checked={values.includeExternalLinks}
            label={values.includeExternalLinks ? 'On' : 'Off'}
            onChange={(checked) => onChange('includeExternalLinks', checked)}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField
          hint="Follow links on subdomains of the starting URL."
          label="Include subdomains"
        >
          <Toggle
            checked={values.includeSubdomains}
            label={values.includeSubdomains ? 'On' : 'Off'}
            onChange={(checked) => onChange('includeSubdomains', checked)}
          />
        </FormField>
        {values.render && (
          <FormField
            hint="Blocks common consent managers before the crawl captures rendered content."
            label="Dismiss cookie banners"
          >
            <Toggle
              checked={values.dismissCookies}
              label={values.dismissCookies ? 'On' : 'Off'}
              onChange={(checked) => onChange('dismissCookies', checked)}
            />
          </FormField>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ConfigField
          error={errors.maxAge}
          field={MAX_AGE_FIELD}
          onChange={(value) => onChange('maxAge', value)}
          value={values.maxAge}
        />
        <ConfigField
          error={errors.modifiedSince}
          field={MODIFIED_SINCE_FIELD}
          onChange={(value) => onChange('modifiedSince', value)}
          value={values.modifiedSince}
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <ConfigField
          error={errors.includePatterns}
          field={INCLUDE_PATTERNS_FIELD}
          onChange={(value) => onChange('includePatterns', value)}
          value={values.includePatterns}
        />
        <ConfigField
          error={errors.excludePatterns}
          field={EXCLUDE_PATTERNS_FIELD}
          onChange={(value) => onChange('excludePatterns', value)}
          value={values.excludePatterns}
        />
      </div>

      {values.formats.includes('json') && (
        <div className="border border-surface-300 rounded-lg overflow-hidden">
          <div className="px-3 py-2 text-xs text-surface-600 bg-surface-100 border-b border-surface-300">
            JSON extraction
          </div>
          <div className="px-3 py-3 space-y-4">
            <ConfigField
              error={errors.jsonPrompt}
              field={JSON_PROMPT_FIELD}
              onChange={(value) => onChange('jsonPrompt', value)}
              value={values.jsonPrompt}
            />
            <div>
              <JsonSchemaBuilder
                value={values.jsonResponseFormat}
                onChange={(value) => onChange('jsonResponseFormat', value)}
              />
              {errors.jsonResponseFormat && (
                <p className="text-xs text-red-400 mt-1.5">{errors.jsonResponseFormat}</p>
              )}
            </div>
            <ConfigField
              error={errors.jsonCustomAi}
              field={JSON_CUSTOM_AI_FIELD}
              onChange={(value) => onChange('jsonCustomAi', value)}
              value={values.jsonCustomAi}
            />
          </div>
        </div>
      )}

      {renderAdvancedSections && (
        <>
          {[
            {
              fields: [
                { key: 'gotoWaitUntil', field: GOTO_WAIT_UNTIL_FIELD },
                { key: 'gotoTimeout', field: GOTO_TIMEOUT_FIELD },
                { key: 'waitForSelector', field: WAIT_FOR_SELECTOR_FIELD },
              ] as const,
              name: 'Navigation Controls',
            },
            {
              fields: [
                { key: 'rejectRequestPattern', field: REJECT_REQUEST_PATTERN_FIELD },
                { key: 'allowRequestPattern', field: ALLOW_REQUEST_PATTERN_FIELD },
                { key: 'rejectResourceTypes', field: REJECT_RESOURCE_TYPES_FIELD },
                { key: 'allowResourceTypes', field: ALLOW_RESOURCE_TYPES_FIELD },
              ] as const,
              name: 'Request Filtering',
            },
            {
              fields: [
                { key: 'addScriptTag', field: ADD_SCRIPT_TAG_FIELD },
                { key: 'addStyleTag', field: ADD_STYLE_TAG_FIELD },
              ] as const,
              name: 'Injection',
            },
          ].map((section) => (
            <div key={section.name} className="border border-surface-300 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(section.name)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-surface-600 hover:bg-surface-200 transition-colors"
              >
                {expandedSections.has(section.name)
                  ? <ChevronDown className="w-3.5 h-3.5" />
                  : <ChevronRight className="w-3.5 h-3.5" />}
                {section.name}
              </button>
              {expandedSections.has(section.name) && (
                <div className="px-3 py-3 space-y-4 border-t border-surface-300">
                  {section.name === 'Navigation Controls' && (
                    <FormField
                      hint="Disable JavaScript execution for rendered crawls."
                      label="JavaScript enabled"
                    >
                      <Toggle
                        checked={values.setJavaScriptEnabled}
                        label={values.setJavaScriptEnabled ? 'On' : 'Off'}
                        onChange={(checked) => onChange('setJavaScriptEnabled', checked)}
                      />
                    </FormField>
                  )}

                  {section.fields.map(({ field, key }) => (
                    <ConfigField
                      key={field.name}
                      error={errors[key]}
                      field={field}
                      onChange={(value) => onChange(key, value as CrawlCreateFormValues[typeof key])}
                      value={String(values[key] || '')}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {!settingsReady && (
        <div className="flex items-start gap-2.5 px-3 py-2.5 bg-accent-500/10 border border-accent-500/20 rounded-lg">
          <p className="text-xs text-surface-700">
            Configure your Account ID and API Token in settings before starting a crawl.
          </p>
        </div>
      )}

      <button
        ref={submitRef}
        type="button"
        onClick={onSubmit}
        disabled={loading || !settingsReady}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-500 hover:bg-accent-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
        {submitLabel}
        {!loading && <kbd className="ml-2 text-xs opacity-60 hidden sm:inline">Cmd+Enter</kbd>}
      </button>
    </div>
  )
}
