import { appSheet } from '@/components/app/chrome'
import { atRisk, MIX_SEGMENTS, mixTotal, percent, scoredTotal, SITUATION_COLUMNS, TONE_VAR, type Tone } from '@/lib/dashboard'
import type { LineTally } from '@/lib/types'

/** Zero reads as subtle. Slate counts are facts, not warnings, so they stay ink. */
function countColor(tone: Tone, count: number): string {
  if (count === 0) return 'var(--mk-ink-subtle)'
  return tone === 'slate' || tone === 'pending' ? 'var(--mk-ink)' : TONE_VAR[tone]
}

/** Account readout, on the same sheet as the boards and calls below it. */
export default function AccountCard({ account }: { account: LineTally }) {
  const { mix, situation } = account
  const total = mixTotal(mix)
  const flagged = atRisk(mix)
  const scored = scoredTotal(mix)

  return (
    <section aria-label="Account" className={appSheet}>
      <div className="flex flex-col gap-3 border-b border-mk-line px-4 py-4 mk:flex-row mk:items-baseline mk:justify-between mk:gap-8 mk:px-5">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className={`text-[22px] font-semibold tabular-nums leading-none ${flagged > 0 ? 'text-mk-red' : 'text-mk-green'}`}>
            {flagged.toLocaleString()}
          </span>
          <span className="text-[14px] text-mk-ink">{flagged === 1 ? 'part needs' : 'parts need'} a call</span>
          <span className="text-[13px] tabular-nums text-mk-ink-subtle">
            {percent(flagged, total)} of {total.toLocaleString()}
          </span>
        </p>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
          {MIX_SEGMENTS.map((segment) => (
            <span key={segment.key} className="text-mk-ink-subtle">
              {segment.label}{' '}
              <span className="font-medium tabular-nums" style={{ color: countColor(segment.tone, mix[segment.key]) }}>
                {mix[segment.key].toLocaleString()}
              </span>
            </span>
          ))}
        </p>
      </div>

      {scored > 0 ? (
        <ul>
          {SITUATION_COLUMNS.map((column) => {
            const count = situation[column.key]
            return (
              <li
                key={column.key}
                title={`${percent(count, scored)} of ${scored.toLocaleString()} scored parts`}
                className="flex items-baseline justify-between gap-4 border-b border-mk-line px-4 py-2.5 last:border-b-0 mk:px-5"
              >
                <span className="min-w-0 text-[13px] text-mk-ink-muted">{column.label}</span>
                <span className="shrink-0 text-[14px] font-medium tabular-nums" style={{ color: countColor(column.tone, count) }}>
                  {count.toLocaleString()}
                </span>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
