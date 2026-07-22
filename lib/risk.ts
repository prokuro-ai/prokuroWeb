import type { AnalyzedLine } from '@/lib/types'

export function hasTariffData(lines: AnalyzedLine[]): boolean {
  return lines.some(
    (line) =>
      line.hts_code != null ||
      line.tariff_confidence != null ||
      line.total_duty_pct != null ||
      line.tariff_disclaimer != null,
  )
}
