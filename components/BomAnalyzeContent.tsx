'use client'

import { anyTariffStale, hasTariffData, riskReason, tariffDisclaimer } from '@/lib/risk'
import type { AnalyzeResult } from '@/lib/types'
import { AnalyzeTable } from '@/components/BomTable'
import RiskBadge from '@/components/RiskBadge'
import { AnalyzeSummaryCards } from '@/components/SummaryCards'

type BomAnalyzeContentProps = {
  result: AnalyzeResult
}

export default function BomAnalyzeContent({ result }: BomAnalyzeContentProps) {
  const showTariff = hasTariffData(result.lines)
  const disclaimer = tariffDisclaimer(result.lines)
  const stale = anyTariffStale(result.lines)
  const topRisks = result.top_risks ?? []

  return (
    <div className="space-y-6">
      <AnalyzeEnrichmentStatusBanner result={result} />

      {stale && (
        <WarningBanner warnings={['Tariff data is due for review — figures may not reflect current rates.']} />
      )}

      <AnalyzeSummaryCards result={result} />

      {topRisks.length > 0 && (
        <section>
          <SectionLabel>Top risks</SectionLabel>
          <ul className="mt-3 divide-y divide-hairline overflow-hidden rounded-xl border border-hairline bg-surface-1">
            {topRisks.map((line) => (
              <li key={`${line.row_index}-${line.mpn ?? 'unknown'}`} className="flex items-center gap-3 px-4 py-3">
                <RiskBadge level={line.risk_level ?? 'green'} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[13px] text-primary-hover">{line.mpn ?? '—'}</p>
                  <p className="mt-0.5 text-[13px] text-ink-muted">{riskReason(line)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionLabel>Components</SectionLabel>
        {showTariff && disclaimer && (
          <p className="mt-2 text-[12px] text-ink-tertiary">{disclaimer}</p>
        )}
        <div className="mt-3">
          <AnalyzeTable result={result} />
        </div>
      </section>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-eyebrow text-ink-subtle">{children}</p>
}

function WarningBanner({ warnings }: { warnings: string[] }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
      <p className="text-eyebrow mb-2 text-amber-700">Warnings</p>
      <ul className="space-y-1">
        {warnings.map((warning, i) => (
          <li key={i} className="text-[13px] text-amber-700">
            {warning}
          </li>
        ))}
      </ul>
    </div>
  )
}

function AnalyzeEnrichmentStatusBanner({ result }: { result: AnalyzeResult }) {
  const warnings = Array.isArray(result.warnings) ? result.warnings : []
  const total = result.summary.total || result.lines.length
  const noMatchRatio = total > 0 ? result.summary.no_match / total : 0
  const errorCount = result.lines.filter((line) => {
    const availability = (line.availability_status ?? '').trim().toLowerCase().replace(/[_\s-]/g, '')
    return availability === 'error'
  }).length
  const errorRatio = total > 0 ? errorCount / total : 0

  const enrichmentFailure = warnings.find((warning) => {
    if (!warning || typeof warning !== 'object') return false
    const code = 'code' in warning ? warning.code : undefined
    return typeof code === 'string' && code.toUpperCase() === 'ENRICHMENT_FAILED'
  }) as { code?: string; message?: string } | undefined

  const hasAnyStrongSignals = result.lines.some((line) => {
    const availability = (line.availability_status ?? '').trim().toLowerCase().replace(/[_\s-]/g, '')
    const lifecycle = (line.lifecycle_status ?? '').trim().toLowerCase()
    return (
      line.total_avail > 0 ||
      line.factory_lead_days != null ||
      (availability !== '' && availability !== 'nomatch' && availability !== 'error') ||
      (lifecycle !== '' && lifecycle !== 'unknown')
    )
  })

  if (enrichmentFailure) {
    return (
      <StatusPanel tone="danger" title="Enrichment is unavailable">
        {typeof enrichmentFailure.message === 'string' && enrichmentFailure.message.length > 0
          ? enrichmentFailure.message
          : 'The analyzer parsed your BOM, but enrichment failed. Full analyze values may be incomplete.'}
      </StatusPanel>
    )
  }

  if (total > 0 && (errorCount === total || errorRatio >= 0.9)) {
    return (
      <StatusPanel tone="warning" title="Component availability lookup unavailable">
        Component availability lookup unavailable — provider quota or connection issue. Parsed data and
        tariff classification are unaffected.
      </StatusPanel>
    )
  }

  if (total > 0 && result.summary.no_match === total && errorCount === 0 && !hasAnyStrongSignals) {
    return (
      <StatusPanel tone="warning" title="Enrichment returned no matched parts">
        Full analyze completed, but every line came back with no catalog match. This is a genuine miss from the parts provider, not a parser failure.
      </StatusPanel>
    )
  }

  if (total >= 10 && noMatchRatio >= 0.9 && errorRatio < 0.5) {
    return (
      <StatusPanel tone="warning" title="Enrichment looks partial">
        Most lines are unmatched ({result.summary.no_match}/{total}). Results are usable, but enrichment coverage is limited.
      </StatusPanel>
    )
  }

  return (
    <StatusPanel tone="success" title="Enrichment is active">
      Full analyze data is present for this run.
    </StatusPanel>
  )
}

function StatusPanel({
  title,
  children,
  tone,
}: {
  title: string
  children: React.ReactNode
  tone: 'success' | 'warning' | 'danger'
}) {
  const classes =
    tone === 'success'
      ? 'border-green-300 bg-green-50 text-green-800'
      : tone === 'danger'
        ? 'border-red-300 bg-red-50 text-red-800'
        : 'border-amber-300 bg-amber-50 text-amber-800'

  return (
    <div className={`rounded-lg border px-4 py-3 ${classes}`}>
      <p className="text-eyebrow mb-1">{title}</p>
      <p className="text-[13px] leading-relaxed">{children}</p>
    </div>
  )
}
