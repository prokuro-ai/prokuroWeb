'use client'

import AppMenu from '@/components/app/AppMenu'
import {
  exportAnalyzeResultCsv,
  exportAnalyzeResultJson,
  exportAnalyzeResultPdf,
  exportAnalyzeResultXlsx,
} from '@/lib/export'
import type { AnalyzeResult } from '@/lib/types'

type BomExportMenuProps = {
  result: AnalyzeResult
  triggerClassName?: string
}

export default function BomExportMenu({ result, triggerClassName }: BomExportMenuProps) {
  return (
    <AppMenu
      label="Export"
      triggerClassName={triggerClassName}
      items={[
        { label: 'Download CSV', onSelect: () => exportAnalyzeResultCsv(result) },
        { label: 'Download XLSX', onSelect: () => void exportAnalyzeResultXlsx(result) },
        { label: 'Download PDF', onSelect: () => void exportAnalyzeResultPdf(result) },
        { label: 'Download JSON', onSelect: () => exportAnalyzeResultJson(result) },
      ]}
    />
  )
}
