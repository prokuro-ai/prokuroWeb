import { describe, expect, it } from 'vitest'
import {
  addToCart,
  boardToCart,
  buildCatalog,
  buildSuggestions,
  cartLineFrom,
  isPassive,
  parseStoredCart,
  setCartQuantity,
  type Board,
} from '@/lib/cart'
import type { AnalyzedLine } from '@/lib/types'

function line(overrides: Partial<AnalyzedLine>): AnalyzedLine {
  return {
    row_index: 0,
    mpn: 'LM7805CT',
    manufacturer: 'Texas Instruments',
    quantity: 1,
    refdes: 'U1',
    description: 'Linear regulator',
    aml_candidates: [],
    availability_status: 'InStock',
    lifecycle_status: 'Active',
    match_status: 'Exact',
    factory_lead_days: 42,
    total_avail: 5000,
    risk_level: 'green',
    ...overrides,
  }
}

const controller: Board = {
  id: 'b1',
  name: 'Controller',
  lines: [
    line({ row_index: 0, mpn: 'LM7805CT', refdes: 'U1', risk_level: 'red', lifecycle_status: 'EOL', aml_candidates: ['L7805CV'] }),
    line({ row_index: 1, mpn: 'GRM155R61A104KA01D', refdes: 'C1, C2, C3', quantity: 3, description: '100nF 0402' }),
    line({ row_index: 2, mpn: 'RC0402FR-0710KL', refdes: 'R1', quantity: 2, description: '10k 0402' }),
    line({ row_index: 3, mpn: null, refdes: 'TP1' }),
  ],
}

const sensor: Board = {
  id: 'b2',
  name: 'Sensor',
  lines: [line({ row_index: 0, mpn: 'grm155r61a104ka01d', refdes: 'C9', quantity: 4, risk_level: 'yellow' })],
}

describe('buildCatalog', () => {
  it('dedupes MPNs across boards case-insensitively and keeps the worst risk', () => {
    const catalog = buildCatalog([controller, sensor])
    const cap = catalog.find((part) => part.key === 'GRM155R61A104KA01D')!
    expect(catalog).toHaveLength(3)
    expect(cap.uses.map((use) => use.bomName)).toEqual(['Controller', 'Sensor'])
    expect(cap.line.risk_level).toBe('yellow')
    expect(catalog[0].key).toBe('GRM155R61A104KA01D')
  })
})

describe('cart edits', () => {
  it('merges repeat adds and ignores invalid quantities', () => {
    let cart = addToCart([], [cartLineFrom({ mpn: ' lm7805ct ' }, 5)])
    cart = addToCart(cart, [cartLineFrom({ mpn: 'LM7805CT' }, 3)])
    expect(cart).toEqual([expect.objectContaining({ key: 'LM7805CT', quantity: 8 })])
    expect(setCartQuantity(cart, 'LM7805CT', 0)).toBe(cart)
    expect(setCartQuantity(cart, 'LM7805CT', 12)[0].quantity).toBe(12)
  })

  it('adds a board times builds and skips lines without an MPN', () => {
    expect(boardToCart(controller, 10).map((item) => [item.key, item.quantity])).toEqual([
      ['LM7805CT', 10],
      ['GRM155R61A104KA01D', 30],
      ['RC0402FR-0710KL', 20],
    ])
  })

  it('drops stored carts that do not parse', () => {
    expect(parseStoredCart('not json')).toEqual([])
    expect(parseStoredCart('[{"mpn":"","quantity":2},{"mpn":"BSS138","quantity":2}]')).toEqual([
      expect.objectContaining({ key: 'BSS138', quantity: 2 }),
    ])
  })
})

describe('isPassive', () => {
  it('reads refdes prefixes and categories', () => {
    expect(isPassive(line({ refdes: 'C1, C2' }))).toBe(true)
    expect(isPassive(line({ refdes: 'FB3' }))).toBe(true)
    expect(isPassive(line({ refdes: 'U1' }))).toBe(false)
    expect(isPassive(line({ refdes: null, category: 'Ceramic Capacitors' }))).toBe(true)
  })
})

describe('buildSuggestions', () => {
  const boards = [controller, sensor]
  const catalog = buildCatalog(boards)

  it('offers an AML second source for an at-risk part in the cart', () => {
    const cart = [cartLineFrom({ mpn: 'LM7805CT' }, 10)]
    const alt = buildSuggestions(cart, catalog, boards).find((s) => s.source === 'Your AML')!
    expect(alt.title).toBe('L7805CV as a second source for LM7805CT')
    expect(alt.add).toEqual([expect.objectContaining({ key: 'L7805CV', quantity: 10 })])
  })

  it('offers the rest of a partly added board, sized to the builds already in the cart', () => {
    const cart = [cartLineFrom({ mpn: 'LM7805CT' }, 10)]
    const board = buildSuggestions(cart, catalog, boards).find((s) => s.source === 'Board')!
    expect(board.add.map((item) => [item.key, item.quantity])).toEqual([
      ['GRM155R61A104KA01D', 30],
      ['RC0402FR-0710KL', 20],
    ])
  })

  it('does not treat a part shared across boards as starting the other board', () => {
    const cart = boardToCart(controller, 250)
    expect(buildSuggestions(cart, catalog, boards).filter((s) => s.source === 'Board')).toEqual([])
  })

  it('tops up passives by 10% with a 10 piece floor, and stays gone once dismissed', () => {
    const cart = boardToCart(controller, 200)
    const spares = buildSuggestions(cart, catalog, boards).find((s) => s.source === 'Attrition rule')!
    expect(spares.add.map((item) => [item.key, item.quantity])).toEqual([
      ['GRM155R61A104KA01D', 60],
      ['RC0402FR-0710KL', 40],
    ])
    const after = buildSuggestions(addToCart(cart, spares.add), catalog, boards, new Set(spares.keys))
    expect(after.find((s) => s.source === 'Attrition rule')).toBeUndefined()

    const small = buildSuggestions([cartLineFrom({ mpn: 'RC0402FR-0710KL' }, 2)], catalog, boards)
    expect(small.find((s) => s.source === 'Attrition rule')!.add[0].quantity).toBe(10)
  })

  it('suggests nothing for an empty cart', () => {
    expect(buildSuggestions([], catalog, boards)).toEqual([])
  })
})
