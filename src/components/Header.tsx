import { Settings, Globe, Github, BookOpen, ExternalLink } from 'lucide-react'

interface HeaderProps {
  showSettings: boolean
  onToggleSettings: () => void
}

export function Header({ showSettings, onToggleSettings }: HeaderProps) {
  return (
    <header className="mx-6 mt-3 px-6 py-2.5 glass-panel rounded-2xl shadow-2xl flex items-center justify-between animate-slide-down">
      <div className="flex items-center gap-3">
        {/* Animated gradient orb behind Globe icon */}
        <div className="relative w-8 h-8 shrink-0">
          <div
            className="absolute inset-0 bg-gradient-conic from-accent-primary via-accent-info to-accent-primary blur-lg opacity-60 animate-spin-slow"
            style={{ backgroundImage: 'conic-gradient(from 0deg, var(--color-accent-primary), var(--color-accent-info), var(--color-accent-primary))' }}
          />
          <Globe className="relative w-8 h-8 text-accent-primary" />
        </div>

        {/* Title with gradient text */}
        <div className="flex flex-col">
          <h1 className="text-lg font-light tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Cloudflare Browser Rendering REST API
          </h1>
          <p className="text-xs text-surface-500 mt-0.5">
            Interactive playground for the{' '}
            <a
              href="https://developers.cloudflare.com/browser-rendering/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-primary hover:text-accent-500 transition-colors inline-flex items-center gap-0.5"
            >
              Cloudflare Browser Rendering REST API
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
      </div>

      {/* Right side: Docs + GitHub + Settings */}
      <div className="flex items-center gap-2">
        <a
          href="https://developers.cloudflare.com/browser-rendering/rest-api/"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg text-surface-600 hover:text-surface-800 hover:bg-glass-control transition-all"
          title="API Documentation"
        >
          <BookOpen className="w-5 h-5" />
        </a>

        <a
          href="https://github.com/thomasklemm/cloudflare-browser-rendering-rest-api-playground"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg text-surface-600 hover:text-surface-800 hover:bg-glass-control transition-all"
          title="View on GitHub"
        >
          <Github className="w-5 h-5" />
        </a>

        <button
          type="button"
          onClick={onToggleSettings}
          className={`p-2 rounded-lg transition-all cursor-pointer ${
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
