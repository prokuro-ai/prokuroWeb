'use client'

import type { AnalyzeResult, AnalyzedLine } from '@/lib/types'
import { analyzeEnrichmentStatus } from '@/lib/analyzeStatus'
import { anyTariffStale, hasTariffData, riskReason, tariffDisclaimer } from '@/lib/risk'
import RiskBadge from '@/components/RiskBadge'

export function EnrichmentStatusBanner({ result }: { result: AnalyzeResult }) {
  const status = analyzeEnrichmentStatus(result)
  if (!status) return null

  const classes =
    status.tone === 'success'
      ? 'border-green-300 bg-green-50 text-green-800'
      : status.tone === 'danger'
        ? 'border-red-300 bg-red-50 text-red-800'
        : 'border-amber-300 bg-amber-50 text-amber-800'

  return (
    <div className={`rounded-lg border px-4 py-3 ${classes}`}>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide">{status.title}</p>
      <p className="text-[13px] leading-relaxed">{status.message}</p>
    </div>
  )
}

export function TopRisksPanel({ lines }: { lines: AnalyzedLine[] }) {
  if (lines.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5">
        <h2 className="text-[13px] font-semibold text-slate-900">Top risks</h2>
        <p className="mt-1 text-sm text-slate-500">No red or yellow lines were flagged in this BOM.</p>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-[13px] font-semibold text-slate-900">Top risks</h2>
      <ul className="mt-3 divide-y divide-slate-100">
        {lines.map((line) => (
          <li key={`${line.row_index}-${line.mpn ?? 'unknown'}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <RiskBadge level={line.risk_level ?? 'green'} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[13px] text-[#0062ff]">{line.mpn ?? '—'}</p>
              <p className="mt-0.5 text-[13px] text-slate-600">{riskReason(line)}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function TariffNotice({ result }: { result: AnalyzeResult }) {
  if (!hasTariffData(result.lines)) return null
  const disclaimer = tariffDisclaimer(result.lines)
  const stale = anyTariffStale(result.lines)
  if (!disclaimer && !stale) return null

  return (
    <div className="space-y-3">
      {stale && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          Tariff data may be stale — figures might not reflect current rates.
        </div>
      )}
      {disclaimer && <p className="text-[12px] text-slate-500">{disclaimer}</p>}
    </div>
  )
}

function PlaceholderPanel({ title, description }: { title: string; description: string }) {
  return (
    <section className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5">
      <h2 className="text-[13px] font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
      <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-slate-400">Coming soon</p>
    </section>
  )
}

export function BomInsightPanels({ result }: { result: AnalyzeResult }) {
  const topRisks = result.top_risks ?? []

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <TopRisksPanel lines={topRisks} />
      <PlaceholderPanel
        title="Action plan"
        description="Prioritized procurement actions based on at-risk lines will appear here."
      />
      <PlaceholderPanel
        title="Alternate parts"
        description="Network-validated drop-in alternates will appear here once alternate matching is enabled."
      />
    </div>
  )
}
