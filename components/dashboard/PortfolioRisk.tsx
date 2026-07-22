'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react'
import type { BomSummary } from '@/lib/types'
import { partitionBomsByTier } from '@/lib/portfolio'

interface PortfolioRiskProps {
  boms: BomSummary[]
}

export default function PortfolioRisk({ boms }: PortfolioRiskProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const { critical, warning, healthy } = partitionBomsByTier(boms)
  const total = boms.length

  if (total === 0) return null

  const tiers = [
    {
      id: 'critical',
      label: 'Critical',
      items: critical,
      color: '#ef4444',
      bg: '#fef2f2',
      border: '#fecaca',
      Icon: ShieldAlert,
      detail: `${critical.length} BOM${critical.length === 1 ? '' : 's'} need immediate action — high at-risk line counts or elevated portfolio scores.`,
    },
    {
      id: 'warning',
      label: 'Warning',
      items: warning,
      color: '#f59e0b',
      bg: '#fffbeb',
      border: '#fde68a',
      Icon: AlertTriangle,
      detail: `${warning.length} BOM${warning.length === 1 ? '' : 's'} have moderate risk — review lead times, lifecycle flags, or pending enrichment.`,
    },
    {
      id: 'healthy',
      label: 'Healthy',
      items: healthy,
      color: '#10b981',
      bg: '#f0fdf4',
      border: '#a7f3d0',
      Icon: CheckCircle,
      detail: `${healthy.length} BOM${healthy.length === 1 ? '' : 's'} are in good standing with no critical portfolio signals.`,
    },
  ]

  const activeTier = tiers.find((tier) => tier.id === expanded)

  return (
    <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Portfolio Risk Distribution</span>
        <span className="text-xs text-slate-400">Click a segment to explore</span>
      </div>

      <div className="mb-5 flex h-6 gap-0.5 overflow-hidden rounded-lg">
        {tiers.map((tier) => {
          const widthPct = (tier.items.length / total) * 100
          const isActive = expanded === tier.id
          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => setExpanded(isActive ? null : tier.id)}
              className="relative flex items-center justify-center transition-all"
              style={{
                width: `${widthPct}%`,
                minWidth: widthPct < 5 ? 28 : undefined,
                background: tier.color,
                opacity: expanded && !isActive ? 0.3 : 1,
              }}
              title={`${tier.label}: ${tier.items.length} BOMs`}
            >
              {widthPct > 5 && <span className="text-[10px] font-bold text-white">{tier.items.length}</span>}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {tiers.map((tier) => {
          const isActive = expanded === tier.id
          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => setExpanded(isActive ? null : tier.id)}
              className="rounded-xl border-2 p-4 text-left transition-all"
              style={{
                borderColor: isActive ? tier.color : '#e2e8f0',
                background: isActive ? tier.bg : '#fff',
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <tier.Icon className="h-4 w-4 shrink-0" style={{ color: tier.color }} />
                <span className="text-sm font-bold text-slate-900">{tier.label}</span>
              </div>
              <span className="text-3xl font-bold leading-none" style={{ color: tier.color }}>
                {tier.items.length}
              </span>
              <div className="my-3 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min((tier.items.length / total) * 200, 100)}%`,
                    background: tier.color,
                  }}
                />
              </div>
              <p className="text-xs leading-relaxed text-slate-500">{tier.detail}</p>
            </button>
          )
        })}
      </div>

      {activeTier && activeTier.items.length > 0 && (
        <div className="mt-3 rounded-xl border p-4" style={{ borderColor: activeTier.border, background: activeTier.bg }}>
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <activeTier.Icon className="h-4 w-4" style={{ color: activeTier.color }} />
              {activeTier.label} BOMs — most at risk
            </span>
            <span className="text-xs font-semibold" style={{ color: activeTier.color }}>
              {activeTier.items.length} total
            </span>
          </div>
          {[...activeTier.items]
            .sort((a, b) => b.overallRiskScore - a.overallRiskScore)
            .slice(0, 3)
            .map((bom) => (
              <div
                key={bom.id}
                className="mb-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 shadow-sm last:mb-0"
              >
                <activeTier.Icon className="h-4 w-4 shrink-0" style={{ color: activeTier.color }} />
                <span className="flex-1 truncate text-sm font-medium text-slate-900">{bom.name}</span>
                <span className="text-xs text-slate-400">{bom.atRiskCount} at-risk</span>
                <span className="text-xs font-semibold text-slate-600">{bom.overallRiskScore.toFixed(1)}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
