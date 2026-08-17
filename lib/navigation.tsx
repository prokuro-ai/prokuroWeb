'use client'

import NextLink from 'next/link'
import { useParams as useNextParams, usePathname, useRouter } from 'next/navigation'
import type { ComponentProps, ReactNode } from 'react'

type LinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & {
  href: string
  children?: ReactNode
}

/** Drop-in replacement for wouter Link on Next.js routes. */
export function Link({ href, ...props }: LinkProps) {
  return <NextLink href={href} {...props} />
}

/** Drop-in replacement for wouter useLocation. */
export function useLocation(): [string, (to: string) => void] {
  const pathname = usePathname()
  const router = useRouter()
  return [pathname, (to: string) => router.push(to)]
}

/** Drop-in replacement for wouter useParams. */
export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T {
  return useNextParams() as T
}

/** Relative in-app path only. Rejects protocol-relative and absolute URLs. */
export function safeNextPath(raw: string | null | undefined, fallback = '/dashboard'): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('://')) {
    return fallback
  }
  return raw
}

const AUTH_NEXT_KEY = 'prokuro.auth.next'

export function rememberNextPath(path: string): void {
  try {
    window.sessionStorage.setItem(AUTH_NEXT_KEY, path)
  } catch {
    /* ignore */
  }
}

export function consumeNextPath(fallback = '/dashboard'): string {
  try {
    const stored = window.sessionStorage.getItem(AUTH_NEXT_KEY)
    window.sessionStorage.removeItem(AUTH_NEXT_KEY)
    return safeNextPath(stored, fallback)
  } catch {
    return fallback
  }
}
