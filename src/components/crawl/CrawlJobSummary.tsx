import { useEffect, useState, type ReactNode } from 'react'
import { Check, Copy, Download, Loader2, RefreshCw, Square, Database } from 'lucide-react'
import { CRAWL_JOB_STATUS_LABELS } from '../../config/crawl'
import type { CrawlJobSummary } from '../../types/crawl'

interface CrawlJobSummaryProps {
  cancelling: boolean
  cancelCurl: string
  exporting: boolean
  job: CrawlJobSummary
  jobError: string | null
  jobStartedAt: number | null
  lastRefreshedAt: number | null
  onCancel: () => Promise<void> | void
  onExport: () => Promise<void> | void
  onRefresh: () => Promise<void> | void
  onViewRawJob: () => void
  pollCurl: string
  polling: boolean
  refreshingSummary: boolean
}

function ActionButton({
  disabled = false,
  onClick,
  children,
}: {
  children: ReactNode
  disabled?: boolean
  onClick: () => Promise<void> | void
}) {
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-300 text-xs text-surface-700 hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  )
}

export function CrawlJobSummary({
  cancelling,
  cancelCurl,
  exporting,
  job,
  jobError,
  jobStartedAt,
  lastRefreshedAt,
  onCancel,
  onExport,
  onRefresh,
  onViewRawJob,
  pollCurl,
  polling,
  refreshingSummary,
}: CrawlJobSummaryProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const handleCopy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedKey(key)
    window.setTimeout(() => setCopiedKey((current) => current === key ? null : current), 1500)
  }

  const isRunning = job.status === 'running'
  const canExport = !isRunning
  const loadingSummary = polling || refreshingSummary
  const elapsedMs = jobStartedAt ? Math.max(0, now - jobStartedAt) : 0
  const elapsedLabel = `${String(Math.floor(elapsedMs / 60000)).padStart(2, '0')}:${String(Math.floor((elapsedMs % 60000) / 1000)).padStart(2, '0')}`

  useEffect(() => {
    if (!jobStartedAt || !isRunning) return

    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isRunning, jobStartedAt])

  return (
    <div className="glass-panel rounded-xl border border-surface-300 overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-300 bg-surface-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-surface-900 font-medium">Job {job.id}</p>
            <p className="text-xs text-surface-500 mt-1">
              Status: {CRAWL_JOB_STATUS_LABELS[job.status]}
              {jobStartedAt ? ` · Elapsed ${elapsedLabel}` : ''}
              {lastRefreshedAt ? ` · Refreshed ${new Date(lastRefreshedAt).toLocaleTimeString()}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ActionButton onClick={onRefresh} disabled={loadingSummary}>
              {loadingSummary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Refresh
            </ActionButton>
            <ActionButton onClick={onCancel} disabled={!isRunning || cancelling}>
              {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
              Cancel
            </ActionButton>
            <ActionButton onClick={onViewRawJob}>
              <Database className="w-3.5 h-3.5" />
              View raw job JSON
            </ActionButton>
            <ActionButton onClick={() => handleCopy('poll', pollCurl)}>
              {copiedKey === 'poll' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              Copy poll curl
            </ActionButton>
            <ActionButton onClick={() => handleCopy('cancel', cancelCurl)}>
              {copiedKey === 'cancel' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              Copy cancel curl
            </ActionButton>
            <ActionButton onClick={onExport} disabled={!canExport || exporting}>
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Export ZIP
            </ActionButton>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-surface-300">
        <div className="bg-surface-100 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-surface-500">Job status</p>
          <p className="mt-1 text-sm text-surface-900">{CRAWL_JOB_STATUS_LABELS[job.status]}</p>
        </div>
        <div className="bg-surface-100 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-surface-500">Finished</p>
          <p className="mt-1 text-sm text-surface-900">{job.finished} / {job.total}</p>
        </div>
        <div className="bg-surface-100 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-surface-500">Skipped</p>
          <p className="mt-1 text-sm text-surface-900">{job.skipped}</p>
        </div>
        <div className="bg-surface-100 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-surface-500">Browser seconds</p>
          <p className="mt-1 text-sm text-surface-900">{job.browserSecondsUsed.toFixed(1)}</p>
        </div>
        <div className="bg-surface-100 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-surface-500">Cursor</p>
          <p className="mt-1 text-sm text-surface-900">{job.cursor ?? 'None'}</p>
        </div>
      </div>

      {(jobError || job.status === 'cancelled_due_to_limits') && (
        <div className="border-t border-surface-300 px-4 py-3 bg-red-500/8">
          <p className="text-sm text-red-300">
            {jobError || 'Cloudflare cancelled this crawl because the account hit its crawl or Browser Rendering limits.'}
          </p>
        </div>
      )}
    </div>
  )
}
