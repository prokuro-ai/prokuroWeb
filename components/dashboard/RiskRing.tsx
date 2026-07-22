interface RiskRingProps {
  score: number
  size?: 'sm' | 'md'
}

export default function RiskRing({ score, size = 'md' }: RiskRingProps) {
  const isHigh = score >= 7
  const isMed = score >= 4 && score < 7
  const colorClass = isHigh ? 'text-red-500' : isMed ? 'text-amber-500' : 'text-emerald-500'
  const bgColor = isHigh ? '#fee2e2' : isMed ? '#fef3c7' : '#d1fae5'
  const fgColor = isHigh ? '#ef4444' : isMed ? '#f59e0b' : '#10b981'
  const pct = (score / 10) * 100
  const r = size === 'sm' ? 20 : 24
  const circ = 2 * Math.PI * r
  const dim = size === 'sm' ? 'w-12 h-12' : 'w-14 h-14'
  const center = size === 'sm' ? 24 : 28

  return (
    <div className={`relative ${dim} flex items-center justify-center`}>
      <svg className="absolute h-full w-full -rotate-90">
        <circle cx={center} cy={center} r={r} stroke={bgColor} strokeWidth="4" fill="transparent" />
        <circle
          cx={center}
          cy={center}
          r={r}
          stroke={fgColor}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * pct) / 100}
        />
      </svg>
      <span className={`text-sm font-bold ${colorClass}`}>{score.toFixed(1)}</span>
    </div>
  )
}
