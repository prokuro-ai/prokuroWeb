'use client'

import { appTextBtn } from '@/components/app/chrome'
import {
  briefAlternate,
  buildLineDecision,
  thisWeekCostNote,
  thisWeekNextAction,
  whyThisScore,
} from '@/lib/decision'
import { extendedPrice, substituteCostNote, substituteSavingsDelta } from '@/lib/linePrice'
import { money } from '@/lib/purchaseDisplay'
import { lineSubstitutes, type LineSubstitute } from '@/lib/lineSubstitute'
import type { AnalyzedLine } from '@/lib/types'

function alternateOrigin(item: LineSubstitute): string {
  if (item.approved) return 'On your AML'
  if (item.substituteType?.trim()) return `Catalog: ${item.substituteType.trim()}`
  return 'Catalog substitute — confirm fit before you buy'
}

export default function LineDetail({
  line,
  substitutes = [],
  lookingUp = false,
  onUseSubstitute,
  usingMpn = null,
  error = null,
}: {
  line: AnalyzedLine
  substitutes?: LineSubstitute[]
  lookingUp?: boolean
  onUseSubstitute?: (mpn: string) => void
  usingMpn?: string | null
  error?: string | null
}) {
  const decision = buildLineDecision(line)
  const suggested = briefAlternate(line)
  const offered = lineSubstitutes(line, substitutes)
  const offeredKeys = new Set(offered.map((item) => item.mpn.toUpperCase()))
  const prose = suggested && !offeredKeys.has(suggested.toUpperCase()) ? suggested : null
  const lineExtended = extendedPrice(line)
  const bestSave = offered.reduce<number | null>((best, item) => {
    const delta = substituteSavingsDelta(lineExtended, item.extendedPrice)
    if (delta == null || delta <= 0) return best
    if (best == null || delta > best) return delta
    return best
  }, null)

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
        <p className="mk-eyebrow">Recommended replacements</p>
        {bestSave != null ? (
          <p className="mt-1.5 text-[13px] font-medium text-mk-ink">
            Best priced option saves {money(bestSave)} on this line at your qty.
          </p>
        ) : null}
        {prose ? <p className="mt-1.5 text-[13px] leading-relaxed text-mk-ink">Suggested: {prose}</p> : null}
        {offered.length > 0 ? (
          <div className="mt-1.5 space-y-2">
            {offered.map((item) => {
              const cost = substituteCostNote(lineExtended, item.extendedPrice)
              const delta = substituteSavingsDelta(lineExtended, item.extendedPrice)
              const origin = alternateOrigin(item)
              const detail = item.detail?.trim()
              return (
                <div
                  key={item.mpn}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[8px] border border-mk-accent/25 bg-mk-accent/5 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="mk-data text-[13px] text-mk-ink">{item.mpn}</p>
                    <p className="text-[12px] leading-relaxed text-mk-ink-subtle">
                      {origin}
                      {detail ? ` · ${detail}` : ''}
                    </p>
                    {cost ? (
                      <p
                        className={`mt-0.5 text-[12px] leading-relaxed ${
                          delta != null && delta > 0.009 ? 'font-medium text-mk-ink' : 'text-mk-ink-muted'
                        }`}
                      >
                        {cost}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[12px] text-mk-ink-subtle">No quote at this qty yet</p>
                    )}
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
              )
            })}
          </div>
        ) : prose ? null : lookingUp ? (
          <p className="mt-1.5 text-[13px] text-mk-ink-subtle">Looking up a replacement.</p>
        ) : (
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
