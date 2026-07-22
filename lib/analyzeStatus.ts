import type { AnalyzeResult } from '@/lib/types'

export function analyzeEnrichmentStatus(result: AnalyzeResult): {
  tone: 'success' | 'warning' | 'danger'
  title: string
  message: string
} | null {
  const warnings = Array.isArray(result.warnings) ? result.warnings : []
  const total = result.summary.total || result.lines.length

  const enrichmentFailure = warnings.find((warning) => {
    if (!warning || typeof warning !== 'object') return false
    const code = 'code' in warning ? warning.code : undefined
    return typeof code === 'string' && code.toUpperCase() === 'ENRICHMENT_FAILED'
  }) as { message?: string } | undefined

  const errorCount = result.lines.filter((line) => {
    const availability = (line.availability_status ?? '').trim().toLowerCase().replace(/[_\s-]/g, '')
    return availability === 'error'
  }).length

  const hasSignals = result.lines.some((line) => {
    const availability = (line.availability_status ?? '').trim().toLowerCase().replace(/[_\s-]/g, '')
    const lifecycle = (line.lifecycle_status ?? '').trim().toLowerCase()
    return (
      line.total_avail > 0 ||
      line.factory_lead_days != null ||
      (availability !== '' && availability !== 'nomatch' && availability !== 'error' && availability !== 'pending') ||
      (lifecycle !== '' && lifecycle !== 'unknown')
    )
  })

  if (enrichmentFailure) {
    return {
      tone: 'danger',
      title: 'Enrichment is unavailable',
      message:
        typeof enrichmentFailure.message === 'string' && enrichmentFailure.message.length > 0
          ? enrichmentFailure.message
          : 'The analyzer parsed your BOM, but enrichment failed. Availability data may be incomplete.',
    }
  }

  if (total > 0 && (errorCount === total || errorCount / total >= 0.9)) {
    return {
      tone: 'warning',
      title: 'Component availability lookup unavailable',
      message:
        'DigiKey lookup hit a quota or connection issue. Parsed data and tariff classification are unaffected.',
    }
  }

  if (total > 0 && result.summary.no_match === total && errorCount === 0 && !hasSignals) {
    return {
      tone: 'warning',
      title: 'Enrichment returned no matched parts',
      message: 'Every line came back unmatched from DigiKey. This reflects catalog coverage, not a parser failure.',
    }
  }

  const noMatchRatio = total > 0 ? result.summary.no_match / total : 0
  if (total >= 10 && noMatchRatio >= 0.9 && errorCount / total < 0.5) {
    return {
      tone: 'warning',
      title: 'Enrichment looks partial',
      message: `Most lines are unmatched (${result.summary.no_match}/${total}). Results are usable, but coverage is limited.`,
    }
  }

  return {
    tone: 'success',
    title: 'Enrichment is active',
    message: 'Analyze data is present for this BOM run.',
  }
}
