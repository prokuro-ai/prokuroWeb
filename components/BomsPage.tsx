'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DeleteBomButton } from '@/components/DeleteBomButton'
import BomBulkUploadModal from '@/components/BomBulkUploadModal'
import { useBoms } from '@/hooks/use-boms'
import { useTeam } from '@/hooks/use-team'
import { listBoms } from '@/lib/api'
import type { BomSummary } from '@/lib/types'
import { formatUploadedAt } from '@/lib/format'
import { bomRiskBand } from '@/lib/risk'
import { ArrowRight, Search } from 'lucide-react'

const BOM_FILTERS = ['All', 'Critical', 'Watch', 'Unknown', 'Clear'] as const
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
  canWrite,
  onView,
  onDelete,
}: {
  bom: BomSummary
  index: number
  canWrite: boolean
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
        : bandLabel === 'Unknown'
          ? { text: 'text-slate-500', accent: '#94a3b8', border: 'border-slate-200 hover:border-slate-300', showRail: false }
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
              {canWrite ? (
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
              ) : null}
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

function BomsList({ boms, loading, error, canWrite, onViewBom, onDelete, onUpload }: {
  boms: BomSummary[]
  loading: boolean
  error: string | null
  canWrite: boolean
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
    Unknown: searched.filter((b) => matchesBomFilter(b, 'Unknown')).length,
    Clear: searched.filter((b) => matchesBomFilter(b, 'Clear')).length,
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f6f9]">
      <div className="mx-auto max-w-[960px] px-6 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">BOMs</p>
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
                    <span className="font-mono font-medium text-[#c62026]">{totalAtRisk}</span> parts across your
                    program need attention
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
          {canWrite ? (
            <button
              type="button"
              onClick={onUpload}
              className="inline-flex shrink-0 items-center bg-[#0062ff] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-blue-700"
            >
              Upload BOM
            </button>
          ) : null}
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
        ) : error ? (
          <div className="border border-dashed border-amber-300 bg-amber-50 px-8 py-16 text-center">
            <p className="text-[16px] font-medium text-amber-900">Could not load BOMs</p>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-amber-800">
              {error}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center bg-[#0062ff] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : boms.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
            <p className="text-[16px] font-medium text-slate-800">Start with a real BOM</p>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-slate-500">
              Drop in CSV or Excel — messy headers, distributor SKUs, multi-sheet workbooks. Prokuro maps
              the columns and scores every line.
            </p>
            {canWrite ? (
              <button
                type="button"
                onClick={onUpload}
                className="mt-6 inline-flex items-center bg-[#0062ff] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-blue-700"
              >
                Upload your first BOM
              </button>
            ) : (
              <p className="mt-6 text-[13px] text-slate-400">Ask an admin to upload a BOM.</p>
            )}
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
                canWrite={canWrite}
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

export default function BomsPage() {
  const router = useRouter()
  const { boms, setBoms, loading, error } = useBoms()
  const { canWrite } = useTeam()
  const [uploadOpen, setUploadOpen] = useState(false)

  const handleUploadComplete = (saved: BomSummary[]) => {
    if (saved.length === 0) return
    setBoms((prev) => {
      const ids = new Set(prev.map((b) => b.id))
      return [...saved.filter((b) => !ids.has(b.id)), ...prev]
    })
    listBoms()
      .then((result) => setBoms(result.items))
      .catch(() => {})
  }

  return (
    <>
      <BomsList
        boms={boms}
        loading={loading}
        error={error}
        canWrite={canWrite}
        onViewBom={(id) => router.push(`/bom/${encodeURIComponent(id)}`)}
        onDelete={(id) => setBoms((prev) => prev.filter((b) => b.id !== id))}
        onUpload={() => setUploadOpen(true)}
      />
      <BomBulkUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onComplete={handleUploadComplete}
        existingBomCount={boms.length}
      />
    </>
  )
}
