'use client'

import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { appSheet } from '@/components/app/chrome'

const WIDTH = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-6xl',
} as const

type AppModalProps = {
  open: boolean
  onClose: () => void
  eyebrow?: string
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-mk-ink/45 px-4"
      onClick={(event) => {
        if (event.target !== event.currentTarget || closeDisabled) return
        onClose()
      }}
    >
      <div
        className={`flex max-h-[90vh] w-full ${WIDTH[maxWidth]} flex-col ${appSheet}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 px-6 pt-5 pb-3">
          <div className="min-w-0">
            {eyebrow ? <p className="mk-eyebrow mb-1.5">{eyebrow}</p> : null}
            <h2 id="app-modal-title" className="mk-app-heading text-mk-ink">
              {title}
            </h2>
            {subtitle ? <p className="mt-1 text-[13px] text-mk-ink-muted">{subtitle}</p> : null}
          </div>
          {!closeDisabled ? (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-[8px] p-1.5 text-mk-ink-subtle transition-colors hover:bg-mk-raised hover:text-mk-ink"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5">{children}</div>

        {footer ? <div className="shrink-0 px-6 pb-5">{footer}</div> : null}
      </div>
    </div>
  )
}

export function ModalNotice({
  tone,
  children,
  className = '',
}: {
  tone: 'info' | 'warn' | 'error'
  children: ReactNode
  className?: string
}) {
  const styles =
    tone === 'error'
      ? 'border-mk-red/25 bg-mk-red/5 text-mk-red'
      : tone === 'warn'
        ? 'border-mk-amber/30 bg-mk-amber/10 text-mk-amber'
        : 'border-mk-line bg-mk-raised text-mk-ink-muted'

  return (
    <div className={`mb-4 rounded-[8px] border px-4 py-3 text-[13px] leading-relaxed ${styles} ${className}`}>
      {children}
    </div>
  )
}
