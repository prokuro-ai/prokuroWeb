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
import { ArrowRight, Search, Upload } from 'lucide-react'

// ─── Portfolio helpers ────────────────────────────────────────────────────────

type PortfolioStats = {
  bomCount: number
  totalLines: number
  totalAtRisk: number
  totalUnknown: number
  scorableLines: number
  clearLines: number
  flaggedPct: number
  avgScore: number
  bandCounts: Record<BomBand, number>
  priorityBoms: BomSummary[]
  recentBoms: BomSummary[]
}

function computePortfolioStats(boms: BomSummary[]): PortfolioStats {
  const bandCounts: Record<BomBand, number> = {
    Critical: 0,
    Watch: 0,
    Unknown: 0,
    Clear: 0,
  }

  let totalLines = 0
  let totalAtRisk = 0
  let totalUnknown = 0
  let scoreSum = 0

  for (const bom of boms) {
    totalLines += bom.lineCount
    totalAtRisk += bom.atRiskCount
    totalUnknown += bom.unknownCount ?? 0
    scoreSum += bom.overallRiskScore
    bandCounts[bomRiskBand(bom)] += 1
  }

  const scorableLines = Math.max(totalLines - totalUnknown, 0)
  const clearLines = Math.max(scorableLines - totalAtRisk, 0)
  const flaggedPct = scorableLines > 0 ? Math.round((totalAtRisk / scorableLines) * 100) : 0

  const priorityBoms = [...boms]
    .filter((bom) => {
      const band = bomRiskBand(bom)
      return band === 'Critical' || band === 'Watch'
    })
    .sort(
      (a, b) =>
        b.overallRiskScore - a.overallRiskScore ||
        b.atRiskCount - a.atRiskCount ||
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    )

  const recentBoms = [...boms]
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .slice(0, 5)

  return {
    bomCount: boms.length,
    totalLines,
    totalAtRisk,
    totalUnknown,
    scorableLines,
    clearLines,
    flaggedPct,
    avgScore: boms.length > 0 ? scoreSum / boms.length : 0,
    bandCounts,
    priorityBoms,
    recentBoms,
  }
}

function bandAccent(band: BomBand): { text: string; rail: string; dot: string } {
  switch (band) {
    case 'Critical':
      return { text: 'text-[#c62026]', rail: 'bg-[#c62026]', dot: 'bg-[#c62026]' }
    case 'Watch':
      return { text: 'text-[#a25a05]', rail: 'bg-[#a25a05]', dot: 'bg-[#a25a05]' }
    case 'Unknown':
      return { text: 'text-slate-500', rail: 'bg-slate-300', dot: 'bg-slate-300' }
    default:
      return { text: 'text-[#167c48]', rail: 'bg-[#167c48]', dot: 'bg-[#167c48]' }
  }
}

function PortfolioMetric({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: string
}) {
  return (
    <div className="min-w-0 border border-slate-200 bg-white px-4 py-3.5">
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className={`mt-1 font-mono text-[26px] font-semibold tabular-nums leading-none tracking-tight ${tone ?? 'text-slate-900'}`}>
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-[12px] leading-snug text-slate-500">{hint}</p> : null}
    </div>
  )
}

function PartCoverageBar({
  flagged,
  unknown,
  clear,
}: {
  flagged: number
  unknown: number
  clear: number
}) {
  const total = flagged + unknown + clear
  if (total === 0) {
    return <p className="text-[13px] text-slate-400">Upload a BOM to see line coverage.</p>
  }

  const pct = (value: number) => `${Math.max((value / total) * 100, value > 0 ? 4 : 0)}%`

  return (
    <div>
      <div className="flex h-2.5 overflow-hidden border border-slate-200 bg-slate-100">
        {flagged > 0 ? (
          <div className="bg-[#c62026]" style={{ width: pct(flagged) }} title={`${flagged.toLocaleString()} flagged`} />
        ) : null}
        {unknown > 0 ? (
          <div className="bg-slate-300" style={{ width: pct(unknown) }} title={`${unknown.toLocaleString()} unresolved`} />
        ) : null}
        {clear > 0 ? (
          <div className="bg-[#167c48]" style={{ width: pct(clear) }} title={`${clear.toLocaleString()} clear`} />
        ) : null}
      </div>
      <dl className="mt-3 space-y-2">
        {[
          { label: 'Flagged', value: flagged, dot: 'bg-[#c62026]' },
          { label: 'Unresolved', value: unknown, dot: 'bg-slate-300' },
          { label: 'Clear', value: clear, dot: 'bg-[#167c48]' },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-[12px]">
            <dt className="flex items-center gap-2 text-slate-500">
              <span className={`h-1.5 w-1.5 shrink-0 ${row.dot}`} aria-hidden />
              {row.label}
            </dt>
            <dd className="font-mono tabular-nums text-slate-800">{row.value.toLocaleString()}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function PriorityBomRow({ bom, onView }: { bom: BomSummary; onView: () => void }) {
  const band = bomRiskBand(bom)
  const accent = bandAccent(band)
  const unknown = bom.unknownCount ?? 0

  return (
    <button
      type="button"
      onClick={onView}
      className="group relative flex w-full items-stretch gap-4 border border-slate-200 bg-white px-4 py-3.5 text-left transition-all hover:border-slate-300 hover:shadow-[0_14px_32px_-24px_rgb(15_27_45_/_35%)]"
    >
      <span className={`absolute inset-y-0 left-0 w-[3px] ${accent.rail}`} aria-hidden />
      <div className="min-w-0 flex-1 pl-2">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="truncate text-[15px] font-semibold text-slate-900 group-hover:text-[#0062ff]">
            {bom.name}
          </span>
          <span className={`font-mono text-[10px] font-semibold uppercase tracking-[0.08em] ${accent.text}`}>
            {band}
          </span>
        </div>
        <p className="mt-1 truncate font-mono text-[11px] text-slate-400">{bom.filename}</p>
        <p className="mt-2 text-[12px] text-slate-500">
          <span className="font-mono tabular-nums text-slate-700">{bom.atRiskCount}</span> parts flagged
          <span className="mx-2 text-slate-300">·</span>
          <span className="font-mono tabular-nums text-slate-700">{bom.lineCount.toLocaleString()}</span> lines
          {unknown > 0 ? (
            <>
              <span className="mx-2 text-slate-300">·</span>
              <span className="font-mono tabular-nums text-slate-500">{unknown} unresolved</span>
            </>
          ) : null}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-center border-l border-slate-100 pl-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-400">Score</span>
        <span className={`font-mono text-[22px] font-semibold tabular-nums leading-none ${accent.text}`}>
          {bom.overallRiskScore.toFixed(1)}
        </span>
      </div>
    </button>
  )
}

function RecentBomRow({ bom, onView }: { bom: BomSummary; onView: () => void }) {
  const band = bomRiskBand(bom)
  const accent = bandAccent(band)

  return (
    <button
      type="button"
      onClick={onView}
      className="group flex w-full items-center justify-between gap-3 border-b border-slate-100 py-2.5 text-left last:border-b-0 hover:bg-slate-50/80"
    >
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-slate-800 group-hover:text-[#0062ff]">{bom.name}</p>
        <p className="mt-0.5 font-mono text-[10px] text-slate-400">{formatUploadedAt(bom.uploadedAt)}</p>
      </div>
      <span className={`shrink-0 font-mono text-[11px] font-semibold tabular-nums ${accent.text}`}>
        {band === 'Unknown' ? '—' : bom.overallRiskScore.toFixed(1)}
      </span>
    </button>
  )
}

// ─── Overview ───────────────────────────────────────────────────────────────

function OverviewPage({
  boms,
  loading,
  goToBoms,
  onViewBom,
  onUpload,
}: {
  boms: BomSummary[]
  loading: boolean
  goToBoms: () => void
  onViewBom: (id: string) => void
  onUpload: () => void
}) {
  const stats = useMemo(() => computePortfolioStats(boms), [boms])

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f6f9]">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1180px] px-6 py-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">Portfolio</p>
          <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">
                {loading ? 'Loading portfolio…' : 'Supply chain overview'}
              </h1>
              {!loading && boms.length > 0 ? (
                <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-500">
                  {stats.priorityBoms.length > 0 ? (
                    <>
                      <span className="font-mono font-semibold text-[#c62026]">{stats.totalAtRisk.toLocaleString()}</span>
                      {' '}parts need attention across{' '}
                      <span className="font-mono font-medium text-slate-800">{stats.bomCount}</span> BOMs.
                      {stats.totalUnknown > 0 ? (
                        <>
                          {' '}
                          <span className="font-mono font-medium text-slate-700">{stats.totalUnknown.toLocaleString()}</span>
                          {' '}lines are still unresolved against distributor data.
                        </>
                      ) : null}
                    </>
                  ) : stats.totalUnknown > 0 ? (
                    <>
                      No lifecycle or supply flags yet, but{' '}
                      <span className="font-mono font-medium text-slate-700">{stats.totalUnknown.toLocaleString()}</span>
                      {' '}lines still need distributor matches before scoring is complete.
                    </>
                  ) : (
                    <>
                      All <span className="font-mono font-medium text-slate-800">{stats.scorableLines.toLocaleString()}</span>
                      {' '}scored lines look clear across your portfolio.
                    </>
                  )}
                </p>
              ) : !loading ? (
                <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-500">
                  Upload a BOM to score lifecycle, stock, and trade exposure line-by-line — then track what needs action here.
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onUpload}
                className="inline-flex items-center gap-1.5 bg-[#0062ff] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden />
                Upload BOM
              </button>
              <button
                type="button"
                onClick={goToBoms}
                className="inline-flex items-center gap-1.5 border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                All BOMs
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-6 py-8">
        {loading ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse border border-slate-200 bg-white" />
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <div className="min-h-[320px] animate-pulse border border-slate-200 bg-white" />
              <div className="min-h-[320px] animate-pulse border border-slate-200 bg-white" />
            </div>
          </div>
        ) : boms.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white px-8 py-20 text-center">
            <p className="text-[16px] font-medium text-slate-800">Start monitoring a real BOM</p>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-slate-500">
              Drop in CSV or Excel — messy headers, distributor SKUs, multi-sheet workbooks. Prokuro maps columns,
              enriches against distributor data, and surfaces lifecycle, stock, and tariff risk.
            </p>
            <button
              type="button"
              onClick={onUpload}
              className="mt-6 inline-flex items-center gap-1.5 bg-[#0062ff] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden />
              Upload your first BOM
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <PortfolioMetric
                label="BOMs monitored"
                value={String(stats.bomCount)}
                hint={`${stats.bandCounts.Critical} critical · ${stats.bandCounts.Watch} watch`}
              />
              <PortfolioMetric
                label="Lines tracked"
                value={stats.totalLines.toLocaleString()}
                hint={`${stats.scorableLines.toLocaleString()} scored · ${stats.totalUnknown.toLocaleString()} unresolved`}
              />
              <PortfolioMetric
                label="Parts flagged"
                value={stats.totalAtRisk.toLocaleString()}
                hint={
                  stats.scorableLines > 0
                    ? `${stats.flaggedPct}% of scored lines`
                    : 'Waiting on distributor matches'
                }
                tone={stats.totalAtRisk > 0 ? 'text-[#c62026]' : undefined}
              />
              <PortfolioMetric
                label="Avg BOM score"
                value={stats.avgScore.toFixed(1)}
                hint="Across scored BOMs (0–10 scale)"
                tone={
                  stats.avgScore >= 5
                    ? 'text-[#c62026]'
                    : stats.avgScore > 0
                      ? 'text-[#a25a05]'
                      : undefined
                }
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
              <section className="border border-slate-200 bg-white">
                <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="text-[15px] font-semibold text-slate-900">Needs attention</h2>
                    <p className="mt-0.5 text-[13px] text-slate-500">
                      Critical and watch BOMs, ranked by score and flagged parts.
                    </p>
                  </div>
                  {stats.priorityBoms.length > 0 ? (
                    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-slate-400">
                      {stats.priorityBoms.length} BOM{stats.priorityBoms.length === 1 ? '' : 's'}
                    </span>
                  ) : null}
                </header>
                <div className="space-y-2 p-4">
                  {stats.priorityBoms.length === 0 ? (
                    <div className="border border-dashed border-slate-200 px-5 py-10 text-center">
                      <p className="text-[14px] font-medium text-slate-800">Nothing flagged right now</p>
                      <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500">
                        {stats.totalUnknown > 0
                          ? 'Some lines are still unresolved — open a BOM to review distributor match coverage.'
                          : 'Your scored lines are clear. Upload another BOM or check back after the next enrichment run.'}
                      </p>
                    </div>
                  ) : (
                    stats.priorityBoms.map((bom) => (
                      <PriorityBomRow key={bom.id} bom={bom} onView={() => onViewBom(bom.id)} />
                    ))
                  )}
                </div>
              </section>

              <div className="space-y-4">
                <section className="border border-slate-200 bg-white px-5 py-4">
                  <h2 className="text-[13px] font-semibold text-slate-900">Line coverage</h2>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">
                    How your portfolio breaks down once distributor data is applied.
                  </p>
                  <div className="mt-4">
                    <PartCoverageBar
                      flagged={stats.totalAtRisk}
                      unknown={stats.totalUnknown}
                      clear={stats.clearLines}
                    />
                  </div>
                </section>

                <section className="border border-slate-200 bg-white px-5 py-4">
                  <h2 className="text-[13px] font-semibold text-slate-900">BOM status</h2>
                  <dl className="mt-3 grid grid-cols-2 gap-2">
                    {(['Critical', 'Watch', 'Unknown', 'Clear'] as BomBand[]).map((band) => {
                      const accent = bandAccent(band)
                      return (
                        <div key={band} className="border border-slate-100 bg-[#f4f6f9] px-3 py-2.5">
                          <dt className={`font-mono text-[10px] uppercase tracking-[0.08em] ${accent.text}`}>{band}</dt>
                          <dd className="mt-1 font-mono text-[20px] font-semibold tabular-nums text-slate-900">
                            {stats.bandCounts[band]}
                          </dd>
                        </div>
                      )
                    })}
                  </dl>
                </section>

                <section className="border border-slate-200 bg-white px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[13px] font-semibold text-slate-900">Recently uploaded</h2>
                    <button
                      type="button"
                      onClick={goToBoms}
                      className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#0062ff] hover:underline"
                    >
                      View all
                    </button>
                  </div>
                  <div className="mt-2">
                    {stats.recentBoms.map((bom) => (
                      <RecentBomRow key={bom.id} bom={bom} onView={() => onViewBom(bom.id)} />
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── BOMs tab ─────────────────────────────────────────────────────────────────

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
  const unknownCount = boms.filter((b) => bomRiskBand(b) === 'Unknown').length

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
            onUpload={() => setUploadOpen(true)}
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
