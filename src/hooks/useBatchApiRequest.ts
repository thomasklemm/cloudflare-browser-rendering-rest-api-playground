import { useState, useRef, useCallback, useEffect } from 'react'
import type { EndpointConfig, Settings, ApiResponse, BatchResponseEntry } from '../types/api'
import { buildFetchOptions } from '../lib/buildRequest'

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

      // Fire all requests in parallel
      const promises = urls.map(async (url, index) => {
        const values = { ...formValues, url }
        const { url: fetchUrl, options } = buildFetchOptions(endpoint, settings, values)
        const start = performance.now()

        try {
          const res = await fetch(fetchUrl, {
            ...options,
            signal: controller.signal,
          })
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
        } catch (err) {
          if (controller.signal.aborted) return

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
      })

      await Promise.allSettled(promises)
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
