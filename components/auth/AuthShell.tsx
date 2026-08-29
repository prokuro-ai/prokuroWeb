'use client'

import { Link } from '@/lib/navigation'
import { ProkuroWordmark } from '@/components/brand/ProkuroLogo'
import { MARKETING_HEADLINE, MARKETING_LEAD } from '@/lib/marketing-content'

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mk-sans flex min-h-screen w-full bg-mk-canvas text-mk-ink antialiased">
      <aside
        data-surface="dark"
        className="relative isolate hidden overflow-hidden bg-mk-canvas lg:flex lg:w-[45%] lg:flex-col lg:items-center lg:justify-center"
      >
        <div className="mk-grain pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative z-10 flex w-full max-w-lg flex-col px-12 xl:px-16 -translate-y-20">
          <Link href="/" className="mb-20 inline-flex self-start text-mk-ink">
            <ProkuroWordmark size={22} />
          </Link>
          <h1 className="mk-h2 max-w-[14ch]">
            {MARKETING_HEADLINE.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="mk-lead mt-6 max-w-[32ch] text-mk-ink-muted">{MARKETING_LEAD}</p>
        </div>
      </aside>

      <div
        data-surface="light"
        className="relative flex w-full items-center justify-center bg-mk-canvas p-6 sm:p-12 lg:w-[55%]"
      >
        <Link href="/" className="absolute left-6 top-6 inline-flex text-mk-ink lg:hidden">
          <ProkuroWordmark size={22} />
        </Link>
        <div className="mt-10 w-full max-w-[400px] lg:mt-0">{children}</div>
      </div>
    </div>
  )
}
