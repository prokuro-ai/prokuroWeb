'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { AnalyzeTable, ParseTable } from '@/components/BomTable'
import { ExportButtons } from '@/components/ExportButtons'
import { ConfidenceBadge } from '@/components/StatusBadge'
import { AnalyzeSummaryCards, ParseSummaryCards } from '@/components/SummaryCards'
import { getParsedBom } from '@/lib/bomStore'
import { getAnalyzeResult } from '@/lib/resultStore'
import { canonicalFieldLabel } from '@/lib/columnMapping'
import type { AnalyzeResult } from '@/lib/types'
import type { StoredBom } from '@/lib/bomStore'

export default function BomResultPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null)
  const [parsedBom, setParsedBom] = useState<StoredBom | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!id) return
    setAnalyzeResult(getAnalyzeResult(id))
    setParsedBom(getParsedBom(id))
    setLoaded(true)
  }, [id])

  if (!loaded) return null

  if (analyzeResult) {
    return (
      <AppLayout>
        <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-[#d6deea] bg-white px-6">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-[15px] font-semibold text-[#0f1b2d]">{analyzeResult.source_filename}</h1>
            {analyzeResult.sheet_name && (
              <span className="rounded border border-[#d6deea] bg-[#f4f6f9] px-2 py-0.5 font-mono text-[11px] text-[#7a8598]">{analyzeResult.sheet_name}</span>
            )}
            <ConfidenceBadge value={analyzeResult.mapping_confidence} />
          </div>
          <div className="flex items-center gap-3">
            <ExportButtons result={analyzeResult} />
            <Link href="/dashboard?upload=1" className="rounded-md border border-[#d6deea] bg-white px-3 py-1.5 text-[13px] font-medium text-[#4f5d73] hover:bg-[#f4f6f9]">
              Upload another
            </Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnalyzeSummaryCards result={analyzeResult} />

          <section className="mt-6">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#7a8598]">Components</p>
            <div className="mt-3">
              <AnalyzeTable result={analyzeResult} />
            </div>
          </section>
        </div>
      </AppLayout>
    )
  }

  if (parsedBom) {
    const { parseResult } = parsedBom
    const mappings = Object.entries(parseResult.column_mapping)

    return (
      <AppLayout>
        <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-[#d6deea] bg-white px-6">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-[15px] font-semibold text-[#0f1b2d]">{parsedBom.filename}</h1>
            <ConfidenceBadge value={parseResult.mapping_confidence} />
          </div>
          <Link href="/dashboard?upload=1" className="rounded-md border border-[#d6deea] bg-white px-3 py-1.5 text-[13px] font-medium text-[#4f5d73] hover:bg-[#f4f6f9]">
            Upload another
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <ParseSummaryCards result={parseResult} />

          {mappings.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#7a8598]">Column mapping</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {mappings.map(([sourceHeader, canonicalField]) => (
                  <span key={sourceHeader} className="rounded-md border border-[#d6deea] bg-[#f4f6f9] px-2.5 py-1 text-[12px] text-[#4f5d73]">
                    <strong className="text-[#0f1b2d]">{canonicalFieldLabel(canonicalField)}</strong>
                    {' ← '}
                    {sourceHeader.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          <section className="mt-6">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#7a8598]">Parsed lines</p>
            <div className="mt-3">
              <ParseTable result={parseResult} />
            </div>
          </section>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <h1 className="text-[18px] font-semibold text-[#0f1b2d]">BOM not found</h1>
        <p className="mt-2 text-[13px] text-[#7a8598]">This result may have expired from your session. Upload a new BOM to try again.</p>
        <Link href="/dashboard?upload=1" className="mt-6 rounded-lg bg-[#0062ff] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#0050e6]">
          Upload BOM
        </Link>
      </div>
    </AppLayout>
  )
}
