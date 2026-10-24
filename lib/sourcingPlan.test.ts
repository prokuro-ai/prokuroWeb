import { describe, expect, it } from 'vitest'
import { cartLineFrom, type CartLine, type CatalogPart } from '@/lib/cart'
import {
  alternatesFor,
  applyPlan,
  cartPlanView,
  coverage,
  finishedRun,
  MAX_RUN_QUANTITY,
  needsAttention,
  normalizePlan,
  noteText,
  parseStoredPlan,
  pendingChanges,
  planCsv,
  planMatchesCart,
  plannedSavings,
  plannedTotal,
  runRequest,
  sortLines,
  STATUS_META,
  STATUS_ORDER,
  statusHint,
  swappedInCart,
  swapText,
} from '@/lib/sourcingPlan'
import type { AnalyzedLine, SourcingAlternate, SourcingBuy, SourcingPlan, SourcingPlanLine } from '@/lib/types'

function buy(overrides: Partial<SourcingBuy> = {}): SourcingBuy {
  return { mpn: 'LM7805CT', quantity: 10, unit_price: 0.5, total: 5, in_stock: 1000, sources: 1, ...overrides }
}

function planLine(overrides: Partial<SourcingPlanLine> = {}): SourcingPlanLine {
  return { mpn: 'LM7805CT', requested: 10, status: 'ready', buy: buy(), notes: [], ...overrides }
}

function alternate(overrides: Partial<SourcingAlternate> = {}): SourcingAlternate {
  return {
    mpn: 'L7805CV',
    approved: true,
    reason: 'replaces_unavailable',
    buy: buy({ mpn: 'L7805CV', quantity: 10, unit_price: 0.4, total: 4 }),
    ...overrides,
  }
}

function plan(lines: SourcingPlanLine[], overrides: Partial<SourcingPlan> = {}): SourcingPlan {
  return normalizePlan({ currency: 'USD', total: 0, saved: 0, counts: {}, sources_checked: 2, lines, ...overrides })!
}

function cart(...lines: [string, number][]): CartLine[] {
  return lines.map(([mpn, quantity]) => cartLineFrom({ mpn }, quantity))
}

function analyzed(overrides: Partial<AnalyzedLine>): AnalyzedLine {
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

function catalogPart(line: AnalyzedLine): CatalogPart {
  const mpn = line.mpn!.trim()
  return {
    key: mpn.toUpperCase(),
    mpn,
    manufacturer: line.manufacturer,
    description: line.description,
    fit: line.footprint?.trim() || null,
    line,
    uses: [],
  }
}

describe('alternatesFor', () => {
  it('sends AML candidates as approved and the brief alternate as unapproved', () => {
    const part = catalogPart(
      analyzed({ aml_candidates: ['L7805CV', 'MC7805CTG'], brief: { alternate: 'UA7805CKCS' } as AnalyzedLine['brief'] }),
    )
    expect(alternatesFor(part)).toEqual([
      { mpn: 'L7805CV', approved: true },
      { mpn: 'MC7805CTG', approved: true },
      { mpn: 'UA7805CKCS', approved: false },
    ])
  })

  it('drops the part itself, duplicates, blanks, and free-text suggestions', () => {
    const part = catalogPart(
      analyzed({
        aml_candidates: ['lm7805ct', ' L7805CV ', 'l7805cv', '', '   '],
        brief: { alternate: 'Use any 5 V LDO rated for 1 A' } as AnalyzedLine['brief'],
      }),
    )
    expect(alternatesFor(part)).toEqual([{ mpn: 'L7805CV', approved: true }])
  })

  it('caps the list so one line cannot fan out into dozens of lookups', () => {
    const part = catalogPart(analyzed({ aml_candidates: Array.from({ length: 12 }, (_, i) => `ALT-${i}0K`) }))
    expect(alternatesFor(part)).toHaveLength(5)
  })

  it('handles a part that is not on any board', () => {
    expect(alternatesFor(undefined)).toEqual([])
  })
})

describe('runRequest', () => {
  it('clamps quantities to what the gateway accepts and attaches alternates by key', () => {
    const items = [
      cartLineFrom({ mpn: 'LM7805CT', manufacturer: 'TI' }, 5),
      { ...cartLineFrom({ mpn: 'BIG' }, 1), quantity: 5_000_000 },
      { ...cartLineFrom({ mpn: 'ZERO' }, 1), quantity: 0 },
      { ...cartLineFrom({ mpn: 'FRACTION' }, 1), quantity: 2.6 },
    ]
    const request = runRequest(items, [catalogPart(analyzed({ mpn: 'lm7805ct', aml_candidates: ['L7805CV'] }))])
    expect(request.lines).toEqual([
      { mpn: 'LM7805CT', quantity: 5, manufacturer: 'TI', alternates: [{ mpn: 'L7805CV', approved: true }] },
      { mpn: 'BIG', quantity: MAX_RUN_QUANTITY },
      { mpn: 'ZERO', quantity: 1 },
      { mpn: 'FRACTION', quantity: 3 },
    ])
  })

  it('sends a size and description when the cart line has them', () => {
    const items = [cartLineFrom({ mpn: 'RC0402', description: '10k 1%', fit: '0402' }, 10)]
    expect(runRequest(items, []).lines).toEqual([
      { mpn: 'RC0402', quantity: 10, description: '10k 1%', fit: '0402' },
    ])
  })
})

describe('planMatchesCart', () => {
  const sourced = plan([
    planLine({ mpn: 'A1', requested: 10, buy: buy({ mpn: 'A1', quantity: 25 }) }),
    planLine({ mpn: 'B2', requested: 3, status: 'out_of_stock', buy: null, alternate: alternate({ mpn: 'B2-ALT' }) }),
  ])

  it('matches the cart it was sourced for, in any order and case', () => {
    expect(planMatchesCart(sourced, cart(['b2', 3], ['a1', 10]))).toBe(true)
  })

  it('stops matching when the package changes, so the old check is not reused', () => {
    const checked = plan([planLine({ mpn: 'A1', requested: 10, fit: '0402' })])
    const [line] = cart(['A1', 10])
    expect(planMatchesCart(checked, [{ ...line, fit: '0402' }])).toBe(true)
    expect(planMatchesCart(checked, [{ ...line, fit: '0603' }])).toBe(false)
  })

  it('still matches after the plan was applied', () => {
    expect(planMatchesCart(sourced, cart(['A1', 25], ['B2-ALT', 10]))).toBe(true)
  })

  it('goes stale when a quantity, line, or swap changes', () => {
    expect(planMatchesCart(sourced, cart(['A1', 11], ['B2', 3]))).toBe(false)
    expect(planMatchesCart(sourced, cart(['A1', 10]))).toBe(false)
    expect(planMatchesCart(sourced, cart(['A1', 10], ['B2', 3], ['C3', 1]))).toBe(false)
    expect(planMatchesCart(sourced, cart(['A1', 10], ['B2-ALT', 11]))).toBe(false)
    expect(planMatchesCart(sourced, cart(['A1', 10], ['B2', 3], ['B2-ALT', 10]))).toBe(false)
  })

  it('treats quantities past the gateway cap as the cap', () => {
    const big = plan([planLine({ mpn: 'A1', requested: MAX_RUN_QUANTITY })])
    expect(planMatchesCart(big, [{ ...cartLineFrom({ mpn: 'A1' }, 1), quantity: 2_000_000 }])).toBe(true)
  })

  it('accepts two lines swapped for the same alternate', () => {
    const shared = plan([
      planLine({ mpn: 'A1', status: 'not_found', buy: null, alternate: alternate({ mpn: 'X9' }) }),
      planLine({ mpn: 'B2', status: 'not_found', buy: null, alternate: alternate({ mpn: 'X9' }) }),
    ])
    expect(planMatchesCart(shared, cart(['X9', 20]))).toBe(true)
    expect(planMatchesCart(shared, cart(['X9', 10]))).toBe(false)
    expect(planMatchesCart(shared, cart(['X9', 10], ['B2', 10]))).toBe(true)
  })

  it('an empty plan only matches an empty cart', () => {
    expect(planMatchesCart(plan([]), [])).toBe(true)
    expect(planMatchesCart(plan([]), cart(['A1', 1]))).toBe(false)
  })
})

describe('applyPlan', () => {
  it('raises ready lines to the planned buy and leaves short lines at what was asked', () => {
    const sourced = plan([
      planLine({ mpn: 'A1', requested: 10, buy: buy({ mpn: 'A1', quantity: 100 }) }),
      planLine({ mpn: 'S1', requested: 50, status: 'short', buy: buy({ mpn: 'S1', quantity: 20 }) }),
      planLine({ mpn: 'N1', requested: 5, status: 'not_found', buy: null }),
    ])
    const result = applyPlan(cart(['A1', 10], ['S1', 50], ['N1', 5]), sourced, new Set())
    expect(result.cart.map((line) => [line.mpn, line.quantity])).toEqual([
      ['A1', 100],
      ['S1', 50],
      ['N1', 5],
    ])
    expect(result).toMatchObject({ raised: 1, swapped: 0 })
  })

  it('never lowers a quantity the buyer raised on purpose', () => {
    const sourced = plan([planLine({ mpn: 'A1', requested: 10, buy: buy({ mpn: 'A1', quantity: 25 }) })])
    const result = applyPlan(cart(['A1', 40]), sourced, new Set())
    expect(result.cart[0].quantity).toBe(40)
    expect(result.raised).toBe(0)
  })

  it('swaps only accepted alternates and carries their details', () => {
    const sourced = plan([
      planLine({
        mpn: 'B2',
        requested: 3,
        status: 'out_of_stock',
        buy: null,
        alternate: alternate({ mpn: 'B2-ALT', manufacturer: 'ST', description: '5V LDO' }),
      }),
      planLine({ mpn: 'C3', status: 'out_of_stock', buy: null, alternate: alternate({ mpn: 'C3-ALT' }) }),
    ])
    const result = applyPlan(cart(['B2', 3], ['C3', 10]), sourced, new Set(['B2']))
    expect(result.cart).toEqual([
      { key: 'C3', mpn: 'C3', manufacturer: null, description: null, fit: null, quantity: 10 },
      { key: 'B2-ALT', mpn: 'B2-ALT', manufacturer: 'ST', description: '5V LDO', fit: null, quantity: 10 },
    ])
    expect(result.swapped).toBe(1)
    expect(planMatchesCart(sourced, result.cart)).toBe(true)
  })

  it('merges two lines swapped for the same part and the plan still matches', () => {
    const sourced = plan([
      planLine({ mpn: 'A1', status: 'not_found', buy: null, alternate: alternate({ mpn: 'X9' }) }),
      planLine({ mpn: 'B2', status: 'not_found', buy: null, alternate: alternate({ mpn: 'X9' }) }),
    ])
    const result = applyPlan(cart(['A1', 10], ['B2', 10]), sourced, new Set(['A1', 'B2']))
    expect(result.cart.map((line) => [line.key, line.quantity])).toEqual([['X9', 20]])
    expect(planMatchesCart(sourced, result.cart)).toBe(true)
  })

  it('is idempotent: applying twice changes nothing the second time', () => {
    const sourced = plan([
      planLine({ mpn: 'A1', requested: 10, buy: buy({ mpn: 'A1', quantity: 100 }) }),
      planLine({ mpn: 'B2', status: 'out_of_stock', buy: null, alternate: alternate({ mpn: 'B2-ALT' }) }),
    ])
    const swaps = new Set(['B2'])
    const once = applyPlan(cart(['A1', 10], ['B2', 10]), sourced, swaps)
    const twice = applyPlan(once.cart, sourced, swaps)
    expect(twice.cart).toEqual(once.cart)
    expect(twice).toMatchObject({ raised: 0, swapped: 0 })
    expect(pendingChanges(once.cart, sourced, swaps)).toEqual({ raise: 0, swap: 0 })
  })

  it('leaves cart lines the plan never saw alone', () => {
    const sourced = plan([planLine({ mpn: 'A1', buy: buy({ mpn: 'A1', quantity: 100 }) })])
    const result = applyPlan(cart(['A1', 10], ['NEW', 2]), sourced, new Set())
    expect(result.cart.find((line) => line.key === 'NEW')?.quantity).toBe(2)
  })
})

describe('swappedInCart and pendingChanges', () => {
  const sourced = plan([
    planLine({ mpn: 'A1', requested: 10, buy: buy({ mpn: 'A1', quantity: 100 }) }),
    planLine({ mpn: 'B2', status: 'out_of_stock', buy: null, alternate: alternate({ mpn: 'B2-ALT' }) }),
  ])

  it('counts what Apply would still change', () => {
    expect(pendingChanges(cart(['A1', 10], ['B2', 10]), sourced, new Set())).toEqual({ raise: 1, swap: 0 })
    expect(pendingChanges(cart(['A1', 10], ['B2', 10]), sourced, new Set(['B2']))).toEqual({ raise: 1, swap: 1 })
  })

  it('recognises swaps that are already in the cart', () => {
    expect([...swappedInCart(cart(['A1', 100], ['B2-ALT', 10]), sourced)]).toEqual(['B2'])
    expect(swappedInCart(cart(['A1', 100], ['B2', 10]), sourced).size).toBe(0)
  })
})

describe('totals', () => {
  const sourced = plan(
    [
      planLine({ mpn: 'A1', buy: buy({ mpn: 'A1', total: 10 }) }),
      planLine({
        mpn: 'B2',
        buy: buy({ mpn: 'B2', total: 30 }),
        alternate: alternate({ mpn: 'B2-ALT', reason: 'cheaper', saves: 12, buy: buy({ mpn: 'B2-ALT', total: 18 }) }),
      }),
      planLine({ mpn: 'C3', status: 'not_found', buy: null }),
    ],
    { saved: 2.5 },
  )

  it('prices accepted swaps in place of the original', () => {
    expect(plannedTotal(sourced, new Set())).toBe(40)
    expect(plannedTotal(sourced, new Set(['B2']))).toBe(28)
  })

  it('adds swap savings only once the swap is accepted', () => {
    expect(plannedSavings(sourced, new Set())).toBe(2.5)
    expect(plannedSavings(sourced, new Set(['B2']))).toBe(14.5)
  })

  it('never reports negative savings', () => {
    expect(plannedSavings(plan([], { saved: -0.01 }), new Set())).toBe(0)
  })
})

describe('cartPlanView', () => {
  it('describes each cart line, including swapped-in parts', () => {
    const sourced = plan([
      planLine({ mpn: 'A1', status: 'short', buy: buy({ mpn: 'A1', quantity: 4 }) }),
      planLine({ mpn: 'B2', status: 'out_of_stock', buy: null, alternate: alternate({ mpn: 'B2-ALT' }) }),
    ])
    const view = cartPlanView(sourced, new Set(['B2']))
    expect(view.get('A1')).toMatchObject({ label: 'Short', tone: 'warn' })
    expect(view.get('B2-ALT')).toMatchObject({ label: 'Swap for B2', tone: 'good', buy: { quantity: 10 } })
  })

  it('adds up two lines swapped for the same part', () => {
    const sourced = plan([
      planLine({ mpn: 'A1', status: 'not_found', buy: null, alternate: alternate({ mpn: 'X9' }) }),
      planLine({ mpn: 'B2', status: 'not_found', buy: null, alternate: alternate({ mpn: 'X9' }) }),
    ])
    expect(cartPlanView(sourced, new Set(['A1', 'B2'])).get('X9')?.buy).toMatchObject({ quantity: 20, total: 8 })
  })
})

describe('noteText', () => {
  it('hides savings too small to matter', () => {
    expect(noteText({ kind: 'price_break', from: 10, to: 25, saves: 0.004 }, 'USD')).toBeNull()
    expect(noteText({ kind: 'price_break', from: 10, to: 25, saves: 0.005 }, 'USD')?.text).toContain('saves $0.005')
    expect(noteText({ kind: 'compared_sources', sources: 2, saves: 0 }, 'USD')).toEqual({
      text: 'Compared 2 sources',
      tone: 'muted',
    })
    expect(noteText({ kind: 'compared_sources', sources: 1, saves: 3 }, 'USD')).toBeNull()
  })

  it('reads shortfalls, lead times, and lifecycle the way a buyer would', () => {
    expect(noteText({ kind: 'shortfall', available: 0, missing: 40 }, 'USD')).toEqual({
      text: 'None available, 40 short',
      tone: 'bad',
    })
    expect(noteText({ kind: 'shortfall', available: 1200, missing: 300 }, 'USD')?.text).toBe(
      'Only 1,200 available, 300 short',
    )
    expect(noteText({ kind: 'lead_time', days: 1 }, 'USD')?.text).toBe('Factory lead time about 1 day')
    expect(noteText({ kind: 'lead_time', days: 84 }, 'USD')?.text).toBe('Factory lead time about 12 weeks')
    expect(noteText({ kind: 'lead_time', days: 0 }, 'USD')).toBeNull()
    expect(noteText({ kind: 'lifecycle', status: 'active' }, 'USD')).toBeNull()
    expect(noteText({ kind: 'lifecycle', status: 'obsolete' }, 'USD')?.tone).toBe('warn')
    expect(noteText({ kind: 'does_not_fit', asked: '0402', listed: '0603 (1608 Metric)' }, 'USD')).toEqual({
      text: 'Listed as 0603 (1608 Metric). You asked for 0402.',
      tone: 'warn',
    })
    expect(noteText({ kind: 'no_fit', asked: '0402' }, 'USD')?.text).toBe('Nothing else fits 0402.')
    expect(noteText({ kind: 'package_unpublished', asked: 'SOT-23-5' }, 'USD')?.text).toBe(
      'No package was published for this part, so it wasn’t marked available for SOT-23-5.',
    )
  })

  it('never names a distributor', () => {
    const notes = [
      noteText({ kind: 'split', sources: 2 }, 'USD'),
      noteText({ kind: 'partial_check' }, 'USD'),
      noteText({ kind: 'lifecycle', status: 'not_carried' }, 'USD'),
      noteText({ kind: 'compared_sources', sources: 3, saves: 1 }, 'USD'),
    ]
    for (const note of notes) expect(note?.text).not.toMatch(/digi-?key|mouser/i)
  })

  it('ignores note kinds it does not know', () => {
    expect(noteText({ kind: 'from_the_future' } as never, 'USD')).toBeNull()
  })
})

describe('status copy', () => {
  it('gives every status a label and a place in the order', () => {
    expect(new Set(STATUS_ORDER).size).toBe(Object.keys(STATUS_META).length)
    expect(STATUS_ORDER.at(-1)).toBe('ready')
  })

  it('tells the buyer what to do about lines it cannot buy', () => {
    expect(statusHint(planLine({ status: 'ambiguous' }))).toMatch(/full part number/)
    expect(statusHint(planLine({ status: 'no_price' }))).toMatch(/quote/)
    expect(statusHint(planLine({ status: 'out_of_stock', alternate: alternate() }))).toBeNull()
    expect(statusHint(planLine({ status: 'out_of_stock' }))).toMatch(/Nothing on hand/)
    expect(
      statusHint(planLine({ status: 'out_of_stock', notes: [{ kind: 'shortfall', available: 0, missing: 5 }] })),
    ).toBeNull()
    expect(statusHint(planLine({ status: 'ready' }))).toBeNull()
  })

  it('explains swaps by reason and where the alternate came from', () => {
    const line = planLine({ mpn: 'B2', status: 'not_found', buy: null })
    expect(swapText(alternate({ mpn: 'X9' }), line, 'USD')).toBe(
      'B2 can’t be found. X9 (on your AML) is in stock: 10 for $4.00',
    )
    expect(swapText(alternate({ mpn: 'X9', reason: 'cheaper', saves: 1.5, approved: false }), line, 'USD')).toBe(
      'X9 (suggested in the line brief) covers it: 10 for $4.00, saves $1.50',
    )
    expect(
      swapText(alternate({ mpn: 'X9', approved: false, discovered: true, case_label: '0402 (1005 Metric)' }), line, 'USD'),
    ).toBe(
      'B2 can’t be found. X9 (matches the package) is in stock: 10 for $4.00. 0402 (1005 Metric), same package you asked for',
    )
  })
})

describe('sortLines and coverage', () => {
  const sourced = plan([
    planLine({ mpn: 'READY-SMALL', buy: buy({ total: 1 }) }),
    planLine({ mpn: 'READY-BIG', buy: buy({ total: 100 }) }),
    planLine({ mpn: 'GONE', status: 'out_of_stock', buy: null }),
    planLine({ mpn: 'GONE-SWAP', status: 'out_of_stock', buy: null, alternate: alternate({ mpn: 'X1' }) }),
    planLine({ mpn: 'WHICH', status: 'ambiguous', buy: null }),
  ])

  it('puts problems first, swaps before dead ends, then the biggest spend', () => {
    expect(sortLines(sourced.lines).map((line) => line.mpn)).toEqual([
      'GONE-SWAP',
      'GONE',
      'WHICH',
      'READY-BIG',
      'READY-SMALL',
    ])
  })

  it('splits the bar by status and skips empty segments', () => {
    expect(coverage(sourced)).toEqual([
      { status: 'ready', count: 2, share: 0.4 },
      { status: 'ambiguous', count: 1, share: 0.2 },
      { status: 'out_of_stock', count: 2, share: 0.4 },
    ])
    expect(coverage(plan([]))).toEqual([])
    expect(needsAttention(sourced)).toBe(3)
  })
})

describe('planCsv', () => {
  it('neutralises spreadsheet formulas and escapes quotes, commas, and newlines', () => {
    const csv = planCsv(
      plan([
        planLine({
          mpn: '=HYPERLINK("http://evil")',
          description: 'Cap, 10uF\n"X7R"',
          manufacturer: '+cmd',
          buy: buy({ mpn: '=HYPERLINK("http://evil")' }),
        }),
        planLine({ mpn: '-1', manufacturer: '@SUM(A1)', buy: buy({ mpn: '-1' }) }),
      ]),
      new Set(),
    )
    const rows = csv.split('\r\n')
    expect(rows[0]).toBe(
      'Part number,Manufacturer,Description,Needed,Buy,Packaging,Unit price,Line total,Currency,Status,Notes',
    )
    expect(rows[1]).toBe(`"'=HYPERLINK(""http://evil"")",'+cmd,"Cap, 10uF\n""X7R""",10,10,,0.50000,5.00,USD,Ready,`)
    expect(rows[2].startsWith(`'-1,'@SUM(A1),`)).toBe(true)
    expect(rows).toHaveLength(3)
  })

  it('writes the swapped part and keeps lines it could not buy', () => {
    const csv = planCsv(
      plan([
        planLine({ mpn: 'B2', status: 'out_of_stock', buy: null, alternate: alternate({ mpn: 'B2-ALT' }) }),
        planLine({ mpn: 'N1', status: 'not_found', buy: null }),
      ]),
      new Set(['B2']),
    )
    const [, swapped, missing] = csv.split('\r\n')
    expect(swapped).toBe('B2-ALT,,,10,10,,0.40000,4.00,USD,Ready (swap),Swapped in for B2')
    expect(missing.startsWith('N1,,,10,,,,,,Not found,"No source lists')).toBe(true)
  })
})

describe('normalizePlan', () => {
  it('recomputes counts instead of trusting the payload', () => {
    const normalized = normalizePlan({
      currency: 'USD',
      total: 5,
      saved: 0,
      counts: { ready: 99 },
      sources_checked: 1,
      lines: [planLine(), planLine({ mpn: 'B', status: 'short', alternate: alternate() })],
    })!
    expect(normalized.counts).toMatchObject({ ready: 1, short: 1, swaps: 1, not_found: 0 })
  })

  it('reads unknown statuses as not checked and drops unknown or malformed notes', () => {
    const normalized = normalizePlan({
      currency: 'usd',
      total: 'lots',
      saved: null,
      lines: [
        {
          mpn: 'A1',
          requested: 4,
          status: 'teleported',
          notes: [
            { kind: 'price_break', from: 1, to: 10 },
            { kind: 'lifecycle', status: 'zombie' },
            { kind: 'shortfall', available: 2, missing: 3 },
            { kind: 'toString' },
            null,
          ],
        },
      ],
    })!
    expect(normalized.currency).toBe('USD')
    expect(normalized.total).toBe(0)
    expect(normalized.lines[0].status).toBe('unchecked')
    expect(normalized.lines[0].notes).toEqual([{ kind: 'shortfall', available: 2, missing: 3 }])
  })

  it('keeps size notes and drops one that does not name a package', () => {
    const normalized = normalizePlan({
      currency: 'USD',
      lines: [
        {
          mpn: 'RC0402',
          requested: 10,
          status: 'ready',
          case_label: '0603 (1608 Metric)',
          notes: [
            { kind: 'does_not_fit', asked: '0402', listed: '0603 (1608 Metric)' },
            { kind: 'no_fit', asked: '0402' },
            { kind: 'does_not_fit', asked: '' },
          ],
        },
      ],
    })!
    expect(normalized.lines[0].case_label).toBe('0603 (1608 Metric)')
    expect(normalized.lines[0].notes).toEqual([
      { kind: 'does_not_fit', asked: '0402', listed: '0603 (1608 Metric)' },
      { kind: 'no_fit', asked: '0402' },
    ])
  })

  it('drops lines without a part number and duplicate part numbers', () => {
    const normalized = normalizePlan({
      currency: 'USD',
      lines: [planLine({ mpn: 'A1' }), planLine({ mpn: ' a1 ' }), { mpn: '' }, { requested: 3 }, 'junk', null],
    })!
    expect(normalized.lines.map((line) => line.mpn)).toEqual(['A1'])
  })

  it('drops an alternate it cannot buy and nulls non-finite prices', () => {
    const normalized = normalizePlan({
      currency: 'USD',
      lines: [
        planLine({
          buy: { ...buy(), unit_price: null as never, total: Number.NaN },
          alternate: { ...alternate(), buy: { ...buy(), quantity: 0 } },
        }),
      ],
    })!
    expect(normalized.lines[0].buy).toMatchObject({ unit_price: 0, total: 0 })
    expect(normalized.lines[0].alternate).toBeNull()
  })

  it('rejects things that are not plans', () => {
    for (const value of [null, undefined, 'plan', 42, [], { lines: 'nope' }]) expect(normalizePlan(value)).toBeNull()
  })
})

describe('parseStoredPlan', () => {
  const now = 1_800_000_000_000
  const run = { id: 'run-1', status: 'done', progress: { stage: 'finishing', done: 1, total: 1 }, plan: plan([planLine()]) }

  it('restores a finished plan with its swaps', () => {
    const stored = parseStoredPlan(
      JSON.stringify({ runId: null, run, swaps: ['A1', 7], finishedAt: now - 1000, savedAt: now }),
      now,
    )
    expect(stored).toMatchObject({ runId: null, swaps: ['A1'], finishedAt: now - 1000 })
    expect(stored?.run?.plan?.lines).toHaveLength(1)
  })

  it('resumes a recent run but forgets one the gateway has already dropped', () => {
    expect(parseStoredPlan(JSON.stringify({ runId: 'r', run: null, swaps: [], savedAt: now - 60_000 }), now)?.runId).toBe(
      'r',
    )
    expect(parseStoredPlan(JSON.stringify({ runId: 'r', run: null, swaps: [], savedAt: now - 31 * 60_000 }), now)).toBeNull()
    expect(
      parseStoredPlan(JSON.stringify({ runId: 'r', run, swaps: [], savedAt: now - 31 * 60_000 }), now),
    ).toMatchObject({ runId: null })
  })

  it('expires plans after a week', () => {
    expect(parseStoredPlan(JSON.stringify({ runId: null, run, swaps: [], savedAt: now - 8 * 86_400_000 }), now)).toBeNull()
  })

  it('survives corrupt or hostile storage', () => {
    for (const raw of [
      null,
      '',
      '{',
      'null',
      '"string"',
      '[]',
      JSON.stringify({ savedAt: 'yesterday', run }),
      JSON.stringify({ savedAt: now, run: { ...run, status: 'running' } }),
      JSON.stringify({ savedAt: now, run: { ...run, plan: { lines: 'x' } } }),
      JSON.stringify({ savedAt: now, runId: '', run: null }),
    ]) {
      expect(parseStoredPlan(raw, now)).toBeNull()
    }
  })
})

describe('finishedRun', () => {
  it('only accepts done runs with a plan', () => {
    expect(finishedRun({ id: 'x', status: 'done', plan: plan([]) })?.plan?.lines).toEqual([])
    expect(finishedRun({ id: 'x', status: 'done' })).toBeNull()
    expect(finishedRun({ id: 'x', status: 'failed', plan: plan([]) })).toBeNull()
    expect(finishedRun({ status: 'done', plan: plan([]) })).toBeNull()
  })
})
