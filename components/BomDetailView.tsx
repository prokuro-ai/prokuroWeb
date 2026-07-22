'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import BomAnalyzeContent from '@/components/BomAnalyzeContent'
import { DeleteBomButton } from '@/components/DeleteBomButton'
import { ExportButtons } from '@/components/ExportButtons'
import { ConfidenceBadge } from '@/components/StatusBadge'
import { getBom } from '@/lib/api'
import type { AnalyzeResult } from '@/lib/types'

type BomDetailViewProps = {
  bomId: string
  onBack: () => void
  onDeleted: () => void
}

export default function BomDetailView({ bomId, onBack, onDeleted }: BomDetailViewProps) {
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoaded(false)
    setError(null)
    setResult(null)

    getBom(bomId)
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
  }, [bomId])

  if (!loaded) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
        Loading BOM…
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <h1 className="text-lg font-semibold text-slate-900">{error ? 'Could not load BOM' : 'BOM not found'}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {error ?? 'This BOM may not exist in your account, or you may not have access to it.'}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 rounded-lg bg-[#0062ff] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-slate-50">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-[#0062ff] hover:text-[#0062ff]"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-slate-900">{result.source_filename}</h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              {result.sheet_name && (
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-500">
                  {result.sheet_name}
                </span>
              )}
              <ConfidenceBadge value={result.mapping_confidence} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons result={result} />
          <DeleteBomButton
            bomId={bomId}
            bomName={result.source_filename}
            redirectTo={null}
            onDeleted={onDeleted}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-7xl">
          <BomAnalyzeContent result={result} />
        </div>
      </div>
    </div>
  )
}
