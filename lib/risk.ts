import type { AnalyzeResult, AnalyzedLine, RiskLevel } from '@/lib/types'

export function hasTariffData(lines: AnalyzedLine[]): boolean {
  return lines.some(
    (line) =>
      line.hts_code != null ||
      line.tariff_confidence != null ||
      line.total_duty_pct != null ||
      line.tariff_disclaimer != null,
  )
}

/** A line whose enrichment is still being resolved by the background worker. */
export function isPendingLine(line: AnalyzedLine): boolean {
  const avail = line.availability_status?.toLowerCase() ?? ''
  const match = line.match_status?.toLowerCase() ?? ''
  return avail === 'pending' || match === 'pending'
}

export function hasPendingLines(result: AnalyzeResult): boolean {
  return result.lines.some(isPendingLine)
}

type RiskPresentation = {
  label: string
  /** Table row tint. */
  row: string
  /** Left accent rail on the first cell. */
  rail: string
  bar: string
  text: string
  pill: string
  /** Expanded panel surface. */
  panel: string
  fill: number
}

export const RISK_PRESENTATION: Record<RiskLevel, RiskPresentation> = {
  red: {
    label: 'Critical',
    row: 'bg-red-50/60 hover:bg-red-50',
    rail: 'shadow-[inset_3px_0_0_#ef4444]',
    bar: 'bg-red-500',
    text: 'text-red-600',
    pill: 'bg-red-100 text-red-700 border border-red-200',
    panel: 'border-red-200 bg-red-50/40',
    fill: 92,
  },
  yellow: {
    label: 'Watch',
    row: 'bg-amber-50/50 hover:bg-amber-50',
    rail: 'shadow-[inset_3px_0_0_#f59e0b]',
    bar: 'bg-amber-500',
    text: 'text-amber-600',
    pill: 'bg-amber-100 text-amber-700 border border-amber-200',
    panel: 'border-amber-200 bg-amber-50/40',
    fill: 55,
  },
  green: {
    label: 'Clear',
    row: 'hover:bg-slate-50',
    rail: '',
    bar: 'bg-emerald-500',
    text: 'text-emerald-600',
    pill: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    panel: 'border-slate-200 bg-slate-50',
    fill: 18,
  },
}

export function lineRiskLevel(line: AnalyzedLine): RiskLevel {
  return line.risk_level ?? 'green'
}

export function isAtRisk(line: AnalyzedLine): boolean {
  return lineRiskLevel(line) !== 'green'
}

export function lifecycleLabel(status: string): string {
  const s = status?.toLowerCase() ?? ''
  if (s === 'eol' || s === 'discontinued') return 'EOL'
  if (s === 'nrnd') return 'NRND'
  if (s === 'active') return 'Active'
  if (!s || s === 'unknown') return 'Unknown'
  return status
}

export function lifecycleBadge(status: string): string {
  const s = status?.toLowerCase() ?? ''
  if (s === 'eol' || s === 'discontinued') return 'bg-red-100 text-red-700 border border-red-200'
  if (s === 'nrnd') return 'bg-amber-100 text-amber-700 border border-amber-200'
  if (s === 'active') return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
  return 'bg-slate-100 text-slate-500 border border-slate-200'
}

export function lifecycleDot(status: string): string {
  const s = status?.toLowerCase() ?? ''
  if (s === 'eol' || s === 'discontinued') return 'bg-red-500'
  if (s === 'nrnd') return 'bg-amber-500'
  if (s === 'active') return 'bg-emerald-500'
  return 'bg-slate-300'
}

export function leadTimeWeeks(line: AnalyzedLine): number | null {
  return line.factory_lead_days != null ? Math.round(line.factory_lead_days / 7) : null
}

export function tariffLabel(line: AnalyzedLine): string {
  return line.total_duty_pct != null && line.total_duty_pct > 0 ? `${line.total_duty_pct}%` : '-'
}

/** Portfolio-style banding shared by the BOM list and BOM detail header. */
export function scoreBand(score: number): { label: string; pill: string; accent: string } {
  if (score >= 7) return { label: 'Critical', pill: 'bg-red-100 text-red-700', accent: '#ef4444' }
  if (score >= 4) return { label: 'Warning', pill: 'bg-amber-100 text-amber-700', accent: '#f59e0b' }
  return { label: 'Healthy', pill: 'bg-emerald-100 text-emerald-700', accent: '#10b981' }
}
