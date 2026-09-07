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

function navClass(active: boolean) {
  return `relative flex items-center rounded-[8px] px-3 py-2.5 text-[14px] font-medium tracking-[-0.01em] transition-colors ${
    active ? 'bg-mk-raised text-mk-ink' : 'text-mk-ink-muted hover:bg-mk-raised hover:text-mk-ink'
  }`
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
        className="flex h-screen items-center justify-center bg-mk-raised font-mk-sans text-[13px] text-mk-ink-subtle"
      >
        Loading…
      </div>
    )
  }

  const initials = initialsForUser(user)
  const displayName = displayNameForUser(user)

  return (
    <div data-surface="light" className="relative flex h-screen bg-mk-raised font-mk-sans text-mk-ink">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-mk-ink/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-[232px] transition-transform duration-200 md:static md:z-auto md:translate-x-0 md:transition-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <aside className="flex h-full w-[232px] flex-col border-r border-mk-line bg-mk-canvas">
          <div className="flex h-14 shrink-0 items-center border-b border-mk-line px-4">
            <Link href="/dashboard" className="flex min-w-0 items-center" onClick={() => setMobileOpen(false)}>
              <ProkuroWordmark size={22} markClassName="text-mk-ink" />
            </Link>
          </div>

          <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="App">
            {WORK_NAV.map((item) => {
              const active = item.match(pathname)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navClass(active)}
                  onClick={() => setMobileOpen(false)}
                >
                  {active ? (
                    <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-mk-accent" aria-hidden />
                  ) : null}
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-mk-line bg-mk-canvas px-3 sm:px-5">
          <button
            type="button"
            className="rounded-[8px] p-1.5 text-mk-ink-muted hover:bg-mk-raised hover:text-mk-ink md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="hidden min-w-0 flex-1 md:block" />

          <div className="ml-auto flex shrink-0 items-center">
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className={`rounded-[8px] p-1 transition-colors ${
                  profileOpen ? 'bg-mk-raised' : 'hover:bg-mk-raised'
                }`}
                aria-label="Account menu"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-mk-ink text-[11px] font-semibold text-mk-canvas">
                  {initials}
                </div>
              </button>
              {profileOpen ? (
                <div className="absolute right-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-[8px] border border-mk-line bg-mk-canvas shadow-[var(--mk-shadow)]">
                  <div className="border-b border-mk-line px-4 py-4">
                    <p className="truncate text-[14px] font-semibold text-mk-ink">{displayName || user.email}</p>
                    <p className="truncate text-[12px] text-mk-ink-subtle">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      router.push('/account')
                      setProfileOpen(false)
                    }}
                    className="flex w-full items-center px-4 py-3 text-left text-[13px] font-medium text-mk-ink transition-colors hover:bg-mk-raised"
                  >
                    Account
                  </button>
                  <div className="border-t border-mk-line">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-medium text-mk-red transition-colors hover:bg-mk-raised"
                    >
                      <LogOut className="h-4 w-4 shrink-0" /> Sign out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
