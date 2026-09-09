'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle, Loader2, X, XCircle } from 'lucide-react'
import { AppModal, ModalNotice } from '@/components/AppModal'
import { appPrimaryBtn } from '@/components/app/chrome'
import BomColumnMappingStep from '@/components/BomColumnMappingStep'
import { analyzeFile, parseFile, saveBom } from '@/lib/api'
import {
  buildColumnMappings,
  extractHeaders,
  mergeColumnMappingRecord,
  mappingValidationError,
  previewRows,
} from '@/lib/columnMapping'
import { ACCEPTED, formatFileSize } from '@/components/BomUploadDropzone'
import type { BomSummary, ColumnMapping, ParseResult } from '@/lib/types'

const ACCEPT_MIME =
  '.csv,.xlsx,.xls,.txt,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'

const PREVIEW_DEBOUNCE_MS = 400

type QueueItem = {
  key: string
  file: File
  status: 'ready' | 'mapping' | 'processing' | 'done' | 'failed'
  error?: string
  saved?: BomSummary
}

type UploadStep = 'select' | 'mapping' | 'complete'

type BomBulkUploadModalProps = {
  open: boolean
  onClose: () => void
  onComplete: (saved: BomSummary[]) => void
}

function queueKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`
}

function validateFile(file: File): string | null {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!ACCEPTED.includes(ext)) {
    return `Unsupported type (${ext}). Use ${ACCEPTED.join(', ')}.`
  }
  return null
}

export default function BomBulkUploadModal({
  open,
  onClose,
  onComplete,
}: BomBulkUploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const savedRef = useRef<BomSummary[]>([])

  const [step, setStep] = useState<UploadStep>('select')
  const [items, setItems] = useState<QueueItem[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [pickError, setPickError] = useState<string | null>(null)
  const [fileIndex, setFileIndex] = useState(0)
  const [parsing, setParsing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [autoParse, setAutoParse] = useState<ParseResult | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<string[][]>([])

  const reset = useCallback(() => {
    setStep('select')
    setItems([])
    setPickError(null)
    setFileIndex(0)
    setDragOver(false)
    setParsing(false)
    setConfirming(false)
    setPreviewLoading(false)
    setAutoParse(null)
    setParseResult(null)
    setMapping([])
    setHeaders([])
    setPreview([])
    savedRef.current = []
  }, [])

  const handleClose = () => {
    if (parsing || confirming) return
    reset()
    onClose()
  }

  const addFiles = (files: FileList | File[]) => {
    setPickError(null)
    const incoming = Array.from(files)
    if (incoming.length === 0) return

    const next: QueueItem[] = []
    const seen = new Set(items.map((item) => item.key))

    for (const file of incoming) {
      const key = queueKey(file)
      if (seen.has(key)) continue
      const validation = validateFile(file)
      if (validation) {
        setPickError(validation)
        continue
      }
      seen.add(key)
      next.push({ key, file, status: 'ready' })
    }

    if (next.length > 0) {
      setItems((prev) => [...prev, ...next])
    }
  }

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key))
  }

  const markItem = (index: number, patch: Partial<QueueItem>) => {
    setItems((prev) => prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)))
  }

  const beginMappingForFile = useCallback(
    async (index: number, queue: QueueItem[]) => {
      if (index >= queue.length) {
        setStep('complete')
        onComplete(savedRef.current)
        return
      }

      const item = queue[index]
      setFileIndex(index)
      setPickError(null)
      setParsing(true)
      markItem(index, { status: 'mapping', error: undefined })

      try {
        const result = await parseFile(item.file)
        setAutoParse(result)
        setParseResult(result)
        setMapping(buildColumnMappings(result))
        setHeaders(extractHeaders(result))
        setPreview(previewRows(result))
        setStep('mapping')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to parse file'
        markItem(index, { status: 'failed', error: message })
        await beginMappingForFile(index + 1, queue)
      } finally {
        setParsing(false)
      }
    },
    [onComplete],
  )

  const handleContinue = () => {
    if (items.length === 0) return
    savedRef.current = []
    void beginMappingForFile(0, items)
  }

  const handleBackFromMapping = () => {
    setStep('select')
    setAutoParse(null)
    setParseResult(null)
    setMapping([])
    setHeaders([])
    setPreview([])
    setFileIndex(0)
    setItems((prev) => prev.map((item) => ({ ...item, status: 'ready', error: undefined, saved: undefined })))
    savedRef.current = []
  }

  const handleConfirmMapping = async () => {
    const item = items[fileIndex]
    if (!item || !autoParse || !parseResult) return

    const validationError = mappingValidationError(mapping)
    if (validationError) {
      setPickError(validationError)
      return
    }

    const columnMapping = mergeColumnMappingRecord(autoParse.column_mapping, mapping)
    setConfirming(true)
    setPickError(null)
    markItem(fileIndex, { status: 'processing', error: undefined })

    try {
      const analyzeResult = await analyzeFile(item.file, { columnMapping })
      const bom = await saveBom(item.file, analyzeResult)
      savedRef.current.push(bom)
      markItem(fileIndex, { status: 'done', saved: bom })
      await beginMappingForFile(fileIndex + 1, items)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed'
      markItem(fileIndex, { status: 'failed', error: message })
      await beginMappingForFile(fileIndex + 1, items)
    } finally {
      setConfirming(false)
    }
  }

  const currentFile = items[fileIndex]?.file ?? null
  const isLastFile = fileIndex >= items.length - 1

  useEffect(() => {
    if (step !== 'mapping' || !autoParse || !currentFile) return

    const validationError = mappingValidationError(mapping)
    if (validationError) return

    const columnMapping = mergeColumnMappingRecord(autoParse.column_mapping, mapping)
    const timer = window.setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const updated = await parseFile(currentFile, { columnMapping })
        setParseResult(updated)
        setHeaders(extractHeaders(updated))
        setPreview(previewRows(updated))
      } catch {
        // Keep the last good preview if re-parse fails.
      } finally {
        setPreviewLoading(false)
      }
    }, PREVIEW_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [step, autoParse, currentFile, mapping])

  const doneCount = items.filter((item) => item.status === 'done').length
  const failedCount = items.filter((item) => item.status === 'failed').length

  const modalTitle =
    step === 'select'
      ? 'Upload'
      : step === 'mapping'
        ? items.length > 1
          ? `Columns · ${fileIndex + 1} of ${items.length}`
          : 'Columns'
        : failedCount > 0
          ? `${doneCount} uploaded · ${failedCount} failed`
          : doneCount === 1
            ? 'Uploaded'
            : `${doneCount} uploaded`

  const footer =
    step === 'select' ? (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void handleContinue()}
          disabled={items.length === 0 || parsing}
          className={appPrimaryBtn}
        >
          {parsing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Reading…
            </>
          ) : (
            'Continue'
          )}
        </button>
      </div>
    ) : step === 'complete' ? (
      <div className="flex justify-end">
        <button type="button" onClick={handleClose} className={appPrimaryBtn}>
          Done
        </button>
      </div>
    ) : undefined

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      title={modalTitle}
      maxWidth={step === 'mapping' ? 'lg' : 'md'}
      closeDisabled={parsing || confirming}
      footer={footer}
    >
      {pickError && (step === 'select' || step === 'mapping') ? (
        <ModalNotice tone="warn">{pickError}</ModalNotice>
      ) : null}

      {step === 'select' ? (
        <>
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                inputRef.current?.click()
              }
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              addFiles(e.dataTransfer.files)
            }}
            className={`flex min-h-36 flex-col items-center justify-center rounded-[8px] bg-mk-raised px-6 py-8 text-center transition-colors ${
              dragOver ? 'bg-mk-accent/5 ring-1 ring-inset ring-mk-accent' : ''
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT_MIME}
              className="sr-only"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files)
                e.target.value = ''
              }}
            />
            <p className="text-[14px] text-mk-ink">Drop files or click to browse</p>
            <p className="mt-1 text-[12px] text-mk-ink-subtle">CSV, Excel</p>
          </div>

          {items.length > 0 ? (
            <ul className="mt-3 max-h-52 divide-y divide-mk-line overflow-y-auto">
              {items.map((item) => (
                <li key={item.key} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-mk-ink">{item.file.name}</p>
                    <p className="text-[11px] text-mk-ink-subtle">{formatFileSize(item.file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="rounded-[8px] p-1 text-mk-ink-subtle transition-colors hover:bg-mk-raised hover:text-mk-ink"
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}

      {step === 'mapping' && parseResult ? (
        <BomColumnMappingStep
          file={currentFile}
          fileIndex={fileIndex}
          fileCount={items.length}
          parseResult={parseResult}
          mapping={mapping}
          headers={headers}
          preview={preview}
          previewLoading={previewLoading}
          onMappingChange={setMapping}
          onBack={handleBackFromMapping}
          onConfirm={() => void handleConfirmMapping()}
          confirming={confirming}
          confirmLabel={isLastFile ? 'Analyze' : 'Analyze next'}
        />
      ) : null}

      {step === 'complete' ? (
        <ul className="divide-y divide-mk-line">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-3 py-2.5">
              <StatusIcon status={item.status === 'failed' ? 'failed' : 'done'} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-mk-ink">{item.saved?.name ?? item.file.name}</p>
                {item.status === 'done' && item.saved ? (
                  <p className="text-[12px] text-mk-ink-subtle">
                    {item.saved.lineCount.toLocaleString()} parts
                    {item.saved.atRiskCount > 0 ? ` · ${item.saved.atRiskCount} at risk` : ''}
                  </p>
                ) : null}
                {item.status === 'failed' && item.error ? (
                  <p className="text-[12px] text-mk-red">{item.error}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </AppModal>
  )
}

function StatusIcon({ status }: { status: QueueItem['status'] | 'done' | 'failed' }) {
  if (status === 'done') {
    return <CheckCircle className="h-4 w-4 shrink-0 text-mk-green" />
  }
  if (status === 'failed') {
    return <XCircle className="h-4 w-4 shrink-0 text-mk-red" />
  }
  return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-mk-accent" />
}
