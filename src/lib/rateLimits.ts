import type { WorkersPlan } from '../types/api'

export const MAX_RETRIES = 3

export const PLAN_LIMITS = {
  free: {
    maxConcurrent: 1,
    maxRequestsPerMin: 6,
    minRequestSpacingMs: 10000,
    initialRetryMs: 15000,
  },
  paid: {
    maxConcurrent: 10,
    maxRequestsPerMin: 600,
    minRequestSpacingMs: 100,
    initialRetryMs: 5000,
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

const globalRequestTimestamps: number[] = []
const RATE_LIMIT_WINDOW_MS = 60000

export async function waitForRateLimit(
  plan: WorkersPlan,
  signal?: AbortSignal,
): Promise<void> {
  const limits = PLAN_LIMITS[plan]
  const now = Date.now()

  while (globalRequestTimestamps.length > 0 && globalRequestTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
    globalRequestTimestamps.shift()
  }

  if (globalRequestTimestamps.length > 0) {
    const lastRequestTime = globalRequestTimestamps[globalRequestTimestamps.length - 1]
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < limits.minRequestSpacingMs) {
      await wait(limits.minRequestSpacingMs - timeSinceLastRequest, signal)
    }
  }

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

    const nowAfterWait = Date.now()
    while (globalRequestTimestamps.length > 0 && globalRequestTimestamps[0] < nowAfterWait - RATE_LIMIT_WINDOW_MS) {
      globalRequestTimestamps.shift()
    }
  }

  globalRequestTimestamps.push(Date.now())
}
