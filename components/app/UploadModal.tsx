'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle, X } from 'lucide-react'
import BomUploadDropzone from '@/components/BomUploadDropzone'
import { usePortfolio } from '@/components/app/PortfolioContext'
import { analyzeFile, parseFile, saveBom } from '@/lib/api'
import { buildColumnMappings, extractHeaders, hasMpnMapping, previewRows } from '@/lib/columnMapping'
import { alertError, btnPrimary, modalOverlay } from '@/lib/ui/classes'
import type { ColumnMapping, ParseResult } from '@/lib/types'

const PROCESSING_STEPS = [
  { label: 'Column mapping applied', threshold: 10 },
  { label: 'MPN normalization', threshold: 30 },
  { label: 'DigiKey enrichment', threshold: 55 },
  { label: 'Lifecycle & stock lookup', threshold: 75 },
  { label: 'Risk scoring', threshold: 90 },
]

type UploadStep = 'upload' | 'mapping' | 'processing'

interface UploadModalProps {
  open: boolean
  onClose: () => void
}

export default function UploadModal({ open, onClose }: UploadModalProps) {
  const router = useRouter()
  const { refresh } = usePortfolio()
  const [step, setStep] = useState<UploadStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<string[][]>([])
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current)
        progressRef.current = null
      }
    }
  }, [])

  if (!open) return null

  const mappingReady = parseResult != null && hasMpnMapping(mapping) && parseResult.mapping_confidence >= 0.3

  const reset = () => {
    stopProgress()
    setStep('upload')
    setFile(null)
    setParseResult(null)
    setMapping([])
    setHeaders([])
    setPreview([])
    setProgress(0)
    setError(null)
    setParsing(false)
    setConfirming(false)
  }

  const handleClose = () => {
    if (step === 'processing') return
    reset()
    onClose()
  }

  const stopProgress = () => {
    if (progressRef.current) {
      clearInterval(progressRef.current)
      progressRef.current = null
    }
  }

  const startProgress = () => {
    let value = 0
    progressRef.current = setInterval(() => {
      value += Math.random() * 8 + 2
      if (value >= 92) value = 92
      setProgress(value)
    }, 280)
  }

  const handleFileSelected = async (selected: File) => {
    setFile(selected)
    setError(null)
    setParsing(true)
    try {
      const result = await parseFile(selected)
      setParseResult(result)
      setMapping(buildColumnMappings(result))
      setHeaders(extractHeaders(result))
      setPreview(previewRows(result))
      setStep('mapping')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
      setFile(null)
    } finally {
      setParsing(false)
    }
  }

  const handleConfirm = async () => {
    if (!file || !parseResult || confirming) return
    if (!hasMpnMapping(mapping)) {
      setError('Map the MPN / Part Number column before analyzing.')
      return
    }
    if (parseResult.mapping_confidence < 0.3) {
      setError('Column mapping confidence is too low. Adjust mappings or use a clearer header row.')
      return
    }

    setConfirming(true)
    setStep('processing')
    setProgress(0)
    setError(null)
    startProgress()
    try {
      const analyzeResult = await analyzeFile(file)
      stopProgress()
      setProgress(100)
      const saved = await saveBom(file, analyzeResult)
      await refresh()
      const bomId = saved.id ?? analyzeResult.upload_id
      reset()
      onClose()
      router.push(`/bom/${bomId}`)
    } catch (err) {
      stopProgress()
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setStep('mapping')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div
      className={modalOverlay}
      onClick={(event) => {
        if (event.target === event.currentTarget && step !== 'processing') handleClose()
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between px-6 pb-4 pt-6">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span
                className="h-3.5 w-3.5 shrink-0 bg-[#0062ff]"
                style={{ clipPath: 'polygon(24% 0,100% 0,100% 100%,0% 100%)' }}
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0062ff]">New BOM</span>
            </div>
            {step === 'upload' && (
              <>
                <h2 className="text-lg font-bold text-slate-900">Upload your BOM</h2>
                <p className="mt-0.5 text-sm text-slate-500">Drop a CSV or Excel file to start monitoring risk.</p>
              </>
            )}
            {step === 'mapping' && (
              <>
                <h2 className="text-lg font-bold text-slate-900">Map your columns</h2>
                <p className="mt-0.5 text-sm text-slate-500">Confirm how your columns map to Prokuro fields.</p>
              </>
            )}
            {step === 'processing' && (
              <>
                <h2 className="text-lg font-bold text-slate-900">Analyzing…</h2>
                <p className="mt-0.5 text-sm text-slate-500">Resolving MPNs against DigiKey and scoring risk.</p>
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

        {error && <div className={`mx-6 mb-3 ${alertError}`}>{error}</div>}

        {step === 'mapping' && parseResult && parseResult.warnings.length > 0 && (
          <div className="mx-6 mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-medium">Parser warnings</p>
            <ul className="mt-1 list-inside list-disc text-xs leading-relaxed">
              {parseResult.warnings.map((warning, index) => (
                <li key={`${warning.code}-${warning.row_index}-${index}`}>
                  {warning.code.replaceAll('_', ' ').toLowerCase()}
                  {warning.column ? ` (${warning.column})` : ''}
                  {warning.row_index >= 0 ? ` — row ${warning.row_index + 1}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === 'upload' && (
          <div className="px-6 pb-6">
            <BomUploadDropzone
              showInfoPanel={false}
              parsing={parsing}
              selectedFile={file}
              onFileSelected={(selected) => void handleFileSelected(selected)}
              onClearFile={() => setFile(null)}
            />
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#0062ff]" />
              <p className="text-xs leading-relaxed text-slate-600">
                Needs at least an <strong>MPN</strong> or <strong>Part Number</strong> column. Map other columns in the next step.
              </p>
            </div>
            <button
              type="button"
              onClick={() => file && void handleFileSelected(file)}
              disabled={!file || parsing}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
                file && !parsing
                  ? 'bg-[#0062ff] text-white shadow-sm hover:bg-blue-700'
                  : 'cursor-not-allowed bg-slate-100 text-slate-400'
              }`}
            >
              {parsing ? 'Reading file…' : (
                <>
                  Continue <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}

        {step === 'mapping' && parseResult && (
          <div className="px-6 pb-0">
            {preview.length > 0 && (
              <div className="mb-4 max-h-36 overflow-x-auto overflow-y-auto rounded-lg border border-slate-200">
                <table className="w-full text-[11px]">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      {headers.map((header) => (
                        <th
                          key={header}
                          className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-2 text-left font-medium text-slate-500 last:border-r-0"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="whitespace-nowrap border-b border-r border-slate-100 px-3 py-1.5 text-slate-600 last:border-r-0"
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
            <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
              {mapping.map((col, index) => (
                <div
                  key={col.canonical}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 ${
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
                      <code className="font-mono">{col.canonical}</code>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-slate-400">from</span>
                    <select
                      value={col.detectedFrom ?? ''}
                      onChange={(event) =>
                        setMapping((current) =>
                          current.map((item, i) =>
                            i === index
                              ? { ...item, detectedFrom: event.target.value || null, confirmed: true }
                              : item,
                          ),
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 focus:border-[#0062ff] focus:outline-none"
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
            <div className="mt-2 flex items-center justify-between border-t border-slate-100 py-4">
              <button
                type="button"
                onClick={() => {
                  setStep('upload')
                  setFile(null)
                  setParseResult(null)
                }}
                className="text-sm text-slate-400 transition-colors hover:text-slate-600"
              >
                ← Back
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{Math.round(parseResult.mapping_confidence * 100)}% confidence</span>
                <button
                  type="button"
                  onClick={() => void handleConfirm()}
                  disabled={!mappingReady || confirming}
                  title={
                    !hasMpnMapping(mapping)
                      ? 'Map the MPN column first'
                      : parseResult.mapping_confidence < 0.3
                        ? 'Mapping confidence too low'
                        : undefined
                  }
                  className={btnPrimary}
                >
                  {confirming ? 'Analyzing…' : 'Confirm & analyze →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="px-6 pb-6">
            <div className="mb-4 flex items-center gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="relative h-14 w-14 shrink-0">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" stroke="#e2e8f0" strokeWidth="5" fill="none" />
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    stroke="#0062ff"
                    strokeWidth="5"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 22}
                    strokeDashoffset={2 * Math.PI * 22 * (1 - progress / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#0062ff]">{Math.round(progress)}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{file?.name ?? 'Analyzing…'}</p>
                <p className="mt-0.5 text-xs text-slate-500">Checking lifecycle, stock, and tariff exposure…</p>
              </div>
            </div>
            <div className="space-y-2">
              {PROCESSING_STEPS.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${
                    progress > item.threshold ? 'border-emerald-100 bg-emerald-50' : 'border-slate-100 bg-white'
                  }`}
                >
                  {progress > item.threshold ? (
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <div className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-200" />
                  )}
                  <span className={`text-sm font-medium ${progress > item.threshold ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
