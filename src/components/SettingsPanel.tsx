import { useState, useEffect } from 'react'
import { Eye, EyeOff, ExternalLink, X } from 'lucide-react'
import type { Settings } from '../types/api'

interface SettingsPanelProps {
  settings: Settings
  onChange: (settings: Settings) => void
  onClose: () => void
}

export function SettingsPanel({ settings, onChange, onClose }: SettingsPanelProps) {
  const [showToken, setShowToken] = useState(false)

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-start justify-center pt-24 px-4 animate-scale-in"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Enter' && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        className="w-full max-w-3xl glass-panel rounded-2xl shadow-2xl p-8 relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-surface-600 hover:text-surface-800 hover:bg-glass-control transition-colors"
          title="Close settings (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="settings-title" className="text-xl font-light mb-6 text-surface-900">API Settings</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="account-id" className="block text-sm text-surface-600 mb-2 font-medium">Account ID</label>
            <input
              id="account-id"
              type="text"
              value={settings.accountId}
              onChange={(e) => onChange({ ...settings, accountId: e.target.value })}
              placeholder="your-account-id"
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-sm text-surface-900 placeholder:text-surface-500 focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all"
            />
            <p className="text-xs text-surface-500 mt-2">
              Find it in the{' '}
              <a
                href="https://dash.cloudflare.com/?to=/:account"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary hover:text-accent-500 inline-flex items-center gap-0.5 transition-colors"
              >
                Cloudflare dashboard
                <ExternalLink className="w-3 h-3" />
              </a>
              {' '}sidebar under <span className="text-surface-700">Account ID</span>, or in the URL:{' '}
              <code className="text-surface-700 bg-black/20 px-1.5 py-0.5 rounded text-[11px]">
                dash.cloudflare.com/&lt;account-id&gt;
              </code>
            </p>
          </div>

          <div>
            <label htmlFor="api-token" className="block text-sm text-surface-600 mb-2 font-medium">API Token</label>
            <div className="relative">
              <input
                id="api-token"
                type={showToken ? 'text' : 'password'}
                value={settings.apiToken}
                onChange={(e) => onChange({ ...settings, apiToken: e.target.value })}
                placeholder="your-api-token"
                className="w-full px-4 py-3 pr-12 bg-black/20 border border-white/10 rounded-xl text-sm text-surface-900 placeholder:text-surface-500 focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-700 transition-colors"
                title={showToken ? 'Hide token' : 'Show token'}
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-surface-500 mt-2">
              Create one at{' '}
              <a
                href="https://dash.cloudflare.com/profile/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary hover:text-accent-500 inline-flex items-center gap-0.5 transition-colors"
              >
                My Profile → API Tokens
                <ExternalLink className="w-3 h-3" />
              </a>
              . Use the <span className="text-surface-700">Custom token</span> template with these permissions:
            </p>
            <div className="mt-2 text-xs text-surface-600 glass-card rounded-lg px-3 py-2">
              <div><span className="text-surface-700">Account</span> → Browser Rendering → <span className="text-surface-700">Edit</span></div>
            </div>
          </div>
        </div>

        {/* Additional help link */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <a
            href="https://developers.cloudflare.com/fundamentals/api/get-started/create-token/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-surface-600 hover:text-accent-primary inline-flex items-center gap-1 transition-colors"
          >
            How to create API tokens →
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}
