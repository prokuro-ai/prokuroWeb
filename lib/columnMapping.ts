import type { ColumnMapping, ParseResult } from './types'

const CANONICAL_FIELDS: { canonical: string; label: string }[] = [
  { canonical: 'mpn', label: 'MPN / Part Number' },
  { canonical: 'manufacturer', label: 'Manufacturer' },
  { canonical: 'qty', label: 'Quantity' },
  { canonical: 'refdes', label: 'Reference Designator' },
  { canonical: 'description', label: 'Description' },
  { canonical: 'footprint', label: 'Footprint' },
]

const FIELD_LABELS: Record<string, string> = {
  mpn: 'Part number',
  qty: 'Quantity',
  refdes: 'Reference',
  manufacturer: 'Manufacturer',
  description: 'Description',
  footprint: 'Footprint',
  alternate_mpn: 'Alternate MPN',
}

export function canonicalFieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field
}

export function buildColumnMappings(parseResult: ParseResult): ColumnMapping[] {
  const mapping = parseResult.column_mapping
  const confidence = parseResult.mapping_confidence

  return CANONICAL_FIELDS.map(({ canonical, label }) => {
    const detectedFrom =
      Object.entries(mapping).find(([, field]) => field === canonical)?.[0]?.trim() ?? null
    const confirmed = detectedFrom != null && confidence >= 0.4
    return { canonical, label, detectedFrom, confirmed }
  })
}

export function extractHeaders(parseResult: ParseResult): string[] {
  const fromMapping = Object.keys(parseResult.column_mapping)
  const fromExtras = parseResult.lines.flatMap((line) => Object.keys(line.extras))
  return Array.from(new Set([...fromMapping.map((h) => h.trim()), ...fromExtras]))
}

export function previewRows(parseResult: ParseResult, maxRows = 2): string[][] {
  const headers = extractHeaders(parseResult)
  const mapping = parseResult.column_mapping

  return parseResult.lines.slice(0, maxRows).map((line) =>
    headers.map((header) => {
      const canonical =
        mapping[header] ??
        Object.entries(mapping).find(([source]) => source.trim() === header)?.[1]
      if (canonical === 'mpn') return line.mpn ?? '—'
      if (canonical === 'manufacturer') return line.manufacturer ?? '—'
      if (canonical === 'qty') return line.quantity?.toString() ?? '—'
      if (canonical === 'refdes') return line.refdes ?? '—'
      if (canonical === 'description') return line.description ?? '—'
      if (canonical === 'footprint') return line.footprint ?? '—'
      return line.extras[header] ?? '—'
    }),
  )
}
