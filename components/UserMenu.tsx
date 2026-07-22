'use client'

import { Link, useLocation } from '@/lib/navigation'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import UserAvatar from '@/components/UserAvatar'
import { displayNameForUser, initialsForUser, signOut } from '@/lib/auth'

export default function UserMenu() {
  const [, navigate] = useLocation()
  const { user, refresh } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  if (!user) return null

  const initials = initialsForUser(user)
  const displayName = displayNameForUser(user)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${open ? 'bg-[#f4f6f9]' : 'hover:bg-[#f4f6f9]'}`}
      >
        <UserAvatar initials={initials} size="xs" />
        <span className="max-w-[140px] truncate text-[12px] font-medium text-[#4f5d73]">{displayName}</span>
        <svg
          className={`h-3.5 w-3.5 text-[#98a3b6] transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-[#d6deea] bg-white shadow-xl shadow-[#0f1b2d]/10">
          <div className="border-b border-[#f0f3f7] px-3.5 py-3">
            <div className="flex items-center gap-2.5">
              <UserAvatar initials={initials} size="sm" />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-[#0f1b2d]">{displayName}</div>
                <div className="truncate text-[11px] text-[#98a3b6]">{user.email}</div>
              </div>
            </div>
          </div>

          <div className="py-1">
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-[#f4f6f9]"
            >
              <svg className="h-4 w-4 flex-shrink-0 text-[#98a3b6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <div className="text-[13px] font-medium text-[#0f1b2d]">Settings</div>
            </Link>
          </div>

          <div className="border-t border-[#f0f3f7] py-1">
            <button
              type="button"
              onClick={async () => {
                setOpen(false)
                await signOut()
                await refresh()
                navigate('/login')
              }}
              className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[#f4f6f9]"
            >
              <svg className="h-4 w-4 flex-shrink-0 text-[#98a3b6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <div className="text-[13px] font-medium text-[#da1e28]">Sign out</div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function AuthHeaderActions() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (user) {
    return <UserMenu />
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className="text-[13px] font-medium text-[#4f5d73] transition-colors hover:text-[#0f1b2d]">
        Sign in
      </Link>
      <Link
        href="/signup"
        className="rounded-md bg-[#0062ff] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#0050e6]"
      >
        Get started
      </Link>
    </div>
  )
}

export function MarketingAuthActions() {
  const { user, loading } = useAuth()
  const [, navigate] = useLocation()

  if (loading) return null

  return (
    <>
      <Link href="/login" className="nav-text-link">
        Sign in
      </Link>
      <button
        className="btn btn--primary btn--nav"
        onClick={() => navigate(user ? '/dashboard' : '/login')}
      >
        Try Prokuro
      </button>
    </>
  )
}
