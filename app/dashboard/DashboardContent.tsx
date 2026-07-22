'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import { ChevronRight, FileText, MessageSquarePlus, UploadCloud } from 'lucide-react'
import AppShell from '@/components/app/AppShell'
import { usePortfolio } from '@/components/app/PortfolioContext'
import PortfolioFeed from '@/components/dashboard/PortfolioFeed'
import PortfolioRisk from '@/components/dashboard/PortfolioRisk'
import { useAuth } from '@/components/AuthProvider'
import { formatUploadedAt } from '@/lib/format'
import { portfolioFeedMessages, portfolioStats } from '@/lib/portfolio'
import { alertError, btnPrimary, card, cardPadded, linkPrimary } from '@/lib/ui/classes'

function SuggestionFeedback() {
  return (
    <div className={`mt-8 ${cardPadded}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0062ff]">
          <MessageSquarePlus className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">Suggest a feature</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Tell us what would make Prokuro more useful for your team — we read every suggestion.
          </p>
          <a
            href="mailto:hello@prokuro.ai?subject=Prokuro%20feature%20suggestion"
            className="mt-3 inline-flex text-sm font-semibold text-[#0062ff] hover:text-blue-700"
          >
            Send feedback →
          </a>
        </div>
      </div>
    </div>
  )
}

function DashboardOverview() {
  const { boms, loading, error } = usePortfolio()
  const stats = useMemo(() => portfolioStats(boms), [boms])
  const feedMessages = useMemo(() => portfolioFeedMessages(boms), [boms])

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <PortfolioFeed messages={feedMessages} />

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          {
            label: 'Total BOMs',
            value: loading ? '—' : String(stats.totalBoms),
            sub: 'across all projects',
            highlight: false,
          },
          {
            label: 'Lines Monitored',
            value: loading ? '—' : stats.totalLines.toLocaleString(),
            sub: 'components tracked',
            highlight: false,
          },
          {
            label: 'Needs Attention',
            value: loading ? '—' : String(stats.criticalCount + stats.warningCount),
            sub: `${stats.criticalCount} critical · ${stats.warningCount} warning`,
            highlight: stats.criticalCount + stats.warningCount > 0,
          },
        ].map((card) => (
          <div key={card.label} className={cardPadded}>
            <span className="text-sm font-medium text-slate-500">{card.label}</span>
            <span
              className={`mt-1 text-3xl font-bold tracking-tight ${card.highlight ? 'text-red-600' : 'text-slate-900'}`}
            >
              {card.value}
            </span>
            <span className="mt-1 text-xs text-slate-400">{card.sub}</span>
          </div>
        ))}
      </div>

      {error && <div className={`mb-6 ${alertError}`}>{error}</div>}

      {!loading && boms.length > 0 && <PortfolioRisk boms={boms} />}

      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-400">Loading BOMs…</div>
      ) : boms.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <p className="text-base font-medium text-slate-700">No BOMs yet</p>
          <p className="mt-1 text-sm text-slate-400">Upload a BOM to start monitoring risk.</p>
          <Link
            href="/bom/new"
            className={`mt-4 ${btnPrimary}`}
          >
            <UploadCloud className="h-4 w-4" />
            Upload your first BOM
          </Link>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Needs Attention</h2>
            <Link href="/boms" className={`flex items-center gap-1 text-xs ${linkPrimary}`}>
              View all BOMs <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className={`overflow-hidden ${card}`}>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <tr>
                  {['BOM Name', 'At-Risk Parts', 'Last Updated', ''].map((header) => (
                    <th key={header} className="px-5 py-3.5 font-semibold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.needsAttention.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                      No at-risk lines detected across your portfolio.
                    </td>
                  </tr>
                ) : (
                  stats.needsAttention.slice(0, 8).map((bom) => (
                    <tr key={bom.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                          {bom.name}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold text-red-600">{bom.atRiskCount} parts</span>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{formatUploadedAt(bom.uploadedAt)}</td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/bom/${bom.id}`}
                          className={`ml-auto flex items-center justify-end gap-1 ${linkPrimary}`}
                        >
                          View <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SuggestionFeedback />
    </div>
  )
}

export default function DashboardContent() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return
    if (!user) router.replace('/login')
  }, [authLoading, user, router])

  if (authLoading || !user) return null

  return (
    <AppShell>
      <DashboardOverview />
    </AppShell>
  )
}
