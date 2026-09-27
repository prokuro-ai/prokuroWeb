import type { ReactNode } from 'react'
import { appSheet } from '@/components/app/chrome'

export default function Panel({
  title,
  detail,
  actions,
  footer,
  className = '',
  children,
}: {
  title: string
  detail?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section aria-label={title} className={`${appSheet} flex flex-col ${className}`}>
      <header className="flex flex-col gap-2 border-b border-mk-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between mk:px-5">
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-mk-ink">{title}</h2>
          {detail ? <p className="mt-0.5 text-[12px] text-mk-ink-subtle">{detail}</p> : null}
        </div>
        {actions}
      </header>
      <div className="flex-1">{children}</div>
      {footer ? <footer className="border-t border-mk-line px-4 py-2.5 mk:px-5">{footer}</footer> : null}
    </section>
  )
}
