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
