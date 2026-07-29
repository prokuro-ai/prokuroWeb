import type { AnalyzeResult, AnalyzedLine, BomSummary } from '@/lib/types'
import { formatUploadedAt } from '@/lib/format'
import { Link } from '@/lib/navigation'
import { ChevronLeft } from 'lucide-react'

function isLookupFailed(line: AnalyzedLine): boolean {
  const avail = line.availability_status?.toLowerCase() ?? ''
  const match = line.match_status?.toLowerCase() ?? ''
  return avail === 'pending' || match === 'pending'
}

function lifecycleBadge(status: string) {
  const s = status.toLowerCase()
  if (s === 'eol' || s === 'discontinued') return 'bg-red-100 text-red-700 border border-red-200'
  if (s === 'nrnd') return 'bg-amber-100 text-amber-700 border border-amber-200'
  if (s === 'active') return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
  return 'bg-slate-100 text-slate-500 border border-slate-200'
}

function lifecycleLabel(status: string) {
  const s = status.toLowerCase()
  if (s === 'eol' || s === 'discontinued') return 'EOL'
  if (s === 'nrnd') return 'NRND'
  if (s === 'active') return 'Active'
  if (s === 'unknown' || !s) return 'Unknown'
  return status
}

function isUrgent(line: AnalyzedLine) {
  if (isLookupFailed(line)) return false
  const s = line.lifecycle_status.toLowerCase()
  return s === 'eol' || s === 'nrnd' || s === 'discontinued'
}

function riskBadge(result: AnalyzeResult) {
  const red = result.summary.red_count ?? 0
  const yellow = result.summary.yellow_count ?? 0
  if (red > 0) return { label: 'Critical', cls: 'bg-red-100 text-red-700' }
  if (yellow > 0) return { label: 'Warning', cls: 'bg-amber-100 text-amber-700' }
  return { label: 'Healthy', cls: 'bg-emerald-100 text-emerald-700' }
}

function riskLevelBadge(level: string | undefined) {
  if (level === 'red') return 'bg-red-100 text-red-700 border-red-200'
  if (level === 'yellow') return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-emerald-100 text-emerald-700 border-emerald-200'
}

export function BomDetailTable({ lines }: { lines: AnalyzedLine[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {[
                'Part Number',
                'Manufacturer',
                'Qty',
                'Lifecycle',
                'Stock',
                'Lead Time',
                'Tariff',
                'Risk',
                'Alternate',
              ].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((line, i) => {
              const urgent = isUrgent(line)
              const lookupFailed = isLookupFailed(line)
              const leadWeeks =
                line.factory_lead_days != null ? Math.round(line.factory_lead_days / 7) : null
              const avail = line.availability_status?.toLowerCase() ?? ''

              return (
                <tr
                  key={line.row_index ?? i}
                  className={`hover:bg-slate-50/80 ${urgent ? 'bg-red-50/40' : ''}`}
                >
                  <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800">
                    {line.mpn ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{line.manufacturer ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{line.quantity ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${lifecycleBadge(line.lifecycle_status)}`}
                    >
                      {lifecycleLabel(line.lifecycle_status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {lookupFailed ? (
                      <span className="text-xs text-slate-400">Unknown</span>
                    ) : avail === 'outofstock' || avail === 'nomatch' ? (
                      <span className="text-xs font-bold text-red-600">
                        {avail === 'nomatch' ? 'No match' : 'Out of stock'}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-700">
                        {line.total_avail.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {lookupFailed || leadWeeks == null ? (
                      <span className="text-slate-400">Unknown</span>
                    ) : (
                      <span
                        className={
                          leadWeeks > 30 ? 'font-semibold text-amber-600' : 'text-slate-600'
                        }
                      >
                        {leadWeeks}w
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {line.total_duty_pct != null && line.total_duty_pct > 0
                      ? `${line.total_duty_pct}%`
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${riskLevelBadge(line.risk_level)}`}
                    >
                      {line.risk_level ?? 'green'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {line.aml_candidates.length > 0 ? (
                      <div className="space-y-1">
                        {line.aml_candidates.map((mpn, j) => (
                          <span
                            key={j}
                            className="block rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-xs text-emerald-700"
                          >
                            {mpn}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type BomReportViewProps = {
  result: AnalyzeResult
  summary?: BomSummary | null
  backHref: string
  backLabel?: string
}

export default function BomReportView({
  result,
  summary = null,
  backHref,
  backLabel = 'Back to BOMs',
}: BomReportViewProps) {
  const badge = riskBadge(result)
  const needsAction = (result.summary.red_count ?? 0) + (result.summary.yellow_count ?? 0)
  const eolCount = result.lines.filter((l) =>
    ['eol', 'discontinued'].includes(l.lifecycle_status.toLowerCase()),
  ).length
  const nrndCount = result.lines.filter((l) => l.lifecycle_status.toLowerCase() === 'nrnd').length
  const longLead = result.lines.filter(
    (l) => l.factory_lead_days != null && l.factory_lead_days > 210,
  ).length
  const alternates = result.lines.filter((l) => l.aml_candidates.length > 0).length
  const tariffLines = result.lines.filter(
    (l) => l.total_duty_pct != null && l.total_duty_pct > 0,
  ).length
  const displayName = summary?.name ?? result.source_filename
  const uploadedLabel = summary?.uploadedAt
    ? formatUploadedAt(summary.uploadedAt)
    : formatUploadedAt(result.analyzed_at)

  const alertLines = (result.top_risks ?? result.lines.filter((l) => l.risk_level !== 'green')).slice(
    0,
    6,
  )

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="p-8">
        <div className="mb-8 flex items-start gap-4">
          <Link
            href={backHref}
            className="mt-0.5 shrink-0 rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label={backLabel}
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-3">
              <h1 className="truncate text-xl font-bold text-slate-900">{displayName}</h1>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${badge.cls}`}>
                {badge.label}
              </span>
            </div>
            <p className="font-mono text-sm text-slate-400">
              {result.source_filename} · {result.lines.length} lines · uploaded {uploadedLabel}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              disabled
              title="Export coming soon"
              className="cursor-not-allowed rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-400 opacity-60 shadow-sm"
            >
              Export
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { label: 'Total Parts', value: result.summary.total, sub: 'unique line items', cls: 'text-slate-900' },
            {
              label: 'Needs Action',
              value: needsAction,
              sub: `${eolCount} EOL · ${nrndCount} NRND`,
              cls: needsAction > 0 ? 'text-red-600' : 'text-slate-900',
            },
            {
              label: 'Long Lead Time',
              value: longLead,
              sub: 'over 30 weeks',
              cls: longLead > 0 ? 'text-amber-600' : 'text-slate-900',
            },
            {
              label: 'Tariff Exposure',
              value: tariffLines,
              sub: 'lines with duty > 0%',
              cls: tariffLines > 0 ? 'text-amber-600' : 'text-slate-900',
            },
            {
              label: 'Alternates Found',
              value: alternates,
              sub: 'validated substitutes',
              cls: alternates > 0 ? 'text-emerald-600' : 'text-slate-400',
            },
          ].map((tile) => (
            <div key={tile.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-1 text-xs font-medium text-slate-500">{tile.label}</div>
              <div className={`text-3xl font-bold tracking-tight ${tile.cls}`}>{tile.value}</div>
              <div className="mt-1 text-xs text-slate-400">{tile.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-900">
              Active Alerts
            </h2>
            {alertLines.length === 0 ? (
              <p className="text-sm text-slate-400">No active alerts on this BOM.</p>
            ) : (
              <div className="space-y-3">
                {alertLines.map((l) => {
                  const life = lifecycleLabel(l.lifecycle_status)
                  const isRed = l.risk_level === 'red'
                  return (
                    <div
                      key={l.row_index}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-bold text-slate-900">
                          {l.mpn ?? 'Unknown'}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                            isRed
                              ? 'border-red-200 bg-red-50 text-red-700'
                              : 'border-amber-200 bg-amber-50 text-amber-700'
                          }`}
                        >
                          {life === 'EOL' || life === 'NRND'
                            ? life
                            : l.total_duty_pct && l.total_duty_pct > 0
                              ? 'Tariff'
                              : 'Lead Time'}
                        </span>
                      </div>
                      <p className="text-sm leading-snug text-slate-700">
                        {life !== 'Active' && life !== 'Unknown'
                          ? `${life} status. `
                          : ''}
                        {l.total_duty_pct != null && l.total_duty_pct > 0
                          ? `Section 301 duty ${l.total_duty_pct}%. `
                          : ''}
                        {l.factory_lead_days != null && l.factory_lead_days > 210
                          ? `Factory lead ${Math.round(l.factory_lead_days / 7)} weeks. `
                          : ''}
                        {l.aml_candidates[0]
                          ? `Recommended alternate: ${l.aml_candidates[0]}.`
                          : l.availability_status.toLowerCase() === 'outofstock'
                            ? 'Out of stock across tracked distributors.'
                            : l.match_status.toLowerCase() === 'none'
                              ? 'No catalog match for this MPN.'
                              : 'Review before next production run.'}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Part-by-Part Breakdown
              </h2>
              <span className="text-xs text-slate-400">{result.lines.length} parts</span>
            </div>
            <BomDetailTable lines={result.lines} />
          </div>
        </div>
      </div>
    </div>
  )
}
