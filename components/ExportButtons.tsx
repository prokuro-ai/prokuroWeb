import type { AnalyzeResult } from '@/lib/types'
import { exportAnalyzeResultCsv, exportAnalyzeResultJson } from '@/lib/export'

const btnSecondary =
  'inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3.5 py-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:bg-surface-1 hover:text-ink'

export function ExportButtons({ result }: { result: AnalyzeResult }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => exportAnalyzeResultCsv(result)} className={btnSecondary}>
        <DownloadIcon />
        Export CSV
      </button>
      <button type="button" onClick={() => exportAnalyzeResultJson(result)} className={btnSecondary}>
        <DownloadIcon />
        Export JSON
      </button>
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 11.25L12 15.75m0 0l4.5-4.5M12 15.75V3" />
    </svg>
  )
}
