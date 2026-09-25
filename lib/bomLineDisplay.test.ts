import { describe, expect, it } from 'vitest'
import { lineStatusLabel } from '@/lib/bomLineDisplay'
import { accountUnscored, isPendingLine, pendingLineCount, stillLookingUpLabel } from '@/lib/risk'
import type { AnalyzeResult, AnalyzedLine } from '@/lib/types'

const base: AnalyzedLine = {
  row_index: 0,
  mpn: 'LM7805CT',
  manufacturer: 'Texas Instruments',
  quantity: 10,
  refdes: 'U1',
  description: 'Linear regulator',
  aml_candidates: [],
  availability_status: 'InStock',
  lifecycle_status: 'Active',
  match_status: 'Exact',
  factory_lead_days: 42,
  total_avail: 5000,
  risk_level: 'green',
}

/** Enrichment has not answered for this line yet. */
const pending: AnalyzedLine = {
  ...base,
  row_index: 1,
  mpn: 'BSS138',
  risk_level: 'unknown',
  availability_status: 'Pending',
  match_status: 'Pending',
  total_avail: 0,
  factory_lead_days: null,
}

/** Enrichment answered and found nothing. */
const noMatch: AnalyzedLine = {
  ...base,
  row_index: 2,
  mpn: 'NOT-A-REAL-MPN',
  risk_level: 'unknown',
  availability_status: 'NoMatch',
  match_status: 'none',
  total_avail: 0,
  factory_lead_days: null,
}

function resultWith(lines: AnalyzedLine[]): AnalyzeResult {
  return {
    upload_id: 'upload-1',
    source_filename: 'board.csv',
    sheet_name: null,
    mapping_confidence: 0.95,
    summary: { total: lines.length, in_stock: 0, out_of_stock: 0, eol_or_nrnd: 0, no_match: 0, long_lead: 0 },
    lines,
    warnings: [],
    stats: {},
    analyzed_at: '2026-09-14T00:00:00Z',
  }
}

describe('lineStatusLabel', () => {
  it('labels a line still being looked up Checking, never Unmatched', () => {
    expect(lineStatusLabel(pending)).toBe('Checking')
  })

  it('keeps Unmatched for a resolved catalog miss', () => {
    expect(lineStatusLabel(noMatch)).toBe('Unmatched')
  })

  it('leaves scored lines alone', () => {
    expect(lineStatusLabel(base)).toBe('Clear')
    expect(lineStatusLabel({ ...base, risk_level: 'red' })).toBe('Critical')
    expect(lineStatusLabel({ ...base, risk_level: 'yellow' })).toBe('Watch')
  })

  it('treats a pending availability status alone as pending', () => {
    const halfPending = { ...base, risk_level: 'unknown' as const, availability_status: 'Pending' }
    expect(isPendingLine(halfPending)).toBe(true)
    expect(lineStatusLabel(halfPending)).toBe('Checking')
  })
})

describe('pendingLineCount', () => {
  it('counts only lines still being looked up', () => {
    expect(pendingLineCount(resultWith([base, pending, noMatch, pending]))).toBe(2)
  })

  it('is zero once everything resolves', () => {
    expect(pendingLineCount(resultWith([base, noMatch]))).toBe(0)
  })
})

describe('stillLookingUpLabel', () => {
  it('reads as a count, not a risk verdict', () => {
    expect(stillLookingUpLabel(3)).toBe('3 still looking up')
    expect(stillLookingUpLabel(1200)).toBe('1,200 still looking up')
  })
})

describe('accountUnscored', () => {
  it('splits still-looking-up lines out of the unknown bucket', () => {
    expect(
      accountUnscored([
        { unknownCount: 5, pendingCount: 2 },
        { unknownCount: 1, pendingCount: 1 },
      ]),
    ).toEqual({ pending: 3, noMatch: 3 })
  })

  it('treats a missing pending count as all resolved misses', () => {
    expect(accountUnscored([{ unknownCount: 4 }])).toEqual({ pending: 0, noMatch: 4 })
  })

  it('does not let pending exceed unknown', () => {
    expect(accountUnscored([{ unknownCount: 1, pendingCount: 9 }])).toEqual({
      pending: 1,
      noMatch: 0,
    })
  })
})
