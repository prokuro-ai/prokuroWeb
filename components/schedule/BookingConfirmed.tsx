'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { cancelBooking } from '@/lib/calendly/client'
import type { BookingConfirmation } from '@/lib/calendly/types'
import { formatConfirmation } from '@/lib/schedule/datetime'
import styles from './schedule.module.css'

interface BookingConfirmedProps {
  booking: BookingConfirmation
  email: string
  onBookAnother: () => void
}

export default function BookingConfirmed({ booking, email, onBookAnother }: BookingConfirmedProps) {
  const [canceling, setCanceling] = useState(false)
  const [canceled, setCanceled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCancel() {
    setCanceling(true)
    setError(null)
    try {
      if (!booking.eventUri) {
        throw new Error(
          'This booking is missing cancel details. Use the link in your calendar invite, or book again.',
        )
      }
      await cancelBooking(booking.eventUri, 'Invitee canceled via Prokuro')
      setCanceled(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel booking')
    } finally {
      setCanceling(false)
    }
  }

  if (canceled) {
    return (
      <div className={styles.confirmation}>
        <h2 className={styles.confirmationTitle}>Booking canceled</h2>
        <p className={styles.confirmationCopy}>
          Your demo for {formatConfirmation(booking.startTime)} has been canceled. A cancellation
          notice was sent to {email}.
        </p>
        <div className={styles.confirmationActions}>
          <button type="button" className={styles.primaryButton} onClick={onBookAnother}>
            Book another time
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.confirmation}>
      <span className={styles.confirmationIcon} aria-hidden="true">
        <Check size={24} />
      </span>

      <h2 className={styles.confirmationTitle}>You are booked</h2>
      <p className={styles.confirmationTime}>{formatConfirmation(booking.startTime)}</p>
      <p className={styles.confirmationCopy}>
        We sent the calendar invite and video link to {email}. Reply to that invite if you want to
        share a BOM ahead of the call.
      </p>

      {error ? <p className={styles.errorText}>{error}</p> : null}

      <div className={styles.confirmationActions}>
        <button type="button" className={styles.primaryButton} onClick={onBookAnother} disabled={canceling}>
          Book another time
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleCancel}
          disabled={canceling}
        >
          {canceling ? 'Canceling…' : 'Cancel'}
        </button>
      </div>
    </div>
  )
}
