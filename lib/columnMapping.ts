import type { ColumnMapping, ParseResult } from './types'

const CANONICAL_FIELDS: { canonical: string; label: string }[] = [
  { canonical: 'mpn', label: 'MPN / Part Number' },
  { canonical: 'manufacturer', label: 'Manufacturer' },
  { canonical: 'quantity', label: 'Quantity' },
  { canonical: 'refdes', label: 'Reference Designator' },
  { canonical: 'description', label: 'Description' },
  { canonical: 'footprint', label: 'Footprint' },
]

export function buildColumnMappings(parseResult: ParseResult): ColumnMapping[] {
  const mapping = parseResult.column_mapping
  const confidence = parseResult.mapping_confidence

  return CANONICAL_FIELDS.map(({ canonical, label }) => {
    const detectedFrom = mapping[canonical] ?? null
    const confirmed = detectedFrom != null && confidence >= 0.4
    return { canonical, label, detectedFrom, confirmed }
  })
}

export function extractHeaders(parseResult: ParseResult): string[] {
  const fromMapping = Object.values(parseResult.column_mapping)
  const fromExtras = parseResult.lines.flatMap((line) => Object.keys(line.extras))
  return Array.from(new Set([...fromMapping, ...fromExtras]))
}

export function previewRows(parseResult: ParseResult, maxRows = 2): string[][] {
  const headers = extractHeaders(parseResult)
  const mapping = parseResult.column_mapping

  const reverseMap = Object.fromEntries(Object.entries(mapping).map(([canonical, header]) => [header, canonical]))

  return parseResult.lines.slice(0, maxRows).map((line) =>
    headers.map((header) => {
      const canonical = reverseMap[header]
      if (canonical === 'mpn') return line.mpn ?? '—'
      if (canonical === 'manufacturer') return line.manufacturer ?? '—'
      if (canonical === 'quantity') return line.quantity?.toString() ?? '—'
      if (canonical === 'refdes') return line.refdes ?? '—'
      if (canonical === 'description') return line.description ?? '—'
      if (canonical === 'footprint') return line.footprint ?? '—'
      return line.extras[header] ?? '—'
    }),
  )
}
