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
  exportAnalyzeResultExcel,
} from '@/lib/export'
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
          className={cn(
            'inline-flex items-center gap-1.5',
            triggerClassName,
          )}
          aria-haspopup="menu"
        >
          Export
          <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <DropdownMenuItem onSelect={() => exportAnalyzeResultCsv(result)}>
          Download CSV
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => exportAnalyzeResultExcel(result)}>
          Download Excel
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => exportAnalyzeResultJson(result)}>
          Download JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
