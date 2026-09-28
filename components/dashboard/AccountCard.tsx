import { atRisk, LEAD_BUCKETS, MIX_SEGMENTS, mixTotal, percent, scoredTotal, SITUATION_COLUMNS, TONE_VAR, type Tone } from '@/lib/dashboard'
import type { LeadTimes, LineTally } from '@/lib/types'

/** Three of five buckets sit at or under 26 weeks. */
const CUTOFF_AT = '60%'

/** Zero reads as subtle. Slate counts are facts, not warnings, so they stay ink. */
function countColor(tone: Tone, count: number): string {
  if (count === 0) return 'var(--mk-ink-subtle)'
  return tone === 'slate' || tone === 'pending' ? 'var(--mk-ink)' : TONE_VAR[tone]
}

function LeadScale({ lead }: { lead: LeadTimes }) {
  const counts = LEAD_BUCKETS.map((bucket) => lead[bucket.key])
  const published = counts.reduce((sum, count) => sum + count, 0)

  return (
    <figure>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[12px] text-mk-ink-subtle">
        <span>Factory lead, weeks</span>
        {lead.unpublished > 0 ? <span className="tabular-nums">{lead.unpublished} unpublished</span> : null}
      </figcaption>
      <div className="mt-5 grid grid-cols-5">
        {LEAD_BUCKETS.map((bucket, index) => (
          <span
            key={bucket.key}
            className="text-center text-[16px] font-medium leading-none tabular-nums mk:text-[18px]"
            style={{ color: countColor(bucket.tone, counts[index]) }}
          >
            {counts[index].toLocaleString()}
          </span>
        ))}
      </div>
      <div className="relative mt-4 h-3">
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-mk-line-strong" />
        {LEAD_BUCKETS.map((bucket, index) => (
          <span
            key={bucket.key}
            className="absolute top-1/2 h-1.5 w-px -translate-x-1/2 -translate-y-1/2 bg-mk-ink-subtle"
            style={{ left: `${(index + 0.5) * 20}%` }}
            aria-hidden
          />
        ))}
        <span
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 bg-mk-canvas px-1.5 text-[11px] font-medium tabular-nums text-mk-ink"
          style={{ left: CUTOFF_AT }}
        >
          26
        </span>
      </div>
      <div className="mt-1.5 grid grid-cols-5">
        {LEAD_BUCKETS.map((bucket) => (
          <span key={bucket.key} className="whitespace-nowrap text-center text-[11px] tabular-nums text-mk-ink-subtle mk:text-[12px]">
            {bucket.label}
          </span>
        ))}
      </div>
      <p className="sr-only">{published} scored parts have a published factory lead. The mark at 26 weeks is the long-lead line.</p>
    </figure>
  )
}

const pad = 'px-5 py-6 mk:px-7 mk:py-7'

/** Account readout on a raised grey card. */
export default function AccountCard({ account }: { account: LineTally }) {
  const { mix, situation, lead } = account
  const total = mixTotal(mix)
  const flagged = atRisk(mix)
  const scored = scoredTotal(mix)

  return (
    <section aria-label="Account" className="mk-account-card overflow-hidden rounded-[10px]">
      <div className={`grid ${scored > 0 ? 'mk:grid-cols-2' : ''}`}>
        <div className={`${pad} ${scored > 0 ? 'border-b border-mk-line mk:border-r mk:border-b-0' : ''}`}>
          <p
            className={`text-[clamp(3rem,11vw,4.5rem)] font-semibold leading-none tracking-[-0.03em] tabular-nums ${
              flagged > 0 ? 'text-mk-red' : 'text-mk-green'
            }`}
          >
            {flagged.toLocaleString()}
          </p>
          <p className="mt-3 text-[15px] font-medium text-mk-ink">{flagged === 1 ? 'part needs' : 'parts need'} a call</p>
          <p className="mt-1 text-[13px] tabular-nums text-mk-ink-subtle">
            {percent(flagged, total)} of {total.toLocaleString()}
          </p>

          <ul className="mt-7 border-t border-mk-line">
            {MIX_SEGMENTS.map((segment) => (
              <li key={segment.key} className="flex items-baseline justify-between gap-4 border-b border-mk-line py-2.5">
                <span className="text-[13px] text-mk-ink-muted">{segment.label}</span>
                <span
                  className="shrink-0 text-[15px] font-medium tabular-nums"
                  style={{ color: countColor(segment.tone, mix[segment.key]) }}
                >
                  {mix[segment.key].toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {scored > 0 ? (
          <ul className={pad}>
            {SITUATION_COLUMNS.map((column) => {
              const count = situation[column.key]
              return (
                <li
                  key={column.key}
                  title={`${percent(count, scored)} of ${scored.toLocaleString()} scored parts`}
                  className="flex items-baseline justify-between gap-4 border-b border-mk-line py-3 first:pt-0"
                >
                  <span className="min-w-0 text-[14px] leading-snug text-mk-ink-muted">{column.label}</span>
                  <span className="flex shrink-0 items-baseline gap-3">
                    <span className="text-[12px] tabular-nums text-mk-ink-subtle">{percent(count, scored)}</span>
                    <span
                      className="min-w-10 text-right text-[20px] font-semibold leading-none tabular-nums"
                      style={{ color: countColor(column.tone, count) }}
                    >
                      {count.toLocaleString()}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>

      {scored > 0 ? (
        <div className="border-t border-mk-line px-5 py-6 mk:px-7">
          <LeadScale lead={lead} />
        </div>
      ) : null}
    </section>
  )
}
