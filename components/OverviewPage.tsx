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
import { lineRiskLevel } from '@/lib/risk'
import type { FlaggedLineItem } from '@/lib/types'

type GroupBy = 'job' | 'bom'

function lineHref(item: FlaggedLineItem): string {
  return `/bom/${encodeURIComponent(item.bomId)}?line=${item.line.row_index}`
}

function OverviewView() {
  const router = useRouter()
  const { boms, loading: bomsLoading, error: bomsError } = useBoms()
  const { items, loading: flaggedLoading, error: flaggedError } = useFlaggedLines()
  const [groupBy, setGroupBy] = useState<GroupBy>('job')
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

  const statusLine = loading
    ? null
    : boms.length === 0
      ? null
      : items.length === 0
        ? `${boms.length} BOM${boms.length === 1 ? '' : 's'} · nothing needs a call`
        : `${boms.length} BOM${boms.length === 1 ? '' : 's'} · ${items.length} part${items.length === 1 ? '' : 's'} need a call`

  return (
    <div className={appPage}>
      <PageHeader
        title="What to do this week"
        description={statusLine}
        actions={
          items.length > 0 ? (
            <div className="flex overflow-hidden rounded-[8px] border border-mk-line bg-mk-canvas p-0.5">
              {(['job', 'bom'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setGroupBy(option)}
                  className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    groupBy === option ? 'bg-mk-ink text-mk-canvas' : 'text-mk-ink-muted hover:text-mk-ink'
                  }`}
                >
                  {option === 'job' ? 'By job' : 'By BOM'}
                </button>
              ))}
            </div>
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
        ) : items.length === 0 ? (
          <EmptyState
            title="No parts need a call this week"
            description="Open a BOM if you want to scan every line."
            action={
              <button type="button" onClick={() => router.push('/boms')} className={appPrimaryBtn}>
                Open BOMs
              </button>
            }
          />
        ) : (
          <div className="space-y-8">
            {groups.map((group) => {
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
                          meta={groupBy === 'job' ? item.bomName : item.line.refdes ?? undefined}
                          chips={lineFactChips(item.line)}
                          href={lineHref(item)}
                        />
                      ))}
                    </div>
                  ) : null}
                </section>
              )
            })}
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
