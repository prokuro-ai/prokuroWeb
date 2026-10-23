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
  /** Subset of `unknownCount` still awaiting enrichment. */
  pendingCount?: number
  riskBand?: string
}

export interface FlaggedLineItem {
  bomId: string
  bomName: string
  bomVersion: number
  line: AnalyzedLine
}

export interface RiskMix {
  red: number
  yellow: number
  green: number
  /** Enrichment answered and found no catalog match. */
  noMatch: number
  /** Enrichment has not answered yet. */
  pending: number
}

/** Scored lines only. */
export interface Situation {
  outOfStock: number
  /** Factory lead over 26 weeks. */
  longLead: number
  nrnd: number
  /** EOL and discontinued. */
  discontinued: number
  noAlternate: number
  duty: number
  entityList: number
}

/** Scored lines by factory lead. */
export interface LeadTimes {
  upTo4Weeks: number
  upTo12Weeks: number
  upTo26Weeks: number
  upTo52Weeks: number
  over52Weeks: number
  unpublished: number
}

export interface LineTally {
  mix: RiskMix
  situation: Situation
  lead: LeadTimes
}

export interface BoardTally extends LineTally {
  bomId: string
  bomName: string
}

export interface FlaggedLines {
  accountId: string
  items: FlaggedLineItem[]
  /** Flagged lines before the server cap. */
  total: number
  /** Every stored line in the account, not only `items`. */
  account: LineTally
  boards: BoardTally[]
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
  brief?: LineBriefFields | null
  risk_reasons?: string[]
}

export interface LineBriefFields {
  headline: string
  why?: string | null
  next_action?: string | null
  alternate?: string | null
  cost_note?: string | null
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

export interface SuggestPartsRequest {
  provider: PurchaseProviderId
  lines: { mpn: string; manufacturer?: string; description?: string; quantity: number }[]
}

export interface PartSuggestion {
  mpn: string
  manufacturer?: string | null
  for_mpn?: string | null
  reason: string
  quantity: number
  unit_price?: number | null
  currency?: string | null
  available_quantity?: number | null
}

export interface SuggestPartsResponse {
  status: 'ok' | 'disabled' | 'unverified' | 'error'
  suggestions: PartSuggestion[]
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

export interface SourcingRunRequest {
  lines: {
    mpn: string
    quantity: number
    manufacturer?: string
    alternates?: { mpn: string; approved: boolean }[]
  }[]
}

export type SourcingRunStatus = 'running' | 'done' | 'failed'

export type SourcingStage = 'pricing' | 'second_source' | 'alternates' | 'finishing'

export type SourcingLineStatus =
  | 'ready'
  | 'short'
  | 'out_of_stock'
  | 'no_price'
  | 'not_found'
  | 'ambiguous'
  | 'unchecked'
  | 'invalid'

export type PartLifecycle = 'active' | 'not_for_new_designs' | 'last_time_buy' | 'not_carried' | 'obsolete'

export type SourcingNote =
  | { kind: 'price_break'; from: number; to: number; saves: number }
  | { kind: 'minimum_order'; from: number; to: number }
  | { kind: 'compared_sources'; sources: number; saves: number }
  | { kind: 'split'; sources: number }
  | { kind: 'shortfall'; available: number; missing: number }
  | { kind: 'lead_time'; days: number }
  | { kind: 'matched_as'; mpn: string }
  | { kind: 'partial_check' }
  | { kind: 'lifecycle'; status: PartLifecycle }

export interface SourcingBuy {
  mpn: string
  quantity: number
  unit_price: number
  total: number
  in_stock: number
  sources: number
  packaging?: string | null
}

export interface SourcingAlternate {
  mpn: string
  approved: boolean
  reason: 'replaces_unavailable' | 'cheaper'
  buy: SourcingBuy
  saves?: number | null
  manufacturer?: string | null
  description?: string | null
}

export interface SourcingPlanLine {
  mpn: string
  requested: number
  status: SourcingLineStatus
  buy?: SourcingBuy | null
  notes: SourcingNote[]
  manufacturer?: string | null
  description?: string | null
  alternate?: SourcingAlternate | null
}

export interface SourcingPlan {
  currency: string
  total: number
  saved: number
  counts: Record<SourcingLineStatus | 'swaps', number>
  sources_checked: number
  lines: SourcingPlanLine[]
}

export interface SourcingRun {
  id: string
  status: SourcingRunStatus
  progress: { stage: SourcingStage; done: number; total: number }
  plan?: SourcingPlan | null
  message?: string | null
}
