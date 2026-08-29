'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Link } from '@/lib/navigation'
import { useAuth } from '@/components/AuthProvider'
import { displayNameForUser, initialsForUser, signOut } from '@/lib/auth'
import { getBillingStatus, listBoms, type BillingAccountStatus } from '@/lib/api'
import { planLabel } from '@/lib/planLimits'
import {
  Bell,
  CreditCard,
  Files,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShoppingCart,
  X,
} from 'lucide-react'

const SIDEBAR_COLLAPSED_KEY = 'prokuro.sidebar.collapsed'

type NavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  match: (pathname: string) => boolean
}

const PRIMARY_NAV: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: LayoutDashboard,
    match: (pathname) => pathname === '/dashboard',
  },
  {
    href: '/boms',
    label: 'BOMs',
    icon: Files,
    match: (pathname) => pathname === '/boms' || pathname.startsWith('/bom'),
  },
  {
    href: '/purchasing',
    label: 'Purchasing',
    icon: ShoppingCart,
    match: (pathname) => pathname === '/purchasing',
  },
  {
    href: '/billing',
    label: 'Billing',
    icon: CreditCard,
    match: (pathname) => pathname === '/billing',
  },
]

function normalizePath(pathname: string | null): string {
  if (!pathname || pathname === '/') return '/'
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

function navClass(active: boolean, collapsed: boolean) {
  return `relative flex items-center gap-3 px-3 py-2 text-[13px] font-medium transition-colors ${
    collapsed ? 'md:justify-center md:px-0' : ''
  } ${
    active
      ? 'bg-[#f4f6f9] text-slate-900'
      : 'text-slate-500 hover:bg-[#f4f6f9] hover:text-slate-800'
  }`
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = normalizePath(usePathname())
  const { user, loading: authLoading, refresh } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarReady, setSidebarReady] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [bomCount, setBomCount] = useState(0)
  const [billing, setBilling] = useState<BillingAccountStatus | null>(null)
  const bellRef = useRef<HTMLDivElement>(null)
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
    setBellOpen(false)
    setProfileOpen(false)
  }, [pathname])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
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
      <div className="flex h-screen items-center justify-center bg-[#f4f6f9] font-sans text-[13px] text-slate-400">
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
  const bomPct =
    bomLimit != null && bomLimit > 0 ? Math.min((bomUsed / bomLimit) * 100, 100) : 0
  const badge = billingReady ? planLabel(activePlan!) : '…'
  const upgradeLabel = !billingReady
    ? 'Billing unavailable'
    : activePlan === 'free'
      ? 'Upgrade to Growth'
      : activePlan === 'growth'
        ? 'Upgrade to Scale'
        : 'Manage billing'
  const upgradeHref = !billingReady
    ? '/billing'
    : activePlan === 'scale'
      ? '/billing'
      : '/billing?plans=1'
  const settingsActive = pathname === '/account'

  return (
    <div className="relative flex h-screen bg-[#f4f6f9] font-sans text-slate-900">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-900/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div
        className={`fixed inset-y-0 left-0 z-50 md:static md:z-auto md:translate-x-0 ${
          sidebarReady ? 'transition-transform duration-200 md:transition-none' : ''
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <aside
          className={`flex h-full w-[232px] flex-col border-r border-slate-200 bg-white ${
            sidebarReady ? 'md:transition-[width] md:duration-200' : ''
          } ${collapsed ? 'md:w-16' : 'md:w-[232px]'}`}
        >
          <div
            className={`flex h-14 shrink-0 items-center border-b border-slate-200 px-4 ${
              collapsed ? 'md:justify-center md:px-2' : ''
            }`}
          >
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2" onClick={() => setMobileOpen(false)}>
              <span
                className="h-4 w-4 shrink-0 bg-[#0062ff]"
                style={{ clipPath: 'polygon(24% 0, 100% 0, 100% 100%, 0% 100%)' }}
              />
              <span className={`truncate text-[16px] font-semibold tracking-tight text-[#0f1b2d] ${labelClass}`}>
                Prokuro<span className="text-[#0062ff]">.ai</span>
              </span>
            </Link>
          </div>

          <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="App">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon
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
                    <span className="absolute inset-y-0 left-0 w-[2px] bg-[#0062ff]" aria-hidden />
                  ) : null}
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className={labelClass}>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto border-t border-slate-200 p-2">
            <Link
              href="/account"
              title={collapsed ? 'Settings' : undefined}
              className={navClass(settingsActive, collapsed)}
              onClick={() => setMobileOpen(false)}
            >
              {settingsActive ? (
                <span className="absolute inset-y-0 left-0 w-[2px] bg-[#0062ff]" aria-hidden />
              ) : null}
              <Settings className="h-4 w-4 shrink-0" />
              <span className={labelClass}>Settings</span>
            </Link>
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
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 sm:px-5">
          <button
            type="button"
            className="p-1.5 text-slate-500 hover:bg-[#f4f6f9] hover:text-slate-800 md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="hidden min-w-0 flex-1 md:block" />

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <div className="relative" ref={bellRef}>
              <button
                type="button"
                onClick={() => setBellOpen((open) => !open)}
                className={`relative p-1.5 transition-colors ${
                  bellOpen ? 'bg-[#f4f6f9] text-slate-900' : 'text-slate-400 hover:text-slate-700'
                }`}
                aria-label="Alerts"
              >
                <Bell className="h-5 w-5" />
              </button>
              {bellOpen ? (
                <div className="absolute right-0 top-full z-50 mt-1 w-80 border border-slate-200 bg-white shadow-[0_18px_40px_-28px_rgb(15_27_45_/_30%)]">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-slate-400">Alerts</p>
                  </div>
                  <div className="px-4 py-8 text-center">
                    <p className="text-[14px] font-medium text-slate-800">Alerts coming soon</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
                      Lifecycle, stock, and tariff alerts will appear here once monitoring is enabled.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className={`flex items-center p-1 transition-colors ${
                  profileOpen ? 'bg-[#f4f6f9]' : 'hover:bg-[#f4f6f9]'
                }`}
                aria-label="Account menu"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#0062ff] text-[11px] font-semibold text-white">
                  {initials}
                </div>
              </button>
              {profileOpen ? (
                <div className="absolute right-0 top-full z-50 mt-1 w-80 border border-slate-200 bg-white shadow-[0_18px_40px_-28px_rgb(15_27_45_/_30%)]">
                  <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#0062ff] text-[12px] font-semibold text-white">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[14px] font-semibold text-slate-900">
                          {displayName || user.email}
                        </p>
                        <span className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#0062ff]">
                          {badge}
                        </span>
                      </div>
                      <p className="truncate font-mono text-[11px] text-slate-400">{user.email}</p>
                      {user.company?.trim() ? (
                        <p className="mt-0.5 truncate text-[12px] text-slate-500">{user.company}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="border-b border-slate-200 px-4 py-3.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-400">
                        Active BOMs
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-slate-600">
                        {bomLimit != null ? `${bomUsed} / ${bomLimit}` : `${bomUsed} / —`}
                      </span>
                    </div>
                    <div className="mb-3 h-1.5 overflow-hidden bg-slate-100">
                      <div className="h-full bg-[#0062ff]" style={{ width: `${bomPct}%` }} />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        router.push(upgradeHref)
                        setProfileOpen(false)
                      }}
                      className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#0062ff] hover:underline"
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
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f4f6f9]"
                  >
                    <Settings className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="text-[13px] font-medium text-slate-800">Account settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      router.push('/billing')
                      setProfileOpen(false)
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f4f6f9]"
                  >
                    <CreditCard className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="text-[13px] font-medium text-slate-800">Billing</span>
                  </button>

                  <div className="border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-medium text-[#c62026] transition-colors hover:bg-[#f4f6f9]"
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
