import Panel from '@/components/dashboard/Panel'
import { LEAD_BUCKETS, TONE_VAR } from '@/lib/dashboard'
import { plural } from '@/lib/format'
import type { LeadTimes } from '@/lib/types'

/** Three of five buckets sit at or under 26 weeks, so the cutoff is at 60%. */
const CUTOFF_AT = '60%'

export default function LeadTimeChart({ lead }: { lead: LeadTimes }) {
  const counts = LEAD_BUCKETS.map((bucket) => lead[bucket.key])
  const published = counts.reduce((sum, count) => sum + count, 0)
  const max = Math.max(...counts, 0)

  return (
    <Panel
      title="Factory lead time"
      detail={`${plural(published, 'scored part')} with a published lead, in weeks`}
      footer={
        lead.unpublished > 0 ? (
          <p className="text-[12px] text-mk-ink-subtle">
            {plural(lead.unpublished, 'scored part')} with no lead published by the distributor.
          </p>
        ) : undefined
      }
    >
      <div className="px-4 pb-4 pt-5 mk:px-5">
        <div className="relative">
          <div className="grid h-44 grid-cols-5 items-end gap-3 border-b border-mk-line pt-6">
            {LEAD_BUCKETS.map((bucket, index) => {
              const count = counts[index]
              const height = max > 0 ? (count / max) * 100 : 0
              const long = bucket.tone !== 'slate'
              const fill = long ? TONE_VAR[bucket.tone] : `color-mix(in srgb, ${TONE_VAR.slate} 45%, transparent)`
              return (
                <div key={bucket.key} className="relative h-full">
                  <span
                    className="absolute inset-x-0 bottom-0 rounded-t-[4px]"
                    style={{ height: `${height}%`, minHeight: count > 0 ? 2 : 0, background: fill }}
                  />
                  <span
                    className="mk-data absolute inset-x-0 text-center text-[12px] text-mk-ink-muted"
                    style={{
                      bottom: `calc(${height}% + 4px)`,
                      color: long && count > 0 ? TONE_VAR[bucket.tone] : undefined,
                    }}
                  >
                    {count.toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
          <span
            className="pointer-events-none absolute bottom-0 top-0 border-l border-dashed border-mk-line-strong"
            style={{ left: CUTOFF_AT }}
            aria-hidden
          />
          <span
            className="mk-data absolute top-0 -translate-x-1/2 bg-mk-canvas px-1 text-[11px] text-mk-ink-subtle"
            style={{ left: CUTOFF_AT }}
          >
            26 wk
          </span>
        </div>
        <div className="mt-2 grid grid-cols-5 gap-3">
          {LEAD_BUCKETS.map((bucket) => (
            <span key={bucket.key} className="mk-data text-center text-[11px] text-mk-ink-subtle">
              {bucket.label}
            </span>
          ))}
        </div>
      </div>
    </Panel>
  )
}
