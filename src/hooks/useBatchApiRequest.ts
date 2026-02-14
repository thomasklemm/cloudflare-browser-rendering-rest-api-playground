import { useState, useRef, useCallback, useEffect } from 'react'
import type { EndpointConfig, Settings, ApiResponse, BatchResponseEntry } from '../types/api'
import { buildFetchOptions } from '../lib/buildRequest'
import { detectContentWidth } from '../lib/detectContentWidth'

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
  const [entries, setEntries] = useState<BatchResponseEntry[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const blobUrlsRef = useRef<string[]>([])
  const abortRef = useRef<AbortController | null>(null)

  // Cleanup all blob URLs
  const revokeBlobUrls = useCallback(() => {
    for (const url of blobUrlsRef.current) {
      URL.revokeObjectURL(url)
    }
    blobUrlsRef.current = []
  }, [])

  useEffect(() => {
    return () => {
      revokeBlobUrls()
      abortRef.current?.abort()
    }
  }, [revokeBlobUrls])

  const loading = entries.some((e) => e.loading)

  const execute = useCallback(
    async (
      endpoint: EndpointConfig,
      settings: Settings,
      formValues: Record<string, string>,
      urls: string[],
    ) => {
      // Abort any in-flight requests
      abortRef.current?.abort()
      revokeBlobUrls()

      const controller = new AbortController()
      abortRef.current = controller

      // Initialize entries
      const initial: BatchResponseEntry[] = urls.map((url) => ({
        url,
        loading: true,
        response: null,
      }))
      setEntries(initial)
      setActiveIndex(0)

      // Single request with retry-on-429 logic
      async function fetchWithRetry(
        url: string,
        index: number,
      ): Promise<void> {
        let values = url === '__html__' ? formValues : { ...formValues, url }

        // Auto-detect content width: make a lightweight /scrape call first
        if (formValues._detectWidth === 'true' && url !== '__html__') {
          try {
            const width = await detectContentWidth(settings, url, controller.signal)
            if (width) {
              values = { ...values, 'viewport.width': String(width) }
            }
          } catch {
            // Detection failed (timeout, abort, etc.) — proceed with default width
          }
          if (controller.signal.aborted) return
        }

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
              blobUrlsRef.current.push(blobUrl)
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

            setEntries((prev) =>
              prev.map((e, i) =>
                i === index ? { ...e, loading: false, response } : e,
              ),
            )
            return
          } catch (err) {
            if (controller.signal.aborted) return

            // Only set error on final attempt
            if (attempt === MAX_RETRIES) {
              const duration = Math.round(performance.now() - start)
              const response: ApiResponse = {
                status: 0,
                statusText: 'Network Error',
                contentType: '',
                duration,
                data: null,
                error: err instanceof Error ? err.message : 'Unknown error',
              }

              setEntries((prev) =>
                prev.map((e, i) =>
                  i === index ? { ...e, loading: false, response } : e,
                ),
              )
            }
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
    [revokeBlobUrls],
  )

  const reset = useCallback(() => {
    abortRef.current?.abort()
    revokeBlobUrls()
    setEntries([])
    setActiveIndex(0)
  }, [revokeBlobUrls])

  return { entries, activeIndex, setActiveIndex, loading, execute, reset }
}
