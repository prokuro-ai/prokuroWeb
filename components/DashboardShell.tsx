'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link } from '@/lib/navigation'
import { useAuth } from '@/components/AuthProvider'
import { signOut } from '@/lib/auth'
import { getBillingStatus, type BillingAccountStatus } from '@/lib/api'
import { limitsFor, planLabel } from '@/lib/planLimits'
import {
  Bell,
  ChevronRight,
  LogOut,
  Search,
  Settings,
} from 'lucide-react'

type DashboardTab = 'dashboard' | 'boms'

type DashboardShellProps = {
  children: React.ReactNode
  activeTab?: DashboardTab
  /** Active BOM count shown in the profile dropdown plan usage meter. */
  bomCount?: number
  /** Public demo mode: nav stays on /demo and profile is read-only. */
  demoMode?: boolean
}

export default function DashboardShell({
  children,
  activeTab = 'dashboard',
  bomCount = 0,
  demoMode = false,
}: DashboardShellProps) {
  const router = useRouter()
  const { user, refresh } = useAuth()
  const [bellOpen, setBellOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [billing, setBilling] = useState<BillingAccountStatus | null>(null)
  const bellRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const newAlertCount = 0
  const initials = demoMode
    ? 'DM'
    : user
      ? (user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')
      : 'U'

  const basePath = demoMode ? '/demo' : '/dashboard'
  const nav = [
    { id: 'dashboard' as const, label: 'Dashboard', href: `${basePath}?tab=dashboard` },
    { id: 'boms' as const, label: 'BOMs', href: `${basePath}?tab=boms` },
  ]

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (demoMode || !user) return
    getBillingStatus()
      .then(setBilling)
      .catch(() => setBilling({ plan: 'free', status: 'none', can_purchase: true }))
  }, [demoMode, user])

  const handleSignOut = async () => {
    await signOut()
    await refresh()
    router.push('/login')
  }

  const activePlan = billing?.plan ?? 'free'
  const bomLimit = billing?.limits?.active_boms ?? limitsFor(activePlan).activeBoms
  const bomPct = Math.min((bomCount / bomLimit) * 100, 100)
  const badge = demoMode ? 'Demo' : planLabel(activePlan)
  const upgradeLabel =
    activePlan === 'free' ? 'Upgrade to Growth' : activePlan === 'growth' ? 'Upgrade to Scale' : 'Manage billing'
  const upgradeHref = activePlan === 'scale' ? '/account' : '/pricing'

  return (
    <div className="relative flex h-screen flex-col bg-slate-50 font-sans text-slate-900">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex h-full min-w-0 items-center gap-4 sm:gap-8">
          <Link href={basePath} className="flex shrink-0 items-center gap-2">
            <span
              className="h-4 w-4 shrink-0 bg-[#0062ff]"
              style={{ clipPath: 'polygon(24% 0, 100% 0, 100% 100%, 0% 100%)' }}
            />
            <span className="text-[17px] font-semibold tracking-tight text-[#0f1b2d]">
              Prokuro<span className="text-[#0062ff]">.ai</span>
            </span>
          </Link>
          <nav className="flex h-full items-center">
            {nav.map(({ id, label, href }) => (
              <Link
                key={id}
                href={href}
                className={`relative flex h-full items-center gap-2 border-b-2 px-2.5 text-sm font-medium transition-colors sm:px-4 ${
                  activeTab === id
                    ? 'border-[#0062ff] text-[#0f1b2d]'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search parts, BOMs…"
              className="w-44 rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#0062ff] lg:w-56"
            />
          </div>

          <div className="relative" ref={bellRef}>
            <button
              type="button"
              onClick={() => setBellOpen((open) => !open)}
              className={`relative rounded-md p-1.5 transition-colors ${
                bellOpen ? 'bg-blue-50 text-[#0062ff]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Bell className="h-5 w-5" />
              {newAlertCount > 0 && (
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full border border-white bg-red-500" />
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 flex w-80 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <span className="text-sm font-bold text-slate-900">Alerts</span>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                    {newAlertCount} New
                  </span>
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
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0062ff] text-xs font-bold text-white">
                {initials.toUpperCase()}
              </div>
              <svg
                className={`h-4 w-4 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center gap-3 border-b border-slate-100 px-4 pb-3.5 pt-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0062ff] text-sm font-bold text-white">
                    {initials.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-[#0f1b2d]">
                        {demoMode
                          ? 'Demo Viewer'
                          : user
                            ? `${user.firstName} ${user.lastName}`.trim() || user.email
                            : 'Account'}
                      </p>
                      <span className="shrink-0 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-[#0062ff]">
                        {badge}
                      </span>
                    </div>
                    <p className="truncate text-xs text-slate-500">
                      {demoMode ? 'demo@prokuro.ai' : (user?.email ?? '')}
                    </p>
                    {demoMode ? (
                      <p className="mt-0.5 text-xs text-slate-400">Sample portfolio · read-only</p>
                    ) : (
                      user?.company?.trim() && (
                        <p className="mt-0.5 text-xs text-slate-400">{user.company}</p>
                      )
                    )}
                  </div>
                </div>

                {!demoMode && (
                  <div className="border-b border-slate-100 px-4 py-3.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">Active BOMs</span>
                      <span className="text-xs text-slate-400">{bomCount} / {bomLimit}</span>
                    </div>
                    <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#0062ff]"
                        style={{ width: `${bomPct}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        router.push(upgradeHref)
                        setProfileOpen(false)
                      }}
                      className="group flex w-full items-center justify-between text-left text-xs font-semibold text-[#0062ff]"
                    >
                      {upgradeLabel}
                      <ChevronRight className="h-3.5 w-3.5 opacity-50 transition-opacity group-hover:opacity-100" />
                    </button>
                  </div>
                )}

                <div className="py-1.5">
                  {demoMode ? (
                    <Link
                      href="/"
                      onClick={() => setProfileOpen(false)}
                      className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 transition-colors group-hover:bg-slate-200">
                        <Settings className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <span className="flex-1 text-sm font-medium text-[#0f1b2d]">Back to home</span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-slate-400" />
                    </Link>
                  ) : (
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
                  )}
                </div>

                {!demoMode && (
                  <div className="border-t border-slate-100 p-2">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 shrink-0" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  )
}
