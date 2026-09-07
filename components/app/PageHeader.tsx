import type { ReactNode } from 'react'
import { appContainer } from '@/components/app/chrome'

export default function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div
      className={`${appContainer} flex flex-col gap-3 pt-5 pb-2 mk:flex-row mk:flex-wrap mk:items-end mk:justify-between mk:gap-4 mk:pt-8`}
    >
      <div className="min-w-0 flex-1">
        {kicker ? <p className="mk-eyebrow">{kicker}</p> : null}
        <h1 className="mk-app-title text-mk-ink">{title}</h1>
        {description ? (
          <div className="mk-small mt-2 max-w-2xl text-mk-ink-muted">{description}</div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
