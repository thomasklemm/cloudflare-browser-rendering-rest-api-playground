import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
}

export function FormField({
  label,
  required = false,
  error,
  hint,
  children,
}: FormFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-surface-600 mb-1.5">
        {label}
        {required && <span className="text-accent-500 ml-1">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-400 mt-1.5">{error}</p>
      ) : hint ? (
        <p className="text-xs text-surface-500 mt-1.5 leading-relaxed">{hint}</p>
      ) : null}
    </div>
  )
}
