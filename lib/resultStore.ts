import type { AnalyzeResult } from './types'

const STORAGE_KEY = 'prokuro:analyze-results'

type Store = Record<string, AnalyzeResult>

function readStore(): Store {
  if (typeof window === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Store) : {}
  } catch {
    return {}
  }
}

function writeStore(store: Store) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function saveAnalyzeResult(result: AnalyzeResult) {
  const store = readStore()
  store[result.upload_id] = result
  writeStore(store)
}

export function getAnalyzeResult(uploadId: string): AnalyzeResult | null {
  return readStore()[uploadId] ?? null
}
