'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { useAuth } from '@/components/AuthProvider'
import { listBoms } from '@/lib/api'
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

function formatUploadedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
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

  const totalAtRisk = boms.reduce((sum, bom) => sum + bom.atRiskCount, 0)
  const totalLines = boms.reduce((sum, bom) => sum + bom.lineCount, 0)
  const avgRisk = boms.length > 0 ? boms.reduce((sum, bom) => sum + bom.overallRiskScore, 0) / boms.length : null

  const summaryCards = [
    {
      label: 'BOMs tracked',
      value: String(boms.length),
      icon: (
        <svg className="h-4 w-4 text-[#0062ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
      color: '#eef4ff',
    },
    {
      label: 'At-risk lines',
      value: String(totalAtRisk),
      icon: (
        <svg className="h-4 w-4 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
      color: '#fffbeb',
    },
    {
      label: 'Avg. risk score',
      value: avgRisk === null ? '—' : avgRisk.toFixed(1),
      icon: (
        <svg className="h-4 w-4 text-[#8b5cf6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      color: '#f5f3ff',
    },
    {
      label: 'Total BOM lines',
      value: String(totalLines),
      icon: (
        <svg className="h-4 w-4 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: '#f0fdf4',
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
            <div key={card.label} className="rounded-xl border border-[#d6deea] bg-white p-4">
              <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: card.color }}>
                {card.icon}
              </div>
              <div className="text-[24px] font-semibold text-[#0f1b2d]" style={{ letterSpacing: '-0.5px' }}>
                {card.value}
              </div>
              <div className="mt-0.5 text-[12px] text-[#7a8598]">{card.label}</div>
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
                      <Link href={`/bom/${bom.id}`} className="text-[13px] font-medium text-[#0062ff] hover:text-[#0050e6]">
                        View →
                      </Link>
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
