const BLUE = '#0062ff'
const NAVY = '#0f1b2d'

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
      <div className="border border-slate-200 bg-white px-4 py-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="text-[12px] text-slate-500">{label}</span>
          <span className="font-mono text-[12px] tabular-nums font-semibold" style={{ color: NAVY }}>
            {used == null ? '—' : used.toLocaleString()} / {limit == null ? '—' : limit.toLocaleString()}
          </span>
        </div>
        <div className="mb-2 h-1.5 overflow-hidden bg-slate-100" />
        <p className="text-[11px] text-slate-400">{hint ?? 'Waiting on billing status from the server'}</p>
      </div>
    )
  }

  const safeLimit = Math.max(limit, 1)
  const pct = Math.min((used / safeLimit) * 100, 100)
  const remaining = Math.max(limit - used, 0)
  const hot = pct >= 90
  const warn = !hot && pct >= 70

  return (
    <div className="border border-slate-200 bg-white px-4 py-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[12px] text-slate-500">{label}</span>
        <span className="font-mono text-[12px] tabular-nums font-semibold" style={{ color: NAVY }}>
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="mb-2 h-1.5 overflow-hidden bg-slate-100">
        <div
          className="h-full transition-all"
          style={{
            width: `${pct}%`,
            background: hot ? '#c62026' : warn ? '#b45309' : BLUE,
          }}
        />
      </div>
      <p className="text-[11px] text-slate-400">
        {hint ?? `${remaining.toLocaleString()} remaining this period`}
      </p>
    </div>
  )
}
