import type { ParseResult } from './types'

const STORAGE_KEY = 'prokuro:parsed-boms'

export interface StoredBom {
  id: string
  filename: string
  uploadedAt: string
  parseResult: ParseResult
}

type Store = Record<string, StoredBom>

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

export function saveParsedBom(result: ParseResult, filename?: string): StoredBom {
  const entry: StoredBom = {
    id: crypto.randomUUID(),
    filename: filename ?? result.source_filename,
    uploadedAt: new Date().toISOString(),
    parseResult: result,
  }
  const store = readStore()
  store[entry.id] = entry
  writeStore(store)
  return entry
}

export function listParsedBoms(): StoredBom[] {
  return Object.values(readStore()).sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  )
}

export function getParsedBom(id: string): StoredBom | null {
  return readStore()[id] ?? null
}
