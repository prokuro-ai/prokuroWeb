'use client'

import { useEffect, useRef, useState } from 'react'
import type { AnalyzedLine } from '@/lib/types'
import {
  BomConflictError,
  BomNetworkError,
  BomServerError,
  addBomLine,
  deleteBomLine,
  patchBomLine,
} from '@/lib/api'
import { lifecycleBadge, lifecycleLabel } from '@/lib/risk'
import { Trash2, Plus } from 'lucide-react'

type EditableField = 'mpn' | 'manufacturer' | 'quantity' | 'refdes' | 'description'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

type EditableBomTableProps = {
  bomId: string
  version: number
  lines: AnalyzedLine[]
  onLinesChange: (lines: AnalyzedLine[]) => void
  onVersionChange: (version: number) => void
  onConflict: () => void
}

function isLookupFailed(line: AnalyzedLine): boolean {
  const avail = line.availability_status?.toLowerCase() ?? ''
  const match = line.match_status?.toLowerCase() ?? ''
  return avail === 'pending' || match === 'pending'
}

function riskLevelText(level: string | undefined) {
  if (level === 'red') return 'text-[#c62026]'
  if (level === 'yellow') return 'text-[#a25a05]'
  if (level === 'unknown') return 'text-slate-500'
  return 'text-[#167c48]'
}

function messageForSaveError(err: unknown): string {
  if (err instanceof BomConflictError) return err.message
  if (err instanceof BomServerError) return err.message
  if (err instanceof BomNetworkError) return err.message
  if (err instanceof Error) return err.message
  return 'Your change could not be saved, please try again'
}

function EditableCell({
  value,
  field,
  onCommit,
  mono,
}: {
  value: string
  field: EditableField
  onCommit: (field: EditableField, next: string) => Promise<void>
  mono?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function commit() {
    if (draft === value && saveState !== 'error') {
      setEditing(false)
      setErrorMessage(null)
      return
    }
    setSaveState('saving')
    setErrorMessage(null)
    try {
      await onCommit(field, draft)
      setSaveState('saved')
      setEditing(false)
      window.setTimeout(() => setSaveState('idle'), 1200)
    } catch (err) {
      // Preserve draft — do not discard the user's typed change.
      setSaveState('error')
      setErrorMessage(messageForSaveError(err))
      setEditing(true)
    }
  }

  if (editing || saveState === 'error') {
    return (
      <div className="space-y-1">
        <input
          autoFocus={editing}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (saveState !== 'error' && saveState !== 'saving') void commit()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void commit()
            }
            if (e.key === 'Escape') {
              setDraft(value)
              setErrorMessage(null)
              setSaveState('idle')
              setEditing(false)
            }
          }}
          className={`w-full min-w-[4rem] rounded border bg-white px-1.5 py-0.5 text-xs text-slate-800 outline-none ring-2 ${
            saveState === 'error'
              ? 'border-red-400 ring-red-100'
              : 'border-slate-300 ring-slate-200'
          } ${mono ? 'font-mono font-bold' : ''}`}
        />
        {saveState === 'saving' && <p className="text-[10px] text-slate-400">Saving…</p>}
        {saveState === 'error' && errorMessage && (
          <div className="space-y-1">
            <p className="text-[10px] leading-snug text-red-600">{errorMessage}</p>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => void commit()}
              className="text-[10px] font-semibold text-red-700 underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value)
        setEditing(true)
        setErrorMessage(null)
      }}
      className={`group flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left hover:bg-slate-100 ${
        mono ? 'font-mono text-xs font-bold text-slate-800' : 'text-xs text-slate-600'
      }`}
      title="Click to edit"
    >
      <span className="truncate">{value || '-'}</span>
      {saveState === 'saving' && <span className="text-[10px] text-slate-400">Saving…</span>}
      {saveState === 'saved' && <span className="text-[10px] text-emerald-600">Saved</span>}
    </button>
  )
}

export default function EditableBomTable({
  bomId,
  version,
  lines,
  onLinesChange,
  onVersionChange,
  onConflict,
}: EditableBomTableProps) {
  const [busy, setBusy] = useState(false)
  const [rowError, setRowError] = useState<string | null>(null)
  const versionRef = useRef(version)
  const linesRef = useRef(lines)
  const saveQueueRef = useRef(Promise.resolve())
  const inFlightRef = useRef(0)
  const bomIdRef = useRef(bomId)

  // Reset when switching BOMs; otherwise never sync version downward (stale poll),
  // and skip prop→ref sync while a save is in flight so sibling patches keep fresh state.
  useEffect(() => {
    if (bomIdRef.current !== bomId) {
      bomIdRef.current = bomId
      versionRef.current = version
      linesRef.current = lines
      return
    }
    if (inFlightRef.current > 0) return
    if (version >= versionRef.current) {
      versionRef.current = version
      linesRef.current = lines
    }
  }, [bomId, version, lines])

  function enqueueSave<T>(op: () => Promise<T>): Promise<T> {
    const run = saveQueueRef.current.then(
      () => {
        inFlightRef.current += 1
        return op().finally(() => {
          inFlightRef.current = Math.max(0, inFlightRef.current - 1)
        })
      },
      () => {
        inFlightRef.current += 1
        return op().finally(() => {
          inFlightRef.current = Math.max(0, inFlightRef.current - 1)
        })
      },
    )
    saveQueueRef.current = run.then(
      () => undefined,
      () => undefined,
    )
    return run
  }

  async function handleFieldCommit(lineIndex: number, field: EditableField, next: string) {
    return enqueueSave(async () => {
      const patch: Parameters<typeof patchBomLine>[2] = { version: versionRef.current }
      if (field === 'quantity') {
        const parsed = Number(next)
        if (Number.isNaN(parsed)) throw new Error('Quantity must be a number')
        patch.quantity = parsed
      } else {
        patch[field] = next
      }

      try {
        const result = await patchBomLine(bomId, lineIndex, patch)
        const nextLines = [...linesRef.current]
        nextLines[lineIndex] = result.line
        linesRef.current = nextLines
        versionRef.current = result.version
        onLinesChange(nextLines)
        onVersionChange(result.version)
        setRowError(null)
      } catch (err) {
        if (err instanceof BomConflictError) {
          onConflict()
        }
        setRowError(messageForSaveError(err))
        throw err
      }
    })
  }

  async function handleDelete(lineIndex: number) {
    if (busy) return
    setBusy(true)
    setRowError(null)
    try {
      await enqueueSave(async () => {
        const result = await deleteBomLine(bomId, lineIndex, versionRef.current)
        const nextLines = linesRef.current.filter((_, i) => i !== lineIndex)
        linesRef.current = nextLines
        versionRef.current = result.version
        onLinesChange(nextLines)
        onVersionChange(result.version)
      })
    } catch (err) {
      if (err instanceof BomConflictError) onConflict()
      setRowError(messageForSaveError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleAdd() {
    if (busy) return
    const mpn = window.prompt('Manufacturer part number (MPN) for the new line')
    if (!mpn?.trim()) {
      setRowError('Enter an MPN to add a line.')
      return
    }
    setBusy(true)
    setRowError(null)
    try {
      await enqueueSave(async () => {
        const result = await addBomLine(bomId, {
          version: versionRef.current,
          mpn: mpn.trim(),
          manufacturer: '',
          quantity: 1,
          refdes: '',
          description: '',
        })
        const nextLines = [...linesRef.current, result.line]
        linesRef.current = nextLines
        versionRef.current = result.version
        onLinesChange(nextLines)
        onVersionChange(result.version)
      })
    } catch (err) {
      if (err instanceof BomConflictError) onConflict()
      setRowError(messageForSaveError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overflow-hidden border border-slate-200 bg-white shadow-[0_24px_48px_-30px_rgb(15_27_45_/_24%)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-[#f4f6f9] px-5 py-2.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-slate-500">
          Edit mode · click a cell to change it
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleAdd()}
          className="ml-auto inline-flex items-center gap-1.5 border border-slate-200 bg-white px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
          Add line
        </button>
      </div>
      {rowError ? (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-[13px] text-amber-800">
          {rowError}
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-slate-200 bg-[#f4f6f9]">
              {[
                'Part',
                'Manufacturer',
                'Qty',
                'Ref des',
                'Description',
                'Lifecycle',
                'Stock',
                'Risk',
                '',
              ].map((h) => (
                <th
                  key={h || 'actions'}
                  scope="col"
                  className="px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.09em] text-slate-400 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((line, i) => {
              const lookupFailed = isLookupFailed(line)
              const avail = line.availability_status?.toLowerCase() ?? ''
              return (
                <tr key={`${line.row_index}-${i}`} className="bg-white hover:bg-slate-50/80">
                  <td className="px-3 py-2">
                    <EditableCell
                      value={line.mpn ?? ''}
                      field="mpn"
                      mono
                      onCommit={(field, next) => handleFieldCommit(i, field, next)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <EditableCell
                      value={line.manufacturer ?? ''}
                      field="manufacturer"
                      onCommit={(field, next) => handleFieldCommit(i, field, next)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <EditableCell
                      value={line.quantity != null ? String(line.quantity) : ''}
                      field="quantity"
                      onCommit={(field, next) => handleFieldCommit(i, field, next)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <EditableCell
                      value={line.refdes ?? ''}
                      field="refdes"
                      onCommit={(field, next) => handleFieldCommit(i, field, next)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <EditableCell
                      value={line.description ?? ''}
                      field="description"
                      onCommit={(field, next) => handleFieldCommit(i, field, next)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.06em] ${lifecycleBadge(line.lifecycle_status)}`}
                    >
                      {lifecycleLabel(line.lifecycle_status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px] tabular-nums">
                    {lookupFailed ? (
                      <span className="text-slate-400">—</span>
                    ) : avail === 'outofstock' || avail === 'nomatch' ? (
                      <span className="font-semibold text-red-600">
                        {avail === 'nomatch' ? 'No match' : 'Out of stock'}
                      </span>
                    ) : (
                      <span className="text-slate-700">{line.total_avail.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[12px] font-semibold ${riskLevelText(line.risk_level)}`}>
                      {line.risk_level === 'red'
                        ? 'Critical'
                        : line.risk_level === 'yellow'
                          ? 'Watch'
                          : line.risk_level === 'unknown'
                            ? 'Unknown'
                            : 'Clear'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleDelete(i)}
                      className="p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                      aria-label={`Remove line ${i + 1}`}
                      title="Remove line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
