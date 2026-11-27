import { MPN_LIKE, partKey } from '@/lib/cart'
import { briefAlternate } from '@/lib/decision'
import { parseStoredPlan, PLAN_STORAGE_KEY } from '@/lib/sourcingPlan'
import type { AnalyzedLine } from '@/lib/types'

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
export function substitutesByMpn(raw: string | null): Map<string, LineSubstitute> {
  const stored = parseStoredPlan(raw)
  const map = new Map<string, LineSubstitute>()
  for (const line of stored?.run?.plan.lines ?? []) {
    const alternate = line.alternate
    if (!alternate || !MPN_LIKE.test(alternate.mpn)) continue
    const detail = alternate.description?.trim() || alternate.case_label?.trim()
    map.set(partKey(line.mpn), {
      mpn: alternate.mpn.trim(),
      approved: alternate.approved,
      ...(detail ? { detail } : {}),
    })
  }
  return map
}

export function readStoredSubstitutes(): Map<string, LineSubstitute> {
  if (typeof window === 'undefined') return new Map()
  return substitutesByMpn(window.localStorage.getItem(PLAN_STORAGE_KEY))
}
