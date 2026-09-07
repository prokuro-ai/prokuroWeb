'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Link } from '@/lib/navigation'
import { useAuth } from '@/components/AuthProvider'
import { ProkuroMark, ProkuroWordmark } from '@/components/brand/ProkuroLogo'
import { displayNameForUser, initialsForUser, signOut } from '@/lib/auth'
import { getBillingStatus, listBoms, listFlaggedLines, type BillingAccountStatus } from '@/lib/api'
import { planLabel } from '@/lib/planLimits'
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'

const SIDEBAR_COLLAPSED_KEY = 'prokuro.sidebar.collapsed'

type NavItem = {
  href: string
  label: string
  match: (pathname: string) => boolean
}

const PRIMARY_NAV: NavItem[] = [
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
  {
    href: '/account',
    label: 'Account',
    match: (pathname) => pathname === '/account',
  },
]

function normalizePath(pathname: string | null): string {
  if (!pathname || pathname === '/') return '/'
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

function navClass(active: boolean, collapsed: boolean) {
  return `relative flex items-center px-3 py-2.5 text-[14px] tracking-[-0.01em] transition-colors ${
    collapsed ? 'md:justify-center md:px-0' : ''
  } ${
    active
      ? 'bg-mk-raised text-mk-ink'
      : 'text-mk-ink-muted hover:bg-mk-raised hover:text-mk-ink'
  }`
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = normalizePath(usePathname())
  const { user, loading: authLoading, refresh } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarReady, setSidebarReady] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [bomCount, setBomCount] = useState(0)
  const [flaggedCount, setFlaggedCount] = useState<number | null>(null)
  const [billing, setBilling] = useState<BillingAccountStatus | null>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const labelClass = collapsed ? 'md:hidden' : ''

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1')
    } catch {
      /* ignore */
    }
    setSidebarReady(true)
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) router.replace('/login')
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    listBoms()
      .then((page) => {
        if (!cancelled) setBomCount(page.items.length)
      })
      .catch(() => {})
    listFlaggedLines()
      .then((result) => {
        if (!cancelled) setFlaggedCount(result.items.length)
      })
      .catch(() => {
        if (!cancelled) setFlaggedCount(null)
      })
    getBillingStatus()
      .then((status) => {
        if (!cancelled) setBilling(status)
      })
      .catch(() => {
        if (!cancelled) setBilling(null)
      })
    return () => {
      cancelled = true
    }
  }, [user])

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

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

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
  const billingReady = billing != null
  const activePlan = billing?.plan
  const bomLimit = billing?.limits.active_boms
  const bomUsed = billing?.usage.active_boms_count ?? bomCount
  const bomPct = bomLimit != null && bomLimit > 0 ? Math.min((bomUsed / bomLimit) * 100, 100) : 0
  const badge = billingReady ? planLabel(activePlan!) : '…'
  const upgradeLabel = !billingReady
    ? 'Billing unavailable'
    : activePlan === 'free'
      ? 'Upgrade to Growth'
      : activePlan === 'growth'
        ? 'Upgrade to Scale'
        : 'Manage plan'
  const upgradeHref = !billingReady
    ? '/billing'
    : activePlan === 'scale'
      ? '/billing'
      : '/billing?plans=1'

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
        className={`fixed inset-y-0 left-0 z-50 md:static md:z-auto md:translate-x-0 ${
          sidebarReady ? 'transition-transform duration-200 md:transition-none' : ''
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <aside
          className={`flex h-full w-[232px] flex-col border-r border-mk-line bg-mk-canvas ${
            sidebarReady ? 'md:transition-[width] md:duration-200' : ''
          } ${collapsed ? 'md:w-16' : 'md:w-[232px]'}`}
        >
          <div
            className={`flex h-14 shrink-0 items-center border-b border-mk-line px-4 ${
              collapsed ? 'md:justify-center md:px-2' : ''
            }`}
          >
            <Link href="/dashboard" className="flex min-w-0 items-center" onClick={() => setMobileOpen(false)}>
              <span className={collapsed ? 'hidden md:inline-flex' : 'hidden'}>
                <ProkuroMark size={22} className="text-mk-accent" />
              </span>
              <span className={collapsed ? 'md:hidden' : undefined}>
                <ProkuroWordmark size={22} markClassName="text-mk-accent" />
              </span>
            </Link>
          </div>

          <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="App">
            {PRIMARY_NAV.map((item) => {
              const active = item.match(pathname)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={navClass(active, collapsed)}
                  onClick={() => setMobileOpen(false)}
                >
                  {active ? (
                    <span className="absolute inset-y-0 left-0 w-0.5 bg-mk-accent" aria-hidden />
                  ) : null}
                  <span className={`font-medium ${labelClass}`}>{item.label}</span>
                  {collapsed ? (
                    <span className="hidden font-mk-display text-[15px] md:inline" aria-hidden>
                      {item.label.slice(0, 1)}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto border-t border-mk-line p-2">
            <button
              type="button"
              onClick={toggleCollapsed}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={`${navClass(false, collapsed)} mt-0.5 w-full max-md:hidden`}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4 shrink-0" />
              ) : (
                <PanelLeftClose className="h-4 w-4 shrink-0" />
              )}
              <span className={labelClass}>{collapsed ? 'Expand' : 'Collapse'}</span>
            </button>
          </div>
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-mk-line bg-mk-canvas px-3 sm:px-5">
          <button
            type="button"
            className="p-1.5 text-mk-ink-muted hover:bg-mk-raised hover:text-mk-ink md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="hidden min-w-0 flex-1 md:block" />

          <div className="ml-auto flex shrink-0 items-center gap-2">
            {flaggedCount != null && flaggedCount > 0 ? (
              <Link
                href="/dashboard"
                className="border border-mk-line px-2.5 py-1 text-[12px] font-medium text-mk-ink transition-colors hover:border-mk-line-strong hover:bg-mk-raised"
              >
                <span className="mk-data text-[12px] text-mk-red">{flaggedCount}</span>
                <span className="ml-1.5 text-mk-ink-muted">to do</span>
              </Link>
            ) : null}

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className={`flex items-center p-1 transition-colors ${
                  profileOpen ? 'bg-mk-raised' : 'hover:bg-mk-raised'
                }`}
                aria-label="Account menu"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-mk-accent text-[11px] font-semibold text-mk-on-accent">
                  {initials}
                </div>
              </button>
              {profileOpen ? (
                <div className="absolute right-0 top-full z-50 mt-1 w-80 border border-mk-line bg-mk-canvas shadow-[var(--mk-shadow)]">
                  <div className="flex items-center gap-3 border-b border-mk-line px-4 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-mk-accent text-[12px] font-semibold text-mk-on-accent">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[14px] font-semibold text-mk-ink">
                          {displayName || user.email}
                        </p>
                        <span className="mk-eyebrow shrink-0 text-mk-accent">{badge}</span>
                      </div>
                      <p className="truncate text-[12px] text-mk-ink-subtle">{user.email}</p>
                      {user.company?.trim() ? (
                        <p className="mt-0.5 truncate text-[12px] text-mk-ink-muted">{user.company}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="border-b border-mk-line px-4 py-3.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="mk-eyebrow">Boards</span>
                      <span className="mk-data text-[11px] text-mk-ink-muted">
                        {bomLimit != null ? `${bomUsed} / ${bomLimit}` : `${bomUsed} / —`}
                      </span>
                    </div>
                    <div className="mb-3 h-1 overflow-hidden bg-mk-raised-2">
                      <div className="h-full bg-mk-accent" style={{ width: `${bomPct}%` }} />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        router.push(upgradeHref)
                        setProfileOpen(false)
                      }}
                      className="text-[12px] font-medium text-mk-accent hover:text-mk-accent-hover"
                    >
                      {upgradeLabel}
                    </button>
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
                  <button
                    type="button"
                    onClick={() => {
                      router.push('/billing')
                      setProfileOpen(false)
                    }}
                    className="flex w-full items-center px-4 py-3 text-left text-[13px] font-medium text-mk-ink transition-colors hover:bg-mk-raised"
                  >
                    Plan
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
