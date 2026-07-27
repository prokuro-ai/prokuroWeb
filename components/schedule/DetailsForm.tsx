'use client'

import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createBooking } from '@/lib/calendly/client'
import type { BookingConfirmation } from '@/lib/calendly/types'
import styles from './schedule.module.css'

interface DetailsFormProps {
  startTime: string
  timeZone: string
  onBack: () => void
  onBooked: (booking: BookingConfirmation, email: string) => void
}

export default function DetailsForm({ startTime, timeZone, onBack, onBooked }: DetailsFormProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const booking = await createBooking({
        startTime,
        firstName,
        lastName,
        email,
        timezone: timeZone,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      onBooked(booking, email.trim())
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not complete your booking')
      setSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formHead}>
        <p className={styles.formTitle}>Your details</p>
        <button type="button" className={styles.backButton} onClick={onBack} disabled={submitting}>
          <ArrowLeft size={14} aria-hidden="true" />
          Change time
        </button>
      </div>

      <div className={styles.fieldRow}>
        <label className={styles.field}>
          <span className={styles.label}>First name</span>
          <input
            className={styles.input}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            autoComplete="given-name"
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Last name</span>
          <input
            className={styles.input}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            autoComplete="family-name"
            required
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Work email</span>
        <input
          className={styles.input}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          placeholder="you@company.com"
          required
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>
          Phone <span className={styles.optional}>(optional)</span>
        </span>
        <input
          className={styles.input}
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          autoComplete="tel"
          placeholder="+1 415 555 1234"
          inputMode="tel"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>
          What would you like to cover? <span className={styles.optional}>(optional)</span>
        </span>
        <textarea
          className={styles.textarea}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Board count, current sourcing tools, biggest BOM headache…"
          maxLength={2000}
        />
      </label>

      {error ? <p className={styles.errorText}>{error}</p> : null}

      <div className={styles.formFooter}>
        <button
          className={`${styles.primaryButton} ${styles.primaryButtonStatus}`}
          type="submit"
          disabled={submitting}
        >
          <span className={styles.primaryButtonLeading} aria-hidden="true">
            {submitting ? <Loader2 size={16} className={styles.spinner} /> : null}
          </span>
          <span className={styles.primaryButtonLabel}>
            {submitting ? 'Booking' : 'Confirm booking'}
          </span>
          <span className={styles.primaryButtonTrailing} aria-hidden="true" />
        </button>
      </div>
    </form>
  )
}
