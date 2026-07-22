'use client'

import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from '@/lib/navigation'
import { useAuth } from '@/components/AuthProvider'
import { listBoms, analyzeFile, parseFile, saveBom } from '@/lib/api'
import { signOut } from '@/lib/auth'
import { DeleteBomButton } from '@/components/DeleteBomButton'
import BomUploadDropzone from '@/components/BomUploadDropzone'
import { buildColumnMappings, extractHeaders, previewRows } from '@/lib/columnMapping'
import type { BomSummary, ColumnMapping, ParseResult } from '@/lib/types'
import {
  AlertTriangle, Bell, ChevronRight, Clock, FileText, Search,
  ShieldAlert, UploadCloud, CheckCircle, ArrowRight,
  AlertCircle, Settings, LogOut, X,
} from 'lucide-react'

// ─── Static alert data ────────────────────────────────────────────────────────

const ALERTS = [
  { id: 1,  part: 'STM32F405RGT6',     type: 'EOL',       message: 'Hit EOL — last-time-buy window closes in 14 days. 0 units in stock across all distributors.', severity: 'high',   time: '10m ago', bom: 'Motor Controller v3'   },
  { id: 2,  part: 'CY7C1061GE-10ZSXI', type: 'EOL',       message: 'Discontinued by Cypress. 210 units remaining at Digi-Key — covers ~1 production run.',        severity: 'high',   time: '1h ago',  bom: 'Motor Controller v3'   },
  { id: 3,  part: 'LTC3780EGN#PBF',    type: 'EOL',       message: 'Analog Devices EOL notice issued. No direct alternate identified yet.',                        severity: 'high',   time: '2h ago',  bom: 'Motor Controller v3'   },
  { id: 4,  part: 'ATMEGA328P-AU',      type: 'Lead Time', message: 'Lead time extended to 52 weeks at all distributors (+40% in 60 days). NRND status.',          severity: 'high',   time: '3h ago',  bom: 'Motor Controller v3'   },
  { id: 5,  part: 'FT232RL-REEL',       type: 'NRND',      message: 'FTDI flagged as not recommended for new designs. CH340G used by 8 companies as substitute.',   severity: 'medium', time: '4h ago',  bom: 'Motor Controller v3'   },
  { id: 6,  part: 'PRTR5V0U2X',         type: 'Lead Time', message: 'NXP lead time at 38 weeks. Stock at 900 units — below threshold for planned production run.',  severity: 'medium', time: '6h ago',  bom: 'Motor Controller v3'   },
  { id: 7,  part: 'NRF52840-QIAA-R',   type: 'Tariff',    message: 'Section 301 tariff now applies. +$1.80/unit estimated impact at current BOM quantity.',        severity: 'medium', time: '8h ago',  bom: 'Motor Controller v3'   },
  { id: 8,  part: 'ESP32-WROOM-32E',   type: 'Tariff',    message: 'Subject to Section 301 at 25%. China-assembly exposure flag raised.',                          severity: 'medium', time: '10h ago', bom: 'Motor Controller v3'   },
  { id: 9,  part: 'MAX3232CPE+',        type: 'Resolved',  message: 'Alternative validated by network. Risk cleared — new stock at Mouser, 4-week lead time.',      severity: 'info',   time: '3d ago',  bom: 'Motor Controller v3'   },
  { id: 10, part: 'ADL5801ACPZ-R7',    type: 'Lead Time', message: 'Lead time extended to 44 weeks at Arrow and Avnet. No stock at Digi-Key or Mouser.',           severity: 'high',   time: '4h ago',  bom: 'Radar Front-End Board' },
  { id: 11, part: 'HMC637ALP5E',        type: 'EOL',       message: 'Analog Devices issued PCN. Last-time-buy recommended before Q3.',                              severity: 'high',   time: '6h ago',  bom: 'Radar Front-End Board' },
  { id: 12, part: 'MAX3232CPE+',        type: 'Resolved',  message: 'New stock available at Mouser. Lead time reduced to 4 weeks.',                                 severity: 'info',   time: '4d ago',  bom: 'Display Interface'     },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RiskRing = ({ score }: { score: number }) => {
  const isHigh = score >= 7; const isMed = score >= 4
  const color = isHigh ? 'text-red-500' : isMed ? 'text-amber-500' : 'text-emerald-500'
  const bgColor = isHigh ? '#fee2e2' : isMed ? '#fef3c7' : '#d1fae5'
  const fgColor = isHigh ? '#ef4444' : isMed ? '#f59e0b' : '#10b981'
  const pct = (score / 10) * 100
  const r = 24; const circ = 2 * Math.PI * r
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="absolute w-full h-full -rotate-90">
        <circle cx="28" cy="28" r={r} stroke={bgColor} strokeWidth="4" fill="transparent" />
        <circle cx="28" cy="28" r={r} stroke={fgColor} strokeWidth="4" fill="transparent"
          strokeDasharray={circ} strokeDashoffset={circ - (circ * pct) / 100} />
      </svg>
      <span className={`text-sm font-bold ${color}`}>{score.toFixed(1)}</span>
    </div>
  )
}

// ─── Rotating ticker ──────────────────────────────────────────────────────────

const FEED_ITEMS = [
  `${ALERTS.filter(a => a.severity !== 'info').length} new alerts since your last visit on Monday.`,
  'STM32F405RGT6 last-time-buy window closes in 14 days.',
  '38% of your parts have China-origin tariff exposure — estimated $12,400 in added cost.',
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
    { id: 'critical', label: 'Critical', items: criticalBoms, color: '#ef4444', bg: '#fef2f2', border: '#fecaca', Icon: ShieldAlert,    detail: `${criticalBoms.length} BOMs need immediate action — EOL parts with last-time-buy windows closing within 45 days.` },
    { id: 'warning',  label: 'Warning',  items: warningBoms,  color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', Icon: AlertTriangle,  detail: `${warningBoms.length} BOMs have lead time issues, discontinued components, or rising tariff exposure.`           },
    { id: 'healthy',  label: 'Healthy',  items: healthyBoms,  color: '#10b981', bg: '#f0fdf4', border: '#a7f3d0', Icon: CheckCircle,    detail: `${healthyBoms.length} BOMs are in good standing — no critical lifecycle issues and adequate supply.`                },
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
                <t.Icon className="w-4 h-4" style={{ color: t.color }} /> {t.label} BOMs — most urgent
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

function OverviewPage({ boms, loading, goToBoms, goToUpload, navigate }: {
  boms: BomSummary[], loading: boolean
  goToBoms: () => void, goToUpload: () => void, navigate: (to: string) => void
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
          { label: 'Total BOMs',      value: loading ? '—' : String(boms.length),                    sub: 'across all projects',                                              highlight: false },
          { label: 'Lines Monitored', value: loading ? '—' : totalLines.toLocaleString(),             sub: 'components tracked',                                               highlight: false },
          { label: 'Needs Attention', value: loading ? '—' : String(criticalCount + warningCount),    sub: `${criticalCount} critical · ${warningCount} warning`,              highlight: (criticalCount + warningCount) > 0 },
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
          <p className="text-slate-400 text-sm">Upload a BOM to start monitoring risk.</p>
          <button onClick={goToUpload}
            className="mt-4 bg-[#0062ff] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors">
            <UploadCloud className="w-4 h-4" /> Upload your first BOM
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
                    <td className="px-5 py-4 text-slate-500">{bom.uploadedAt}</td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => navigate(`/bom/${bom.id}`)}
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

function BomsPage({ boms, loading, navigate, onDelete, onUpload }: {
  boms: BomSummary[], loading: boolean
  navigate: (to: string) => void, onDelete: (id: string) => void, onUpload: () => void
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  const filtered = boms.filter(b => {
    const q = search.toLowerCase()
    const matchQ = b.name.toLowerCase().includes(q) || b.filename.toLowerCase().includes(q)
    if (filter === 'High Risk') return matchQ && b.overallRiskScore >= 7
    if (filter === 'Warning')   return matchQ && b.overallRiskScore >= 4 && b.overallRiskScore < 7
    if (filter === 'Healthy')   return matchQ && b.overallRiskScore < 4
    return matchQ
  })

  return (
    <div className="flex-1 px-8 pt-5 pb-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Bills of Materials</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {boms.length} BOMs · {boms.reduce((s, b) => s + b.lineCount, 0).toLocaleString()} total lines monitored
          </p>
        </div>
        <button onClick={onUpload}
          className="bg-[#0062ff] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
          <UploadCloud className="w-4 h-4" /> Upload BOM
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search BOMs or filenames…"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0062ff] focus:border-[#0062ff]" />
        </div>
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {['All', 'High Risk', 'Warning', 'Healthy'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filter === f ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Loading BOMs…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(bom => {
              const isHigh = bom.overallRiskScore >= 7; const isMed = bom.overallRiskScore >= 4
              const border = isHigh ? 'border-red-200' : isMed ? 'border-amber-200' : 'border-emerald-200'
              return (
                <div key={bom.id} className={`bg-white border ${border} rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{bom.name}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{bom.filename}</p>
                    </div>
                    <RiskRing score={bom.overallRiskScore} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center border-t border-slate-100 pt-4">
                    <div>
                      <div className="text-lg font-bold text-slate-900">{bom.lineCount}</div>
                      <div className="text-xs text-slate-500">Lines</div>
                    </div>
                    <div>
                      <div className={`text-lg font-bold ${bom.atRiskCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>{bom.atRiskCount}</div>
                      <div className="text-xs text-slate-500">At Risk</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mt-1">{bom.uploadedAt}</div>
                      <div className="text-xs text-slate-500">Uploaded</div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => navigate(`/bom/${bom.id}`)}
                      className="flex-1 py-2 text-sm font-semibold text-[#0062ff] hover:text-blue-700 border border-slate-200 rounded-lg hover:border-[#0062ff] transition-colors flex items-center justify-center gap-1">
                      View Full Report <ArrowRight className="w-4 h-4" />
                    </button>
                    <DeleteBomButton
                      bomId={bom.id} bomName={bom.name}
                      redirectTo={null} variant="ghost" label="Delete"
                      className="px-3 py-2 text-xs"
                      onDeleted={() => onDelete(bom.id)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          {filtered.length === 0 && (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              No BOMs match your search.
            </div>
          )}
        </>
      )}
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

const UPLOAD_PROCESSING_STEPS = [
  { label: 'Column mapping applied',    threshold: 10 },
  { label: 'MPN normalization',         threshold: 30 },
  { label: 'Nexar resolution',          threshold: 55 },
  { label: 'Lifecycle & stock lookup',  threshold: 75 },
  { label: 'Risk scoring & alternates', threshold: 90 },
]

// ─── Root ─────────────────────────────────────────────────────────────────────

type Page = 'dashboard' | 'boms' | 'alerts'

export default function DashboardContent() {
  const [, navigate]   = useLocation()
  const { user, loading: authLoading } = useAuth()
  const [boms, setBoms]   = useState<BomSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]   = useState<Page>('dashboard')
  const [bellOpen, setBellOpen]       = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const bellRef    = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // Load BOMs
  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    setLoading(true)
    listBoms()
      .then((page) => { if (!cancelled) setBoms(page.items) })
      .catch(() => { /* API not yet configured */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [authLoading])

  // Click-outside for dropdowns
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current    && !bellRef.current.contains(e.target as Node))    setBellOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  // ── Upload modal state ──────────────────────────────────────────────────────
  const [uploadOpen, setUploadOpen]       = useState(false)
  const [uploadFile, setUploadFile]       = useState<File | null>(null)
  const [uploadStep, setUploadStep]       = useState<'upload' | 'mapping' | 'processing'>('upload')
  const [parseResult, setParseResult]     = useState<ParseResult | null>(null)
  const [mapping, setMapping]             = useState<ColumnMapping[]>([])
  const [headers, setHeaders]             = useState<string[]>([])
  const [uploadPreview, setUploadPreview] = useState<string[][]>([])
  const [progress, setProgress]           = useState(0)
  const [uploadError, setUploadError]     = useState<string | null>(null)
  const [parsing, setParsing]             = useState(false)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const openUpload = () => {
    setUploadOpen(true)
    setUploadStep('upload')
    setUploadFile(null)
    setParseResult(null)
    setMapping([])
    setHeaders([])
    setUploadPreview([])
    setProgress(0)
    setUploadError(null)
  }

  const closeUpload = () => setUploadOpen(false)

  const handleFileSelected = async (selected: File) => {
    setUploadFile(selected)
    setUploadError(null)
    setParsing(true)
    try {
      const result = await parseFile(selected)
      setParseResult(result)
      setMapping(buildColumnMappings(result))
      setHeaders(extractHeaders(result))
      setUploadPreview(previewRows(result))
      setUploadStep('mapping')
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to parse file')
      setUploadFile(null)
    } finally {
      setParsing(false)
    }
  }

  const startProgressAnimation = () => {
    let p = 0
    progressRef.current = setInterval(() => {
      p += Math.random() * 8 + 2
      if (p >= 92) p = 92
      setProgress(p)
    }, 280)
  }

  const stopProgressAnimation = () => {
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null }
  }

  const handleConfirmMapping = async () => {
    if (!uploadFile) return
    setUploadStep('processing')
    setProgress(0)
    setUploadError(null)
    startProgressAnimation()
    try {
      const analyzeResult = await analyzeFile(uploadFile)
      stopProgressAnimation()
      setProgress(100)
      const saved = await saveBom(uploadFile, analyzeResult, { parse: parseResult })
      const bomId = saved.id ?? analyzeResult.upload_id
      setTimeout(() => { closeUpload(); navigate(`/bom/${bomId}`) }, 500)
    } catch (err) {
      stopProgressAnimation()
      setUploadError(err instanceof Error ? err.message : 'Analysis failed')
      setUploadStep('mapping')
    }
  }

  const activeAlerts = ALERTS.filter(a => a.severity !== 'info')
  const initials = user
    ? (user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')
    : 'U'

  const nav = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'boms',      label: 'BOMs'      },
  ] as const

  return (
    <div className="relative flex flex-col h-screen bg-slate-50 font-sans text-slate-900">

      {/* ── Top navbar ── */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">

        {/* Logo + nav tabs */}
        <div className="flex items-center gap-8 h-full">
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 bg-[#0062ff] shrink-0" style={{ clipPath: 'polygon(24% 0, 100% 0, 100% 100%, 0% 100%)' }} />
            <span className="text-[17px] font-semibold tracking-tight text-[#0f1b2d]">
              Prokuro<span className="text-[#0062ff]">.ai</span>
            </span>
          </div>
          <nav className="flex items-center h-full">
            {nav.map(({ id, label }) => (
              <button key={id} onClick={() => setPage(id as Page)}
                className={`relative h-full px-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                  page === id
                    ? 'text-[#0f1b2d] border-[#0062ff]'
                    : 'text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300'
                }`}>
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: search, upload, bell, avatar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search parts, BOMs…"
              className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0062ff] w-56" />
          </div>
          <button onClick={openUpload}
            className="bg-[#0062ff] hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors shadow-sm">
            <UploadCloud className="w-4 h-4" /> Upload BOM
          </button>

          {/* Bell */}
          <div className="relative" ref={bellRef}>
            <button onClick={() => setBellOpen(o => !o)}
              className={`relative p-1.5 rounded-md transition-colors ${bellOpen ? 'text-[#0062ff] bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}>
              <Bell className="w-5 h-5" />
              {activeAlerts.length > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <span className="text-sm font-bold text-slate-900">Alerts</span>
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{activeAlerts.length} New</span>
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: 340 }}>
                  <div className="p-3 space-y-2">
                    {activeAlerts.slice(0, 6).map(alert => {
                      const isHigh = alert.severity === 'high'; const isMed = alert.severity === 'medium'
                      const iconBg    = isHigh ? 'bg-red-100'    : isMed ? 'bg-amber-100' : 'bg-blue-100'
                      const iconColor = isHigh ? 'text-red-600'  : isMed ? 'text-amber-600' : 'text-blue-600'
                      const Icon = isHigh ? ShieldAlert : isMed ? Clock : Bell
                      return (
                        <div key={alert.id} className="flex gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className={`mt-0.5 w-7 h-7 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-mono text-xs font-bold text-slate-900 truncate">{alert.part}</span>
                              <span className="text-[10px] text-slate-400 ml-2 shrink-0">{alert.time}</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-snug">{alert.message}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="p-3 border-t border-slate-100">
                  <button
                    onClick={() => { setPage('alerts'); setBellOpen(false) }}
                    className="w-full py-2 text-sm font-semibold text-white bg-[#0062ff] hover:bg-blue-700 rounded-lg transition-colors">
                    View all alerts
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button onClick={() => setProfileOpen(o => !o)}
              className={`flex items-center gap-2 p-1 rounded-md transition-colors ${profileOpen ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
              <div className="w-8 h-8 rounded-full bg-[#0062ff] flex items-center justify-center text-white shrink-0 text-xs font-bold">
                {initials.toUpperCase()}
              </div>
              <svg className={`w-4 h-4 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {profileOpen && (() => {
              const bomPct = Math.min((boms.length / 20) * 100, 100)
              return (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  {/* Identity */}
                  <div className="px-4 pt-4 pb-3.5 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#0062ff] flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {initials.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#0f1b2d] truncate">
                          {user ? `${user.firstName} ${user.lastName}`.trim() || user.email : 'Account'}
                        </p>
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-[#0062ff]">Growth</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{user?.email ?? ''}</p>
                      {user?.company?.trim() && <p className="text-xs text-slate-400 mt-0.5">{user.company}</p>}
                    </div>
                  </div>
                  {/* Plan usage */}
                  <div className="px-4 py-3.5 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-600">Active BOMs</span>
                      <span className="text-xs text-slate-400">{boms.length} / 20</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                      <div className="h-full rounded-full bg-[#0062ff]" style={{ width: `${bomPct}%` }} />
                    </div>
                    <button
                      onClick={() => { navigate('/account'); setProfileOpen(false) }}
                      className="w-full text-left text-xs font-semibold flex items-center justify-between group text-[#0062ff]">
                      Upgrade to Scale
                      <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                  {/* Nav items */}
                  <div className="py-1.5">
                    {[
                      { icon: Settings, label: 'Account settings', action: () => { navigate('/account'); setProfileOpen(false) } },
                    ].map(({ icon: Icon, label, action }) => (
                      <button key={label} onClick={action}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group">
                        <div className="w-7 h-7 rounded-md bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center shrink-0 transition-colors">
                          <Icon className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <span className="flex-1 text-sm font-medium text-[#0f1b2d]">{label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                  {/* Sign out */}
                  <div className="border-t border-slate-100 p-2">
                    <button onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left">
                      <LogOut className="w-4 h-4 shrink-0" /> Sign out
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <div className="flex-1 min-h-0 overflow-hidden flex">
        {page === 'dashboard' && (
          <OverviewPage
            boms={boms} loading={loading}
            goToBoms={() => setPage('boms')}
            goToUpload={openUpload}
            navigate={navigate}
          />
        )}
        {page === 'boms' && (
          <BomsPage
            boms={boms} loading={loading}
            navigate={navigate}
            onDelete={id => setBoms(prev => prev.filter(b => b.id !== id))}
            onUpload={openUpload}
          />
        )}
        {page === 'alerts' && <AlertsPage />}
      </div>

      {/* ── Upload modal ── */}
      {uploadOpen && (
        <div className="absolute inset-0 bg-[#0f1b2d]/60 backdrop-blur-[2px] z-50 flex items-center justify-center px-4"
          onClick={e => { if (e.target === e.currentTarget) closeUpload() }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

            {/* Modal header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-3.5 w-3.5 bg-[#0062ff] shrink-0" style={{ clipPath: 'polygon(24% 0,100% 0,100% 100%,0% 100%)' }} />
                  <span className="text-xs font-semibold text-[#0062ff] uppercase tracking-wider">New BOM</span>
                </div>
                {uploadStep === 'upload' && <>
                  <h2 className="text-lg font-bold text-slate-900">Upload your BOM</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Drop a CSV or Excel file to start monitoring risk.</p>
                </>}
                {uploadStep === 'mapping' && <>
                  <h2 className="text-lg font-bold text-slate-900">Map your columns</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Confirm how your columns map to Prokuro&apos;s fields.</p>
                </>}
                {uploadStep === 'processing' && <>
                  <h2 className="text-lg font-bold text-slate-900">Analyzing…</h2>
                  <p className="text-sm text-slate-500 mt-0.5">We&apos;re querying 12 data sources in parallel.</p>
                </>}
              </div>
              {uploadStep !== 'processing' && (
                <button onClick={closeUpload}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors mt-0.5">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Error banner */}
            {uploadError && (
              <div className="mx-6 mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {uploadError}
              </div>
            )}

            {/* Step: Upload */}
            {uploadStep === 'upload' && (
              <div className="px-6 pb-6">
                <BomUploadDropzone
                  variant="modal"
                  showInfoPanel={false}
                  parsing={parsing}
                  selectedFile={uploadFile}
                  onFileSelected={f => setUploadFile(f)}
                  onClearFile={() => setUploadFile(null)}
                />
                <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#0062ff] shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Needs at least an <strong>MPN</strong> or <strong>Part Number</strong> column. Map other columns in the next step.
                  </p>
                </div>
                <button
                  onClick={() => uploadFile && void handleFileSelected(uploadFile)}
                  disabled={!uploadFile || parsing}
                  className={`mt-4 w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    uploadFile && !parsing
                      ? 'bg-[#0062ff] text-white hover:bg-blue-700 shadow-sm'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}>
                  {parsing ? 'Reading file…' : <>Continue <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            )}

            {/* Step: Mapping */}
            {uploadStep === 'mapping' && parseResult && (
              <div className="px-6 pb-0">
                {/* Preview table */}
                {uploadPreview.length > 0 && (
                  <div className="mb-4 overflow-x-auto rounded-lg border border-slate-200 max-h-36">
                    <table className="w-full text-[11px]">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          {headers.map(h => (
                            <th key={h} className="border-b border-r border-slate-200 px-3 py-2 text-left font-medium text-slate-500 last:border-r-0 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {uploadPreview.map((row, ri) => (
                          <tr key={ri}>
                            {row.map((cell, ci) => (
                              <td key={ci} className="border-r border-b border-slate-100 px-3 py-1.5 text-slate-600 last:border-r-0 last:border-b-0 whitespace-nowrap">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* Mapping rows */}
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {mapping.map((col, idx) => (
                    <div key={col.canonical} className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 ${col.confirmed ? 'border-slate-200 bg-white' : 'border-amber-300 bg-amber-50'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">{col.label}</span>
                          {!col.confirmed && (
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">Needs confirmation</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          <code className="font-mono">{col.canonical}</code>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-400">from</span>
                        <select
                          value={col.detectedFrom ?? ''}
                          onChange={e => setMapping(m => m.map((c, i) => i === idx ? { ...c, detectedFrom: e.target.value || null, confirmed: true } : c))}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 focus:border-[#0062ff] focus:outline-none">
                          <option value="">— not mapped —</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Footer */}
                <div className="flex items-center justify-between py-4 mt-2 border-t border-slate-100">
                  <button onClick={() => { setUploadStep('upload'); setUploadFile(null); setParseResult(null) }}
                    className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
                    ← Back
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{Math.round(parseResult.mapping_confidence * 100)}% confidence</span>
                    <button onClick={() => void handleConfirmMapping()}
                      className="bg-[#0062ff] hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                      Confirm & analyze →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Processing */}
            {uploadStep === 'processing' && (
              <div className="px-6 pb-6">
                <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-xl mb-4">
                  <div className="relative w-14 h-14 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="22" stroke="#e2e8f0" strokeWidth="5" fill="none" />
                      <circle cx="28" cy="28" r="22" stroke="#0062ff" strokeWidth="5" fill="none"
                        strokeDasharray={2 * Math.PI * 22}
                        strokeDashoffset={2 * Math.PI * 22 * (1 - progress / 100)}
                        strokeLinecap="round" className="transition-all duration-300" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-[#0062ff]">{Math.round(progress)}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{uploadFile?.name ?? 'Analyzing…'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Resolving MPNs, checking lifecycle and stock…</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {UPLOAD_PROCESSING_STEPS.map(s => (
                    <div key={s.label} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${progress > s.threshold ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100'}`}>
                      {progress > s.threshold
                        ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        : <div className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />}
                      <span className={`text-sm font-medium ${progress > s.threshold ? 'text-emerald-700' : 'text-slate-400'}`}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
    </div>
  )
}
