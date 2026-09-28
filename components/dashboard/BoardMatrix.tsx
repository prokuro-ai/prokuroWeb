'use client'

import { useMemo, useState } from 'react'
import { appColHead, appTextBtn } from '@/components/app/chrome'
import Panel from '@/components/dashboard/Panel'
import {
  atRisk,
  heatFill,
  MIX_SEGMENTS,
  mixTotal,
  percent,
  rankBoards,
  SITUATION_COLUMNS,
  TONE_VAR,
  type Tone,
} from '@/lib/dashboard'
import { Link } from '@/lib/navigation'
import type { BoardTally, Situation } from '@/lib/types'

const PREVIEW = 8

/** Tone darkened toward ink so it stays readable on its own tint. */
const INK_ON_TINT: Record<Tone, string> = Object.fromEntries(
  Object.entries(TONE_VAR).map(([tone, color]) => [tone, `color-mix(in srgb, ${color} 70%, var(--mk-ink))`]),
) as Record<Tone, string>

export default function BoardMatrix({ boards }: { boards: BoardTally[] }) {
  const [showAll, setShowAll] = useState(false)
  const ranked = useMemo(() => rankBoards(boards), [boards])
  const columnMax = useMemo(() => {
    const max = {} as Record<keyof Situation, number>
    for (const column of SITUATION_COLUMNS) {
      max[column.key] = Math.max(0, ...boards.map((board) => board.situation[column.key]))
    }
    return max
  }, [boards])
  const visible = showAll ? ranked : ranked.slice(0, PREVIEW)

  return (
    <Panel
      title="Boards"
      count={ranked.length.toLocaleString()}
      footer={
        ranked.length > PREVIEW ? (
          <button type="button" onClick={() => setShowAll((open) => !open)} className={appTextBtn}>
            {showAll ? 'Show fewer' : `Show all ${ranked.length}`}
          </button>
        ) : undefined
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-mk-line">
              <th scope="col" className={`${appColHead} px-4 py-2.5 mk:px-5`}>
                BOM
              </th>
              <th scope="col" className={`${appColHead} w-[13rem] px-3 py-2.5`}>
                Needs a call
              </th>
              {SITUATION_COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  title={column.label}
                  className={`${appColHead} w-[4.75rem] px-1 py-2.5 text-center`}
                >
                  <span
                    className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
                    style={{ background: TONE_VAR[column.tone] }}
                    aria-hidden
                  />
                  {column.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((board) => {
              const total = mixTotal(board.mix)
              const flagged = atRisk(board.mix)
              return (
                <tr key={board.bomId} className="border-b border-mk-line/70 last:border-b-0 hover:bg-mk-raised/60">
                  <td className="max-w-0 px-4 py-2.5 mk:px-5">
                    <Link
                      href={`/bom/${encodeURIComponent(board.bomId)}`}
                      className="block truncate text-[14px] font-medium text-mk-ink hover:text-mk-accent"
                    >
                      {board.bomName}
                    </Link>
                    <span className="mk-data mt-0.5 block text-[12px] text-mk-ink-subtle">
                      {total.toLocaleString()} parts
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-3">
                      <span className="flex h-2 flex-1 gap-px overflow-hidden rounded-full bg-mk-raised-2" aria-hidden>
                        {total > 0
                          ? MIX_SEGMENTS.filter((s) => board.mix[s.key] > 0).map((segment) => (
                              <span
                                key={segment.key}
                                style={{
                                  flexGrow: board.mix[segment.key],
                                  flexBasis: 0,
                                  background: TONE_VAR[segment.tone],
                                }}
                              />
                            ))
                          : null}
                      </span>
                      <span className="w-[4.75rem] shrink-0 text-right">
                        <span
                          className={`mk-data text-[14px] ${
                            board.mix.red > 0 ? 'text-mk-red' : flagged > 0 ? 'text-mk-amber' : 'text-mk-ink-subtle'
                          }`}
                        >
                          {flagged.toLocaleString()}
                        </span>
                        <span className="mk-data text-[11px] text-mk-ink-subtle"> {percent(flagged, total)}</span>
                      </span>
                    </span>
                  </td>
                  {SITUATION_COLUMNS.map((column) => {
                    const count = board.situation[column.key]
                    return (
                      <td key={column.key} className="px-1 py-1.5">
                        <span
                          className={`mk-data block rounded-[6px] py-1.5 text-center text-[13px] ${
                            count === 0 ? 'text-mk-line-strong' : column.tone === 'slate' ? 'text-mk-ink' : 'font-medium'
                          }`}
                          style={{
                            background: heatFill(column.tone, count, columnMax[column.key]),
                            color: count > 0 && column.tone !== 'slate' ? INK_ON_TINT[column.tone] : undefined,
                          }}
                        >
                          {count > 0 ? count.toLocaleString() : '·'}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
