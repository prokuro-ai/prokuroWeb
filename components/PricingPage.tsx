'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { startCheckout } from '@/lib/api'
import { PUBLIC_PLANS } from '@/lib/publicPlans'
import MarketingShell from '@/components/MarketingShell'
import { APP_PRICING_URL, APP_SIGNUP_URL, SCHEDULE_DEMO_PATH } from '@/lib/sales'
import { SELF_SERVE_ENABLED } from '@/lib/access'

export default function PricingPage() {
  const { user } = useAuth()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async (plan: 'growth' | 'scale') => {
    if (!SELF_SERVE_ENABLED) {
      window.location.href = APP_PRICING_URL
      return
    }
    if (!user) {
      window.location.href = `/login?next=${encodeURIComponent('/pricing')}`
      return
    }
    setBusy(plan)
    setError(null)
    try {
      const origin = window.location.origin
      const url = await startCheckout(
        plan,
        `${origin}/billing?billing=success`,
        `${origin}/billing?billing=cancel`,
      )
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
      setBusy(null)
    }
  }

  const handleFree = () => {
    if (!SELF_SERVE_ENABLED) {
      window.location.href = APP_SIGNUP_URL
      return
    }
    window.location.href = user ? '/dashboard' : `/login?next=${encodeURIComponent('/dashboard')}`
  }

  return (
    <MarketingShell surface="light">
      <main data-surface="light" className="mk-section">
        <div className="mk-container">
          <p className="mk-eyebrow">Pricing</p>
          <h1 className="mk-h2 mt-4 max-w-3xl">
            Free to try. Growth and Scale when boards go live.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-mk-ink-muted">
            Pay for how many BOMs you keep monitored. We cap lines so API spend cannot explode.
            Enterprise adds SSO, custom volume, and white-glove rollout.
          </p>

          {error ? (
            <p className="mt-6 max-w-xl border border-mk-red/30 bg-mk-red/10 px-4 py-3 text-sm text-mk-red">
              {error}
            </p>
          ) : null}

          <div className="mt-12 grid gap-px bg-mk-line md:grid-cols-2 xl:grid-cols-4">
            {PUBLIC_PLANS.map((plan) => (
              <article key={plan.id} className="flex flex-col bg-mk-canvas p-7">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg font-medium">{plan.name}</h2>
                  {plan.highlighted ? (
                    <span className="font-mk-mono text-[10px] uppercase tracking-[0.14em] text-mk-accent">
                      Popular
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 font-mk-mono text-3xl tracking-tight">
                  {plan.price}
                  {plan.period ? <span className="text-sm text-mk-ink-subtle">{plan.period}</span> : null}
                </p>
                <p className="mt-3 text-sm leading-6 text-mk-ink-muted">{plan.blurb}</p>
                <ul className="mt-6 flex-1 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-mk-ink-muted">
                      <Check size={14} className="mt-1 text-mk-green" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={busy === plan.id}
                  onClick={() => {
                    if (plan.salesLed) {
                      window.location.href = SCHEDULE_DEMO_PATH
                      return
                    }
                    if (plan.id === 'free') {
                      handleFree()
                      return
                    }
                    handleCheckout(plan.id as 'growth' | 'scale')
                  }}
                  className={`mk-btn mt-8 w-full ${plan.highlighted ? 'mk-btn--primary' : 'mk-btn--ghost'}`}
                >
                  {busy === plan.id ? 'Redirecting…' : plan.cta}
                </button>
              </article>
            ))}
          </div>
        </div>
      </main>
    </MarketingShell>
  )
}
