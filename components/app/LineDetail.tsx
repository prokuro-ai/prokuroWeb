'use client'

import { appTextBtn } from '@/components/app/chrome'
import {
  briefAlternate,
  buildLineDecision,
  thisWeekCostNote,
  thisWeekNextAction,
  whyThisScore,
} from '@/lib/decision'
import { lineSubstitutes, type LineSubstitute } from '@/lib/lineSubstitute'
import type { AnalyzedLine } from '@/lib/types'

export default function LineDetail({
  line,
  substitutes = [],
  onUseSubstitute,
  usingMpn = null,
  error = null,
}: {
  line: AnalyzedLine
  substitutes?: LineSubstitute[]
  onUseSubstitute?: (mpn: string) => void
  usingMpn?: string | null
  error?: string | null
}) {
  const decision = buildLineDecision(line)
  const suggested = briefAlternate(line)
  const offered = lineSubstitutes(line, substitutes)
  const offeredKeys = new Set(offered.map((item) => item.mpn.toUpperCase()))
  const prose = suggested && !offeredKeys.has(suggested.toUpperCase()) ? suggested : null

  return (
    <div className="min-w-0 space-y-4">
      <div>
        <p className="mk-eyebrow">Why this score</p>
        <p className="mt-1.5 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-mk-ink">
          {whyThisScore(line)}
        </p>
      </div>

      <div>
        <p className="mk-eyebrow">This week</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-mk-ink">{thisWeekNextAction(line)}</p>
        <p className="mt-2 text-[12px] leading-relaxed text-mk-ink-muted">{thisWeekCostNote(line)}</p>
      </div>

      <div>
        <p className="mk-eyebrow">Alternates from your AML</p>
        {prose ? <p className="mt-1.5 text-[13px] leading-relaxed text-mk-ink">Suggested: {prose}</p> : null}
        {offered.length > 0 ? (
          <div className="mt-1.5 space-y-2">
            {offered.map((item) => (
              <div
                key={item.mpn}
                className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[8px] border border-mk-accent/25 bg-mk-accent/5 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="mk-data text-[13px] text-mk-ink">{item.mpn}</p>
                  <p className="text-[12px] leading-relaxed text-mk-ink-subtle">
                    {`${item.approved ? 'On your AML.' : 'Not on your AML yet, so check it fits.'}${
                      item.detail ? ` ${item.detail}` : ''
                    }`}
                  </p>
                </div>
                {onUseSubstitute ? (
                  <button
                    type="button"
                    className={appTextBtn}
                    disabled={usingMpn != null}
                    onClick={() => onUseSubstitute(item.mpn)}
                  >
                    {usingMpn === item.mpn ? 'Updating…' : `Use ${item.mpn}`}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : prose ? null : (
          <p className="mt-1.5 text-[13px] text-mk-ink-subtle">{decision.recommendedAlternateNote}</p>
        )}
        {error ? <p className="mt-1.5 text-[12px] text-mk-red">{error}</p> : null}
      </div>

      {(line.hts_code ||
        line.tariff_notes ||
        line.entity_list_notes ||
        line.tariff_disclaimer) && (
        <div className="space-y-1 border-t border-mk-line/60 pt-4 text-[12px] leading-relaxed text-mk-ink-muted">
          {line.hts_code ? (
            <p>
              HTS {line.hts_code}
              {line.country_of_origin ? ` · COO ${line.country_of_origin}` : ''}
              {line.total_duty_pct != null && line.total_duty_pct > 0
                ? ` · estimated duty ${line.total_duty_pct}%`
                : ''}
            </p>
          ) : null}
          {line.tariff_notes ? <p>{line.tariff_notes}</p> : null}
          {line.entity_list_notes ? <p className="text-mk-red">{line.entity_list_notes}</p> : null}
          {line.tariff_disclaimer ? <p className="text-mk-ink-subtle">{line.tariff_disclaimer}</p> : null}
        </div>
      )}
    </div>
  )
}
