'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AppShell from '@/components/app/AppShell'
import { BomInsightPanels, EnrichmentStatusBanner, TariffNotice } from '@/components/analyze/BomAnalysisPanels'
import { AnalyzeTable } from '@/components/BomTable'
import { DeleteBomButton } from '@/components/DeleteBomButton'
import { ExportButtons } from '@/components/ExportButtons'
import { useAuth } from '@/components/AuthProvider'
import { ConfidenceBadge } from '@/components/StatusBadge'
import { AnalyzeSummaryCards } from '@/components/SummaryCards'
import { getBom } from '@/lib/api'
import type { AnalyzeResult } from '@/lib/types'

function BackLink() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-[#0062ff] hover:text-[#0062ff]"
      aria-label="Back to dashboard"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
      </svg>
    </Link>
  )
}

export default function BomResultPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const uploadId = typeof params.id === 'string' ? params.id : ''
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [bomName, setBomName] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (!uploadId) {
      setLoaded(true)
      return
    }

    let cancelled = false
    setError(null)

    getBom(uploadId)
      .then((record) => {
        if (cancelled) return
        setResult(record.analyze)
        setBomName(record.summary.name)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load BOM')
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [authLoading, user, uploadId, router])

  if (!loaded || authLoading) return null

  if (!result) {
    return (
      <AppShell>
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <h1 className="text-lg font-semibold text-slate-900">{error ? 'Could not load BOM' : 'BOM not found'}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {error ?? 'This BOM may not exist in your account, or you may not have access to it.'}
          </p>
          <Link href="/dashboard" className="mt-6 rounded-lg bg-[#0062ff] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Back to dashboard
          </Link>
        </div>
      </AppShell>
    )
  }

  const title = bomName ?? result.source_filename

  return (
    <AppShell>
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex min-w-0 items-center gap-3">
          <BackLink />
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold text-slate-900">{title}</h1>
            {bomName && bomName !== result.source_filename && (
              <p className="truncate text-xs text-slate-400">{result.source_filename}</p>
            )}
          </div>
          {result.sheet_name && (
            <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-500">
              {result.sheet_name}
            </span>
          )}
          <ConfidenceBadge value={result.mapping_confidence} />
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons result={result} />
          <DeleteBomButton bomId={uploadId} bomName={title} redirectTo="/boms" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <EnrichmentStatusBanner result={result} />
          <AnalyzeSummaryCards result={result} />
          <BomInsightPanels result={result} />
          <section>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Components</h2>
            <TariffNotice result={result} />
            <div className="mt-3">
              <AnalyzeTable result={result} />
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  )
}
