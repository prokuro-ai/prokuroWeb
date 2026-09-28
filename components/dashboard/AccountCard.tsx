import {
  atRisk,
  LEAD_BUCKETS,
  MIX_SEGMENTS,
  mixTotal,
  percent,
  scoredTotal,
  SITUATION_COLUMNS,
  SITUATION_GROUPS,
  TONE_VAR,
  type Tone,
} from '@/lib/dashboard'
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
        <span className="absolute inset-y-0 w-px -translate-x-1/2 bg-mk-ink" style={{ left: CUTOFF_AT }} aria-hidden />
        <span
          className="absolute bottom-full mb-1 -translate-x-1/2 text-[11px] font-semibold tabular-nums text-mk-ink"
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

const padX = 'px-5 mk:px-7'

/** Account readout: the headline count and mix, exceptions by kind, then factory lead. */
export default function AccountCard({ account }: { account: LineTally }) {
  const { mix, situation, lead } = account
  const total = mixTotal(mix)
  const flagged = atRisk(mix)
  const scored = scoredTotal(mix)

  return (
    <section aria-label="Account" className="mk-account-card overflow-hidden rounded-[12px]">
      <div className={`${padX} flex flex-col gap-6 py-6 mk:flex-row mk:items-end mk:justify-between mk:gap-10 mk:py-7`}>
        <div>
          <p
            className={`text-[clamp(3rem,11vw,4.5rem)] font-semibold leading-none tracking-[-0.03em] tabular-nums ${
              flagged > 0 ? 'text-mk-red' : 'text-mk-green'
            }`}
          >
            {flagged.toLocaleString()}
          </p>
          <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[15px] font-medium text-mk-ink">{flagged === 1 ? 'part needs' : 'parts need'} a call</span>
            <span className="text-[13px] tabular-nums text-mk-ink-subtle">
              {percent(flagged, total)} of {total.toLocaleString()}
            </span>
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-x-6 gap-y-4 mk:grid-cols-5 mk:gap-x-8">
          {MIX_SEGMENTS.map((segment) => (
            <div key={segment.key}>
              <dt className="text-[12px] text-mk-ink-subtle">{segment.label}</dt>
              <dd
                className="mt-1 text-[20px] font-semibold leading-none tabular-nums"
                style={{ color: countColor(segment.tone, mix[segment.key]) }}
              >
                {mix[segment.key].toLocaleString()}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {scored > 0 ? (
        <>
          <div className="grid divide-y divide-mk-line border-t border-mk-line mk:grid-cols-4 mk:divide-x mk:divide-y-0">
            {SITUATION_GROUPS.map((group) => (
              <div key={group.label} className="px-5 py-5 mk:px-6 mk:first:pl-7">
                <h3 className="text-[12px] font-medium text-mk-ink-subtle">{group.label}</h3>
                <ul className="mt-3 space-y-2.5">
                  {group.keys.map((key) => {
                    const column = SITUATION_COLUMNS.find((c) => c.key === key)!
                    const count = situation[key]
                    return (
                      <li
                        key={key}
                        title={`${percent(count, scored)} of ${scored.toLocaleString()} scored parts`}
                        className="flex items-baseline justify-between gap-3"
                      >
                        <span className="min-w-0 text-[13px] leading-snug text-mk-ink-muted">{column.label}</span>
                        <span
                          className="shrink-0 text-[18px] font-semibold leading-none tabular-nums"
                          style={{ color: countColor(column.tone, count) }}
                        >
                          {count.toLocaleString()}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className={`${padX} border-t border-mk-line py-6`}>
            <LeadScale lead={lead} />
          </div>
        </>
      ) : null}
    </section>
  )
}
