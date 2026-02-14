import { useState, useRef, useCallback, useEffect } from 'react'
import type { EndpointConfig, Settings, ApiResponse } from '../types/api'
import { buildFetchOptions } from '../lib/buildRequest'

export function useApiRequest() {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
      }
    }
  }, [])

  const execute = useCallback(
    async (
      endpoint: EndpointConfig,
      settings: Settings,
      formValues: Record<string, string>,
    ) => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }

      setLoading(true)
      setResponse(null)

      const start = performance.now()
      const { url, options } = buildFetchOptions(endpoint, settings, formValues)

      try {
        const res = await fetch(url, options)
        const duration = Math.round(performance.now() - start)
        const contentType = res.headers.get('content-type') || ''

        const isBinary =
          contentType.startsWith('image/') ||
          contentType.startsWith('application/pdf')

        let data: string | Blob | null = null

        if (isBinary) {
          const blob = await res.blob()
          const blobUrl = URL.createObjectURL(blob)
          blobUrlRef.current = blobUrl
          data = blob
          setResponse({
            status: res.status,
            statusText: res.statusText,
            contentType,
            duration,
            data: blobUrl as unknown as string,
          })
        } else {
          data = await res.text()
          setResponse({
            status: res.status,
            statusText: res.statusText,
            contentType,
            duration,
            data,
          })
        }

        void data
      } catch (err) {
        const duration = Math.round(performance.now() - start)
        setResponse({
          status: 0,
          statusText: 'Network Error',
          contentType: '',
          duration,
          data: null,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const reset = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
    setResponse(null)
  }, [])

  return { loading, response, execute, reset }
}
