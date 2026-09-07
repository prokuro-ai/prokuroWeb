'use client'

import { useMemo } from 'react'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { AppModal, ModalNotice } from '@/components/AppModal'

let stripePromise: Promise<Stripe | null> | null = null

function stripeBrowser(): Promise<Stripe | null> | null {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()
  if (!key) return null
  if (!stripePromise) stripePromise = loadStripe(key)
  return stripePromise
}

export default function EmbeddedCheckoutDialog({
  open,
  clientSecret,
  onClose,
  error,
}: {
  open: boolean
  clientSecret: string | null
  onClose: () => void
  error?: string | null
}) {
  const stripe = useMemo(() => stripeBrowser(), [])

  return (
    <AppModal open={open} onClose={onClose} eyebrow="Checkout" title="Complete payment" maxWidth="md">
      {error ? <ModalNotice tone="error">{error}</ModalNotice> : null}
      {!error && !stripe ? (
        <ModalNotice tone="error">
          Stripe publishable key is not configured (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).
        </ModalNotice>
      ) : null}
      {!error && stripe && !clientSecret ? (
        <p className="text-[13px] text-mk-ink-muted">Preparing checkout…</p>
      ) : null}
      {!error && stripe && clientSecret ? (
        <EmbeddedCheckoutProvider stripe={stripe} options={{ clientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      ) : null}
    </AppModal>
  )
}
