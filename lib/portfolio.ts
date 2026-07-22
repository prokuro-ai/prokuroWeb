import type { BomSummary } from './types'

export type RiskTier = 'critical' | 'warning' | 'healthy'

export function riskTier(score: number): RiskTier {
  if (score >= 7) return 'critical'
  if (score >= 4) return 'warning'
  return 'healthy'
}

export function partitionBomsByTier(boms: BomSummary[]) {
  return {
    critical: boms.filter((b) => b.overallRiskScore >= 7),
    warning: boms.filter((b) => b.overallRiskScore >= 4 && b.overallRiskScore < 7),
    healthy: boms.filter((b) => b.overallRiskScore < 4),
  }
}

export function portfolioStats(boms: BomSummary[]) {
  const tiers = partitionBomsByTier(boms)
  const totalLines = boms.reduce((sum, bom) => sum + bom.lineCount, 0)
  const totalAtRisk = boms.reduce((sum, bom) => sum + bom.atRiskCount, 0)

  return {
    totalBoms: boms.length,
    totalLines,
    totalAtRisk,
    criticalCount: tiers.critical.length,
    warningCount: tiers.warning.length,
    healthyCount: tiers.healthy.length,
    needsAttention: [...boms]
      .filter((bom) => bom.atRiskCount > 0)
      .sort((a, b) => b.atRiskCount - a.atRiskCount),
    highestRisk: [...boms].sort((a, b) => b.overallRiskScore - a.overallRiskScore)[0] ?? null,
  }
}

/** Rotating dashboard insights derived from live portfolio data — no mock alerts. */
export function portfolioFeedMessages(boms: BomSummary[]): string[] {
  if (boms.length === 0) {
    return ['Upload a BOM to start monitoring lifecycle, availability, and tariff risk.']
  }

  const stats = portfolioStats(boms)
  const messages: string[] = []

  const needsAttention = stats.criticalCount + stats.warningCount
  if (needsAttention > 0) {
    messages.push(
      `${needsAttention} BOM${needsAttention === 1 ? '' : 's'} need attention — ${stats.criticalCount} critical, ${stats.warningCount} warning.`,
    )
  }

  if (stats.totalAtRisk > 0) {
    messages.push(
      `${stats.totalAtRisk.toLocaleString()} component line${stats.totalAtRisk === 1 ? '' : 's'} flagged at-risk across your portfolio.`,
    )
  }

  if (stats.highestRisk && stats.highestRisk.overallRiskScore >= 4) {
    messages.push(
      `"${stats.highestRisk.name}" has the highest risk score (${stats.highestRisk.overallRiskScore.toFixed(1)}/10).`,
    )
  }

  if (messages.length === 0) {
    messages.push(`All ${stats.totalBoms} tracked BOM${stats.totalBoms === 1 ? '' : 's'} are in healthy standing.`)
  }

  return messages
}
