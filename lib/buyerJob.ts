import type { AnalyzedLine } from '@/lib/types'

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
