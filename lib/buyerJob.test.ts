import { describe, expect, it } from 'vitest'
import { buyerJob, lineFactChips } from '@/lib/buyerJob'
import type { AnalyzedLine } from '@/lib/types'

const base: AnalyzedLine = {
  row_index: 0,
  mpn: 'ABC-1',
  manufacturer: 'Acme',
  quantity: 10,
  refdes: 'U1',
  description: 'part',
  aml_candidates: [],
  availability_status: 'InStock',
  lifecycle_status: 'Active',
  match_status: 'Exact',
  factory_lead_days: 14,
  total_avail: 500,
  risk_level: 'yellow',
}

describe('buyerJob', () => {
  it('groups EOL as going obsolete before stock', () => {
    expect(
      buyerJob({
        ...base,
        lifecycle_status: 'eol',
        availability_status: 'OutOfStock',
        total_avail: 0,
        risk_level: 'red',
      }),
    ).toBe('obsolete')
  })

  it('groups out of stock as cannot buy', () => {
    expect(
      buyerJob({
        ...base,
        availability_status: 'OutOfStock',
        total_avail: 0,
        risk_level: 'red',
      }),
    ).toBe('cant_buy')
  })

  it('groups catalog misses as unmatched', () => {
    expect(
      buyerJob({
        ...base,
        match_status: 'None',
        availability_status: 'NoMatch',
        risk_level: 'unknown',
      }),
    ).toBe('unmatched')
  })

  it('groups duty-only flags as tariff', () => {
    expect(buyerJob({ ...base, total_duty_pct: 25 })).toBe('tariff')
  })
})

describe('lineFactChips', () => {
  it('omits duty when none is present', () => {
    const labels = lineFactChips(base).map((chip) => chip.label)
    expect(labels).not.toContain('Duty')
  })

  it('includes duty when the line has a rate', () => {
    const duty = lineFactChips({ ...base, total_duty_pct: 12.5 }).find((chip) => chip.label === 'Duty')
    expect(duty?.value).toBe('12.5%')
  })
})
