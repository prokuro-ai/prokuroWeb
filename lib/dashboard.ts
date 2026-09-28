import type { BoardTally, LeadTimes, RiskMix, Situation } from '@/lib/types'

export type Tone = 'red' | 'amber' | 'green' | 'slate' | 'pending'

export const TONE_VAR: Record<Tone, string> = {
  red: 'var(--mk-red)',
  amber: 'var(--mk-amber)',
  green: 'var(--mk-green)',
  slate: 'var(--mk-slate)',
  pending: 'var(--mk-line-strong)',
}

/** Labels match the filters on a BOM's parts table. */
export const MIX_SEGMENTS: { key: keyof RiskMix; label: string; tone: Tone }[] = [
  { key: 'red', label: 'Critical', tone: 'red' },
  { key: 'yellow', label: 'Watch', tone: 'amber' },
  { key: 'green', label: 'Clear', tone: 'green' },
  { key: 'noMatch', label: 'Unmatched', tone: 'slate' },
  { key: 'pending', label: 'Checking', tone: 'pending' },
]

export const SITUATION_COLUMNS: {
  key: keyof Situation
  label: string
  short: string
  tone: Tone
}[] = [
  { key: 'outOfStock', label: 'Out of stock', short: 'No stock', tone: 'red' },
  { key: 'discontinued', label: 'Discontinued or EOL', short: 'EOL', tone: 'red' },
  { key: 'entityList', label: 'Entity list hit', short: 'Entity', tone: 'red' },
  { key: 'longLead', label: 'Lead over 26 weeks', short: '>26 wk', tone: 'amber' },
  { key: 'nrnd', label: 'Not for new designs', short: 'NRND', tone: 'amber' },
  { key: 'noAlternate', label: 'No alternate on file', short: 'No alt', tone: 'slate' },
  { key: 'duty', label: 'Duty on the line', short: 'Duty', tone: 'slate' },
]

/** The account card groups exceptions by the kind of call they ask for. */
export const SITUATION_GROUPS: { label: string; keys: (keyof Situation)[] }[] = [
  { label: 'Supply', keys: ['outOfStock', 'longLead'] },
  { label: 'Lifecycle', keys: ['discontinued', 'nrnd'] },
  { label: 'Trade', keys: ['entityList', 'duty'] },
  { label: 'Sourcing', keys: ['noAlternate'] },
]

/** Past the 26-week line is amber, past a year is red. */
export const LEAD_BUCKETS: { key: Exclude<keyof LeadTimes, 'unpublished'>; label: string; tone: Tone }[] = [
  { key: 'upTo4Weeks', label: '0–4', tone: 'slate' },
  { key: 'upTo12Weeks', label: '5–12', tone: 'slate' },
  { key: 'upTo26Weeks', label: '13–26', tone: 'slate' },
  { key: 'upTo52Weeks', label: '27–52', tone: 'amber' },
  { key: 'over52Weeks', label: '52+', tone: 'red' },
]

export function mixTotal(mix: RiskMix): number {
  return mix.red + mix.yellow + mix.green + mix.noMatch + mix.pending
}

export function scoredTotal(mix: RiskMix): number {
  return mix.red + mix.yellow + mix.green
}

export function atRisk(mix: RiskMix): number {
  return mix.red + mix.yellow
}

/** Share of a board's lines that need a call. A board with no lines ranks last. */
export function atRiskShare(mix: RiskMix): number {
  const total = mixTotal(mix)
  return total > 0 ? atRisk(mix) / total : 0
}

export function rankBoards(boards: BoardTally[]): BoardTally[] {
  return [...boards].sort(
    (a, b) =>
      atRiskShare(b.mix) - atRiskShare(a.mix) ||
      b.mix.red - a.mix.red ||
      a.bomName.localeCompare(b.bomName),
  )
}

export function percent(part: number, whole: number): string {
  if (whole <= 0 || part <= 0) return '0%'
  const value = (part / whole) * 100
  return value < 1 ? '<1%' : `${Math.round(value)}%`
}

/** Tint for a heat cell. Never fully saturated, so dark ink stays readable. */
export function heatFill(tone: Tone, count: number, max: number): string | undefined {
  if (count <= 0 || max <= 0) return undefined
  const strength = Math.round(10 + 26 * (count / max))
  return `color-mix(in srgb, ${TONE_VAR[tone]} ${strength}%, transparent)`
}
