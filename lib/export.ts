import { buildLineDecision } from '@/lib/decision'
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

export function buildAnalyzeExportCsv(result: AnalyzeResult): string {
  const rows = [
    ANALYZE_EXPORT_HEADERS.join(','),
    ...result.lines.map((line) =>
      analyzeLineToExportRow(line).map(escapeCsvField).join(','),
    ),
  ]
  return rows.join('\n')
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

export async function exportAnalyzeResultXlsx(result: AnalyzeResult) {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Prokuro'
  workbook.created = new Date()
  const sheet = workbook.addWorksheet(sheetNameFromFilename(result), {
    views: [{ state: 'frozen', ySplit: 1 }],
  })
  sheet.addRow([...ANALYZE_EXPORT_HEADERS])
  sheet.getRow(1).font = { bold: true }
  for (const line of result.lines) {
    sheet.addRow(analyzeLineToExportRow(line))
  }
  sheet.columns.forEach((column) => {
    let max = 10
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const len = String(cell.value ?? '').length
      if (len > max) max = Math.min(len, 40)
    })
    column.width = max + 2
  })
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  downloadBlob(blob, `${baseFilename(result)}-analysis.xlsx`)
}

/** @deprecated Prefer exportAnalyzeResultXlsx */
export async function exportAnalyzeResultExcel(result: AnalyzeResult) {
  return exportAnalyzeResultXlsx(result)
}

export async function exportAnalyzeResultPdf(result: AnalyzeResult) {
  const [{ jsPDF }, autoTableMod] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const autoTable = autoTableMod.default
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' })
  const title = baseFilename(result)
  const flagged =
    (result.summary.red_count ?? 0) + (result.summary.yellow_count ?? 0)
  const atRisk = result.lines.filter((line) => {
    const level = lineRiskLevel(line)
    return level === 'red' || level === 'yellow'
  })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Prokuro BOM decision report', 40, 40)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(80)
  doc.text(`${title} · ${result.lines.length} lines · ${flagged} flagged · ${result.analyzed_at}`, 40, 58)
  doc.setTextColor(0)

  autoTable(doc, {
    startY: 72,
    head: [['MPN', 'Mfr', 'Qty', 'Risk', 'Lifecycle', 'Stock', 'Lead (w)', 'Duty', 'Alternate', 'Next action']],
    body: result.lines.map((line) => {
      const decision = buildLineDecision(line)
      const weeks = leadTimeWeeks(line)
      return [
        line.mpn ?? '—',
        line.manufacturer ?? '—',
        line.quantity?.toString() ?? '—',
        lineRiskLevel(line),
        line.lifecycle_status,
        line.total_avail.toLocaleString(),
        weeks?.toString() ?? '—',
        line.total_duty_pct != null && line.total_duty_pct > 0
          ? `${line.total_duty_pct}%`
          : '—',
        decision.recommendedAlternate ?? '—',
        decision.nextAction,
      ]
    }),
    styles: { fontSize: 7, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: [15, 27, 45], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 72 },
      9: { cellWidth: 140 },
    },
    margin: { left: 40, right: 40 },
  })

  if (atRisk.length > 0) {
    doc.addPage()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(0)
    doc.text('At-risk decision cards', 40, 40)
    let y = 60
    for (const line of atRisk.slice(0, 12)) {
      const decision = buildLineDecision(line)
      if (y > 520) {
        doc.addPage()
        y = 40
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(`${line.mpn ?? 'Unknown MPN'} · ${lineRiskLevel(line).toUpperCase()}`, 40, y)
      y += 14
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      const blocks = [
        decision.summary,
        `Why: ${decision.whyScore}`,
        `Action: ${decision.nextAction}`,
      ]
      for (const block of blocks) {
        const wrapped = doc.splitTextToSize(block, 720)
        doc.text(wrapped, 40, y)
        y += wrapped.length * 11 + 4
      }
      y += 10
    }
  }

  doc.save(`${baseFilename(result)}-analysis.pdf`)
}
