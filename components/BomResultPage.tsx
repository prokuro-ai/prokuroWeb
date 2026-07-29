'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import BomReportView from '@/components/BomReportView'
import { useAuth } from '@/components/AuthProvider'
import { Link } from '@/lib/navigation'
import { getBom } from '@/lib/api'
import type { AnalyzeResult, BomSummary } from '@/lib/types'

type BomResultPageProps = {
  id: string
}

export default function BomResultPage({ id }: BomResultPageProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [summary, setSummary] = useState<BomSummary | null>(null)
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    if (!id) {
      setLoaded(true)
      return
    }

    let cancelled = false
    setError(null)

    getBom(id)
      .then((record) => {
        if (!cancelled) {
          setSummary(record.summary)
          setResult(record.analyze)
        }
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
  }, [authLoading, user, id, router])

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
      <BomReportView result={result} summary={summary} backHref="/dashboard?tab=boms" />
    </DashboardShell>
  )
}
