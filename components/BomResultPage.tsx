'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import BomPartsTable from '@/components/BomPartsTable'
import DashboardShell from '@/components/DashboardShell'
import { useAuth } from '@/components/AuthProvider'
import { Link } from '@/lib/navigation'
import { getBom } from '@/lib/api'
import { formatUploadedAt } from '@/lib/format'
import { hasPendingLines, isPendingLine, lineRiskLevel } from '@/lib/risk'
import type { AnalyzeResult, BomSummary, RiskLevel } from '@/lib/types'

const POLL_INTERVALS_MS = [2000, 5000, 10000, 30000]
const POLL_CEILING_MS = 15 * 60 * 1000

const RISK_SEGMENTS: { level: RiskLevel; label: string; color: string }[] = [
  { level: 'red', label: 'Critical', color: '#ef4444' },
  { level: 'yellow', label: 'Watch', color: '#f59e0b' },
  { level: 'green', label: 'Clear', color: '#10b981' },
]

function riskBadge(result: AnalyzeResult) {
  const red = result.summary.red_count ?? 0
  const yellow = result.summary.yellow_count ?? 0
  if (red > 0) return { label: 'Critical', cls: 'bg-red-100 text-red-700' }
  if (yellow > 0) return { label: 'Warning', cls: 'bg-amber-100 text-amber-700' }
  return { label: 'Healthy', cls: 'bg-emerald-100 text-emerald-700' }
}

function RiskDistribution({ counts, total }: { counts: Record<RiskLevel, number>; total: number }) {
  if (total === 0) return null
  return (
    <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Line Risk Distribution</span>
        <span className="text-xs text-slate-400">{total} lines scored</span>
      </div>
      <div className="mb-4 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        {RISK_SEGMENTS.map((segment) =>
          counts[segment.level] > 0 ? (
            <span
              key={segment.level}
              className="h-full"
              style={{ width: `${(counts[segment.level] / total) * 100}%`, background: segment.color }}
              title={`${segment.label}: ${counts[segment.level]} lines`}
            />
          ) : null,
        )}
      </div>
      <div className="flex flex-wrap gap-x-8 gap-y-2">
        {RISK_SEGMENTS.map((segment) => (
          <div key={segment.level} className="flex items-baseline gap-2">
            <span className="h-2 w-2 shrink-0 translate-y-[-1px] rounded-full" style={{ background: segment.color }} />
            <span className="text-sm font-bold tabular-nums text-slate-900">{counts[segment.level]}</span>
            <span className="text-xs text-slate-500">{segment.label}</span>
          </div>
        ))}
      </div>
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

  const pollStartedAt = useRef<number | null>(null)
  const pollAttempt = useRef(0)

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
    let timer: ReturnType<typeof setTimeout> | undefined
    setError(null)
    pollStartedAt.current = null
    pollAttempt.current = 0

    const applyRecord = (record: { summary: BomSummary; analyze: AnalyzeResult }) => {
      setSummary(record.summary)
      setResult(record.analyze)
      return record.analyze
    }

    const schedulePoll = (analyze: AnalyzeResult) => {
      if (!hasPendingLines(analyze)) return
      const started = pollStartedAt.current ?? Date.now()
      pollStartedAt.current = started
      if (Date.now() - started >= POLL_CEILING_MS) return

      const delay =
        POLL_INTERVALS_MS[Math.min(pollAttempt.current, POLL_INTERVALS_MS.length - 1)] ?? 30000
      pollAttempt.current += 1

      timer = setTimeout(() => {
        if (cancelled) return
        getBom(id)
          .then((record) => {
            if (cancelled) return
            schedulePoll(applyRecord(record))
          })
          .catch(() => {
            /* keep last good result; stop polling on hard errors */
          })
      }, delay)
    }

    getBom(id)
      .then((record) => {
        if (cancelled) return
        schedulePoll(applyRecord(record))
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load BOM')
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [authLoading, user, id, router])

  const riskCounts = useMemo(() => {
    const tally: Record<RiskLevel, number> = { red: 0, yellow: 0, green: 0 }
    for (const line of result?.lines ?? []) tally[lineRiskLevel(line)] += 1
    return tally
  }, [result])

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
  const needsAction = riskCounts.red + riskCounts.yellow
  const eolCount = result.lines.filter((l) => ['eol', 'discontinued'].includes(l.lifecycle_status.toLowerCase())).length
  const nrndCount = result.lines.filter((l) => l.lifecycle_status.toLowerCase() === 'nrnd').length
  const longLead = result.lines.filter((l) => l.factory_lead_days != null && l.factory_lead_days > 210).length
  const alternates = result.lines.filter((l) => l.aml_candidates.length > 0).length
  const pendingCount = result.lines.filter(isPendingLine).length
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
                disabled
                title="Export coming soon"
                className="cursor-not-allowed rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-400 opacity-60 shadow-sm"
              >
                Export
              </button>
            </div>
          </div>

          {pendingCount > 0 ? (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3.5">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#0062ff]" aria-hidden />
              <p className="text-sm font-medium text-slate-700">
                Resolving {pendingCount} {pendingCount === 1 ? 'part' : 'parts'} against distributor data. This page
                updates on its own as results arrive.
              </p>
            </div>
          ) : null}

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

          <RiskDistribution counts={riskCounts} total={result.lines.length} />

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Part-by-Part Breakdown</h2>
              <span className="text-xs text-slate-400">{result.lines.length} parts</span>
            </div>
            <BomPartsTable lines={result.lines} />
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
