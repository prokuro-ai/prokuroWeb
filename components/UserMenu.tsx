'use client'

import { Link } from '@/lib/navigation'
import { useAuth } from '@/components/AuthProvider'
import { SELF_SERVE_ENABLED } from '@/lib/access'
import {
  APP_LOGIN_URL,
  APP_SIGNUP_URL,
  BOOK_DEMO_LABEL,
  SCHEDULE_DEMO_PATH,
} from '@/lib/sales'

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

  // GitHub Pages: send self-serve traffic to the Amplify product origin.
  return (
    <div className="nav-actions">
      <a href={APP_LOGIN_URL} className="nav-text-link">
        Login
      </a>
      <a className="btn btn--primary btn--nav" href={APP_SIGNUP_URL}>
        Try Prokuro
      </a>
      <Link className="nav-text-link" href={SCHEDULE_DEMO_PATH}>
        {BOOK_DEMO_LABEL}
      </Link>
    </div>
  )
}
