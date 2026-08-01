'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  FileText,
  Loader2,
  UploadCloud,
  X,
  XCircle,
} from 'lucide-react'
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

  const beginMappingForFile = useCallback(async (index: number, queue: QueueItem[]) => {
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
  }, [onComplete])

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
      const updatedParse = await parseFile(item.file, { columnMapping })
      const bom = await saveBom(item.file, analyzeResult, { parse: updatedParse })
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

  if (!open) return null

  const doneCount = items.filter((item) => item.status === 'done').length
  const failedCount = items.filter((item) => item.status === 'failed').length

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-[#0f1b2d]/60 px-4 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target !== e.currentTarget) return
        handleClose()
      }}
    >
      <div
        className={`flex max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${
          step === 'mapping' ? 'w-full max-w-2xl' : 'w-full max-w-lg'
        }`}
      >
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span
                className="h-3.5 w-3.5 shrink-0 bg-[#0062ff]"
                style={{ clipPath: 'polygon(24% 0,100% 0,100% 100%,0% 100%)' }}
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0062ff]">New BOM</span>
            </div>
            {step === 'select' && (
              <>
                <h2 className="text-lg font-bold text-slate-900">Upload BOMs</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Drop one or more CSV or Excel files to start monitoring risk.
                </p>
              </>
            )}
            {step === 'mapping' && (
              <>
                <h2 className="text-lg font-bold text-slate-900">Confirm columns</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Map each file before analysis ({fileIndex + 1} of {items.length}).
                </p>
              </>
            )}
            {step === 'complete' && (
              <>
                <h2 className="text-lg font-bold text-slate-900">Upload complete</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {doneCount} saved{failedCount > 0 ? ` · ${failedCount} failed` : ''}.
                </p>
              </>
            )}
          </div>
          {!parsing && !confirming && (
            <button
              type="button"
              onClick={handleClose}
              className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {pickError && (step === 'select' || step === 'mapping') && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{pickError}</span>
            </div>
          )}

          {step === 'select' && (
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
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-10 text-center transition-all ${
                  dragOver
                    ? 'border-[#0062ff] bg-[#eef4ff]'
                    : 'border-slate-200 bg-slate-50/50 hover:border-[#0062ff] hover:bg-[#f9fbff]'
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
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff]">
                  <UploadCloud className="h-6 w-6 text-[#0062ff]" />
                </div>
                <p className="text-[15px] font-medium text-slate-900">Drop your BOMs here</p>
                <p className="mt-1 text-sm text-slate-500">or click to browse · one or many files</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {ACCEPTED.map((ext) => (
                    <span
                      key={ext}
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs text-slate-500"
                    >
                      {ext}
                    </span>
                  ))}
                </div>
              </div>

              {items.length > 0 && (
                <div className="mt-5">
                  <ul className="max-h-52 space-y-2 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <li
                        key={item.key}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">{item.file.name}</p>
                          <p className="text-xs text-slate-400">{formatFileSize(item.file.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#0062ff]" />
                <p className="text-xs leading-relaxed text-slate-600">
                  Each file gets a column-mapping step before analysis. Needs at least an{' '}
                  <strong>MPN</strong> or <strong>Part Number</strong> column mapped.
                </p>
              </div>
            </>
          )}

          {step === 'mapping' && parseResult && (
            <>
              {items.length > 1 && (
                <ul className="mb-4 space-y-1">
                  {items.map((item, index) => (
                    <li
                      key={item.key}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                        index === fileIndex
                          ? 'bg-blue-50 text-[#0062ff]'
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
              )}
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
          )}

          {step === 'complete' && (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.key}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                    item.status === 'failed'
                      ? 'border-red-200 bg-red-50/50'
                      : 'border-emerald-200 bg-emerald-50/40'
                  }`}
                >
                  <StatusIcon status={item.status === 'failed' ? 'failed' : 'done'} active={false} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {item.saved?.name ?? item.file.name}
                    </p>
                    {item.status === 'done' && item.saved && (
                      <p className="text-xs text-emerald-700">
                        {item.saved.lineCount.toLocaleString()} lines ·{' '}
                        {item.saved.atRiskCount > 0
                          ? `${item.saved.atRiskCount} at-risk`
                          : 'no at-risk parts'}
                      </p>
                    )}
                    {item.status === 'failed' && item.error && (
                      <p className="text-xs text-red-600">{item.error}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-100 px-6 py-4">
          {step === 'select' && (
            <button
              type="button"
              onClick={() => void handleContinue()}
              disabled={items.length === 0 || parsing}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
                items.length > 0 && !parsing
                  ? 'bg-[#0062ff] text-white shadow-sm hover:bg-blue-700'
                  : 'cursor-not-allowed bg-slate-100 text-slate-400'
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
          )}
          {step === 'complete' && (
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-xl bg-[#0062ff] py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
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
  return <div className={`${size} shrink-0 rounded-full border-2 border-slate-200`} />
}
