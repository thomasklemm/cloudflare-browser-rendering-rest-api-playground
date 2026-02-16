import { useEffect, useState } from 'react'
import { Loader2, Clock, AlertCircle, RotateCw } from 'lucide-react'
import type { RequestState } from '../types/api'

interface RequestStatusProps {
  state: RequestState
}

export function RequestStatus({ state }: RequestStatusProps) {
  const [elapsed, setElapsed] = useState(0)
  const [retryCountdown, setRetryCountdown] = useState(0)

  // Update elapsed time for running requests
  useEffect(() => {
    if (state.status !== 'running') return

    const startTime = state.startTime
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime)
    }, 100)

    return () => clearInterval(interval)
  }, [state])

  // Update retry countdown
  useEffect(() => {
    if (state.status !== 'retrying') return

    const targetTime = Date.now() + state.nextRetryIn
    const interval = setInterval(() => {
      const remaining = Math.max(0, targetTime - Date.now())
      setRetryCountdown(remaining)
      if (remaining === 0) {
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [state])

  switch (state.status) {
    case 'queued':
      return (
        <div className="flex items-center gap-2 text-surface-500">
          <div className="w-2 h-2 rounded-full bg-surface-400 animate-pulse" />
          <span className="text-xs">Queued...</span>
        </div>
      )

    case 'running':
      return (
        <div className="flex items-center gap-2 text-accent-primary">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="text-xs font-medium">
            Sending request... {(elapsed / 1000).toFixed(1)}s
          </span>
        </div>
      )

    case 'retrying':
      return (
        <div className="flex items-center gap-2 text-amber-500">
          <RotateCw className="w-3.5 h-3.5 animate-spin" />
          <span className="text-xs font-medium">
            Retry {state.attempt}/{3} in {(retryCountdown / 1000).toFixed(1)}s
          </span>
        </div>
      )

    case 'completed':
      return (
        <div className="flex items-center gap-2 text-green-400">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-xs">Completed</span>
        </div>
      )

    case 'failed':
      return (
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="text-xs">Failed</span>
        </div>
      )

    default:
      return null
  }
}
