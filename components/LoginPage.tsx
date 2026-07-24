'use client'

import { useState } from 'react'
import { Link, useLocation } from '@/lib/navigation'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import { useAuth } from '@/components/AuthProvider'
import {
  normalizeEmail,
  startEmailLogin,
  completeEmailVerification,
  type EmailVerificationFlow,
} from '@/lib/auth'
import { mapAuthError } from '@/lib/auth-errors'
import { AuthFormField } from '@/components/auth/AuthFormField'
import { AuthError } from 'aws-amplify/auth'

type View = 'form' | 'confirm'

export default function LoginPage() {
  const [, navigate] = useLocation()
  const { refresh } = useAuth()

  const [view, setView] = useState<View>('form')
  const [confirmFlow, setConfirmFlow] = useState<EmailVerificationFlow>('signIn')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)

  const finishAuth = async () => {
    await refresh()
    navigate('/dashboard')
  }

  const resetForm = () => {
    setView('form')
    setConfirmFlow('signIn')
    setCode('')
    setEmailError(null)
    setCodeError(null)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setEmailError('This field is required.')
      return
    }
    setLoading(true)
    setEmailError(null)
    try {
      const flow = await startEmailLogin(email)
      setConfirmFlow(flow)
      setView('confirm')
    } catch (err) {
      setEmailError(mapAuthError(err, 'signIn'))
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      setCodeError('This field is required.')
      return
    }
    setLoading(true)
    setCodeError(null)
    try {
      await completeEmailVerification(email, code, confirmFlow)
      await finishAuth()
    } catch (err) {
      if (err instanceof AuthError) {
        setCodeError(mapAuthError(err, confirmFlow === 'signUp' ? 'signUp' : 'signIn'))
      } else {
        setCodeError(err instanceof Error ? err.message : 'Invalid verification code. Please try again.')
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

            <form onSubmit={(e) => void handleConfirmSubmit(e)} noValidate className="space-y-3 text-left">
              <AuthFormField
                id="login-verification-code"
                label="Verification code"
                value={code}
                onChange={(value) => {
                  setCode(value)
                  if (codeError) setCodeError(null)
                }}
                placeholder="Verification code"
                inputMode="numeric"
                autoComplete="one-time-code"
                error={codeError}
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

            <GoogleSignInButton />

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-[#e8edf3]" />
              <span className="text-[13px] text-[#98a3b6] font-medium">or</span>
              <div className="flex-1 h-px bg-[#e8edf3]" />
            </div>

            <form onSubmit={(e) => void handleEmailSubmit(e)} noValidate className="space-y-3">
              <AuthFormField
                id="login-email"
                label="Email"
                type="email"
                value={email}
                onChange={(value) => {
                  setEmail(value)
                  if (emailError) setEmailError(null)
                }}
                placeholder="Email"
                autoComplete="email"
                error={emailError}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#0062ff] hover:bg-[#0050e6] text-white font-semibold rounded-md text-[15px] transition-colors cursor-pointer disabled:opacity-60"
              >
                Continue with email
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#f0f3f7] text-center">
              <p className="text-[14px] text-[#7a8598]">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="cursor-pointer font-semibold text-[#0062ff] hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
