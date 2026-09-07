'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DecisionRow from '@/components/app/DecisionRow'
import EmptyState from '@/components/app/EmptyState'
import PageHeader from '@/components/app/PageHeader'
import { appPage, appPrimaryBtn, appSheet } from '@/components/app/chrome'
import { useBoms } from '@/hooks/use-boms'
import { useFlaggedLines } from '@/hooks/use-flagged-lines'
import { BUYER_JOB_LABEL, BUYER_JOB_ORDER, buyerJob, lineFactChips } from '@/lib/buyerJob'
import { decisionHeadline } from '@/lib/decision'
import { lineRiskLevel } from '@/lib/risk'
import type { FlaggedLineItem } from '@/lib/types'

type GroupBy = 'job' | 'board'

function lineHref(item: FlaggedLineItem): string {
  return `/bom/${encodeURIComponent(item.bomId)}?line=${item.line.row_index}`
}

function OverviewView() {
  const router = useRouter()
  const { boms, loading: bomsLoading, error: bomsError } = useBoms()
  const { items, loading: flaggedLoading, error: flaggedError } = useFlaggedLines()
  const [groupBy, setGroupBy] = useState<GroupBy>('job')

  const loading = bomsLoading || flaggedLoading
  const error = flaggedError ?? bomsError

  const groups = useMemo(() => {
    if (groupBy === 'board') {
      const byBoard = new Map<string, FlaggedLineItem[]>()
      for (const item of items) {
        const list = byBoard.get(item.bomId) ?? []
        list.push(item)
        byBoard.set(item.bomId, list)
      }
      return [...byBoard.entries()].map(([id, rows]) => ({
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
        ? `${boms.length} board${boms.length === 1 ? '' : 's'} · nothing needs a call`
        : `${boms.length} board${boms.length === 1 ? '' : 's'} · ${items.length} part${items.length === 1 ? '' : 's'} need a call`

  return (
    <div className={appPage}>
      <PageHeader
        kicker="This week"
        title="What to do this week"
        description={statusLine}
        actions={
          items.length > 0 ? (
            <div className="flex overflow-hidden rounded-[8px] border border-mk-line bg-mk-canvas p-0.5">
              {(['job', 'board'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setGroupBy(option)}
                  className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    groupBy === option ? 'bg-mk-ink text-mk-canvas' : 'text-mk-ink-muted hover:text-mk-ink'
                  }`}
                >
                  {option === 'job' ? 'By job' : 'By board'}
                </button>
              ))}
            </div>
          ) : null
        }
      />

      <div className="mx-auto max-w-[1180px] px-6 py-8">
        {loading ? (
          <div className={`${appSheet} space-y-0`}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse border-b border-mk-line last:border-b-0" />
            ))}
          </div>
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
            title="Drop a board list in"
            description="We’ll tell you what to fix first."
            action={
              <button type="button" onClick={() => router.push('/boms')} className={appPrimaryBtn}>
                Upload a board
              </button>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No parts need a call this week"
            description="Open a board if you want to scan every line."
            action={
              <button type="button" onClick={() => router.push('/boms')} className={appPrimaryBtn}>
                Open boards
              </button>
            }
          />
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.key}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h2 className="font-mk-display text-[22px] text-mk-ink">{group.label}</h2>
                  <span className="mk-eyebrow">
                    {group.rows.length} {group.rows.length === 1 ? 'part' : 'parts'}
                  </span>
                </div>
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
              </section>
            ))}
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
