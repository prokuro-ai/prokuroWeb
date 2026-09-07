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
      <div className="border border-mk-line bg-mk-canvas px-4 py-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="text-[12px] text-mk-ink-muted">{label}</span>
          <span className="mk-data text-[12px] text-mk-ink">
            {used == null ? '—' : used.toLocaleString()} / {limit == null ? '—' : limit.toLocaleString()}
          </span>
        </div>
        <div className="mb-2 h-1 overflow-hidden bg-mk-raised-2" />
        <p className="text-[11px] text-mk-ink-subtle">{hint ?? 'Waiting on your plan snapshot'}</p>
      </div>
    )
  }

  const safeLimit = Math.max(limit, 1)
  const pct = Math.min((used / safeLimit) * 100, 100)
  const remaining = Math.max(limit - used, 0)
  const hot = pct >= 90
  const warn = !hot && pct >= 70

  return (
    <div className="border border-mk-line bg-mk-canvas px-4 py-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[12px] text-mk-ink-muted">{label}</span>
        <span className="mk-data text-[12px] text-mk-ink">
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="mb-2 h-1 overflow-hidden bg-mk-raised-2">
        <div
          className="h-full transition-all"
          style={{
            width: `${pct}%`,
            background: hot ? 'var(--mk-red)' : warn ? 'var(--mk-amber)' : 'var(--mk-accent)',
          }}
        />
      </div>
      <p className="text-[11px] text-mk-ink-subtle">{hint ?? `${remaining.toLocaleString()} left this month`}</p>
    </div>
  )
}
