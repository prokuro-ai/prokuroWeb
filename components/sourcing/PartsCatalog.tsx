'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import EmptyState from '@/components/app/EmptyState'
import QtyInput from '@/components/app/QtyInput'
import { appColHead, appField, appGhostBtn, appSheet, appTextBtn } from '@/components/app/chrome'
import BoardPicker, { type BoardOption } from '@/components/sourcing/BoardPicker'
import { lineStatusLabel, riskTone, stockHot, stockLabel } from '@/lib/bomLineDisplay'
import { boardToCart, cartLineFrom, type Board, type CartLine, type CatalogPart } from '@/lib/cart'
import { isPendingLine, lifecycleLabel, lineRiskLevel } from '@/lib/risk'

const ALL = 'all'

function usedOn(part: CatalogPart, boardId: string): string {
  if (boardId !== ALL) {
    const qty = part.uses.filter((use) => use.bomId === boardId).reduce((sum, use) => sum + use.quantity, 0)
    return `${qty.toLocaleString()} per board`
  }
  const names = [...new Set(part.uses.map((use) => use.bomName))]
  return names.length === 1 ? names[0] : `${names.length} boards`
}

function defaultQty(part: CatalogPart, boardId: string, builds: number): number {
  const uses = boardId === ALL ? part.uses : part.uses.filter((use) => use.bomId === boardId)
  return Math.max(1, uses.reduce((sum, use) => sum + use.quantity, 0) * builds)
}

export default function PartsCatalog({
  boards,
  catalog,
  cart,
  loading,
  error,
  failed,
  onAdd,
}: {
  boards: Board[]
  catalog: CatalogPart[]
  cart: CartLine[]
  loading: boolean
  error: string | null
  failed: number
  onAdd: (lines: CartLine[]) => void
}) {
  const [boardId, setBoardId] = useState<string>(ALL)
  const [builds, setBuilds] = useState('1')
  const [search, setSearch] = useState('')
  const [qtyDrafts, setQtyDrafts] = useState<Record<string, string>>({})

  const buildCount = Math.max(1, Number.parseInt(builds, 10) || 1)
  const inCart = useMemo(() => new Map(cart.map((line) => [line.key, line.quantity])), [cart])
  const board = boards.find((candidate) => candidate.id === boardId) ?? null
  const boardOptions = useMemo<BoardOption[]>(() => {
    const parts = (count: number) => `${count.toLocaleString()} ${count === 1 ? 'part' : 'parts'}`
    return [
      { value: ALL, label: 'All boards', detail: parts(catalog.length) },
      ...boards.map((option) => ({
        value: option.id,
        label: option.name,
        detail: parts(catalog.filter((part) => part.uses.some((use) => use.bomId === option.id)).length),
      })),
    ]
  }, [boards, catalog])

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return catalog.filter((part) => {
      if (boardId !== ALL && !part.uses.some((use) => use.bomId === boardId)) return false
      if (!query) return true
      return [part.mpn, part.manufacturer, part.description]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query))
    })
  }, [catalog, boardId, search])

  function addPart(part: CatalogPart) {
    const draft = Number.parseInt(qtyDrafts[part.key] ?? '', 10)
    const quantity = Number.isFinite(draft) && draft > 0 ? draft : defaultQty(part, boardId, buildCount)
    onAdd([cartLineFrom(part, quantity)])
    setQtyDrafts((current) => {
      const next = { ...current }
      delete next[part.key]
      return next
    })
  }

  if (!loading && !error && boards.length === 0) {
    return (
      <div className={appSheet}>
        <EmptyState
          title="No boards yet"
          description="Upload a BOM and its parts show up here, ready to add to the cart. You can still look up a single part number above."
          action={
            <Link href="/bom/new" className={appGhostBtn}>
              Upload a BOM
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className={appSheet}>
      <div className="flex flex-col gap-3 border-b border-mk-line px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <BoardPicker value={boardId} options={boardOptions} onChange={setBoardId} />
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mk-ink-subtle"
              aria-hidden
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter by part, maker, description"
              aria-label="Filter parts"
              className={`${appField} rounded-none border-0 border-b border-mk-line bg-transparent pl-5 focus:border-mk-accent`}
            />
          </div>
        </div>
        {board ? (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 text-[13px] text-mk-ink-muted">
              Builds
              <QtyInput label="Builds" value={builds} onChange={setBuilds} />
            </span>
            <button type="button" onClick={() => onAdd(boardToCart(board, buildCount))} className={appGhostBtn}>
              Add whole board
            </button>
          </div>
        ) : null}
      </div>

      {error ? <p className="px-5 py-4 text-[13px] text-mk-red">{error}</p> : null}
      {failed > 0 ? (
        <p className="border-b border-mk-line px-5 py-2 text-[12px] text-mk-ink-subtle">
          {failed} {failed === 1 ? 'board' : 'boards'} didn’t load. Their parts are missing from this list.
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] table-fixed border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-mk-line">
              <th scope="col" className={`${appColHead} px-4 py-2.5`}>Part</th>
              <th scope="col" className={`${appColHead} w-[8.5rem] px-3 py-2.5`}>Used on</th>
              <th scope="col" className={`${appColHead} w-[6.5rem] px-3 py-2.5 text-right`}>Stock</th>
              <th scope="col" className={`${appColHead} w-[8.5rem] px-3 py-2.5`}>Risk</th>
              <th scope="col" className={`${appColHead} w-[11.5rem] px-4 py-2.5 text-right`}>
                <span className="sr-only">Add to cart</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }, (_, index) => (
                  <tr key={index} className="border-b border-mk-line last:border-b-0">
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-mk-raised" />
                    </td>
                  </tr>
                ))
              : rows.map((part) => {
                  const life = isPendingLine(part.line) ? null : lifecycleLabel(part.line.lifecycle_status)
                  const carted = inCart.get(part.key)
                  return (
                    <tr key={part.key} className="border-b border-mk-line last:border-b-0 hover:bg-mk-raised/70">
                      <td className="px-4 py-2.5">
                        <span className="mk-data block truncate text-mk-ink" title={part.mpn}>
                          {part.mpn}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-mk-ink-subtle">
                          {carted ? (
                            <span className="font-medium tabular-nums text-mk-accent">
                              {carted.toLocaleString()} in cart ·{' '}
                            </span>
                          ) : null}
                          {[part.manufacturer, part.description].filter(Boolean).join(' · ') || '—'}
                        </span>
                      </td>
                      <td className="truncate px-3 py-2.5 text-mk-ink-muted">{usedOn(part, boardId)}</td>
                      <td
                        className={`whitespace-nowrap px-3 py-2.5 text-right tabular-nums ${
                          stockHot(part.line) ? 'text-mk-red' : 'text-mk-ink-muted'
                        }`}
                      >
                        {stockLabel(part.line)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className={`font-medium ${riskTone(lineRiskLevel(part.line))}`}>
                          {lineStatusLabel(part.line)}
                        </span>
                        {life === 'EOL' || life === 'NRND' ? (
                          <span className="text-mk-ink-subtle"> · {life}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-3">
                          <QtyInput
                            label={`Quantity of ${part.mpn}`}
                            value={qtyDrafts[part.key] ?? String(defaultQty(part, boardId, buildCount))}
                            onChange={(value) => setQtyDrafts((current) => ({ ...current, [part.key]: value }))}
                          />
                          <button type="button" onClick={() => addPart(part)} className={appTextBtn}>
                            Add
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
          </tbody>
        </table>
      </div>

      {!loading && rows.length === 0 && catalog.length > 0 ? (
        <div className="flex h-24 items-center justify-center text-[13px] text-mk-ink-subtle">
          No parts match this view.
        </div>
      ) : null}
    </div>
  )
}
