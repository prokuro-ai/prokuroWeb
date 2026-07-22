'use client'

import { useLocation } from '@/lib/navigation'



import { useEffect, useRef, useState } from 'react'
import BomUploadDropzone from '@/components/BomUploadDropzone'
import AppLayout from '@/components/AppLayout'
import { useAuth } from '@/components/AuthProvider'
import { analyzeFile, parseFile, saveBom } from '@/lib/api'
import { buildColumnMappings, extractHeaders, previewRows } from '@/lib/columnMapping'
import type { ColumnMapping, ParseResult } from '@/lib/types'

type Step = 'upload' | 'mapping' | 'processing'

const PROCESSING_STEPS = [
  { label: 'Column mapping applied', threshold: 10 },
  { label: 'MPN normalization', threshold: 30 },
  { label: 'Nexar resolution', threshold: 55 },
  { label: 'Lifecycle & stock lookup', threshold: 75 },
  { label: 'Risk scoring & alternates', threshold: 90 },
]

export default function UploadPage() {
  const [, navigate] = useLocation()
  const { user, loading: authLoading } = useAuth()
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<string[][]>([])
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) navigate('/login')
  }, [authLoading, user, navigate])

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

  const startProgressAnimation = () => {
    let p = 0
    progressRef.current = setInterval(() => {
      p += Math.random() * 8 + 2
      if (p >= 92) p = 92
      setProgress(p)
    }, 280)
  }

  const stopProgressAnimation = () => {
    if (progressRef.current) {
      clearInterval(progressRef.current)
      progressRef.current = null
    }
  }

  const handleConfirmMapping = async () => {
    if (!file) return

    setStep('processing')
    setProgress(0)
    setError(null)
    startProgressAnimation()

    try {
      const analyzeResult = await analyzeFile(file)
      stopProgressAnimation()
      setProgress(100)
      const saved = await saveBom(file, analyzeResult, { parse: parseResult })
      const bomId = saved.id ?? analyzeResult.upload_id
      setTimeout(() => navigate(`/bom/${bomId}`), 500)
    } catch (err) {
      stopProgressAnimation()
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setStep('mapping')
    }
  }

  if (authLoading || !user) return null

  return (
    <AppLayout>
      <div className="flex h-14 flex-shrink-0 items-center border-b border-[#d6deea] bg-white px-6">
        <h1 className="text-[15px] font-semibold text-[#0f1b2d]">Upload BOM</h1>
      </div>

      <div className="flex flex-1 flex-col items-center overflow-y-auto p-6">
        <StepIndicator step={step} />

        {error && (
          <div className="mb-6 w-full max-w-lg rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        )}

        {step === 'upload' && (
          <div className="w-full max-w-lg">
            <BomUploadDropzone
              variant="full"
              showInfoPanel
              parsing={parsing}
              selectedFile={file}
              onFileSelected={(f) => void handleFileSelected(f)}
              onClearFile={() => setFile(null)}
            />
          </div>
        )}

        {step === 'mapping' && parseResult && (
          <MappingStep
            file={file}
            parseResult={parseResult}
            mapping={mapping}
            headers={headers}
            preview={preview}
            onMappingChange={setMapping}
            onBack={() => {
              setStep('upload')
              setFile(null)
              setParseResult(null)
            }}
            onConfirm={() => void handleConfirmMapping()}
          />
        )}

        {step === 'processing' && <ProcessingStep progress={progress} />}
      </div>
    </AppLayout>
  )
}

function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'upload', label: 'Upload file' },
    { key: 'mapping', label: 'Confirm columns' },
    { key: 'processing', label: 'Analyzing' },
  ]

  const currentIndex = steps.findIndex((s) => s.key === step)

  return (
    <div className="mb-8 flex items-center gap-0">
      {steps.map((s, i) => {
        const done = i < currentIndex
        const active = step === s.key
        return (
          <div key={s.key} className="flex items-center">
            {i > 0 && <div className={`h-px w-12 ${done ? 'bg-[#0062ff]' : 'bg-[#d6deea]'}`} />}
            <div className="flex items-center gap-1.5">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium ${
                  done ? 'bg-[#0062ff] text-white' : active ? 'border-2 border-[#0062ff] text-[#0062ff]' : 'border border-[#d6deea] text-[#98a3b6]'
                }`}
              >
                {done ? (
                  <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-[12px] font-medium ${active ? 'text-[#0062ff]' : done ? 'text-[#0f1b2d]' : 'text-[#98a3b6]'}`}>
                {s.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MappingStep({
  file,
  parseResult,
  mapping,
  headers,
  preview,
  onMappingChange,
  onBack,
  onConfirm,
}: {
  file: File | null
  parseResult: ParseResult
  mapping: ColumnMapping[]
  headers: string[]
  preview: string[][]
  onMappingChange: (mapping: ColumnMapping[]) => void
  onBack: () => void
  onConfirm: () => void
}) {
  return (
    <div className="w-full max-w-2xl">
      <div className="rounded-xl border border-[#d6deea] bg-white">
        <div className="border-b border-[#d6deea] px-6 py-4">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-[#0062ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-[14px] font-semibold text-[#0f1b2d]">Confirm column mapping</h2>
          </div>
          <p className="mt-1 text-[12px] text-[#7a8598]">
            {file?.name ?? parseResult.source_filename} — Prokuro detected the following mapping. Correct any mistakes before analyzing.
          </p>
        </div>

        <div className="p-6">
          {headers.length > 0 && (
            <div className="mb-5 overflow-x-auto rounded-lg border border-[#d6deea]">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-[#f4f6f9]">
                    {headers.map((h) => (
                      <th key={h} className="border-b border-r border-[#d6deea] px-3 py-2 text-left font-medium text-[#7a8598] last:border-r-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className={`border-r border-[#d6deea] px-3 py-2 text-[#4f5d73] last:border-r-0 ${rowIdx < preview.length - 1 ? 'border-b' : ''}`}>
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
              <div key={col.canonical} className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${col.confirmed ? 'border-[#d6deea] bg-white' : 'border-amber-300 bg-amber-50'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[#0f1b2d]">{col.label}</span>
                    {!col.confirmed && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">Needs confirmation</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#98a3b6]">
                    Canonical field: <code className="font-mono">{col.canonical}</code>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#7a8598]">mapped from</span>
                  <select
                    value={col.detectedFrom ?? ''}
                    onChange={(e) =>
                      onMappingChange(
                        mapping.map((c, i) => (i === idx ? { ...c, detectedFrom: e.target.value || null, confirmed: true } : c)),
                      )
                    }
                    className="rounded border border-[#d6deea] bg-white px-2 py-1 text-[12px] text-[#0f1b2d] focus:border-[#0062ff] focus:outline-none"
                  >
                    <option value="">— not mapped —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#d6deea] px-6 py-4">
          <button onClick={onBack} className="text-[13px] text-[#7a8598] hover:text-[#0f1b2d]">
            ← Back
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[#7a8598]">{Math.round(parseResult.mapping_confidence * 100)}% mapping confidence</span>
            <button onClick={onConfirm} className="rounded-lg bg-[#0062ff] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0050e6]">
              Confirm & analyze →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProcessingStep({ progress }: { progress: number }) {
  return (
    <div className="flex w-full max-w-md flex-col items-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#eef4ff]">
        <svg className="h-8 w-8 animate-spin text-[#0062ff]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
      <h2 className="text-[18px] font-semibold text-[#0f1b2d]" style={{ letterSpacing: '-0.2px' }}>
        Analyzing your BOM
      </h2>
      <p className="mt-2 text-[13px] text-[#7a8598]">Resolving MPNs against Nexar, checking lifecycle and stock at Digi-Key, Mouser, Arrow, and Avnet…</p>
      <div className="mt-8 w-full">
        <div className="mb-2 flex items-center justify-between text-[12px] text-[#7a8598]">
          <span>Processing</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e8edf4]">
          <div className="h-full rounded-full bg-[#0062ff] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="mt-6 w-full space-y-2">
        {PROCESSING_STEPS.map((s) => (
          <div key={s.label} className="flex items-center gap-2.5 rounded-lg border border-[#d6deea] bg-white px-4 py-2.5">
            {progress > s.threshold ? (
              <svg className="h-4 w-4 flex-shrink-0 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <div className="h-4 w-4 flex-shrink-0 rounded-full border-2 border-[#d6deea]" />
            )}
            <span className={`text-[12px] ${progress > s.threshold ? 'text-[#0f1b2d]' : 'text-[#98a3b6]'}`}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
