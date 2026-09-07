'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import BomExportMenu from '@/components/BomExportMenu'
import BomPartsTable from '@/components/BomPartsTable'
import EditableBomTable from '@/components/EditableBomTable'
import { useAuth } from '@/components/AuthProvider'
import { appGhostBtn, appPrimaryBtn } from '@/components/app/chrome'
import { Link } from '@/lib/navigation'
import { getBom } from '@/lib/api'
import { useTeam } from '@/hooks/use-team'
import { formatUploadedAt } from '@/lib/format'
import { isPendingLine, portfolioBadgeFromSummary, shouldPollBom } from '@/lib/risk'
import type { AnalyzedLine, AnalyzeResult, BomSummary } from '@/lib/types'

const POLL_INTERVALS_MS = [2000, 5000, 10000, 30000]
const POLL_CEILING_MS = 15 * 60 * 1000
const POLL_MAX_FAILURES = 3

type BomResultPageProps = {
  id: string
}

export default function BomResultPage({ id }: BomResultPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const lineParam = searchParams.get('line')
  const initialLine =
    lineParam != null && lineParam !== '' && Number.isFinite(Number(lineParam)) ? Number(lineParam) : null
  const { user, loading: authLoading } = useAuth()
  const { canWrite, error: teamError, reload: reloadTeam, loaded: teamLoaded, team } = useTeam()
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
            const nextVersion = record.summary.version ?? 1
            const wasStale = nextVersion < knownVersionRef.current
            // Always apply — do not drop in-flight results when the effect restarts.
            applyRecord(record)
            if (cancelled) return
            pollFailures.current = 0
            // Stale GETs must not stop polling: continue when ignored, or when
            // the applied payload still has pending lines.
            if (wasStale || shouldPollBom(record.analyze)) schedulePoll()
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
      <div className="flex flex-1 items-center justify-center font-mk-sans text-[13px] text-mk-ink-subtle">
        Loading…
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center font-mk-sans">
        <h1 className="font-mk-display text-[24px] text-mk-ink">
          {error ? 'Could not load this board' : 'Board not found'}
        </h1>
        <p className="mt-2 text-[13px] text-mk-ink-muted">
          {error ?? 'This board may not exist in your account, or you may not have access to it.'}
        </p>
        <Link href="/boms" className={`${appPrimaryBtn} mt-6`}>
          Back to boards
        </Link>
      </div>
    )
  }

  const badge = portfolioBadgeFromSummary(result.summary)
  const flagged = (result.summary.red_count ?? 0) + (result.summary.yellow_count ?? 0)
  const pendingCount = result.lines.filter(isPendingLine).length
  const displayName = summary?.name ?? result.source_filename
  const uploadedLabel = summary?.uploadedAt
    ? formatUploadedAt(summary.uploadedAt)
    : formatUploadedAt(result.analyzed_at)
  const callLine =
    flagged > 0
      ? `${flagged} part${flagged === 1 ? '' : 's'} need a call`
      : 'Nothing needs a call'

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden font-mk-sans">
      {conflict && (
        <div className="border-b border-mk-amber/30 bg-mk-amber/10 px-4 py-3 text-sm text-mk-ink sm:px-6">
          This board was updated elsewhere.{' '}
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
      {teamLoaded && teamError && !team ? (
        <div className="border-b border-mk-amber/30 bg-mk-amber/10 px-4 py-3 text-sm text-mk-ink sm:px-6">
          Couldn’t check who can edit ({teamError}). Editing is off until this loads.{' '}
          <button type="button" className="font-semibold underline" onClick={() => reloadTeam()}>
            Retry
          </button>
        </div>
      ) : null}
      {pollStalled && pendingCount > 0 ? (
        <div className="border-b border-mk-amber/30 bg-mk-amber/10 px-4 py-3 text-sm text-mk-ink sm:px-6">
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
      <div className="flex-1 overflow-y-auto bg-mk-canvas">
        <div className="sticky top-0 z-10 border-b border-mk-line bg-mk-canvas">
          <div className="mx-auto max-w-[1120px] px-4 py-4 sm:px-6">
            <div className="flex flex-wrap items-start gap-x-3 gap-y-3">
              <Link
                href="/boms"
                className="mt-0.5 shrink-0 p-1.5 text-mk-ink-subtle transition-colors hover:bg-mk-raised hover:text-mk-ink sm:mt-1"
                aria-label="Back to boards"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div className="min-w-0 flex-1 basis-[min(100%,16rem)]">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                  <h1 className="max-w-full truncate font-mk-display text-[22px] leading-tight tracking-[-0.02em] text-mk-ink sm:text-[26px]">
                    {displayName}
                  </h1>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[12px] ${badge.cls}`}>
                    {badge.dot ? <span className={`h-1.5 w-1.5 ${badge.dot}`} aria-hidden /> : null}
                    {badge.label}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-mk-ink-muted">
                  <span className={flagged > 0 ? 'text-mk-red' : undefined}>{callLine}</span>
                  <span className="mx-2 text-mk-line-strong">·</span>
                  {result.lines.length.toLocaleString()} parts
                  <span className="mx-2 text-mk-line-strong">·</span>
                  {uploadedLabel}
                </p>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-2">
                {canWrite ? (
                  <button
                    type="button"
                    onClick={() => setEditing((current) => !current)}
                    aria-pressed={editing}
                    className={editing ? appPrimaryBtn : appGhostBtn}
                  >
                    {editing ? 'Done' : 'Edit'}
                  </button>
                ) : null}
                <BomExportMenu result={result} triggerClassName={appGhostBtn} />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1120px] px-4 py-6 sm:px-6 sm:py-8">
          {pendingCount > 0 ? (
            <div className="mb-6 flex items-center gap-3 border border-mk-accent/25 bg-mk-canvas px-4 py-3">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-mk-accent" aria-hidden />
              <p className="text-[13px] text-mk-ink">
                Still matching <span className="font-semibold">{pendingCount}</span>{' '}
                {pendingCount === 1 ? 'part' : 'parts'} to distributor data. This page updates as
                results arrive.
              </p>
            </div>
          ) : null}

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
            <BomPartsTable lines={result.lines} initialExpanded={initialLine} />
          )}
        </div>
      </div>
    </div>
  )
}
