import type { ReactNode } from 'react'
import { appSheet } from '@/components/app/chrome'

export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className={`${appSheet} border-dashed px-8 py-16 text-center`}>
      <p className="font-mk-display text-[22px] leading-snug text-mk-ink">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-mk-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
