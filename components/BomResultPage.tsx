'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { AnalyzeTable } from '@/components/BomTable'
import { ExportButtons } from '@/components/ExportButtons'
import { ConfidenceBadge } from '@/components/StatusBadge'
import { AnalyzeSummaryCards } from '@/components/SummaryCards'
import { getAnalyzeResult } from '@/lib/resultStore'
import type { AnalyzeResult } from '@/lib/types'

export default function BomResultPage() {
  const params = useParams()
  const uploadId = typeof params.id === 'string' ? params.id : ''
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (uploadId) {
      setResult(getAnalyzeResult(uploadId))
      setLoaded(true)
    }
  }, [uploadId])

  if (!loaded) return null

  if (!result) {
    return (
      <AppLayout>
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <h1 className="text-[18px] font-semibold text-[#0f1b2d]">Analysis not found</h1>
          <p className="mt-2 text-[13px] text-[#7a8598]">This result may have expired from your session. Upload a new BOM to analyze again.</p>
          <Link href="/bom/new" className="mt-6 rounded-lg bg-[#0062ff] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#0050e6]">
            Upload BOM
          </Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-[#d6deea] bg-white px-6">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-[15px] font-semibold text-[#0f1b2d]">{result.source_filename}</h1>
          {result.sheet_name && (
            <span className="rounded border border-[#d6deea] bg-[#f4f6f9] px-2 py-0.5 font-mono text-[11px] text-[#7a8598]">{result.sheet_name}</span>
          )}
          <ConfidenceBadge value={result.mapping_confidence} />
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons result={result} />
          <Link href="/bom/new" className="rounded-md border border-[#d6deea] bg-white px-3 py-1.5 text-[13px] font-medium text-[#4f5d73] hover:bg-[#f4f6f9]">
            Upload another
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <AnalyzeSummaryCards result={result} />

        <section className="mt-6">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#7a8598]">Components</p>
          <div className="mt-3">
            <AnalyzeTable result={result} />
          </div>
        </section>
      </div>
    </AppLayout>
  )
}
