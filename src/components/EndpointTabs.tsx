import { ExternalLink } from 'lucide-react'
import type { EndpointConfig, EndpointId } from '../types/api'

interface EndpointTabsProps {
  endpoints: EndpointConfig[]
  activeId: EndpointId
  onSelect: (id: EndpointId) => void
}

// Map endpoint IDs to their correct Cloudflare docs URLs
const docsUrlMap: Record<string, string> = {
  screenshot: '/browser-rendering/rest-api/screenshot-endpoint/',
  pdf: '/browser-rendering/rest-api/pdf-endpoint/',
  json: '/browser-rendering/rest-api/json-endpoint/',
  content: '/browser-rendering/rest-api/content-endpoint/',
  markdown: '/browser-rendering/rest-api/markdown-endpoint/',
  snapshot: '/browser-rendering/rest-api/snapshot/',
  scrape: '/browser-rendering/rest-api/scrape-endpoint/',
  links: '/browser-rendering/rest-api/links-endpoint/',
}

export function EndpointTabs({ endpoints, activeId, onSelect }: EndpointTabsProps) {
  return (
    <div className="px-8 py-3">
      <div className="flex gap-2 overflow-x-auto animate-slide-up">
        {endpoints.map((ep, index) => {
          const isActive = activeId === ep.id
          return (
            <div key={ep.id} className="relative group" style={{ animationDelay: `${200 + index * 50}ms` }}>
              <button
                type="button"
                onClick={() => onSelect(ep.id)}
                className={`
                  relative px-4 py-2 rounded-full
                  backdrop-blur-md
                  border transition-all duration-300
                  flex flex-col items-center gap-0.5
                  ${
                    isActive
                      ? 'bg-accent-primary/20 border-accent-primary shadow-[inset_0_0_20px_rgba(255,102,0,0.2)] text-accent-primary'
                      : 'bg-glass-control/30 border-white/5 text-white/50 hover:bg-glass-control/50 hover:text-white/80 hover:border-white/10'
                  }
                `}
                title={ep.description}
              >
                <span className="text-sm font-medium whitespace-nowrap">/{ep.id}</span>
                <span className={`text-xs ${isActive ? 'text-accent-primary/80' : 'text-surface-500'} transition-colors`}>
                  {ep.shortDesc}
                </span>
              </button>

              {/* Tooltip with full description and docs link - shows on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                <div className="glass-panel px-4 py-3 rounded-lg shadow-xl max-w-sm">
                  <p className="text-xs text-surface-900 mb-2">{ep.description}</p>
                  <a
                    href={`https://developers.cloudflare.com${docsUrlMap[ep.id]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent-primary hover:text-accent-500 inline-flex items-center gap-1 pointer-events-auto transition-colors"
                  >
                    View documentation
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
