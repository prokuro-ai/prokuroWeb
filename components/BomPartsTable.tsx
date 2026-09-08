'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { appColHead, appField, appSheet } from '@/components/app/chrome'
import LineDetail from '@/components/app/LineDetail'
import { leadLabel, riskLabel, riskTone, stockHot, stockLabel } from '@/lib/bomLineDisplay'
import { isAtRisk, isPendingLine, lifecycleLabel, lineRiskLevel, tariffLabel } from '@/lib/risk'
import type { AnalyzedLine, RiskLevel } from '@/lib/types'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'red', label: 'Critical' },
  { id: 'yellow', label: 'Watch' },
  { id: 'green', label: 'Clear' },
  { id: 'unknown', label: 'Unmatched' },
] as const

type FilterId = (typeof FILTERS)[number]['id']

const COLS = ['Part', 'Manufacturer', 'Qty', 'Ref', 'Lifecycle', 'Stock', 'Lead', 'Duty', 'Risk'] as const
const COLUMN_COUNT = COLS.length

export default function BomPartsTable({
  lines,
  initialExpanded = null,
}: {
  lines: AnalyzedLine[]
  initialExpanded?: number | null
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterId>('all')
  const [expanded, setExpanded] = useState<number | null>(initialExpanded)

  useEffect(() => {
    if (initialExpanded == null) return
    setExpanded(initialExpanded)
    requestAnimationFrame(() => {
      document.getElementById(`bom-line-${initialExpanded}`)?.scrollIntoView({ block: 'center' })
    })
  }, [initialExpanded])

  const counts = useMemo(() => {
    const tally: Record<RiskLevel, number> = { red: 0, yellow: 0, green: 0, unknown: 0 }
    for (const line of lines) tally[lineRiskLevel(line)] += 1
    return tally
  }, [lines])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return lines.filter((line) => {
      if (filter !== 'all' && lineRiskLevel(line) !== filter) return false
      if (!query) return true
      return [line.mpn, line.manufacturer, line.description, line.refdes]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query))
    })
  }, [lines, search, filter])

  return (
    <div className={appSheet}>
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mk-ink-subtle" aria-hidden />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find a part"
            aria-label="Search parts"
            className={`${appField} border-0 border-b border-mk-line bg-transparent pl-5 focus:border-mk-accent`}
          />
        </div>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Filter parts">
          {FILTERS.map((option) => {
            const count = option.id === 'all' ? lines.length : counts[option.id]
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                className={`pb-0.5 text-[12px] transition-colors ${
                  filter === option.id
                    ? 'border-b border-mk-ink font-semibold text-mk-ink'
                    : 'text-mk-ink-subtle hover:text-mk-ink'
                }`}
              >
                {option.label}
                <span className="ml-1.5 tabular-nums opacity-60">{count}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-y border-mk-line">
              {COLS.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className={`${appColHead} whitespace-nowrap px-4 py-2.5 ${
                    header === 'Qty' || header === 'Stock' || header === 'Lead' || header === 'Duty'
                      ? 'text-right'
                      : ''
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((line) => {
              const risk = lineRiskLevel(line)
              const life = isPendingLine(line) ? '—' : lifecycleLabel(line.lifecycle_status)
              const duty = isPendingLine(line) ? '—' : tariffLabel(line)
              const expandable = isAtRisk(line)
              const open = expanded === line.row_index
              const detailId = `bom-line-detail-${line.row_index}`
              return (
                <Fragment key={line.row_index}>
                  <tr
                    id={`bom-line-${line.row_index}`}
                    role={expandable ? 'button' : undefined}
                    tabIndex={expandable ? 0 : undefined}
                    aria-expanded={expandable ? open : undefined}
                    aria-controls={expandable ? detailId : undefined}
                    onClick={
                      expandable
                        ? () => setExpanded((current) => (current === line.row_index ? null : line.row_index))
                        : undefined
                    }
                    onKeyDown={
                      expandable
                        ? (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              setExpanded((current) => (current === line.row_index ? null : line.row_index))
                            }
                          }
                        : undefined
                    }
                    className={`border-b border-mk-line last:border-b-0 ${
                      expandable ? 'cursor-pointer' : ''
                    } ${open ? 'border-b-0 bg-mk-raised' : 'hover:bg-mk-raised/70'}`}
                  >
                    <td className="max-w-[16rem] px-4 py-2.5">
                      <div className="flex items-start gap-2">
                        {expandable ? (
                          <ChevronDown
                            className={`mt-0.5 h-3.5 w-3.5 shrink-0 text-mk-ink-subtle transition-transform ${
                              open ? 'rotate-180 text-mk-ink' : ''
                            }`}
                            aria-hidden
                          />
                        ) : (
                          <span className="mt-0.5 inline-block h-3.5 w-3.5 shrink-0" aria-hidden />
                        )}
                        <div className="min-w-0">
                          <span className="mk-data block truncate text-mk-ink">{line.mpn || '—'}</span>
                          {line.description ? (
                            <span className="mt-0.5 block truncate text-[12px] text-mk-ink-subtle">
                              {line.description}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[10rem] truncate px-4 py-2.5 text-mk-ink-muted">
                      {line.manufacturer || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-mk-ink-muted">
                      {line.quantity?.toLocaleString() ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-mk-ink-muted">{line.refdes || '—'}</td>
                    <td
                      className={`px-4 py-2.5 ${
                        life === 'EOL' || life === 'NRND' ? 'text-mk-red' : 'text-mk-ink-muted'
                      }`}
                    >
                      {life}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right tabular-nums ${
                        stockHot(line) ? 'text-mk-red' : 'text-mk-ink-muted'
                      }`}
                    >
                      {stockLabel(line)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-mk-ink-muted">{leadLabel(line)}</td>
                    <td
                      className={`px-4 py-2.5 text-right tabular-nums ${
                        duty !== '-' && duty !== '—' ? 'text-mk-red' : 'text-mk-ink-muted'
                      }`}
                    >
                      {duty}
                    </td>
                    <td className={`px-4 py-2.5 font-medium ${riskTone(risk)}`}>{riskLabel(risk)}</td>
                  </tr>
                  {expandable && open ? (
                    <tr id={detailId}>
                      <td colSpan={COLUMN_COUNT} className="border-b border-mk-line p-0">
                        <div className="bg-mk-raised px-4 py-4 mk:px-5 mk:py-5">
                          <LineDetail line={line} />
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-24 items-center justify-center text-[13px] text-mk-ink-subtle">
          No parts match this view.
        </div>
      ) : null}
    </div>
  )
}
