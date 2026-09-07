import { appSheet } from '@/components/app/chrome'

export function UsageMeter({
  label,
  used,
  limit,
  hint,
}: {
  label: string
  used: number | null | undefined
  limit: number | null | undefined
  hint?: string
}) {
  if (used == null || limit == null) {
    return (
      <div className={`${appSheet} px-5 py-5`}>
        <p className="mk-eyebrow">{label}</p>
        <p className="mk-app-title mt-3 text-mk-ink">—</p>
        <p className="mt-2 text-[12px] text-mk-ink-subtle">{hint ?? 'Waiting on your plan snapshot'}</p>
      </div>
    )
  }

  const safeLimit = Math.max(limit, 1)
  const pct = Math.min((used / safeLimit) * 100, 100)
  const remaining = Math.max(limit - used, 0)
  const hot = pct >= 90
  const warn = !hot && pct >= 70

  return (
    <div className={`${appSheet} px-5 py-5`}>
      <p className="mk-eyebrow">{label}</p>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="mk-app-title text-mk-ink">{used.toLocaleString()}</span>
        <span className="text-[13px] text-mk-ink-subtle">/ {limit.toLocaleString()}</span>
      </p>
      <div className="mt-4 h-px overflow-hidden bg-mk-raised-2">
        <div
          className="h-full transition-all"
          style={{
            width: `${pct}%`,
            background: hot ? 'var(--mk-red)' : warn ? 'var(--mk-amber)' : 'var(--mk-accent)',
          }}
        />
      </div>
      <p className="mt-2 text-[12px] text-mk-ink-subtle">{hint ?? `${remaining.toLocaleString()} left this month`}</p>
    </div>
  )
}
