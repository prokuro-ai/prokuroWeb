'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Search } from 'lucide-react'
import DecisionRow from '@/components/app/DecisionRow'
import { appSheet } from '@/components/app/chrome'
import { analystBrief, buildLineDecision, decisionHeadline } from '@/lib/decision'
import { lineFactChips } from '@/lib/buyerJob'
import {
  isAtRisk,
  isPendingLine,
  leadTimeWeeks,
  lifecycleLabel,
  lineRiskLevel,
  tariffLabel,
} from '@/lib/risk'
import type { AnalyzedLine, RiskLevel } from '@/lib/types'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'red', label: 'Needs a call' },
  { id: 'yellow', label: 'Watch' },
  { id: 'green', label: 'Fine' },
  { id: 'unknown', label: 'Unmatched' },
] as const

type FilterId = (typeof FILTERS)[number]['id']

function stockLabel(line: AnalyzedLine): string {
  const avail = line.availability_status?.toLowerCase() ?? ''
  if (avail === 'outofstock') return 'Out of stock'
  if (avail === 'nomatch') return 'No distributor match'
  return `${line.total_avail.toLocaleString()} units`
}

function SpecCell({
  label,
  value,
  hot,
}: {
  label: string
  value: string
  hot?: boolean
}) {
  return (
    <div className="bg-mk-canvas px-4 py-3.5">
      <dt className="mk-eyebrow">{label}</dt>
      <dd className="mk-data mt-1.5" style={{ color: hot ? 'var(--mk-red)' : 'var(--mk-ink)' }}>
        {value}
      </dd>
    </div>
  )
}

function LineDetail({ line }: { line: AnalyzedLine }) {
  const pending = isPendingLine(line)
  const weeks = leadTimeWeeks(line)
  const decision = buildLineDecision(line)
  const brief = analystBrief(line)
  const life = lifecycleLabel(line.lifecycle_status)
  const duty = tariffLabel(line)
  const alternate = line.aml_candidates[0] ?? null

  return (
    <div className="space-y-5">
      {line.description ? (
        <p className="max-w-[72ch] text-[13px] leading-relaxed text-mk-ink-muted">{line.description}</p>
      ) : null}

      <dl className="grid grid-cols-2 gap-px border border-mk-line bg-mk-line sm:grid-cols-4">
        <SpecCell label="Lifecycle" value={pending ? 'Looking up' : life} hot={life === 'EOL' || life === 'NRND'} />
        <SpecCell
          label="Stock"
          value={pending ? 'Looking up' : stockLabel(line)}
          hot={!pending && line.availability_status?.toLowerCase() === 'outofstock'}
        />
        <SpecCell
          label="Lead"
          value={weeks == null ? '—' : `${weeks} weeks`}
          hot={weeks != null && weeks > 30}
        />
        <SpecCell label="Duty" value={duty} hot={duty !== '-'} />
        {line.country_of_origin ? <SpecCell label="Origin" value={line.country_of_origin} /> : null}
        {line.hts_code ? <SpecCell label="HTS" value={line.hts_code} /> : null}
      </dl>

      {alternate ? (
        <div className="border border-mk-line bg-mk-canvas px-5 py-4">
          <p className="mk-eyebrow">Approved alternate</p>
          <p className="mk-data mt-2 text-mk-ink">{alternate}</p>
          {line.aml_candidates.length > 1 ? (
            <p className="mt-2 text-[13px] text-mk-ink-muted">
              Also listed: {line.aml_candidates.slice(1).join(', ')}
            </p>
          ) : null}
        </div>
      ) : null}

      {brief ? <p className="max-w-[72ch] text-[14px] leading-relaxed text-mk-ink">{brief}</p> : null}

      {(isAtRisk(line) || isPendingLine(line)) && decision.nextAction ? (
        <div className="flex items-start gap-3 border-t border-mk-line pt-4">
          <ArrowRight size={15} className="mt-0.5 shrink-0 text-mk-accent" aria-hidden />
          <p className="text-[14px] leading-relaxed text-mk-ink">{decision.nextAction}</p>
        </div>
      ) : null}

      {(line.tariff_notes || line.entity_list_notes || line.tariff_disclaimer) && (
        <div className="space-y-1.5 text-[12px] leading-relaxed text-mk-ink-subtle">
          {line.tariff_notes ? <p>{line.tariff_notes}</p> : null}
          {line.entity_list_notes ? <p className="text-mk-red">{line.entity_list_notes}</p> : null}
          {line.tariff_disclaimer ? <p>{line.tariff_disclaimer}</p> : null}
        </div>
      )}
    </div>
  )
}

export default function BomPartsTable({
  lines,
  initialExpanded = null,
}: {
  lines: AnalyzedLine[]
  initialExpanded?: number | null
}) {
  const [expanded, setExpanded] = useState<number | null>(initialExpanded)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterId>('all')

  useEffect(() => {
    if (initialExpanded == null) return
    setExpanded(initialExpanded)
    const id = `bom-line-${initialExpanded}`
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'center' })
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
      <div className="flex flex-col gap-2.5 border-b border-mk-line bg-mk-raised px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:px-5">
        <div className="relative min-w-0 w-full sm:max-w-xs sm:flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mk-ink-subtle" aria-hidden />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find a part"
            aria-label="Search parts"
            className="w-full border border-mk-line bg-mk-canvas py-1.5 pl-8 pr-3 text-[13px] focus:border-mk-accent focus:outline-none"
          />
        </div>
        <div className="flex max-w-full overflow-x-auto border border-mk-line bg-mk-canvas p-0.5">
          {FILTERS.map((option) => {
            const count = option.id === 'all' ? lines.length : counts[option.id]
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                className={`shrink-0 px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  filter === option.id ? 'bg-mk-ink text-mk-canvas' : 'text-mk-ink-muted hover:text-mk-ink'
                }`}
              >
                {option.label} <span className="tabular-nums opacity-70">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {filtered.map((line) => (
        <div key={line.row_index} id={`bom-line-${line.row_index}`}>
          <DecisionRow
            risk={lineRiskLevel(line)}
            headline={decisionHeadline(line)}
            mpn={line.mpn}
            meta={line.refdes ?? line.manufacturer ?? undefined}
            chips={lineFactChips(line)}
            expanded={expanded === line.row_index}
            onToggle={() =>
              setExpanded((current) => (current === line.row_index ? null : line.row_index))
            }
          >
            <LineDetail line={line} />
          </DecisionRow>
        </div>
      ))}

      {filtered.length === 0 ? (
        <div className="flex h-28 items-center justify-center text-[13px] text-mk-ink-subtle">
          No parts match this view.
        </div>
      ) : null}
    </div>
  )
}
