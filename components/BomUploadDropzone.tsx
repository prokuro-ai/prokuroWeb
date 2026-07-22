'use client'



import { useCallback, useRef, useState } from 'react'

const ACCEPTED = ['.csv', '.xlsx', '.xls', '.txt']
const ACCEPT_MIME = '.csv,.xlsx,.xls,.txt,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'

const PROKURO_FEATURES = [
  'AI column detection — maps messy headers to canonical fields',
  'MPN normalization — strips whitespace, detects distributor SKUs',
  'AML parsing — finds alternates in comma-separated cells or separate sheets',
  'Lifecycle + stock + lead-time lookup via Nexar',
]

interface BomUploadDropzoneProps {
  onFileSelected: (file: File) => void
  parsing?: boolean
  disabled?: boolean
  variant?: 'modal' | 'full'
  selectedFile?: File | null
  onClearFile?: () => void
  validationError?: string | null
  showInfoPanel?: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function BomUploadDropzone({
  onFileSelected,
  parsing = false,
  disabled = false,
  variant = 'modal',
  selectedFile = null,
  onClearFile,
  validationError = null,
  showInfoPanel,
}: BomUploadDropzoneProps) {
  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isInteractive = !disabled && !parsing
  const displayInfoPanel = showInfoPanel ?? variant === 'modal'
  const displayError = validationError ?? localError

  const validateAndSelect = useCallback(
    (file: File) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!ACCEPTED.includes(ext)) {
        setLocalError(`Unsupported file type. Accepted formats: ${ACCEPTED.join(', ')}`)
        return
      }
      setLocalError(null)
      onFileSelected(file)
    },
    [onFileSelected],
  )

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    if (isInteractive) setDragOver(true)
  }

  const onDragLeave = () => setDragOver(false)

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)
    if (!isInteractive) return
    const file = event.dataTransfer.files[0]
    if (file) validateAndSelect(file)
  }

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) validateAndSelect(file)
    event.target.value = ''
  }

  const openPicker = () => {
    if (isInteractive) inputRef.current?.click()
  }

  if (selectedFile) {
    return (
      <div className="space-y-4">
        <div className="upload-file-card">
          <div className="upload-file-card__icon">
            <FileIcon />
          </div>
          <div className="upload-file-card__meta">
            <p className="upload-file-card__name">{selectedFile.name}</p>
            <p className="upload-file-card__size">{formatFileSize(selectedFile.size)}</p>
          </div>
          {parsing ? (
            <Spinner className="h-5 w-5 flex-shrink-0 text-primary" />
          ) : onClearFile ? (
            <button type="button" className="upload-file-card__remove" onClick={onClearFile}>
              Remove
            </button>
          ) : null}
        </div>
        {parsing && (
          <div className="flex items-center justify-center gap-2 py-2" aria-live="polite">
            <Spinner className="h-5 w-5 text-primary" />
            <p className="text-[13px] font-medium text-ink">Detecting columns…</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept={ACCEPT_MIME} onChange={onInputChange} className="sr-only" />
      </div>
    )
  }

  return (
    <div className={variant === 'modal' ? 'upload-dropzone-layout' : 'space-y-4'}>
      {displayError && <div className="upload-error-banner">{displayError}</div>}

      <div
        role="button"
        tabIndex={isInteractive ? 0 : -1}
        aria-label="Drop BOM file here or click to browse"
        aria-disabled={!isInteractive}
        onClick={openPicker}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && isInteractive) {
            event.preventDefault()
            openPicker()
          }
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`upload-dropzone-target flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-12 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
          !isInteractive
            ? 'cursor-default border-hairline bg-surface-1 opacity-60'
            : dragOver
              ? 'cursor-pointer border-primary bg-[#eef4ff]'
              : 'cursor-pointer border-hairline bg-white hover:border-primary hover:bg-[#f9fbff]'
        }`}
      >
        <input ref={inputRef} type="file" accept={ACCEPT_MIME} onChange={onInputChange} className="sr-only" />

        {dragOver ? (
          <DropOverContent />
        ) : (
          <IdleContent variant={variant} />
        )}
      </div>

      {displayInfoPanel && <InfoPanel />}
    </div>
  )
}

function IdleContent({ variant }: { variant: 'modal' | 'full' }) {
  return (
    <>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff]">
        <UploadIcon className="h-6 w-6 text-primary" />
      </div>
      <p className="text-[15px] font-medium text-ink">Drop your BOM here</p>
      <p className="mt-1 text-[13px] text-ink-subtle">or click to browse</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {ACCEPTED.map((ext) => (
          <span key={ext} className="rounded-md border border-hairline bg-surface-1 px-2.5 py-1 font-mono text-[12px] text-ink-subtle">
            {ext}
          </span>
        ))}
      </div>
      {variant === 'modal' && (
        <p className="mt-3 text-[11px] text-ink-tertiary">Any column format. Prokuro auto-detects MPN, Qty, Ref, Manufacturer.</p>
      )}
    </>
  )
}

function DropOverContent() {
  return (
    <>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <UploadIcon className="h-6 w-6 text-primary" />
      </div>
      <p className="text-[15px] font-medium text-primary">Release to upload</p>
    </>
  )
}

function InfoPanel() {
  return (
    <div className="rounded-lg border border-hairline bg-white p-4">
      <p className="mb-3 text-[12px] font-medium text-ink-muted">What Prokuro does with your BOM</p>
      <div className="space-y-2">
        {PROKURO_FEATURES.map((item) => (
          <div key={item} className="flex items-start gap-2">
            <CheckIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
            <span className="text-[12px] text-ink-muted">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function UploadIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  )
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export { ACCEPTED, formatFileSize }
