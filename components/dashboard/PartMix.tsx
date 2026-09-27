import Panel from '@/components/dashboard/Panel'
import { atRisk, MIX_SEGMENTS, mixTotal, percent, TONE_VAR } from '@/lib/dashboard'
import { plural } from '@/lib/format'
import type { RiskMix } from '@/lib/types'

export default function PartMix({ mix, boardCount }: { mix: RiskMix; boardCount: number }) {
  const total = mixTotal(mix)
  const flagged = atRisk(mix)
  const segments = MIX_SEGMENTS.filter((segment) => mix[segment.key] > 0)
  const summary = MIX_SEGMENTS.map((segment) => `${segment.label} ${mix[segment.key]}`).join(', ')

  return (
    <Panel title="Where every part stands" detail={`${plural(total, 'part')} on ${plural(boardCount, 'BOM')}`}>
      <div className="px-4 py-5 mk:px-5">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className={`mk-data text-[34px] leading-none ${flagged > 0 ? 'text-mk-red' : 'text-mk-ink'}`}>
            {flagged.toLocaleString()}
          </span>
          <span className="text-[13px] text-mk-ink-muted">
            {flagged === 1 ? 'part needs' : 'parts need'} a call, {percent(flagged, total)} of the account
          </span>
        </p>

        <div
          role="img"
          aria-label={summary}
          className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-mk-raised-2"
        >
          {segments.map((segment, index) => (
            <span
              key={segment.key}
              className={index > 0 ? 'border-l-2 border-mk-canvas' : undefined}
              style={{ width: `${(mix[segment.key] / total) * 100}%`, background: TONE_VAR[segment.tone] }}
            />
          ))}
        </div>

        <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 mk:grid-cols-5">
          {MIX_SEGMENTS.map((segment) => {
            const count = mix[segment.key]
            return (
              <li key={segment.key} className="min-w-0">
                <span className="flex items-center gap-2 text-[12px] text-mk-ink-subtle">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: TONE_VAR[segment.tone] }}
                    aria-hidden
                  />
                  {segment.label}
                </span>
                <span className="mt-1 flex items-baseline gap-2">
                  <span className={`mk-data text-[16px] ${count > 0 ? 'text-mk-ink' : 'text-mk-ink-subtle'}`}>
                    {count.toLocaleString()}
                  </span>
                  <span className="mk-data text-[12px] text-mk-ink-subtle">{percent(count, total)}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </Panel>
  )
}
