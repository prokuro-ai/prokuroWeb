import { describe, expect, it } from 'vitest'
import { bomPrice, extendedPrice, substituteCostNote, unitPriceAt } from '@/lib/linePrice'
import type { AnalyzedLine } from '@/lib/types'

const line = (overrides: Partial<AnalyzedLine> = {}): AnalyzedLine => ({
  row_index: 0,
  mpn: 'GRM155R61A105KE15D',
  manufacturer: 'Murata',
  quantity: 100,
  refdes: 'C1',
  description: 'cap',
  aml_candidates: [],
  availability_status: 'instock',
  lifecycle_status: 'active',
  match_status: 'exact',
  factory_lead_days: 14,
  total_avail: 1000,
  risk_level: 'green',
  price_breaks: [
    { quantity: 1, unit_price: 0.12 },
    { quantity: 100, unit_price: 0.08 },
  ],
  ...overrides,
})

describe('unitPriceAt', () => {
  it('uses the 100 break at quantity 100, not the 1 break', () => {
    expect(unitPriceAt(line().price_breaks, 100)).toBe(0.08)
    expect(extendedPrice(line())).toBe(8)
  })

  it('keeps a reel price when the line quantity is below every break', () => {
    const breaks = [{ quantity: 4000, unit_price: 0.05 }]
    expect(unitPriceAt(breaks, 12)).toBe(0.05)
    expect(extendedPrice(line({ quantity: 12, price_breaks: breaks }))).toBeCloseTo(0.6)
  })
})

describe('bomPrice', () => {
  it('skips a line with an empty break list', () => {
    const priced = bomPrice([line(), line({ row_index: 1, price_breaks: [] })])
    expect(priced.total).toBe(8)
    expect(priced.unpriced).toBe(1)
    expect(priced.priced).toBe(1)
  })
})

describe('substituteCostNote', () => {
  it('formats a cheaper alternate as a savings', () => {
    expect(substituteCostNote(8, 6.4)).toBe('Saves $1.60')
  })

  it('states the alternate price when the line has none', () => {
    expect(substituteCostNote(null, 18.2)).toBe('$18.20 at your qty')
  })
})
