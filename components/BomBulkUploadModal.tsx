'use client'

import { useCallback, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Files,
  Loader2,
  Plus,
  UploadCloud,
  X,
  XCircle,
} from 'lucide-react'
import { analyzeFile, parseFile, saveBom } from '@/lib/api'
import { buildColumnMappings, hasMpnMapping } from '@/lib/columnMapping'
import { ACCEPTED, formatFileSize } from '@/components/BomUploadDropzone'
import type { BomSummary } from '@/lib/types'

const ACCEPT_MIME =
  '.csv,.xlsx,.xls,.txt,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'

const MAX_FILES = 20

type QueueItem = {
  key: string
  file: File
  status: 'ready' | 'processing' | 'done' | 'failed'
  error?: string
  saved?: BomSummary
}

type BulkStep = 'select' | 'processing' | 'complete'

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
  const [step, setStep] = useState<BulkStep>('select')
  const [items, setItems] = useState<QueueItem[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [pickError, setPickError] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const reset = useCallback(() => {
    setStep('select')
    setItems([])
    setPickError(null)
    setActiveIndex(0)
    setDragOver(false)
  }, [])

  const handleClose = () => {
    if (step === 'processing') return
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

  const processAll = async () => {
    if (items.length === 0) return
    setStep('processing')
    setActiveIndex(0)
    const saved: BomSummary[] = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      setActiveIndex(i)
      setItems((prev) =>
        prev.map((entry) => (entry.key === item.key ? { ...entry, status: 'processing', error: undefined } : entry)),
      )

      try {
        const parseResult = await parseFile(item.file)
        const mapping = buildColumnMappings(parseResult)
        if (!hasMpnMapping(mapping)) {
          throw new Error('No MPN / Part Number column detected')
        }
        if (parseResult.mapping_confidence < 0.3) {
          throw new Error('Could not auto-detect columns — upload this file individually to map columns')
        }

        const analyzeResult = await analyzeFile(item.file)
        const bom = await saveBom(item.file, analyzeResult, { parse: parseResult })
        saved.push(bom)
        setItems((prev) =>
          prev.map((entry) => (entry.key === item.key ? { ...entry, status: 'done', saved: bom } : entry)),
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setItems((prev) =>
          prev.map((entry) => (entry.key === item.key ? { ...entry, status: 'failed', error: message } : entry)),
        )
      }
    }

    onComplete(saved)
    setStep('complete')
  }

  if (!open) return null

  const readyCount = items.filter((item) => item.status === 'ready').length
  const doneCount = items.filter((item) => item.status === 'done').length
  const failedCount = items.filter((item) => item.status === 'failed').length
  const progressPct = step === 'processing' && items.length > 0 ? Math.round(((activeIndex + 1) / items.length) * 100) : 100

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-[#0f1b2d]/60 px-4 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target !== e.currentTarget) return
        handleClose()
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span
                className="h-3.5 w-3.5 shrink-0 bg-[#0062ff]"
                style={{ clipPath: 'polygon(24% 0,100% 0,100% 100%,0% 100%)' }}
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0062ff]">Bulk upload</span>
            </div>
            {step === 'select' && (
              <>
                <h2 className="text-lg font-bold text-slate-900">Upload multiple BOMs</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Drop your whole portfolio at once. We&apos;ll auto-detect columns and analyze each file.
                </p>
              </>
            )}
            {step === 'processing' && (
              <>
                <h2 className="text-lg font-bold text-slate-900">Uploading {items.length} BOMs…</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Processing file {Math.min(activeIndex + 1, items.length)} of {items.length}
                </p>
              </>
            )}
            {step === 'complete' && (
              <>
                <h2 className="text-lg font-bold text-slate-900">Upload complete</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {doneCount} uploaded successfully{failedCount > 0 ? ` · ${failedCount} failed` : ''}.
                </p>
              </>
            )}
          </div>
          {step !== 'processing' && (
            <button
              type="button"
              onClick={handleClose}
              className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {pickError && step === 'select' && (
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
                  <Files className="h-6 w-6 text-[#0062ff]" />
                </div>
                <p className="text-[15px] font-medium text-slate-900">Drop multiple BOM files here</p>
                <p className="mt-1 text-sm text-slate-500">or click to browse · CSV, Excel, or TXT</p>
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
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {items.length} file{items.length === 1 ? '' : 's'} queued
                    </span>
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="flex items-center gap-1 text-xs font-semibold text-[#0062ff] hover:text-blue-700"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add more
                    </button>
                  </div>
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
                  Each file needs an <strong>MPN</strong> or <strong>Part Number</strong> column. Unusual formats can
                  be uploaded one at a time to confirm column mapping.
                </p>
              </div>
            </>
          )}

          {(step === 'processing' || step === 'complete') && (
            <div className="space-y-4">
              {step === 'processing' && (
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Overall progress</span>
                    <span>{progressPct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#0062ff] transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}

              <ul className="space-y-2">
                {items.map((item, index) => {
                  const isActive = step === 'processing' && index === activeIndex && item.status === 'processing'
                  return (
                    <li
                      key={item.key}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                        item.status === 'failed'
                          ? 'border-red-200 bg-red-50/50'
                          : item.status === 'done'
                            ? 'border-emerald-200 bg-emerald-50/40'
                            : isActive
                              ? 'border-[#0062ff]/30 bg-blue-50/50'
                              : 'border-slate-200 bg-white'
                      }`}
                    >
                      <StatusIcon status={item.status} active={isActive} />
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
                        {item.status === 'processing' && (
                          <p className="text-xs text-[#0062ff]">Analyzing and saving…</p>
                        )}
                        {item.status === 'ready' && step === 'processing' && (
                          <p className="text-xs text-slate-400">Waiting…</p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-100 px-6 py-4">
          {step === 'select' && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                {existingBomCount > 0
                  ? `${existingBomCount} of ${MAX_FILES} BOM slots used`
                  : `Up to ${MAX_FILES} BOMs on Growth plan`}
              </p>
              <button
                type="button"
                onClick={() => void processAll()}
                disabled={items.length === 0}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                  items.length > 0
                    ? 'bg-[#0062ff] text-white shadow-sm hover:bg-blue-700'
                    : 'cursor-not-allowed bg-slate-100 text-slate-400'
                }`}
              >
                <UploadCloud className="h-4 w-4" />
                Analyze & upload {items.length > 0 ? `${items.length} BOM${items.length === 1 ? '' : 's'}` : ''}
              </button>
            </div>
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

function StatusIcon({ status, active }: { status: QueueItem['status']; active: boolean }) {
  if (status === 'done') {
    return <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
  }
  if (status === 'failed') {
    return <XCircle className="h-5 w-5 shrink-0 text-red-500" />
  }
  if (status === 'processing' || active) {
    return <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#0062ff]" />
  }
  return <div className="h-5 w-5 shrink-0 rounded-full border-2 border-slate-200" />
}
