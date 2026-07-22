'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { initialsForUser, signOut } from '@/lib/auth'
import { dropdownPanel } from '@/lib/ui/classes'

interface AlertsMenuProps {
  open: boolean
  onToggle: () => void
  onClose: () => void
}

export default function AlertsMenu({ open, onToggle, onClose }: AlertsMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose()
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={onToggle}
        aria-label="Alerts"
        className={`relative rounded-md p-1.5 transition-colors ${open ? 'bg-blue-50 text-[#0062ff]' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <Bell className="h-5 w-5" />
      </button>
      {open && (
        <div className={`${dropdownPanel} flex w-80 flex-col`}>
          <div className="border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-bold text-slate-900">Alerts</span>
          </div>
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-medium text-slate-700">Agentic alerts are coming soon</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Proactive EOL, lead-time, and tariff notifications will appear here once monitoring is enabled.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

interface ProfileMenuProps {
  bomCount: number
  open: boolean
  onToggle: () => void
  onClose: () => void
}

export function ProfileMenu({ bomCount, open, onToggle, onClose }: ProfileMenuProps) {
  const router = useRouter()
  const { user, refresh } = useAuth()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose()
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  if (!user) return null

  const initials = initialsForUser(user)
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
  const bomLimit = 20
  const bomPct = Math.min((bomCount / bomLimit) * 100, 100)

  const handleSignOut = async () => {
    onClose()
    await signOut()
    await refresh()
    router.push('/login')
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={onToggle}
        aria-label="Account menu"
        className={`flex items-center gap-2 rounded-md p-1 transition-colors ${open ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0062ff] text-xs font-bold text-white">
          {initials}
        </div>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className={`${dropdownPanel} w-80 rounded-2xl shadow-2xl`}>
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 pb-3.5 pt-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0062ff] text-sm font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-[#0f1b2d]">{displayName}</p>
                <span className="shrink-0 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-[#0062ff]">
                  Growth
                </span>
              </div>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
              {user.company?.trim() && <p className="mt-0.5 text-xs text-slate-400">{user.company}</p>}
            </div>
          </div>

          <div className="border-b border-slate-100 px-4 py-3.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Active BOMs</span>
              <span className="text-xs text-slate-400">
                {bomCount} / {bomLimit}
              </span>
            </div>
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[#0062ff]" style={{ width: `${bomPct}%` }} />
            </div>
            <Link
              href="/account"
              onClick={onClose}
              className="group flex w-full items-center justify-between text-left text-xs font-semibold text-[#0062ff]"
            >
              Account & billing
              <span className="opacity-50 transition-opacity group-hover:opacity-100">→</span>
            </Link>
          </div>

          <div className="py-1.5">
            <Link
              href="/account"
              onClick={onClose}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
            >
              <span className="text-sm font-medium text-[#0f1b2d]">Account settings</span>
            </Link>
          </div>

          <div className="border-t border-slate-100 p-2">
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
