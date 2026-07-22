'use client'

import { Link } from '@/lib/navigation'
import { useAuth } from '@/components/AuthProvider'

interface ProkuroBrandLinkProps {
  variant?: 'marketing' | 'auth' | 'app'
}

export default function ProkuroBrandLink({ variant = 'app' }: ProkuroBrandLinkProps) {
  const { user } = useAuth()
  const href = user ? '/dashboard' : '/'

  if (variant === 'marketing') {
    if (user) {
      return (
        <Link className="brand" href={href}>
          <span className="brand__dot" aria-hidden="true" />
          <span>Prokuro.ai</span>
        </Link>
      )
    }
    return (
      <a className="brand" href={href}>
        <span className="brand__dot" aria-hidden="true" />
        <span>Prokuro.ai</span>
      </a>
    )
  }

  if (variant === 'auth') {
    return (
      <Link href={href} className="flex items-center gap-2">
        <span className="h-3.5 w-3.5 bg-[#0062ff] [clip-path:polygon(24%_0,100%_0,100%_100%,0_100%)]" />
        <span className="text-[17px] font-semibold tracking-tight text-[#0f1b2d]">Prokuro.ai</span>
      </Link>
    )
  }

  return (
    <Link href={href} className="flex flex-shrink-0 items-center gap-2 transition-opacity hover:opacity-80">
      <span className="h-3 w-3 flex-shrink-0 bg-[#0062ff] [clip-path:polygon(24%_0,100%_0,100%_100%,0_100%)]" />
      <span className="text-[14px] font-semibold tracking-tight text-[#0f1b2d]">Prokuro.ai</span>
    </Link>
  )
}
