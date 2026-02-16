import { Info } from 'lucide-react'
import type { EndpointConfig, EndpointId } from '../types/api'

interface EndpointTabsProps {
  endpoints: EndpointConfig[]
  activeId: EndpointId
  onSelect: (id: EndpointId) => void
}

export function EndpointTabs({ endpoints, activeId, onSelect }: EndpointTabsProps) {
  return (
    <div className="px-8 py-4">
      <div className="flex gap-2 overflow-x-auto animate-slide-up">
        {endpoints.map((ep, index) => {
          const isActive = activeId === ep.id
          return (
            <div key={ep.id} className="relative group" style={{ animationDelay: `${200 + index * 50}ms` }}>
              <button
                type="button"
                onClick={() => onSelect(ep.id)}
                className={`
                  relative px-5 py-2.5 rounded-full
                  backdrop-blur-md
                  border transition-all duration-300
                  flex flex-col items-center gap-0.5
                  ${
                    isActive
                      ? 'bg-accent-primary/20 border-accent-primary shadow-[0_0_20px_var(--color-accent-primary-glow)] text-accent-primary'
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

              {/* Tooltip with full description - shows on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                <div className="glass-panel px-3 py-2 rounded-lg shadow-xl whitespace-nowrap max-w-xs">
                  <p className="text-xs text-surface-900">{ep.description}</p>
                </div>
              </div>

              {/* Info icon with link to docs - shows on hover */}
              <a
                href={`https://developers.cloudflare.com/browser-rendering/rest-api/endpoints/#${ep.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-accent-info/90 backdrop-blur-sm rounded-full p-1 hover:bg-accent-info z-10"
                title={`View ${ep.label} endpoint documentation`}
              >
                <Info className="w-3 h-3 text-white" />
              </a>
            </div>
          )
        })}
      </div>
    </div>
  )
}
