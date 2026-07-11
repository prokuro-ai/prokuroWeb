import type { AnalyzedLine } from '@/lib/types'

function normalize(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().replace(/[_\s-]/g, '')
}

/** Client-side reason using the same priority order as gateway `score_risk`. */
export function riskReason(line: AnalyzedLine): string {
  const availability = normalize(line.availability_status)
  const lifecycle = normalize(line.lifecycle_status)

  if (availability === 'nomatch') return 'No match found'
  if (lifecycle === 'eol') return 'End of life'
  if (lifecycle === 'discontinued') return 'Discontinued'
  if (line.total_duty_pct != null && line.total_duty_pct >= 25) {
    return `${Math.round(line.total_duty_pct)}% tariff exposure`
  }

  if (availability === 'error') return 'Availability unknown — provider error'
  if (lifecycle === 'nrnd') return 'Not recommended for new designs'
  if (line.factory_lead_days != null && line.factory_lead_days > 182) return 'Long lead time'
  if (line.total_avail > 0 && line.total_avail < 100) return 'Low stock'
  const confidence = normalize(line.tariff_confidence)
  if (confidence === 'low' || confidence === 'unclassified') return 'Uncertain tariff classification'

  return 'Elevated risk'
}

export function hasTariffData(lines: AnalyzedLine[]): boolean {
  return lines.some(
    (line) =>
      line.hts_code != null ||
      line.tariff_confidence != null ||
      line.total_duty_pct != null ||
      line.tariff_disclaimer != null,
  )
}

export function tariffDisclaimer(lines: AnalyzedLine[]): string | null {
  for (const line of lines) {
    if (line.tariff_disclaimer) return line.tariff_disclaimer
  }
  return null
}

export function anyTariffStale(lines: AnalyzedLine[]): boolean {
  return lines.some((line) => line.is_stale === true)
}
