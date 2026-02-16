interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <label className={`inline-flex items-center gap-2.5 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-surface-100
          ${checked ? 'bg-accent-primary' : 'bg-surface-400'}
          ${disabled ? '' : 'hover:opacity-90'}
        `}
      >
        <span
          className={`
            inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out
            ${checked ? 'translate-x-[1.125rem]' : 'translate-x-0.5'}
          `}
        />
      </button>
      {label && (
        <span className="text-sm text-surface-700 select-none">
          {label}
        </span>
      )}
    </label>
  )
}
