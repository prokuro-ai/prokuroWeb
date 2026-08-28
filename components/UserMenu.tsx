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

  // GitHub Pages cannot host Cognito — keep our nav chrome, deep-link to Amplify.
  return (
    <div className="flex items-center gap-3">
      <a href={APP_LOGIN_URL} className="mk-nav-link hidden sm:inline">
        Login
      </a>
      <a className="mk-btn mk-btn--primary" href={APP_SIGNUP_URL}>
        Try Prokuro
      </a>
      <Link className="mk-nav-link hidden sm:inline" href={SCHEDULE_DEMO_PATH}>
        {BOOK_DEMO_LABEL}
      </Link>
    </div>
  )
}
