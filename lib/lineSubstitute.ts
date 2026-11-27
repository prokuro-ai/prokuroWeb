import { MPN_LIKE, partKey } from '@/lib/cart'
import { briefAlternate } from '@/lib/decision'
import { isPendingLine } from '@/lib/risk'
import { parseStoredPlan, PLAN_STORAGE_KEY } from '@/lib/sourcingPlan'
import type { AnalyzedLine } from '@/lib/types'

const END_OF_LIFE = new Set(['eol', 'discontinued', 'obsolete', 'nrnd'])

/** Out of stock, unmatched, or end of life. Opening the row looks up a replacement. */
export function lineNeedsSubstituteLookup(line: AnalyzedLine): boolean {
  const mpn = line.mpn?.trim() ?? ''
  if (!MPN_LIKE.test(mpn) || isPendingLine(line)) return false
  const avail = line.availability_status?.toLowerCase() ?? ''
  const life = line.lifecycle_status?.toLowerCase() ?? ''
  return avail === 'outofstock' || avail === 'nomatch' || END_OF_LIFE.has(life)
}

export type LineSubstitute = {
  mpn: string
  approved: boolean
  detail?: string
}

/** Part numbers the buyer can put on this line. Free-text advice is left out. */
export function lineSubstitutes(line: AnalyzedLine, extra: LineSubstitute[] = []): LineSubstitute[] {
  const current = (line.mpn ?? '').trim().toUpperCase()
  const seen = new Set<string>()
  const out: LineSubstitute[] = []
  const push = (raw: string | null | undefined, approved: boolean, detail?: string) => {
    const mpn = raw?.trim() ?? ''
    const key = mpn.toUpperCase()
    if (!MPN_LIKE.test(mpn) || key === current || seen.has(key)) return
    seen.add(key)
    const note = detail?.trim()
    out.push(note ? { mpn, approved, detail: note } : { mpn, approved })
  }
  for (const mpn of line.aml_candidates) push(mpn, true)
  push(briefAlternate(line), false)
  for (const item of extra) push(item.mpn, item.approved, item.detail)
  return out
}

/** Alternates from the last sourcing plan, keyed by the original part number. */
export function substitutesByMpn(raw: string | null): Map<string, LineSubstitute[]> {
  const stored = parseStoredPlan(raw)
  const map = new Map<string, LineSubstitute[]>()
  for (const line of stored?.run?.plan?.lines ?? []) {
    const alternate = line.alternate
    if (!alternate || !MPN_LIKE.test(alternate.mpn)) continue
    const detail = alternate.description?.trim() || alternate.case_label?.trim()
    const item: LineSubstitute = {
      mpn: alternate.mpn.trim(),
      approved: alternate.approved,
      ...(detail ? { detail } : {}),
    }
    const key = partKey(line.mpn)
    const existing = map.get(key) ?? []
    if (existing.some((found) => partKey(found.mpn) === partKey(item.mpn))) continue
    existing.push(item)
    map.set(key, existing)
  }
  return map
}

export function readStoredSubstitutes(): Map<string, LineSubstitute[]> {
  if (typeof window === 'undefined') return new Map()
  return substitutesByMpn(window.localStorage.getItem(PLAN_STORAGE_KEY))
}
