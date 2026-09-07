import type { ReactNode } from 'react'

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
    <div className="px-2 py-12 text-center mk:py-16">
      <p className="mk-app-heading text-mk-ink">{title}</p>
      {description ? (
        <p className="mk-small mx-auto mt-2 max-w-md text-mk-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
