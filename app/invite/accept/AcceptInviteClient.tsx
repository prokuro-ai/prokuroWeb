'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { acceptTeamInvite } from '@/lib/api'
import { rememberNextPath, safeNextPath } from '@/lib/navigation'

export default function AcceptInvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const { user, loading } = useAuth()
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!token) {
      setStatus('error')
      setMessage('This invite link is missing a token.')
      return
    }
    if (!user) {
      const next = safeNextPath(`/invite/accept?token=${encodeURIComponent(token)}`, '/invite/accept')
      rememberNextPath(next)
      router.replace(`/signup?next=${encodeURIComponent(next)}`)
      return
    }
    if (status !== 'idle') return

    setStatus('working')
    acceptTeamInvite(token)
      .then(() => {
        setStatus('done')
        router.replace('/boms')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Could not accept invite')
      })
  }, [loading, user, token, router, status])

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Team invite</p>
        <h1 className="mt-2 text-[20px] font-semibold text-[#0f1b2d]">Join this Prokuro account</h1>
        <p className="mt-3 text-[14px] text-slate-500">
          {status === 'error'
            ? message
            : status === 'done'
              ? 'Invite accepted. Opening BOMs…'
              : 'Accepting your invite…'}
        </p>
        {status === 'error' ? (
          <button
            type="button"
            onClick={() => router.replace('/account')}
            className="mt-6 text-[13px] font-semibold text-[#0062ff] hover:underline"
          >
            Go to account
          </button>
        ) : null}
      </div>
    </main>
  )
}
