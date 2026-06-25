'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import AuthLayout from '@/components/AuthLayout'
import { signIn } from '@/lib/auth'

function authErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
  return 'Could not sign in. Check your email and password.'
}

export default function LoginPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signIn(email, password)
      await refresh()
      router.push('/dashboard')
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-[24px] font-semibold text-[#0f1b2d]" style={{ letterSpacing: '-0.3px' }}>
            Sign in to Prokuro
          </h1>
          <p className="mt-2 text-[14px] text-[#7a8598]">BOM intelligence for hardware teams.</p>
        </div>

        <div className="rounded-xl border border-[#d6deea] bg-white p-8 shadow-sm">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
            )}

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#0f1b2d]">Work email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full rounded-md border border-[#d6deea] bg-white px-3 py-2 text-[14px] text-[#0f1b2d] placeholder:text-[#98a3b6] focus:border-[#0062ff] focus:outline-none focus:ring-1 focus:ring-[#0062ff]"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[13px] font-medium text-[#0f1b2d]">Password</label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-md border border-[#d6deea] bg-white px-3 py-2 text-[14px] text-[#0f1b2d] placeholder:text-[#98a3b6] focus:border-[#0062ff] focus:outline-none focus:ring-1 focus:ring-[#0062ff]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 bg-[#0062ff] px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#0050e6] disabled:opacity-60"
            >
              {loading ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              Sign in
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[13px] text-[#7a8598]">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-[#0062ff] hover:underline">
            Start free trial
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
