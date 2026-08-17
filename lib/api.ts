import { getIdToken } from './auth'
import { uploadEndpoint } from './gateway-url'
import type { AnalyzedLine, AnalyzeResult, BomSummary, ParseResult } from './types'

export interface BomRecord {
  summary: BomSummary
  analyze: AnalyzeResult
  parse?: ParseResult | null
}

export class BomConflictError extends Error {
  constructor(message = 'this BOM was updated elsewhere, refresh to see the latest') {
    super(message)
    this.name = 'BomConflictError'
  }
}

export class BomServerError extends Error {
  constructor(message = 'Your change could not be saved, please try again') {
    super(message)
    this.name = 'BomServerError'
  }
}

export class BomNetworkError extends Error {
  constructor(message = "couldn't reach the server") {
    super(message)
    this.name = 'BomNetworkError'
  }
}

export type BomLinePatch = {
  version: number
  mpn?: string
  manufacturer?: string
  quantity?: number
  refdes?: string
  description?: string
}

export type BomLineMutationResult = {
  version: number
  lineIndex: number
  line: AnalyzedLine
}

export type BomLineDeleteResult = {
  version: number
  lineCount: number
}

export interface Page<T> {
  items: T[]
  next_token?: string | null
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await getIdToken()
  if (!token) throw new Error('Not signed in')
  return { Authorization: `Bearer ${token}` }
}

async function readErrorMessage(res: Response, body: unknown): Promise<string> {
  if (typeof body === 'object' && body && 'error' in body && typeof body.error === 'string') {
    return body.error
  }
  return `HTTP ${res.status}`
}

async function postFile(
  endpoint: string,
  file: File,
  extra?: Record<string, string>,
): Promise<Response> {
  const form = new FormData()
  form.append('file', file)
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      form.append(key, value)
    }
  }
  return fetch(endpoint, { method: 'POST', body: form })
}

function isParseResult(body: unknown): body is ParseResult {
  if (!body || typeof body !== 'object') return false
  const candidate = body as Partial<ParseResult>
  return typeof candidate.mapping_confidence === 'number' && Array.isArray(candidate.lines) && typeof candidate.source_filename === 'string'
}

async function readJsonBody(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    throw new Error(res.ok ? 'Invalid response from server' : `HTTP ${res.status}: Could not reach backend service`)
  }
}

export async function parseFile(
  file: File,
  options?: { columnMapping?: Record<string, string> },
): Promise<ParseResult> {
  const extra = options?.columnMapping
    ? { column_mapping: JSON.stringify(options.columnMapping) }
    : undefined
  const res = await postFile(uploadEndpoint('parse'), file, extra)
  const body: unknown = await readJsonBody(res)
  if (res.ok) return body as ParseResult

  if (res.status === 422 && isParseResult(body)) return body

  throw new Error(await readErrorMessage(res, body))
}

export async function analyzeFile(
  file: File,
  options?: { columnMapping?: Record<string, string> },
): Promise<AnalyzeResult> {
  const extra = options?.columnMapping
    ? { column_mapping: JSON.stringify(options.columnMapping) }
    : undefined
  const res = await postFile(uploadEndpoint('analyze'), file, extra)
  const body: unknown = await readJsonBody(res)
  if (!res.ok) throw new Error(await readErrorMessage(res, body))
  return body as AnalyzeResult
}

export async function listBoms(params?: {
  limit?: number
  next_token?: string | null
}): Promise<Page<BomSummary>> {
  const qs = new URLSearchParams()
  if (params?.limit != null) qs.set('limit', String(params.limit))
  if (params?.next_token) qs.set('next_token', params.next_token)
  const query = qs.toString()
  const res = await fetch(`/api/boms${query ? `?${query}` : ''}`, { headers: await authHeaders() })
  const body: unknown = await readJsonBody(res)
  if (!res.ok) throw new Error(await readErrorMessage(res, body))
  return body as Page<BomSummary>
}

export async function getBom(id: string): Promise<BomRecord> {
  const res = await fetch(`/api/boms/${encodeURIComponent(id)}`, { headers: await authHeaders() })
  const body: unknown = await readJsonBody(res)
  if (!res.ok) throw new Error(await readErrorMessage(res, body))
  return body as BomRecord
}

export async function deleteBom(id: string): Promise<void> {
  const res = await fetch(`/api/boms/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (res.ok || res.status === 404) return

  const body: unknown = await res.json().catch(() => null)
  throw new Error(await readErrorMessage(res, body))
}

async function throwIfBomWriteFailed(res: Response, body: unknown): Promise<never> {
  if (res.status === 409) {
    const message =
      typeof body === 'object' && body && 'error' in body && typeof body.error === 'string'
        ? body.error
        : undefined
    throw new BomConflictError(message)
  }
  if (res.status >= 500) {
    throw new BomServerError()
  }
  throw new Error(await readErrorMessage(res, body))
}

async function bomWriteFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init)
  } catch {
    throw new BomNetworkError()
  }
}

export async function putBom(
  id: string,
  version: number,
  lines: AnalyzedLine[],
): Promise<BomRecord> {
  const res = await bomWriteFetch(`/api/boms/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ version, lines }),
  })
  const body: unknown = await readJsonBody(res)
  if (!res.ok) await throwIfBomWriteFailed(res, body)
  return body as BomRecord
}

export async function patchBomLine(
  id: string,
  lineIndex: number,
  patch: BomLinePatch,
): Promise<BomLineMutationResult> {
  const res = await bomWriteFetch(
    `/api/boms/${encodeURIComponent(id)}/lines/${encodeURIComponent(String(lineIndex))}`,
    {
      method: 'PATCH',
      headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    },
  )
  const body: unknown = await readJsonBody(res)
  if (!res.ok) await throwIfBomWriteFailed(res, body)
  return body as BomLineMutationResult
}

export async function deleteBomLine(
  id: string,
  lineIndex: number,
  version: number,
): Promise<BomLineDeleteResult> {
  const qs = new URLSearchParams({ version: String(version) })
  const res = await bomWriteFetch(
    `/api/boms/${encodeURIComponent(id)}/lines/${encodeURIComponent(String(lineIndex))}?${qs}`,
    {
      method: 'DELETE',
      headers: await authHeaders(),
    },
  )
  const body: unknown = await readJsonBody(res)
  if (!res.ok) await throwIfBomWriteFailed(res, body)
  return body as BomLineDeleteResult
}

export async function addBomLine(
  id: string,
  input: BomLinePatch,
): Promise<BomLineMutationResult> {
  const res = await bomWriteFetch(`/api/boms/${encodeURIComponent(id)}/lines`, {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const body: unknown = await readJsonBody(res)
  if (!res.ok) await throwIfBomWriteFailed(res, body)
  return body as BomLineMutationResult
}

export async function saveBom(
  file: File,
  analyze: AnalyzeResult,
  options?: { name?: string; parse?: ParseResult | null },
): Promise<BomSummary> {
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
  const body: unknown = await readJsonBody(res)
  if (!res.ok) throw new Error(await readErrorMessage(res, body))
  return body as BomSummary
}

export type BillingPlan = 'free' | 'growth' | 'scale'
export type BillingStatus = 'none' | 'trialing' | 'active' | 'past_due' | 'canceled'

export type PlanLimitsApi = {
  seats: number
  active_boms: number
  max_lines_per_bom: number
  lines_per_month: number
  analyses_per_month: number
  purchasing_actions_per_month: number
  orders_per_month: number
  concurrent_analyses: number
  unique_mpn_lookups_per_day: number
  refresh: 'weekly' | 'daily'
  bedrock: string
}

export type PlanUsageApi = {
  analyses_count: number
  lines_count: number
  purchasing_actions_count: number
  orders_count: number
}

export type BillingAccountStatus = {
  plan: BillingPlan
  status: BillingStatus
  can_purchase: boolean
  limits?: PlanLimitsApi
  usage?: PlanUsageApi
  stripe_customer_id?: string | null
  current_period_end?: string | null
}

export async function getBillingStatus(): Promise<BillingAccountStatus> {
  const res = await fetch('/api/billing/status', { headers: await authHeaders() })
  const body: unknown = await readJsonBody(res)
  if (!res.ok) throw new Error(await readErrorMessage(res, body))
  return body as BillingAccountStatus
}

export async function startCheckout(
  plan: Exclude<BillingPlan, 'free'>,
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  const res = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, success_url: successUrl, cancel_url: cancelUrl }),
  })
  const body: unknown = await readJsonBody(res)
  if (!res.ok) throw new Error(await readErrorMessage(res, body))
  const url = (body as { url?: string }).url
  if (!url) throw new Error('Checkout URL missing')
  return url
}

export async function openBillingPortal(returnUrl: string): Promise<string> {
  const res = await fetch('/api/billing/portal', {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ return_url: returnUrl }),
  })
  const body: unknown = await readJsonBody(res)
  if (!res.ok) throw new Error(await readErrorMessage(res, body))
  const url = (body as { url?: string }).url
  if (!url) throw new Error('Portal URL missing')
  return url
}

export type PurchaseProvider = 'digikey' | 'mouser'

export type PurchaseLine = {
  mpn: string
  quantity: number
  manufacturer?: string
}

export type QuoteResponse = {
  provider: PurchaseProvider
  status: string
  lines?: Array<{
    mpn: string
    quantity: number
    unit_price?: number
    extended_price?: number
    currency?: string
    error?: string
  }>
  subtotal?: number
  currency?: string
  message?: string
}

export async function purchaseQuote(
  provider: PurchaseProvider,
  lines: PurchaseLine[],
): Promise<QuoteResponse> {
  const res = await fetch('/api/purchase/quote', {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, lines }),
  })
  const body: unknown = await readJsonBody(res)
  if (!res.ok) throw new Error(await readErrorMessage(res, body))
  return body as QuoteResponse
}

