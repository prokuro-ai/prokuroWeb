export type Mode = 'parse' | 'analyze'

export interface BomSummary {
  id: string
  name: string
  filename: string
  uploadedAt: string
  lineCount: number
  overallRiskScore: number
  atRiskCount: number
}

export type LifecycleStatus = 'active' | 'nrnd' | 'eol' | 'discontinued' | 'unknown'
export type LeadTimeTrend = 'improving' | 'stable' | 'worsening'

export interface ColumnMapping {
  canonical: string
  label: string
  detectedFrom: string | null
  confirmed: boolean
}

export interface SellerOffer {
  name: string
  inventory_level: number
}

export type WarningCode = 'LOW_MAPPING_CONFIDENCE' | 'DIST_SKU_SUSPECT' | 'MISSING_MPN' | 'ROW_LIMIT_EXCEEDED'

export interface ParseWarning {
  code: WarningCode
  row_index: number
  column: string | null
}

export interface BomLine {
  row_index: number
  mpn: string | null
  manufacturer: string | null
  quantity: number | null
  refdes: string | null
  description: string | null
  footprint: string | null
  aml_candidates: string[]
  extras: Record<string, string>
}

export interface ParseStats {
  total_rows: number
  parsed_rows: number
  skipped_rows: number
}

export interface ParseResult {
  source_filename: string
  sheet_name: string | null
  header_row_index: number
  column_mapping: Record<string, string>
  mapping_confidence: number
  lines: BomLine[]
  warnings: ParseWarning[]
  stats: ParseStats
  flywheel_events: unknown[]
}

export interface AnalyzeSummary {
  total: number
  in_stock: number
  out_of_stock: number
  eol_or_nrnd: number
  no_match: number
  error_count?: number
  long_lead: number
  red_count?: number
  yellow_count?: number
  green_count?: number
}

export type RiskLevel = 'red' | 'yellow' | 'green'

export interface AnalyzedLine {
  row_index: number
  mpn: string | null
  manufacturer: string | null
  quantity: number | null
  refdes: string | null
  description: string | null
  aml_candidates: string[]
  availability_status: string
  lifecycle_status: string
  match_status: string
  factory_lead_days: number | null
  total_avail: number
  top_sellers: SellerOffer[]
  risk_level?: RiskLevel
  hts_code?: string | null
  tariff_confidence?: string | null
  base_duty_pct?: number | null
  section_301_pct?: number | null
  total_duty_pct?: number | null
  tariff_notes?: string | null
  rate_basis?: string | null
  is_stale?: boolean | null
  tariff_disclaimer?: string | null
}

export interface AnalyzeResult {
  upload_id: string
  source_filename: string
  sheet_name: string | null
  mapping_confidence: number
  summary: AnalyzeSummary
  lines: AnalyzedLine[]
  top_risks?: AnalyzedLine[]
  warnings: unknown[]
  stats: Record<string, unknown>
  analyzed_at: string
}
