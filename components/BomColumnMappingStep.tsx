'use client'

import type { ColumnMapping, ParseResult } from '@/lib/types'
import { appField, appGhostBtn, appPrimaryBtn } from '@/components/app/chrome'

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
  confirmLabel = 'Analyze',
}: BomColumnMappingStepProps) {
  const hasMpn = mapping.some((col) => col.canonical === 'mpn' && col.detectedFrom)
  const fileName = file?.name ?? parseResult.source_filename

  return (
    <div className="w-full">
      {fileCount > 1 ? (
        <p className="mb-3 truncate text-[13px] text-mk-ink-muted">{fileName}</p>
      ) : null}

      {headers.length > 0 ? (
        <div className="relative mb-4 overflow-x-auto rounded-[8px] bg-mk-raised">
          {previewLoading ? (
            <div className="absolute inset-0 z-10 bg-mk-canvas/70" aria-hidden />
          ) : null}
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="border-b border-mk-line px-3 py-2 font-medium text-mk-ink-subtle"
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
                      className={`px-3 py-2 text-mk-ink-muted ${rowIdx < preview.length - 1 ? 'border-b border-mk-line' : ''}`}
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

      <div className="divide-y divide-mk-line">
        {mapping.map((col, idx) => (
          <label key={col.canonical} className="flex items-center gap-3 py-2.5">
            <span className="min-w-0 flex-1 truncate text-[13px] text-mk-ink">{col.label}</span>
            <select
              value={col.detectedFrom ?? ''}
              aria-label={col.label}
              onChange={(e) =>
                onMappingChange(
                  mapping.map((entry, i) =>
                    i === idx
                      ? { ...entry, detectedFrom: e.target.value || null, confirmed: true }
                      : entry,
                  ),
                )
              }
              className={`${appField} w-[min(14rem,46%)]`}
            >
              <option value="">Skip</option>
              {headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {!hasMpn ? (
        <p className="mt-3 text-[12px] text-mk-amber">Map a part number column.</p>
      ) : null}

      <div className="mt-5 flex items-center justify-end gap-3">
        <button type="button" onClick={onBack} disabled={confirming} className={appGhostBtn}>
          Back
        </button>
        <button type="button" onClick={onConfirm} disabled={!hasMpn || confirming} className={appPrimaryBtn}>
          {confirming ? 'Analyzing…' : confirmLabel}
        </button>
      </div>
    </div>
  )
}
