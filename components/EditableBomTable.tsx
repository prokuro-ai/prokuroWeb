'use client'

import { useState } from 'react'
import type { AnalyzedLine } from '@/lib/types'
import { BomConflictError, addBomLine, deleteBomLine, patchBomLine } from '@/lib/api'
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

function riskLevelBadge(level: string | undefined) {
  if (level === 'red') return 'bg-red-100 text-red-700 border-red-200'
  if (level === 'yellow') return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-emerald-100 text-emerald-700 border-emerald-200'
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

  async function commit() {
    setEditing(false)
    if (draft === value) return
    setSaveState('saving')
    try {
      await onCommit(field, draft)
      setSaveState('saved')
      window.setTimeout(() => setSaveState('idle'), 1200)
    } catch {
      setDraft(value)
      setSaveState('error')
      window.setTimeout(() => setSaveState('idle'), 2500)
    }
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            void commit()
          }
          if (e.key === 'Escape') {
            setDraft(value)
            setEditing(false)
          }
        }}
        className={`w-full min-w-[4rem] rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs text-slate-800 outline-none ring-2 ring-slate-200 ${
          mono ? 'font-mono font-bold' : ''
        }`}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value)
        setEditing(true)
      }}
      className={`group flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left hover:bg-slate-100 ${
        mono ? 'font-mono text-xs font-bold text-slate-800' : 'text-xs text-slate-600'
      }`}
      title="Click to edit"
    >
      <span className="truncate">{value || '-'}</span>
      {saveState === 'saving' && <span className="text-[10px] text-slate-400">Saving…</span>}
      {saveState === 'saved' && <span className="text-[10px] text-emerald-600">Saved</span>}
      {saveState === 'error' && <span className="text-[10px] text-red-600">Error</span>}
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

  async function handleFieldCommit(lineIndex: number, field: EditableField, next: string) {
    const patch: Parameters<typeof patchBomLine>[2] = { version }
    if (field === 'quantity') {
      const parsed = Number(next)
      if (Number.isNaN(parsed)) throw new Error('Quantity must be a number')
      patch.quantity = parsed
    } else {
      patch[field] = next
    }

    try {
      const result = await patchBomLine(bomId, lineIndex, patch)
      const nextLines = [...lines]
      nextLines[lineIndex] = result.line
      onLinesChange(nextLines)
      onVersionChange(result.version)
      setRowError(null)
    } catch (err) {
      if (err instanceof BomConflictError) {
        onConflict()
        setRowError(err.message)
      }
      throw err
    }
  }

  async function handleDelete(lineIndex: number) {
    if (busy) return
    setBusy(true)
    setRowError(null)
    try {
      const result = await deleteBomLine(bomId, lineIndex, version)
      const nextLines = lines.filter((_, i) => i !== lineIndex)
      onLinesChange(nextLines)
      onVersionChange(result.version)
    } catch (err) {
      if (err instanceof BomConflictError) {
        onConflict()
        setRowError(err.message)
      } else {
        setRowError(err instanceof Error ? err.message : 'Failed to remove line')
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleAdd() {
    if (busy) return
    setBusy(true)
    setRowError(null)
    try {
      const result = await addBomLine(bomId, {
        version,
        mpn: '',
        manufacturer: '',
        quantity: 1,
        refdes: '',
        description: '',
      })
      onLinesChange([...lines, result.line])
      onVersionChange(result.version)
    } catch (err) {
      if (err instanceof BomConflictError) {
        onConflict()
        setRowError(err.message)
      } else {
        setRowError(err instanceof Error ? err.message : 'Failed to add line')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {rowError && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {rowError}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {[
                'Part Number',
                'Manufacturer',
                'Qty',
                'Refdes',
                'Description',
                'Lifecycle',
                'Stock',
                'Risk',
                '',
              ].map((h) => (
                <th key={h || 'actions'} className="px-3 py-3 font-semibold whitespace-nowrap">
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
                <tr key={`${line.row_index}-${i}`} className="hover:bg-slate-50/80">
                  <td className="px-2 py-2">
                    <EditableCell
                      value={line.mpn ?? ''}
                      field="mpn"
                      mono
                      onCommit={(field, next) => handleFieldCommit(i, field, next)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <EditableCell
                      value={line.manufacturer ?? ''}
                      field="manufacturer"
                      onCommit={(field, next) => handleFieldCommit(i, field, next)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <EditableCell
                      value={line.quantity != null ? String(line.quantity) : ''}
                      field="quantity"
                      onCommit={(field, next) => handleFieldCommit(i, field, next)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <EditableCell
                      value={line.refdes ?? ''}
                      field="refdes"
                      onCommit={(field, next) => handleFieldCommit(i, field, next)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <EditableCell
                      value={line.description ?? ''}
                      field="description"
                      onCommit={(field, next) => handleFieldCommit(i, field, next)}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${lifecycleBadge(line.lifecycle_status)}`}
                    >
                      {lifecycleLabel(line.lifecycle_status)}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-medium">
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
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${riskLevelBadge(line.risk_level)}`}
                    >
                      {line.risk_level ?? 'green'}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleDelete(i)}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
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
      <div className="border-t border-slate-100 px-4 py-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleAdd()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
          Add line
        </button>
      </div>
    </div>
  )
}
