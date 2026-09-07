'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DeleteBomButton } from '@/components/DeleteBomButton'
import BomBulkUploadModal from '@/components/BomBulkUploadModal'
import EmptyState from '@/components/app/EmptyState'
import PageHeader from '@/components/app/PageHeader'
import { appInput, appPage, appPrimaryBtn, appSheet } from '@/components/app/chrome'
import { useBoms } from '@/hooks/use-boms'
import { useTeam } from '@/hooks/use-team'
import { listBoms } from '@/lib/api'
import type { BomSummary } from '@/lib/types'
import { formatUploadedAt } from '@/lib/format'
import { BOM_BAND_LABEL, bomRiskBand, type BomBand } from '@/lib/risk'
import { Search } from 'lucide-react'

const BOM_FILTERS = ['All', 'Critical', 'Watch', 'Unknown', 'Clear'] as const
type BomFilter = (typeof BOM_FILTERS)[number]

const FILTER_LABEL: Record<BomFilter, string> = {
  All: 'All',
  Critical: BOM_BAND_LABEL.Critical,
  Watch: BOM_BAND_LABEL.Watch,
  Unknown: BOM_BAND_LABEL.Unknown,
  Clear: BOM_BAND_LABEL.Clear,
}

function matchesBomFilter(bom: BomSummary, filter: BomFilter): boolean {
  if (filter === 'All') return true
  return bomRiskBand(bom) === filter
}

function bandTone(band: BomBand): string {
  switch (band) {
    case 'Critical':
      return 'text-mk-red'
    case 'Watch':
      return 'text-mk-amber'
    case 'Unknown':
      return 'text-mk-ink-subtle'
    default:
      return 'text-mk-green'
  }
}

function railColor(band: BomBand): string | null {
  if (band === 'Critical') return 'var(--mk-red)'
  if (band === 'Watch') return 'var(--mk-amber)'
  return null
}

export default function BomsPage() {
  const router = useRouter()
  const { boms, setBoms, loading, error } = useBoms()
  const { canWrite } = useTeam()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<BomFilter>('All')

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

  const query = search.trim().toLowerCase()
  const searched = boms.filter(
    (b) => b.name.toLowerCase().includes(query) || b.filename.toLowerCase().includes(query),
  )
  const filtered = searched.filter((b) => matchesBomFilter(b, filter))
  const totalAtRisk = boms.reduce((sum, bom) => sum + bom.atRiskCount, 0)

  const filterCounts: Record<BomFilter, number> = {
    All: searched.length,
    Critical: searched.filter((b) => matchesBomFilter(b, 'Critical')).length,
    Watch: searched.filter((b) => matchesBomFilter(b, 'Watch')).length,
    Unknown: searched.filter((b) => matchesBomFilter(b, 'Unknown')).length,
    Clear: searched.filter((b) => matchesBomFilter(b, 'Clear')).length,
  }

  const status =
    loading || boms.length === 0
      ? undefined
      : totalAtRisk > 0
        ? `${boms.length} board${boms.length === 1 ? '' : 's'} · ${totalAtRisk} parts need a call`
        : `${boms.length} board${boms.length === 1 ? '' : 's'} · nothing needs a call`

  return (
    <>
      <div className={appPage}>
        <PageHeader
          title="Boards"
          description={status ?? (loading ? undefined : 'Upload a board list to see what to buy, drop, or watch.')}
          actions={
            canWrite ? (
              <button type="button" onClick={() => setUploadOpen(true)} className={appPrimaryBtn}>
                Upload
              </button>
            ) : null
          }
        />

        <div className="mx-auto max-w-[1180px] px-6 py-8">
          {!loading && boms.length > 0 ? (
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-mk-ink-subtle" aria-hidden />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find a board"
                  aria-label="Search boards"
                  className={`${appInput} pl-6`}
                />
              </div>
              <nav className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Filter boards">
                {BOM_FILTERS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFilter(option)}
                    className={`pb-0.5 text-[12px] transition-colors ${
                      filter === option
                        ? 'border-b border-mk-ink font-semibold text-mk-ink'
                        : 'text-mk-ink-subtle hover:text-mk-ink'
                    }`}
                  >
                    {FILTER_LABEL[option]}
                    <span className="ml-1.5 tabular-nums opacity-60">{filterCounts[option]}</span>
                  </button>
                ))}
              </nav>
            </div>
          ) : null}

          {loading ? (
            <div className={appSheet}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse border-b border-mk-line last:border-b-0" />
              ))}
            </div>
          ) : error ? (
            <EmptyState
              title="Could not load boards"
              description={error}
              action={
                <button type="button" onClick={() => window.location.reload()} className={appPrimaryBtn}>
                  Retry
                </button>
              }
            />
          ) : boms.length === 0 ? (
            <EmptyState
              title="Drop a board list in"
              description="We’ll tell you what to fix first."
              action={
                canWrite ? (
                  <button type="button" onClick={() => setUploadOpen(true)} className={appPrimaryBtn}>
                    Upload
                  </button>
                ) : (
                  <p className="text-[13px] text-mk-ink-subtle">Ask someone who can upload to add a board.</p>
                )
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState title="Nothing matches this filter." />
          ) : (
            <div className={appSheet}>
              <div className="hidden grid-cols-[minmax(0,1.4fr)_7rem_6rem_7rem_8rem_auto] gap-3 border-b border-mk-line px-5 py-2.5 md:grid">
                <span className="mk-eyebrow">Board</span>
                <span className="mk-eyebrow text-right">Parts</span>
                <span className="mk-eyebrow text-right">Need a call</span>
                <span className="mk-eyebrow">Status</span>
                <span className="mk-eyebrow">Uploaded</span>
                <span className="mk-eyebrow text-right"> </span>
              </div>
              {filtered.map((bom) => {
                const band = bomRiskBand(bom)
                const rail = railColor(band)
                return (
                  <div
                    key={bom.id}
                    className="relative grid grid-cols-1 items-center gap-2 border-b border-mk-line px-5 py-3 last:border-b-0 md:grid-cols-[minmax(0,1.4fr)_7rem_6rem_7rem_8rem_auto] md:gap-3"
                  >
                    {rail ? (
                      <span className="absolute inset-y-0 left-0 w-0.5" style={{ background: rail }} aria-hidden />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => router.push(`/bom/${encodeURIComponent(bom.id)}`)}
                      className="min-w-0 text-left"
                    >
                      <span className="block truncate text-[14px] font-medium text-mk-ink hover:text-mk-accent">
                        {bom.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-mk-ink-subtle">{bom.filename}</span>
                    </button>
                    <span className="mk-data text-[13px] text-mk-ink-muted md:text-right">
                      {bom.lineCount.toLocaleString()}
                    </span>
                    <span
                      className={`mk-data text-[13px] md:text-right ${
                        bom.atRiskCount > 0 ? 'text-mk-red' : 'text-mk-ink-muted'
                      }`}
                    >
                      {bom.atRiskCount}
                    </span>
                    <span className={`text-[12px] font-medium ${bandTone(band)}`}>{BOM_BAND_LABEL[band]}</span>
                    <span className="text-[12px] text-mk-ink-muted">{formatUploadedAt(bom.updatedAt || bom.uploadedAt)}</span>
                    <div className="flex justify-end">
                      {canWrite ? (
                        <DeleteBomButton
                          bomId={bom.id}
                          bomName={bom.name}
                          redirectTo={null}
                          variant="ghost"
                          label="Delete"
                          className="text-[12px] text-mk-ink-subtle hover:text-mk-red"
                          onDeleted={() => setBoms((prev) => prev.filter((row) => row.id !== bom.id))}
                        />
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <BomBulkUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onComplete={handleUploadComplete}
        existingBomCount={boms.length}
      />
    </>
  )
}
