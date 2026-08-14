'use client'

import { useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useBoms } from '@/hooks/use-boms'
import type { BomSummary } from '@/lib/types'
import { formatUploadedAt } from '@/lib/format'
import { bomRiskBand, type BomBand } from '@/lib/risk'
import { ArrowRight } from 'lucide-react'

type ProgramStats = {
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

function computeProgramStats(boms: BomSummary[]): ProgramStats {
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

function ProgramMetric({
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

function OverviewView({
  boms,
  loading,
  goToBoms,
  onViewBom,
}: {
  boms: BomSummary[]
  loading: boolean
  goToBoms: () => void
  onViewBom: (id: string) => void
}) {
  const stats = useMemo(() => computeProgramStats(boms), [boms])

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f6f9]">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1180px] px-6 py-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">Program</p>
          <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">
                {loading ? 'Loading program…' : 'Program overview'}
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
                      {' '}scored lines look clear across your program.
                    </>
                  )}
                </p>
              ) : !loading ? (
                <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-500">
                  Upload a BOM from BOMs to score lifecycle, stock, and trade exposure line-by-line — then track what needs action here.
                </p>
              ) : null}
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
              onClick={goToBoms}
              className="mt-6 inline-flex items-center gap-1.5 bg-[#0062ff] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-blue-700"
            >
              Go to BOMs
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <ProgramMetric
                label="BOMs monitored"
                value={String(stats.bomCount)}
                hint={`${stats.bandCounts.Critical} critical · ${stats.bandCounts.Watch} watch`}
              />
              <ProgramMetric
                label="Lines tracked"
                value={stats.totalLines.toLocaleString()}
                hint={`${stats.scorableLines.toLocaleString()} scored · ${stats.totalUnknown.toLocaleString()} unresolved`}
              />
              <ProgramMetric
                label="Parts flagged"
                value={stats.totalAtRisk.toLocaleString()}
                hint={
                  stats.scorableLines > 0
                    ? `${stats.flaggedPct}% of scored lines`
                    : 'Waiting on distributor matches'
                }
                tone={stats.totalAtRisk > 0 ? 'text-[#c62026]' : undefined}
              />
              <ProgramMetric
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
                    How your program breaks down once distributor data is applied.
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

export default function OverviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { boms, loading } = useBoms()
  const tab = searchParams.get('tab')

  useEffect(() => {
    if (tab === 'boms') router.replace('/boms')
    if (tab === 'purchasing') router.replace('/purchasing')
  }, [tab, router])

  if (tab === 'boms' || tab === 'purchasing') return null

  return (
    <OverviewView
      boms={boms}
      loading={loading}
      goToBoms={() => router.push('/boms')}
      onViewBom={(id) => router.push(`/bom/${encodeURIComponent(id)}`)}
    />
  )
}
