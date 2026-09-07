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
    <div className="w-full">
      <div className="mb-4">
        <p className="mk-eyebrow">Preview</p>
        <p className="mt-1 text-[13px] text-mk-ink-muted">
          File {fileIndex + 1} of {fileCount}: {file?.name ?? parseResult.source_filename}
        </p>
      </div>

      <div>
        {headers.length > 0 ? (
          <div className="relative mb-5 overflow-x-auto rounded-[8px] bg-mk-raised">
            {previewLoading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-mk-canvas/80 font-mk-mono text-[11px] text-mk-ink-subtle">
                Updating preview…
              </div>
            ) : null}
            <table className="w-full text-xs">
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      className="border-b border-mk-line px-3 py-2 text-left font-mk-mono text-[10px] uppercase tracking-[0.06em] text-mk-ink-subtle"
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

        <div className="space-y-2">
          {mapping.map((col, idx) => (
            <div
              key={col.canonical}
              className={`flex items-center gap-3 rounded-[8px] px-4 py-3 ${
                col.confirmed ? 'bg-mk-raised' : 'bg-mk-amber/10'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-mk-ink">{col.label}</span>
                  {!col.confirmed ? (
                    <span className="rounded-[6px] bg-mk-amber/15 px-1.5 py-0.5 font-mk-mono text-[10px] uppercase tracking-wide text-mk-amber">
                      Needs confirmation
                    </span>
                  ) : null}
                </div>
                <div className="mt-0.5 font-mk-mono text-[11px] text-mk-ink-subtle">
                  Canonical: {col.canonical}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="mk-eyebrow">From</span>
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
                  className={appField}
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
          <p className="mt-4 text-[12px] text-mk-amber">
            Map at least one column to <strong>MPN / Part Number</strong> before continuing.
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between">
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
