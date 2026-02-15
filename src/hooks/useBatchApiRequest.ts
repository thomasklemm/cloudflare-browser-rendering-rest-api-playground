import { useState, useRef, useCallback, useEffect } from 'react'
import type { EndpointConfig, Settings, ApiResponse, BatchResponseEntry } from '../types/api'
import { buildFetchOptions } from '../lib/buildRequest'

// Concurrency and pacing settings
const MAX_CONCURRENT = 2
const STAGGER_MS = 500
const MAX_RETRIES = 3
const INITIAL_RETRY_MS = 2000

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }, { once: true })
  })
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
      }))
      setAllEntries((prev) => ({ ...prev, [key]: initial }))
      setAllActiveIndexes((prev) => ({ ...prev, [key]: 0 }))

      // Single request with retry-on-429 logic
      async function fetchWithRetry(
        url: string,
        index: number,
      ): Promise<void> {
        const values = url === '__html__' ? formValues : { ...formValues, url }
        const { url: fetchUrl, options } = buildFetchOptions(endpoint, settings, values)
        const start = performance.now()

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          if (controller.signal.aborted) return

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
                : INITIAL_RETRY_MS * Math.pow(2, attempt)
              await wait(delayMs, controller.signal)
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
                i === index ? { ...e, loading: false, response } : e,
              ),
            }))
            return
          } catch (err) {
            if (controller.signal.aborted) return

            // Retry with backoff for transient network errors
            if (attempt < MAX_RETRIES) {
              const delayMs = INITIAL_RETRY_MS * Math.pow(2, attempt)
              await wait(delayMs, controller.signal).catch(() => {})
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
                i === index ? { ...e, loading: false, response } : e,
              ),
            }))
          }
        }
      }

      // Concurrency-limited execution with staggered starts
      const queue = urls.map((url, index) => ({ url, index }))
      let nextIdx = 0

      async function runNext(): Promise<void> {
        while (nextIdx < queue.length) {
          if (controller.signal.aborted) return
          const { url, index } = queue[nextIdx++]

          // Stagger: wait before starting each request after the first
          if (index > 0) {
            await wait(STAGGER_MS, controller.signal).catch(() => {})
            if (controller.signal.aborted) return
          }

          await fetchWithRetry(url, index)
        }
      }

      // Launch up to MAX_CONCURRENT workers
      const workers = Array.from(
        { length: Math.min(MAX_CONCURRENT, urls.length) },
        () => runNext(),
      )
      await Promise.allSettled(workers)
    },
    [],
  )

  return { entries, activeIndex, setActiveIndex, loading, execute, switchTo }
}
