import { getIdToken } from './auth'
import { uploadEndpoint } from './gateway-url'
import type {
  AnalyzedLine,
  AnalyzeResult,
  BomSummary,
  CrmAccount,
  CrmAccountSearchResponse,
  CrmStatus,
  CrmSyncResponse,
  ParseResult,
  PlaceOrderRequest,
  PlaceOrderResponse,
  QuoteRequest,
  QuoteResponse,
} from './types'

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
    const payload = body as {
      error: string
      message?: string
      retry_safe?: boolean
      quota_consumed?: boolean
    }
    if (payload.error === 'plan_cap_exceeded' && payload.message) {
      return payload.message
    }
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message
    }
    return payload.error
  }
  return `HTTP ${res.status}`
}

export class PlanCapError extends Error {
  readonly cap: string
  readonly used: number
  readonly limit: number
  readonly plan: string

  constructor(message: string, cap: string, used: number, limit: number, plan: string) {
    super(message)
    this.name = 'PlanCapError'
    this.cap = cap
    this.used = used
    this.limit = limit
    this.plan = plan
  }
}

function parsePlanCapError(res: Response, body: unknown): PlanCapError | null {
  if (res.status !== 402 || typeof body !== 'object' || !body || !('error' in body)) return null
  const payload = body as {
    error?: string
    cap?: string
    used?: number
    limit?: number
    plan?: string
    message?: string
  }
  if (payload.error !== 'plan_cap_exceeded') return null
  const message =
    payload.message ??
    `Plan limit reached (${payload.used ?? '?'}/${payload.limit ?? '?'} on ${payload.cap ?? 'cap'}).`
  return new PlanCapError(
    message,
    payload.cap ?? 'cap',
    payload.used ?? 0,
    payload.limit ?? 0,
    payload.plan ?? 'free',
  )
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

export async function quotePurchase(request: QuoteRequest): Promise<QuoteResponse> {
  const res = await fetch('/api/purchase/quote', {
    method: 'POST',
    headers: {
      ...(await authHeaders()),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  const body: unknown = await readJsonBody(res)
  if (!res.ok) throw new Error(await readErrorMessage(res, body))
  return body as QuoteResponse
}

export async function placeOrder(request: PlaceOrderRequest): Promise<PlaceOrderResponse> {
  const res = await fetch('/api/purchase/orders', {
    method: 'POST',
    headers: {
      ...(await authHeaders()),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  const body: unknown = await readJsonBody(res)
  if (!res.ok) throw new Error(await readErrorMessage(res, body))
  return body as PlaceOrderResponse
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
  active_boms_count?: number
}

export type PlanSource = 'stripe' | 'admin' | 'free'

export type BillingAccountStatus = {
  plan: BillingPlan
  status: BillingStatus
  plan_source?: PlanSource
  can_purchase: boolean
  limits: PlanLimitsApi
  usage: PlanUsageApi
  stripe_customer_id?: string | null
  current_period_end?: string | null
  admin_expires_at?: string | null
}

export async function getBillingStatus(): Promise<BillingAccountStatus> {
  const res = await fetch('/api/billing/status', { headers: await authHeaders() })
  const body: unknown = await readJsonBody(res)
  if (!res.ok) throw new Error(await readErrorMessage(res, body))
  return body as BillingAccountStatus
}

export async function startCheckout(
  plan: Exclude<BillingPlan, 'free'>,
  returnUrl: string,
): Promise<string> {
  const res = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, return_url: returnUrl }),
  })
  const body: unknown = await readJsonBody(res)
  if (!res.ok) throw new Error(await readErrorMessage(res, body))
  const clientSecret = (body as { client_secret?: string }).client_secret
  if (!clientSecret) throw new Error('Checkout client_secret missing')
  return clientSecret
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

export async function getCrmStatus(): Promise<CrmStatus> {
  const res = await fetch('/api/crm/status', { headers: await authHeaders() })
  const body: unknown = await readJsonBody(res)
  if (!res.ok) throw new Error(await readErrorMessage(res, body))
  return body as CrmStatus
}

export async function searchCrmAccounts(query: string): Promise<CrmAccount[]> {
  const qs = new URLSearchParams({ query })
  const res = await fetch(`/api/crm/accounts?${qs}`, { headers: await authHeaders() })
  const body: unknown = await readJsonBody(res)
  if (!res.ok) throw new Error(await readErrorMessage(res, body))
  return (body as CrmAccountSearchResponse).accounts ?? []
}

export async function syncBomToCrm(bomId: string, accountId: string): Promise<CrmSyncResponse> {
  const res = await fetch(`/api/crm/boms/${encodeURIComponent(bomId)}/sync`, {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ account_id: accountId }),
  })
  const body: unknown = await readJsonBody(res)
  if (!res.ok) throw new Error(await readErrorMessage(res, body))
  return body as CrmSyncResponse
}

export type TeamRole = 'owner' | 'admin' | 'read_only'

export type TeamMember = {
  user_id: string
  email?: string | null
  first_name?: string | null
  last_name?: string | null
  role: TeamRole
  created_at: string
}

export type TeamInviteDelivery = 'sent' | 'queued' | 'not_configured' | 'failed'

export type TeamInvite = {
  id: string
  email: string
  role: TeamRole
  invited_by: string
  expires_at: string
  created_at: string
  accept_url?: string
  email_sent?: boolean
  email_delivery?: TeamInviteDelivery
  email_error?: string | null
}

export type TeamSnapshot = {
  account_id: string
  user_id: string
  role: TeamRole
  plan: BillingPlan
  seats: { used: number; limit: number }
  members: TeamMember[]
  invites: TeamInvite[]
}

export async function getTeam(): Promise<TeamSnapshot> {
  const res = await fetch('/api/team/members', { headers: await authHeaders() })
  const body: unknown = await readJsonBody(res)
  if (!res.ok) throw new Error(await readErrorMessage(res, body))
  return body as TeamSnapshot
}

export async function createTeamInvite(
  email: string,
  role: Exclude<TeamRole, 'owner'>,
): Promise<TeamInvite> {
  const res = await fetch('/api/team/invites', {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role }),
  })
  const body: unknown = await readJsonBody(res)
  if (!res.ok) {
    throw parsePlanCapError(res, body) ?? new Error(await readErrorMessage(res, body))
  }
  return body as TeamInvite
}

export async function revokeTeamInvite(id: string): Promise<void> {
  const res = await fetch(`/api/team/invites/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!res.ok) {
    const body: unknown = await readJsonBody(res)
    throw new Error(await readErrorMessage(res, body))
  }
}

export async function removeTeamMember(userId: string): Promise<void> {
  const res = await fetch(`/api/team/members/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!res.ok) {
    const body: unknown = await readJsonBody(res)
    throw new Error(await readErrorMessage(res, body))
  }
}

export async function patchTeamMemberRole(
  userId: string,
  role: Exclude<TeamRole, 'owner'>,
): Promise<TeamMember> {
  const res = await fetch(`/api/team/members/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  })
  const body: unknown = await readJsonBody(res)
  if (!res.ok) throw new Error(await readErrorMessage(res, body))
  return body as TeamMember
}

export async function acceptTeamInvite(token: string): Promise<{ account_id: string; role: TeamRole }> {
  const res = await fetch('/api/team/invites/accept', {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  const body: unknown = await readJsonBody(res)
  if (!res.ok) throw new Error(await readErrorMessage(res, body))
  return body as { account_id: string; role: TeamRole }
}

