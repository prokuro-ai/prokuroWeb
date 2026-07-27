'use client'

import type { ColumnMapping, ParseResult } from '@/lib/types'

type BomColumnMappingStepProps = {
  file: File | null
  parseResult: ParseResult
  mapping: ColumnMapping[]
  headers: string[]
  preview: string[][]
  onMappingChange: (mapping: ColumnMapping[]) => void
  onBack: () => void
  onConfirm: () => void
  confirming?: boolean
}

export default function BomColumnMappingStep({
  file,
  parseResult,
  mapping,
  headers,
  preview,
  onMappingChange,
  onBack,
  onConfirm,
  confirming = false,
}: BomColumnMappingStepProps) {
  const hasMpn = mapping.some((col) => col.canonical === 'mpn' && col.detectedFrom)

  return (
    <div className="w-full">
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Confirm column mapping</h2>
          <p className="mt-1 text-xs text-slate-500">
            {file?.name ?? parseResult.source_filename} — Prokuro detected the columns below. Correct any
            mistakes before analyzing.
          </p>
        </div>

        <div className="p-5">
          {headers.length > 0 && (
            <div className="mb-5 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50">
                    {headers.map((header) => (
                      <th
                        key={header}
                        className="border-b border-r border-slate-200 px-3 py-2 text-left font-medium text-slate-500 last:border-r-0"
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
          )}

          <div className="space-y-2">
            {mapping.map((col, idx) => (
              <div
                key={col.canonical}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                  col.confirmed ? 'border-slate-200 bg-white' : 'border-amber-300 bg-amber-50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">{col.label}</span>
                    {!col.confirmed && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        Needs confirmation
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400">
                    Canonical field: <code className="font-mono">{col.canonical}</code>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-slate-500">mapped from</span>
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
                    className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 focus:border-[#0062ff] focus:outline-none"
                  >
                    <option value="">— not mapped —</option>
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

          {!hasMpn && (
            <p className="mt-4 text-xs text-amber-700">
              Map at least one column to <strong>MPN / Part Number</strong> before continuing.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onBack}
            disabled={confirming}
            className="text-sm text-slate-500 hover:text-slate-900 disabled:opacity-50"
          >
            ← Back
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              {Math.round(parseResult.mapping_confidence * 100)}% mapping confidence
            </span>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!hasMpn || confirming}
              className="rounded-lg bg-[#0062ff] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {confirming ? 'Analyzing…' : 'Confirm & analyze →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
