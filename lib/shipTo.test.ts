import { describe, expect, it } from 'vitest'
import { EMPTY_SHIP_TO, parseStoredShipTo, shipToForOrder, type ShipToDraft } from '@/lib/shipTo'

function draft(overrides: Partial<ShipToDraft> = {}): ShipToDraft {
  return { ...EMPTY_SHIP_TO, ...overrides }
}

describe('shipToForOrder', () => {
  it('omits ship_to when every field is blank or whitespace', () => {
    expect(shipToForOrder(EMPTY_SHIP_TO)).toEqual({})
    expect(shipToForOrder(draft({ name: '  ', city: '\t' }))).toEqual({})
  })

  it('errors when only optional fields are filled', () => {
    expect(shipToForOrder(draft({ name: 'Ada', company: 'Prokuro' })).error).toMatch(/street/i)
  })

  it('errors when required fields are incomplete', () => {
    expect(shipToForOrder(draft({ line1: '1 Main', city: 'Austin' })).error).toMatch(/street/i)
    expect(
      shipToForOrder(draft({ line1: '1 Main', city: 'Austin', postal_code: '78701' })).error,
    ).toMatch(/street/i)
  })

  it('accepts the four required fields and drops empty optionals', () => {
    expect(
      shipToForOrder(
        draft({
          line1: ' 1 Main ',
          city: ' Austin ',
          postal_code: ' 78701 ',
          country: ' US ',
          name: '  ',
        }),
      ),
    ).toEqual({
      address: {
        line1: '1 Main',
        city: 'Austin',
        postal_code: '78701',
        country: 'US',
      },
    })
  })

  it('includes optional fields when present', () => {
    expect(
      shipToForOrder(
        draft({
          name: 'Ada',
          company: 'Prokuro',
          line1: '1 Main',
          line2: 'Suite 2',
          city: 'Austin',
          region: 'TX',
          postal_code: '78701',
          country: 'US',
        }),
      ).address,
    ).toEqual({
      name: 'Ada',
      company: 'Prokuro',
      line1: '1 Main',
      line2: 'Suite 2',
      city: 'Austin',
      region: 'TX',
      postal_code: '78701',
      country: 'US',
    })
  })
})

describe('parseStoredShipTo', () => {
  it('returns empty on null, invalid JSON, or non-objects', () => {
    expect(parseStoredShipTo(null)).toEqual(EMPTY_SHIP_TO)
    expect(parseStoredShipTo('not-json')).toEqual(EMPTY_SHIP_TO)
    expect(parseStoredShipTo('[]')).toEqual(EMPTY_SHIP_TO)
    expect(parseStoredShipTo('null')).toEqual(EMPTY_SHIP_TO)
  })

  it('keeps only string fields and ignores junk keys', () => {
    expect(
      parseStoredShipTo(
        JSON.stringify({
          line1: '1 Main',
          city: 12,
          postal_code: '78701',
          country: 'US',
          extra: 'nope',
        }),
      ),
    ).toEqual({
      ...EMPTY_SHIP_TO,
      line1: '1 Main',
      postal_code: '78701',
      country: 'US',
    })
  })
})
