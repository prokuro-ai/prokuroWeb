'use client'

import { useCallback, useEffect } from 'react'

interface UseModalOptions {
  open: boolean
  onClose: () => void
  /** When true, Escape and backdrop click are ignored */
  blockDismiss?: boolean
}

export function useModal({ open, onClose, blockDismiss = false }: UseModalOptions) {
  useEffect(() => {
    document.body.classList.toggle('modal-open', open)
    return () => document.body.classList.remove('modal-open')
  }, [open])

  useEffect(() => {
    if (!open) return

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !blockDismiss) onClose()
    }

    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [open, onClose, blockDismiss])

  const onBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (blockDismiss) return
      if (event.target === event.currentTarget) onClose()
    },
    [blockDismiss, onClose],
  )

  return { onBackdropClick }
}
