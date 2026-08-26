import { describe, expect, it } from 'vitest'
import { analystBrief, buildLineDecision } from '@/lib/decision'
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
