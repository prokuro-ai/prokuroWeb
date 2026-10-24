import { addToCart, cartLineFrom, MPN_LIKE, partKey, type CartLine, type CatalogPart } from '@/lib/cart'
import { briefAlternate } from '@/lib/decision'
import { money } from '@/lib/purchaseDisplay'
import type {
  PartLifecycle,
  SourcingAlternate,
  SourcingBuy,
  SourcingLineStatus,
  SourcingNote,
  SourcingPlan,
  SourcingPlanLine,
  SourcingRun,
  SourcingRunRequest,
} from '@/lib/types'

/** Gateway limits; checked here so the buyer hears about them before a run starts. */
export const MAX_RUN_LINES = 200
export const MAX_RUN_QUANTITY = 1_000_000
const MAX_ALTERNATES = 5

export const PLAN_STORAGE_KEY = 'prokuro:sourcing-plan:v1'
const PLAN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
/** The gateway forgets runs after 30 minutes. */
const RUN_MAX_AGE_MS = 30 * 60 * 1000

/** Savings under half a cent are rounding, not something to tell a buyer about. */
const MEANINGFUL_SAVING = 0.005

function requestedQuantity(quantity: number): number {
  return Math.min(Math.max(1, Math.round(quantity)), MAX_RUN_QUANTITY)
}

/**
 * Whether the plan still describes the cart. A line matches at the quantity that was sourced,
 * at the quantity the plan buys (after "Apply to cart"), or swapped for its alternate.
 */
function samePackage(asked: string | null | undefined, cartFit: string | null | undefined): boolean {
  return (asked ?? '').trim() === (cartFit ?? '').trim()
}

export function planMatchesCart(plan: SourcingPlan, cart: CartLine[]): boolean {
  const byKey = new Map(cart.map((line) => [line.key, line]))
  const covered = new Set<string>()
  const swappedIn = new Map<string, number>()
  for (const line of plan.lines) {
    const key = partKey(line.mpn)
    const current = byKey.get(key)
    if (current) {
      if (requestedQuantity(current.quantity) !== line.requested && current.quantity !== line.buy?.quantity) return false
      if (!samePackage(line.fit, current.fit)) return false
      covered.add(key)
      continue
    }
    const swapKey = line.alternate ? partKey(line.alternate.mpn) : null
    const swapped = swapKey ? byKey.get(swapKey) : undefined
    if (!swapped) return false
    if (!samePackage(line.fit, swapped.fit)) return false
    swappedIn.set(swapKey!, (swappedIn.get(swapKey!) ?? 0) + line.alternate!.buy.quantity)
  }
  for (const [key, quantity] of swappedIn) {
    if (covered.has(key) || byKey.get(key)?.quantity !== quantity) return false
    covered.add(key)
  }
  return covered.size === byKey.size
}

export function alternatesFor(part: CatalogPart | undefined): { mpn: string; approved: boolean }[] {
  if (!part) return []
  const seen = new Set([part.key])
  const out: { mpn: string; approved: boolean }[] = []
  const push = (raw: string | null | undefined, approved: boolean) => {
    const mpn = raw?.trim()
    if (!mpn || !MPN_LIKE.test(mpn) || seen.has(partKey(mpn))) return
    seen.add(partKey(mpn))
    out.push({ mpn, approved })
  }
  for (const mpn of part.line.aml_candidates) push(mpn, true)
  push(briefAlternate(part.line), false)
  return out.slice(0, MAX_ALTERNATES)
}

export function runRequest(cart: CartLine[], catalog: CatalogPart[]): SourcingRunRequest {
  const byKey = new Map(catalog.map((part) => [part.key, part]))
  return {
    lines: cart.map((line) => {
      const alternates = alternatesFor(byKey.get(line.key))
      return {
        mpn: line.mpn,
        quantity: requestedQuantity(line.quantity),
        ...(line.manufacturer ? { manufacturer: line.manufacturer } : {}),
        ...(line.description ? { description: line.description } : {}),
        ...(line.fit ? { fit: line.fit } : {}),
        ...(alternates.length > 0 ? { alternates } : {}),
      }
    }),
  }
}

export type Tone = 'good' | 'warn' | 'bad' | 'muted'

export const STATUS_META: Record<SourcingLineStatus, { label: string; tone: Tone; rank: number }> = {
  out_of_stock: { label: 'Out of stock', tone: 'bad', rank: 0 },
  not_found: { label: 'Not found', tone: 'bad', rank: 1 },
  does_not_fit: { label: 'Doesn’t fit', tone: 'bad', rank: 2 },
  no_price: { label: 'No price', tone: 'bad', rank: 3 },
  short: { label: 'Short', tone: 'warn', rank: 4 },
  ambiguous: { label: 'Needs detail', tone: 'warn', rank: 5 },
  unchecked: { label: 'Not checked', tone: 'muted', rank: 6 },
  invalid: { label: 'Not a part number', tone: 'muted', rank: 7 },
  ready: { label: 'Ready', tone: 'good', rank: 8 },
}

export const STATUS_ORDER = (Object.keys(STATUS_META) as SourcingLineStatus[]).sort(
  (a, b) => STATUS_META[a].rank - STATUS_META[b].rank,
)

/** What a buyer should do about a line the plan can't fully buy. */
export function statusHint(line: SourcingPlanLine): string | null {
  switch (line.status) {
    case 'not_found':
      return 'No source lists this part number. Check it for typos, or add the full number with its packaging suffix.'
    case 'ambiguous':
      return 'Several different parts match this number. Add the full part number so we price the right one.'
    case 'no_price':
      return 'No source publishes a price for it, so it needs a quote request.'
    case 'unchecked':
      return 'Our sources didn’t answer in time. Run sourcing again in a minute.'
    case 'invalid':
      return 'This doesn’t look like a part number, so it wasn’t looked up.'
    case 'out_of_stock':
      return line.alternate || line.notes.some((note) => note.kind === 'shortfall')
        ? null
        : 'Nothing on hand at any source we checked.'
    case 'does_not_fit':
      return line.notes.some((note) => note.kind === 'does_not_fit' || note.kind === 'package_unpublished')
        ? null
        : 'This part doesn’t match the package, so it isn’t available to order.'
    default:
      return null
  }
}

const LIFECYCLE_TEXT: Record<PartLifecycle, string | null> = {
  active: null,
  not_for_new_designs: 'Not recommended for new designs',
  last_time_buy: 'Last-time buy: the maker is ending this part',
  not_carried: 'Our sources no longer carry this part',
  obsolete: 'Obsolete: the maker no longer produces it',
}

function pcs(value: number): string {
  return value.toLocaleString('en-US')
}

function leadTime(days: number): string {
  if (days < 14) return `${days} ${days === 1 ? 'day' : 'days'}`
  const weeks = Math.round(days / 7)
  return `${weeks} weeks`
}

export function noteText(note: SourcingNote, currency: string): { text: string; tone: Tone } | null {
  switch (note.kind) {
    case 'price_break':
      if (note.saves < MEANINGFUL_SAVING) return null
      return {
        text: `Buying ${pcs(note.to)} instead of ${pcs(note.from)} hits a price break and saves ${money(note.saves, currency)}`,
        tone: 'good',
      }
    case 'minimum_order':
      return { text: `Minimum order or pack size raises ${pcs(note.from)} to ${pcs(note.to)}`, tone: 'muted' }
    case 'compared_sources':
      if (note.sources < 2) return null
      return note.saves >= MEANINGFUL_SAVING
        ? { text: `Best of ${note.sources} sources, ${money(note.saves, currency)} under the next`, tone: 'good' }
        : { text: `Compared ${note.sources} sources`, tone: 'muted' }
    case 'split':
      return { text: `Split across ${note.sources} sources to cover the full quantity`, tone: 'muted' }
    case 'shortfall':
      return note.available > 0
        ? { text: `Only ${pcs(note.available)} available, ${pcs(note.missing)} short`, tone: 'warn' }
        : { text: `None available, ${pcs(note.missing)} short`, tone: 'bad' }
    case 'lead_time':
      return note.days > 0 ? { text: `Factory lead time about ${leadTime(note.days)}`, tone: 'muted' } : null
    case 'matched_as':
      return { text: `Listed as ${note.mpn}. Check it’s the part you want`, tone: 'warn' }
    case 'partial_check':
      return { text: 'One source didn’t answer, so a better price may exist', tone: 'muted' }
    case 'lifecycle': {
      const text = LIFECYCLE_TEXT[note.status]
      if (!text) return null
      return { text, tone: note.status === 'not_for_new_designs' ? 'muted' : 'warn' }
    }
    case 'does_not_fit':
      return { text: `Listed as ${note.listed}. You asked for ${note.asked}.`, tone: 'warn' }
    case 'no_fit':
      return { text: `Nothing else fits ${note.asked}.`, tone: 'muted' }
    case 'package_unpublished':
      return {
        text: `No package was published for this part, so it wasn’t marked available for ${note.asked}.`,
        tone: 'warn',
      }
    default:
      return null
  }
}

export function swapText(alternate: SourcingAlternate, line: SourcingPlanLine, currency: string): string {
  const source = alternate.approved
    ? 'on your AML'
    : alternate.discovered
      ? 'matches the package'
      : 'suggested in the line brief'
  const cost = `${pcs(alternate.buy.quantity)} for ${money(alternate.buy.total, currency)}`
  const fit = alternate.case_label ? `. ${alternate.case_label}, same package you asked for` : ''
  if (alternate.reason === 'cheaper') {
    const saves = alternate.saves != null ? `, saves ${money(alternate.saves, currency)}` : ''
    return `${alternate.mpn} (${source}) covers it: ${cost}${saves}${fit}`
  }
  const why =
    line.status === 'not_found'
      ? 'can’t be found'
      : line.status === 'short'
        ? 'is short'
        : line.status === 'does_not_fit'
          ? 'doesn’t match the package'
          : 'can’t be bought'
  return `${line.mpn} ${why}. ${alternate.mpn} (${source}) is in stock: ${cost}${fit}`
}

/** Attention first, then the biggest spend, so the review starts where money and risk are. */
export function sortLines(lines: SourcingPlanLine[]): SourcingPlanLine[] {
  return [...lines].sort(
    (a, b) =>
      STATUS_META[a.status].rank - STATUS_META[b.status].rank ||
      Number(!!b.alternate) - Number(!!a.alternate) ||
      (b.buy?.total ?? 0) - (a.buy?.total ?? 0) ||
      a.mpn.localeCompare(b.mpn),
  )
}

const BAR_ORDER: SourcingLineStatus[] = [
  'ready',
  'short',
  'ambiguous',
  'no_price',
  'not_found',
  'does_not_fit',
  'out_of_stock',
  'unchecked',
  'invalid',
]

export function coverage(plan: SourcingPlan): { status: SourcingLineStatus; count: number; share: number }[] {
  const total = plan.lines.length
  if (total === 0) return []
  return BAR_ORDER.map((status) => {
    const count = plan.lines.filter((line) => line.status === status).length
    return { status, count, share: count / total }
  }).filter((segment) => segment.count > 0)
}

export function needsAttention(plan: SourcingPlan): number {
  return plan.lines.filter((line) => line.status !== 'ready').length
}

/** Plan total with accepted swaps priced in. */
export function plannedTotal(plan: SourcingPlan, swaps: ReadonlySet<string>): number {
  let total = 0
  for (const line of plan.lines) {
    if (line.alternate && swaps.has(partKey(line.mpn))) total += line.alternate.buy.total
    else total += line.buy?.total ?? 0
  }
  return total
}

export function plannedSavings(plan: SourcingPlan, swaps: ReadonlySet<string>): number {
  let saved = Math.max(0, plan.saved)
  for (const line of plan.lines) {
    if (line.alternate?.reason === 'cheaper' && line.alternate.saves && swaps.has(partKey(line.mpn))) {
      saved += line.alternate.saves
    }
  }
  return saved
}

export type ApplyResult = { cart: CartLine[]; raised: number; swapped: number }

/**
 * Raises ready lines to the quantity the plan buys (price breaks, minimum orders) and swaps in
 * accepted alternates. Short lines keep the quantity the buyer asked for: they still need it.
 */
export function applyPlan(cart: CartLine[], plan: SourcingPlan, swaps: ReadonlySet<string>): ApplyResult {
  const byKey = new Map(plan.lines.map((line) => [partKey(line.mpn), line]))
  let raised = 0
  let swapped = 0
  const kept: CartLine[] = []
  const swapIns: CartLine[] = []
  for (const item of cart) {
    const line = byKey.get(item.key)
    if (line?.alternate && swaps.has(item.key)) {
      swapped += 1
      swapIns.push(
        cartLineFrom(
          {
            mpn: line.alternate.mpn,
            manufacturer: line.alternate.manufacturer ?? null,
            description: line.alternate.description ?? `Alternate for ${item.mpn}`,
            fit: item.fit,
          },
          Math.max(line.alternate.buy.quantity, 1),
        ),
      )
      continue
    }
    if (line?.status === 'ready' && line.buy && line.buy.quantity > item.quantity) {
      raised += 1
      kept.push({ ...item, quantity: line.buy.quantity })
      continue
    }
    kept.push(item)
  }
  return { cart: addToCart(kept, swapIns), raised, swapped }
}

/** Swaps the cart already made: the alternate is in the cart and the original isn't. */
export function swappedInCart(cart: CartLine[], plan: SourcingPlan): Set<string> {
  const keys = new Set(cart.map((line) => line.key))
  const swapped = new Set<string>()
  for (const line of plan.lines) {
    const key = partKey(line.mpn)
    if (line.alternate && !keys.has(key) && keys.has(partKey(line.alternate.mpn))) swapped.add(key)
  }
  return swapped
}

/** What "Apply to cart" would still change. */
export function pendingChanges(
  cart: CartLine[],
  plan: SourcingPlan,
  swaps: ReadonlySet<string>,
): { raise: number; swap: number } {
  const quantities = new Map(cart.map((line) => [line.key, line.quantity]))
  let raise = 0
  let swap = 0
  for (const line of plan.lines) {
    const quantity = quantities.get(partKey(line.mpn))
    if (quantity == null) continue
    if (line.alternate && swaps.has(partKey(line.mpn))) swap += 1
    else if (line.status === 'ready' && line.buy && line.buy.quantity > quantity) raise += 1
  }
  return { raise, swap }
}

export type CartPlanLine = {
  label: string
  tone: Tone
  buy: SourcingPlanLine['buy']
}

/** The plan as the cart sees it, keyed by cart line, including parts swapped in. */
export function cartPlanView(plan: SourcingPlan, swaps: ReadonlySet<string>): Map<string, CartPlanLine> {
  const view = new Map<string, CartPlanLine>()
  for (const line of plan.lines) {
    const key = partKey(line.mpn)
    const meta = STATUS_META[line.status]
    view.set(key, { label: meta.label, tone: meta.tone, buy: line.buy ?? null })
    if (line.alternate && swaps.has(key)) {
      const swapKey = partKey(line.alternate.mpn)
      const earlier = view.get(swapKey)
      view.set(
        swapKey,
        earlier?.buy
          ? {
              label: 'Swap for several lines',
              tone: 'good',
              buy: {
                ...line.alternate.buy,
                quantity: earlier.buy.quantity + line.alternate.buy.quantity,
                total: earlier.buy.total + line.alternate.buy.total,
              },
            }
          : { label: `Swap for ${line.mpn}`, tone: 'good', buy: line.alternate.buy },
      )
    }
  }
  return view
}

function csvCell(value: string | number | null | undefined): string {
  if (value == null) return ''
  let text = String(value)
  // Spreadsheet apps run cells that start like a formula.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function planCsv(plan: SourcingPlan, swaps: ReadonlySet<string>): string {
  const header = [
    'Part number',
    'Manufacturer',
    'Description',
    'Needed',
    'Buy',
    'Packaging',
    'Unit price',
    'Line total',
    'Currency',
    'Status',
    'Notes',
  ]
  const rows = plan.lines.map((line) => {
    const swap = line.alternate && swaps.has(partKey(line.mpn)) ? line.alternate : null
    const buy = swap ? swap.buy : line.buy
    const notes = swap
      ? [`Swapped in for ${line.mpn}`]
      : [
          ...line.notes.map((note) => noteText(note, plan.currency)?.text).filter((text): text is string => !!text),
          statusHint(line),
        ].filter((text): text is string => !!text)
    return [
      swap ? swap.mpn : (buy?.mpn ?? line.mpn),
      swap?.manufacturer ?? line.manufacturer,
      swap?.description ?? line.description,
      line.requested,
      buy?.quantity,
      buy?.packaging,
      buy ? buy.unit_price.toFixed(5) : null,
      buy ? buy.total.toFixed(2) : null,
      buy ? plan.currency : null,
      swap ? 'Ready (swap)' : STATUS_META[line.status].label,
      notes.join('; '),
    ]
  })
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
}

export type StoredPlan = {
  /** Set while a run is going so a reload can pick it back up. */
  runId: string | null
  /** Last finished run. */
  run: SourcingRun | null
  swaps: string[]
  /** When the stored run finished. */
  finishedAt: number | null
  savedAt: number
}

function finite(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

const NOTE_NUMBERS: Record<SourcingNote['kind'], string[]> = {
  price_break: ['from', 'to', 'saves'],
  minimum_order: ['from', 'to'],
  compared_sources: ['sources', 'saves'],
  split: ['sources'],
  shortfall: ['available', 'missing'],
  lead_time: ['days'],
  matched_as: [],
  partial_check: [],
  lifecycle: [],
  does_not_fit: [],
  no_fit: [],
  package_unpublished: [],
}

function validNote(value: unknown): value is SourcingNote {
  const note = record(value)
  if (!note || typeof note.kind !== 'string' || !Object.hasOwn(NOTE_NUMBERS, note.kind)) return false
  const kind = note.kind as SourcingNote['kind']
  if (!NOTE_NUMBERS[kind].every((field) => typeof note[field] === 'number' && Number.isFinite(note[field]))) {
    return false
  }
  if (kind === 'matched_as') return !!text(note.mpn)
  if (kind === 'lifecycle') return typeof note.status === 'string' && Object.hasOwn(LIFECYCLE_TEXT, note.status)
  if (kind === 'does_not_fit') return !!text(note.asked) && !!text(note.listed)
  if (kind === 'no_fit' || kind === 'package_unpublished') return !!text(note.asked)
  return true
}

function normalizeBuy(value: unknown): SourcingBuy | null {
  const buy = record(value)
  const mpn = text(buy?.mpn)
  if (!buy || !mpn) return null
  return {
    mpn,
    quantity: Math.max(0, Math.round(finite(buy.quantity))),
    unit_price: finite(buy.unit_price),
    total: finite(buy.total),
    in_stock: Math.max(0, finite(buy.in_stock)),
    sources: Math.max(0, finite(buy.sources)),
    packaging: text(buy.packaging),
  }
}

function normalizeAlternate(value: unknown): SourcingAlternate | null {
  const alternate = record(value)
  const mpn = text(alternate?.mpn)
  const buy = normalizeBuy(alternate?.buy)
  if (!alternate || !mpn || !buy || buy.quantity < 1) return null
  return {
    mpn,
    approved: alternate.approved === true,
    reason: alternate.reason === 'cheaper' ? 'cheaper' : 'replaces_unavailable',
    buy,
    saves: typeof alternate.saves === 'number' && Number.isFinite(alternate.saves) ? alternate.saves : null,
    manufacturer: text(alternate.manufacturer),
    description: text(alternate.description),
    discovered: alternate.discovered === true,
    case_label: text(alternate.case_label),
  }
}

/**
 * Takes a plan from the network or storage and returns one the UI can render without
 * guarding every field: unknown statuses read as not checked, unknown notes are dropped,
 * and counts are recomputed from the lines.
 */
export function normalizePlan(value: unknown): SourcingPlan | null {
  const plan = record(value)
  if (!plan || !Array.isArray(plan.lines)) return null
  const seen = new Set<string>()
  const lines: SourcingPlanLine[] = []
  for (const entry of plan.lines) {
    const line = record(entry)
    const mpn = text(line?.mpn)
    if (!line || !mpn || seen.has(partKey(mpn))) continue
    seen.add(partKey(mpn))
    const status =
      typeof line.status === 'string' && Object.hasOwn(STATUS_META, line.status)
        ? (line.status as SourcingLineStatus)
        : 'unchecked'
    lines.push({
      mpn,
      requested: Math.max(1, Math.round(finite(line.requested, 1))),
      status,
      buy: normalizeBuy(line.buy),
      notes: Array.isArray(line.notes) ? line.notes.filter(validNote) : [],
      manufacturer: text(line.manufacturer),
      description: text(line.description),
      case_label: text(line.case_label),
      fit: text(line.fit),
      alternate: normalizeAlternate(line.alternate),
    })
  }
  const counts = Object.fromEntries([...STATUS_ORDER.map((status) => [status, 0]), ['swaps', 0]]) as SourcingPlan['counts']
  for (const line of lines) {
    counts[line.status] += 1
    if (line.alternate) counts.swaps += 1
  }
  const currency = typeof plan.currency === 'string' && /^[A-Z]{3}$/.test(plan.currency) ? plan.currency : 'USD'
  return {
    currency,
    total: finite(plan.total),
    saved: Math.max(0, finite(plan.saved)),
    counts,
    sources_checked: Math.max(0, Math.round(finite(plan.sources_checked))),
    lines,
  }
}

/** A finished run with a renderable plan, or null. */
export function finishedRun(value: unknown): SourcingRun | null {
  const run = record(value)
  if (!run || typeof run.id !== 'string' || run.status !== 'done') return null
  const plan = normalizePlan(run.plan)
  if (!plan) return null
  return { id: run.id, status: 'done', progress: { stage: 'finishing', done: plan.lines.length, total: plan.lines.length }, plan }
}

export function parseStoredPlan(raw: string | null, now = Date.now()): StoredPlan | null {
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object') return null
    const stored = value as Partial<StoredPlan>
    if (typeof stored.savedAt !== 'number' || now - stored.savedAt > PLAN_MAX_AGE_MS) return null
    const run = finishedRun(stored.run)
    const runId =
      typeof stored.runId === 'string' && stored.runId && now - stored.savedAt < RUN_MAX_AGE_MS ? stored.runId : null
    if (!run && !runId) return null
    return {
      runId,
      run,
      swaps: Array.isArray(stored.swaps) ? stored.swaps.filter((key): key is string => typeof key === 'string') : [],
      finishedAt: run ? finite(stored.finishedAt, stored.savedAt) : null,
      savedAt: stored.savedAt,
    }
  } catch {
    return null
  }
}
