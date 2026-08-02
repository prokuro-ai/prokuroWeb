'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, CheckCircle, FileText, Loader2, XCircle } from 'lucide-react'
import { AppModal, ModalNotice } from '@/components/AppModal'
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

const MAX_FILES = 20
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
  existingBomCount?: number
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
  existingBomCount = 0,
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

    const slotsLeft = MAX_FILES - existingBomCount - items.length
    if (slotsLeft <= 0) {
      setPickError(`Your plan supports up to ${MAX_FILES} BOMs. Remove files or upgrade to add more.`)
      return
    }

    const toAdd = incoming.slice(0, slotsLeft)
    if (incoming.length > slotsLeft) {
      setPickError(`Only ${slotsLeft} more BOM${slotsLeft === 1 ? '' : 's'} can be added on your current plan.`)
    }

    const next: QueueItem[] = []
    const seen = new Set(items.map((item) => item.key))

    for (const file of toAdd) {
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

  const modalCopy =
    step === 'select'
      ? {
          eyebrow: 'New BOM',
          title: 'Upload BOMs',
          subtitle: 'Drop one or more CSV or Excel files to start monitoring risk.',
        }
      : step === 'mapping'
        ? {
            eyebrow: 'Column mapping',
            title: 'Confirm columns',
            subtitle: `Map each file before analysis (${fileIndex + 1} of ${items.length}).`,
          }
        : {
            eyebrow: 'Upload complete',
            title: 'All files processed',
            subtitle: `${doneCount} saved${failedCount > 0 ? ` · ${failedCount} failed` : ''}.`,
          }

  const footer =
    step === 'select' ? (
      <button
        type="button"
        onClick={() => void handleContinue()}
        disabled={items.length === 0 || parsing}
        className={`flex w-full items-center justify-center gap-2 py-2.5 text-[13px] font-semibold transition-colors ${
          items.length > 0 && !parsing
            ? 'bg-[#0062ff] text-white hover:bg-blue-700'
            : 'cursor-not-allowed bg-slate-200 text-slate-400'
        }`}
      >
        {parsing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Detecting columns…
          </>
        ) : (
          <>
            Continue <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    ) : step === 'complete' ? (
      <button
        type="button"
        onClick={handleClose}
        className="w-full bg-[#0062ff] py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-blue-700"
      >
        Done
      </button>
    ) : undefined

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      eyebrow={modalCopy.eyebrow}
      title={modalCopy.title}
      subtitle={modalCopy.subtitle}
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
            className={`flex flex-col items-center justify-center border-2 border-dashed px-8 py-10 text-center transition-colors ${
              dragOver
                ? 'border-[#0062ff] bg-[#0062ff]/5'
                : 'border-slate-200 bg-[#f4f6f9] hover:border-[#0062ff]'
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
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-slate-400">Drop files</p>
            <p className="mt-2 text-[15px] font-medium text-slate-900">Drop your BOMs here</p>
            <p className="mt-1 text-[13px] text-slate-500">or click to browse · one or many files</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {ACCEPTED.map((ext) => (
                <span
                  key={ext}
                  className="border border-slate-200 bg-white px-2.5 py-1 font-mono text-[11px] text-slate-500"
                >
                  {ext}
                </span>
              ))}
            </div>
          </div>

          {items.length > 0 ? (
            <ul className="mt-5 max-h-52 space-y-2 overflow-y-auto">
              {items.map((item) => (
                <li
                  key={item.key}
                  className="flex items-center gap-3 border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-slate-200 bg-[#f4f6f9] text-slate-500">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-slate-900">{item.file.name}</p>
                    <p className="font-mono text-[11px] text-slate-400">{formatFileSize(item.file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="shrink-0 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-slate-400 transition-colors hover:text-slate-700"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <ModalNotice tone="info">
            Each file gets a column-mapping step before analysis. Needs at least an{' '}
            <strong>MPN</strong> or <strong>Part Number</strong> column mapped.
          </ModalNotice>
        </>
      ) : null}

      {step === 'mapping' && parseResult ? (
        <>
          {items.length > 1 ? (
            <ul className="mb-4 space-y-1 border border-slate-200 bg-[#f4f6f9] p-2">
              {items.map((item, index) => (
                <li
                  key={item.key}
                  className={`flex items-center gap-2 px-2 py-1.5 font-mono text-[11px] ${
                    index === fileIndex
                      ? 'bg-white text-[#0062ff]'
                      : item.status === 'done'
                        ? 'text-emerald-700'
                        : item.status === 'failed'
                          ? 'text-red-600'
                          : 'text-slate-400'
                  }`}
                >
                  <StatusIcon status={item.status} active={index === fileIndex} compact />
                  <span className="truncate">{item.file.name}</span>
                </li>
              ))}
            </ul>
          ) : null}
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
            confirmLabel={isLastFile ? 'Confirm & finish →' : 'Confirm & next file →'}
          />
        </>
      ) : null}

      {step === 'complete' ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.key}
              className={`flex items-center gap-3 border px-4 py-3 ${
                item.status === 'failed' ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50/60'
              }`}
            >
              <StatusIcon status={item.status === 'failed' ? 'failed' : 'done'} active={false} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-slate-900">
                  {item.saved?.name ?? item.file.name}
                </p>
                {item.status === 'done' && item.saved ? (
                  <p className="font-mono text-[11px] text-emerald-700">
                    {item.saved.lineCount.toLocaleString()} lines ·{' '}
                    {item.saved.atRiskCount > 0
                      ? `${item.saved.atRiskCount} at-risk`
                      : 'no at-risk parts'}
                  </p>
                ) : null}
                {item.status === 'failed' && item.error ? (
                  <p className="text-[12px] text-red-600">{item.error}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </AppModal>
  )
}

function StatusIcon({
  status,
  active,
  compact = false,
}: {
  status: QueueItem['status'] | 'done' | 'failed'
  active: boolean
  compact?: boolean
}) {
  const size = compact ? 'h-3.5 w-3.5' : 'h-5 w-5'

  if (status === 'done') {
    return <CheckCircle className={`${size} shrink-0 text-emerald-500`} />
  }
  if (status === 'failed') {
    return <XCircle className={`${size} shrink-0 text-red-500`} />
  }
  if (status === 'processing' || status === 'mapping' || active) {
    return <Loader2 className={`${size} shrink-0 animate-spin text-[#0062ff]`} />
  }
  return <div className={`${size} shrink-0 border-2 border-slate-200`} />
}
