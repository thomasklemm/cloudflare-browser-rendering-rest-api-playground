import { Settings, Globe, ExternalLink } from 'lucide-react'

interface HeaderProps {
  showSettings: boolean
  onToggleSettings: () => void
}

export function Header({ showSettings, onToggleSettings }: HeaderProps) {
  return (
    <header className="mx-6 mt-6 px-6 py-4 glass-panel rounded-2xl shadow-2xl flex items-center justify-between animate-slide-down">
      <div className="flex items-center gap-4">
        {/* Animated gradient orb behind Globe icon */}
        <div className="relative w-10 h-10 shrink-0">
          <div
            className="absolute inset-0 bg-gradient-conic from-accent-primary via-accent-info to-accent-primary blur-lg opacity-60 animate-spin-slow"
            style={{ backgroundImage: 'conic-gradient(from 0deg, var(--color-accent-primary), var(--color-accent-info), var(--color-accent-primary))' }}
          />
          <Globe className="relative w-10 h-10 text-accent-primary" />
        </div>

        {/* Title with gradient text */}
        <div className="flex flex-col">
          <h1 className="text-xl font-light tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Browser Rendering Playground
          </h1>
          <p className="text-xs text-surface-500 mt-0.5">
            Third-party tool powered by{' '}
            <a
              href="https://developers.cloudflare.com/browser-rendering/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-primary hover:text-accent-500 transition-colors inline-flex items-center gap-0.5"
            >
              Cloudflare
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
      </div>

      {/* Right side: Docs link + Settings */}
      <div className="flex items-center gap-3">
        <a
          href="https://developers.cloudflare.com/browser-rendering/rest-api/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-surface-700 hover:text-accent-primary transition-colors rounded-lg hover:bg-glass-control"
        >
          View API Docs
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <button
          type="button"
          onClick={onToggleSettings}
          className={`p-2 rounded-lg transition-all ${
            showSettings
              ? 'bg-accent-primary/20 text-accent-primary shadow-[0_0_15px_var(--color-accent-primary-glow)]'
              : 'text-surface-600 hover:text-surface-800 hover:bg-glass-control'
          }`}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
