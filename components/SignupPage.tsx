'use client'

import { useState } from 'react'
import { Link } from '@/lib/navigation'
import { ArrowRight } from 'lucide-react'
import { PRIVACY_PATH, TERMS_PATH } from '@/lib/legal'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import {
  startEmailVerification,
  completeEmailVerification,
  updateProfile,
  type EmailVerificationFlow,
} from '@/lib/auth'
import { mapAuthError } from '@/lib/auth-errors'
import { AuthFormField } from '@/components/auth/AuthFormField'
import AuthConfirm from '@/components/auth/AuthConfirm'
import AuthOrDivider from '@/components/auth/AuthOrDivider'
import AuthShell from '@/components/auth/AuthShell'
import { useAuthRedirect, withNextPath } from '@/components/auth/useAuthRedirect'
import { AuthError } from 'aws-amplify/auth'

type View = 'form' | 'confirm'

export default function SignupPage() {
  const { refresh, nextPath } = useAuthRedirect()

  const [view, setView] = useState<View>('form')
  const [confirmFlow, setConfirmFlow] = useState<EmailVerificationFlow>('signUp')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)

  const resetToForm = () => {
    setView('form')
    setConfirmFlow('signUp')
    setCode('')
    setEmailError(null)
    setNameError(null)
    setCodeError(null)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const first = firstName.trim()
    const last = lastName.trim()
    if (!first || !last) {
      setNameError('First and last name are required.')
      return
    }
    if (!email.trim()) {
      setEmailError('This field is required.')
      return
    }
    setLoading(true)
    setEmailError(null)
    setNameError(null)
    try {
      const flow = await startEmailVerification(email, { firstName: first, lastName: last })
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
      if (confirmFlow === 'signUp') {
        await updateProfile({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        })
      }
      await refresh()
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
    <AuthShell>
      {view === 'confirm' ? (
        <AuthConfirm
          email={email}
          code={code}
          onCodeChange={(value) => {
            setCode(value)
            if (codeError) setCodeError(null)
          }}
          onSubmit={(e) => void handleConfirmSubmit(e)}
          onRetry={resetToForm}
          loading={loading}
          error={codeError}
          fieldId="signup-verification-code"
        />
      ) : (
        <>
          <h2 className="mk-h3">Create an account</h2>
          <p className="mk-body mt-3 text-mk-ink-muted">
            Upload a BOM on the next screen. No credit card.
          </p>

          <div className="mt-8">
            <GoogleSignInButton />
          </div>

          <AuthOrDivider />

          <form onSubmit={(e) => void handleEmailSubmit(e)} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <AuthFormField
                id="signup-first-name"
                label="First name"
                value={firstName}
                onChange={(value) => {
                  setFirstName(value)
                  if (nameError) setNameError(null)
                }}
                placeholder="Ada"
                autoComplete="given-name"
              />
              <AuthFormField
                id="signup-last-name"
                label="Last name"
                value={lastName}
                onChange={(value) => {
                  setLastName(value)
                  if (nameError) setNameError(null)
                }}
                placeholder="Lovelace"
                autoComplete="family-name"
              />
            </div>
            {nameError ? (
              <p role="alert" className="mk-small -mt-2 text-mk-red">
                {nameError}
              </p>
            ) : null}
            <AuthFormField
              id="signup-email"
              label="Work email"
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
            <button
              type="submit"
              disabled={loading}
              className="mk-btn mk-btn--primary w-full disabled:opacity-60"
            >
              {loading ? 'Sending code…' : 'Get started'}
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </form>

          <p className="mk-small mt-5 text-mk-ink-subtle">
            By continuing you agree to the{' '}
            <Link href={TERMS_PATH} className="mk-inline-link">
              Terms
            </Link>{' '}
            and{' '}
            <Link href={PRIVACY_PATH} className="mk-inline-link">
              Privacy Policy
            </Link>
            .
          </p>

          <p className="mk-small mt-8 border-t border-mk-line pt-6 text-mk-ink-muted">
            Already have an account?{' '}
            <Link href={withNextPath('/login', nextPath)} className="mk-inline-link">
              Log in
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  )
}
