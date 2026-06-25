import type { AnalyzeResult, AnalyzedLine, SellerOffer } from './types'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function baseFilename(result: AnalyzeResult): string {
  const name = result.source_filename.replace(/\.[^.]+$/, '')
  return name || 'bom-analysis'
}

function formatTopSellers(sellers: SellerOffer[]): string {
  return sellers
    .map((seller) => {
      const stock = seller.inventory_level
      return `${seller.name} (${stock.toLocaleString()})`
    })
    .join('; ')
}

function lineToCsvRow(line: AnalyzedLine): string[] {
  return [
    line.refdes ?? '',
    line.mpn ?? '',
    line.manufacturer ?? '',
    line.quantity?.toString() ?? '',
    line.description ?? '',
    line.availability_status,
    line.lifecycle_status,
    line.match_status,
    line.total_avail.toString(),
    line.factory_lead_days?.toString() ?? '',
    line.aml_candidates.join('; '),
    formatTopSellers(line.top_sellers),
  ]
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function exportAnalyzeResultJson(result: AnalyzeResult) {
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `${baseFilename(result)}-analysis.json`)
}

export function exportAnalyzeResultCsv(result: AnalyzeResult) {
  const headers = [
    'refdes',
    'mpn',
    'manufacturer',
    'quantity',
    'description',
    'availability_status',
    'lifecycle_status',
    'match_status',
    'total_avail',
    'factory_lead_days',
    'aml_candidates',
    'top_sellers',
  ]

  const rows = [
    headers.join(','),
    ...result.lines.map((line) => lineToCsvRow(line).map(escapeCsvField).join(',')),
  ]

  const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
  downloadBlob(blob, `${baseFilename(result)}-analysis.csv`)
}
