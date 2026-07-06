'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
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

const btnDanger =
  'inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60'

const btnGhost =
  'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-[#7a8598] transition-colors hover:bg-[#f4f6f9] hover:text-[#0f1b2d] disabled:cursor-not-allowed disabled:opacity-60'

export function DeleteBomButton({
  bomId,
  bomName,
  redirectTo = '/dashboard',
  onDeleted,
  variant = 'danger',
  label = 'Delete',
  className = '',
}: DeleteBomButtonProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const styles = variant === 'ghost' ? btnGhost : btnDanger

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${bomName}"? This cannot be undone.`)) return

    setDeleting(true)
    try {
      await deleteBom(bomId)
      onDeleted?.()
      if (redirectTo) router.push(redirectTo)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to delete BOM')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <button type="button" className={`${styles} ${className}`} disabled={deleting} onClick={() => void handleDelete()}>
      {deleting ? 'Deleting…' : label}
    </button>
  )
}
