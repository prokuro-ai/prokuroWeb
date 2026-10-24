import { appColHead, appSheet } from '@/components/app/chrome'
import { atRisk, MIX_SEGMENTS, mixTotal, percent, scoredTotal, SITUATION_COLUMNS, TONE_VAR, type Tone } from '@/lib/dashboard'
import type { LineTally, RiskMix } from '@/lib/types'

/** Zero reads as subtle. Slate counts are facts, not warnings, so they stay ink. */
function countColor(tone: Tone, count: number): string {
  if (count === 0) return 'var(--mk-ink-subtle)'
  return tone === 'slate' || tone === 'pending' ? 'var(--mk-ink)' : TONE_VAR[tone]
}

/** Same rule as the Needs a call column: red only when something is critical. */
function callTone(mix: RiskMix, flagged: number): string {
  if (mix.red > 0) return 'text-mk-red'
  if (flagged > 0) return 'text-mk-amber'
  return 'text-mk-ink-subtle'
}

/** Account readout, on the same sheet as the boards and calls below it. */
export default function AccountCard({ account }: { account: LineTally }) {
  const { mix, situation } = account
  const total = mixTotal(mix)
  const flagged = atRisk(mix)
  const scored = scoredTotal(mix)

  return (
    <section aria-label="Account" className={appSheet}>
      <div className="flex flex-col gap-5 px-4 py-4 mk:flex-row mk:items-end mk:justify-between mk:gap-10 mk:px-5 mk:py-5">
        <p className="shrink-0">
          <span className="flex items-baseline gap-x-2">
            <span className={`text-[20px] font-semibold tabular-nums leading-none ${callTone(mix, flagged)}`}>
              {flagged.toLocaleString()}
            </span>
            <span className="text-[14px] text-mk-ink">{flagged === 1 ? 'part needs' : 'parts need'} a call</span>
          </span>
          <span className="mt-1.5 block text-[13px] tabular-nums text-mk-ink-subtle">
            {percent(flagged, total)} of {total.toLocaleString()}
          </span>
        </p>
        <ul className="grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-5 mk:w-[24rem] mk:shrink-0">
          {MIX_SEGMENTS.map((segment) => (
            <li key={segment.key}>
              <span className={`${appColHead} block`}>{segment.label}</span>
              <span
                className="mt-1 block text-[14px] font-medium tabular-nums"
                style={{ color: countColor(segment.tone, mix[segment.key]) }}
              >
                {mix[segment.key].toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {scored > 0 ? (
        <ul className="grid grid-cols-1 border-t border-mk-line sm:grid-cols-2">
          {SITUATION_COLUMNS.map((column) => {
            const count = situation[column.key]
            return (
              <li
                key={column.key}
                title={`${percent(count, scored)} of ${scored.toLocaleString()} scored parts`}
                className="flex items-baseline justify-between gap-4 px-4 py-2 mk:px-5"
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
