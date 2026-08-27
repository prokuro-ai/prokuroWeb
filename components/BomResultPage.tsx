'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import BomExportMenu from '@/components/BomExportMenu'
import BomPartsTable from '@/components/BomPartsTable'
import EditableBomTable from '@/components/EditableBomTable'
import { useAuth } from '@/components/AuthProvider'
import { Link } from '@/lib/navigation'
import { getBom } from '@/lib/api'
import { useTeam } from '@/hooks/use-team'
import { formatUploadedAt } from '@/lib/format'
import { isPendingLine, portfolioBadgeFromSummary, shouldPollBom } from '@/lib/risk'
import type { AnalyzedLine, AnalyzeResult, BomSummary } from '@/lib/types'

const actionBtn =
  'border border-slate-200 px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] transition-colors'
const actionBtnIdle = `${actionBtn} text-slate-700 hover:border-slate-300 hover:bg-slate-50`
const actionBtnActive = `${actionBtn} border-[#0062ff] bg-[#0062ff]/5 text-[#0062ff]`
const POLL_INTERVALS_MS = [2000, 5000, 10000, 30000]
const POLL_CEILING_MS = 15 * 60 * 1000
const POLL_MAX_FAILURES = 3

function MetaStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-slate-400">{label}</div>
      <div
        className={`mt-1 font-mono text-[18px] font-semibold tabular-nums tracking-tight sm:text-[22px] ${tone ?? 'text-slate-900'}`}
      >
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
  const { canWrite } = useTeam()
  const [summary, setSummary] = useState<BomSummary | null>(null)
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [version, setVersion] = useState(1)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)
  const [editing, setEditing] = useState(false)
  const [pollStalled, setPollStalled] = useState(false)
  const [pollEpoch, setPollEpoch] = useState(0)

  const pollStartedAt = useRef<number | null>(null)
  const pollAttempt = useRef(0)
  const pollFailures = useRef(0)
  /** Ignore GET/poll responses older than local edits (avoids version clobber → 409). */
  const knownVersionRef = useRef(1)

  // Restart whenever enrichment becomes pending again (e.g. after MPN edits).
  const needsPoll = Boolean(result && shouldPollBom(result))
  const pendingKeyRef = useRef('')

  const applyRecord = useCallback((record: { summary: BomSummary; analyze: AnalyzeResult }) => {
    const nextVersion = record.summary.version ?? 1
    // Same version is OK (read-through enrichment does not bump). Older is stale.
    if (nextVersion < knownVersionRef.current) {
      return record.analyze
    }
    knownVersionRef.current = nextVersion
    setSummary(record.summary)
    setResult(record.analyze)
    setVersion(nextVersion)

    const nextKey = record.analyze.lines
      .filter(isPendingLine)
      .map((line) => `${line.row_index}:${line.mpn ?? ''}`)
      .sort()
      .join('|')
    const prev = pendingKeyRef.current
    const prevSet = new Set(prev.split('|').filter(Boolean))
    const addedPending =
      Boolean(nextKey) &&
      (!prev ||
        nextKey
          .split('|')
          .filter(Boolean)
          .some((entry) => !prevSet.has(entry)))
    pendingKeyRef.current = nextKey
    if (addedPending) {
      pollStartedAt.current = Date.now()
      pollFailures.current = 0
      setPollEpoch((n) => n + 1)
    }

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

  // Initial auth + load
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
    setConflict(false)
    setPollStalled(false)
    pollStartedAt.current = null
    pollAttempt.current = 0
    pollFailures.current = 0
    pendingKeyRef.current = ''
    knownVersionRef.current = 0

    getBom(id)
      .then((record) => {
        if (cancelled) return
        applyRecord(record)
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
  }, [authLoading, user, id, router, applyRecord])

  useEffect(() => {
    if (!user || !id || !needsPoll) {
      if (!needsPoll) {
        pollStartedAt.current = null
        pollAttempt.current = 0
        pollFailures.current = 0
        pendingKeyRef.current = ''
        setPollStalled(false)
      }
      return
    }

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    pollStartedAt.current = pollStartedAt.current ?? Date.now()
    pollAttempt.current = 0
    setPollStalled(false)

    const schedulePoll = () => {
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
            // Always apply — do not drop in-flight results when the effect restarts.
            applyRecord(record)
            if (cancelled) return
            if (shouldPollBom(record.analyze)) schedulePoll()
          })
          .catch(() => {
            if (cancelled) return
            pollFailures.current += 1
            if (pollFailures.current >= POLL_MAX_FAILURES) {
              setPollStalled(true)
              return
            }
            schedulePoll()
          })
      }, delay)
    }

    schedulePoll()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [user, id, needsPoll, pollEpoch, applyRecord])

  function handleLinesChange(lines: AnalyzedLine[]) {
    setResult((prev) => {
      if (!prev) return prev
      const next = { ...prev, lines, summary: { ...prev.summary, total: lines.length } }
      const nextKey = lines
        .filter(isPendingLine)
        .map((line) => `${line.row_index}:${line.mpn ?? ''}`)
        .sort()
        .join('|')
      const prevKey = pendingKeyRef.current
      const prevSet = new Set(prevKey.split('|').filter(Boolean))
      const addedPending =
        Boolean(nextKey) &&
        (!prevKey ||
          nextKey
            .split('|')
            .filter(Boolean)
            .some((entry) => !prevSet.has(entry)))
      pendingKeyRef.current = nextKey
      if (addedPending) {
        pollStartedAt.current = Date.now()
        pollFailures.current = 0
        setPollEpoch((n) => n + 1)
      }
      return next
    })
  }

  if (!loaded) {
    return (
      <div className="flex flex-1 items-center justify-center text-[13px] text-slate-400">Loading…</div>
    )
  }

  if (!result) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <h1 className="text-[18px] font-semibold text-slate-900">
            {error ? 'Could not load BOM' : 'BOM not found'}
          </h1>
          <p className="mt-2 text-[13px] text-slate-500">
            {error ?? 'This BOM may not exist in your account, or you may not have access to it.'}
          </p>
          <Link
            href="/boms"
            className="mt-6 bg-[#0062ff] px-4 py-2 text-[13px] font-medium text-white hover:bg-blue-700"
          >
            Back to BOMs
          </Link>
      </div>
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {conflict && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:px-6">
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
      {pollStalled && pendingCount > 0 ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:px-6">
          Live updates stalled.{' '}
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => {
              setPollStalled(false)
              pollFailures.current = 0
              pollAttempt.current = 0
              pollStartedAt.current = Date.now()
              setPollEpoch((n) => n + 1)
              void loadBom()
            }}
          >
            Retry now
          </button>
        </div>
      ) : null}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="border-b border-slate-200">
          <div className="mx-auto max-w-[1120px] px-4 pt-5 pb-0 sm:px-6 sm:pt-6">
            <div className="mb-4 flex flex-wrap items-start gap-x-3 gap-y-3 sm:mb-5">
              <Link
                href="/boms"
                className="mt-0.5 shrink-0 p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 sm:mt-1"
                aria-label="Back to BOMs"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div className="min-w-0 flex-1 basis-[min(100%,16rem)]">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                  <h1 className="max-w-full truncate text-[18px] font-semibold tracking-tight text-slate-900 sm:text-[22px]">
                    {displayName}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] ${badge.cls} ${badge.label === 'Unknown' ? 'font-normal normal-case tracking-normal' : 'font-semibold'}`}
                  >
                    {badge.dot ? <span className={`h-1.5 w-1.5 ${badge.dot}`} aria-hidden /> : null}
                    {badge.label}
                  </span>
                </div>
                <p className="mt-1 break-words font-mono text-[11px] uppercase tracking-[0.08em] text-slate-400 sm:text-[12px]">
                  <span className="inline-block max-w-full truncate align-bottom">{result.source_filename}</span>
                  <span className="mx-2 text-slate-300">·</span>
                  {result.lines.length.toLocaleString()} lines
                  <span className="mx-2 text-slate-300">·</span>
                  Uploaded {uploadedLabel}
                </p>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-2">
                {canWrite ? (
                  <button
                    type="button"
                    onClick={() => setEditing((current) => !current)}
                    aria-pressed={editing}
                    className={editing ? actionBtnActive : actionBtnIdle}
                  >
                    {editing ? 'Done' : 'Edit'}
                  </button>
                ) : null}
                <BomExportMenu result={result} triggerClassName={actionBtnIdle} />
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-200 py-4 sm:gap-5 sm:py-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="grid min-w-0 w-full grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 sm:gap-x-8 lg:flex-1 lg:gap-x-10">
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
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-[0.08em] text-slate-500 sm:text-[12px] lg:max-w-[16rem] lg:justify-end lg:text-right">
                {scorableLines > 0 ? (
                  <>
                    <span className={`h-1.5 w-1.5 shrink-0 ${flagged > 0 ? 'bg-[#c62026]' : 'bg-[#167c48]'}`} aria-hidden />
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

        <div className="mx-auto max-w-[1120px] px-4 py-6 sm:px-6 sm:py-8">
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
              {editing ? 'Editing lines' : `${result.lines.length} parts`}
            </span>
          </div>

          {editing ? (
            <EditableBomTable
              bomId={id}
              version={version}
              lines={result.lines}
              onLinesChange={handleLinesChange}
              onVersionChange={(next) => {
                knownVersionRef.current = Math.max(knownVersionRef.current, next)
                setVersion(next)
              }}
              onConflict={() => setConflict(true)}
            />
          ) : (
            <BomPartsTable lines={result.lines} />
          )}
        </div>
      </div>
    </div>
  )
}
