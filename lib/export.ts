import { leadTimeWeeks, lineRiskLevel } from '@/lib/risk'
import type { AnalyzeResult, AnalyzedLine, SellerOffer } from './types'

export const ANALYZE_EXPORT_HEADERS = [
  'row_index',
  'refdes',
  'mpn',
  'manufacturer',
  'quantity',
  'description',
  'risk_level',
  'availability_status',
  'lifecycle_status',
  'match_status',
  'total_avail',
  'factory_lead_days',
  'factory_lead_weeks',
  'aml_candidates',
  'top_sellers',
  'hts_code',
  'country_of_origin',
  'total_duty_pct',
] as const

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function baseFilename(result: AnalyzeResult): string {
  const name = result.source_filename.replace(/\.[^.]+$/, '')
  return name || 'bom-analysis'
}

function formatTopSellers(sellers: SellerOffer[] | null | undefined): string {
  if (!sellers?.length) return ''
  return sellers
    .map((seller) => {
      const stock = seller.inventory_level ?? 0
      return `${seller.name} (${stock.toLocaleString()})`
    })
    .join('; ')
}

export function analyzeLineToExportRow(line: AnalyzedLine): string[] {
  const weeks = leadTimeWeeks(line)
  return [
    String(line.row_index),
    line.refdes ?? '',
    line.mpn ?? '',
    line.manufacturer ?? '',
    line.quantity?.toString() ?? '',
    line.description ?? '',
    lineRiskLevel(line),
    line.availability_status,
    line.lifecycle_status,
    line.match_status,
    line.total_avail.toString(),
    line.factory_lead_days?.toString() ?? '',
    weeks?.toString() ?? '',
    line.aml_candidates.join('; '),
    formatTopSellers(line.top_sellers),
    line.hts_code ?? '',
    line.country_of_origin ?? '',
    line.total_duty_pct?.toString() ?? '',
  ]
}

export function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildAnalyzeExportCsv(result: AnalyzeResult): string {
  const rows = [
    ANALYZE_EXPORT_HEADERS.join(','),
    ...result.lines.map((line) =>
      analyzeLineToExportRow(line).map(escapeCsvField).join(','),
    ),
  ]
  return rows.join('\n')
}

export function buildAnalyzeExportSpreadsheetXml(result: AnalyzeResult): string {
  const rows = [ANALYZE_EXPORT_HEADERS, ...result.lines.map(analyzeLineToExportRow)]
  const xmlRows = rows
    .map(
      (row) =>
        `<Row>${row
          .map((cell) => `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`)
          .join('')}</Row>`,
    )
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="${escapeXml(sheetNameFromFilename(result))}">
  <Table>${xmlRows}</Table>
 </Worksheet>
</Workbook>`
}

export function sheetNameFromFilename(result: AnalyzeResult): string {
  const raw = baseFilename(result).replace(/[[\]:*?/\\]/g, ' ').trim()
  const name = raw.slice(0, 31) || 'BOM'
  return name
}

export function exportAnalyzeResultJson(result: AnalyzeResult) {
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `${baseFilename(result)}-analysis.json`)
}

export function exportAnalyzeResultCsv(result: AnalyzeResult) {
  const blob = new Blob([buildAnalyzeExportCsv(result)], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, `${baseFilename(result)}-analysis.csv`)
}

export function exportAnalyzeResultExcel(result: AnalyzeResult) {
  const blob = new Blob([buildAnalyzeExportSpreadsheetXml(result)], {
    type: 'application/vnd.ms-excel',
  })
  downloadBlob(blob, `${baseFilename(result)}-analysis.xls`)
}
