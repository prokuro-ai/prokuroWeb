import { describe, expect, it } from 'vitest'
import { heatFill, percent, rankBoards } from '@/lib/dashboard'
import type { BoardTally, RiskMix } from '@/lib/types'

function board(bomName: string, mix: Partial<RiskMix>): BoardTally {
  return {
    bomId: bomName,
    bomName,
    mix: { red: 0, yellow: 0, green: 0, noMatch: 0, pending: 0, ...mix },
    situation: { outOfStock: 0, longLead: 0, nrnd: 0, discontinued: 0, noAlternate: 0, duty: 0, entityList: 0 },
    lead: { upTo4Weeks: 0, upTo12Weeks: 0, upTo26Weeks: 0, upTo52Weeks: 0, over52Weeks: 0, unpublished: 0 },
  }
}

describe('rankBoards', () => {
  it('orders by share at risk, then reds, then name, with empty boards last', () => {
    const ranked = rankBoards([
      board('Empty', {}),
      board('Wide', { yellow: 10, green: 90 }),
      board('Small', { red: 1, green: 4 }),
      board('Tie-B', { yellow: 2, green: 8 }),
      board('Tie-A', { red: 2, green: 8 }),
    ])
    // Small and Tie-A are both 20% at risk; Tie-A has more reds.
    expect(ranked.map((b) => b.bomName)).toEqual(['Tie-A', 'Small', 'Tie-B', 'Wide', 'Empty'])
  })
})

describe('percent', () => {
  it('never rounds a real count down to zero', () => {
    expect(percent(1, 400)).toBe('<1%')
    expect(percent(0, 400)).toBe('0%')
    expect(percent(3, 0)).toBe('0%')
    expect(percent(15, 160)).toBe('9%')
  })
})

describe('heatFill', () => {
  it('leaves empty cells untinted and scales with the column max', () => {
    expect(heatFill('red', 0, 5)).toBeUndefined()
    expect(heatFill('red', 5, 5)).toBe('color-mix(in srgb, var(--mk-red) 36%, transparent)')
    expect(heatFill('red', 1, 5)).toBe('color-mix(in srgb, var(--mk-red) 15%, transparent)')
  })
})
