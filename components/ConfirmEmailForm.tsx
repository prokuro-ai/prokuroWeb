'use client'

import { useState } from 'react'
import { confirmAccount } from '@/lib/auth'
import { mapAuthError } from '@/lib/auth-errors'
import { AuthError } from 'aws-amplify/auth'

interface ConfirmEmailFormProps {
  email: string
  password?: string
  onSuccess: () => void | Promise<void>
  onCancel?: () => void
}

export default function ConfirmEmailForm({ email, password, onSuccess, onCancel }: ConfirmEmailFormProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await confirmAccount(email, code, password)
      await onSuccess()
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
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <p className="text-[13px] leading-relaxed text-[#4f5d73]">
        Enter the verification code sent to <span className="font-medium text-[#0f1b2d]">{email}</span>.
      </p>
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
      )}
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-[#0f1b2d]">Verification code</label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="123456"
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
        Verify email
      </button>
      {onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          className="w-full text-center text-[13px] font-medium text-[#7a8598] hover:text-[#0f1b2d]"
        >
          Back
        </button>
      ) : null}
    </form>
  )
}
