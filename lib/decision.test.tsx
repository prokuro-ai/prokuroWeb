import { describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach } from 'vitest'
import LineDetail from '@/components/app/LineDetail'
import {
  analystBrief,
  buildLineDecision,
  decisionHeadline,
  isBriefPending,
  thisWeekNextAction,
  whyThisScore,
} from '@/lib/decision'
import type { AnalyzedLine } from '@/lib/types'

const base: AnalyzedLine = {
  row_index: 1,
  mpn: 'TPS62840DLCR',
  manufacturer: 'Texas Instruments',
  quantity: 100,
  refdes: 'U12',
  description: 'Buck converter',
  aml_candidates: [],
  availability_status: 'instock',
  lifecycle_status: 'active',
  match_status: 'exact',
  factory_lead_days: 56,
  total_avail: 12000,
  risk_level: 'green',
}

describe('buildLineDecision', () => {
  it('recommends AML alternate and last-time-buy style action for EOL', () => {
    const decision = buildLineDecision({
      ...base,
      lifecycle_status: 'eol',
      risk_level: 'red',
      aml_candidates: ['TPS62840DLCT'],
    })
    expect(decision.recommendedAlternate).toBe('TPS62840DLCT')
    expect(decision.nextAction).toContain('TPS62840DLCT')
    expect(decision.whyScore.toLowerCase()).toContain('eol')
  })

  it('flags long lead time in why score and next action', () => {
    const decision = buildLineDecision({
      ...base,
      factory_lead_days: 280,
      risk_level: 'yellow',
    })
    expect(decision.whyScore).toMatch(/40 weeks/)
    expect(decision.nextAction.toLowerCase()).toMatch(/dual-source|pull demand/)
  })

  it('explains pending enrichment honestly', () => {
    const decision = buildLineDecision({
      ...base,
      risk_level: 'unknown',
      availability_status: 'pending',
      match_status: 'pending',
    })
    expect(decision.summary.toLowerCase()).toContain('resolving')
    expect(decision.nextAction.toLowerCase()).toContain('enrichment')
  })

  it('keeps the short local summary when an analyst brief is present', () => {
    const decision = buildLineDecision({
      ...base,
      risk_level: 'red',
      availability_status: 'outofstock',
      agent_brief: 'Nova: this MPN is OOS and needs a second source this week.',
    })
    expect(decision.summary).not.toContain('Nova:')
    expect(decision.summary.toLowerCase()).toContain('critical')
    expect(analystBrief({ ...base, agent_brief: '  Nova: brief  ' })).toBe('Nova: brief')
  })
})

describe('decisionHeadline', () => {
  it('uses the structured headline when present', () => {
    expect(
      decisionHeadline({
        ...base,
        agent_brief: 'Qualify the alternate. Stock will not cover the run.',
        brief: {
          headline: 'Place a last-time buy.',
          why: 'Lifecycle is EOL.',
        },
      }),
    ).toBe('Place a last-time buy.')
  })

  it('uses the first sentence of old free-text when there is no headline', () => {
    expect(
      decisionHeadline({
        ...base,
        agent_brief: 'Qualify the alternate. Stock will not cover the run.',
      }),
    ).toBe('Qualify the alternate.')
  })

  it('composes from lifecycle when there is no brief', () => {
    expect(
      decisionHeadline({
        ...base,
        lifecycle_status: 'eol',
        risk_level: 'red',
      }),
    ).toMatch(/obsolete/i)
  })

  it('does not invent a headline when a flagged line has no brief', () => {
    const line: AnalyzedLine = {
      ...base,
      availability_status: 'outofstock',
      total_avail: 0,
      risk_level: 'yellow',
    }
    expect(isBriefPending(line)).toBe(true)
    expect(decisionHeadline(line)).toBe("Can't buy this from tracked distributors.")
  })

  it('calls out lead past 26 weeks, the same cut the dashboard counts', () => {
    expect(decisionHeadline({ ...base, factory_lead_days: 196, risk_level: 'yellow' })).toBe(
      'Factory lead is about 28 weeks.',
    )
  })

  it('falls back to the scorer reason, then a plain sentence', () => {
    expect(decisionHeadline({ ...base, risk_level: 'yellow', risk_reasons: ['Single source at tracked distributors'] })).toBe(
      'Single source at tracked distributors.',
    )
    expect(decisionHeadline({ ...base, risk_level: 'yellow' })).toBe('Flagged for review before the next order.')
  })
})

describe('whyThisScore', () => {
  it('prefers risk reasons over a conflicting heuristic why', () => {
    expect(
      whyThisScore({
        ...base,
        availability_status: 'outofstock',
        total_avail: 0,
        risk_level: 'yellow',
        risk_reasons: ['Out of stock at tracked distributors'],
      }),
    ).toBe('Out of stock at tracked distributors')
  })

  it('keeps old free-text readable when there is no structured brief', () => {
    expect(
      whyThisScore({
        ...base,
        risk_level: 'yellow',
        availability_status: 'outofstock',
        agent_brief: 'Stock is gone at Digi-Key and Mouser.',
      }),
    ).toBe('Stock is gone at Digi-Key and Mouser.')
  })

  it('says the brief is pending when flagged with no brief yet', () => {
    const line: AnalyzedLine = {
      ...base,
      availability_status: 'outofstock',
      total_avail: 0,
      risk_level: 'yellow',
    }
    expect(whyThisScore(line)).toMatch(/being written/i)
    expect(thisWeekNextAction(line)).toMatch(/being written/i)
  })
})

afterEach(() => {
  cleanup()
})

describe('LineDetail', () => {
  it('renders structured brief sections instead of the raw paragraph', () => {
    render(
      <LineDetail
        line={{
          ...base,
          availability_status: 'outofstock',
          total_avail: 0,
          risk_level: 'yellow',
          agent_brief: 'Qualify the alternate. Stock will not cover the run.',
          brief: {
            headline: 'Qualify a second source.',
            why: 'Stock is out at tracked distributors.',
            next_action: 'Place a bridge buy this week.',
            alternate: 'TPS62840DLCT',
            cost_note: 'No duty on this line.',
          },
          risk_reasons: ['Out of stock at tracked distributors'],
        }}
      />,
    )
    expect(screen.getByText('Out of stock at tracked distributors')).toBeTruthy()
    expect(screen.getByText('Place a bridge buy this week.')).toBeTruthy()
    expect(screen.getByText('No duty on this line.')).toBeTruthy()
    expect(screen.getByText(/TPS62840DLCT/)).toBeTruthy()
    expect(screen.queryByText('Qualify the alternate. Stock will not cover the run.')).toBeNull()
  })

  it('shows pending copy when a flagged line has no brief', () => {
    render(
      <LineDetail
        line={{
          ...base,
          availability_status: 'outofstock',
          total_avail: 0,
          risk_level: 'yellow',
        }}
      />,
    )
    expect(screen.getAllByText(/being written/i).length).toBeGreaterThan(0)
  })
})
