import { describe, expect, it } from 'vitest'
import { lineNeedsSubstituteLookup, lineSubstitutes, substitutesByMpn } from '@/lib/lineSubstitute'
import type { AnalyzedLine, SourcingPlan } from '@/lib/types'

const line = (overrides: Partial<AnalyzedLine> = {}): AnalyzedLine => ({
  row_index: 0,
  mpn: '0603YC105KAT2A',
  manufacturer: 'KYOCERA AVX',
  quantity: 100,
  refdes: 'C1',
  description: '1uF',
  aml_candidates: [],
  availability_status: 'outofstock',
  lifecycle_status: 'active',
  match_status: 'exact',
  factory_lead_days: 126,
  total_avail: 0,
  risk_level: 'yellow',
  ...overrides,
})

describe('lineSubstitutes', () => {
  it('offers an AML part and a brief part number, and skips advice that is not a part', () => {
    expect(
      lineSubstitutes(
        line({
          aml_candidates: ['06035C105KAT2A'],
          brief: { headline: 'Stock is out.', alternate: 'No alternate candidates available.' },
        }),
      ),
    ).toEqual([{ mpn: '06035C105KAT2A', approved: true }])

    expect(
      lineSubstitutes(line({ brief: { headline: 'Stock is out.', alternate: '0603YC105JAT2A' } })),
    ).toEqual([{ mpn: '0603YC105JAT2A', approved: false }])
  })

  it('does not offer the part already on the line', () => {
    expect(lineSubstitutes(line({ aml_candidates: ['0603YC105KAT2A', '0603yc105kat2a'] }))).toEqual([])
  })
})

describe('lineNeedsSubstituteLookup', () => {
  it('looks up an out-of-stock or end-of-life part, and skips one that can be bought', () => {
    expect(lineNeedsSubstituteLookup(line())).toBe(true)
    expect(
      lineNeedsSubstituteLookup(line({ availability_status: 'instock', lifecycle_status: 'eol', total_avail: 100 })),
    ).toBe(true)
    expect(
      lineNeedsSubstituteLookup(
        line({ availability_status: 'instock', lifecycle_status: 'active', total_avail: 4000 }),
      ),
    ).toBe(false)
    expect(lineNeedsSubstituteLookup(line({ availability_status: 'pending', match_status: 'pending', risk_level: 'unknown' }))).toBe(
      false,
    )
  })
})

describe('substitutesByMpn', () => {
  it('reads the alternate off a stored sourcing plan', () => {
    const plan: SourcingPlan = {
      currency: 'USD',
      total: 1,
      saved: 0,
      counts: { ready: 0, short: 0, out_of_stock: 1, no_price: 0, not_found: 0, ambiguous: 0, unchecked: 0, invalid: 0, does_not_fit: 0, swaps: 1 },
      sources_checked: 1,
      lines: [
        {
          mpn: '0603YC105KAT2A',
          requested: 100,
          status: 'out_of_stock',
          notes: [],
          alternate: {
            mpn: '06035C105KAT2A',
            approved: false,
            reason: 'replaces_unavailable',
            buy: { mpn: '06035C105KAT2A', quantity: 100, unit_price: 0.2, total: 20, in_stock: 1000, sources: 1 },
            discovered: true,
            description: 'CAP CER 1UF 50V X7R 0603',
          },
        },
      ],
    }
    const raw = JSON.stringify({
      runId: 'run-1',
      run: { id: 'run-1', status: 'done', progress: { stage: 'finishing', done: 1, total: 1 }, plan },
      swaps: [],
      savedAt: Date.now(),
    })
    expect(substitutesByMpn(raw).get('0603YC105KAT2A')).toEqual([
      {
        mpn: '06035C105KAT2A',
        approved: false,
        detail: 'CAP CER 1UF 50V X7R 0603',
      },
    ])
  })
})
