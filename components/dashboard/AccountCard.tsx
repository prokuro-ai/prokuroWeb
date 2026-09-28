import { atRisk, LEAD_BUCKETS, MIX_SEGMENTS, mixTotal, percent, scoredTotal, SITUATION_COLUMNS, TONE_VAR } from '@/lib/dashboard'
import type { LeadTimes, LineTally } from '@/lib/types'

/** Three of five buckets sit at or under 26 weeks. */
const CUTOFF_AT = '60%'

function toneColor(tone: keyof typeof TONE_VAR, quiet: boolean): string {
  if (quiet) return 'var(--mk-ink-subtle)'
  return TONE_VAR[tone]
}

function LeadScale({ lead }: { lead: LeadTimes }) {
  const counts = LEAD_BUCKETS.map((bucket) => lead[bucket.key])
  const published = counts.reduce((sum, count) => sum + count, 0)

  return (
    <figure>
      <figcaption className="flex items-baseline justify-between gap-3 text-[12px] text-mk-ink-subtle">
        <span>Factory lead, weeks</span>
        {lead.unpublished > 0 ? <span className="mk-data">{lead.unpublished} unpublished</span> : null}
      </figcaption>
      <div className="mt-5 grid grid-cols-5">
        {LEAD_BUCKETS.map((bucket, index) => {
          const count = counts[index]
          const late = bucket.tone !== 'slate'
          return (
            <span
              key={bucket.key}
              className="mk-data text-center text-[18px] leading-none"
              style={{
                color: count === 0 ? 'var(--mk-ink-subtle)' : late ? TONE_VAR[bucket.tone] : 'var(--mk-ink)',
              }}
            >
              {count.toLocaleString()}
            </span>
          )
        })}
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
          className="mk-data absolute top-1/2 -translate-x-1/2 -translate-y-1/2 bg-mk-canvas px-1.5 text-[10px] text-mk-ink"
          style={{ left: CUTOFF_AT }}
        >
          26
        </span>
      </div>
      <div className="mt-1 grid grid-cols-5">
        {LEAD_BUCKETS.map((bucket) => (
          <span key={bucket.key} className="mk-data text-center text-[11px] text-mk-ink-subtle">
            {bucket.label}
          </span>
        ))}
      </div>
      <p className="sr-only">{published} scored parts have a published factory lead. The mark at 26 weeks is the long-lead line.</p>
    </figure>
  )
}

/** Account readout. Same figures as before, set as type on the bench instead of a chart. */
export default function AccountCard({ account }: { account: LineTally }) {
  const { mix, situation, lead } = account
  const total = mixTotal(mix)
  const flagged = atRisk(mix)
  const scored = scoredTotal(mix)

  return (
    <section
      data-surface="dark"
      aria-label="Account"
      className="relative overflow-hidden rounded-[8px] shadow-[var(--mk-shadow)]"
    >
      <div className="mk-grain pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className={`relative grid ${scored > 0 ? 'lg:grid-cols-2' : ''}`}>
        <div
          className={`px-6 py-7 mk:px-8 mk:py-8 ${
            scored > 0 ? 'border-b border-mk-line lg:border-r lg:border-b-0' : ''
          }`}
        >
          <p className="flex items-baseline gap-x-3">
            <span className={`mk-data text-[4.25rem] leading-none ${flagged > 0 ? 'text-mk-red' : 'text-mk-green'}`}>
              {flagged.toLocaleString()}
            </span>
          </p>
          <p className="mt-3 text-[15px] text-mk-ink">{flagged === 1 ? 'part needs' : 'parts need'} a call</p>
          <p className="mk-data mt-1 text-[13px] text-mk-ink-subtle">
            {percent(flagged, total)} of {total.toLocaleString()}
          </p>

          <ul className="mt-8 border-t border-mk-line">
            {MIX_SEGMENTS.map((segment) => (
              <li key={segment.key} className="flex items-baseline justify-between gap-4 border-b border-mk-line py-2.5">
                <span className="text-[13px] text-mk-ink-muted">{segment.label}</span>
                <span className="mk-data text-[15px]" style={{ color: toneColor(segment.tone, mix[segment.key] === 0) }}>
                  {mix[segment.key].toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {scored > 0 ? (
          <ul className="px-6 py-7 mk:px-8 mk:py-8">
            {SITUATION_COLUMNS.map((column) => {
              const count = situation[column.key]
              return (
                <li
                  key={column.key}
                  title={`${percent(count, scored)} of ${scored.toLocaleString()} scored parts`}
                  className="flex items-baseline justify-between gap-4 border-b border-mk-line py-3 first:pt-0"
                >
                  <span className="text-[14px] text-mk-ink-muted">{column.label}</span>
                  <span className="flex items-baseline gap-3">
                    <span className="mk-data text-[12px] text-mk-ink-subtle">{percent(count, scored)}</span>
                    <span
                      className="mk-data w-12 text-right text-[20px] leading-none"
                      style={{
                        color:
                          count === 0
                            ? 'var(--mk-ink-subtle)'
                            : column.tone === 'slate'
                              ? 'var(--mk-ink)'
                              : TONE_VAR[column.tone],
                      }}
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
        <div className="relative border-t border-mk-line px-6 py-6 mk:px-8">
          <LeadScale lead={lead} />
        </div>
      ) : null}
    </section>
  )
}
