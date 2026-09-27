import Panel from '@/components/dashboard/Panel'
import { percent, SITUATION_COLUMNS, TONE_VAR } from '@/lib/dashboard'
import { plural } from '@/lib/format'
import type { Situation } from '@/lib/types'

export default function SituationList({ situation, scored }: { situation: Situation; scored: number }) {
  return (
    <Panel title="What is wrong" detail={`Share of ${plural(scored, 'scored part')}`}>
      <ul>
        {SITUATION_COLUMNS.map((column) => {
          const count = situation[column.key]
          const share = scored > 0 ? (count / scored) * 100 : 0
          return (
            <li
              key={column.key}
              className="grid grid-cols-[minmax(0,1fr)_minmax(4rem,8rem)_3.25rem_2.75rem] items-center gap-3 border-b border-mk-line/70 px-4 py-2.5 last:border-b-0 mk:px-5"
            >
              <span className={`truncate text-[13px] ${count > 0 ? 'text-mk-ink' : 'text-mk-ink-subtle'}`}>
                {column.label}
              </span>
              <span className="block h-1.5 overflow-hidden rounded-full bg-mk-raised-2" aria-hidden>
                {count > 0 ? (
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${Math.max(share, 2)}%`, background: TONE_VAR[column.tone] }}
                  />
                ) : null}
              </span>
              <span className={`mk-data text-right text-[13px] ${count > 0 ? 'text-mk-ink' : 'text-mk-ink-subtle'}`}>
                {count.toLocaleString()}
              </span>
              <span className="mk-data text-right text-[12px] text-mk-ink-subtle">{percent(count, scored)}</span>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
