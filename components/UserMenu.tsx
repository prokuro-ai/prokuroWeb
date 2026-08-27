'use client'

import { Link } from '@/lib/navigation'
import { useAuth } from '@/components/AuthProvider'
import { SELF_SERVE_ENABLED } from '@/lib/access'
import { BOOK_DEMO_LABEL, SCHEDULE_DEMO_PATH } from '@/lib/sales'

export function MarketingAuthActions() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (SELF_SERVE_ENABLED) {
    const signedInTarget = user ? '/dashboard' : null
    return (
      <div className="flex items-center gap-3">
        <Link href={signedInTarget ?? '/login'} className="mk-nav-link hidden sm:inline">
          Login
        </Link>
        <Link className="mk-btn mk-btn--primary" href={signedInTarget ?? '/signup'}>
          Try Prokuro
        </Link>
      </div>
    )
  }

  return (
    <Link className="mk-btn mk-btn--primary" href={SCHEDULE_DEMO_PATH}>
      {BOOK_DEMO_LABEL}
    </Link>
  )
}
