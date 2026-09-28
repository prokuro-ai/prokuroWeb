import { atRisk, LEAD_BUCKETS, MIX_SEGMENTS, mixTotal, percent, scoredTotal, SITUATION_COLUMNS, TONE_VAR } from '@/lib/dashboard'
import type { LeadTimes, LineTally } from '@/lib/types'

/** Three of five buckets sit at or under 26 weeks. */
const CUTOFF_AT = '60%'

function LeadHistogram({ lead }: { lead: LeadTimes }) {
  const counts = LEAD_BUCKETS.map((bucket) => lead[bucket.key])
  const max = Math.max(...counts, 0)
  const published = counts.reduce((sum, count) => sum + count, 0)

  return (
    <figure className="min-w-0">
      <figcaption className="flex items-baseline justify-between gap-3 text-[12px] text-mk-ink-subtle">
        <span>Factory lead, weeks</span>
        {lead.unpublished > 0 ? <span className="mk-data">{lead.unpublished} unpublished</span> : null}
      </figcaption>
      <div className="relative mt-3">
        <div className="grid h-32 grid-cols-5 items-end gap-2.5 border-b border-mk-line-strong pt-5">
          {LEAD_BUCKETS.map((bucket, index) => {
            const count = counts[index]
            const height = max > 0 ? (count / max) * 100 : 0
            const long = bucket.tone !== 'slate'
            return (
              <div key={bucket.key} className="relative h-full">
                <span
                  className="absolute inset-x-0 bottom-0 rounded-t-[3px]"
                  style={{
                    height: `${height}%`,
                    minHeight: count > 0 ? 2 : 0,
                    background: long
                      ? TONE_VAR[bucket.tone]
                      : `color-mix(in srgb, ${TONE_VAR.slate} 55%, transparent)`,
                  }}
                />
                <span
                  className="mk-data absolute inset-x-0 text-center text-[12px] text-mk-ink-muted"
                  style={{ bottom: `calc(${height}% + 4px)`, color: long && count > 0 ? TONE_VAR[bucket.tone] : undefined }}
                >
                  {count > 0 ? count.toLocaleString() : ''}
                </span>
              </div>
            )
          })}
        </div>
        <span
          className="pointer-events-none absolute inset-y-0 border-l border-dashed border-mk-ink-subtle/60"
          style={{ left: CUTOFF_AT }}
          aria-hidden
        />
        <span
          className="mk-data absolute top-0 -translate-x-1/2 bg-mk-canvas px-1 text-[10px] text-mk-ink-subtle"
          style={{ left: CUTOFF_AT }}
        >
          26
        </span>
      </div>
      <div className="mt-1.5 grid grid-cols-5 gap-2.5">
        {LEAD_BUCKETS.map((bucket) => (
          <span key={bucket.key} className="mk-data text-center text-[11px] text-mk-ink-subtle">
            {bucket.label}
          </span>
        ))}
      </div>
      <p className="sr-only">{published} scored parts have a published factory lead.</p>
    </figure>
  )
}

/** The account at a glance, on the dark surface so it reads as the page's summary. */
export default function AccountCard({ account }: { account: LineTally }) {
  const { mix, situation, lead } = account
  const total = mixTotal(mix)
  const flagged = atRisk(mix)
  const scored = scoredTotal(mix)

  return (
    <section
      data-surface="dark"
      aria-label="Account"
      className="relative overflow-hidden rounded-[12px] shadow-[0_1px_2px_rgb(15_27_45/8%),0_12px_32px_rgb(15_27_45/12%)]"
    >
      {flagged > 0 ? (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,color-mix(in_srgb,var(--mk-red)_14%,transparent),transparent_60%)]"
          aria-hidden
        />
      ) : null}
      <div className="relative grid gap-8 px-5 py-6 mk:px-7 mk:py-7 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12">
        <div className="min-w-0">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className={`mk-data text-[48px] leading-none ${flagged > 0 ? 'text-mk-red' : 'text-mk-green'}`}>
              {flagged.toLocaleString()}
            </span>
            <span className="text-[14px] text-mk-ink">
              {flagged === 1 ? 'part needs' : 'parts need'} a call
            </span>
            <span className="mk-data text-[13px] text-mk-ink-subtle">
              {percent(flagged, total)} of {total.toLocaleString()}
            </span>
          </p>

          <div
            role="img"
            aria-label={MIX_SEGMENTS.map((s) => `${s.label} ${mix[s.key]}`).join(', ')}
            className="mt-6 flex h-3 gap-[3px] overflow-hidden rounded-full"
          >
            {total > 0 ? (
              MIX_SEGMENTS.filter((s) => mix[s.key] > 0).map((segment) => (
                <span
                  key={segment.key}
                  className="first:rounded-l-full last:rounded-r-full"
                  style={{ flexGrow: mix[segment.key], flexBasis: 0, minWidth: 3, background: TONE_VAR[segment.tone] }}
                />
              ))
            ) : (
              <span className="flex-1 bg-mk-raised-2" />
            )}
          </div>

          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
            {MIX_SEGMENTS.map((segment) => (
              <li key={segment.key} className="flex items-center gap-1.5 text-[12px] text-mk-ink-muted">
                <span className="h-2 w-2 rounded-full" style={{ background: TONE_VAR[segment.tone] }} aria-hidden />
                {segment.label}
                <span className="mk-data text-mk-ink">{mix[segment.key].toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>

        {scored > 0 ? <LeadHistogram lead={lead} /> : null}
      </div>

      {scored > 0 ? (
        <ul className="relative grid grid-cols-1 gap-px border-t border-mk-line bg-mk-line sm:grid-cols-7">
          {SITUATION_COLUMNS.map((column) => {
            const count = situation[column.key]
            const color =
              count === 0 ? 'var(--mk-ink-subtle)' : column.tone === 'slate' ? 'var(--mk-ink)' : TONE_VAR[column.tone]
            return (
              <li
                key={column.key}
                title={`${percent(count, scored)} of ${scored.toLocaleString()} scored parts`}
                className="flex items-baseline gap-3 bg-mk-canvas px-5 py-3 sm:block sm:px-4 sm:py-4 lg:px-5"
              >
                <span className="mk-data block w-10 text-[22px] leading-none sm:w-auto" style={{ color }}>
                  {count.toLocaleString()}
                </span>
                <span className="block text-[12px] leading-snug text-mk-ink-muted sm:mt-2">{column.label}</span>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
