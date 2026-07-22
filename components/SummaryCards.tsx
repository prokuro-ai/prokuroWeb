import type { AnalyzeResult, AnalyzeSummary, ParseResult } from '@/lib/types'
import { ConfidenceBadge } from './StatusBadge'

interface ParseSummaryProps {
  result: ParseResult
}

interface AnalyzeSummaryProps {
  result: AnalyzeResult
}

export function ParseSummaryCards({ result }: ParseSummaryProps) {
  const { stats, mapping_confidence, warnings } = result
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <MetricCard label="Confidence" value={<ConfidenceBadge value={mapping_confidence} />} />
      <MetricCard label="Total rows" value={stats.total_rows} />
      <MetricCard label="Parsed" value={stats.parsed_rows} accent />
      <MetricCard label="Warnings" value={warnings.length} dimmed={warnings.length === 0} />
    </div>
  )
}

export function AnalyzeSummaryCards({ result }: AnalyzeSummaryProps) {
  const summary: AnalyzeSummary = result.summary
  const attention = (summary.red_count ?? 0) + (summary.yellow_count ?? 0)
  const critical = summary.red_count ?? 0
  const elevated = summary.yellow_count ?? 0
  const healthy = summary.green_count ?? 0

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-hairline bg-surface-1 px-4 py-4">
        <p className="text-eyebrow text-ink-subtle">Need attention</p>
        <p className={`mt-1.5 text-3xl font-semibold tracking-tight ${attention > 0 ? 'text-red-700' : 'text-green-700'}`}>
          {attention}
        </p>
        <p className="mt-2 text-[13px] text-ink-muted">
          {critical} critical, {elevated} elevated, {healthy} healthy
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard label="Total" value={summary.total} />
        <MetricCard label="In Stock" value={summary.in_stock} accent colorClass="text-green-700" />
        <MetricCard label="Out of Stock" value={summary.out_of_stock} colorClass={summary.out_of_stock > 0 ? 'text-red-700' : undefined} />
        <MetricCard label="EOL / NRND" value={summary.eol_or_nrnd} colorClass={summary.eol_or_nrnd > 0 ? 'text-amber-700' : undefined} />
        <MetricCard label="Long Lead" value={summary.long_lead} colorClass={summary.long_lead > 0 ? 'text-yellow-700' : undefined} />
        <MetricCard label="No Match" value={summary.no_match} dimmed={summary.no_match === 0} />
        {(summary.error_count ?? 0) > 0 && (
          <MetricCard label="Lookup failed" value={summary.error_count ?? 0} colorClass="text-ink-muted" />
        )}
      </div>
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: React.ReactNode
  accent?: boolean
  dimmed?: boolean
  colorClass?: string
}

function MetricCard({ label, value, accent, dimmed, colorClass }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-1 px-4 py-3">
      <p className="text-eyebrow text-ink-subtle">{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold tracking-tight ${dimmed ? 'text-ink-tertiary' : colorClass ? colorClass : accent ? 'text-ink' : 'text-ink-muted'}`}>
        {value}
      </p>
    </div>
  )
}
