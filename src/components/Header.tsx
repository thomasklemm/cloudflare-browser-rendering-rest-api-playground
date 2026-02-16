import { Settings, Github, BookOpen, ExternalLink } from 'lucide-react'

function PrismIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="header-prism" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f6821f"/>
          <stop offset="100%" stopColor="#ff9f5a"/>
        </linearGradient>
      </defs>
      {/* Input beam */}
      <line x1="0" y1="256" x2="100" y2="256" stroke="#f6821f" strokeWidth="16" strokeLinecap="round" opacity="0.4"/>
      {/* Prism */}
      <polygon points="100,72 408,256 100,440" fill="url(#header-prism)"/>
      {/* Output beams */}
      <line x1="408" y1="256" x2="500" y2="100" stroke="#ff9f5a" strokeWidth="16" strokeLinecap="round"/>
      <line x1="408" y1="256" x2="512" y2="256" stroke="#f6821f" strokeWidth="16" strokeLinecap="round"/>
      <line x1="408" y1="256" x2="500" y2="412" stroke="#e06b10" strokeWidth="16" strokeLinecap="round"/>
      {/* Beam endpoints */}
      <circle cx="500" cy="100" r="14" fill="#ff9f5a"/>
      <circle cx="512" cy="256" r="14" fill="#f6821f"/>
      <circle cx="500" cy="412" r="14" fill="#e06b10"/>
    </svg>
  )
}

interface HeaderProps {
  showSettings: boolean
  onToggleSettings: () => void
}

export function Header({ showSettings, onToggleSettings }: HeaderProps) {
  return (
    <header className="mx-6 mt-3 px-6 py-2.5 glass-panel rounded-2xl shadow-2xl flex items-center justify-between animate-slide-down">
      <div className="flex items-center gap-3">
        {/* Animated gradient orb behind Prism icon */}
        <div className="relative w-8 h-8 shrink-0">
          <div
            className="absolute inset-0 bg-gradient-conic from-accent-primary via-accent-info to-accent-primary blur-lg opacity-60 animate-spin-slow"
            style={{ backgroundImage: 'conic-gradient(from 0deg, var(--color-accent-primary), var(--color-accent-info), var(--color-accent-primary))' }}
          />
          <PrismIcon className="relative w-8 h-8" />
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
