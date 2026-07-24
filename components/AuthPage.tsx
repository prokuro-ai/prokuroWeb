'use client'

import { useState } from 'react'
import { Link, useLocation } from '@/lib/navigation'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import { useAuth } from '@/components/AuthProvider'
import { normalizeEmail, startEmailVerification, completeEmailVerification, type EmailVerificationFlow } from '@/lib/auth'
import { mapAuthError } from '@/lib/auth-errors'
import { AuthFormField } from '@/components/auth/AuthFormField'
import { AuthError } from 'aws-amplify/auth'

const COPY = {
  heading: 'Start your free trial',
  subheading: 'Upload your first BOM in 60 seconds. No credit required.',
  switchPrompt: 'Already have an account?',
  switchCta: 'Log in',
  switchHref: '/login',
} as const

type View = 'form' | 'confirm'

export default function AuthPage() {
  const [, navigate] = useLocation()
  const { refresh } = useAuth()
  const copy = COPY

  const [view, setView] = useState<View>('form')
  const [confirmFlow, setConfirmFlow] = useState<EmailVerificationFlow>('signUp')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)

  const finishAuth = async () => {
    await refresh()
    navigate('/dashboard')
  }

  const resetToForm = () => {
    setView('form')
    setConfirmFlow('signUp')
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
      const flow = await startEmailVerification(email)
      setConfirmFlow(flow)
      setView('confirm')
    } catch (err) {
      setEmailError(mapAuthError(err, 'signUp'))
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
        setCodeError(mapAuthError(err, 'signUp'))
      } else {
        setCodeError(err instanceof Error ? err.message : 'Invalid verification code. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-mockup-scope min-h-screen flex w-full font-sans">

      {/* ── Left Panel ──────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] min-h-screen bg-[#0f1b2d] relative flex-col overflow-hidden items-center justify-center">
        <svg
          className="absolute bottom-0 left-0 w-full h-[420px] pointer-events-none"
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ color: '#1a2d47' }}
        >
          <path
            d="M50 350L150 250L250 300L350 150M150 250L100 150L200 100L350 150M100 150L30 50M200 100L250 20M350 150L380 50"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          {([
            [50, 350], [150, 250], [250, 300], [350, 150],
            [100, 150], [200, 100], [30, 50], [250, 20], [380, 50],
          ] as [number, number][]).map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="3.5" fill="currentColor" />
          ))}
        </svg>

        <div className="relative z-10 flex flex-col w-full max-w-lg px-12 xl:px-16 -translate-y-20">
          <div className="flex items-center gap-2 mb-20">
            <span
              className="h-4 w-4 bg-[#0062ff] shrink-0"
              style={{ clipPath: 'polygon(24% 0, 100% 0, 100% 100%, 0% 100%)' }}
            />
            <span className="text-[17px] font-semibold tracking-tight text-white">
              Prokuro<span className="text-[#0062ff]">.ai</span>
            </span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-5 tracking-tight">
            Reduce BOM risk<br />before it ships.
          </h1>
          <p className="text-[16px] text-slate-400 mb-12 max-w-sm leading-relaxed">
            Real-time lifecycle, tariff, and supply chain intelligence for electronics teams.
          </p>

          <ul className="space-y-4">
            {[
              'Instant EOL & NRND detection across all parts',
              'Tariff exposure by HTS code and country of origin',
              'Alternate part suggestions from validated AML',
              'Lead time alerts before they become delays',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[#0062ff] shrink-0" />
                <span className="text-slate-300 text-[15px] leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Right Panel ─────────────────────────────────────────────── */}
      <div className="w-full lg:w-[55%] bg-white flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2">
          <span
            className="h-3.5 w-3.5 bg-[#0062ff] shrink-0"
            style={{ clipPath: 'polygon(24% 0, 100% 0, 100% 100%, 0% 100%)' }}
          />
          <span className="text-[17px] font-semibold tracking-tight text-[#0f1b2d]">
            Prokuro<span className="text-[#0062ff]">.ai</span>
          </span>
        </div>

        <div className="w-full max-w-[400px] mt-10 lg:mt-0">
          {view === 'confirm' ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6">
                <svg className="w-7 h-7 text-[#0062ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#0f1b2d] mb-2 tracking-tight">Check your inbox</h2>
              <p className="text-[15px] text-[#7a8598] mb-2">
                We sent a verification code to
              </p>
              <p className="font-semibold text-[#0f1b2d] mb-6">{normalizeEmail(email)}</p>

              <form onSubmit={(e) => void handleConfirmSubmit(e)} noValidate className="space-y-4 text-left">
                <AuthFormField
                  id="signup-verification-code"
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
                <button type="button" onClick={resetToForm} className="text-[#0062ff] hover:underline font-medium">
                  Try again
                </button>
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-[28px] font-bold text-[#0f1b2d] mb-2 tracking-tight">
                  {copy.heading}
                </h2>
                <p className="text-[15px] text-[#7a8598]">
                  {copy.subheading}
                </p>
              </div>

              <GoogleSignInButton />

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-[#e8edf3]" />
                <span className="text-[13px] text-[#98a3b6] font-medium">or</span>
                <div className="flex-1 h-px bg-[#e8edf3]" />
              </div>

              <form onSubmit={(e) => void handleEmailSubmit(e)} noValidate className="space-y-4">
                <AuthFormField
                  id="signup-email"
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

              <p className="mt-5 text-center text-[12px] text-[#98a3b6]">
                By continuing, you agree to our{' '}
                <a href="#" className="text-[#0062ff] hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-[#0062ff] hover:underline">Privacy Policy</a>.
              </p>

              <div className="mt-7 pt-7 border-t border-[#f0f3f7] text-center">
                <p className="text-[15px] text-[#7a8598]">
                  {copy.switchPrompt}{' '}
                  <Link href={copy.switchHref} className="cursor-pointer font-semibold text-[#0062ff] hover:underline">
                    {copy.switchCta}
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
