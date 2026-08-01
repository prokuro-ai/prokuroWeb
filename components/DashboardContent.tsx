'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Link } from '@/lib/navigation'
import { useAuth } from '@/components/AuthProvider'
import { listBoms } from '@/lib/api'
import { DeleteBomButton } from '@/components/DeleteBomButton'
import BomBulkUploadModal from '@/components/BomBulkUploadModal'
import DashboardShell from '@/components/DashboardShell'
import type { BomSummary } from '@/lib/types'
import { formatUploadedAt } from '@/lib/format'
import { scoreBand } from '@/lib/risk'
import {
  AlertTriangle, Bell, ChevronRight, FileText, Search,
  ShieldAlert, UploadCloud, CheckCircle, ArrowRight,
} from 'lucide-react'

// ─── Static alert data ────────────────────────────────────────────────────────

const ALERTS = [
  { id: 1,  part: 'STM32F405RGT6',     type: 'EOL',       message: 'Hit EOL. Last-time-buy window closes in 14 days. 0 units in stock across all distributors.', severity: 'high',   time: '10m ago', bom: 'Motor Controller v3'   },
  { id: 2,  part: 'CY7C1061GE-10ZSXI', type: 'EOL',       message: 'Discontinued by Cypress. 210 units remaining at Digi-Key, covers ~1 production run.',        severity: 'high',   time: '1h ago',  bom: 'Motor Controller v3'   },
  { id: 3,  part: 'LTC3780EGN#PBF',    type: 'EOL',       message: 'Analog Devices EOL notice issued. No direct alternate identified yet.',                        severity: 'high',   time: '2h ago',  bom: 'Motor Controller v3'   },
  { id: 4,  part: 'ATMEGA328P-AU',      type: 'Lead Time', message: 'Lead time extended to 52 weeks at all distributors (+40% in 60 days). NRND status.',          severity: 'high',   time: '3h ago',  bom: 'Motor Controller v3'   },
  { id: 5,  part: 'FT232RL-REEL',       type: 'NRND',      message: 'FTDI flagged as not recommended for new designs. CH340G used by 8 companies as substitute.',   severity: 'medium', time: '4h ago',  bom: 'Motor Controller v3'   },
  { id: 6,  part: 'PRTR5V0U2X',         type: 'Lead Time', message: 'NXP lead time at 38 weeks. Stock at 900 units, below threshold for planned production run.',  severity: 'medium', time: '6h ago',  bom: 'Motor Controller v3'   },
  { id: 7,  part: 'NRF52840-QIAA-R',   type: 'Tariff',    message: 'Section 301 tariff now applies. +$1.80/unit estimated impact at current BOM quantity.',        severity: 'medium', time: '8h ago',  bom: 'Motor Controller v3'   },
  { id: 8,  part: 'ESP32-WROOM-32E',   type: 'Tariff',    message: 'Subject to Section 301 at 25%. China-assembly exposure flag raised.',                          severity: 'medium', time: '10h ago', bom: 'Motor Controller v3'   },
  { id: 9,  part: 'MAX3232CPE+',        type: 'Resolved',  message: 'Alternative validated by network. Risk cleared. New stock at Mouser, 4-week lead time.',      severity: 'info',   time: '3d ago',  bom: 'Motor Controller v3'   },
  { id: 10, part: 'ADL5801ACPZ-R7',    type: 'Lead Time', message: 'Lead time extended to 44 weeks at Arrow and Avnet. No stock at Digi-Key or Mouser.',           severity: 'high',   time: '4h ago',  bom: 'Radar Front-End Board' },
  { id: 11, part: 'HMC637ALP5E',        type: 'EOL',       message: 'Analog Devices issued PCN. Last-time-buy recommended before Q3.',                              severity: 'high',   time: '6h ago',  bom: 'Radar Front-End Board' },
  { id: 12, part: 'MAX3232CPE+',        type: 'Resolved',  message: 'New stock available at Mouser. Lead time reduced to 4 weeks.',                                 severity: 'info',   time: '4d ago',  bom: 'Display Interface'     },
]

// ─── Rotating ticker ──────────────────────────────────────────────────────────

const FEED_ITEMS = [
  `${ALERTS.filter(a => a.severity !== 'info').length} new alerts since your last visit on Monday.`,
  'STM32F405RGT6 last-time-buy window closes in 14 days.',
  '38% of your parts have China-origin tariff exposure. Estimated $12,400 in added cost.',
]

function RotatingFeed() {
  const [active, setActive] = useState(0)
  const [fading, setFading] = useState(false)
  useEffect(() => {
    const t = setInterval(() => {
      setFading(true)
      setTimeout(() => { setActive(a => (a + 1) % FEED_ITEMS.length); setFading(false) }, 300)
    }, 4000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="mb-6" style={{ transition: 'opacity 0.3s', opacity: fading ? 0 : 1 }}>
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 shadow-sm flex items-center gap-4">
        <p className="flex-1 text-sm font-medium text-slate-700">{FEED_ITEMS[active]}</p>
        <div className="flex gap-1.5 shrink-0">
          {FEED_ITEMS.map((_, i) => (
            <button key={i} onClick={() => { setActive(i); setFading(false) }}
              className="w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{ background: i === active ? '#0062ff' : '#cbd5e1' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Portfolio risk distribution ──────────────────────────────────────────────

function PortfolioRisk({ boms }: { boms: BomSummary[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const criticalBoms = boms.filter(b => b.overallRiskScore >= 7)
  const warningBoms  = boms.filter(b => b.overallRiskScore >= 4 && b.overallRiskScore < 7)
  const healthyBoms  = boms.filter(b => b.overallRiskScore < 4)
  const total = boms.length

  const tiers = [
    { id: 'critical', label: 'Critical', items: criticalBoms, color: '#ef4444', bg: '#fef2f2', border: '#fecaca', Icon: ShieldAlert,    detail: `${criticalBoms.length} BOMs need immediate action. EOL parts with last-time-buy windows closing within 45 days.` },
    { id: 'warning',  label: 'Warning',  items: warningBoms,  color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', Icon: AlertTriangle,  detail: `${warningBoms.length} BOMs have lead time issues, discontinued components, or rising tariff exposure.`           },
    { id: 'healthy',  label: 'Healthy',  items: healthyBoms,  color: '#10b981', bg: '#f0fdf4', border: '#a7f3d0', Icon: CheckCircle,    detail: `${healthyBoms.length} BOMs are in good standing. No critical lifecycle issues and adequate supply.`                },
  ]

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Portfolio Risk Distribution</span>
        <span className="text-xs text-slate-400">Click a segment to explore</span>
      </div>
      <div className="flex h-6 rounded-lg overflow-hidden gap-0.5 mb-5">
        {tiers.map(t => (
          <button key={t.id}
            onClick={() => setExpanded(expanded === t.id ? null : t.id)}
            className="relative flex items-center justify-center transition-all"
            style={{ width: `${(t.items.length / total) * 100}%`, minWidth: (t.items.length / total) * 100 < 5 ? 28 : undefined, background: t.color, opacity: expanded && expanded !== t.id ? 0.3 : 1 }}
            title={`${t.label}: ${t.items.length} BOMs`}>
            {(t.items.length / total) * 100 > 5 && <span className="text-white text-[10px] font-bold">{t.items.length}</span>}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {tiers.map(t => {
          const isActive = expanded === t.id
          return (
            <button key={t.id}
              onClick={() => setExpanded(isActive ? null : t.id)}
              className="text-left rounded-xl border-2 p-4 transition-all"
              style={{ borderColor: isActive ? t.color : '#e2e8f0', background: isActive ? t.bg : '#fff' }}>
              <div className="flex items-center gap-2 mb-3">
                <t.Icon className="w-4 h-4 shrink-0" style={{ color: t.color }} />
                <span className="text-sm font-bold text-slate-900">{t.label}</span>
              </div>
              <span className="text-3xl font-bold leading-none" style={{ color: t.color }}>{t.items.length}</span>
              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden my-3">
                <div className="h-full rounded-full" style={{ width: `${Math.min((t.items.length / total) * 200, 100)}%`, background: t.color }} />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{t.detail}</p>
            </button>
          )
        })}
      </div>
      {expanded && (() => {
        const t = tiers.find(x => x.id === expanded)!
        return (
          <div className="mt-3 rounded-xl border p-4" style={{ borderColor: t.border, background: t.bg }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <t.Icon className="w-4 h-4" style={{ color: t.color }} /> {t.label} BOMs, most urgent
              </span>
              <span className="text-xs font-semibold" style={{ color: t.color }}>{t.items.length} total</span>
            </div>
            {t.items.slice(0, 3).map(bom => (
              <div key={bom.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-2.5 shadow-sm mb-2">
                <t.Icon className="w-4 h-4 shrink-0" style={{ color: t.color }} />
                <span className="flex-1 text-sm font-medium text-slate-900 truncate">{bom.name}</span>
                <span className="text-xs text-slate-400">{bom.atRiskCount} at-risk</span>
              </div>
            ))}
          </div>
        )
      })()}
    </div>
  )
}

// ─── Pages ────────────────────────────────────────────────────────────────────

function OverviewPage({ boms, loading, goToBoms, onViewBom }: {
  boms: BomSummary[], loading: boolean
  goToBoms: () => void
  onViewBom: (id: string) => void
}) {
  const totalLines         = boms.reduce((s, b) => s + b.lineCount, 0)
  const criticalCount      = boms.filter(b => b.overallRiskScore >= 7).length
  const warningCount       = boms.filter(b => b.overallRiskScore >= 4 && b.overallRiskScore < 7).length
  const needsAttentionBoms = [...boms].filter(b => b.atRiskCount > 0).sort((a, b) => b.atRiskCount - a.atRiskCount)

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <RotatingFeed />

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total BOMs',      value: loading ? '-' : String(boms.length),                    sub: 'across all projects',                                              highlight: false },
          { label: 'Lines Monitored', value: loading ? '-' : totalLines.toLocaleString(),             sub: 'components tracked',                                               highlight: false },
          { label: 'Needs Attention', value: loading ? '-' : String(criticalCount + warningCount),    sub: `${criticalCount} critical · ${warningCount} warning`,              highlight: (criticalCount + warningCount) > 0 },
        ].map((s, i) => (
          <div key={i} className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm flex flex-col">
            <span className="text-sm font-medium text-slate-500">{s.label}</span>
            <span className={`text-3xl font-bold tracking-tight mt-1 ${s.highlight ? 'text-red-600' : 'text-slate-900'}`}>{s.value}</span>
            <span className="text-xs text-slate-400 mt-1">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Portfolio risk */}
      {!loading && boms.length > 0 && <PortfolioRisk boms={boms} />}

      {/* Needs Attention table */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Loading BOMs…</div>
      ) : boms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-slate-700 font-medium text-base">No BOMs yet</p>
          <p className="text-slate-400 text-sm">Upload a BOM from the BOMs tab to start monitoring risk.</p>
          <button onClick={goToBoms}
            className="mt-4 bg-[#0062ff] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors">
            Go to BOMs <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Needs Attention</h2>
            <button onClick={goToBoms} className="text-xs font-semibold text-[#0062ff] flex items-center gap-1 hover:text-blue-700">
              View all BOMs <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  {['BOM Name', 'At-Risk Parts', 'Last Updated', ''].map(h => (
                    <th key={h} className="px-5 py-3.5 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {needsAttentionBoms.map(bom => (
                  <tr key={bom.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        {bom.name}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-bold text-red-600">{bom.atRiskCount} parts</span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{formatUploadedAt(bom.uploadedAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => onViewBom(bom.id)}
                        className="font-semibold flex items-center gap-1 ml-auto text-[#0062ff] hover:text-blue-700">
                        View <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const BOM_FILTERS = ['All', 'Critical', 'Watch', 'Clear'] as const
type BomFilter = (typeof BOM_FILTERS)[number]

function matchesBand(score: number, filter: BomFilter): boolean {
  if (filter === 'Critical') return score >= 7
  if (filter === 'Watch') return score >= 4 && score < 7
  if (filter === 'Clear') return score < 4
  return true
}

function BomMetaStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-slate-400">{label}</div>
      <div className={`mt-1 font-mono text-[22px] font-semibold tabular-nums tracking-tight ${tone ?? 'text-slate-900'}`}>
        {value}
      </div>
    </div>
  )
}

function BomListSkeleton() {
  return (
    <div className="border border-slate-200 bg-white">
      <div className="h-10 border-b border-slate-200 bg-[#f4f6f9]" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-6 border-b border-slate-100 px-5 py-4 last:border-b-0">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-48 bg-slate-200" />
            <div className="h-3 w-36 bg-slate-100" />
          </div>
          <div className="h-3 w-12 bg-slate-100" />
          <div className="h-3 w-10 bg-slate-100" />
          <div className="h-3 w-20 bg-slate-100" />
          <div className="h-3 w-16 bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

function BomListRow({ bom, onView, onDelete }: {
  bom: BomSummary
  onView: () => void
  onDelete: () => void
}) {
  const band = scoreBand(bom.overallRiskScore)
  const flagged = bom.atRiskCount > 0

  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onView()
        }
      }}
      className={`group cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0062ff] ${
        flagged ? 'bg-[rgb(198_32_38_/_3%)] hover:bg-[rgb(198_32_38_/_6%)]' : 'bg-white hover:bg-[#f8fafc]'
      }`}
    >
      <td className={`px-5 py-3.5 ${flagged ? 'shadow-[inset_3px_0_0_#c62026]' : ''}`}>
        <div className="min-w-0">
          <div className="truncate font-mono text-[13px] font-medium text-slate-900">{bom.name}</div>
          <div className="truncate text-[12px] text-slate-400">{bom.filename}</div>
        </div>
      </td>
      <td className="px-4 py-3.5 text-right font-mono text-[13px] tabular-nums text-slate-600">
        {bom.lineCount.toLocaleString()}
      </td>
      <td className="px-4 py-3.5 text-right font-mono text-[13px] tabular-nums">
        <span className={bom.atRiskCount > 0 ? 'font-semibold text-[#c62026]' : 'text-slate-400'}>
          {bom.atRiskCount}
        </span>
      </td>
      <td className="px-4 py-3.5 font-mono text-[12px] uppercase tracking-[0.06em] text-slate-500">
        {formatUploadedAt(bom.uploadedAt)}
      </td>
      <td className="px-4 py-3.5">
        <span className="inline-flex items-center gap-2">
          <span className="h-1 w-12 shrink-0 bg-slate-200" aria-hidden>
            <span className="block h-full" style={{ width: `${band.fill}%`, background: band.accent }} />
          </span>
          <span className={`font-mono text-[12px] font-semibold ${band.text}`}>{band.label}</span>
        </span>
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="flex items-center justify-end gap-3">
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[#0062ff] opacity-0 transition-opacity group-hover:opacity-100">
            Open <ArrowRight className="h-3.5 w-3.5" />
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
              className="font-mono text-[11px] uppercase tracking-[0.06em]"
              onDeleted={onDelete}
            />
          </span>
        </div>
      </td>
    </tr>
  )
}

function BomsPage({ boms, loading, onViewBom, onDelete, onUpload }: {
  boms: BomSummary[], loading: boolean
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
  const filtered = searched.filter((b) => matchesBand(b.overallRiskScore, filter))

  const totalLines = boms.reduce((s, b) => s + b.lineCount, 0)
  const totalAtRisk = boms.reduce((s, b) => s + b.atRiskCount, 0)
  const criticalCount = boms.filter((b) => b.overallRiskScore >= 7).length
  const watchCount = boms.filter((b) => b.overallRiskScore >= 4 && b.overallRiskScore < 7).length
  const flaggedBomPct = boms.length > 0 ? Math.round(((criticalCount + watchCount) / boms.length) * 100) : 0

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="border-b border-slate-200">
        <div className="mx-auto max-w-[1120px] px-6 pt-6 pb-0">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">Bills of Materials</h1>
              <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.08em] text-slate-400">
                Lifecycle · supply · trade exposure
              </p>
            </div>
            <button
              type="button"
              onClick={onUpload}
              className="inline-flex shrink-0 items-center gap-2 bg-[#0062ff] px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-white transition-colors hover:bg-blue-700"
            >
              <UploadCloud className="h-3.5 w-3.5" /> Upload BOM
            </button>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-6 border-t border-slate-200 py-5">
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-10 gap-y-5 sm:grid-cols-4">
              <BomMetaStat label="BOMs" value={loading ? '—' : boms.length.toLocaleString()} />
              <BomMetaStat label="Lines" value={loading ? '—' : totalLines.toLocaleString()} />
              <BomMetaStat
                label="Flagged parts"
                value={loading ? '—' : totalAtRisk.toLocaleString()}
                tone={!loading && totalAtRisk > 0 ? 'text-[#c62026]' : undefined}
              />
              <BomMetaStat
                label="Critical BOMs"
                value={loading ? '—' : String(criticalCount)}
                tone={!loading && criticalCount > 0 ? 'text-[#c62026]' : undefined}
              />
            </div>
            <div className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.08em] text-slate-500">
              <span
                className={`h-1.5 w-1.5 ${criticalCount + watchCount > 0 ? 'bg-[#c62026]' : 'bg-[#167c48]'}`}
                aria-hidden
              />
              <span className="text-slate-900">
                {loading ? '—' : `${flaggedBomPct}% of BOMs flagged`}
              </span>
              {!loading && watchCount > 0 ? (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{watchCount} on watch</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1120px] px-6 py-8">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
            Your BOM portfolio
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-slate-400">
            {loading ? '…' : `${filtered.length} shown`}
          </span>
        </div>

        {loading ? (
          <BomListSkeleton />
        ) : boms.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-slate-300 bg-[#f4f6f9] py-16 text-center">
            <UploadCloud className="mb-3 h-7 w-7 text-slate-300" />
            <p className="text-[15px] font-medium text-slate-800">No BOMs yet</p>
            <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-slate-500">
              Upload a CSV or Excel BOM in any column layout. Prokuro maps the columns and scores every line.
            </p>
            <button
              type="button"
              onClick={onUpload}
              className="mt-5 inline-flex items-center gap-2 bg-[#0062ff] px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-white transition-colors hover:bg-blue-700"
            >
              <UploadCloud className="h-3.5 w-3.5" /> Upload your first BOM
            </button>
          </div>
        ) : (
          <div className="overflow-hidden border border-slate-200 bg-white shadow-[0_24px_48px_-30px_rgb(15_27_45_/_24%)]">
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-[#f4f6f9] px-5 py-2.5">
              <div className="relative min-w-0 flex-1 sm:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search BOMs or filenames…"
                  aria-label="Search BOMs"
                  className="w-full border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-[13px] focus:border-[#0062ff] focus:outline-none focus:ring-1 focus:ring-[#0062ff]"
                />
              </div>
              <div className="flex border border-slate-200 bg-white p-0.5">
                {BOM_FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.06em] transition-colors ${
                      filter === f ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {f}{' '}
                    <span className="tabular-nums opacity-70">
                      {searched.filter((b) => matchesBand(b.overallRiskScore, f)).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex h-28 items-center justify-center text-[13px] text-slate-400">
                No BOMs match this view.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-[#f4f6f9]">
                      <th className="px-5 py-2.5 text-left font-mono text-[11px] font-medium uppercase tracking-[0.09em] text-slate-400">
                        BOM
                      </th>
                      <th className="px-4 py-2.5 text-right font-mono text-[11px] font-medium uppercase tracking-[0.09em] text-slate-400">
                        Lines
                      </th>
                      <th className="px-4 py-2.5 text-right font-mono text-[11px] font-medium uppercase tracking-[0.09em] text-slate-400">
                        At risk
                      </th>
                      <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium uppercase tracking-[0.09em] text-slate-400">
                        Uploaded
                      </th>
                      <th className="px-4 py-2.5 text-left font-mono text-[11px] font-medium uppercase tracking-[0.09em] text-slate-400">
                        Risk
                      </th>
                      <th className="px-5 py-2.5 text-right font-mono text-[11px] font-medium uppercase tracking-[0.09em] text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((bom) => (
                      <BomListRow
                        key={bom.id}
                        bom={bom}
                        onView={() => onViewBom(bom.id)}
                        onDelete={() => onDelete(bom.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AlertsPage() {
  const [filter, setFilter] = useState('All')
  const filtered = ALERTS.filter(a =>
    filter === 'All' || a.severity === filter.toLowerCase() || (filter === 'Resolved' && a.type === 'Resolved')
  )
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Alerts</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {ALERTS.filter(a => a.severity === 'high').length} critical · {ALERTS.filter(a => a.severity === 'medium').length} warnings · {ALERTS.filter(a => a.type === 'Resolved').length} resolved
          </p>
        </div>
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {['All', 'High', 'Medium', 'Resolved'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filter === f ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {filtered.map(alert => {
          const isHigh = alert.severity === 'high'; const isMed = alert.severity === 'medium'
          const isResolved = alert.type === 'Resolved'
          const iconBg    = isResolved ? 'bg-emerald-100' : isHigh ? 'bg-red-100' : isMed ? 'bg-amber-100' : 'bg-blue-100'
          const iconColor = isResolved ? 'text-emerald-600' : isHigh ? 'text-red-600' : isMed ? 'text-amber-600' : 'text-blue-600'
          const typeBg    = isResolved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : isHigh ? 'bg-red-50 text-red-700 border-red-200' : isMed ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'
          const Icon = isResolved ? CheckCircle : isHigh ? ShieldAlert : isMed ? AlertTriangle : Bell
          return (
            <div key={alert.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
              <div className={`w-9 h-9 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{alert.part}</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${typeBg}`}>{alert.type}</span>
                  <span className="text-xs text-slate-400 ml-auto shrink-0">{alert.time}</span>
                </div>
                <p className="text-sm text-slate-700 leading-snug mb-2">{alert.message}</p>
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-500">{alert.bom}</span>
                </div>
              </div>
              {!isResolved && (
                <button className="shrink-0 text-[#0062ff] text-sm font-semibold hover:text-blue-700 whitespace-nowrap flex items-center gap-1">
                  Take Action <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

type Page = 'dashboard' | 'boms' | 'alerts'

export default function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [boms, setBoms]   = useState<BomSummary[]>([])
  const [loading, setLoading] = useState(true)

  const tabParam = searchParams.get('tab')
  const page: Page = tabParam === 'boms' || tabParam === 'alerts' ? tabParam : 'dashboard'

  const dashboardUrl = (tab: Page) => `/dashboard?tab=${tab}`

  const setPage = (next: Page) => {
    router.push(dashboardUrl(next))
  }

  const viewBom = (id: string) => {
    router.push(`/bom/${encodeURIComponent(id)}`)
  }

  // Load BOMs
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    let cancelled = false
    setLoading(true)
    listBoms()
      .then((page) => { if (!cancelled) setBoms(page.items) })
      .catch(() => { /* keep empty list; banner via upload errors */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [authLoading, user, router])

  const [uploadOpen, setUploadOpen] = useState(false)

  const openUpload = () => {
    setUploadOpen(true)
  }

  const closeUpload = () => {
    setUploadOpen(false)
  }

  const handleUploadComplete = (saved: BomSummary[]) => {
    if (saved.length === 0) return
    setBoms((prev) => {
      const ids = new Set(prev.map((b) => b.id))
      const merged = [...saved.filter((b) => !ids.has(b.id)), ...prev]
      return merged
    })
    listBoms()
      .then((result) => setBoms(result.items))
      .catch(() => { /* keep merged list */ })
  }

  const newAlertCount = 0

  return (
    <DashboardShell
      activeTab={page === 'boms' ? 'boms' : 'dashboard'}
      bomCount={boms.length}
    >
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {page === 'dashboard' ? (
          <OverviewPage
            boms={boms} loading={loading}
            goToBoms={() => setPage('boms')}
            onViewBom={viewBom}
          />
        ) : page === 'boms' ? (
          <BomsPage
            boms={boms} loading={loading}
            onViewBom={viewBom}
            onDelete={id => setBoms(prev => prev.filter(b => b.id !== id))}
            onUpload={openUpload}
          />
        ) : (
          <AlertsPage />
        )}
      </div>

      <BomBulkUploadModal
        open={uploadOpen}
        onClose={closeUpload}
        onComplete={handleUploadComplete}
        existingBomCount={boms.length}
      />

      {/* ── Footer ── */}
      <footer className="shrink-0 border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 bg-[#0062ff] shrink-0" style={{ clipPath: 'polygon(24% 0, 100% 0, 100% 100%, 0% 100%)' }} />
            <span className="text-xs font-semibold text-[#0f1b2d]">Prokuro<span className="text-[#0062ff]">.ai</span></span>
          </div>
          <span className="text-xs text-slate-400">© 2026 Prokuro.ai. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">Home</Link>
          <a href="https://www.linkedin.com/company/prokuro/" target="_blank" rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-slate-700 transition-colors">LinkedIn</a>
        </div>
      </footer>
    </DashboardShell>
  )
}
