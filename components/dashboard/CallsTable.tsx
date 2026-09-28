'use client'

import { useMemo, useState } from 'react'
import { appColHead, appTextBtn } from '@/components/app/chrome'
import Panel from '@/components/dashboard/Panel'
import { leadLabel, lineStatusLabel, riskTone, stockHot, stockLabel } from '@/lib/bomLineDisplay'
import { BUYER_JOB_LABEL, BUYER_JOB_ORDER, buyerJob } from '@/lib/buyerJob'
import { decisionHeadline } from '@/lib/decision'
import { plural } from '@/lib/format'
import { Link } from '@/lib/navigation'
import { leadTimeWeeks, lifecycleLabel, lineRiskLevel, stillLookingUpLabel } from '@/lib/risk'
import type { FlaggedLineItem } from '@/lib/types'

type GroupBy = 'severity' | 'job' | 'bom'

const GROUP_OPTIONS: { id: GroupBy; label: string }[] = [
  { id: 'severity', label: 'Worst first' },
  { id: 'job', label: 'By job' },
  { id: 'bom', label: 'By BOM' },
]

const cols = 'mk:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_4.5rem_6.5rem_4rem_5.5rem]'

type Group = { key: string; label: string | null; rows: FlaggedLineItem[] }

function groupCalls(items: FlaggedLineItem[], groupBy: GroupBy): Group[] {
  if (groupBy === 'severity') return [{ key: 'severity', label: null, rows: items }]
  if (groupBy === 'bom') {
    const byBom = new Map<string, FlaggedLineItem[]>()
    for (const item of items) byBom.set(item.bomId, [...(byBom.get(item.bomId) ?? []), item])
    return [...byBom.entries()].map(([id, rows]) => ({ key: id, label: rows[0].bomName, rows }))
  }
  return BUYER_JOB_ORDER.map((job) => ({
    key: job,
    label: BUYER_JOB_LABEL[job],
    rows: items.filter((item) => buyerJob(item.line) === job),
  })).filter((group) => group.rows.length > 0)
}

function CallRow({ item, showBom }: { item: FlaggedLineItem; showBom: boolean }) {
  const { line } = item
  const risk = lineRiskLevel(line)
  const life = lifecycleLabel(line.lifecycle_status)
  const weeks = leadTimeWeeks(line)

  return (
    <Link
      href={`/bom/${encodeURIComponent(item.bomId)}?line=${item.line.row_index}`}
      className={`group grid grid-cols-1 items-center gap-2 border-b border-mk-line px-4 py-3.5 text-[13px] last:border-b-0 hover:bg-mk-raised/70 mk:gap-4 mk:px-5 mk:py-3 ${cols}`}
    >
      <span className="min-w-0">
        <span className="line-clamp-2 text-[14px] font-medium leading-snug text-mk-ink group-hover:text-mk-accent">
          {decisionHeadline(line)}
        </span>
        <span className="mt-1 block truncate text-[12px] text-mk-ink-subtle">
          {line.mpn || '—'}
          {line.manufacturer ? ` · ${line.manufacturer}` : null}
        </span>
      </span>
      <span className="min-w-0 truncate text-mk-ink-muted">{showBom ? item.bomName : line.refdes || '—'}</span>
      <span className={life === 'EOL' || life === 'NRND' ? 'text-mk-red' : 'text-mk-ink-muted'}>
        <span className="text-mk-ink-subtle mk:hidden">Lifecycle </span>
        {life}
      </span>
      <span className={`tabular-nums mk:text-right ${stockHot(line) ? 'text-mk-red' : 'text-mk-ink-muted'}`}>
        <span className="text-mk-ink-subtle mk:hidden">Stock </span>
        {stockLabel(line)}
      </span>
      <span className={`tabular-nums mk:text-right ${weeks != null && weeks > 26 ? 'text-mk-amber' : 'text-mk-ink-muted'}`}>
        <span className="text-mk-ink-subtle mk:hidden">Lead </span>
        {leadLabel(line)}
      </span>
      <span className={`font-medium ${riskTone(risk)}`}>{lineStatusLabel(line)}</span>
    </Link>
  )
}

export default function CallsTable({
  items,
  total,
  pending,
  noMatch,
}: {
  items: FlaggedLineItem[]
  total: number
  pending: number
  noMatch: number
}) {
  const [groupBy, setGroupBy] = useState<GroupBy>('severity')
  const groups = useMemo(() => groupCalls(items, groupBy), [items, groupBy])

  const count =
    items.length === 0
      ? undefined
      : total > items.length
        ? `${items.length} of ${total.toLocaleString()}`
        : items.length.toLocaleString()

  const empty =
    pending > 0
      ? `${stillLookingUpLabel(pending)}. ${pending === 1 ? 'It is' : 'They are'} not scored yet.`
      : noMatch > 0
        ? `Nothing scored needs a call. ${plural(noMatch, 'part')} had no catalog match.`
        : 'Nothing needs a call this week.'

  return (
    <Panel
      title="Calls this week"
      count={count}
      actions={
        items.length > 0 ? (
          <nav className="flex w-full max-w-full items-center rounded-[8px] bg-mk-raised p-0.5 sm:w-fit" aria-label="Group calls">
            {GROUP_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setGroupBy(option.id)}
                aria-pressed={groupBy === option.id}
                className={`flex-1 rounded-[6px] px-2 py-1 text-center text-[12px] font-medium transition-colors sm:flex-none sm:px-2.5 ${
                  groupBy === option.id
                    ? 'bg-mk-canvas text-mk-ink shadow-[0_1px_2px_rgb(15_27_45/10%)]'
                    : 'text-mk-ink-subtle hover:text-mk-ink'
                }`}
              >
                {option.label}
              </button>
            ))}
          </nav>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <p className="text-[13px] text-mk-ink-muted">{empty}</p>
          <Link href="/boms" className={appTextBtn}>
            Open BOMs
          </Link>
        </div>
      ) : (
        <>
          <div className={`hidden gap-4 border-b border-mk-line px-5 py-2.5 mk:grid ${cols}`}>
            <span className={appColHead}>Call</span>
            <span className={appColHead}>{groupBy === 'bom' ? 'Ref' : 'BOM'}</span>
            <span className={appColHead}>Lifecycle</span>
            <span className={`${appColHead} text-right`}>Stock</span>
            <span className={`${appColHead} text-right`}>Lead</span>
            <span className={appColHead}>Risk</span>
          </div>
          {groups.map((group) => (
            <div key={group.key}>
              {group.label ? (
                <div className="flex items-baseline gap-2 border-b border-mk-line bg-mk-raised px-4 py-2 mk:px-5">
                  <span className="text-[12px] font-semibold text-mk-ink">{group.label}</span>
                  <span className="text-[12px] tabular-nums text-mk-ink-subtle">{group.rows.length}</span>
                </div>
              ) : null}
              {group.rows.map((item) => (
                <CallRow key={`${item.bomId}-${item.line.row_index}`} item={item} showBom={groupBy !== 'bom'} />
              ))}
            </div>
          ))}
        </>
      )}
    </Panel>
  )
}
