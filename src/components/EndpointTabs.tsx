import type { EndpointConfig, EndpointId } from '../types/api'

interface EndpointTabsProps {
  endpoints: EndpointConfig[]
  activeId: EndpointId
  onSelect: (id: EndpointId) => void
}

export function EndpointTabs({ endpoints, activeId, onSelect }: EndpointTabsProps) {
  return (
    <div className="border-b border-surface-300 px-6">
      <div className="flex gap-1 overflow-x-auto -mb-px">
        {endpoints.map((ep) => (
          <button
            key={ep.id}
            onClick={() => onSelect(ep.id)}
            className={`px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeId === ep.id
                ? 'border-accent-500 text-accent-500'
                : 'border-transparent text-surface-600 hover:text-surface-800 hover:border-surface-400'
            }`}
          >
            /{ep.id}
          </button>
        ))}
      </div>
    </div>
  )
}
