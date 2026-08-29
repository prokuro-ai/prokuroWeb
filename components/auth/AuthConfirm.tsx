'use client'

import { Mail } from 'lucide-react'
import { normalizeEmail } from '@/lib/auth'
import { AuthFormField } from '@/components/auth/AuthFormField'

interface AuthConfirmProps {
  email: string
  code: string
  onCodeChange: (value: string) => void
  onSubmit: (event: React.FormEvent) => void
  onRetry: () => void
  loading: boolean
  error: string | null
  fieldId: string
}

export default function AuthConfirm({
  email,
  code,
  onCodeChange,
  onSubmit,
  onRetry,
  loading,
  error,
  fieldId,
}: AuthConfirmProps) {
  return (
    <div>
      <div className="mb-8 flex size-12 items-center justify-center border border-mk-line bg-mk-raised text-mk-ink">
        <Mail size={20} aria-hidden="true" />
      </div>
      <h2 className="mk-h3">Check your inbox</h2>
      <p className="mk-body mt-3 text-mk-ink-muted">
        We sent a verification code to{' '}
        <span className="text-mk-ink">{normalizeEmail(email)}</span>
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-4">
        <AuthFormField
          id={fieldId}
          label="Verification code"
          value={code}
          onChange={onCodeChange}
          placeholder="6-digit code"
          inputMode="numeric"
          autoComplete="one-time-code"
          error={error}
        />
        <button type="submit" disabled={loading} className="mk-btn mk-btn--primary w-full disabled:opacity-60">
          {loading ? 'Verifying…' : 'Continue'}
        </button>
      </form>

      <p className="mk-small mt-6 text-mk-ink-subtle">
        Didn&apos;t get it?{' '}
        <button type="button" onClick={onRetry} className="text-mk-ink underline decoration-mk-line-strong underline-offset-3 hover:decoration-mk-ink">
          Try again
        </button>
      </p>
    </div>
  )
}
