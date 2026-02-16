import { useState, useRef, useCallback, useEffect } from 'react'
import type { EndpointConfig, Settings, ApiResponse, BatchResponseEntry, RequestState, WorkersPlan } from '../types/api'
import { buildFetchOptions } from '../lib/buildRequest'

// Cloudflare Browser Rendering REST API limits (as of Jan 2025):
// Free Plan: 6 req/min (1 every 10s), 3 concurrent, 3 new browsers/min
// Paid Plan: 180 req/min (3/sec), 30 concurrent, 30 new browsers/min
//
// IMPORTANT: Rate limits use fixed per-second fill rate, NOT burst allowance.
// Must spread requests evenly.

const MAX_RETRIES = 3

// Plan-specific rate limit configurations
const PLAN_LIMITS = {
  free: {
    maxConcurrent: 2,          // Free allows 3 concurrent, use 2 to be safe
    maxRequestsPerMin: 5,      // Free allows 6/min, use 5 to allow retries
    minRequestSpacingMs: 10000, // 10 seconds between requests (1 every 10s)
    initialRetryMs: 10000,     // 10s initial retry delay
  },
  paid: {
    maxConcurrent: 10,         // Paid allows 30 concurrent, use 10 for reasonable batch size
    maxRequestsPerMin: 150,    // Paid allows 180/min, use 150 to be safe
    minRequestSpacingMs: 400,  // ~400ms between requests (2.5/sec, under 3/sec limit)
    initialRetryMs: 5000,      // 5s initial retry delay
  },
} as const

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }, { once: true })
  })
}

// Global rate limiter: tracks recent request timestamps across all endpoint tabs
const globalRequestTimestamps: number[] = []
const RATE_LIMIT_WINDOW_MS = 60000  // 1 minute window

async function waitForRateLimit(
  plan: WorkersPlan,
  signal?: AbortSignal,
): Promise<void> {
  const limits = PLAN_LIMITS[plan]
  const now = Date.now()

  // Clean up timestamps older than 1 minute
  while (globalRequestTimestamps.length > 0 && globalRequestTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
    globalRequestTimestamps.shift()
  }

  // Enforce minimum spacing between requests
  if (globalRequestTimestamps.length > 0) {
    const lastRequestTime = globalRequestTimestamps[globalRequestTimestamps.length - 1]
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < limits.minRequestSpacingMs) {
      const spacingWait = limits.minRequestSpacingMs - timeSinceLastRequest
      await wait(spacingWait, signal)
    }
  }

  // If we've made max requests in the last minute, wait until the oldest one expires
  const nowAfterSpacing = Date.now()
  while (globalRequestTimestamps.length > 0 && globalRequestTimestamps[0] < nowAfterSpacing - RATE_LIMIT_WINDOW_MS) {
    globalRequestTimestamps.shift()
  }

  if (globalRequestTimestamps.length >= limits.maxRequestsPerMin) {
    const oldestTimestamp = globalRequestTimestamps[0]
    const waitTime = (oldestTimestamp + RATE_LIMIT_WINDOW_MS) - nowAfterSpacing
    if (waitTime > 0) {
      await wait(waitTime, signal)
    }
    // Clean up again after waiting
    const nowAfterWait = Date.now()
    while (globalRequestTimestamps.length > 0 && globalRequestTimestamps[0] < nowAfterWait - RATE_LIMIT_WINDOW_MS) {
      globalRequestTimestamps.shift()
    }
  }

  // Record this request
  globalRequestTimestamps.push(Date.now())
}

export function useBatchApiRequest() {
  // Results keyed by endpoint ID — persists across tab switches
  const [allEntries, setAllEntries] = useState<Record<string, BatchResponseEntry[]>>({})
  const [allActiveIndexes, setAllActiveIndexes] = useState<Record<string, number>>({})
  const [currentKey, setCurrentKey] = useState('')
  const blobUrlsRef = useRef<Record<string, string[]>>({})
  const abortRef = useRef<AbortController | null>(null)

  // Derived state for the current endpoint
  const entries = allEntries[currentKey] || []
  const activeIndex = allActiveIndexes[currentKey] || 0
  const loading = entries.some((e) => e.loading)

  const setActiveIndex = useCallback((index: number) => {
    setAllActiveIndexes((prev) => ({ ...prev, [currentKey]: index }))
  }, [currentKey])

  // Switch displayed endpoint — no abort, in-flight requests keep updating their key
  const switchTo = useCallback((key: string) => {
    setCurrentKey(key)
  }, [])

  // Cleanup all blob URLs on unmount
  useEffect(() => {
    const blobUrls = blobUrlsRef.current
    const abort = abortRef.current
    return () => {
      for (const urls of Object.values(blobUrls)) {
        for (const url of urls) URL.revokeObjectURL(url)
      }
      abort?.abort()
    }
  }, [])

  const execute = useCallback(
    async (
      endpoint: EndpointConfig,
      settings: Settings,
      formValues: Record<string, string>,
      urls: string[],
    ) => {
      const key = endpoint.id

      // Abort any in-flight requests
      abortRef.current?.abort()

      // Revoke old blob URLs for this endpoint only
      for (const url of blobUrlsRef.current[key] || []) {
        URL.revokeObjectURL(url)
      }
      blobUrlsRef.current[key] = []

      const controller = new AbortController()
      abortRef.current = controller

      setCurrentKey(key)

      // Initialize entries for this endpoint
      const initial: BatchResponseEntry[] = urls.map((url) => ({
        url,
        loading: true,
        response: null,
        state: { status: 'queued' } as RequestState,
      }))
      setAllEntries((prev) => ({ ...prev, [key]: initial }))
      setAllActiveIndexes((prev) => ({ ...prev, [key]: 0 }))

      // Get plan-specific limits
      const plan = settings.plan || 'free'  // Default to free plan if not set
      const limits = PLAN_LIMITS[plan]

      // Single request with retry-on-429 logic
      async function fetchWithRetry(
        url: string,
        index: number,
      ): Promise<void> {
        const values = url === '__html__' ? formValues : { ...formValues, url }
        const { url: fetchUrl, options } = buildFetchOptions(endpoint, settings, values)
        const start = performance.now()

        // Set state to running
        setAllEntries((prev) => ({
          ...prev,
          [key]: (prev[key] || []).map((e, i) =>
            i === index ? { ...e, state: { status: 'running', startTime: Date.now() } as RequestState } : e,
          ),
        }))

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          if (controller.signal.aborted) return

          // Wait for rate limit before making request
          try {
            await waitForRateLimit(plan, controller.signal)
          } catch (err) {
            if (controller.signal.aborted) return
            throw err
          }

          try {
            const res = await fetch(fetchUrl, {
              ...options,
              signal: controller.signal,
            })

            // Retry on 429
            if (res.status === 429 && attempt < MAX_RETRIES) {
              const retryAfter = res.headers.get('retry-after')
              const delayMs = retryAfter
                ? parseInt(retryAfter, 10) * 1000
                : limits.initialRetryMs * Math.pow(2, attempt)

              // Set retrying state
              const retryAt = Date.now() + delayMs
              setAllEntries((prev) => ({
                ...prev,
                [key]: (prev[key] || []).map((e, i) =>
                  i === index ? { ...e, state: { status: 'retrying', attempt: attempt + 1, nextRetryIn: delayMs, retryAt } as RequestState } : e,
                ),
              }))

              await wait(delayMs, controller.signal)

              // Set back to running
              setAllEntries((prev) => ({
                ...prev,
                [key]: (prev[key] || []).map((e, i) =>
                  i === index ? { ...e, state: { status: 'running', startTime: Date.now() } as RequestState } : e,
                ),
              }))

              continue
            }

            const duration = Math.round(performance.now() - start)
            const contentType = res.headers.get('content-type') || ''

            const isBinary =
              contentType.startsWith('image/') ||
              contentType.startsWith('application/pdf')

            let response: ApiResponse

            if (isBinary) {
              const blob = await res.blob()
              const blobUrl = URL.createObjectURL(blob)
              if (!blobUrlsRef.current[key]) blobUrlsRef.current[key] = []
              blobUrlsRef.current[key].push(blobUrl)
              response = {
                status: res.status,
                statusText: res.statusText,
                contentType,
                duration,
                data: blobUrl,
              }
            } else {
              const text = await res.text()
              response = {
                status: res.status,
                statusText: res.statusText,
                contentType,
                duration,
                data: text,
              }
            }

            setAllEntries((prev) => ({
              ...prev,
              [key]: (prev[key] || []).map((e, i) =>
                i === index ? { ...e, loading: false, response, state: { status: 'completed' } as RequestState } : e,
              ),
            }))
            return
          } catch (err) {
            if (controller.signal.aborted) return

            // Retry with backoff for transient network errors
            if (attempt < MAX_RETRIES) {
              const delayMs = limits.initialRetryMs * Math.pow(2, attempt)

              // Set retrying state
              const retryAt = Date.now() + delayMs
              setAllEntries((prev) => ({
                ...prev,
                [key]: (prev[key] || []).map((e, i) =>
                  i === index ? { ...e, state: { status: 'retrying', attempt: attempt + 1, nextRetryIn: delayMs, retryAt } as RequestState } : e,
                ),
              }))

              await wait(delayMs, controller.signal).catch(() => {})

              // Set back to running
              setAllEntries((prev) => ({
                ...prev,
                [key]: (prev[key] || []).map((e, i) =>
                  i === index ? { ...e, state: { status: 'running', startTime: Date.now() } as RequestState } : e,
                ),
              }))

              continue
            }

            // Final attempt — set error with actionable message
            const duration = Math.round(performance.now() - start)
            const raw = err instanceof Error ? err.message : 'Unknown error'
            const hint = raw === 'Failed to fetch'
              ? 'Could not connect to the API proxy at /api/cf. Is the server running?'
              : raw
            const response: ApiResponse = {
              status: 0,
              statusText: 'Connection Failed',
              contentType: '',
              duration,
              data: null,
              error: `${hint} (after ${MAX_RETRIES + 1} attempts)`,
            }

            setAllEntries((prev) => ({
              ...prev,
              [key]: (prev[key] || []).map((e, i) =>
                i === index ? { ...e, loading: false, response, state: { status: 'failed' } as RequestState } : e,
              ),
            }))
          }
        }
      }

      // Concurrency-limited execution
      // Rate limiting is handled by waitForRateLimit() inside fetchWithRetry
      const queue = urls.map((url, index) => ({ url, index }))
      let nextIdx = 0

      async function runNext(): Promise<void> {
        while (nextIdx < queue.length) {
          if (controller.signal.aborted) return
          const { url, index } = queue[nextIdx++]
          await fetchWithRetry(url, index)
        }
      }

      // Launch up to maxConcurrent workers
      const workers = Array.from(
        { length: Math.min(limits.maxConcurrent, urls.length) },
        () => runNext(),
      )
      await Promise.allSettled(workers)
    },
    [],
  )

  return { entries, activeIndex, setActiveIndex, loading, execute, switchTo }
}
