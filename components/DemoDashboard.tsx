'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Link } from '@/lib/navigation'
import DashboardShell from '@/components/DashboardShell'
import BomReportView from '@/components/BomReportView'
import PurchasingPage from '@/components/PurchasingPage'
import { DEMO_BOMS, getDemoBom, getDemoSummaries } from '@/lib/demo/datasets'
import type { BomSummary } from '@/lib/types'
import { formatUploadedAt } from '@/lib/format'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  ChevronRight,
  FileText,
  Search,
  ShieldAlert,
} from 'lucide-react'

type Page = 'dashboard' | 'boms' | 'purchasing'

function resolvePage(tabParam: string | null): Page {
  if (tabParam === 'boms') return 'boms'
  if (tabParam === 'purchasing') return 'purchasing'
  return 'dashboard'
}

const RiskRing = ({ score }: { score: number }) => {
  const isHigh = score >= 7
  const isMed = score >= 4
  const color = isHigh ? 'text-red-500' : isMed ? 'text-amber-500' : 'text-emerald-500'
  const bgColor = isHigh ? '#fee2e2' : isMed ? '#fef3c7' : '#d1fae5'
  const fgColor = isHigh ? '#ef4444' : isMed ? '#f59e0b' : '#10b981'
  const pct = (score / 10) * 100
  const r = 24
  const circ = 2 * Math.PI * r
  return (
    <div className="relative flex h-14 w-14 items-center justify-center">
      <svg className="absolute h-full w-full -rotate-90">
        <circle cx="28" cy="28" r={r} stroke={bgColor} strokeWidth="4" fill="transparent" />
        <circle
          cx="28"
          cy="28"
          r={r}
          stroke={fgColor}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * pct) / 100}
        />
      </svg>
      <span className={`text-sm font-bold ${color}`}>{score.toFixed(1)}</span>
    </div>
  )
}

function buildAlerts() {
  const alerts: {
    id: string
    part: string
    type: string
    message: string
    severity: 'high' | 'medium' | 'info'
    time: string
    bom: string
    bomId: string
  }[] = []

  for (const demo of DEMO_BOMS) {
    for (const line of demo.analyze.top_risks ?? []) {
      const life = line.lifecycle_status.toLowerCase()
      let type = 'Lead Time'
      if (life === 'eol' || life === 'discontinued') type = 'EOL'
      else if (life === 'nrnd') type = 'NRND'
      else if (line.total_duty_pct != null && line.total_duty_pct > 0) type = 'Tariff'
      else if (line.match_status.toLowerCase() === 'none') type = 'No Match'

      const bits: string[] = []
      if (type === 'EOL' || type === 'NRND') bits.push(`${type} status on this line.`)
      if (line.total_duty_pct != null && line.total_duty_pct > 0) {
        bits.push(`Section 301 duty ${line.total_duty_pct}%.`)
      }
      if (line.factory_lead_days != null && line.factory_lead_days > 182) {
        bits.push(`Factory lead ${Math.round(line.factory_lead_days / 7)} weeks.`)
      }
      if (line.aml_candidates[0]) bits.push(`Alternate: ${line.aml_candidates[0]}.`)
      if (line.availability_status.toLowerCase() === 'outofstock') {
        bits.push('Out of stock across tracked distributors.')
      }
      if (line.match_status.toLowerCase() === 'none') bits.push('No catalog match for this MPN.')

      alerts.push({
        id: `${demo.summary.id}-${line.row_index}`,
        part: line.mpn ?? 'Unknown',
        type,
        message: bits.join(' ') || 'Review before next production run.',
        severity: line.risk_level === 'red' ? 'high' : 'medium',
        time: formatUploadedAt(demo.summary.uploadedAt),
        bom: demo.summary.name,
        bomId: demo.summary.id,
      })
    }
  }

  return alerts.sort((a, b) => {
    if (a.severity === b.severity) return 0
    return a.severity === 'high' ? -1 : 1
  })
}

function PortfolioRisk({ boms, onViewBom }: { boms: BomSummary[]; onViewBom: (id: string) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const criticalBoms = boms.filter((b) => b.overallRiskScore >= 7)
  const warningBoms = boms.filter((b) => b.overallRiskScore >= 4 && b.overallRiskScore < 7)
  const healthyBoms = boms.filter((b) => b.overallRiskScore < 4)
  const total = Math.max(boms.length, 1)

  const tiers = [
    {
      id: 'critical',
      label: 'Critical',
      items: criticalBoms,
      color: '#ef4444',
      bg: '#fef2f2',
      border: '#fecaca',
      Icon: ShieldAlert,
      detail: `${criticalBoms.length} BOMs need immediate action. EOL parts and last-time-buy windows.`,
    },
    {
      id: 'warning',
      label: 'Warning',
      items: warningBoms,
      color: '#f59e0b',
      bg: '#fffbeb',
      border: '#fde68a',
      Icon: AlertTriangle,
      detail: `${warningBoms.length} BOMs have lead-time issues, NRND components, or tariff exposure.`,
    },
    {
      id: 'healthy',
      label: 'Healthy',
      items: healthyBoms,
      color: '#10b981',
      bg: '#f0fdf4',
      border: '#a7f3d0',
      Icon: CheckCircle,
      detail: `${healthyBoms.length} BOMs are in good standing with no critical lifecycle issues.`,
    },
  ]

  return (
    <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Portfolio Risk Distribution
        </span>
        <span className="text-xs text-slate-400">Click a segment to explore</span>
      </div>
      <div className="mb-5 flex h-6 gap-0.5 overflow-hidden rounded-lg">
        {tiers.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setExpanded(expanded === t.id ? null : t.id)}
            className="relative flex items-center justify-center transition-all"
            style={{
              width: `${(t.items.length / total) * 100}%`,
              minWidth: (t.items.length / total) * 100 < 5 ? 28 : undefined,
              background: t.color,
              opacity: expanded && expanded !== t.id ? 0.3 : 1,
            }}
            title={`${t.label}: ${t.items.length} BOMs`}
          >
            {(t.items.length / total) * 100 > 5 && (
              <span className="text-[10px] font-bold text-white">{t.items.length}</span>
            )}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {tiers.map((t) => {
          const isActive = expanded === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setExpanded(isActive ? null : t.id)}
              className="rounded-xl border-2 p-4 text-left transition-all"
              style={{
                borderColor: isActive ? t.color : '#e2e8f0',
                background: isActive ? t.bg : '#fff',
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <t.Icon className="h-4 w-4 shrink-0" style={{ color: t.color }} />
                <span className="text-sm font-bold text-slate-900">{t.label}</span>
              </div>
              <span className="text-3xl font-bold leading-none" style={{ color: t.color }}>
                {t.items.length}
              </span>
              <div className="my-3 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min((t.items.length / total) * 200, 100)}%`,
                    background: t.color,
                  }}
                />
              </div>
              <p className="text-xs leading-relaxed text-slate-500">{t.detail}</p>
            </button>
          )
        })}
      </div>
      {expanded &&
        (() => {
          const t = tiers.find((x) => x.id === expanded)!
          return (
            <div
              className="mt-3 rounded-xl border p-4"
              style={{ borderColor: t.border, background: t.bg }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <t.Icon className="h-4 w-4" style={{ color: t.color }} /> {t.label} BOMs, most urgent
                </span>
                <span className="text-xs font-semibold" style={{ color: t.color }}>
                  {t.items.length} total
                </span>
              </div>
              {t.items.map((bom) => (
                <button
                  key={bom.id}
                  type="button"
                  onClick={() => onViewBom(bom.id)}
                  className="mb-2 flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-left shadow-sm hover:border-[#0062ff]"
                >
                  <t.Icon className="h-4 w-4 shrink-0" style={{ color: t.color }} />
                  <span className="flex-1 truncate text-sm font-medium text-slate-900">{bom.name}</span>
                  <span className="text-xs text-slate-400">{bom.atRiskCount} at-risk</span>
                </button>
              ))}
            </div>
          )
        })()}
    </div>
  )
}

function OverviewPage({
  boms,
  alerts,
  goToBoms,
  onViewBom,
}: {
  boms: BomSummary[]
  alerts: ReturnType<typeof buildAlerts>
  goToBoms: () => void
  onViewBom: (id: string) => void
}) {
  const totalLines = boms.reduce((s, b) => s + b.lineCount, 0)
  const criticalCount = boms.filter((b) => b.overallRiskScore >= 7).length
  const warningCount = boms.filter((b) => b.overallRiskScore >= 4 && b.overallRiskScore < 7).length
  const needsAttentionBoms = [...boms]
    .filter((b) => b.atRiskCount > 0)
    .sort((a, b) => b.atRiskCount - a.atRiskCount)

  const feedItems = [
    `${alerts.filter((a) => a.severity === 'high').length} critical alerts across ${boms.length} sample BOMs.`,
    'OpenXenium CPLD is EOL with a validated Xilinx CoolRunner alternate.',
    'MMDVM HS Hat has STM32F405 out of stock and Section 301 on RF modules.',
  ]

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3.5 text-sm text-blue-900">
        <span className="font-semibold">Interactive demo.</span> Five preloaded BOMs with lifecycle,
        stock, lead time, tariff, and alternate data. No login required.
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
        <p className="text-sm font-medium text-slate-700">{feedItems[0]}</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: 'Total BOMs', value: String(boms.length), sub: 'sample portfolio', highlight: false },
          {
            label: 'Lines Monitored',
            value: totalLines.toLocaleString(),
            sub: 'components tracked',
            highlight: false,
          },
          {
            label: 'Needs Attention',
            value: String(criticalCount + warningCount),
            sub: `${criticalCount} critical · ${warningCount} warning`,
            highlight: criticalCount + warningCount > 0,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <span className="text-sm font-medium text-slate-500">{s.label}</span>
            <span
              className={`mt-1 text-3xl font-bold tracking-tight ${s.highlight ? 'text-red-600' : 'text-slate-900'}`}
            >
              {s.value}
            </span>
            <span className="mt-1 text-xs text-slate-400">{s.sub}</span>
          </div>
        ))}
      </div>

      <PortfolioRisk boms={boms} onViewBom={onViewBom} />

      <div>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Needs Attention</h2>
          <button
            type="button"
            onClick={goToBoms}
            className="flex items-center gap-1 text-xs font-semibold text-[#0062ff] hover:text-blue-700"
          >
            View all BOMs <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                {['BOM Name', 'At-Risk Parts', 'Last Updated', ''].map((h) => (
                  <th key={h || 'action'} className="px-5 py-3.5 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {needsAttentionBoms.map((bom) => (
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
                    <button
                      type="button"
                      onClick={() => onViewBom(bom.id)}
                      className="ml-auto flex items-center gap-1 font-semibold text-[#0062ff] hover:text-blue-700"
                    >
                      View <ChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900">
          Recent Alerts
        </h2>
        <div className="space-y-3">
          {alerts.slice(0, 5).map((alert) => {
            const isHigh = alert.severity === 'high'
            const Icon = isHigh ? ShieldAlert : AlertTriangle
            return (
              <button
                key={alert.id}
                type="button"
                onClick={() => onViewBom(alert.bomId)}
                className="flex w-full items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isHigh ? 'bg-red-100' : 'bg-amber-100'}`}
                >
                  <Icon className={`h-4 w-4 ${isHigh ? 'text-red-600' : 'text-amber-600'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-bold text-slate-900">
                      {alert.part}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                        isHigh
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                    >
                      {alert.type}
                    </span>
                  </div>
                  <p className="mb-2 text-sm leading-snug text-slate-700">{alert.message}</p>
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500">{alert.bom}</span>
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-semibold text-[#0062ff]">
                  View report <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function BomsPage({
  boms,
  onViewBom,
}: {
  boms: BomSummary[]
  onViewBom: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const blurbs = Object.fromEntries(DEMO_BOMS.map((b) => [b.summary.id, b.blurb]))

  const filtered = boms.filter((b) => {
    const q = search.toLowerCase()
    const matchQ = b.name.toLowerCase().includes(q) || b.filename.toLowerCase().includes(q)
    if (filter === 'High Risk') return matchQ && b.overallRiskScore >= 7
    if (filter === 'Warning') return matchQ && b.overallRiskScore >= 4 && b.overallRiskScore < 7
    if (filter === 'Healthy') return matchQ && b.overallRiskScore < 4
    return matchQ
  })

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-8 pt-5">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Bills of Materials</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {boms.length} sample BOMs ·{' '}
            {boms.reduce((s, b) => s + b.lineCount, 0).toLocaleString()} total lines
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
          Demo data · read-only
        </span>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search BOMs or filenames…"
            className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-[#0062ff] focus:outline-none focus:ring-2 focus:ring-[#0062ff]"
          />
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
          {['All', 'High Risk', 'Warning', 'Healthy'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                filter === f
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((bom) => {
          const isHigh = bom.overallRiskScore >= 7
          const isMed = bom.overallRiskScore >= 4
          const border = isHigh
            ? 'border-red-200'
            : isMed
              ? 'border-amber-200'
              : 'border-emerald-200'
          return (
            <div
              key={bom.id}
              className={`rounded-xl border ${border} bg-white p-6 shadow-sm transition-shadow hover:shadow-md`}
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{bom.name}</h3>
                  <p className="mt-0.5 font-mono text-xs text-slate-400">{bom.filename}</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{blurbs[bom.id]}</p>
                </div>
                <RiskRing score={bom.overallRiskScore} />
              </div>
              <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-center">
                <div>
                  <div className="text-lg font-bold text-slate-900">{bom.lineCount}</div>
                  <div className="text-xs text-slate-500">Lines</div>
                </div>
                <div>
                  <div
                    className={`text-lg font-bold ${bom.atRiskCount > 0 ? 'text-red-600' : 'text-slate-400'}`}
                  >
                    {bom.atRiskCount}
                  </div>
                  <div className="text-xs text-slate-500">At Risk</div>
                </div>
                <div>
                  <div className="mt-1 text-xs text-slate-400">{formatUploadedAt(bom.uploadedAt)}</div>
                  <div className="text-xs text-slate-500">Uploaded</div>
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => onViewBom(bom.id)}
                  className="flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-[#0062ff] transition-colors hover:border-[#0062ff] hover:text-blue-700"
                >
                  View Full Report <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
      {filtered.length === 0 && (
        <div className="flex h-40 items-center justify-center text-sm text-slate-400">
          No BOMs match your search.
        </div>
      )}
    </div>
  )
}

export default function DemoDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const boms = useMemo(() => getDemoSummaries(), [])
  const alerts = useMemo(() => buildAlerts(), [])

  const tabParam = searchParams.get('tab')
  const bomId = searchParams.get('bom')
  const page = resolvePage(tabParam)
  const selected = bomId && page === 'boms' ? getDemoBom(bomId) : undefined

  const setPage = (next: Page) => {
    router.push(`/demo?tab=${next}`)
  }

  const viewBom = (id: string) => {
    router.push(`/demo?tab=boms&bom=${encodeURIComponent(id)}`)
  }

  return (
    <DashboardShell
      activeTab={selected ? 'boms' : page}
      bomCount={boms.length}
      demoMode
    >
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {selected ? (
          <BomReportView
            result={selected.analyze}
            summary={selected.summary}
            backHref="/demo?tab=boms"
            backLabel="Back to demo BOMs"
          />
        ) : page === 'dashboard' ? (
          <OverviewPage
            boms={boms}
            alerts={alerts}
            goToBoms={() => setPage('boms')}
            onViewBom={viewBom}
          />
        ) : page === 'purchasing' ? (
          <PurchasingPage demoMode />
        ) : (
          <BomsPage boms={boms} onViewBom={viewBom} />
        )}
      </div>

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
          <span className="text-xs text-slate-400">Demo portfolio · static sample data</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-slate-400 transition-colors hover:text-slate-700">
            Home
          </Link>
          <Link
            href="/schedule"
            className="text-xs text-slate-400 transition-colors hover:text-slate-700"
          >
            Book a demo
          </Link>
        </div>
      </footer>
    </DashboardShell>
  )
}
