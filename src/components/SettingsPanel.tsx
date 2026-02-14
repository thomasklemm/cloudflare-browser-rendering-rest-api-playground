import { useState } from 'react'
import { Eye, EyeOff, ExternalLink } from 'lucide-react'
import type { Settings } from '../types/api'

interface SettingsPanelProps {
  settings: Settings
  onChange: (settings: Settings) => void
}

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const [showToken, setShowToken] = useState(false)

  return (
    <div className="border-b border-surface-300 bg-surface-100 px-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
        <div>
          <label className="block text-xs text-surface-600 mb-1">Account ID</label>
          <input
            type="text"
            value={settings.accountId}
            onChange={(e) => onChange({ ...settings, accountId: e.target.value })}
            placeholder="your-account-id"
            className="w-full px-3 py-2 bg-surface-200 border border-surface-300 rounded-lg text-sm text-surface-900 placeholder:text-surface-500 focus:outline-none focus:border-accent-500"
          />
          <p className="text-xs text-surface-500 mt-1.5">
            Find it in the{' '}
            <a
              href="https://dash.cloudflare.com/?to=/:account"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-500 hover:text-accent-600 inline-flex items-center gap-0.5"
            >
              Cloudflare dashboard
              <ExternalLink className="w-3 h-3" />
            </a>
            {' '}sidebar under <span className="text-surface-700">Account ID</span>, or in the URL:{' '}
            <code className="text-surface-700 bg-surface-200 px-1 py-0.5 rounded text-[11px]">
              dash.cloudflare.com/&lt;account-id&gt;
            </code>
          </p>
        </div>
        <div>
          <label className="block text-xs text-surface-600 mb-1">API Token</label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={settings.apiToken}
              onChange={(e) => onChange({ ...settings, apiToken: e.target.value })}
              placeholder="your-api-token"
              className="w-full px-3 py-2 pr-10 bg-surface-200 border border-surface-300 rounded-lg text-sm text-surface-900 placeholder:text-surface-500 focus:outline-none focus:border-accent-500"
            />
            <button
              onClick={() => setShowToken(!showToken)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-700"
              type="button"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-surface-500 mt-1.5">
            Create one at{' '}
            <a
              href="https://dash.cloudflare.com/profile/api-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-500 hover:text-accent-600 inline-flex items-center gap-0.5"
            >
              My Profile &rarr; API Tokens
              <ExternalLink className="w-3 h-3" />
            </a>
            . Use the <span className="text-surface-700">Custom token</span> template with these permissions:
          </p>
          <div className="mt-1.5 text-xs text-surface-600 bg-surface-200 border border-surface-300 rounded-lg px-3 py-2 space-y-0.5">
            <div><span className="text-surface-700">Account</span> &rarr; Browser Rendering &rarr; <span className="text-surface-700">Edit</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
