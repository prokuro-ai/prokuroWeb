import {
  isPendingLine,
  leadTimeWeeks,
  lifecycleLabel,
  lineRiskLevel,
  tariffLabel,
} from '@/lib/risk'
import type { AnalyzedLine } from '@/lib/types'

export type LineDecision = {
  summary: string
  whyScore: string
  recommendedAlternate: string | null
  recommendedAlternateNote: string
  nextAction: string
  costNote: string
}

export function analystBrief(line: AnalyzedLine): string | null {
  const text = line.agent_brief?.trim()
  return text ? text : null
}

function stockSentence(line: AnalyzedLine): string {
  const avail = line.availability_status?.toLowerCase() ?? ''
  if (avail === 'outofstock') return 'Distributor stock is out across tracked sellers.'
  if (avail === 'nomatch') return 'No distributor catalog match for this MPN.'
  if (avail === 'pending') return 'Distributor stock is still resolving.'
  if (line.total_avail > 0) {
    return `About ${line.total_avail.toLocaleString()} units are available across tracked distributors.`
  }
  return 'Stock data is limited for this line.'
}

function leadSentence(line: AnalyzedLine): string | null {
  const weeks = leadTimeWeeks(line)
  if (weeks == null) return null
  if (weeks > 30) return `Factory lead is about ${weeks} weeks — long enough to slip a build.`
  if (weeks > 12) return `Factory lead is about ${weeks} weeks.`
  return `Factory lead is about ${weeks} weeks.`
}

function tariffSentence(line: AnalyzedLine): string | null {
  if (line.total_duty_pct == null || line.total_duty_pct <= 0) return null
  const origin = line.country_of_origin ? ` (COO ${line.country_of_origin})` : ''
  return `Estimated duty is ${line.total_duty_pct}%${origin}.`
}

export function buildLineDecision(line: AnalyzedLine): LineDecision {
  const risk = lineRiskLevel(line)
  const pending = isPendingLine(line)
  const life = lifecycleLabel(line.lifecycle_status)
  const weeks = leadTimeWeeks(line)
  const alternate = line.aml_candidates[0] ?? null

  if (pending) {
    return {
      summary: 'Still resolving this part against distributor and lifecycle data.',
      whyScore: 'Risk is unknown until enrichment finishes. This page updates as results arrive.',
      recommendedAlternate: alternate,
      recommendedAlternateNote: alternate
        ? `${alternate} is already on your AML for this line.`
        : 'No approved alternate is listed on this line yet.',
      nextAction: 'Wait for enrichment to finish, then re-open this line for a decision.',
      costNote: 'Tariff and re-spin cost estimates appear once classification completes.',
    }
  }

  const drivers: string[] = []
  if (['eol', 'discontinued'].includes(line.lifecycle_status.toLowerCase())) {
    drivers.push(`${life} status — plan a last-time buy or redesign before the next build.`)
  } else if (line.lifecycle_status.toLowerCase() === 'nrnd') {
    drivers.push(`${life} status — prefer an active drop-in before committing volume.`)
  }
  drivers.push(stockSentence(line))
  const lead = leadSentence(line)
  if (lead) drivers.push(lead)
  const tariff = tariffSentence(line)
  if (tariff) drivers.push(tariff)
  if (line.match_status.toLowerCase() === 'none') {
    drivers.push('Catalog match failed — confirm the MPN or manufacturer before sourcing.')
  }

  let summary: string
  if (risk === 'red') {
    summary = `Critical: ${life.toLowerCase() === 'unknown' ? 'supply' : life} risk needs action before the next production run.`
  } else if (risk === 'yellow') {
    summary = `Watch: monitor this line — ${life.toLowerCase() === 'active' ? 'lead time, stock, or tariff' : life} signals are elevated.`
  } else if (risk === 'unknown') {
    summary = 'Unknown: not enough distributor data to score this line yet.'
  } else {
    summary = 'Clear: no urgent lifecycle, stock, or tariff flags on this line.'
  }

  let nextAction: string
  if (['eol', 'discontinued'].includes(line.lifecycle_status.toLowerCase())) {
    nextAction = alternate
      ? `Qualify ${alternate} from your AML this week and freeze remaining demand on the EOL MPN.`
      : 'Open an ECO for an approved alternate, or place a last-time buy covering remaining demand.'
  } else if (line.lifecycle_status.toLowerCase() === 'nrnd') {
    nextAction = alternate
      ? `Prefer ${alternate} for new builds; keep the NRND MPN only for sustaining volume.`
      : 'Identify an active alternate and get engineering sign-off before the next order.'
  } else if ((line.availability_status?.toLowerCase() ?? '') === 'outofstock') {
    nextAction = alternate
      ? `Check stock on ${alternate} and place a bridge buy if the original stays OOS.`
      : 'Confirm lead time with the franchise distributor and add a second source if lead slips.'
  } else if (weeks != null && weeks > 30) {
    nextAction = 'Pull demand forward or dual-source — current factory lead will miss a normal build window.'
  } else if (line.total_duty_pct != null && line.total_duty_pct > 0) {
    nextAction = alternate
      ? `Compare landed cost of ${alternate} vs the current MPN at your build volume.`
      : 'Confirm country of origin and duty basis with the broker before releasing the PO.'
  } else if (risk === 'green') {
    nextAction = 'No action required this week — keep on the monitored BOM for refresh.'
  } else {
    nextAction = 'Review with procurement before the next MRP run.'
  }

  const qty = line.quantity ?? 0
  let costNote: string
  if (line.total_duty_pct != null && line.total_duty_pct > 0 && qty > 0) {
    costNote = `At qty ${qty.toLocaleString()}, estimated duty is ${tariffLabel(line)} of unit cost (${line.hts_code ? `HTS ${line.hts_code}` : 'HTS pending'}). Re-spin cost depends on your CM quote.`
  } else if (line.total_duty_pct != null && line.total_duty_pct > 0) {
    costNote = `Estimated duty ${tariffLabel(line)}${line.hts_code ? ` under HTS ${line.hts_code}` : ''}. Add quantity to size tariff exposure.`
  } else {
    costNote = 'No duty flagged on this line. Re-spin cost only applies if you change the MPN.'
  }

  const brief = analystBrief(line)
  return {
    summary: brief ?? summary,
    whyScore: brief ?? drivers.join(' '),
    recommendedAlternate: alternate,
    recommendedAlternateNote: alternate
      ? `${alternate} is listed on your AML. Confirm footprint, firmware, and qualification status before swapping.`
      : 'No approved alternate on this line. Parametric drop-ins still need engineering sign-off against your AML process.',
    nextAction,
    costNote,
  }
}
