'use client'

import AppMenu from '@/components/app/AppMenu'
import { ModalNotice } from '@/components/AppModal'
import { erpLabel } from '@/lib/erp'
import type { ColumnMapping, ParseResult, WarningCode } from '@/lib/types'

type BomColumnMappingStepProps = {
  file: File | null
  fileCount: number
  parseResult: ParseResult
  mapping: ColumnMapping[]
  headers: string[]
  preview: string[][]
  previewLoading?: boolean
  onMappingChange: (mapping: ColumnMapping[]) => void
  sourceErp?: string | null
  saveMapping?: boolean
  onSaveMappingChange?: (value: boolean) => void
}

function warningCopy(code: WarningCode): string {
  switch (code) {
    case 'LOW_MAPPING_CONFIDENCE':
      return 'We were unsure about some columns. Check the mapping before analyzing.'
    case 'MISSING_MPN':
      return 'Some rows are missing a part number.'
    case 'ROW_LIMIT_EXCEEDED':
      return 'This file is large. We only read a subset of rows for this preview.'
    case 'DIST_SKU_SUSPECT':
      return 'A column looks like a distributor SKU, not a manufacturer part number.'
  }
}

function fieldConfidence(col: ColumnMapping, overall: number): string {
  if (!col.detectedFrom) return 'Not mapped'
  if (col.confirmed && col.detectedFrom) {
    // User-touched or auto-detected; show relative strength from overall parse.
    if (overall >= 0.85) return 'High'
    if (overall >= 0.6) return 'Medium'
    return 'Low'
  }
  return 'Low'
}

function confidenceTone(label: string): string {
  if (label === 'High') return 'text-mk-green'
  if (label === 'Medium') return 'text-mk-amber'
  if (label === 'Not mapped') return 'text-mk-ink-subtle'
  return 'text-mk-red'
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
  sourceErp = null,
  saveMapping = false,
  onSaveMappingChange,
}: BomColumnMappingStepProps) {
  const hasMpn = mapping.some((col) => col.canonical === 'mpn' && col.detectedFrom)
  const fileName = file?.name ?? parseResult.source_filename
  const parsed = parseResult.stats.parsed_rows
  const total = parseResult.stats.total_rows
  const confidence = Math.round(parseResult.mapping_confidence * 100)
  const warningCodes = Array.from(new Set(parseResult.warnings.map((warning) => warning.code)))

  function setColumn(index: number, header: string | null) {
    onMappingChange(
      mapping.map((entry, i) =>
        i === index ? { ...entry, detectedFrom: header, confirmed: true } : entry,
      ),
    )
  }

  return (
    <div className="space-y-5">
      <div className="text-[13px] text-mk-ink-muted">
        {fileCount > 1 ? <p className="truncate font-medium text-mk-ink">{fileName}</p> : null}
        <p className={fileCount > 1 ? 'mt-1' : undefined}>
          {parsed.toLocaleString()}
          {total !== parsed ? ` of ${total.toLocaleString()}` : ''} rows
          {confidence > 0 && confidence < 100 ? ` · ${confidence}% column match` : ''}
          {parseResult.sheet_name ? ` · ${parseResult.sheet_name}` : ''}
          {sourceErp ? ` · ${erpLabel(sourceErp)}` : ''}
        </p>
      </div>

      {warningCodes.length > 0
        ? warningCodes.map((code) => (
            <ModalNotice key={code} tone="warn">
              {warningCopy(code)}
            </ModalNotice>
          ))
        : null}

      {!hasMpn ? (
        <ModalNotice tone="warn">
          We couldn&apos;t find a part number column. Pick it below.
        </ModalNotice>
      ) : null}

      {headers.length > 0 ? (
        <div>
          <p className="mb-2 text-[13px] font-medium text-mk-ink">Preview</p>
          <div className="relative overflow-x-auto rounded-[8px] bg-mk-raised">
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
          <p className="mt-2 text-[12px] text-mk-ink-subtle">First rows only. The full file is analyzed next.</p>
        </div>
      ) : null}

      <div>
        <p className="mb-1 text-[13px] font-medium text-mk-ink">
          {sourceErp ? `${erpLabel(sourceErp)} fields → Prokuro` : 'What each column is'}
        </p>
        <p className="mb-3 text-[12px] text-mk-ink-muted">
          Part number is required. Skip anything that is not a BOM field.
        </p>
        <div className="divide-y divide-mk-line rounded-[8px] bg-mk-raised px-4">
          {mapping.map((col, idx) => {
            const conf = fieldConfidence(col, parseResult.mapping_confidence)
            return (
              <div key={col.canonical} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-mk-ink">{col.label}</span>
                  <span className={`text-[11px] ${confidenceTone(conf)}`}>{conf} confidence</span>
                </div>
                <AppMenu
                  label={col.detectedFrom ?? 'Skip'}
                  ariaLabel={col.label}
                  triggerClassName="min-w-[11rem] justify-between"
                  items={[
                    { label: 'Skip', onSelect: () => setColumn(idx, null) },
                    ...headers.map((header) => ({
                      label: header,
                      onSelect: () => setColumn(idx, header),
                    })),
                  ]}
                />
              </div>
            )
          })}
        </div>
      </div>

      {sourceErp && sourceErp !== 'other' && onSaveMappingChange ? (
        <label className="flex items-start gap-2 text-[13px] text-mk-ink">
          <input
            type="checkbox"
            checked={saveMapping}
            onChange={(e) => onSaveMappingChange(e.target.checked)}
            className="mt-0.5"
          />
          <span>Save this mapping for future {erpLabel(sourceErp)} imports</span>
        </label>
      ) : null}
    </div>
  )
}
