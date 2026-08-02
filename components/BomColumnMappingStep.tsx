'use client'

import type { ColumnMapping, ParseResult } from '@/lib/types'

type BomColumnMappingStepProps = {
  file: File | null
  fileIndex: number
  fileCount: number
  parseResult: ParseResult
  mapping: ColumnMapping[]
  headers: string[]
  preview: string[][]
  previewLoading?: boolean
  onMappingChange: (mapping: ColumnMapping[]) => void
  onBack: () => void
  onConfirm: () => void
  confirming?: boolean
  confirmLabel?: string
}

export default function BomColumnMappingStep({
  file,
  fileIndex,
  fileCount,
  parseResult,
  mapping,
  headers,
  preview,
  previewLoading = false,
  onMappingChange,
  onBack,
  onConfirm,
  confirming = false,
  confirmLabel = 'Confirm & analyze →',
}: BomColumnMappingStepProps) {
  const hasMpn = mapping.some((col) => col.canonical === 'mpn' && col.detectedFrom)

  return (
    <div className="w-full border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-[#f4f6f9] px-5 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-slate-400">Preview</p>
        <p className="mt-1 text-[13px] text-slate-600">
          File {fileIndex + 1} of {fileCount}: {file?.name ?? parseResult.source_filename}
        </p>
      </div>

      <div className="p-5">
        {headers.length > 0 ? (
          <div className="relative mb-5 overflow-x-auto border border-slate-200">
            {previewLoading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 font-mono text-[11px] text-slate-500">
                Updating preview…
              </div>
            ) : null}
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#f4f6f9]">
                  {headers.map((header) => (
                    <th
                      key={header}
                      className="border-b border-r border-slate-200 px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.06em] text-slate-500 last:border-r-0"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className={`border-r border-slate-200 px-3 py-2 text-slate-600 last:border-r-0 ${rowIdx < preview.length - 1 ? 'border-b' : ''}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="space-y-2">
          {mapping.map((col, idx) => (
            <div
              key={col.canonical}
              className={`flex items-center gap-3 border px-4 py-3 ${
                col.confirmed ? 'border-slate-200 bg-white' : 'border-amber-300 bg-amber-50'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-slate-900">{col.label}</span>
                  {!col.confirmed ? (
                    <span className="bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-amber-800">
                      Needs confirmation
                    </span>
                  ) : null}
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-slate-400">
                  Canonical: {col.canonical}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-slate-400">From</span>
                <select
                  value={col.detectedFrom ?? ''}
                  onChange={(e) =>
                    onMappingChange(
                      mapping.map((entry, i) =>
                        i === idx
                          ? { ...entry, detectedFrom: e.target.value || null, confirmed: true }
                          : entry,
                      ),
                    )
                  }
                  className="border border-slate-200 bg-white px-2 py-1.5 text-[12px] text-slate-900 focus:border-[#0062ff] focus:outline-none"
                >
                  <option value="">(not mapped)</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        {!hasMpn ? (
          <p className="mt-4 text-[12px] text-amber-800">
            Map at least one column to <strong>MPN / Part Number</strong> before continuing.
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 bg-[#f4f6f9] px-5 py-4">
        <button
          type="button"
          onClick={onBack}
          disabled={confirming}
          className="font-mono text-[11px] uppercase tracking-[0.08em] text-slate-500 hover:text-slate-900 disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!hasMpn || confirming}
          className="bg-[#0062ff] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {confirming ? 'Analyzing…' : confirmLabel}
        </button>
      </div>
    </div>
  )
}
