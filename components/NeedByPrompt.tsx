'use client'

import { useState } from 'react'
import { setBomNeedByAll } from '@/lib/api'
import { appPrimaryBtn, appToolbarBtn } from '@/components/app/chrome'

type NeedByPromptProps = {
  bomId: string
  version: number
  canWrite: boolean
  onApplied: (record: Awaited<ReturnType<typeof setBomNeedByAll>>) => void
  onPerPart: () => void
  onSkip: () => void
}

/**
 * Asks whether one need-by date applies to every MPN on the board.
 * Need-by is set here (not from the uploaded BOM). Lead flags need a date on the line.
 */
export default function NeedByPrompt({
  bomId,
  version,
  canWrite,
  onApplied,
  onPerPart,
  onSkip,
}: NeedByPromptProps) {
  const [mode, setMode] = useState<'ask' | 'date'>('ask')
  const [date, setDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!canWrite) return null

  async function applyAll() {
    const trimmed = date.trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      setError('Use YYYY-MM-DD')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const record = await setBomNeedByAll(bomId, version, trimmed)
      onApplied(record)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save need-by')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border-b border-mk-line bg-mk-raised px-4 py-3 sm:px-5">
      {mode === 'ask' ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-medium text-mk-ink">When do you need these parts?</p>
            <p className="mt-0.5 text-[12px] text-mk-ink-muted">
              One board date applies lead-time flags to every MPN. Or set dates per part in Edit.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={appPrimaryBtn} onClick={() => setMode('date')}>
              One date for all parts
            </button>
            <button type="button" className={appToolbarBtn} onClick={onPerPart}>
              Different dates per part
            </button>
            <button type="button" className={appToolbarBtn} onClick={onSkip}>
              Skip for now
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="block text-[13px] text-mk-ink">
            Need-by for every line
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                if (error) setError(null)
              }}
              className="mt-1 block w-full max-w-[12rem] rounded-lg border border-mk-line bg-mk-canvas px-3 py-2 text-[13px] text-mk-ink"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {error ? <p className="text-[12px] text-mk-red">{error}</p> : null}
            <button
              type="button"
              disabled={busy}
              className={appPrimaryBtn}
              onClick={() => void applyAll()}
            >
              {busy ? 'Saving…' : 'Apply to all parts'}
            </button>
            <button type="button" className={appToolbarBtn} onClick={() => setMode('ask')} disabled={busy}>
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
