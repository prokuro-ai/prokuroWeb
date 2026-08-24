export interface BomSummary {
  id: string
  name: string
  filename: string
  uploadedAt: string
  /** Optimistic concurrency token; required on every BOM write. */
  version: number
  updatedAt?: string
  lineCount: number
  overallRiskScore: number
  atRiskCount: number
  unknownCount?: number
  riskBand?: string
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
  unknown_count?: number
}

export type RiskLevel = 'red' | 'yellow' | 'green' | 'unknown'

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
  /** Optional — gateway may omit when no seller offers are present. */
  top_sellers?: SellerOffer[]
  risk_level?: RiskLevel
  category?: string | null
  hts_code?: string | null
  country_of_origin?: string | null
  tariff_confidence?: string | null
  base_duty_pct?: number | null
  section_301_pct?: number | null
  total_duty_pct?: number | null
  tariff_notes?: string | null
  rate_basis?: string | null
  is_stale?: boolean | null
  tariff_disclaimer?: string | null
  entity_list_match?: boolean | null
  entity_list_notes?: string | null
  agent_brief?: string | null
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

export type PurchaseProviderId = 'digikey' | 'mouser'

export type PurchaseStatus =
  | 'quoted'
  | 'partial'
  | 'unavailable'
  | 'submitted'
  | 'not_configured'
  | 'requires_distributor_credit'
  | 'requires_subscription'
  | 'cap_exceeded'
  | 'error'

export interface PurchaseLine {
  mpn: string
  quantity: number
  manufacturer?: string
}

export interface QuoteLineResult {
  mpn: string
  quantity: number
  provider_part_id?: string | null
  matched_mpn?: string | null
  unit_price?: number | null
  extended_price?: number | null
  currency?: string | null
  available_quantity?: number | null
  error?: string | null
}

export interface QuoteRequest {
  provider: PurchaseProviderId
  lines: PurchaseLine[]
}

export interface QuoteResponse {
  provider: PurchaseProviderId
  status: PurchaseStatus
  lines?: QuoteLineResult[]
  currency?: string | null
  subtotal?: number | null
  message?: string | null
}

export interface PlaceOrderRequest {
  provider: PurchaseProviderId
  lines: PurchaseLine[]
  purchase_order_number?: string
}

export interface PlaceOrderResponse {
  provider: PurchaseProviderId
  status: PurchaseStatus
  distributor_order_id?: string | null
  message?: string | null
}
