'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getSourcingRun, SourcingRunError, startSourcingRun } from '@/lib/api'
import { finishedRun } from '@/lib/sourcingPlan'
import type { SourcingRun, SourcingRunRequest } from '@/lib/types'

export const POLL_MS = 1500
const MAX_POLL_FAILURES = 5
/** The gateway gives up after 100 s; anything much past that is a run we lost track of. */
const MAX_WAIT_MS = 4 * 60 * 1000

export type RunPhase =
  | { kind: 'idle' }
  | { kind: 'starting' }
  | {
      kind: 'running'
      runId: string
      progress: SourcingRun['progress'] | null
      startedAt: number
      /** Picked up a run that was already going for this account, maybe for another cart. */
      adopted: boolean
    }
  | { kind: 'done'; run: SourcingRun }
  | { kind: 'failed'; message: string }
  /** The gateway forgot the run (restart or 30-minute expiry). */
  | { kind: 'expired' }
  /** This gateway predates sourcing runs. */
  | { kind: 'unsupported' }
  /** The gateway refused to start: plan limits, bad input, busy. */
  | { kind: 'refused'; message: string }
  /** Polling kept failing; the run may still finish on the server. */
  | { kind: 'offline'; runId: string; startedAt: number }

export function useSourcingRun() {
  const [phase, setPhase] = useState<RunPhase>({ kind: 'idle' })
  const generation = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stop = useCallback(() => {
    generation.current += 1
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }, [])

  useEffect(() => stop, [stop])

  const follow = useCallback(
    (runId: string, startedAt: number, adopted = false) => {
      stop()
      const gen = generation.current
      let failures = 0
      setPhase({ kind: 'running', runId, progress: null, startedAt, adopted })
      const tick = async () => {
        if (gen !== generation.current) return
        try {
          const run = await getSourcingRun(runId)
          if (gen !== generation.current) return
          failures = 0
          if (run.status === 'done') {
            const finished = finishedRun(run)
            setPhase(
              finished
                ? { kind: 'done', run: finished }
                : { kind: 'failed', message: 'The plan came back unreadable. Run sourcing again.' },
            )
            return
          }
          if (run.status !== 'running') {
            setPhase({ kind: 'failed', message: run.message?.trim() || 'Sourcing stopped before it finished.' })
            return
          }
          if (Date.now() - startedAt > MAX_WAIT_MS) {
            setPhase({ kind: 'failed', message: 'Sourcing is taking far longer than it should. Run it again.' })
            return
          }
          setPhase({ kind: 'running', runId, progress: run.progress, startedAt, adopted })
          timer.current = setTimeout(() => void tick(), POLL_MS)
        } catch (error) {
          if (gen !== generation.current) return
          if (error instanceof SourcingRunError && error.status === 404) {
            setPhase({ kind: 'expired' })
            return
          }
          if (error instanceof SourcingRunError && (error.status === 401 || error.status === 403)) {
            setPhase({ kind: 'failed', message: error.message })
            return
          }
          failures += 1
          if (failures >= MAX_POLL_FAILURES) {
            setPhase({ kind: 'offline', runId, startedAt })
            return
          }
          timer.current = setTimeout(() => void tick(), POLL_MS * 2 ** failures)
        }
      }
      void tick()
    },
    [stop],
  )

  /** Resolves once the run is being followed, or with why it couldn't start. */
  const start = useCallback(
    async (request: SourcingRunRequest): Promise<RunPhase['kind'] | null> => {
      stop()
      const gen = generation.current
      setPhase({ kind: 'starting' })
      let next: RunPhase
      try {
        const run = await startSourcingRun(request)
        if (gen !== generation.current) return null
        follow(run.id, Date.now())
        return 'running'
      } catch (error) {
        if (gen !== generation.current) return null
        if (error instanceof SourcingRunError && error.status === 409 && error.runId) {
          follow(error.runId, Date.now(), true)
          return 'running'
        }
        next =
          error instanceof SourcingRunError && (error.status === 404 || error.status === 405)
            ? { kind: 'unsupported' }
            : {
                kind: 'refused',
                message: error instanceof Error && error.message ? error.message : 'Sourcing didn’t start. Try again.',
              }
      }
      setPhase(next)
      return next.kind
    },
    [follow, stop],
  )

  const resume = useCallback((runId: string) => follow(runId, Date.now()), [follow])

  const reset = useCallback(() => {
    stop()
    setPhase({ kind: 'idle' })
  }, [stop])

  return { phase, start, resume, reset }
}
