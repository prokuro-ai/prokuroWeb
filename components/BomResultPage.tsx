'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import BomReportView from '@/components/BomReportView'
import { useAuth } from '@/components/AuthProvider'
import { Link } from '@/lib/navigation'
import { getBom } from '@/lib/api'
import type { AnalyzedLine, AnalyzeResult, BomSummary } from '@/lib/types'

type BomResultPageProps = {
  id: string
}

export default function BomResultPage({ id }: BomResultPageProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [summary, setSummary] = useState<BomSummary | null>(null)
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [version, setVersion] = useState(1)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)

  const loadBom = useCallback(() => {
    if (!id) {
      setLoaded(true)
      return
    }
    setError(null)
    setConflict(false)
    return getBom(id)
      .then((record) => {
        setSummary(record.summary)
        setResult(record.analyze)
        setVersion(record.summary.version ?? 1)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load BOM')
      })
      .finally(() => {
        setLoaded(true)
      })
  }, [id])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    void loadBom()
  }, [authLoading, user, router, loadBom])

  function handleLinesChange(lines: AnalyzedLine[]) {
    setResult((prev) => (prev ? { ...prev, lines, summary: { ...prev.summary, total: lines.length } } : prev))
  }

  if (!loaded || authLoading) return null

  if (!result) {
    return (
      <DashboardShell activeTab="boms">
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <h1 className="text-[18px] font-semibold text-slate-900">
            {error ? 'Could not load BOM' : 'BOM not found'}
          </h1>
          <p className="mt-2 text-[13px] text-slate-500">
            {error ?? 'This BOM may not exist in your account, or you may not have access to it.'}
          </p>
          <Link
            href="/dashboard?tab=boms"
            className="mt-6 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white hover:bg-primary-hover"
          >
            Back to BOMs
          </Link>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell activeTab="boms">
      {conflict && (
        <div className="border-b border-amber-200 bg-amber-50 px-8 py-3 text-sm text-amber-900">
          This BOM was updated elsewhere.{' '}
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => {
              setLoaded(false)
              void loadBom()
            }}
          >
            Refresh to see the latest
          </button>
        </div>
      )}
      <BomReportView
        result={result}
        summary={summary}
        backHref="/dashboard?tab=boms"
        bomId={id}
        version={version}
        onLinesChange={handleLinesChange}
        onVersionChange={setVersion}
        onConflict={() => setConflict(true)}
      />
    </DashboardShell>
  )
}
