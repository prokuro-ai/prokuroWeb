'use client'

import { useState } from 'react'
import { Link } from '@/lib/navigation'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import {
  startEmailLogin,
  completeEmailVerification,
  type EmailVerificationFlow,
} from '@/lib/auth'
import { mapAuthError } from '@/lib/auth-errors'
import { AuthFormField } from '@/components/auth/AuthFormField'
import AuthConfirm from '@/components/auth/AuthConfirm'
import AuthOrDivider from '@/components/auth/AuthOrDivider'
import { useAuthRedirect, withNextPath } from '@/components/auth/useAuthRedirect'
import { AuthError } from 'aws-amplify/auth'
import { ProkuroWordmark } from '@/components/brand/ProkuroLogo'

type View = 'form' | 'confirm'

export default function LoginPage() {
  const { refresh, nextPath } = useAuthRedirect()

  const [view, setView] = useState<View>('form')
  const [confirmFlow, setConfirmFlow] = useState<EmailVerificationFlow>('signIn')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)

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
      await refresh()
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
    <div data-surface="light" className="font-mk-sans flex min-h-screen flex-col items-center justify-center bg-mk-raised p-6 text-mk-ink antialiased">
      <Link href="/" className="mb-8 inline-flex text-mk-ink">
        <ProkuroWordmark size={22} />
      </Link>

      <div className="w-full max-w-[400px] border border-mk-line bg-mk-canvas p-8">
        {view === 'confirm' ? (
          <AuthConfirm
            email={email}
            code={code}
            onCodeChange={(value) => {
              setCode(value)
              if (codeError) setCodeError(null)
            }}
            onSubmit={(e) => void handleConfirmSubmit(e)}
            onRetry={resetForm}
            loading={loading}
            error={codeError}
            fieldId="login-verification-code"
          />
        ) : (
          <>
            <h2 className="mk-h3">Log in to Prokuro</h2>
            <p className="mk-small mt-2 text-mk-ink-muted">Use your work email. We&apos;ll send a code.</p>

            <div className="mt-7">
              <GoogleSignInButton />
            </div>

            <AuthOrDivider />

            <form onSubmit={(e) => void handleEmailSubmit(e)} noValidate className="space-y-4">
              <AuthFormField
                id="login-email"
                label="Email"
                type="email"
                value={email}
                onChange={(value) => {
                  setEmail(value)
                  if (emailError) setEmailError(null)
                }}
                placeholder="you@company.com"
                autoComplete="email"
                error={emailError}
              />
              <button type="submit" disabled={loading} className="mk-btn mk-btn--primary w-full disabled:opacity-60">
                {loading ? 'Sending code…' : 'Continue with email'}
              </button>
            </form>

            <p className="mk-small mt-6 border-t border-mk-line pt-6 text-center text-mk-ink-muted">
              Don&apos;t have an account?{' '}
              <Link href={withNextPath('/signup', nextPath)} className="mk-inline-link">
                Sign up
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
