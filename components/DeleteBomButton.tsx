'use client'

import { useLocation } from '@/lib/navigation'
import { useEffect, useState } from 'react'
import { deleteBom } from '@/lib/api'

type DeleteBomButtonProps = {
  bomId: string
  bomName: string
  redirectTo?: string | null
  onDeleted?: () => void
  variant?: 'danger' | 'ghost'
  label?: string
  className?: string
}

const CONFIRM_WORD = 'delete'

const btnDanger =
  'inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60'

const btnGhost =
  'inline-flex items-center gap-1.5 px-2 py-1 text-[12px] font-medium text-red-600 transition-colors hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60'

export function DeleteBomButton({
  bomId,
  bomName,
  redirectTo = '/dashboard',
  onDeleted,
  variant = 'danger',
  label = 'Delete',
  className = '',
}: DeleteBomButtonProps) {
  const [, navigate] = useLocation()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const styles = variant === 'ghost' ? btnGhost : btnDanger
  const canConfirm = confirmText === CONFIRM_WORD && !deleting

  const closeModal = () => {
    if (deleting) return
    setOpen(false)
    setConfirmText('')
    setError(null)
  }

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !deleting) {
        setOpen(false)
        setConfirmText('')
        setError(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, deleting])

  const handleDelete = async () => {
    if (!canConfirm) return

    setDeleting(true)
    setError(null)
    try {
      await deleteBom(bomId)
      setOpen(false)
      setConfirmText('')
      onDeleted?.()
      if (redirectTo) navigate(redirectTo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete BOM')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className={`${styles} ${className}`}
        disabled={deleting}
        onClick={() => setOpen(true)}
      >
        {deleting ? 'Deleting…' : label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1b2d]/60 px-4 backdrop-blur-[2px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="px-6 pt-6 pb-4">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="h-3.5 w-3.5 shrink-0 bg-[#0062ff]"
                  style={{ clipPath: 'polygon(24% 0,100% 0,100% 100%,0% 100%)' }}
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#0062ff]">Delete BOM</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">Delete &ldquo;{bomName}&rdquo;?</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                This permanently removes the BOM, analysis, and monitoring data. This cannot be undone.
              </p>
            </div>

            <div className="px-6 pb-2">
              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <label htmlFor={`delete-confirm-${bomId}`} className="block text-sm font-medium text-slate-700">
                Type <span className="font-mono text-slate-900">{CONFIRM_WORD}</span> to confirm
              </label>
              <input
                id={`delete-confirm-${bomId}`}
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoComplete="off"
                autoFocus
                disabled={deleting}
                placeholder={CONFIRM_WORD}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0062ff] focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={!canConfirm}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  canConfirm
                    ? 'bg-[#0062ff] text-white hover:bg-blue-700'
                    : 'cursor-not-allowed bg-slate-100 text-slate-400'
                }`}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button
                type="button"
                onClick={closeModal}
                disabled={deleting}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
