interface StatusBadgeProps {
  status: string
  type?: 'availability' | 'lifecycle' | 'match' | 'confidence'
}

const AVAILABILITY: Record<string, { label: string; cls: string }> = {
  in_stock: { label: 'In Stock', cls: 'bg-green-100 text-green-700 border-green-300' },
  out_of_stock: { label: 'Out of Stock', cls: 'bg-red-100 text-red-700 border-red-300' },
  eol_or_nrnd: { label: 'EOL / NRND', cls: 'bg-amber-100 text-amber-700 border-amber-300' },
  no_match: { label: 'No Match', cls: 'bg-surface-2 text-ink-subtle border-hairline' },
  long_lead: { label: 'Long Lead', cls: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
}

const LIFECYCLE: Record<string, { label: string; cls: string }> = {
  active: { label: 'Active', cls: 'bg-green-100 text-green-700 border-green-300' },
  nrnd: { label: 'NRND', cls: 'bg-amber-100 text-amber-700 border-amber-300' },
  eol: { label: 'EOL', cls: 'bg-red-100 text-red-700 border-red-300' },
  unknown: { label: 'Unknown', cls: 'bg-surface-2 text-ink-subtle border-hairline' },
}

const MATCH: Record<string, { label: string; cls: string }> = {
  matched: { label: 'Matched', cls: 'bg-blue-100 text-blue-700 border-blue-300' },
  no_mpn: { label: 'No MPN', cls: 'bg-surface-2 text-ink-subtle border-hairline' },
  not_found: { label: 'Not Found', cls: 'bg-surface-2 text-ink-tertiary border-hairline' },
}

export default function StatusBadge({ status, type = 'availability' }: StatusBadgeProps) {
  const map = type === 'lifecycle' ? LIFECYCLE : type === 'match' ? MATCH : AVAILABILITY
  const cfg = map[status] ?? { label: status, cls: 'bg-surface-2 text-ink-subtle border-hairline' }

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

export function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const cls = pct >= 70 ? 'bg-green-100 text-green-700 border-green-300' : pct >= 40 ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-red-100 text-red-700 border-red-300'

  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${cls}`}>{pct}% confidence</span>
}
