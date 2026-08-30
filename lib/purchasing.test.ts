import { describe, expect, it } from 'vitest'
import { filterAvailable, mergeDraftLines, sourcedPartsFromLines } from '@/lib/purchasing'
import type { AnalyzedLine } from '@/lib/types'

function line(overrides: Partial<AnalyzedLine>): AnalyzedLine {
  return {
    row_index: 0,
    mpn: 'LM358DR',
    manufacturer: 'Texas Instruments',
    quantity: 10,
    refdes: 'U1',
    description: null,
    aml_candidates: [],
    availability_status: 'instock',
    lifecycle_status: 'active',
    match_status: 'exact',
    factory_lead_days: 70,
    total_avail: 5000,
    ...overrides,
  }
}

describe('sourcedPartsFromLines', () => {
  it('collapses repeated MPNs and sums the quantity needed', () => {
    const parts = sourcedPartsFromLines([
      line({ row_index: 0, quantity: 10, refdes: 'U1' }),
      line({ row_index: 1, quantity: 4, refdes: 'U2' }),
    ])

    expect(parts).toHaveLength(1)
    expect(parts[0].quantity).toBe(14)
    expect(parts[0].refdes).toEqual(['U1', 'U2'])
    expect(parts[0].coverage).toBe('covered')
  })

  it('keeps the same MPN separate per manufacturer', () => {
    const parts = sourcedPartsFromLines([
      line({ manufacturer: 'Texas Instruments' }),
      line({ manufacturer: 'onsemi' }),
    ])

    expect(parts).toHaveLength(2)
  })

  it('marks stock below the BOM quantity as partial', () => {
    const [part] = sourcedPartsFromLines([line({ quantity: 500, total_avail: 120 })])

    expect(part.coverage).toBe('short')
  })

  it('marks out-of-stock and pending lines as unavailable', () => {
    const [outOfStock] = sourcedPartsFromLines([
      line({ availability_status: 'outofstock', total_avail: 0 }),
    ])
    const [pending] = sourcedPartsFromLines([
      line({ availability_status: 'pending', total_avail: 0 }),
    ])

    expect(outOfStock.coverage).toBe('none')
    expect(pending.coverage).toBe('none')
  })

  it('skips lines without an MPN', () => {
    expect(sourcedPartsFromLines([line({ mpn: null }), line({ mpn: '  ' })])).toEqual([])
  })

  it('reports the longest lead time across rows', () => {
    const [part] = sourcedPartsFromLines([
      line({ row_index: 0, factory_lead_days: 70 }),
      line({ row_index: 1, factory_lead_days: 140 }),
    ])

    expect(part.leadDays).toBe(140)
  })
})

describe('filterAvailable', () => {
  it('hides parts with no stock when in-stock only is on', () => {
    const parts = sourcedPartsFromLines([
      line({ mpn: 'IN-STOCK' }),
      line({ mpn: 'NO-STOCK', availability_status: 'outofstock', total_avail: 0 }),
    ])

    expect(filterAvailable(parts, true).map((part) => part.mpn)).toEqual(['IN-STOCK'])
    expect(filterAvailable(parts, false)).toHaveLength(2)
  })
})

describe('mergeDraftLines', () => {
  const parts = sourcedPartsFromLines([line({ mpn: 'LM358DR', quantity: 14 })])

  it('replaces the blank starter row', () => {
    const result = mergeDraftLines([{ mpn: '', quantity: '1' }], parts)

    expect(result.lines).toEqual([{ mpn: 'LM358DR', quantity: '14' }])
    expect(result.added).toBe(1)
  })

  it('does not duplicate an MPN already on the quote', () => {
    const result = mergeDraftLines([{ mpn: 'lm358dr', quantity: '2' }], parts)

    expect(result.lines).toEqual([{ mpn: 'lm358dr', quantity: '2' }])
    expect(result.added).toBe(0)
    expect(result.skipped).toBe(1)
  })

  it('always leaves an editable row behind', () => {
    expect(mergeDraftLines([], []).lines).toEqual([{ mpn: '', quantity: '1' }])
  })
})
