'use client'

import { useState } from 'react'
import { Link, useLocation } from '@/lib/navigation'
import { useAuth } from '@/components/AuthProvider'
import { normalizeEmail, signUp, confirmAccount } from '@/lib/auth'
import { mapAuthError } from '@/lib/auth-errors'
import { AuthError } from 'aws-amplify/auth'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.169 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

const COPY = {
  heading: 'Start your free trial',
  subheading: 'Upload your first BOM in 60 seconds. No credit required.',
  switchPrompt: 'Already have an account?',
  switchCta: 'Log in',
  switchHref: '/login',
} as const

const INPUT_CLASS =
  'w-full px-3 py-2.5 rounded-md border border-[#d6deea] bg-white text-[15px] text-[#0f1b2d] placeholder:text-[#98a3b6] focus:outline-none focus:ring-2 focus:ring-[#0062ff]/20 focus:border-[#0062ff] transition-all'

type FormStep = 'intro' | 'details'
type View = 'form' | 'confirm'

export default function AuthPage() {
  const [, navigate] = useLocation()
  const { refresh } = useAuth()
  const copy = COPY

  const [view, setView] = useState<View>('form')
  const [formStep, setFormStep] = useState<FormStep>('intro')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const finishAuth = async () => {
    await refresh()
    navigate('/dashboard')
  }

  const resetToIntro = () => {
    setView('form')
    setFormStep('intro')
    setCode('')
    setError(null)
  }

  const handleIntroSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setError(null)
    setFormStep('details')
  }

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const status = await signUp({ email, password, firstName, lastName, company })
      if (status === 'confirmSignUp') {
        setView('confirm')
        return
      }
      await finishAuth()
    } catch (err) {
      setError(mapAuthError(err, 'signUp'))
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

              <form onSubmit={(e) => void handleConfirmSubmit(e)} className="space-y-4 text-left">
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
                <button type="button" onClick={resetToIntro} className="text-[#0062ff] hover:underline font-medium">
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

              {formStep === 'intro' && (
                <>
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-md border border-[#d6deea] bg-white hover:bg-slate-50 text-[15px] font-medium text-[#0f1b2d] transition-colors shadow-sm mb-5 cursor-pointer"
                  >
                    <GoogleIcon />
                    Continue with Google
                  </button>

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
                  void handleSignupSubmit(e)
                }}
                className="space-y-4"
              >
                {error && (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
                )}

                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    readOnly={formStep === 'details'}
                    className={INPUT_CLASS}
                  />
                </div>

                {formStep === 'details' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        required
                        autoFocus
                        className={INPUT_CLASS}
                      />
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        required
                        className={INPUT_CLASS}
                      />
                    </div>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Company"
                      required
                      className={INPUT_CLASS}
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      minLength={8}
                      className={INPUT_CLASS}
                    />
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#0062ff] hover:bg-[#0050e6] text-white font-semibold rounded-md text-[15px] transition-colors cursor-pointer disabled:opacity-60"
                >
                  Continue with email
                </button>

                {formStep === 'details' && (
                  <button
                    type="button"
                    onClick={resetToIntro}
                    className="w-full text-center text-[13px] font-medium text-[#7a8598] hover:text-[#0f1b2d]"
                  >
                    Back
                  </button>
                )}
              </form>

              {formStep === 'intro' && (
                <>
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
