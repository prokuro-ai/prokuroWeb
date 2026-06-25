'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { initialsForUser, signOut } from '@/lib/auth'

export default function UserMenu() {
  const router = useRouter()
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
  const displayName = user.name.trim() || user.email

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${open ? 'bg-[#f4f6f9]' : 'hover:bg-[#f4f6f9]'}`}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0062ff] text-[10px] font-semibold text-white">
          {initials}
        </div>
        <span className="max-w-[140px] truncate text-[12px] font-medium text-[#4f5d73]">{displayName}</span>
        <svg className={`h-3.5 w-3.5 text-[#98a3b6] transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-[#d6deea] bg-white shadow-xl shadow-[#0f1b2d]/10">
          <div className="border-b border-[#f0f3f7] px-3.5 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#0062ff] text-[11px] font-semibold text-white">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-[#0f1b2d]">{displayName}</div>
                <div className="truncate text-[11px] text-[#98a3b6]">{user.email}</div>
              </div>
            </div>
          </div>
          <div className="border-t border-[#f0f3f7] py-1">
            <button
              onClick={async () => {
                setOpen(false)
                await signOut()
                await refresh()
                router.push('/login')
              }}
              className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[#f4f6f9]"
            >
              <span className="text-[13px] font-medium text-[#4f5d73]">Sign out</span>
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

  if (user) return <UserMenu />

  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-[#4f5d73] transition-colors hover:bg-[#f4f6f9] hover:text-[#0f1b2d]">
        Sign in
      </Link>
      <Link href="/signup" className="rounded-lg bg-[#0062ff] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#0050e6]">
        Start free trial
      </Link>
    </div>
  )
}
