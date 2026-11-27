import { money } from '@/lib/purchaseDisplay'
import type { AnalyzedLine } from '@/lib/types'

export type PriceBreak = { quantity: number; unit_price: number }

/** Highest break at or below the line quantity. A break above that quantity does not apply. */
export function unitPriceAt(breaks: PriceBreak[] | null | undefined, quantity: number): number | null {
  if (!breaks?.length || !Number.isFinite(quantity) || quantity <= 0) return null
  const qty = Math.floor(quantity)
  let unit: number | null = null
  for (const br of [...breaks].sort((a, b) => a.quantity - b.quantity)) {
    if (br.quantity <= qty && Number.isFinite(br.unit_price) && br.unit_price > 0) unit = br.unit_price
  }
  return unit
}

export function extendedPrice(line: AnalyzedLine): number | null {
  const unit = unitPriceAt(line.price_breaks, line.quantity ?? 0)
  if (unit == null || line.quantity == null) return null
  return unit * line.quantity
}

export function bomPrice(lines: AnalyzedLine[]): { total: number; unpriced: number; priced: number } {
  let total = 0
  let unpriced = 0
  let priced = 0
  for (const line of lines) {
    const extended = extendedPrice(line)
    if (extended == null) unpriced += 1
    else {
      total += extended
      priced += 1
    }
  }
  return { total, unpriced, priced }
}

/** A matched line whose snapshot has not stored a price list yet. */
export function lineAwaitingPrice(line: AnalyzedLine): boolean {
  const match = line.match_status?.toLowerCase() ?? ''
  if (match !== 'exact' && match !== 'fuzzy') return false
  return line.price_breaks == null
}

/** One clause for the alternate card. No savings claim when the current line has no price. */
export function substituteCostNote(
  lineExtended: number | null,
  alternateExtended: number | null | undefined,
): string | null {
  if (alternateExtended == null || !Number.isFinite(alternateExtended)) return null
  if (lineExtended == null) return `${money(alternateExtended)} at your qty`
  const delta = lineExtended - alternateExtended
  if (Math.abs(delta) < 0.01) return 'Same price'
  if (delta > 0) return `Saves ${money(delta)}`
  return `Costs ${money(-delta)} more`
}
