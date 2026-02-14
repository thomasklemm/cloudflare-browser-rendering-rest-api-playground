import { Settings, Globe } from 'lucide-react'

interface HeaderProps {
  showSettings: boolean
  onToggleSettings: () => void
}

export function Header({ showSettings, onToggleSettings }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-surface-300">
      <div className="flex items-center gap-3">
        <Globe className="w-6 h-6 text-accent-500" />
        <h1 className="text-lg font-semibold text-surface-900">
          Browser Rendering API
        </h1>
        <span className="text-xs text-surface-500 hidden sm:inline">Cloudflare</span>
      </div>
      <button
        onClick={onToggleSettings}
        className={`p-2 rounded-lg transition-colors ${
          showSettings
            ? 'bg-accent-500/20 text-accent-500'
            : 'text-surface-600 hover:text-surface-800 hover:bg-surface-200'
        }`}
        title="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>
    </header>
  )
}
