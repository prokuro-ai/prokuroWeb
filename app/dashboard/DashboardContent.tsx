'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { useAuth } from '@/components/AuthProvider'
import { listBoms } from '@/lib/api'
import { formatUploadedAt } from '@/lib/format'
import { DeleteBomButton } from '@/components/DeleteBomButton'
import type { BomSummary } from '@/lib/types'

function RiskBar({ score }: { score: number }) {
  const pct = (score / 10) * 100
  const color = score >= 7 ? '#ef4444' : score >= 4 ? '#f59e0b' : '#22c55e'
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e8edf4]">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}


export default function DashboardContent() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [boms, setBoms] = useState<BomSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login')
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    listBoms()
      .then((items) => {
        if (!cancelled) setBoms(items)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load BOMs')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [authLoading, user, router])

  const { totalAtRisk, totalLines, avgRisk } = useMemo(() => {
    const totalAtRisk = boms.reduce((sum, bom) => sum + bom.atRiskCount, 0)
    const totalLines = boms.reduce((sum, bom) => sum + bom.lineCount, 0)
    const avgRisk = boms.length > 0 ? boms.reduce((sum, bom) => sum + bom.overallRiskScore, 0) / boms.length : null
    return { totalAtRisk, totalLines, avgRisk }
  }, [boms])

  const summaryCards = [
    {
      label: 'BOMs tracked',
      value: String(boms.length),
      icon: <StackIcon />,
      accent: '#0062ff',
      tint: '#eef4ff',
    },
    {
      label: 'At-risk lines',
      value: String(totalAtRisk),
      icon: <PulseIcon />,
      accent: '#b45309',
      tint: '#fef3e2',
    },
    {
      label: 'Avg. risk score',
      value: avgRisk === null ? '—' : avgRisk.toFixed(1),
      icon: <GaugeIcon />,
      accent: '#6d28d9',
      tint: '#f4f0fe',
    },
    {
      label: 'Total BOM lines',
      value: String(totalLines),
      icon: <RowsIcon />,
      accent: '#15803d',
      tint: '#eefaf1',
    },
  ]

  return (
    <AppLayout>
      <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-[#d6deea] bg-white px-6">
        <h1 className="text-[15px] font-semibold text-[#0f1b2d]">Dashboard</h1>
        <Link
          href="/bom/new"
          className="flex items-center gap-1.5 rounded-lg bg-[#0062ff] px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#0050e6]"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Upload BOM
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 grid grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="flex items-center gap-3 rounded-xl border border-[#d6deea] bg-white p-4">
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center [clip-path:polygon(22%_0,100%_0,100%_100%,0_100%)]"
                style={{ background: card.tint, color: card.accent }}
              >
                {card.icon}
              </div>
              <div>
                <div className="text-[24px] font-semibold leading-none text-[#0f1b2d]" style={{ letterSpacing: '-0.5px' }}>
                  {card.value}
                </div>
                <div className="mt-1 text-[12px] text-[#7a8598]">{card.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-[#d6deea] bg-white">
          <div className="flex items-center justify-between border-b border-[#d6deea] px-5 py-3.5">
            <h2 className="text-[13px] font-semibold text-[#0f1b2d]">Your BOMs</h2>
            <span className="text-[12px] text-[#7a8598]">{boms.length} BOM{boms.length === 1 ? '' : 's'}</span>
          </div>

          {error && (
            <div className="border-b border-[#d6deea] bg-red-50 px-5 py-3 text-[13px] text-red-700">{error}</div>
          )}

          <table className="w-full">
            <thead>
              <tr className="border-b border-[#d6deea] bg-[#f4f6f9]">
                {['BOM Name', 'Lines', 'At Risk', 'Risk Score', 'Uploaded', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-[#7a8598]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-[13px] text-[#7a8598]">
                    Loading BOMs…
                  </td>
                </tr>
              ) : boms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <p className="text-[14px] font-medium text-[#0f1b2d]">No BOMs yet</p>
                    <p className="mt-1 text-[13px] text-[#7a8598]">Upload a BOM to see your portfolio here.</p>
                    <Link
                      href="/bom/new"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0062ff] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0050e6]"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Upload your first BOM
                    </Link>
                  </td>
                </tr>
              ) : (
                boms.map((bom) => (
                  <tr key={bom.id} className="border-b border-[#d6deea] last:border-b-0 hover:bg-[#fafbfc]">
                    <td className="px-4 py-3">
                      <div className="text-[13px] font-medium text-[#0f1b2d]">{bom.name}</div>
                      <div className="mt-0.5 text-[11px] text-[#98a3b6]">{bom.filename}</div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#4f5d73]">{bom.lineCount}</td>
                    <td className="px-4 py-3 text-[13px] text-[#4f5d73]">{bom.atRiskCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 text-[13px] font-medium text-[#0f1b2d]">{bom.overallRiskScore.toFixed(1)}</span>
                        <div className="w-20">
                          <RiskBar score={bom.overallRiskScore} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#7a8598]">{formatUploadedAt(bom.uploadedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link href={`/bom/${bom.id}`} className="text-[13px] font-medium text-[#0062ff] hover:text-[#0050e6]">
                          View →
                        </Link>
                        <DeleteBomButton
                          bomId={bom.id}
                          bomName={bom.name}
                          redirectTo={null}
                          variant="ghost"
                          label="Delete"
                          className="px-2 py-1 text-[12px]"
                          onDeleted={() => setBoms((prev) => prev.filter((item) => item.id !== bom.id))}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}

function StackIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="4" width="14" height="4.5" rx="1" fill="currentColor" opacity="0.35" />
      <rect x="5" y="9.75" width="14" height="4.5" rx="1" fill="currentColor" opacity="0.65" />
      <rect x="5" y="15.5" width="14" height="4.5" rx="1" fill="currentColor" />
    </svg>
  )
}

function PulseIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4l2-6 4 12 2-6h6" />
    </svg>
  )
}

function GaugeIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" d="M4.5 16a7.5 7.5 0 1115 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16l3.5-4.5" />
      <circle cx="12" cy="16" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function RowsIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" d="M4 6.5h16M4 12h16M4 17.5h10" />
    </svg>
  )
}
