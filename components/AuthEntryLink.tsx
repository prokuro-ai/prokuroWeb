'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { useAuth } from '@/components/AuthProvider'

/** Login when signed out; dashboard when a session is already stored. */
export function useAuthEntryHref(): '/dashboard' | '/login' {
  const { user, loading } = useAuth()
  if (!loading && user) return '/dashboard'
  return '/login'
}

type AuthEntryLinkProps = Omit<ComponentProps<typeof Link>, 'href'>

export function AuthEntryLink({ children, ...props }: AuthEntryLinkProps) {
  const href = useAuthEntryHref()
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  )
}
