'use client'

import { useCallback, useEffect, useState } from 'react'
import BomUploadDropzone, { ACCEPTED } from '@/components/BomUploadDropzone'
import { ParseSummaryCards } from '@/components/SummaryCards'
import { useModal } from '@/hooks/useModal'
import { parseFile } from '@/lib/api'
import type { ParseResult } from '@/lib/types'

type ModalPhase = 'idle' | 'parsing' | 'success' | 'error'

interface BomUploadModalProps {
  open: boolean
  onClose: () => void
}

export default function BomUploadModal({ open, onClose }: BomUploadModalProps) {
  const [phase, setPhase] = useState<ModalPhase>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const blockDismiss = phase === 'parsing'

  const reset = useCallback(() => {
    setPhase('idle')
    setFile(null)
    setParseResult(null)
    setError(null)
    setValidationError(null)
  }, [])

  const handleClose = useCallback(() => {
    if (phase === 'parsing') return
    reset()
    onClose()
  }, [phase, reset, onClose])

  const { onBackdropClick } = useModal({ open, onClose: handleClose, blockDismiss })

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  const handleFileSelected = async (selected: File) => {
    const ext = '.' + selected.name.split('.').pop()?.toLowerCase()
    if (!ACCEPTED.includes(ext)) {
      setValidationError(`Unsupported file type. Accepted formats: ${ACCEPTED.join(', ')}`)
      return
    }

    setValidationError(null)
    setError(null)
    setFile(selected)
    setPhase('parsing')

    try {
      const result = await parseFile(selected)
      setParseResult(result)
      setPhase('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
      setPhase('error')
    }
  }

  const handleClearFile = () => {
    setFile(null)
    setPhase('idle')
    setError(null)
  }

  if (!open) return null

  return (
    <div
      className={`modal is-open`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="uploadBomModalTitle"
      aria-hidden={false}
      onClick={onBackdropClick}
    >
      <div className="modal__dialog modal__dialog--upload">
        <div className="modal__header">
          <div className="modal__header-text">
            <h2 id="uploadBomModalTitle" className="modal__title">
              Upload BOM
            </h2>
            <p className="modal__subtitle">CSV, XLSX, XLS, or TXT</p>
          </div>
        </div>

        <div className="modal__body" aria-live="polite">
          {phase === 'success' && parseResult ? (
            <SuccessView result={parseResult} filename={file?.name ?? parseResult.source_filename} />
          ) : phase === 'error' ? (
            <BomUploadDropzone
              variant="modal"
              onFileSelected={(f) => void handleFileSelected(f)}
              validationError={error}
            />
          ) : (
            <BomUploadDropzone
              variant="modal"
              onFileSelected={(f) => void handleFileSelected(f)}
              parsing={phase === 'parsing'}
              selectedFile={file}
              onClearFile={phase === 'idle' ? handleClearFile : undefined}
              validationError={validationError}
              disabled={phase === 'parsing'}
            />
          )}
        </div>

        <div className="modal__footer">
          {phase === 'success' ? (
            <>
              <button type="button" className="btn btn--ghost" onClick={reset}>
                Upload another
              </button>
              <button type="button" className="btn btn--primary" onClick={handleClose}>
                Cancel
              </button>
            </>
          ) : phase === 'error' ? (
            <>
              <button type="button" className="btn btn--ghost" onClick={reset}>
                Try again
              </button>
              <button type="button" className="btn btn--primary" onClick={handleClose}>
                Cancel
              </button>
            </>
          ) : (
            <button type="button" className="btn btn--primary" disabled={blockDismiss} onClick={handleClose}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function SuccessView({ result, filename }: { result: ParseResult; filename: string }) {
  const mappings = Object.entries(result.column_mapping)

  return (
    <div>
      <div className="upload-success-hero">
        <div className="upload-success-hero__icon">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="text-[15px] font-semibold text-ink">{filename}</p>
        <p className="mt-1 text-[13px] text-ink-subtle">Columns detected successfully</p>
      </div>

      <ParseSummaryCards result={result} />

      {mappings.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">Detected mapping</p>
          <div className="upload-column-chips">
            {mappings.map(([canonical, source]) => (
              <span key={canonical} className="upload-column-chip">
                <strong>{canonical}</strong>
                <span>← {source}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
