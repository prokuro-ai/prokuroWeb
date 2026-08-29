'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { consumeNextPath, rememberNextPath, safeNextPath, useLocation } from '@/lib/navigation'
import { useAuth } from '@/components/AuthProvider'

export function withNextPath(href: string, nextPath: string, defaultNext = '/dashboard'): string {
  if (nextPath === defaultNext) return href
  return `${href}?next=${encodeURIComponent(nextPath)}`
}

/** Remember `?next=` and bounce signed-in visitors onward. */
export function useAuthRedirect() {
  const [, navigate] = useLocation()
  const { user, refresh, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const nextPath = safeNextPath(searchParams.get('next'))

  useEffect(() => {
    rememberNextPath(nextPath)
  }, [nextPath])

  useEffect(() => {
    if (!authLoading && user) {
      navigate(consumeNextPath(nextPath))
    }
  }, [authLoading, user, navigate, nextPath])

  return { refresh, nextPath }
}
