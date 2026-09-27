'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import DecisionRow from '@/components/app/DecisionRow'
import EmptyState from '@/components/app/EmptyState'
import PageHeader from '@/components/app/PageHeader'
import PageLoading from '@/components/app/PageLoading'
import { appPage, appPrimaryBtn, appSection, appSheet } from '@/components/app/chrome'
import { useBoms } from '@/hooks/use-boms'
import { useFlaggedLines } from '@/hooks/use-flagged-lines'
import { BUYER_JOB_LABEL, BUYER_JOB_ORDER, buyerJob, lineFactChips } from '@/lib/buyerJob'
import { decisionHeadline } from '@/lib/decision'
import { Link } from '@/lib/navigation'
import { accountUnscored, bomRiskBand, lineRiskLevel, stillLookingUpLabel } from '@/lib/risk'
import type { AccountSituation, BomSummary, FlaggedLineItem } from '@/lib/types'

type GroupBy = 'severity' | 'job' | 'bom'

function lineHref(item: FlaggedLineItem): string {
  return `/bom/${encodeURIComponent(item.bomId)}?line=${item.line.row_index}`
}

function boardsAtRisk(boms: BomSummary[]): BomSummary[] {
  return boms
    .filter((bom) => bom.atRiskCount > 0)
    .sort((a, b) => {
      const shareA = a.lineCount > 0 ? a.atRiskCount / a.lineCount : 1
      const shareB = b.lineCount > 0 ? b.atRiskCount / b.lineCount : 1
      return shareB - shareA || b.atRiskCount - a.atRiskCount || a.name.localeCompare(b.name)
    })
}

const SITUATION_ROWS: { key: keyof AccountSituation; label: string }[] = [
  { key: 'outOfStock', label: 'Out of stock' },
  { key: 'longLead', label: 'Lead over 26 weeks' },
  { key: 'nrnd', label: 'Not for new designs' },
  { key: 'discontinued', label: 'Discontinued' },
  { key: 'noAlternate', label: 'No alternate on the file' },
  { key: 'duty', label: 'Duty on the line' },
  { key: 'entityList', label: 'Entity list hit' },
]

function OverviewView() {
  const router = useRouter()
  const { boms, loading: bomsLoading, error: bomsError } = useBoms()
  const {
    items,
    total: flaggedTotal,
    situation,
    loading: flaggedLoading,
    error: flaggedError,
  } = useFlaggedLines()
  const [groupBy, setGroupBy] = useState<GroupBy>('severity')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  useEffect(() => {
    setCollapsed(new Set())
  }, [groupBy])

  function toggleGroup(key: string) {
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const loading = bomsLoading || flaggedLoading
  const error = flaggedError ?? bomsError

  const groups = useMemo(() => {
    if (groupBy === 'severity') {
      return [{ key: 'severity', label: 'Worst first', rows: items }]
    }
    if (groupBy === 'bom') {
      const byBom = new Map<string, FlaggedLineItem[]>()
      for (const item of items) {
        const list = byBom.get(item.bomId) ?? []
        list.push(item)
        byBom.set(item.bomId, list)
      }
      return [...byBom.entries()].map(([id, rows]) => ({
        key: id,
        label: rows[0]?.bomName ?? id,
        rows,
      }))
    }

    return BUYER_JOB_ORDER.map((job) => ({
      key: job,
      label: BUYER_JOB_LABEL[job],
      rows: items.filter((item) => buyerJob(item.line) === job),
    })).filter((group) => group.rows.length > 0)
  }, [items, groupBy])

  const boards = useMemo(() => boardsAtRisk(boms), [boms])
  const situationRows = SITUATION_ROWS.filter((row) => situation[row.key] > 0)
  const { pending, noMatch } = accountUnscored(boms)
  const callsLabel =
    items.length === 0
      ? 'nothing needs a call'
      : flaggedTotal > items.length
        ? `showing ${items.length} of ${flaggedTotal} parts that need a call`
        : `${items.length} part${items.length === 1 ? '' : 's'} need a call`

  const statusLine =
    loading || boms.length === 0
      ? null
      : [
          `${boms.length} BOM${boms.length === 1 ? '' : 's'}`,
          callsLabel,
          ...(pending > 0 ? [stillLookingUpLabel(pending)] : []),
          ...(noMatch > 0 ? [`${noMatch.toLocaleString()} with no catalog match`] : []),
        ].join(' · ')

  return (
    <div className={appPage}>
      <PageHeader
        title="What to do this week"
        description={statusLine}
        actions={
          items.length > 0 ? (
            <nav className="flex items-center gap-x-5" aria-label="Group this week">
              {([
                { id: 'severity', label: 'By severity' },
                { id: 'job', label: 'By job' },
                { id: 'bom', label: 'By BOM' },
              ] as const).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setGroupBy(option.id)}
                  className={`pb-0.5 text-[12px] transition-colors ${
                    groupBy === option.id
                      ? 'border-b border-mk-ink font-semibold text-mk-ink'
                      : 'text-mk-ink-subtle hover:text-mk-ink'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </nav>
          ) : null
        }
      />

      <div className={appSection}>
        {loading ? (
          <PageLoading />
        ) : error ? (
          <EmptyState
            title="Could not load this week’s calls"
            description={error}
            action={
              <button type="button" onClick={() => window.location.reload()} className={appPrimaryBtn}>
                Retry
              </button>
            }
          />
        ) : boms.length === 0 ? (
          <EmptyState
            title="No BOMs yet"
            description="Add a BOM on the BOMs page and we’ll tell you what to fix first."
            action={
              <button type="button" onClick={() => router.push('/boms')} className={appPrimaryBtn}>
                Open BOMs
              </button>
            }
          />
        ) : (
          <div className="space-y-8">
            {boards.length > 0 ? (
              <section>
                <h2 className="mk-app-heading mb-2 text-mk-ink">Boards</h2>
                <div className={appSheet}>
                  {boards.map((bom) => {
                    const critical = bomRiskBand(bom) === 'Critical'
                    return (
                      <Link
                        key={bom.id}
                        href={`/bom/${encodeURIComponent(bom.id)}`}
                        className="relative flex items-baseline justify-between gap-4 border-b border-mk-line/60 bg-mk-canvas px-4 py-3 transition-colors last:border-b-0 hover:bg-mk-raised/80 mk:px-5 mk:py-4"
                      >
                        <span
                          className="absolute inset-y-0 left-0 w-0.5"
                          style={{ background: critical ? 'var(--mk-red)' : 'transparent' }}
                          aria-hidden
                        />
                        <span className="mk-app-heading min-w-0 truncate text-mk-ink">{bom.name}</span>
                        <span className="mk-data shrink-0 text-mk-ink">
                          {bom.atRiskCount} of {bom.lineCount}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </section>
            ) : null}

            {situationRows.length > 0 ? (
              <div className={appSheet}>
                {situationRows.map((row) => (
                  <div
                    key={row.key}
                    className="flex items-baseline justify-between gap-4 border-b border-mk-line/60 px-4 py-3 last:border-b-0 mk:px-5"
                  >
                    <span className="text-[13px] text-mk-ink">{row.label}</span>
                    <span className="mk-data text-mk-ink">{situation[row.key].toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {items.length === 0 ? (
              <EmptyState
                title={pending > 0 ? 'Nothing scored needs a call yet' : 'No parts need a call this week'}
                description={
                  pending > 0
                    ? `${stillLookingUpLabel(pending)}. ${pending === 1 ? 'It is' : 'They are'} not scored yet. Open a BOM to watch them resolve.`
                    : noMatch > 0
                      ? `${noMatch.toLocaleString()} line${noMatch === 1 ? '' : 's'} had no catalog match. Open a BOM to see which.`
                      : 'Open a BOM if you want to scan every line.'
                }
                action={
                  <button type="button" onClick={() => router.push('/boms')} className={appPrimaryBtn}>
                    Open BOMs
                  </button>
                }
              />
            ) : null}

            {items.length > 0
              ? groups.map((group) => {
              const open = !collapsed.has(group.key)
              return (
                <section key={group.key}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    aria-expanded={open}
                    className="group mb-2 flex w-full items-center justify-between gap-3 text-left"
                  >
                    <h2 className="mk-app-heading text-mk-ink">{group.label}</h2>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-mk-ink-subtle transition-colors transition-transform group-hover:text-mk-ink ${
                        open ? 'rotate-180' : ''
                      }`}
                      aria-hidden
                    />
                  </button>
                  {open ? (
                    <div className={appSheet}>
                      {group.rows.map((item) => (
                        <DecisionRow
                          key={`${item.bomId}-${item.line.row_index}`}
                          risk={lineRiskLevel(item.line)}
                          headline={decisionHeadline(item.line)}
                          mpn={item.line.mpn}
                          meta={groupBy === 'bom' ? item.line.refdes ?? undefined : item.bomName}
                          chips={lineFactChips(item.line)}
                          href={lineHref(item)}
                        />
                      ))}
                    </div>
                  ) : null}
                </section>
              )
            })
              : null}
          </div>
        )}
      </div>
    </div>
  )
}

export default function OverviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab')

  useEffect(() => {
    if (tab === 'boms') router.replace('/boms')
    if (tab === 'purchasing') router.replace('/purchasing')
  }, [tab, router])

  if (tab === 'boms' || tab === 'purchasing') return null

  return <OverviewView />
}
