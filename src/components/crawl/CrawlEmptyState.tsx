import type { ReactNode } from 'react'

interface CrawlEmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

export function CrawlEmptyState({
  title,
  description,
  action,
}: CrawlEmptyStateProps) {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="max-w-md text-center glass-panel rounded-2xl border border-surface-300 px-6 py-8">
        <h3 className="text-base font-medium text-surface-900">{title}</h3>
        <p className="mt-2 text-sm text-surface-600 leading-relaxed">{description}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  )
}
