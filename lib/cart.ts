import { briefAlternate } from '@/lib/decision'
import { money } from '@/lib/purchaseDisplay'
import { isAtRisk, isPendingLine, lineRiskLevel } from '@/lib/risk'
import type { AnalyzedLine, PartSuggestion, RiskLevel } from '@/lib/types'

export type Board = { id: string; name: string; lines: AnalyzedLine[] }

export type PartUse = { bomId: string; bomName: string; quantity: number; refdes: string | null }

export type CatalogPart = {
  key: string
  mpn: string
  manufacturer: string | null
  description: string | null
  /** Shared footprint, or null when the boards disagree or none was given. */
  fit: string | null
  /** Worst-risk line across boards; drives stock, lifecycle and risk columns. */
  line: AnalyzedLine
  uses: PartUse[]
}

export type CartLine = {
  key: string
  mpn: string
  manufacturer: string | null
  description: string | null
  /** Package or body size. Null means the run does not filter on size. */
  fit: string | null
  quantity: number
}

export type SuggestionSource = 'Prokuro AI' | 'Your AML' | 'Line brief' | 'Board' | 'Attrition rule'

export type Suggestion = {
  id: string
  source: SuggestionSource
  title: string
  detail: string
  /** Lines to merge into the cart. Quantities are added, not replaced. */
  add: CartLine[]
  /** Accepting or dismissing records these so the suggestion does not come back. */
  keys: string[]
}

export const CART_STORAGE_KEY = 'prokuro:buy-cart:v1'
export const DISMISSED_STORAGE_KEY = 'prokuro:buy-cart-dismissed:v1'
export const ATTRITION_RATE = 0.1
export const ATTRITION_MIN = 10

export function partKey(mpn: string): string {
  return mpn.trim().toUpperCase()
}

const RISK_RANK: Record<RiskLevel, number> = { red: 3, yellow: 2, unknown: 1, green: 0 }

export function buildCatalog(boards: Board[]): CatalogPart[] {
  const parts = new Map<string, CatalogPart>()
  for (const board of boards) {
    for (const line of board.lines) {
      const mpn = line.mpn?.trim()
      if (!mpn) continue
      const key = partKey(mpn)
      const use: PartUse = {
        bomId: board.id,
        bomName: board.name,
        quantity: lineQuantity(line),
        refdes: line.refdes,
      }
      const existing = parts.get(key)
      if (!existing) {
        parts.set(key, {
          key,
          mpn,
          manufacturer: line.manufacturer,
          description: line.description,
          fit: cleanFit(line.footprint),
          line,
          uses: [use],
        })
        continue
      }
      existing.uses.push(use)
      existing.manufacturer ??= line.manufacturer
      existing.description ??= line.description
      existing.fit = mergeFit(existing.fit, line.footprint)
      if (RISK_RANK[lineRiskLevel(line)] > RISK_RANK[lineRiskLevel(existing.line)]) existing.line = line
    }
  }
  return [...parts.values()].sort(
    (a, b) => boardCount(b) - boardCount(a) || a.mpn.localeCompare(b.mpn),
  )
}

function boardCount(part: CatalogPart): number {
  return new Set(part.uses.map((use) => use.bomId)).size
}

/** Missing or zero BOM quantity still means at least one placement. */
export function lineQuantity(line: AnalyzedLine): number {
  return line.quantity != null && line.quantity > 0 ? line.quantity : 1
}

export function cleanFit(value: string | null | undefined): string | null {
  const text = value?.trim() ?? ''
  if (!text) return null
  return text.slice(0, 120)
}

/** Keeps a size only when every copy agrees. A blank does not clear one that is already set. */
export function mergeFit(current: string | null | undefined, incoming: string | null | undefined): string | null {
  const left = cleanFit(current)
  const right = cleanFit(incoming)
  if (!left) return right
  if (!right) return left
  return left.toLowerCase() === right.toLowerCase() ? left : null
}

export function cartLineFrom(
  part: { mpn: string; manufacturer?: string | null; description?: string | null; fit?: string | null; footprint?: string | null },
  quantity: number,
): CartLine {
  const mpn = part.mpn.trim()
  return {
    key: partKey(mpn),
    mpn,
    manufacturer: part.manufacturer ?? null,
    description: part.description ?? null,
    fit: cleanFit(part.fit ?? part.footprint),
    quantity: Math.max(1, Math.round(quantity)),
  }
}

export function addToCart(cart: CartLine[], additions: CartLine[]): CartLine[] {
  const next = cart.map((line) => ({ ...line }))
  for (const add of additions) {
    const existing = next.find((line) => line.key === add.key)
    if (existing) {
      existing.quantity += add.quantity
      existing.manufacturer ??= add.manufacturer
      existing.description ??= add.description
      existing.fit = mergeFit(existing.fit, add.fit)
    } else {
      next.push({ ...add })
    }
  }
  return next
}

export function setCartQuantity(cart: CartLine[], key: string, quantity: number): CartLine[] {
  if (!Number.isFinite(quantity) || quantity < 1) return cart
  return cart.map((line) => (line.key === key ? { ...line, quantity: Math.round(quantity) } : line))
}

export function removeFromCart(cart: CartLine[], key: string): CartLine[] {
  return cart.filter((line) => line.key !== key)
}

export function setCartFit(cart: CartLine[], key: string, fit: string): CartLine[] {
  const next = cleanFit(fit)
  return cart.map((line) => (line.key === key ? { ...line, fit: next } : line))
}

export function boardToCart(board: Board, builds: number): CartLine[] {
  const perBoard = new Map<string, CartLine>()
  for (const line of board.lines) {
    const mpn = line.mpn?.trim()
    if (!mpn) continue
    const item = cartLineFrom({ ...line, mpn }, lineQuantity(line) * builds)
    const existing = perBoard.get(item.key)
    if (existing) {
      existing.quantity += item.quantity
      existing.fit = mergeFit(existing.fit, item.fit)
    } else perBoard.set(item.key, item)
  }
  return [...perBoard.values()]
}

export function parseStoredCart(raw: string | null): CartLine[] {
  if (!raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value)) return []
    return value
      .filter(
        (item): item is CartLine =>
          !!item &&
          typeof item === 'object' &&
          typeof item.mpn === 'string' &&
          item.mpn.trim().length > 0 &&
          typeof item.quantity === 'number' &&
          item.quantity >= 1,
      )
      .map((item) => cartLineFrom(item, item.quantity))
  } catch {
    return []
  }
}

const PASSIVE_REFDES = /^(R|C|L|FB)\d/i
const PASSIVE_CATEGORY = /resistor|capacitor|inductor|ferrite/i

export function isPassive(line: AnalyzedLine): boolean {
  if (line.category && PASSIVE_CATEGORY.test(line.category)) return true
  const first = line.refdes?.split(/[\s,;]+/).find(Boolean)
  return !!first && PASSIVE_REFDES.test(first)
}

/** Single-token values only; free-text brief advice is not something you can add to a cart. */
export const MPN_LIKE = /^[A-Z0-9][A-Z0-9\-./#+]{2,39}$/i

function alternateFor(line: AnalyzedLine): { mpn: string; source: SuggestionSource } | null {
  const aml = line.aml_candidates.map((mpn) => mpn.trim()).find((mpn) => MPN_LIKE.test(mpn))
  if (aml) return { mpn: aml, source: 'Your AML' }
  const brief = briefAlternate(line)
  if (brief && MPN_LIKE.test(brief)) return { mpn: brief, source: 'Line brief' }
  return null
}

/** Gateway already dropped anything the distributor could not price. */
export function aiSuggestions(
  parts: PartSuggestion[],
  cart: CartLine[],
  dismissed: ReadonlySet<string>,
): Suggestion[] {
  const inCart = new Set(cart.map((line) => line.key))
  return parts
    .filter((part) => !inCart.has(partKey(part.mpn)) && !dismissed.has(`ai:${partKey(part.mpn)}`))
    .map((part) => {
      const price =
        part.unit_price != null ? `${money(part.unit_price, part.currency)} ea` : null
      const stock =
        part.available_quantity != null ? `${part.available_quantity.toLocaleString()} in stock` : null
      return {
        id: `ai:${partKey(part.mpn)}`,
        keys: [`ai:${partKey(part.mpn)}`],
        source: 'Prokuro AI' as const,
        title: part.for_mpn ? `${part.mpn} for ${part.for_mpn}` : part.mpn,
        detail: [part.reason, [price, stock].filter(Boolean).join(', ')].filter(Boolean).join(' '),
        add: [
          cartLineFrom(
            { mpn: part.mpn, manufacturer: part.manufacturer ?? null, description: part.reason },
            part.quantity,
          ),
        ],
      }
    })
}

export function buildSuggestions(
  cart: CartLine[],
  catalog: CatalogPart[],
  boards: Board[],
  dismissed: ReadonlySet<string> = new Set(),
): Suggestion[] {
  if (cart.length === 0) return []
  const inCart = new Set(cart.map((line) => line.key))
  const byKey = new Map(catalog.map((part) => [part.key, part]))
  const suggestions: Suggestion[] = []

  for (const item of cart) {
    const part = byKey.get(item.key)
    if (!part || !isAtRisk(part.line)) continue
    const alternate = alternateFor(part.line)
    if (!alternate || inCart.has(partKey(alternate.mpn))) continue
    const id = `alt:${item.key}:${partKey(alternate.mpn)}`
    if (dismissed.has(id)) continue
    const why = part.line.brief?.why?.trim() || part.line.brief?.headline?.trim()
    suggestions.push({
      id,
      keys: [id],
      source: alternate.source,
      title: `${alternate.mpn} as a second source for ${item.mpn}`,
      detail:
        why ||
        (alternate.source === 'Your AML'
          ? 'Already approved on your AML for this line.'
          : 'Suggested in the line brief for this part.'),
      add: [cartLineFrom({ mpn: alternate.mpn, manufacturer: null, description: `Alternate for ${item.mpn}` }, item.quantity)],
    })
  }

  for (const board of boards) {
    const lines = boardToCart(board, 1)
    const id = `board:${board.id}`
    if (dismissed.has(id) || lines.every((line) => inCart.has(line.key))) continue
    // A shared part (a common 0402 cap) in the cart says nothing about which board is being built.
    const started = lines.filter(
      (line) => inCart.has(line.key) && byKey.get(line.key)?.uses.every((use) => use.bomId === board.id),
    )
    if (started.length === 0) continue
    const builds = Math.max(
      1,
      Math.round(
        Math.min(...started.map((line) => cart.find((item) => item.key === line.key)!.quantity / line.quantity)),
      ),
    )
    const missing = lines
      .filter((line) => !inCart.has(line.key))
      .map((line) => ({ ...line, quantity: line.quantity * builds }))
    suggestions.push({
      id,
      keys: [id],
      source: 'Board',
      title: `${missing.length} ${missing.length === 1 ? 'part' : 'parts'} from ${board.name} not in the cart`,
      detail: `Sized for ${builds} ${builds === 1 ? 'build' : 'builds'}, matching what you already added.`,
      add: missing,
    })
  }

  const topUps = cart
    .map((item) => {
      const part = byKey.get(item.key)
      if (!part || !isPassive(part.line) || isPendingLine(part.line)) return null
      if (dismissed.has(`attrition:${item.key}`)) return null
      const extra = Math.max(ATTRITION_MIN, Math.ceil(item.quantity * ATTRITION_RATE))
      return { ...item, quantity: extra }
    })
    .filter((line): line is CartLine => line !== null)
  if (topUps.length > 0) {
    suggestions.push({
      id: 'attrition',
      keys: topUps.map((line) => `attrition:${line.key}`),
      source: 'Attrition rule',
      title: `Spares for ${topUps.length} ${topUps.length === 1 ? 'passive' : 'passives'}`,
      detail: `Adds ${Math.round(ATTRITION_RATE * 100)}% (at least ${ATTRITION_MIN} pcs) for pick-and-place loss.`,
      add: topUps,
    })
  }

  return suggestions
}
