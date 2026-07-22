'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { useAuth } from '@/components/AuthProvider'
import { Link } from '@/lib/navigation'
import { getBom, refreshBom } from '@/lib/api'
import { formatUploadedAt } from '@/lib/format'
import type { AnalyzeResult, AnalyzedLine, BomSummary } from '@/lib/types'

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

function BomDetailTable({ lines }: { lines: AnalyzedLine[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {['Part Number', 'Manufacturer', 'Qty', 'Lifecycle', 'Stock', 'Lead Time', 'Tariff', 'Alternate'].map((h) => (
              <th key={h} className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lines.map((line, i) => {
            const urgent = isUrgent(line)
            const lookupFailed = isLookupFailed(line)
            const leadWeeks = line.factory_lead_days != null ? Math.round(line.factory_lead_days / 7) : null
            const avail = line.availability_status?.toLowerCase() ?? ''

            return (
              <tr key={line.row_index ?? i} className={`hover:bg-slate-50/80 ${urgent ? 'bg-red-50/40' : ''}`}>
                <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800">{line.mpn ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{line.manufacturer ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{line.quantity ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${lifecycleBadge(line.lifecycle_status)}`}>
                    {lifecycleLabel(line.lifecycle_status)}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">
                  {lookupFailed ? (
                    <span className="text-xs text-slate-400">Unknown</span>
                  ) : avail === 'outofstock' ? (
                    <span className="text-xs font-bold text-red-600">Out of stock</span>
                  ) : (
                    <span className="text-xs text-slate-700">{line.total_avail.toLocaleString()}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">
                  {lookupFailed || leadWeeks == null ? (
                    <span className="text-slate-400">Unknown</span>
                  ) : (
                    <span className={leadWeeks > 30 ? 'font-semibold text-amber-600' : 'text-slate-600'}>{leadWeeks}w</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {line.total_duty_pct != null && line.total_duty_pct > 0 ? `${line.total_duty_pct}%` : '—'}
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
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

type BomResultPageProps = {
  id: string
}

export default function BomResultPage({ id }: BomResultPageProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [summary, setSummary] = useState<BomSummary | null>(null)
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    if (!id) {
      setLoaded(true)
      return
    }

    let cancelled = false
    setError(null)

    getBom(id)
      .then((record) => {
        if (!cancelled) {
          setSummary(record.summary)
          setResult(record.analyze)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load BOM')
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [authLoading, user, id, router])

  const handleRunAnalysis = async () => {
    if (!id || refreshing) return
    setRefreshing(true)
    setRefreshError(null)
    try {
      const record = await refreshBom(id)
      setSummary(record.summary)
      setResult(record.analyze)
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setRefreshing(false)
    }
  }

  if (!loaded || authLoading) return null

  if (!result) {
    return (
      <DashboardShell activeTab="boms">
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <h1 className="text-[18px] font-semibold text-slate-900">{error ? 'Could not load BOM' : 'BOM not found'}</h1>
          <p className="mt-2 text-[13px] text-slate-500">
            {error ?? 'This BOM may not exist in your account, or you may not have access to it.'}
          </p>
          <Link
            href="/dashboard?tab=boms"
            className="mt-6 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white hover:bg-primary-hover"
          >
            Back to BOMs
          </Link>
        </div>
      </DashboardShell>
    )
  }

  const badge = riskBadge(result)
  const needsAction = (result.summary.red_count ?? 0) + (result.summary.yellow_count ?? 0)
  const eolCount = result.lines.filter((l) => ['eol', 'discontinued'].includes(l.lifecycle_status.toLowerCase())).length
  const nrndCount = result.lines.filter((l) => l.lifecycle_status.toLowerCase() === 'nrnd').length
  const longLead = result.lines.filter((l) => l.factory_lead_days != null && l.factory_lead_days > 210).length
  const alternates = result.lines.filter((l) => l.aml_candidates.length > 0).length
  const displayName = summary?.name ?? result.source_filename
  const uploadedLabel = summary?.uploadedAt ? formatUploadedAt(summary.uploadedAt) : formatUploadedAt(result.analyzed_at)

  return (
    <DashboardShell activeTab="boms">
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="p-8">
          <div className="mb-8 flex items-start gap-4">
            <Link
              href="/dashboard?tab=boms"
              className="mt-0.5 shrink-0 rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              aria-label="Back to BOMs"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-3">
                <h1 className="truncate text-xl font-bold text-slate-900">{displayName}</h1>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${badge.cls}`}>{badge.label}</span>
              </div>
              <p className="font-mono text-sm text-slate-400">
                {result.source_filename} · {result.lines.length} lines · uploaded {uploadedLabel}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => void handleRunAnalysis()}
                disabled={refreshing}
                className="rounded-md bg-[#0062ff] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing ? 'Running…' : 'Run Analysis'}
              </button>
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

          {refreshError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{refreshError}</div>
          )}

          <div className="mb-8 grid grid-cols-4 gap-4">
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

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-1">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-900">Active Alerts</h2>
              <p className="text-sm text-slate-400">Alerts coming soon.</p>
            </div>

            <div className="col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Part-by-Part Breakdown</h2>
                <span className="text-xs text-slate-400">{result.lines.length} parts</span>
              </div>
              <BomDetailTable lines={result.lines} />
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
