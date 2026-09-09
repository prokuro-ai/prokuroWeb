'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { appField } from '@/components/app/chrome'
import { useTeam } from '@/hooks/use-team'

function Field({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  inputMode?: 'text' | 'numeric'
  maxLength?: number
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-mk-ink-subtle">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        className={appField}
      />
    </label>
  )
}

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export default function BillingPane() {
  const { user } = useAuth()
  const { canManage } = useTeam()
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [postal, setPostal] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
    setCardName((current) => current || name)
  }, [user])

  if (!user) return null

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-mk-ink-muted">
        Pay the signed contract with a company card. Charges are not taken in the product yet.
      </p>

      {!canManage ? (
        <p className="text-[13px] text-mk-ink-muted">Only owners and editors can add a card.</p>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            setNotice('Card payments are not connected yet. The card is not stored.')
          }}
        >
          <Field
            label="Name on card"
            value={cardName}
            onChange={setCardName}
            placeholder="Jamie Chen"
            autoComplete="cc-name"
          />
          <Field
            label="Card number"
            value={cardNumber}
            onChange={(value) => setCardNumber(formatCardNumber(value))}
            placeholder="ACCT-000015"
            autoComplete="cc-number"
            inputMode="numeric"
            maxLength={19}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Expiry"
              value={expiry}
              onChange={(value) => setExpiry(formatExpiry(value))}
              placeholder="MM/YY"
              autoComplete="cc-exp"
              inputMode="numeric"
              maxLength={5}
            />
            <Field
              label="CVC"
              value={cvc}
              onChange={(value) => setCvc(value.replace(/\D/g, '').slice(0, 4))}
              placeholder="123"
              autoComplete="cc-csc"
              inputMode="numeric"
              maxLength={4}
            />
          </div>
          <Field
            label="ZIP / postal code"
            value={postal}
            onChange={setPostal}
            placeholder="94107"
            autoComplete="postal-code"
          />
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-[8px] bg-mk-accent px-4 text-[13px] font-medium text-mk-canvas transition-colors hover:bg-mk-accent-hover"
            >
              Pay
            </button>
          </div>
          {notice ? <p className="text-[12px] text-mk-ink-muted">{notice}</p> : null}
        </form>
      )}
    </div>
  )
}
