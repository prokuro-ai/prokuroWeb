'use client'

import Link from 'next/link'
import { useState } from 'react'
import AuthLayout from '@/components/AuthLayout'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => setLoading(false), 400)
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
          <form onSubmit={handleSubmit} className="space-y-5">
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
                <a href="#" className="text-[12px] text-[#0062ff] hover:underline">
                  Forgot password?
                </a>
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

          <p className="mt-4 rounded-md border border-[#d6deea] bg-[#f4f6f9] px-3 py-2.5 text-center text-[12px] text-[#7a8598]">
            Account sign-in is not available yet.{' '}
            <Link href="/bom/new" className="font-medium text-[#0062ff] hover:underline">
              Upload a BOM
            </Link>{' '}
            to try the analyzer.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#d6deea]" />
            <span className="text-[12px] text-[#98a3b6]">or</span>
            <div className="h-px flex-1 bg-[#d6deea]" />
          </div>

          <button className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-md border border-[#d6deea] bg-white px-4 py-2.5 text-[13px] font-medium text-[#0f1b2d] transition-colors hover:bg-[#f4f6f9]">
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
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
