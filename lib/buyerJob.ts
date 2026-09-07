import { isPendingLine, leadTimeWeeks, lifecycleLabel, lineRiskLevel, tariffLabel } from '@/lib/risk'
import type { AnalyzedLine } from '@/lib/types'
import type { DecisionChip } from '@/components/app/DecisionRow'

export type BuyerJob = 'cant_buy' | 'obsolete' | 'tariff' | 'unmatched' | 'other'

export const BUYER_JOB_ORDER: BuyerJob[] = ['cant_buy', 'obsolete', 'tariff', 'unmatched', 'other']

export const BUYER_JOB_LABEL: Record<BuyerJob, string> = {
  cant_buy: "Can't buy",
  obsolete: 'Going obsolete',
  tariff: 'Tariff',
  unmatched: 'Unmatched',
  other: 'Needs a look',
}

export function buyerJob(line: AnalyzedLine): BuyerJob {
  const life = line.lifecycle_status?.toLowerCase() ?? ''
  const avail = line.availability_status?.toLowerCase() ?? ''
  const match = line.match_status?.toLowerCase() ?? ''

  if (match === 'none' || avail === 'nomatch') return 'unmatched'
  if (life === 'eol' || life === 'discontinued' || life === 'nrnd') return 'obsolete'
  if (avail === 'outofstock' || (line.factory_lead_days != null && line.factory_lead_days > 210)) {
    return 'cant_buy'
  }
  if (line.total_duty_pct != null && line.total_duty_pct > 0) return 'tariff'
  return 'other'
}

export function lineFactChips(line: AnalyzedLine): DecisionChip[] {
  const pending = isPendingLine(line)
  const risk = lineRiskLevel(line)
  const life = lifecycleLabel(line.lifecycle_status)
  const lifeHot = ['EOL', 'NRND'].includes(life)
  const avail = line.availability_status?.toLowerCase() ?? ''
  const weeks = leadTimeWeeks(line)
  const duty = tariffLabel(line)

  const chips: DecisionChip[] = []

  if (pending) {
    chips.push({ label: 'Status', value: 'Looking up' })
    return chips
  }

  chips.push({ label: 'Lifecycle', value: life, hot: lifeHot })

  if (avail === 'outofstock') {
    chips.push({ label: 'Stock', value: 'Out', hot: true })
  } else if (avail === 'nomatch') {
    chips.push({ label: 'Stock', value: 'No match', hot: true })
  } else if (line.total_avail > 0) {
    chips.push({
      label: 'Stock',
      value: line.total_avail.toLocaleString(),
      hot: risk === 'red' || risk === 'yellow',
    })
  }

  if (weeks != null) {
    chips.push({ label: 'Lead', value: `${weeks} wk`, hot: weeks > 30 })
  }

  if (duty !== '-') {
    chips.push({ label: 'Duty', value: duty, hot: true })
  }

  return chips
}
