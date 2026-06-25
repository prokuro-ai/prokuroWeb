'use client'

import type { AnalyzeResult } from '@/lib/types'
import { exportAnalyzeResultCsv, exportAnalyzeResultJson } from '@/lib/export'

export function ExportButtons({ result }: { result: AnalyzeResult }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => exportAnalyzeResultCsv(result)}
        className="rounded-md border border-hairline bg-surface-1 px-3 py-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
      >
        Export CSV
      </button>
      <button
        onClick={() => exportAnalyzeResultJson(result)}
        className="rounded-md border border-hairline bg-surface-1 px-3 py-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
      >
        Export JSON
      </button>
    </div>
  )
}
