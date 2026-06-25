import type { LifecycleStatus, LeadTimeTrend } from '@/lib/types'

export function RiskScore({ score }: { score: number }) {
  const rounded = Math.round(score)
  const cls =
    rounded >= 8
      ? 'bg-red-100 text-red-700 border-red-300'
      : rounded >= 5
        ? 'bg-amber-100 text-amber-700 border-amber-300'
        : rounded >= 3
          ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
          : 'bg-green-100 text-green-700 border-green-300'

  return (
    <span className={`inline-flex h-6 w-6 items-center justify-center rounded border text-[11px] font-bold ${cls}`}>
      {rounded}
    </span>
  )
}

export function LifecycleBadge({ status }: { status: LifecycleStatus }) {
  const map: Record<LifecycleStatus, { label: string; cls: string }> = {
    active: { label: 'Active', cls: 'bg-green-100 text-green-700 border-green-300' },
    nrnd: { label: 'NRND', cls: 'bg-amber-100 text-amber-700 border-amber-300' },
    eol: { label: 'EOL', cls: 'bg-red-100 text-red-700 border-red-300' },
    discontinued: { label: 'Discontinued', cls: 'bg-red-100 text-red-800 border-red-400' },
    unknown: { label: 'Unknown', cls: 'bg-gray-100 text-gray-500 border-gray-300' },
  }
  const cfg = map[status] ?? map.unknown
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

export function TrendArrow({ trend }: { trend: LeadTimeTrend }) {
  if (trend === 'improving') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-green-600">
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 2l4 5H2l4-5z" />
        </svg>
        Improving
      </span>
    )
  }
  if (trend === 'worsening') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-red-600">
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 10L2 5h8l-4 5z" />
        </svg>
        Worsening
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#7a8598]">
      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
        <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
      Stable
    </span>
  )
}
