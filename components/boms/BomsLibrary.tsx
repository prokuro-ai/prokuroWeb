'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, Search, UploadCloud } from 'lucide-react'
import AppShell from '@/components/app/AppShell'
import { usePortfolio } from '@/components/app/PortfolioContext'
import RiskRing from '@/components/dashboard/RiskRing'
import { DeleteBomButton } from '@/components/DeleteBomButton'
import { formatUploadedAt } from '@/lib/format'
import { riskTier } from '@/lib/portfolio'
import { inputWithIcon, linkPrimary } from '@/lib/ui/classes'

type RiskFilter = 'All' | 'High Risk' | 'Warning' | 'Healthy'

function BomsLibraryContent() {
  const { boms, loading, removeBom } = usePortfolio()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<RiskFilter>('All')

  const filtered = useMemo(() => {
    return boms.filter((bom) => {
      const query = search.toLowerCase()
      const matchesQuery =
        bom.name.toLowerCase().includes(query) || bom.filename.toLowerCase().includes(query)
      if (!matchesQuery) return false
      const tier = riskTier(bom.overallRiskScore)
      if (filter === 'High Risk') return tier === 'critical'
      if (filter === 'Warning') return tier === 'warning'
      if (filter === 'Healthy') return tier === 'healthy'
      return true
    })
  }, [boms, search, filter])

  const totalLines = boms.reduce((sum, bom) => sum + bom.lineCount, 0)

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-8 pt-5">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Bills of Materials</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {boms.length} BOM{boms.length === 1 ? '' : 's'} · {totalLines.toLocaleString()} total lines monitored
          </p>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search BOMs or filenames…"
            className={`${inputWithIcon} max-w-sm flex-1 bg-canvas`}
          />
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
          {(['All', 'High Risk', 'Warning', 'Healthy'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                filter === option ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-400">Loading BOMs…</div>
      ) : boms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-20 text-center">
          <UploadCloud className="mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-700">No BOMs yet</p>
          <p className="mt-1 text-sm text-slate-500">Upload a BOM from the header to start tracking risk.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filtered.map((bom) => {
              const tier = riskTier(bom.overallRiskScore)
              const border =
                tier === 'critical' ? 'border-red-200' : tier === 'warning' ? 'border-amber-200' : 'border-emerald-200'
              return (
                <div
                  key={bom.id}
                  className={`rounded-xl border bg-canvas p-6 shadow-sm transition-shadow hover:shadow-md ${border}`}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-slate-900">{bom.name}</h3>
                      <p className="mt-0.5 truncate font-mono text-xs text-slate-400">{bom.filename}</p>
                    </div>
                    <RiskRing score={bom.overallRiskScore} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-slate-900">{bom.lineCount}</div>
                      <div className="text-xs text-slate-500">Lines</div>
                    </div>
                    <div>
                      <div className={`text-lg font-bold ${bom.atRiskCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {bom.atRiskCount}
                      </div>
                      <div className="text-xs text-slate-500">At Risk</div>
                    </div>
                    <div>
                      <div className="mt-1 text-xs text-slate-400">{formatUploadedAt(bom.uploadedAt)}</div>
                      <div className="text-xs text-slate-500">Uploaded</div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/bom/${bom.id}`}
                      className={`flex flex-1 items-center justify-center gap-1 rounded-lg border border-hairline py-2 text-sm ${linkPrimary} transition-colors hover:border-primary`}
                    >
                      View Full Report <ArrowRight className="h-4 w-4" />
                    </Link>
                    <DeleteBomButton
                      bomId={bom.id}
                      bomName={bom.name}
                      redirectTo={null}
                      variant="ghost"
                      label="Delete"
                      className="px-3 py-2 text-xs"
                      onDeleted={() => removeBom(bom.id)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          {filtered.length === 0 && (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">No BOMs match your search.</div>
          )}
        </>
      )}
    </div>
  )
}

export default function BomsLibrary() {
  return (
    <AppShell>
      <BomsLibraryContent />
    </AppShell>
  )
}
