'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Search, Sparkles } from 'lucide-react'
import type { AnalyzedLine, RiskLevel } from '@/lib/types'
import {
  RISK_PRESENTATION,
  isPendingLine,
  leadTimeWeeks,
  lifecycleDot,
  lifecycleLabel,
  lineRiskLevel,
  tariffLabel,
} from '@/lib/risk'

const COLUMN_COUNT = 7

const FILTERS = ['All', 'Critical', 'Watch', 'Clear'] as const
type Filter = (typeof FILTERS)[number]

const FILTER_LEVEL: Record<Exclude<Filter, 'All'>, RiskLevel> = {
  Critical: 'red',
  Watch: 'yellow',
  Clear: 'green',
}

function Pending() {
  return <span className="animate-pulse text-xs text-slate-400">Looking up…</span>
}

function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white/60 p-4">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-[#0062ff]" aria-hidden />
        <span className="text-[11px] font-bold uppercase tracking-[0.09em] text-slate-500">{title}</span>
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
          Coming soon
        </span>
      </div>
      <p className="text-[13px] leading-relaxed text-slate-500">{body}</p>
    </div>
  )
}

function Signal({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.09em] text-slate-400">{label}</dt>
      <dd className={`mt-1 text-[13px] font-medium ${tone ?? 'text-slate-700'}`}>{value}</dd>
    </div>
  )
}

function stockLabel(line: AnalyzedLine): string {
  const avail = line.availability_status?.toLowerCase() ?? ''
  if (avail === 'outofstock') return 'Out of stock'
  if (avail === 'nomatch') return 'No distributor match'
  return `${line.total_avail.toLocaleString()} units`
}

function LineDetail({ line }: { line: AnalyzedLine }) {
  const level = lineRiskLevel(line)
  const risk = RISK_PRESENTATION[level]
  const pending = isPendingLine(line)
  const weeks = leadTimeWeeks(line)
  const lineLabel = String(line.row_index).padStart(4, '0')

  return (
    <div className={`border-l-4 ${risk.panel} border-l-current px-6 py-5 ${risk.text}`}>
      <div className="space-y-5 text-slate-700">
        <div>
          <p className={`font-mono text-[11px] uppercase tracking-[0.09em] ${risk.text}`}>
            Line {lineLabel} · why {risk.label.toLowerCase()}
          </p>
          {line.description ? (
            <p className="mt-2 max-w-[72ch] text-[15px] leading-relaxed text-slate-600">{line.description}</p>
          ) : null}
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-slate-200/80 pt-4 md:grid-cols-3 lg:grid-cols-6">
          <Signal
            label="Lifecycle"
            value={pending ? 'Resolving…' : lifecycleLabel(line.lifecycle_status)}
          />
          <Signal label="Distributor stock" value={pending ? 'Resolving…' : stockLabel(line)} />
          <Signal label="Factory lead" value={weeks == null ? '—' : `${weeks} weeks`} />
          <Signal label="Country of origin" value={line.country_of_origin || 'Unknown'} />
          <Signal label="HTS code" value={line.hts_code || 'Unclassified'} />
          <Signal label="Estimated duty" value={tariffLabel(line)} />
        </dl>

        {line.refdes || line.category ? (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-slate-500">
            {line.refdes ? (
              <span>
                <span className="text-[10px] font-bold uppercase tracking-[0.09em] text-slate-400">Ref des </span>
                <span className="font-mono text-slate-700">{line.refdes}</span>
              </span>
            ) : null}
            {line.category ? (
              <span>
                <span className="text-[10px] font-bold uppercase tracking-[0.09em] text-slate-400">Category </span>
                {line.category}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-4 border-t border-slate-200/80 pt-4 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-slate-400">Alternates from your AML</p>
            {line.aml_candidates.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {line.aml_candidates.map((mpn) => (
                  <span
                    key={mpn}
                    className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 font-mono text-xs font-medium text-emerald-700"
                  >
                    {mpn}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-slate-400">No approved alternate listed on this line.</p>
            )}
          </div>
          <ComingSoon
            title="Recommended alternate"
            body="Prokuro will cross-check parametric drop-ins against lifecycle, stock, tariff exposure, and your AML, then rank them with a confidence score and the engineering sign-off each swap needs."
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ComingSoon
            title="Why this score"
            body="A plain-language explanation of the lifecycle, supply, and trade signals driving this line's risk, written the way your procurement analyst would brief you."
          />
          <ComingSoon
            title="Cost & next action"
            body="Estimated tariff and re-spin cost at your build volume, plus the one action to take this week and who needs to approve it."
          />
        </div>

        {line.tariff_notes || line.entity_list_notes || line.tariff_disclaimer ? (
          <div className="space-y-1.5 border-t border-slate-200/80 pt-4 text-[12px] leading-relaxed text-slate-500">
            {line.tariff_notes ? <p>{line.tariff_notes}</p> : null}
            {line.entity_list_notes ? <p className="text-red-600">{line.entity_list_notes}</p> : null}
            {line.tariff_disclaimer ? <p className="text-slate-400">{line.tariff_disclaimer}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function LineRow({
  line,
  expanded,
  onToggle,
}: {
  line: AnalyzedLine
  expanded: boolean
  onToggle: () => void
}) {
  const level = lineRiskLevel(line)
  const risk = RISK_PRESENTATION[level]
  const pending = isPendingLine(line)
  const weeks = leadTimeWeeks(line)
  const avail = line.availability_status?.toLowerCase() ?? ''
  const detailId = `bom-line-detail-${line.row_index}`

  return (
    <>
      <tr
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-controls={detailId}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onToggle()
          }
        }}
        className={`group cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0062ff] ${risk.row} ${expanded ? 'bg-slate-50' : ''}`}
      >
        <td className={`px-4 py-3 ${risk.rail}`}>
          <div className="flex items-start gap-2.5">
            <ChevronDown
              className={`mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:text-[#0062ff] ${expanded ? 'rotate-180 text-[#0062ff]' : ''}`}
              aria-hidden
            />
            <div className="min-w-0">
              <div className="truncate font-mono text-xs font-bold text-slate-800">{line.mpn ?? '-'}</div>
              <div className="truncate text-xs text-slate-400">{line.manufacturer ?? 'Manufacturer unknown'}</div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-xs text-slate-600 tabular-nums">{line.quantity ?? '-'}</td>
        <td className="px-4 py-3">
          {pending ? (
            <Pending />
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${lifecycleDot(line.lifecycle_status)}`} aria-hidden />
              {lifecycleLabel(line.lifecycle_status)}
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-xs tabular-nums">
          {pending ? (
            <Pending />
          ) : avail === 'outofstock' ? (
            <span className="font-bold text-red-600">Out of stock</span>
          ) : avail === 'nomatch' ? (
            <span className="text-slate-400">No match</span>
          ) : (
            <span className="text-slate-700">{line.total_avail.toLocaleString()}</span>
          )}
        </td>
        <td className="px-4 py-3 text-xs tabular-nums">
          {pending ? (
            <Pending />
          ) : weeks == null ? (
            <span className="text-slate-400">—</span>
          ) : (
            <span className={weeks > 30 ? 'font-semibold text-amber-600' : 'text-slate-600'}>{weeks}w</span>
          )}
        </td>
        <td className="px-4 py-3 text-xs tabular-nums text-slate-600">{tariffLabel(line)}</td>
        <td className="px-4 py-3">
          <span className="flex items-center gap-2">
            <span className="h-1 w-12 shrink-0 rounded-full bg-slate-200" aria-hidden>
              <span className={`block h-full rounded-full ${risk.bar}`} style={{ width: `${risk.fill}%` }} />
            </span>
            <span className={`text-xs font-semibold ${risk.text}`}>{risk.label}</span>
          </span>
        </td>
      </tr>
      {expanded ? (
        <tr id={detailId}>
          <td colSpan={COLUMN_COUNT} className="p-0">
            <LineDetail line={line} />
          </td>
        </tr>
      ) : null}
    </>
  )
}

export default function BomPartsTable({ lines }: { lines: AnalyzedLine[] }) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('All')

  const counts = useMemo(() => {
    const tally: Record<RiskLevel, number> = { red: 0, yellow: 0, green: 0 }
    for (const line of lines) tally[lineRiskLevel(line)] += 1
    return tally
  }, [lines])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return lines.filter((line) => {
      if (filter !== 'All' && lineRiskLevel(line) !== FILTER_LEVEL[filter]) return false
      if (!query) return true
      return [line.mpn, line.manufacturer, line.description, line.refdes]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query))
    })
  }, [lines, search, filter])

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50/60 px-4 py-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search part, manufacturer, ref des…"
            aria-label="Search parts"
            className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-sm focus:border-[#0062ff] focus:outline-none focus:ring-2 focus:ring-[#0062ff]/20"
          />
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
          {FILTERS.map((option) => {
            const count =
              option === 'All' ? lines.length : counts[FILTER_LEVEL[option]]
            return (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === option ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {option} <span className="tabular-nums text-slate-400">{count}</span>
              </button>
            )
          })}
        </div>
        <span className="ml-auto hidden text-xs text-slate-400 lg:block">Select a row for line detail</span>
      </div>

      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {['Part', 'Qty', 'Lifecycle', 'Stock', 'Lead', 'Tariff', 'Risk'].map((header) => (
              <th key={header} scope="col" className="px-4 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filtered.map((line) => (
            <LineRow
              key={line.row_index}
              line={line}
              expanded={expanded === line.row_index}
              onToggle={() => setExpanded((current) => (current === line.row_index ? null : line.row_index))}
            />
          ))}
        </tbody>
      </table>

      {filtered.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-slate-400">
          No parts match this view.
        </div>
      ) : null}
    </div>
  )
}
