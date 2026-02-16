import { useState, useCallback } from 'react'

type StorageKind = 'local' | 'session'

function getStorage(kind: StorageKind): Storage {
  return kind === 'session' ? window.sessionStorage : window.localStorage
}

export function useLocalStorage<T>(key: string, initialValue: T, storageKind: StorageKind = 'local') {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = getStorage(storageKind).getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value
        try {
          getStorage(storageKind).setItem(key, JSON.stringify(valueToStore))
        } catch {
          // Ignore storage write failures (e.g. private mode quota errors)
        }
        return valueToStore
      })
    },
    [key, storageKind],
  )

  return [storedValue, setValue] as const
}
