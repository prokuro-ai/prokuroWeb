'use client'

import { analystBrief, buildLineDecision } from '@/lib/decision'
import { isAtRisk, isPendingLine } from '@/lib/risk'
import type { AnalyzedLine } from '@/lib/types'

export default function LineDetail({ line }: { line: AnalyzedLine }) {
  const decision = buildLineDecision(line)
  const brief = analystBrief(line)
  const briefPending = isAtRisk(line) && !isPendingLine(line) && !brief

  return (
    <div className="min-w-0 space-y-4">
      <div>
        <p className="mk-eyebrow">Why this score</p>
        <p className="mt-1.5 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-mk-ink">
          {brief ??
            (briefPending
              ? 'A procurement brief is being written for this line. This updates when the analyst finishes.'
              : decision.whyScore)}
        </p>
      </div>

      <div>
        <p className="mk-eyebrow">This week</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-mk-ink">{decision.nextAction}</p>
        <p className="mt-2 text-[12px] leading-relaxed text-mk-ink-muted">{decision.costNote}</p>
      </div>

      <div>
        <p className="mk-eyebrow">Alternates from your AML</p>
        {line.aml_candidates.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {line.aml_candidates.map((mpn) => (
              <span key={mpn} className="mk-data rounded-[6px] bg-mk-canvas px-2 py-1 text-[12px] text-mk-ink">
                {mpn}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-1.5 text-[13px] text-mk-ink-subtle">{decision.recommendedAlternateNote}</p>
        )}
      </div>

      {(line.tariff_notes || line.entity_list_notes || line.tariff_disclaimer) && (
        <div className="space-y-1 border-t border-mk-line/60 pt-4 text-[12px] leading-relaxed text-mk-ink-muted">
          {line.tariff_notes ? <p>{line.tariff_notes}</p> : null}
          {line.entity_list_notes ? <p className="text-mk-red">{line.entity_list_notes}</p> : null}
          {line.tariff_disclaimer ? <p className="text-mk-ink-subtle">{line.tariff_disclaimer}</p> : null}
        </div>
      )}
    </div>
  )
}
