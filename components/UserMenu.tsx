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
      <div className="nav-actions">
        <Link href={signedInTarget ?? '/login'} className="nav-text-link">
          Login
        </Link>
        <Link className="btn btn--primary btn--nav" href={signedInTarget ?? '/signup'}>
          Try Prokuro
        </Link>
      </div>
    )
  }

  return (
    <Link className="btn btn--primary btn--nav" href={SCHEDULE_DEMO_PATH}>
      {BOOK_DEMO_LABEL}
    </Link>
  )
}
