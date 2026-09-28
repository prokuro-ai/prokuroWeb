import type { ReactNode } from 'react'
import { appSheet } from '@/components/app/chrome'

export default function Panel({
  title,
  count,
  actions,
  footer,
  className = '',
  children,
}: {
  title: string
  count?: string
  actions?: ReactNode
  footer?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section aria-label={title} className={`${appSheet} flex flex-col ${className}`}>
      <header className="flex flex-col gap-3 border-b border-mk-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-3.5 mk:px-5">
        <h2 className="flex items-center gap-2 text-[14px] font-semibold text-mk-ink">
          {title}
          {count ? (
            <span className="mk-data rounded-full bg-mk-raised-2 px-2 py-0.5 text-[11px] font-normal text-mk-ink-muted">
              {count}
            </span>
          ) : null}
        </h2>
        {actions}
      </header>
      <div className="flex-1">{children}</div>
      {footer ? <footer className="border-t border-mk-line px-4 py-2.5 mk:px-5">{footer}</footer> : null}
    </section>
  )
}
