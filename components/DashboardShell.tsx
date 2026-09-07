'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Link } from '@/lib/navigation'
import { useAuth } from '@/components/AuthProvider'
import { ProkuroWordmark } from '@/components/brand/ProkuroLogo'
import { displayNameForUser, initialsForUser, signOut } from '@/lib/auth'
import { LogOut, Menu, X } from 'lucide-react'

type NavItem = {
  href: string
  label: string
  match: (pathname: string) => boolean
}

const WORK_NAV: NavItem[] = [
  {
    href: '/dashboard',
    label: 'This week',
    match: (pathname) => pathname === '/dashboard',
  },
  {
    href: '/boms',
    label: 'Boards',
    match: (pathname) => pathname === '/boms' || pathname.startsWith('/bom'),
  },
  {
    href: '/purchasing',
    label: 'Buy',
    match: (pathname) => pathname === '/purchasing',
  },
  {
    href: '/billing',
    label: 'Plan',
    match: (pathname) => pathname === '/billing',
  },
]

function normalizePath(pathname: string | null): string {
  if (!pathname || pathname === '/') return '/'
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = normalizePath(usePathname())
  const { user, loading: authLoading, refresh } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) router.replace('/login')
  }, [authLoading, user, router])

  useEffect(() => {
    setMobileOpen(false)
    setProfileOpen(false)
  }, [pathname])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    await refresh()
    router.push('/login')
  }

  if (authLoading || !user) {
    return (
      <div
        data-surface="light"
        className="flex h-screen items-center justify-center bg-mk-canvas font-mk-sans text-[13px] text-mk-ink-subtle"
      >
        Loading…
      </div>
    )
  }

  const initials = initialsForUser(user)
  const displayName = displayNameForUser(user)

  const nav = (
    <nav className="flex flex-col gap-1 px-3" aria-label="App">
      {WORK_NAV.map((item) => {
        const active = item.match(pathname)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-[8px] px-3 py-2 text-[15px] tracking-[-0.015em] transition-colors ${
              active
                ? 'bg-mk-raised font-semibold text-mk-ink'
                : 'font-medium text-mk-ink-muted hover:bg-mk-raised/70 hover:text-mk-ink'
            }`}
            onClick={() => setMobileOpen(false)}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  const profileMenu = profileOpen ? (
    <div className="absolute bottom-full left-0 z-50 mb-2 w-full overflow-hidden rounded-[8px] border border-mk-line bg-mk-canvas shadow-[var(--mk-shadow)]">
      <div className="px-4 py-3">
        <p className="truncate text-[13px] font-semibold text-mk-ink">{displayName || user.email}</p>
        <p className="truncate text-[12px] text-mk-ink-subtle">{user.email}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          router.push('/account')
          setProfileOpen(false)
        }}
        className="flex w-full items-center px-4 py-2.5 text-left text-[13px] font-medium text-mk-ink hover:bg-mk-raised"
      >
        Account
      </button>
      <button
        type="button"
        onClick={handleSignOut}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] font-medium text-mk-red hover:bg-mk-raised"
      >
        <LogOut className="h-3.5 w-3.5 shrink-0" /> Sign out
      </button>
    </div>
  ) : null

  return (
    <div data-surface="light" className="relative flex h-screen bg-mk-canvas font-mk-sans text-mk-ink">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-mk-ink/20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col bg-mk-raised transition-transform duration-200 md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="px-5 pb-6 pt-7">
          <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
            <ProkuroWordmark size={24} markClassName="text-mk-ink" />
          </Link>
        </div>

        {nav}

        <div className="relative mt-auto p-3" ref={profileRef}>
          {profileMenu}
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            className={`flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left transition-colors ${
              profileOpen || pathname === '/account' ? 'bg-mk-canvas' : 'hover:bg-mk-canvas/80'
            }`}
            aria-label="Account menu"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-mk-ink text-[11px] font-semibold text-mk-canvas">
              {initials}
            </div>
            <span className="min-w-0 truncate text-[13px] font-medium text-mk-ink">
              {displayName || user.email}
            </span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center px-3 md:hidden">
          <button
            type="button"
            className="rounded-[8px] p-1.5 text-mk-ink hover:bg-mk-raised"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
