'use client'

import { useState } from 'react'
import { Link, useLocation } from '@/lib/navigation'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import { useAuth } from '@/components/AuthProvider'
import { normalizeEmail, signIn, confirmAccount } from '@/lib/auth'
import { isEmailConfirmationRequired, mapAuthError } from '@/lib/auth-errors'
import { AuthError } from 'aws-amplify/auth'

const INPUT_CLASS =
  'w-full px-3 py-2.5 rounded-md border border-[#d6deea] bg-white text-[15px] text-[#0f1b2d] placeholder:text-[#98a3b6] focus:outline-none focus:ring-2 focus:ring-[#0062ff]/20 focus:border-[#0062ff] transition-all'

type View = 'form' | 'confirm'
type FormStep = 'intro' | 'password'

export default function LoginPage() {
  const [, navigate] = useLocation()
  const { refresh } = useAuth()

  const [view, setView] = useState<View>('form')
  const [formStep, setFormStep] = useState<FormStep>('intro')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const finishAuth = async () => {
    await refresh()
    navigate('/dashboard')
  }

  const resetForm = () => {
    setView('form')
    setFormStep('intro')
    setCode('')
    setError(null)
  }

  const handleIntroSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setError(null)
    setFormStep('password')
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signIn(email, password)
      await finishAuth()
    } catch (err) {
      if (isEmailConfirmationRequired(err)) {
        setView('confirm')
        return
      }
      setError(mapAuthError(err, 'signIn'))
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await confirmAccount(email, code, password || undefined)
      await finishAuth()
    } catch (err) {
      if (err instanceof AuthError) {
        setError(mapAuthError(err, 'signUp'))
      } else {
        setError(err instanceof Error ? err.message : 'Invalid verification code. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-mockup-scope min-h-screen bg-[#f5f7fa] flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-2.5 mb-8">
        <span
          className="h-5 w-5 bg-[#0062ff] shrink-0"
          style={{ clipPath: 'polygon(24% 0, 100% 0, 100% 100%, 0% 100%)' }}
        />
        <span className="text-[21px] font-semibold tracking-tight text-[#0f1b2d]">
          Prokuro<span className="text-[#0062ff]">.ai</span>
        </span>
      </div>

      <div className="w-full max-w-[400px] bg-white rounded-xl border border-[#e8edf3] shadow-sm p-8">
        {view === 'confirm' ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7 text-[#0062ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#0f1b2d] mb-2 tracking-tight">Check your inbox</h2>
            <p className="text-[15px] text-[#7a8598] mb-2">We sent a verification code to</p>
            <p className="font-semibold text-[#0f1b2d] mb-6">{normalizeEmail(email)}</p>

            <form onSubmit={(e) => void handleConfirmSubmit(e)} className="space-y-3 text-left">
              {error && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
              )}
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Verification code"
                required
                className={INPUT_CLASS}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#0062ff] hover:bg-[#0050e6] text-white font-semibold rounded-md text-[15px] transition-colors cursor-pointer disabled:opacity-60"
              >
                Continue with email
              </button>
            </form>

            <p className="mt-5 text-[13px] text-[#7a8598]">
              Didn&apos;t get it?{' '}
              <button type="button" onClick={resetForm} className="text-[#0062ff] hover:underline font-medium">
                Try again
              </button>
            </p>
          </div>
        ) : (
          <>
            <div className="mb-7">
              <h2 className="text-[24px] font-bold text-[#0f1b2d] mb-1.5 tracking-tight">Log in to Prokuro</h2>
              <p className="text-[14px] text-[#7a8598]">BOM intelligence for hardware teams.</p>
            </div>

            {formStep === 'intro' && (
              <>
                <GoogleSignInButton />

                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-[#e8edf3]" />
                  <span className="text-[13px] text-[#98a3b6] font-medium">or</span>
                  <div className="flex-1 h-px bg-[#e8edf3]" />
                </div>
              </>
            )}

            <form
              onSubmit={(e) => {
                if (formStep === 'intro') {
                  handleIntroSubmit(e)
                  return
                }
                void handleLoginSubmit(e)
              }}
              className="space-y-3"
            >
              {error && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
              )}

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                readOnly={formStep === 'password'}
                className={INPUT_CLASS}
              />

              {formStep === 'password' && (
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  autoFocus
                  className={INPUT_CLASS}
                />
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#0062ff] hover:bg-[#0050e6] text-white font-semibold rounded-md text-[15px] transition-colors cursor-pointer disabled:opacity-60"
              >
                Continue with email
              </button>

              {formStep === 'password' && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full text-center text-[13px] font-medium text-[#7a8598] hover:text-[#0f1b2d]"
                >
                  Back
                </button>
              )}
            </form>

            {formStep === 'intro' && (
              <div className="mt-6 pt-6 border-t border-[#f0f3f7] text-center">
                <p className="text-[14px] text-[#7a8598]">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="cursor-pointer font-semibold text-[#0062ff] hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
