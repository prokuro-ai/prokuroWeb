'use client'

import { X } from 'lucide-react'
import type { ReactNode } from 'react'

const WIDTH = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-6xl',
} as const

type AppModalProps = {
  open: boolean
  onClose: () => void
  eyebrow: string
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  maxWidth?: keyof typeof WIDTH
  closeDisabled?: boolean
}

export function AppModal({
  open,
  onClose,
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'md',
  closeDisabled = false,
}: AppModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1b2d]/50 px-4"
      onClick={(event) => {
        if (event.target !== event.currentTarget || closeDisabled) return
        onClose()
      }}
    >
      <div
        className={`flex max-h-[90vh] w-full ${WIDTH[maxWidth]} flex-col overflow-hidden border border-slate-200 bg-white shadow-[0_24px_48px_-30px_rgb(15_27_45_/_40%)]`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-[#f4f6f9] px-5 py-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">{eyebrow}</p>
            <h2 id="app-modal-title" className="mt-1 text-[17px] font-semibold tracking-tight text-slate-900">
              {title}
            </h2>
            {subtitle ? <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{subtitle}</p> : null}
          </div>
          {!closeDisabled ? (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 border border-slate-200 bg-white p-1.5 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer ? (
          <div className="shrink-0 border-t border-slate-200 bg-[#f4f6f9] px-5 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  )
}

export function ModalNotice({
  tone,
  children,
}: {
  tone: 'info' | 'warn' | 'error'
  children: ReactNode
}) {
  const styles =
    tone === 'error'
      ? 'border-red-200 bg-red-50 text-red-800'
      : tone === 'warn'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-[#0062ff]/25 bg-[#0062ff]/5 text-slate-700'

  return (
    <div className={`mb-4 border px-4 py-3 text-[13px] leading-relaxed ${styles}`}>{children}</div>
  )
}
