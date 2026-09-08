'use client'

import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  exportAnalyzeResultCsv,
  exportAnalyzeResultJson,
  exportAnalyzeResultPdf,
  exportAnalyzeResultXlsx,
} from '@/lib/export'
import { appMenu, appMenuItem, appToolbarBtn } from '@/components/app/chrome'
import type { AnalyzeResult } from '@/lib/types'
import { cn } from '@/lib/utils'

type BomExportMenuProps = {
  result: AnalyzeResult
  triggerClassName?: string
}

export default function BomExportMenu({ result, triggerClassName }: BomExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(appToolbarBtn, triggerClassName)}
          aria-haspopup="menu"
        >
          Export
          <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={appMenu}>
        <DropdownMenuItem className={appMenuItem} onSelect={() => exportAnalyzeResultCsv(result)}>
          Download CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          className={appMenuItem}
          onSelect={() => {
            void exportAnalyzeResultXlsx(result)
          }}
        >
          Download XLSX
        </DropdownMenuItem>
        <DropdownMenuItem
          className={appMenuItem}
          onSelect={() => {
            void exportAnalyzeResultPdf(result)
          }}
        >
          Download PDF
        </DropdownMenuItem>
        <DropdownMenuItem className={appMenuItem} onSelect={() => exportAnalyzeResultJson(result)}>
          Download JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
