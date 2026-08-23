import { describe, expect, it } from 'vitest'
import {
  ANALYZE_EXPORT_HEADERS,
  analyzeLineToExportRow,
  baseFilename,
  buildAnalyzeExportCsv,
  escapeCsvField,
  sheetNameFromFilename,
} from '@/lib/export'
import type { AnalyzeResult, AnalyzedLine } from '@/lib/types'

const sampleLine: AnalyzedLine = {
  row_index: 3,
  mpn: 'LM358',
  manufacturer: 'Texas Instruments',
  quantity: 10,
  refdes: 'U1',
  description: 'Dual op amp',
  aml_candidates: ['LM358A', 'LM358B'],
  availability_status: 'instock',
  lifecycle_status: 'active',
  match_status: 'exact',
  factory_lead_days: 140,
  total_avail: 5000,
  top_sellers: [
    { name: 'Digi-Key', inventory_level: 3000 },
    { name: 'Mouser', inventory_level: 2000 },
  ],
  risk_level: 'green',
  hts_code: '8542.33.00',
  country_of_origin: 'MY',
  total_duty_pct: 25,
}

const sampleResult: AnalyzeResult = {
  upload_id: 'upload-1',
  source_filename: 'power-board.xlsx',
  sheet_name: 'BOM',
  mapping_confidence: 0.95,
  summary: {
    total: 1,
    in_stock: 1,
    out_of_stock: 0,
    eol_or_nrnd: 0,
    no_match: 0,
    long_lead: 0,
  },
  lines: [sampleLine],
  warnings: [],
  stats: {},
  analyzed_at: '2026-08-23T00:00:00.000Z',
}

describe('escapeCsvField', () => {
  it('quotes fields with commas', () => {
    expect(escapeCsvField('foo,bar')).toBe('"foo,bar"')
  })

  it('escapes embedded double quotes', () => {
    expect(escapeCsvField('say "hello"')).toBe('"say ""hello"""')
  })
})

describe('baseFilename', () => {
  it('strips the original extension', () => {
    expect(baseFilename(sampleResult)).toBe('power-board')
  })
})

describe('analyzeLineToExportRow', () => {
  it('maps analysis fields into export columns', () => {
    expect(analyzeLineToExportRow(sampleLine)).toEqual([
      '3',
      'U1',
      'LM358',
      'Texas Instruments',
      '10',
      'Dual op amp',
      'green',
      'instock',
      'active',
      'exact',
      '5000',
      '140',
      '20',
      'LM358A; LM358B',
      'Digi-Key (3,000); Mouser (2,000)',
      '8542.33.00',
      'MY',
      '25',
    ])
  })

  it('uses the same column count as headers', () => {
    expect(analyzeLineToExportRow(sampleLine)).toHaveLength(ANALYZE_EXPORT_HEADERS.length)
  })
})

describe('buildAnalyzeExportCsv', () => {
  it('includes headers and one row per line', () => {
    const csv = buildAnalyzeExportCsv(sampleResult)
    const lines = csv.split('\n')
    expect(lines[0]).toBe(ANALYZE_EXPORT_HEADERS.join(','))
    expect(lines).toHaveLength(2)
    expect(lines[1]).toContain('LM358')
  })
})

describe('sheetNameFromFilename', () => {
  it('sanitizes invalid Excel sheet characters', () => {
    expect(
      sheetNameFromFilename({ ...sampleResult, source_filename: 'bad[name]:test?.csv' }),
    ).toBe('bad name  test')
  })
})
