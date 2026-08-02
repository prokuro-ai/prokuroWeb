import type { AnalyzedLine, AnalyzeResult, AnalyzeSummary, BomSummary, RiskLevel } from '@/lib/types'

type LineInput = {
  row_index: number
  mpn: string
  manufacturer: string | null
  quantity: number
  refdes?: string | null
  description?: string | null
  aml_candidates?: string[]
  availability_status: string
  lifecycle_status: string
  match_status?: string
  factory_lead_days?: number | null
  total_avail: number
  risk_level: RiskLevel
  total_duty_pct?: number | null
  section_301_pct?: number | null
  base_duty_pct?: number | null
  hts_code?: string | null
  tariff_confidence?: string | null
  top_sellers?: { name: string; inventory_level: number }[]
}

export function line(input: LineInput): AnalyzedLine {
  const duty = input.total_duty_pct ?? null
  return {
    row_index: input.row_index,
    mpn: input.mpn,
    manufacturer: input.manufacturer,
    quantity: input.quantity,
    refdes: input.refdes ?? null,
    description: input.description ?? null,
    aml_candidates: input.aml_candidates ?? [],
    availability_status: input.availability_status,
    lifecycle_status: input.lifecycle_status,
    match_status: input.match_status ?? 'Exact',
    factory_lead_days: input.factory_lead_days ?? null,
    total_avail: input.total_avail,
    top_sellers: input.top_sellers,
    risk_level: input.risk_level,
    hts_code: input.hts_code ?? null,
    tariff_confidence: duty != null && duty > 0 ? (input.tariff_confidence ?? 'medium') : null,
    base_duty_pct: input.base_duty_pct ?? (duty != null && duty > 0 ? 0 : null),
    section_301_pct: input.section_301_pct ?? (duty != null && duty > 0 ? duty : null),
    total_duty_pct: duty,
    tariff_notes: null,
    rate_basis: duty != null && duty > 0 ? 'general' : null,
    is_stale: false,
    tariff_disclaimer:
      duty != null && duty > 0
        ? 'Estimated for planning purposes only. Confirm with your broker or customs counsel.'
        : null,
  }
}

export function summarize(lines: AnalyzedLine[]): AnalyzeSummary {
  const red = lines.filter((l) => l.risk_level === 'red').length
  const yellow = lines.filter((l) => l.risk_level === 'yellow').length
  const green = lines.filter((l) => l.risk_level === 'green').length
  return {
    total: lines.length,
    in_stock: lines.filter((l) => l.availability_status.toLowerCase() === 'instock').length,
    out_of_stock: lines.filter((l) => l.availability_status.toLowerCase() === 'outofstock').length,
    eol_or_nrnd: lines.filter((l) =>
      ['eol', 'nrnd', 'discontinued'].includes(l.lifecycle_status.toLowerCase()),
    ).length,
    no_match: lines.filter((l) => l.match_status.toLowerCase() === 'none').length,
    error_count: 0,
    long_lead: lines.filter((l) => l.factory_lead_days != null && l.factory_lead_days > 182).length,
    red_count: red,
    yellow_count: yellow,
    green_count: green,
  }
}

export function analyze(
  filename: string,
  lines: AnalyzedLine[],
  analyzedAt: string,
): AnalyzeResult {
  const summary = summarize(lines)
  const top_risks = lines
    .filter((l) => l.risk_level === 'red' || l.risk_level === 'yellow')
    .slice(0, 5)
  return {
    upload_id: `demo-${filename.replace(/\W+/g, '-').toLowerCase()}`,
    source_filename: filename,
    sheet_name: null,
    mapping_confidence: 0.94,
    summary,
    lines,
    top_risks,
    warnings: [],
    stats: {},
    analyzed_at: analyzedAt,
  }
}

export function riskScore(lines: AnalyzedLine[]): number {
  const red = lines.filter((l) => l.risk_level === 'red').length
  const yellow = lines.filter((l) => l.risk_level === 'yellow').length
  if (lines.length === 0) return 0
  const weighted = (red * 10 + yellow * 5) / lines.length
  return Math.min(10, Math.round(weighted * 10) / 10)
}

export function summaryFrom(
  id: string,
  name: string,
  filename: string,
  uploadedAt: string,
  lines: AnalyzedLine[],
): BomSummary {
  return {
    id,
    name,
    filename,
    uploadedAt,
    version: 1,
    updatedAt: uploadedAt,
    lineCount: lines.length,
    overallRiskScore: riskScore(lines),
    atRiskCount: lines.filter((l) => l.risk_level === 'red' || l.risk_level === 'yellow').length,
  }
}
