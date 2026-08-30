import type { AnalyzedLine } from '@/lib/types'

export type DraftLine = { mpn: string; quantity: string }

/** Stock relative to the quantity the BOM needs. */
export type StockCoverage = 'covered' | 'short' | 'none'

export type SourcedPart = {
  key: string
  mpn: string
  manufacturer: string | null
  /** Total quantity across every BOM row that uses this part. */
  quantity: number
  totalAvail: number
  availabilityStatus: string
  leadDays: number | null
  refdes: string[]
  coverage: StockCoverage
}

function normalizeKey(mpn: string, manufacturer: string | null): string {
  return `${mpn.trim().toUpperCase()}::${(manufacturer ?? '').trim().toUpperCase()}`
}

function coverageFor(availabilityStatus: string, totalAvail: number, quantity: number): StockCoverage {
  if (availabilityStatus.toLowerCase() !== 'instock' || totalAvail <= 0) return 'none'
  return totalAvail >= quantity ? 'covered' : 'short'
}

/**
 * Collapse analyzed BOM rows into orderable parts. The same MPN can appear on
 * several rows (different refdes), and distributors quote against one line per MPN.
 */
export function sourcedPartsFromLines(lines: AnalyzedLine[]): SourcedPart[] {
  const parts = new Map<string, SourcedPart>()

  for (const line of lines) {
    const mpn = line.mpn?.trim()
    if (!mpn) continue

    const key = normalizeKey(mpn, line.manufacturer)
    const quantity = Math.max(1, line.quantity ?? 1)
    const existing = parts.get(key)

    if (!existing) {
      parts.set(key, {
        key,
        mpn,
        manufacturer: line.manufacturer?.trim() || null,
        quantity,
        totalAvail: line.total_avail ?? 0,
        availabilityStatus: line.availability_status ?? 'unknown',
        leadDays: line.factory_lead_days ?? null,
        refdes: line.refdes ? [line.refdes] : [],
        coverage: 'none',
      })
      continue
    }

    existing.quantity += quantity
    existing.totalAvail = Math.max(existing.totalAvail, line.total_avail ?? 0)
    if (existing.availabilityStatus.toLowerCase() !== 'instock') {
      existing.availabilityStatus = line.availability_status ?? existing.availabilityStatus
    }
    if (line.factory_lead_days != null) {
      existing.leadDays =
        existing.leadDays == null ? line.factory_lead_days : Math.max(existing.leadDays, line.factory_lead_days)
    }
    if (line.refdes && !existing.refdes.includes(line.refdes)) existing.refdes.push(line.refdes)
  }

  return [...parts.values()]
    .map((part) => ({
      ...part,
      coverage: coverageFor(part.availabilityStatus, part.totalAvail, part.quantity),
    }))
    .sort((a, b) => a.mpn.localeCompare(b.mpn))
}

/** Distributors reject lines they cannot fill, so hide parts with no stock at all. */
export function filterAvailable(parts: SourcedPart[], inStockOnly: boolean): SourcedPart[] {
  return inStockOnly ? parts.filter((part) => part.coverage !== 'none') : parts
}

export type DraftMergeResult = {
  lines: DraftLine[]
  added: number
  skipped: number
}

/** Append picked parts to the quote draft, dropping blank rows and existing MPNs. */
export function mergeDraftLines(existing: DraftLine[], parts: SourcedPart[]): DraftMergeResult {
  const lines = existing.filter((line) => line.mpn.trim().length > 0)
  const seen = new Set(lines.map((line) => line.mpn.trim().toUpperCase()))
  let added = 0
  let skipped = 0

  for (const part of parts) {
    const mpn = part.mpn.trim()
    if (seen.has(mpn.toUpperCase())) {
      skipped += 1
      continue
    }
    seen.add(mpn.toUpperCase())
    lines.push({ mpn, quantity: String(part.quantity) })
    added += 1
  }

  return {
    lines: lines.length > 0 ? lines : [{ mpn: '', quantity: '1' }],
    added,
    skipped,
  }
}
