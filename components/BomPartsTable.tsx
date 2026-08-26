'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Search, Sparkles } from 'lucide-react'
import type { AnalyzedLine, RiskLevel } from '@/lib/types'
import { analystBrief, buildLineDecision } from '@/lib/decision'
import {
  RISK_PRESENTATION,
  isAtRisk,
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
  return <span className="animate-pulse text-[12px] text-slate-400">Looking up…</span>
}

function DecisionBlock({
  title,
  body,
  accent,
}: {
  title: string
  body: string
  accent?: string
}) {
  return (
    <div className="min-w-0 border border-slate-200 bg-white p-4">
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#0062ff]" aria-hidden />
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.09em] text-slate-500">
          {title}
        </span>
        {accent ? (
          <span className="bg-[#0062ff]/10 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-[#0062ff]">
            {accent}
          </span>
        ) : null}
      </div>
      <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-slate-600">
        {body}
      </p>
    </div>
  )
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.09em] text-slate-400">{label}</dt>
      <dd className="mt-1 text-[13px] font-medium text-slate-700">{value}</dd>
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
  const risk = RISK_PRESENTATION[lineRiskLevel(line)]
  const pending = isPendingLine(line)
  const weeks = leadTimeWeeks(line)
  const lineLabel = String(line.row_index).padStart(4, '0')
  const decision = buildLineDecision(line)
  const brief = analystBrief(line)
  const briefPending = isAtRisk(line) && !pending && !brief

  return (
    <div className="min-w-0 border-t border-slate-200 bg-[#f4f6f9] px-4 py-4 sm:px-6 sm:py-5">
      <div className="min-w-0 space-y-4 sm:space-y-5">
        <div>
          <p className={`font-mono text-[11px] uppercase tracking-[0.09em] ${risk.text}`}>
            Line {lineLabel}: why {risk.label.toLowerCase()}
          </p>
          <p className="mt-2 max-w-[72ch] text-[14px] leading-relaxed text-slate-700 sm:text-[15px]">
            {decision.summary}
          </p>
          {line.description ? (
            <p className="mt-2 max-w-[72ch] text-[13px] leading-relaxed text-slate-500">
              {line.description}
            </p>
          ) : null}
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-200 pt-4 sm:gap-x-6 sm:gap-y-4 md:grid-cols-3 lg:grid-cols-6">
          <Signal label="Lifecycle" value={pending ? 'Resolving…' : lifecycleLabel(line.lifecycle_status)} />
          <Signal label="Distributor stock" value={pending ? 'Resolving…' : stockLabel(line)} />
          <Signal label="Factory lead" value={weeks == null ? '—' : `${weeks} weeks`} />
          <Signal label="Country of origin" value={line.country_of_origin || 'Unknown'} />
          <Signal label="HTS code" value={line.hts_code || 'Unclassified'} />
          <Signal label="Estimated duty" value={tariffLabel(line)} />
        </dl>

        {(line.refdes || line.category) && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-slate-500">
            {line.refdes ? (
              <span>
                <span className="font-mono text-[10px] uppercase tracking-[0.09em] text-slate-400">Ref des </span>
                <span className="font-mono text-slate-700">{line.refdes}</span>
              </span>
            ) : null}
            {line.category ? (
              <span>
                <span className="font-mono text-[10px] uppercase tracking-[0.09em] text-slate-400">Category </span>
                {line.category}
              </span>
            ) : null}
          </div>
        )}

        <div className="grid min-w-0 gap-4 border-t border-slate-200 pt-4 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.09em] text-slate-400">
              Alternates from your AML
            </p>
            {line.aml_candidates.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {line.aml_candidates.map((mpn) => (
                  <span
                    key={mpn}
                    className="border border-emerald-200 bg-emerald-50 px-2 py-1 font-mono text-xs font-medium text-emerald-700"
                  >
                    {mpn}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-slate-400">No approved alternate listed on this line.</p>
            )}
          </div>
          <DecisionBlock
            title="Recommended alternate"
            accent={decision.recommendedAlternate ?? undefined}
            body={decision.recommendedAlternateNote}
          />
        </div>

        <DecisionBlock
          title="Why this score"
          accent={brief ? 'Analyst' : briefPending ? 'Generating' : undefined}
          body={
            brief ??
            (briefPending
              ? 'A procurement brief is being written for this line. This updates when the analyst finishes.'
              : decision.whyScore)
          }
        />

        <DecisionBlock
          title="Cost & next action"
          body={`${decision.costNote} ${decision.nextAction}`}
        />

        {(line.tariff_notes || line.entity_list_notes || line.tariff_disclaimer) && (
          <div className="space-y-1.5 border-t border-slate-200 pt-4 text-[12px] leading-relaxed text-slate-500">
            {line.tariff_notes ? <p>{line.tariff_notes}</p> : null}
            {line.entity_list_notes ? <p className="text-red-700">{line.entity_list_notes}</p> : null}
            {line.tariff_disclaimer ? <p className="text-slate-400">{line.tariff_disclaimer}</p> : null}
          </div>
        )}
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
  const risk = RISK_PRESENTATION[lineRiskLevel(line)]
  const expandable = isAtRisk(line)
  const pending = isPendingLine(line)
  const weeks = leadTimeWeeks(line)
  const avail = line.availability_status?.toLowerCase() ?? ''
  const detailId = `bom-line-detail-${line.row_index}`

  const rowClass = expandable
    ? `group cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0062ff] ${risk.row} ${expanded ? 'bg-[#eef1f5]' : ''}`
    : 'bg-white'

  return (
    <>
      <tr
        role={expandable ? 'button' : undefined}
        tabIndex={expandable ? 0 : undefined}
        aria-expanded={expandable ? expanded : undefined}
        aria-controls={expandable ? detailId : undefined}
        onClick={expandable ? onToggle : undefined}
        onKeyDown={
          expandable
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onToggle()
                }
              }
            : undefined
        }
        className={rowClass}
      >
        <td className={`px-5 py-3 ${expandable ? risk.rail : ''}`}>
          <div className="flex items-start gap-2.5">
            {expandable ? (
              <ChevronDown
                className={`mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform group-hover:text-[#0062ff] ${expanded ? 'rotate-180 text-[#0062ff]' : ''}`}
                aria-hidden
              />
            ) : (
              <span className="mt-0.5 inline-block h-3.5 w-3.5 shrink-0" aria-hidden />
            )}
            <div className="min-w-0">
              <div className="truncate font-mono text-[13px] font-medium text-slate-900">{line.mpn ?? '—'}</div>
              <div className="truncate text-[12px] text-slate-400">
                {line.manufacturer ?? 'Manufacturer unknown'}
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums text-slate-600">
          {line.quantity ?? '—'}
        </td>
        <td className="px-4 py-3">
          {pending ? (
            <Pending />
          ) : (
            <span className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.06em] text-slate-700">
              <span className={`h-1.5 w-1.5 shrink-0 ${lifecycleDot(line.lifecycle_status)}`} aria-hidden />
              {lifecycleLabel(line.lifecycle_status)}
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums">
          {pending ? (
            <Pending />
          ) : avail === 'outofstock' ? (
            <span className="font-semibold text-red-600">Out of stock</span>
          ) : avail === 'nomatch' ? (
            <span className="text-slate-400">No match</span>
          ) : (
            <span className="text-slate-700">{line.total_avail.toLocaleString()}</span>
          )}
        </td>
        <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums">
          {pending ? (
            <Pending />
          ) : weeks == null ? (
            <span className="text-slate-400">—</span>
          ) : (
            <span className={weeks > 30 ? 'font-semibold text-amber-700' : 'text-slate-600'}>{weeks}w</span>
          )}
        </td>
        <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums text-slate-600">
          {tariffLabel(line)}
        </td>
        <td className="px-5 py-3">
          {risk.muted ? (
            <span className="font-mono text-[12px] text-slate-500">{risk.label}</span>
          ) : (
            <span className={`font-mono text-[12px] font-semibold ${risk.text}`}>{risk.label}</span>
          )}
        </td>
      </tr>
      {expandable && expanded ? (
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
    const tally: Record<RiskLevel, number> = { red: 0, yellow: 0, green: 0, unknown: 0 }
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
    <div className="overflow-hidden border border-slate-200 bg-white shadow-[0_24px_48px_-30px_rgb(15_27_45_/_24%)]">
      <div className="flex flex-col gap-2.5 border-b border-slate-200 bg-[#f4f6f9] px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:px-5">
        <div className="relative min-w-0 w-full sm:max-w-xs sm:flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search part, manufacturer, ref des…"
            aria-label="Search parts"
            className="w-full border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-[13px] focus:border-[#0062ff] focus:outline-none focus:ring-1 focus:ring-[#0062ff]"
          />
        </div>
        <div className="flex max-w-full overflow-x-auto border border-slate-200 bg-white p-0.5">
          {FILTERS.map((option) => {
            const count = option === 'All' ? lines.length : counts[FILTER_LEVEL[option]]
            return (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`shrink-0 px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.06em] transition-colors sm:px-2.5 sm:text-[11px] ${
                  filter === option ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {option} <span className="tabular-nums opacity-70">{count}</span>
              </button>
            )
          })}
        </div>
        <span className="ml-auto hidden font-mono text-[11px] uppercase tracking-[0.08em] text-slate-400 lg:block">
          Expand critical &amp; watch rows
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-slate-200 bg-[#f4f6f9]">
              {['Part', 'Qty', 'Lifecycle', 'Stock', 'Lead', 'Tariff', 'Risk'].map((header) => (
                <th
                  key={header}
                  scope="col"
                  className={`px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.09em] text-slate-400 ${
                    header === 'Part' || header === 'Risk' ? 'px-5' : ''
                  } ${['Qty', 'Stock', 'Lead', 'Tariff'].includes(header) ? 'text-right' : 'text-left'}`}
                >
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
                onToggle={() =>
                  setExpanded((current) => (current === line.row_index ? null : line.row_index))
                }
              />
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-28 items-center justify-center border-t border-slate-200 text-[13px] text-slate-400">
          No parts match this view.
        </div>
      ) : null}
    </div>
  )
}
