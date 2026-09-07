import type { AnalyzeResult, AnalyzedLine, RiskLevel } from '@/lib/types'

/** Still resolving against distributor data (poll until cleared). */
export function isPendingLine(line: AnalyzedLine): boolean {
  return lineRiskLevel(line) === 'unknown' && isPendingStatus(line)
}

function isPendingStatus(line: AnalyzedLine): boolean {
  const avail = line.availability_status?.toLowerCase() ?? ''
  const match = line.match_status?.toLowerCase() ?? ''
  return avail === 'pending' || match === 'pending'
}

export function hasPendingLines(result: AnalyzeResult): boolean {
  return result.lines.some(isPendingLine)
}

/** Poll while enrichment is pending. Briefs are filled by the gateway (heuristic/Bedrock). */
export function shouldPollBom(result: AnalyzeResult): boolean {
  return hasPendingLines(result)
}

type RiskPresentation = {
  label: string
  row: string
  rail: string
  bar: string
  text: string
  pill: string
  panel: string
  fill: number
  muted?: boolean
}

export const RISK_PRESENTATION: Record<RiskLevel, RiskPresentation> = {
  red: {
    label: 'Needs a call',
    row: 'bg-[rgb(198_32_38_/_4%)] hover:bg-[rgb(198_32_38_/_7%)]',
    rail: 'shadow-[inset_3px_0_0_#c62026]',
    bar: 'bg-[#c62026]',
    text: 'text-[#c62026]',
    pill: 'bg-[#c62026]/10 text-[#c62026]',
    panel: 'bg-[#f4f6f9]',
    fill: 91,
  },
  yellow: {
    label: 'Watch',
    row: 'bg-[rgb(162_90_5_/_5%)] hover:bg-[rgb(162_90_5_/_8%)]',
    rail: 'shadow-[inset_3px_0_0_#a25a05]',
    bar: 'bg-[#a25a05]',
    text: 'text-[#a25a05]',
    pill: 'bg-[#a25a05]/10 text-[#a25a05]',
    panel: 'bg-[#f4f6f9]',
    fill: 55,
  },
  green: {
    label: 'Fine',
    row: '',
    rail: '',
    bar: 'bg-[#167c48]',
    text: 'text-[#167c48]',
    pill: 'bg-[#167c48]/10 text-[#167c48]',
    panel: 'bg-[#f4f6f9]',
    fill: 18,
  },
  unknown: {
    label: 'Unmatched',
    row: '',
    rail: '',
    bar: '',
    text: 'text-slate-500',
    pill: 'text-slate-500',
    panel: 'bg-[#f4f6f9]',
    fill: 0,
    muted: true,
  },
}

export function lineRiskLevel(line: AnalyzedLine): RiskLevel {
  return line.risk_level ?? 'green'
}

export function isAtRisk(line: AnalyzedLine): boolean {
  const level = lineRiskLevel(line)
  return level === 'red' || level === 'yellow'
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

export type BomBand = 'Critical' | 'Watch' | 'Clear' | 'Unknown'

const PORTFOLIO_BADGE: Record<BomBand, { label: string; cls: string; dot: string | null }> = {
  Critical: { label: 'Needs a call', cls: 'bg-mk-red/10 text-mk-red', dot: 'bg-mk-red' },
  Watch: { label: 'Watch', cls: 'bg-mk-amber/10 text-mk-amber', dot: 'bg-mk-amber' },
  Clear: { label: 'Fine', cls: 'bg-mk-green/10 text-mk-green', dot: 'bg-mk-green' },
  Unknown: { label: 'Unmatched', cls: 'text-mk-ink-subtle', dot: null },
}

export const BOM_BAND_LABEL: Record<BomBand, string> = {
  Critical: 'Needs a call',
  Watch: 'Watch',
  Clear: 'Fine',
  Unknown: 'Unmatched',
}

export function parseBomBand(value: string | undefined): BomBand {
  if (value === 'Critical' || value === 'Watch' || value === 'Clear' || value === 'Unknown') {
    return value
  }
  return 'Clear'
}

export function bomRiskBand(bom: {
  riskBand?: string
  overallRiskScore: number
  atRiskCount: number
  unknownCount?: number
}): BomBand {
  if (bom.riskBand) return parseBomBand(bom.riskBand)
  // Legacy summaries saved before risk_band existed.
  if (bom.atRiskCount > 0) {
    return bom.overallRiskScore >= 5 ? 'Critical' : 'Watch'
  }
  if ((bom.unknownCount ?? 0) > 0) return 'Unknown'
  return 'Clear'
}

export function portfolioBadgeFromSummary(summary: {
  red_count?: number
  yellow_count?: number
  unknown_count?: number
}) {
  const band: BomBand =
    (summary.red_count ?? 0) > 0
      ? 'Critical'
      : (summary.yellow_count ?? 0) > 0
        ? 'Watch'
        : (summary.unknown_count ?? 0) > 0
          ? 'Unknown'
          : 'Clear'
  return PORTFOLIO_BADGE[band]
}
