import { getIdToken } from './auth'
import type { AnalyzeResult, BomSummary, ParseResult } from './types'

export interface BomRecord {
  summary: BomSummary
  analyze: AnalyzeResult
  parse: ParseResult | null
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await getIdToken()
  if (!token) throw new Error('Not signed in')
  return { Authorization: `Bearer ${token}` }
}

async function postFile(endpoint: string, file: File): Promise<Response> {
  const form = new FormData()
  form.append('file', file)
  return fetch(endpoint, { method: 'POST', body: form })
}

function isParseResult(body: unknown): body is ParseResult {
  if (!body || typeof body !== 'object') return false
  const candidate = body as Partial<ParseResult>
  return typeof candidate.mapping_confidence === 'number' && Array.isArray(candidate.lines) && typeof candidate.source_filename === 'string'
}

export async function parseFile(file: File): Promise<ParseResult> {
  const res = await postFile('/api/parse', file)
  const body: unknown = await res.json()
  if (res.ok) return body as ParseResult

  if (res.status === 422 && isParseResult(body)) return body

  const message = typeof body === 'object' && body && 'error' in body && typeof body.error === 'string' ? body.error : `HTTP ${res.status}`
  throw new Error(message)
}

export async function analyzeFile(file: File): Promise<AnalyzeResult> {
  const res = await postFile('/api/analyze', file)
  const body: unknown = await res.json()
  if (!res.ok) {
    const message = typeof body === 'object' && body && 'error' in body && typeof body.error === 'string' ? body.error : `HTTP ${res.status}`
    throw new Error(message)
  }
  return body as AnalyzeResult
}

export async function listBoms(): Promise<BomSummary[]> {
  const res = await fetch('/api/boms', { headers: await authHeaders() })
  const body: unknown = await res.json()
  if (!res.ok) {
    const message = typeof body === 'object' && body && 'error' in body && typeof body.error === 'string' ? body.error : `HTTP ${res.status}`
    throw new Error(message)
  }
  return (body as { boms: BomSummary[] }).boms
}

export async function getBom(id: string): Promise<BomRecord> {
  const res = await fetch(`/api/boms/${encodeURIComponent(id)}`, { headers: await authHeaders() })
  const body: unknown = await res.json()
  if (!res.ok) {
    const message = typeof body === 'object' && body && 'error' in body && typeof body.error === 'string' ? body.error : `HTTP ${res.status}`
    throw new Error(message)
  }
  return body as BomRecord
}

export async function deleteBom(id: string): Promise<void> {
  const res = await fetch(`/api/boms/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (res.ok) return

  const body: unknown = await res.json().catch(() => null)
  const message = typeof body === 'object' && body && 'error' in body && typeof body.error === 'string' ? body.error : `HTTP ${res.status}`
  throw new Error(message)
}

export async function saveBom(file: File, analyze: AnalyzeResult, options?: { name?: string; parse?: ParseResult | null }): Promise<BomSummary> {
  const form = new FormData()
  form.append('file', file)
  form.append('analyze', JSON.stringify(analyze))
  if (options?.parse) form.append('parse', JSON.stringify(options.parse))
  if (options?.name) form.append('name', options.name)

  const res = await fetch('/api/boms', {
    method: 'POST',
    headers: await authHeaders(),
    body: form,
  })
  const body: unknown = await res.json()
  if (!res.ok) {
    const message = typeof body === 'object' && body && 'error' in body && typeof body.error === 'string' ? body.error : `HTTP ${res.status}`
    throw new Error(message)
  }
  return body as BomSummary
}
