'use client'

import { useEffect, useMemo, useState } from 'react'
import { getBom, listBoms } from '@/lib/api'
import {
  filterAvailable,
  sourcedPartsFromLines,
  type SourcedPart,
  type StockCoverage,
} from '@/lib/purchasing'
import type { BomSummary } from '@/lib/types'

const COVERAGE_LABEL: Record<StockCoverage, string> = {
  covered: 'In stock',
  short: 'Partial stock',
  none: 'No stock',
}

const COVERAGE_CLASS: Record<StockCoverage, string> = {
  covered: 'bg-[#167c48]/10 text-[#167c48]',
  short: 'bg-[#a25a05]/10 text-[#a25a05]',
  none: 'text-slate-500',
}

function leadLabel(leadDays: number | null): string {
  if (leadDays == null) return '—'
  return `${Math.round(leadDays / 7)} wk`
}

export default function BomPartPicker({
  onAdd,
  disabled,
}: {
  onAdd: (parts: SourcedPart[]) => void
  disabled?: boolean
}) {
  const [boms, setBoms] = useState<BomSummary[]>([])
  const [bomId, setBomId] = useState('')
  const [parts, setParts] = useState<SourcedPart[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [inStockOnly, setInStockOnly] = useState(true)
  const [loadingBoms, setLoadingBoms] = useState(true)
  const [loadingParts, setLoadingParts] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    listBoms({ limit: 50 })
      .then((page) => {
        if (!active) return
        setBoms(page.items)
        setBomId((current) => current || (page.items[0]?.id ?? ''))
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Could not load your BOMs')
      })
      .finally(() => {
        if (active) setLoadingBoms(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!bomId) {
      setParts([])
      return
    }
    let active = true
    setLoadingParts(true)
    setSelected(new Set())
    getBom(bomId)
      .then((record) => {
        if (!active) return
        setParts(sourcedPartsFromLines(record.analyze.lines))
        setError(null)
      })
      .catch((err: unknown) => {
        if (!active) return
        setParts([])
        setError(err instanceof Error ? err.message : 'Could not load parts for this BOM')
      })
      .finally(() => {
        if (active) setLoadingParts(false)
      })
    return () => {
      active = false
    }
  }, [bomId])

  const visible = useMemo(() => filterAvailable(parts, inStockOnly), [parts, inStockOnly])
  const selectedParts = useMemo(
    () => visible.filter((part) => selected.has(part.key)),
    [visible, selected],
  )
  const allVisibleSelected = visible.length > 0 && selectedParts.length === visible.length

  function toggle(key: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleAll() {
    setSelected(allVisibleSelected ? new Set() : new Set(visible.map((part) => part.key)))
  }

  return (
    <div className="border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-[15px] font-semibold text-slate-900">Available parts</h2>
        <p className="mt-1 text-[13px] text-slate-500">
          Pulled from your analyzed BOMs. Stock and lead times come from the latest distributor
          refresh — pick the parts you want and they drop into the quote below.
        </p>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block max-w-sm flex-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.09em] text-slate-400">
              BOM
            </span>
            <select
              value={bomId}
              onChange={(event) => setBomId(event.target.value)}
              disabled={loadingBoms || boms.length === 0}
              className="mt-1 w-full border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-[#0062ff] focus:outline-none focus:ring-1 focus:ring-[#0062ff] disabled:bg-slate-50 disabled:text-slate-400"
            >
              {loadingBoms ? <option value="">Loading BOMs…</option> : null}
              {!loadingBoms && boms.length === 0 ? <option value="">No BOMs yet</option> : null}
              {boms.map((bom) => (
                <option key={bom.id} value={bom.id}>
                  {bom.name} ({bom.lineCount} lines)
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 pb-2 text-[13px] text-slate-600">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(event) => setInStockOnly(event.target.checked)}
              className="h-3.5 w-3.5 accent-[#0062ff]"
            />
            In stock only
          </label>
        </div>

        {error ? <p className="font-mono text-[12px] text-[#c62026]">{error}</p> : null}

        {loadingParts ? (
          <p className="py-6 text-[13px] text-slate-500">Loading parts…</p>
        ) : visible.length === 0 ? (
          <p className="py-6 text-[13px] text-slate-500">
            {parts.length === 0
              ? 'No analyzed parts on this BOM yet.'
              : 'No parts are in stock on this BOM. Turn off “In stock only” to see the rest.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 bg-[#f4f6f9]">
                  <th className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                      aria-label="Select all parts"
                      className="h-3.5 w-3.5 accent-[#0062ff]"
                    />
                  </th>
                  {['Part', 'BOM qty', 'Stock', 'Lead', 'Status'].map((header) => (
                    <th
                      key={header}
                      className="px-3 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((part) => (
                  <tr key={part.key} className="border-b border-slate-100">
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected.has(part.key)}
                        onChange={() => toggle(part.key)}
                        aria-label={`Select ${part.mpn}`}
                        className="h-3.5 w-3.5 accent-[#0062ff]"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-slate-900">{part.mpn}</span>
                      {part.manufacturer ? (
                        <span className="ml-2 text-[12px] text-slate-500">{part.manufacturer}</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-700">{part.quantity}</td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-700">
                      {part.totalAvail.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-700">
                      {leadLabel(part.leadDays)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`px-2 py-0.5 text-[11px] font-medium ${COVERAGE_CLASS[part.coverage]}`}
                      >
                        {COVERAGE_LABEL[part.coverage]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={disabled || selectedParts.length === 0}
            onClick={() => onAdd(selectedParts)}
            className="border border-slate-300 bg-white px-4 py-2 text-[13px] font-medium text-slate-800 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add {selectedParts.length > 0 ? `${selectedParts.length} ` : ''}to quote
          </button>
          {visible.length > 0 ? (
            <p className="text-[12px] text-slate-400">
              {visible.length} part{visible.length === 1 ? '' : 's'} from this BOM
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
