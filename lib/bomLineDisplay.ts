import { isPendingLine, leadTimeWeeks, lineRiskLevel, PENDING_LABEL } from '@/lib/risk'
import type { AnalyzedLine, RiskLevel } from '@/lib/types'

export function stockLabel(line: AnalyzedLine): string {
  if (isPendingLine(line)) return '—'
  const avail = line.availability_status?.toLowerCase() ?? ''
  if (avail === 'outofstock') return 'Out of stock'
  if (avail === 'nomatch') return 'No match'
  return line.total_avail.toLocaleString()
}

export function stockHot(line: AnalyzedLine): boolean {
  if (isPendingLine(line)) return false
  const avail = line.availability_status?.toLowerCase() ?? ''
  return avail === 'outofstock' || avail === 'nomatch'
}

export function leadLabel(line: AnalyzedLine): string {
  if (isPendingLine(line)) return '—'
  const weeks = leadTimeWeeks(line)
  return weeks == null ? '—' : `${weeks} wk`
}

export function riskLabel(level: RiskLevel | string | undefined): string {
  if (level === 'red') return 'Critical'
  if (level === 'yellow') return 'Watch'
  if (level === 'unknown') return 'Unmatched'
  return 'Clear'
}

/** Risk column for one row. Splits "still looking up" out of the Unmatched bucket. */
export function lineStatusLabel(line: AnalyzedLine): string {
  return isPendingLine(line) ? PENDING_LABEL : riskLabel(lineRiskLevel(line))
}

export function riskTone(level: RiskLevel | string | undefined): string {
  if (level === 'red') return 'text-mk-red'
  if (level === 'yellow') return 'text-mk-amber'
  if (level === 'unknown') return 'text-mk-ink-subtle'
  return 'text-mk-green'
}
