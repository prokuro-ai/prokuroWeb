'use client'

import { useMemo, useState } from 'react'
import { appColHead, appTextBtn } from '@/components/app/chrome'
import Panel from '@/components/dashboard/Panel'
import { atRisk, mixTotal, percent, rankBoards, SITUATION_COLUMNS, TONE_VAR } from '@/lib/dashboard'
import { Link } from '@/lib/navigation'
import type { BoardTally } from '@/lib/types'

const PREVIEW = 8

export default function BoardMatrix({ boards }: { boards: BoardTally[] }) {
  const [showAll, setShowAll] = useState(false)
  const ranked = useMemo(() => rankBoards(boards), [boards])
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
              <th scope="col" className={`${appColHead} w-[7rem] px-3 py-2.5 text-right`}>
                Needs a call
              </th>
              {SITUATION_COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  title={column.label}
                  className={`${appColHead} w-[4.75rem] px-1 py-2.5 text-center`}
                >
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
                  <td className="px-3 py-3 text-right">
                    <span
                      className={`mk-data text-[14px] ${
                        board.mix.red > 0 ? 'text-mk-red' : flagged > 0 ? 'text-mk-amber' : 'text-mk-ink-subtle'
                      }`}
                    >
                      {flagged.toLocaleString()}
                    </span>
                    <span className="mk-data text-[11px] text-mk-ink-subtle"> {percent(flagged, total)}</span>
                  </td>
                  {SITUATION_COLUMNS.map((column) => {
                    const count = board.situation[column.key]
                    const quiet = count === 0 || column.tone === 'slate'
                    return (
                      <td key={column.key} className="px-1 py-3">
                        <span
                          className="mk-data block text-center text-[13px]"
                          style={{ color: quiet ? (count === 0 ? 'var(--mk-line-strong)' : 'var(--mk-ink)') : TONE_VAR[column.tone] }}
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
