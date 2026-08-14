'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Link } from '@/lib/navigation'
import { useAuth } from '@/components/AuthProvider'
import { displayNameForUser, initialsForUser, signOut } from '@/lib/auth'
import { listBoms } from '@/lib/api'
import {
  Bell,
  ChevronRight,
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

const PLAN_BOM_LIMIT = 20
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
]

function normalizePath(pathname: string | null): string {
  if (!pathname || pathname === '/') return '/'
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = normalizePath(usePathname())
  const { user, loading: authLoading, refresh } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [bomCount, setBomCount] = useState(0)
  const bellRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const labelClass = collapsed ? 'md:hidden' : ''
  const iconNavClass = collapsed ? 'md:justify-center md:px-0' : ''

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1')
    } catch {
      /* ignore */
    }
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
      <div className="flex h-screen items-center justify-center bg-slate-50 font-sans text-[13px] text-slate-400">
        Loading…
      </div>
    )
  }

  const initials = initialsForUser(user)
  const displayName = displayNameForUser(user)
  const bomPct = Math.min((bomCount / PLAN_BOM_LIMIT) * 100, 100)
  const settingsActive = pathname === '/account'

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-3 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors ${iconNavClass} ${
      active
        ? 'bg-blue-50 text-[#0062ff]'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
    }`

  const sidebar = (
    <aside
      className={`flex h-full w-[232px] flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ${
        collapsed ? 'md:w-16' : 'md:w-[232px]'
      }`}
    >
      <div className={`flex h-14 shrink-0 items-center border-b border-slate-200 px-4 ${collapsed ? 'md:justify-center md:px-2' : ''}`}>
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

      <nav className="flex flex-1 flex-col gap-1 p-2" aria-label="App">
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon
          const active = item.match(pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={navLinkClass(active)}
              onClick={() => setMobileOpen(false)}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className={labelClass}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto space-y-1 border-t border-slate-200 p-2">
        <Link
          href="/account"
          title={collapsed ? 'Settings' : undefined}
          className={navLinkClass(settingsActive)}
          onClick={() => setMobileOpen(false)}
        >
          <Settings className="h-[18px] w-[18px] shrink-0" />
          <span className={labelClass}>Settings</span>
        </Link>
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`${navLinkClass(false)} hidden w-full md:flex`}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-[18px] w-[18px] shrink-0" />
          ) : (
            <PanelLeftClose className="h-[18px] w-[18px] shrink-0" />
          )}
          <span className={labelClass}>Collapse</span>
        </button>
      </div>
    </aside>
  )

  return (
    <div className="relative flex h-screen bg-slate-50 font-sans text-slate-900">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-900/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebar}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 sm:px-5">
          <button
            type="button"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="hidden min-w-0 flex-1 md:block" />

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="relative" ref={bellRef}>
              <button
                type="button"
                onClick={() => setBellOpen((open) => !open)}
                className={`relative rounded-md p-1.5 transition-colors ${
                  bellOpen ? 'bg-blue-50 text-[#0062ff]' : 'text-slate-400 hover:text-slate-600'
                }`}
                aria-label="Alerts"
              >
                <Bell className="h-5 w-5" />
              </button>
              {bellOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <span className="text-sm font-bold text-slate-900">Alerts</span>
                  </div>
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm font-medium text-slate-900">Alerts coming soon</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Lifecycle, stock, and tariff alerts will appear here once monitoring is enabled.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className={`flex items-center gap-2 rounded-md p-1 transition-colors ${
                  profileOpen ? 'bg-slate-100' : 'hover:bg-slate-50'
                }`}
                aria-label="Account menu"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0062ff] text-xs font-bold text-white">
                  {initials}
                </div>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="flex items-center gap-3 border-b border-slate-100 px-4 pb-3.5 pt-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0062ff] text-sm font-bold text-white">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-[#0f1b2d]">
                          {displayName || user.email}
                        </p>
                        <span className="shrink-0 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-[#0062ff]">
                          Growth
                        </span>
                      </div>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                      {user.company?.trim() ? (
                        <p className="mt-0.5 text-xs text-slate-400">{user.company}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="border-b border-slate-100 px-4 py-3.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">Active BOMs</span>
                      <span className="text-xs text-slate-400">
                        {bomCount} / {PLAN_BOM_LIMIT}
                      </span>
                    </div>
                    <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#0062ff]" style={{ width: `${bomPct}%` }} />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        router.push('/account')
                        setProfileOpen(false)
                      }}
                      className="group flex w-full items-center justify-between text-left text-xs font-semibold text-[#0062ff]"
                    >
                      Upgrade to Scale
                      <ChevronRight className="h-3.5 w-3.5 opacity-50 transition-opacity group-hover:opacity-100" />
                    </button>
                  </div>

                  <div className="py-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        router.push('/account')
                        setProfileOpen(false)
                      }}
                      className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 transition-colors group-hover:bg-slate-200">
                        <Settings className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <span className="flex-1 text-sm font-medium text-[#0f1b2d]">Account Settings</span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-slate-400" />
                    </button>
                  </div>

                  <div className="border-t border-slate-100 p-2">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 shrink-0" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
