'use client'



import { Link, useLocation } from '@/lib/navigation'

import { useState } from 'react'
import ConfirmEmailForm from '@/components/ConfirmEmailForm'
import { useAuth } from '@/components/AuthProvider'
import AuthLayout from '@/components/AuthLayout'
import PasswordField from '@/components/PasswordField'
import { signIn } from '@/lib/auth'
import { isEmailConfirmationRequired, mapAuthError } from '@/lib/auth-errors'

export default function LoginPage() {
  const [, navigate] = useLocation()
  const { refresh } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null)

  const finishSignIn = async () => {
    await refresh()
    navigate('/dashboard')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const status = await signIn(email, password)
      if (status === 'confirmSignUp') {
        setConfirmEmail(email.trim().toLowerCase())
        return
      }
      await finishSignIn()
    } catch (err) {
      if (isEmailConfirmationRequired(err)) {
        setConfirmEmail(err.email)
        return
      }
      setError(mapAuthError(err, 'signIn'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-[24px] font-semibold text-[#0f1b2d]" style={{ letterSpacing: '-0.3px' }}>
            {confirmEmail ? 'Verify your email' : 'Sign in to Prokuro'}
          </h1>
          <p className="mt-2 text-[14px] text-[#7a8598]">
            {confirmEmail ? 'One more step before you can sign in.' : 'BOM intelligence for hardware teams.'}
          </p>
        </div>

        <div className="rounded-xl border border-[#d6deea] bg-white p-8 shadow-sm">
          {confirmEmail ? (
            <ConfirmEmailForm
              email={confirmEmail}
              password={password}
              onSuccess={finishSignIn}
              onCancel={() => setConfirmEmail(null)}
            />
          ) : (
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

              <PasswordField label="Password" value={password} onChange={setPassword} required />

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
          )}
        </div>

        {!confirmEmail && (
          <p className="mt-5 text-center text-[13px] text-[#7a8598]">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium !text-[#0062ff] hover:!text-[#0050e6] hover:underline">
              Start free trial
            </Link>
          </p>
        )}
      </div>
    </AuthLayout>
  )
}
