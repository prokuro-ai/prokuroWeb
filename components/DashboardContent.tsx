'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Link } from '@/lib/navigation'
import { useAuth } from '@/components/AuthProvider'
import { listBoms } from '@/lib/api'
import { DeleteBomButton } from '@/components/DeleteBomButton'
import BomBulkUploadModal from '@/components/BomBulkUploadModal'
import DashboardShell from '@/components/DashboardShell'
import type { BomSummary } from '@/lib/types'
import { formatUploadedAt } from '@/lib/format'
import { bomRiskBand, type BomBand } from '@/lib/risk'
import { ArrowRight, Search } from 'lucide-react'

// ─── Overview (action board) ──────────────────────────────────────────────────

const BOARD_LANES: {
  band: BomBand
  title: string
  hint: string
  accent: string
  text: string
  rail: string
}[] = [
  {
    band: 'Critical',
    title: 'Critical',
    hint: 'Act this week',
    accent: '#c62026',
    text: 'text-[#c62026]',
    rail: 'border-[#c62026]/30 bg-[rgb(198_32_38_/_4%)]',
  },
  {
    band: 'Watch',
    title: 'Watch',
    hint: 'Track closely',
    accent: '#a25a05',
    text: 'text-[#a25a05]',
    rail: 'border-[#a25a05]/30 bg-[rgb(162_90_5_/_5%)]',
  },
  {
    band: 'Clear',
    title: 'Clear',
    hint: 'No flags',
    accent: '#167c48',
    text: 'text-[#167c48]',
    rail: 'border-slate-200 bg-white',
  },
]

function OverviewPage({ boms, loading, goToBoms, onViewBom }: {
  boms: BomSummary[]
  loading: boolean
  goToBoms: () => void
  onViewBom: (id: string) => void
}) {
  const totalLines = boms.reduce((s, b) => s + b.lineCount, 0)
  const totalAtRisk = boms.reduce((s, b) => s + b.atRiskCount, 0)

  const lanes = useMemo(() => {
    const buckets: Record<BomBand, BomSummary[]> = { Critical: [], Watch: [], Clear: [] }
    for (const bom of boms) {
      buckets[bomRiskBand(bom)].push(bom)
    }
    for (const band of Object.keys(buckets) as BomBand[]) {
      buckets[band].sort((a, b) => b.atRiskCount - a.atRiskCount || b.overallRiskScore - a.overallRiskScore)
    }
    return buckets
  }, [boms])

  const criticalN = lanes.Critical.length
  const watchN = lanes.Watch.length

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="border-b border-slate-200">
        <div className="mx-auto max-w-[1180px] px-6 py-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">Dashboard</p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-900">
            {loading ? 'Loading portfolio…' : 'Where to act next'}
          </h1>

          {!loading && boms.length > 0 ? (
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-500">
              {criticalN + watchN === 0 ? (
                <>
                  All <span className="font-mono font-medium text-slate-800">{boms.length}</span> BOMs are clear
                  across <span className="font-mono font-medium text-slate-800">{totalLines.toLocaleString()}</span> lines.
                </>
              ) : (
                <>
                  You have{' '}
                  {criticalN > 0 ? (
                    <>
                      <span className="font-mono font-semibold text-[#c62026]">{criticalN}</span> critical
                    </>
                  ) : null}
                  {criticalN > 0 && watchN > 0 ? ' and ' : null}
                  {watchN > 0 ? (
                    <>
                      <span className="font-mono font-semibold text-[#a25a05]">{watchN}</span> on watch
                    </>
                  ) : null}
                  {' '}
                  — <span className="font-mono font-medium text-slate-800">{totalAtRisk}</span> parts flagged
                  across the portfolio. Work the board left to right.
                </>
              )}
            </p>
          ) : !loading ? (
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate-500">
              Upload a BOM to start scoring lifecycle, stock, and trade exposure. Your action board fills in from there.
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={goToBoms}
              className="inline-flex items-center gap-1.5 bg-[#0062ff] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-blue-700"
            >
              Open BOMs
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            {!loading && boms.length > 0 ? (
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-slate-400">
                {boms.length} BOMs · {totalLines.toLocaleString()} lines
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-6 py-8">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="min-h-[280px] animate-pulse border border-slate-200 bg-[#f4f6f9]" />
            ))}
          </div>
        ) : boms.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-[#f4f6f9] px-8 py-20 text-center">
            <p className="text-[16px] font-medium text-slate-800">Your action board is empty</p>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-slate-500">
              Once you upload BOMs, they land here sorted into Critical, Watch, and Clear so you know where to start.
            </p>
            <button
              type="button"
              onClick={goToBoms}
              className="mt-6 inline-flex items-center gap-1.5 bg-[#0062ff] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-blue-700"
            >
              Go to BOMs
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {BOARD_LANES.map((lane) => {
              const items = lanes[lane.band]
              return (
                <section key={lane.band} className={`flex min-h-[320px] flex-col border ${lane.rail}`}>
                  <header className="flex items-baseline justify-between gap-3 border-b border-slate-200/80 px-4 py-3">
                    <div>
                      <h2 className={`font-mono text-[11px] font-semibold uppercase tracking-[0.12em] ${lane.text}`}>
                        {lane.title}
                      </h2>
                      <p className="mt-0.5 text-[12px] text-slate-400">{lane.hint}</p>
                    </div>
                    <span className={`font-mono text-[22px] font-semibold tabular-nums ${lane.text}`}>
                      {items.length}
                    </span>
                  </header>

                  <div className="flex flex-1 flex-col gap-2 p-3">
                    {items.length === 0 ? (
                      <p className="px-1 py-6 text-center text-[13px] text-slate-400">Nothing here.</p>
                    ) : (
                      items.map((bom, i) => (
                        <button
                          key={bom.id}
                          type="button"
                          onClick={() => onViewBom(bom.id)}
                          className="group border border-slate-200/80 bg-white px-3.5 py-3 text-left transition-all hover:border-slate-300 hover:shadow-[0_12px_28px_-20px_rgb(15_27_45_/_35%)]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono text-[10px] tabular-nums text-slate-300">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <span className={`font-mono text-[14px] font-semibold tabular-nums ${lane.text}`}>
                              {bom.overallRiskScore.toFixed(1)}
                            </span>
                          </div>
                          <p className="mt-1.5 truncate text-[14px] font-semibold text-slate-900 group-hover:text-[#0062ff]">
                            {bom.name}
                          </p>
                          <p className="mt-1 font-mono text-[11px] text-slate-400">
                            {bom.lineCount.toLocaleString()} lines
                            {bom.atRiskCount > 0 ? (
                              <>
                                <span className="mx-1.5 text-slate-300">·</span>
                                <span className="text-[#c62026]">{bom.atRiskCount} at risk</span>
                              </>
                            ) : null}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── BOMs tab ─────────────────────────────────────────────────────────────────

const BOM_FILTERS = ['All', 'Critical', 'Watch', 'Clear'] as const
type BomFilter = (typeof BOM_FILTERS)[number]

function matchesBomFilter(bom: BomSummary, filter: BomFilter): boolean {
  if (filter === 'All') return true
  return bomRiskBand(bom) === filter
}

function BomDossierSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse border border-slate-200 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-6">
            <div className="flex min-w-0 flex-1 gap-5">
              <div className="h-4 w-6 bg-slate-100" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-56 bg-slate-200" />
                <div className="h-3 w-40 bg-slate-100" />
                <div className="h-3 w-72 bg-slate-100" />
              </div>
            </div>
            <div className="h-10 w-16 bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

function BomDossier({
  bom,
  index,
  onView,
  onDelete,
}: {
  bom: BomSummary
  index: number
  onView: () => void
  onDelete: () => void
}) {
  const bandLabel = bomRiskBand(bom)
  // Style accents from the band label (not raw score alone) so UI matches filters.
  const style =
    bandLabel === 'Critical'
      ? { text: 'text-[#c62026]', accent: '#c62026', border: 'border-[#c62026]/25 hover:border-[#c62026]/45', showRail: true }
      : bandLabel === 'Watch'
        ? { text: 'text-[#a25a05]', accent: '#a25a05', border: 'border-[#a25a05]/25 hover:border-[#a25a05]/40', showRail: true }
        : { text: 'text-[#167c48]', accent: '#167c48', border: 'border-slate-200 hover:border-slate-300', showRail: false }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onView()
        }
      }}
      className={`group relative cursor-pointer border bg-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0062ff] ${style.border} hover:shadow-[0_18px_40px_-28px_rgb(15_27_45_/_30%)]`}
    >
      {style.showRail ? (
        <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: style.accent }} aria-hidden />
      ) : null}

      <div className="flex flex-col gap-5 px-6 py-5 sm:flex-row sm:items-stretch sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-4 sm:gap-5">
          <span className="mt-0.5 shrink-0 font-mono text-[12px] tabular-nums text-slate-300">
            {String(index + 1).padStart(2, '0')}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 className="truncate text-[16px] font-semibold tracking-tight text-slate-900 transition-colors group-hover:text-[#0062ff]">
                {bom.name}
              </h3>
              <span className={`font-mono text-[11px] font-semibold uppercase tracking-[0.08em] ${style.text}`}>
                {bandLabel}
              </span>
            </div>

            <p className="mt-1 truncate font-mono text-[12px] text-slate-400">{bom.filename}</p>

            <p className="mt-3 text-[13px] leading-relaxed text-slate-500">
              <span className="font-mono tabular-nums text-slate-700">{bom.lineCount.toLocaleString()}</span>
              {' '}lines
              <span className="mx-2 text-slate-300">·</span>
              {bom.atRiskCount > 0 ? (
                <>
                  <span className="font-mono tabular-nums font-semibold text-[#c62026]">{bom.atRiskCount}</span>
                  {' '}parts need attention
                </>
              ) : (
                <span className="text-[#167c48]">No parts flagged</span>
              )}
              <span className="mx-2 text-slate-300">·</span>
              Uploaded {formatUploadedAt(bom.uploadedAt)}
            </p>

            <div className="mt-4 flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0062ff]">
                Open report
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
              <span
                role="presentation"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <DeleteBomButton
                  bomId={bom.id}
                  bomName={bom.name}
                  redirectTo={null}
                  variant="ghost"
                  label="Delete"
                  className="text-[12px] text-slate-400 hover:text-red-600"
                  onDeleted={onDelete}
                />
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-slate-100 pt-4 sm:w-28 sm:flex-col sm:items-end sm:justify-center sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-slate-400 sm:mb-1">Score</span>
          <span className={`font-mono text-[28px] font-semibold tabular-nums leading-none ${style.text}`}>
            {bom.overallRiskScore.toFixed(1)}
          </span>
          
        </div>
      </div>
    </article>
  )
}

function BomsPage({ boms, loading, onViewBom, onDelete, onUpload }: {
  boms: BomSummary[]
  loading: boolean
  onViewBom: (id: string) => void
  onDelete: (id: string) => void
  onUpload: () => void
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<BomFilter>('All')

  const query = search.trim().toLowerCase()
  const searched = boms.filter(
    (b) => b.name.toLowerCase().includes(query) || b.filename.toLowerCase().includes(query),
  )
  const filtered = searched.filter((b) => matchesBomFilter(b, filter))

  const totalLines = boms.reduce((s, b) => s + b.lineCount, 0)
  const totalAtRisk = boms.reduce((s, b) => s + b.atRiskCount, 0)
  const criticalCount = boms.filter((b) => bomRiskBand(b) === 'Critical').length
  const watchCount = boms.filter((b) => bomRiskBand(b) === 'Watch').length

  const filterCounts: Record<BomFilter, number> = {
    All: searched.length,
    Critical: searched.filter((b) => matchesBomFilter(b, 'Critical')).length,
    Watch: searched.filter((b) => matchesBomFilter(b, 'Watch')).length,
    Clear: searched.filter((b) => matchesBomFilter(b, 'Clear')).length,
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f6f9]">
      <div className="mx-auto max-w-[960px] px-6 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">Portfolio</p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-900">
              Bills of Materials
            </h1>
            {!loading && boms.length > 0 ? (
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-slate-500">
                Monitoring{' '}
                <span className="font-mono font-medium text-slate-800">{boms.length}</span> BOMs across{' '}
                <span className="font-mono font-medium text-slate-800">{totalLines.toLocaleString()}</span> lines.
                {totalAtRisk > 0 ? (
                  <>
                    {' '}
                    <span className="font-mono font-medium text-[#c62026]">{totalAtRisk}</span> parts across the
                    portfolio need attention
                    {criticalCount > 0 ? (
                      <>
                        {' '}
                        · <span className="font-mono font-medium text-[#c62026]">{criticalCount}</span> critical
                      </>
                    ) : null}
                    {watchCount > 0 ? (
                      <>
                        {' '}
                        · <span className="font-mono font-medium text-[#a25a05]">{watchCount}</span> on watch
                      </>
                    ) : null}
                    .
                  </>
                ) : (
                  <> All BOMs look clear.</>
                )}
              </p>
            ) : (
              <p className="mt-2 text-[14px] text-slate-500">
                Upload a BOM to start scoring lifecycle, supply, and trade risk.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onUpload}
            className="inline-flex shrink-0 items-center bg-[#0062ff] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-blue-700"
          >
            Upload BOM
          </button>
        </div>

        {!loading && boms.length > 0 ? (
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by name or filename"
                aria-label="Search BOMs"
                className="w-full border-0 border-b border-slate-300 bg-transparent py-2 pl-6 pr-2 text-[14px] text-slate-800 placeholder:text-slate-400 focus:border-[#0062ff] focus:outline-none"
              />
            </div>
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Filter BOMs by risk">
              {BOM_FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
                    filter === f
                      ? 'border-b-2 border-slate-900 pb-0.5 font-semibold text-slate-900'
                      : 'pb-0.5 text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {f}
                  <span className="ml-1.5 tabular-nums opacity-60">{filterCounts[f]}</span>
                </button>
              ))}
            </nav>
          </div>
        ) : null}

        {loading ? (
          <BomDossierSkeleton />
        ) : boms.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
            <p className="text-[16px] font-medium text-slate-800">Start with a real BOM</p>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-slate-500">
              Drop in CSV or Excel — messy headers, distributor SKUs, multi-sheet workbooks. Prokuro maps
              the columns and scores every line.
            </p>
            <button
              type="button"
              onClick={onUpload}
              className="mt-6 inline-flex items-center bg-[#0062ff] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-blue-700"
            >
              Upload your first BOM
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-[14px] text-slate-400">
            Nothing matches this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((bom, index) => (
              <BomDossier
                key={bom.id}
                bom={bom}
                index={index}
                onView={() => onViewBom(bom.id)}
                onDelete={() => onDelete(bom.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

type Page = 'dashboard' | 'boms'

export default function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [boms, setBoms] = useState<BomSummary[]>([])
  const [loading, setLoading] = useState(true)

  const tabParam = searchParams.get('tab')
  const page: Page = tabParam === 'boms' ? 'boms' : 'dashboard'

  const dashboardUrl = (tab: Page) => `/dashboard?tab=${tab}`

  const setPage = (next: Page) => {
    router.push(dashboardUrl(next))
  }

  const viewBom = (id: string) => {
    router.push(`/bom/${encodeURIComponent(id)}`)
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    let cancelled = false
    setLoading(true)
    listBoms()
      .then((result) => {
        if (!cancelled) setBoms(result.items)
      })
      .catch(() => { /* keep empty list */ })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [authLoading, user, router])

  const [uploadOpen, setUploadOpen] = useState(false)

  const handleUploadComplete = (saved: BomSummary[]) => {
    if (saved.length === 0) return
    setBoms((prev) => {
      const ids = new Set(prev.map((b) => b.id))
      return [...saved.filter((b) => !ids.has(b.id)), ...prev]
    })
    listBoms()
      .then((result) => setBoms(result.items))
      .catch(() => { /* keep merged list */ })
  }

  return (
    <DashboardShell
      activeTab={page === 'boms' ? 'boms' : 'dashboard'}
      bomCount={boms.length}
    >
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {page === 'dashboard' ? (
          <OverviewPage
            boms={boms}
            loading={loading}
            goToBoms={() => setPage('boms')}
            onViewBom={viewBom}
          />
        ) : (
          <BomsPage
            boms={boms}
            loading={loading}
            onViewBom={viewBom}
            onDelete={(id) => setBoms((prev) => prev.filter((b) => b.id !== id))}
            onUpload={() => setUploadOpen(true)}
          />
        )}
      </div>

      <BomBulkUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onComplete={handleUploadComplete}
        existingBomCount={boms.length}
      />

      <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 shrink-0 bg-[#0062ff]"
              style={{ clipPath: 'polygon(24% 0, 100% 0, 100% 100%, 0% 100%)' }}
            />
            <span className="text-xs font-semibold text-[#0f1b2d]">
              Prokuro<span className="text-[#0062ff]">.ai</span>
            </span>
          </div>
          <span className="text-xs text-slate-400">© 2026 Prokuro.ai. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-slate-400 transition-colors hover:text-slate-700">
            Home
          </Link>
          <a
            href="https://www.linkedin.com/company/prokuro/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 transition-colors hover:text-slate-700"
          >
            LinkedIn
          </a>
        </div>
      </footer>
    </DashboardShell>
  )
}
