'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { AnalyzeTable } from '@/components/BomTable'
import { DeleteBomButton } from '@/components/DeleteBomButton'
import { ExportButtons } from '@/components/ExportButtons'
import { useAuth } from '@/components/AuthProvider'
import { ConfidenceBadge } from '@/components/StatusBadge'
import { AnalyzeSummaryCards } from '@/components/SummaryCards'
import { getBom } from '@/lib/api'
import type { AnalyzeResult } from '@/lib/types'

function PlaceholderSection({ title, description }: { title: string; description: string }) {
  return (
    <section className="rounded-xl border border-dashed border-[#d6deea] bg-[#fafbfc] p-5">
      <h2 className="text-[13px] font-semibold text-[#0f1b2d]">{title}</h2>
      <p className="mt-1 text-[12px] text-[#7a8598]">{description}</p>
      <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-[#98a3b6]">Coming soon</p>
    </section>
  )
}

function BackToDashboard() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[#d6deea] bg-white text-[#4f5d73] transition-colors hover:border-[#0062ff] hover:text-[#0062ff]"
      aria-label="Back to dashboard"
      title="Back to dashboard"
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
        if (!cancelled) setResult(record.analyze)
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
      <AppLayout>
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <h1 className="text-[18px] font-semibold text-[#0f1b2d]">{error ? 'Could not load BOM' : 'BOM not found'}</h1>
          <p className="mt-2 text-[13px] text-[#7a8598]">
            {error ?? 'This BOM may not exist in your account, or you may not have access to it.'}
          </p>
          <Link href="/dashboard" className="mt-6 rounded-lg bg-[#0062ff] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#0050e6]">
            Back to dashboard
          </Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-[#d6deea] bg-white px-6">
        <div className="flex min-w-0 items-center gap-3">
          <BackToDashboard />
          <h1 className="truncate text-[15px] font-semibold text-[#0f1b2d]">{result.source_filename}</h1>
          {result.sheet_name && (
            <span className="rounded border border-[#d6deea] bg-[#f4f6f9] px-2 py-0.5 font-mono text-[11px] text-[#7a8598]">{result.sheet_name}</span>
          )}
          <ConfidenceBadge value={result.mapping_confidence} />
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons result={result} />
          <Link
            href="/bom/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0062ff] px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#0050e6]"
          >
            <UploadIcon />
            Upload another
          </Link>
          <DeleteBomButton bomId={uploadId} bomName={result.source_filename} redirectTo="/dashboard" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <AnalyzeSummaryCards result={result} />

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <PlaceholderSection
            title="Risk report"
            description="Per-line risk scores, lifecycle flags, and tariff exposure will appear here."
          />
          <PlaceholderSection
            title="Top actions this week"
            description="Recommended procurement actions based on at-risk lines will appear here."
          />
          <PlaceholderSection
            title="Alternates"
            description="Network-validated and parametric alternate suggestions will appear here."
          />
        </div>

        <section className="mt-6">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#7a8598]">Components</p>
          <div className="mt-3">
            <AnalyzeTable result={result} />
          </div>
        </section>
      </div>
    </AppLayout>
  )
}

function UploadIcon() {
  return (
    <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  )
}
