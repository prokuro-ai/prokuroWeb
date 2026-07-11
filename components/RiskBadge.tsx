import type { RiskLevel } from '@/lib/types'

const RISK_STYLES: Record<RiskLevel, { label: string; cls: string }> = {
  red: { label: 'Red', cls: 'bg-red-600 text-white border-red-600' },
  yellow: { label: 'Yellow', cls: 'bg-amber-500 text-white border-amber-500' },
  green: { label: 'Green', cls: 'bg-green-600 text-white border-green-600' },
}

export default function RiskBadge({ level }: { level: RiskLevel }) {
  const cfg = RISK_STYLES[level] ?? { label: level || '—', cls: 'bg-surface-2 text-ink-subtle border-hairline' }

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}
