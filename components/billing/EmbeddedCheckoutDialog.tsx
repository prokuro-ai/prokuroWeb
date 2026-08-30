'use client'

import { useMemo } from 'react'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { loadStripe, type Stripe } from '@stripe/stripe-js'

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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-[15px] font-semibold text-[#0f1b2d]">Checkout</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] font-semibold text-slate-500 hover:text-slate-800"
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {error ? (
            <p className="text-[13px] text-red-700">{error}</p>
          ) : !stripe ? (
            <p className="text-[13px] text-red-700">
              Stripe publishable key is not configured (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).
            </p>
          ) : !clientSecret ? (
            <p className="text-[13px] text-slate-500">Preparing checkout…</p>
          ) : (
            <EmbeddedCheckoutProvider stripe={stripe} options={{ clientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </div>
      </div>
    </div>
  )
}
