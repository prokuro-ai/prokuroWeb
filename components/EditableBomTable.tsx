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
import { appColHead, appSheet, appToolbarBtn } from '@/components/app/chrome'
import { riskLabel, riskTone, stockHot, stockLabel } from '@/lib/bomLineDisplay'
import { isPendingLine, lifecycleLabel } from '@/lib/risk'
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

function sameEditableFields(a: AnalyzedLine, b: AnalyzedLine): boolean {
  return (
    (a.mpn ?? '') === (b.mpn ?? '') &&
    (a.manufacturer ?? '') === (b.manufacturer ?? '') &&
    a.quantity === b.quantity &&
    (a.refdes ?? '') === (b.refdes ?? '') &&
    (a.description ?? '') === (b.description ?? '')
  )
}

/** Prefer poll enrichment from props when local editable fields match; keep local edits otherwise. */
function mergePropEnrichment(localLines: AnalyzedLine[], propLines: AnalyzedLine[]): AnalyzedLine[] {
  if (propLines.length !== localLines.length) return [...localLines]
  return localLines.map((local, i) => {
    const prop = propLines[i]!
    return sameEditableFields(local, prop) ? prop : local
  })
}

function mergeLinesAfterEdit(
  localLines: AnalyzedLine[],
  propLines: AnalyzedLine[],
  editedIndex: number,
  editedLine: AnalyzedLine,
): AnalyzedLine[] {
  const merged = mergePropEnrichment(localLines, propLines)
  merged[editedIndex] = editedLine
  return merged
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
          className={`w-full min-w-[4rem] rounded-[6px] border bg-mk-canvas px-1.5 py-0.5 text-[13px] text-mk-ink outline-none ${
            saveState === 'error' ? 'border-mk-red' : 'border-mk-line-strong'
          } ${mono ? 'font-mk-mono font-medium' : ''}`}
        />
        {saveState === 'saving' && <p className="text-[11px] text-mk-ink-subtle">Saving…</p>}
        {saveState === 'error' && errorMessage && (
          <div className="space-y-1">
            <p className="text-[11px] leading-snug text-mk-red">{errorMessage}</p>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => void commit()}
              className="text-[11px] font-semibold text-mk-red underline"
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
      className={`group flex w-full items-center gap-1.5 rounded-[6px] px-1 py-0.5 text-left hover:bg-mk-raised ${
        mono ? 'font-mk-mono text-[13px] font-medium text-mk-ink' : 'text-[13px] text-mk-ink-muted'
      }`}
      title="Click to edit"
    >
      <span className="truncate">{value || '—'}</span>
      {saveState === 'saving' && <span className="text-[11px] text-mk-ink-subtle">Saving…</span>}
      {saveState === 'saved' && <span className="text-[11px] text-mk-green">Saved</span>}
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
  const propsLinesRef = useRef(lines)
  const saveQueueRef = useRef(Promise.resolve())
  const inFlightRef = useRef(0)
  const bomIdRef = useRef(bomId)

  // Always track latest props for merge-on-save (poll enrichment), even while saving.
  useEffect(() => {
    propsLinesRef.current = lines
  }, [lines])

  // Reset when switching BOMs; otherwise never sync version downward (stale poll),
  // and skip prop→ref sync while a save is in flight so sibling patches keep fresh state.
  useEffect(() => {
    if (bomIdRef.current !== bomId) {
      bomIdRef.current = bomId
      versionRef.current = version
      linesRef.current = lines
      propsLinesRef.current = lines
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
        const nextLines = mergeLinesAfterEdit(
          linesRef.current,
          propsLinesRef.current,
          lineIndex,
          result.line,
        )
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
        const merged = mergePropEnrichment(linesRef.current, propsLinesRef.current)
        const nextLines = merged.filter((_, i) => i !== lineIndex)
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
        const merged = mergePropEnrichment(linesRef.current, propsLinesRef.current)
        const nextLines = [...merged, result.line]
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
    <div className={appSheet}>
      <div className="flex flex-wrap items-center gap-3 px-5 py-3">
        <p className="text-[13px] text-mk-ink-muted">Click a cell to change it</p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleAdd()}
          className={`ml-auto ${appToolbarBtn}`}
        >
          <Plus className="h-3.5 w-3.5" />
          Add line
        </button>
      </div>
      {rowError ? (
        <div className="border-t border-mk-amber/30 bg-mk-amber/10 px-5 py-2 text-[13px] text-mk-amber">
          {rowError}
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-y border-mk-line">
              {['Part', 'Manufacturer', 'Qty', 'Ref', 'Description', 'Lifecycle', 'Stock', 'Risk', ''].map(
                (header) => (
                  <th
                    key={header || 'actions'}
                    scope="col"
                    className={`${appColHead} whitespace-nowrap px-4 py-2.5`}
                  >
                    {header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => {
              const life = isPendingLine(line) ? '—' : lifecycleLabel(line.lifecycle_status)
              return (
                <tr key={`${line.row_index}-${i}`} className="border-b border-mk-line last:border-b-0 hover:bg-mk-raised/70">
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
                  <td
                    className={`px-4 py-2.5 ${
                      life === 'EOL' || life === 'NRND' ? 'text-mk-red' : 'text-mk-ink-muted'
                    }`}
                  >
                    {life}
                  </td>
                  <td
                    className={`px-4 py-2.5 tabular-nums ${
                      stockHot(line) ? 'text-mk-red' : 'text-mk-ink-muted'
                    }`}
                  >
                    {stockLabel(line)}
                  </td>
                  <td className={`px-4 py-2.5 font-medium ${riskTone(line.risk_level)}`}>
                    {riskLabel(line.risk_level)}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleDelete(i)}
                      className="rounded-[6px] p-1.5 text-mk-ink-subtle transition-colors hover:bg-mk-raised hover:text-mk-red disabled:opacity-40"
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
