'use client'

import { useLocation } from '@/lib/navigation'
import { useEffect, useState } from 'react'
import { AppModal, ModalNotice } from '@/components/AppModal'
import { appDangerBtn, appField, appGhostBtn } from '@/components/app/chrome'
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
  'inline-flex items-center gap-1.5 border border-red-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60'

const btnGhost =
  'inline-flex items-center gap-1.5 px-2 py-1 text-[12px] font-medium text-red-600 transition-colors hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60'

export function DeleteBomButton({
  bomId,
  bomName,
  redirectTo = '/boms',
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
      if (event.key === 'Escape' && !deleting) closeModal()
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

      <AppModal
        open={open}
        onClose={closeModal}
        eyebrow="Delete BOM"
        title={`Delete “${bomName}”?`}
        subtitle="This permanently removes the BOM, analysis, and monitoring data. This cannot be undone."
        closeDisabled={deleting}
        footer={
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={closeModal} disabled={deleting} className={appGhostBtn}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={!canConfirm}
              className={appDangerBtn}
            >
              {deleting ? 'Deleting…' : 'Delete permanently'}
            </button>
          </div>
        }
      >
        {error ? <ModalNotice tone="error">{error}</ModalNotice> : null}

        <label htmlFor={`delete-confirm-${bomId}`} className="block text-[13px] font-medium text-mk-ink">
          Type <span className="font-mk-mono text-mk-ink">{CONFIRM_WORD}</span> to confirm
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
          className={`mt-2 ${appField} disabled:cursor-not-allowed disabled:bg-mk-raised`}
        />
      </AppModal>
    </>
  )
}
