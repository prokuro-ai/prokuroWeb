'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { startCheckout } from '@/lib/api'
import { PLAN_LIMITS } from '@/lib/planLimits'
import ProkuroBrandLink from '@/components/ProkuroBrandLink'

const BLUE = '#0062ff'
const NAVY = '#0f1b2d'

const PLANS = [
  {
    id: 'free' as const,
    name: 'Free',
    price: '$0',
    period: '',
    blurb: 'Run one board through the analyst. Weekly refresh, small purchase pool.',
    features: [
      `${PLAN_LIMITS.free.activeBoms} active BOM · ${PLAN_LIMITS.free.maxLinesPerBom} lines`,
      `${PLAN_LIMITS.free.analysesPerMonth} analyses / mo`,
      'Weekly availability refresh',
      `${PLAN_LIMITS.free.purchasingActionsPerMonth} purchasing actions / mo`,
      'Lighter Bedrock (Haiku, capped)',
    ],
    cta: 'Start free',
    highlighted: false,
  },
  {
    id: 'growth' as const,
    name: 'Growth',
    price: '$149',
    period: '/mo',
    blurb: 'For buyers with a handful of live boards who need daily monitoring.',
    features: [
      `${PLAN_LIMITS.growth.activeBoms} active BOMs · ${PLAN_LIMITS.growth.maxLinesPerBom} lines`,
      `${PLAN_LIMITS.growth.analysesPerMonth} analyses / mo`,
      'Daily Digi-Key refresh + Bedrock analyst',
      `${PLAN_LIMITS.growth.purchasingActionsPerMonth} purchasing actions / mo`,
      'Email support',
    ],
    cta: 'Start Growth',
    highlighted: true,
  },
  {
    id: 'scale' as const,
    name: 'Scale',
    price: '$399',
    period: '/mo',
    blurb: 'For a small procurement pod living in Prokuro.',
    features: [
      `${PLAN_LIMITS.scale.activeBoms} active BOMs · ${PLAN_LIMITS.scale.maxLinesPerBom} lines`,
      `${PLAN_LIMITS.scale.analysesPerMonth} analyses / mo`,
      'Daily refresh + fuller agent headroom',
      `${PLAN_LIMITS.scale.purchasingActionsPerMonth} purchasing actions / mo`,
      'Priority support · Enterprise on request',
    ],
    cta: 'Start Scale',
    highlighted: false,
  },
]

export default function PricingPage() {
  const { user } = useAuth()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async (plan: 'growth' | 'scale') => {
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
        `${origin}/account?billing=success`,
        `${origin}/pricing?billing=cancel`,
      )
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
      setBusy(null)
    }
  }

  const handleFree = () => {
    window.location.href = user ? '/dashboard' : `/login?next=${encodeURIComponent('/dashboard')}`
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-[#0f1b2d]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <ProkuroBrandLink />
          <div className="flex items-center gap-4 text-[13px]">
            <Link href="/schedule" className="text-slate-500 hover:text-slate-800">
              Book a demo
            </Link>
            <Link href={user ? '/account' : '/login'} className="font-semibold text-[#0062ff]">
              {user ? 'Account' : 'Sign in'}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Pricing
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight" style={{ color: NAVY }}>
            Free to try. Growth and Scale when boards go live.
          </h1>
          <p className="mt-3 text-[15px] text-slate-500">
            Pay for how many BOMs you keep monitored. We cap lines so API spend cannot explode.
            Enterprise (SSO, custom volume) is sales-led.
          </p>
        </div>

        {error ? (
          <p className="mx-auto mt-6 max-w-xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-[13px] text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl border bg-white p-6 shadow-sm ${
                plan.highlighted ? 'border-[#0062ff]' : 'border-slate-200'
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold" style={{ color: NAVY }}>
                  {plan.name}
                </h2>
                {plan.highlighted ? (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#0062ff]">
                    Popular
                  </span>
                ) : null}
              </div>
              <p className="mt-3 flex items-end gap-1">
                <span className="text-3xl font-semibold" style={{ color: NAVY }}>
                  {plan.price}
                </span>
                {plan.period ? (
                  <span className="pb-1 text-sm text-slate-400">{plan.period}</span>
                ) : null}
              </p>
              <p className="mt-2 text-[13px] text-slate-500">{plan.blurb}</p>
              <ul className="mt-5 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-[13px] text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0062ff]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={busy === plan.id}
                onClick={() =>
                  plan.id === 'free' ? handleFree() : handleCheckout(plan.id)
                }
                className="mt-6 w-full rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition-opacity disabled:opacity-60"
                style={{ background: BLUE }}
              >
                {busy === plan.id ? 'Redirecting…' : plan.cta}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
