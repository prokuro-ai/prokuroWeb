'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import EditableBomTable from '@/components/EditableBomTable'
import { useAuth } from '@/components/AuthProvider'
import { Link } from '@/lib/navigation'
import { getBom } from '@/lib/api'
import { formatUploadedAt } from '@/lib/format'
import { hasPendingLines, isPendingLine, portfolioBadgeFromSummary } from '@/lib/risk'
import type { AnalyzedLine, AnalyzeResult, BomSummary } from '@/lib/types'

const POLL_INTERVALS_MS = [2000, 5000, 10000, 30000]
const POLL_CEILING_MS = 15 * 60 * 1000

function MetaStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-slate-400">{label}</div>
      <div className={`mt-1 font-mono text-[22px] font-semibold tabular-nums tracking-tight ${tone ?? 'text-slate-900'}`}>
        {value}
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
  const [version, setVersion] = useState(1)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)

  const pollStartedAt = useRef<number | null>(null)
  const pollAttempt = useRef(0)

  const applyRecord = useCallback((record: { summary: BomSummary; analyze: AnalyzeResult }) => {
    setSummary(record.summary)
    setResult(record.analyze)
    setVersion(record.summary.version ?? 1)
    return record.analyze
  }, [])

  const loadBom = useCallback(() => {
    if (!id) {
      setLoaded(true)
      return
    }
    setError(null)
    setConflict(false)
    return getBom(id)
      .then((record) => applyRecord(record))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load BOM')
      })
      .finally(() => {
        setLoaded(true)
      })
  }, [id, applyRecord])

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
    setConflict(false)
    pollStartedAt.current = null
    pollAttempt.current = 0

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
  }, [authLoading, user, id, router, applyRecord])

  function handleLinesChange(lines: AnalyzedLine[]) {
    setResult((prev) =>
      prev ? { ...prev, lines, summary: { ...prev.summary, total: lines.length } } : prev,
    )
  }

  if (!loaded || authLoading) return null

  if (!result) {
    return (
      <DashboardShell activeTab="boms">
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <h1 className="text-[18px] font-semibold text-slate-900">
            {error ? 'Could not load BOM' : 'BOM not found'}
          </h1>
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

  const badge = portfolioBadgeFromSummary(result.summary)
  const flagged = (result.summary.red_count ?? 0) + (result.summary.yellow_count ?? 0)
  const unknownCount = result.summary.unknown_count ?? 0
  const scorableLines = result.lines.length - unknownCount
  const flaggedPct = scorableLines > 0 ? Math.round((flagged / scorableLines) * 100) : 0
  const eolCount = result.lines.filter((l) =>
    ['eol', 'discontinued'].includes(l.lifecycle_status.toLowerCase()),
  ).length
  const nrndCount = result.lines.filter((l) => l.lifecycle_status.toLowerCase() === 'nrnd').length
  const longLead = result.lines.filter(
    (l) => l.factory_lead_days != null && l.factory_lead_days > 210,
  ).length
  const tariffHits = result.lines.filter(
    (l) => l.total_duty_pct != null && l.total_duty_pct > 0,
  ).length
  const pendingCount = result.lines.filter(isPendingLine).length
  const displayName = summary?.name ?? result.source_filename
  const uploadedLabel = summary?.uploadedAt
    ? formatUploadedAt(summary.uploadedAt)
    : formatUploadedAt(result.analyzed_at)

  return (
    <DashboardShell activeTab="boms">
      {conflict && (
        <div className="border-b border-amber-200 bg-amber-50 px-8 py-3 text-sm text-amber-900">
          This BOM was updated elsewhere.{' '}
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => {
              setLoaded(false)
              void loadBom()
            }}
          >
            Refresh to see the latest
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="border-b border-slate-200">
          <div className="mx-auto max-w-[1120px] px-6 pt-6 pb-0">
            <div className="mb-5 flex items-start gap-3">
              <Link
                href="/dashboard?tab=boms"
                className="mt-1 shrink-0 p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
                aria-label="Back to BOMs"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="truncate text-[22px] font-semibold tracking-tight text-slate-900">
                    {displayName}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] ${badge.cls} ${badge.label === 'Unknown' ? 'font-normal normal-case tracking-normal' : 'font-semibold'}`}
                  >
                    {badge.dot ? <span className={`h-1.5 w-1.5 ${badge.dot}`} aria-hidden /> : null}
                    {badge.label}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.08em] text-slate-400">
                  {result.source_filename}
                  <span className="mx-2 text-slate-300">·</span>
                  {result.lines.length.toLocaleString()} lines
                  <span className="mx-2 text-slate-300">·</span>
                  Uploaded {uploadedLabel}
                </p>
              </div>
              <button
                type="button"
                disabled
                title="Export coming soon"
                className="cursor-not-allowed border border-slate-200 px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400"
              >
                Export
              </button>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-6 border-t border-slate-200 py-5">
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-10 gap-y-5 sm:grid-cols-4">
                <MetaStat label="Lines" value={result.lines.length.toLocaleString()} />
                <MetaStat
                  label="Flagged"
                  value={String(flagged)}
                  tone={flagged > 0 ? 'text-[#c62026]' : undefined}
                />
                <MetaStat
                  label="EOL / NRND"
                  value={`${eolCount} / ${nrndCount}`}
                  tone={eolCount + nrndCount > 0 ? 'text-[#a25a05]' : undefined}
                />
                <MetaStat
                  label="Long lead"
                  value={String(longLead)}
                  tone={longLead > 0 ? 'text-[#a25a05]' : undefined}
                />
              </div>
              <div className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.08em] text-slate-500">
                {scorableLines > 0 ? (
                  <>
                    <span className={`h-1.5 w-1.5 ${flagged > 0 ? 'bg-[#c62026]' : 'bg-[#167c48]'}`} aria-hidden />
                    <span className="text-slate-900">{flaggedPct}% of scored lines flagged</span>
                  </>
                ) : (
                  <span className="text-slate-900">No distributor matches to score yet</span>
                )}
                {tariffHits > 0 ? (
                  <>
                    <span className="text-slate-300">·</span>
                    <span>{tariffHits} with tariff</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1120px] px-6 py-8">
          {pendingCount > 0 ? (
            <div className="mb-6 flex items-center gap-3 border border-[#0062ff]/25 bg-[#0062ff]/5 px-4 py-3">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#0062ff]" aria-hidden />
              <p className="text-[13px] text-slate-700">
                Resolving <span className="font-semibold">{pendingCount}</span>{' '}
                {pendingCount === 1 ? 'part' : 'parts'} against distributor data. This page updates as
                results arrive.
              </p>
            </div>
          ) : null}

          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
              Part-by-part breakdown
            </h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-slate-400">
              {result.lines.length} parts
            </span>
          </div>

          <EditableBomTable
            bomId={id}
            version={version}
            lines={result.lines}
            onLinesChange={handleLinesChange}
            onVersionChange={setVersion}
            onConflict={() => setConflict(true)}
          />
        </div>
      </div>
    </DashboardShell>
  )
}
