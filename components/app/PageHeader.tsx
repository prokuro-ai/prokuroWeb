import type { ReactNode } from 'react'

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
    <div className="mx-auto flex max-w-[1180px] flex-wrap items-end justify-between gap-4 px-6 pt-8 pb-2">
      <div className="min-w-0 flex-1">
        {kicker ? <p className="mk-eyebrow">{kicker}</p> : null}
        <h1 className="font-mk-display text-[32px] font-normal leading-[1.08] tracking-[-0.025em] text-mk-ink">
          {title}
        </h1>
        {description ? (
          <div className="mt-2 max-w-2xl text-[15px] leading-relaxed text-mk-ink-muted">{description}</div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
