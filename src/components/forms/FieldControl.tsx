import type { FieldConfig } from '../../types/api'
import { Toggle } from '../Toggle'

function getEffectiveValue(field: FieldConfig, value: string): string {
  if (value !== undefined && value !== '') return value

  if (field.type === 'boolean' && field.defaultValue !== undefined) {
    return field.defaultValue ? 'true' : 'false'
  }

  return value || ''
}

interface FieldControlProps {
  field: FieldConfig
  value: string
  onChange: (value: string) => void
  error: boolean
}

export function FieldControl({
  field,
  value,
  onChange,
  error,
}: FieldControlProps) {
  const effectiveValue = getEffectiveValue(field, value)
  const border = error
    ? 'border-red-500/60 focus:border-red-400'
    : 'border-surface-300 focus:border-accent-500'

  switch (field.type) {
    case 'textarea':
    case 'json':
      return (
        <textarea
          value={effectiveValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={field.type === 'json' ? 4 : 3}
          className={`w-full px-3 py-2 bg-surface-200 border ${border} rounded-lg text-sm text-surface-900 placeholder:text-surface-500 focus:outline-none resize-y ${field.type === 'json' ? 'font-mono' : ''}`}
        />
      )
    case 'select':
      return (
        <select
          value={effectiveValue}
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
          checked={effectiveValue === 'true'}
          onChange={(checked) => onChange(checked ? 'true' : 'false')}
          label={effectiveValue === 'true' ? 'Yes' : 'No'}
        />
      )
    default:
      return (
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          value={effectiveValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={`w-full px-3 py-2 bg-surface-200 border ${border} rounded-lg text-sm text-surface-900 placeholder:text-surface-500 focus:outline-none`}
        />
      )
  }
}
