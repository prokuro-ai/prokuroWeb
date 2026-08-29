'use client'

import { ArrowRight, Check } from 'lucide-react'
import Reveal from '@/components/marketing/motion/Reveal'
import { MagneticCta } from '@/components/marketing/motion/primitives'
import { PUBLIC_PLANS } from '@/lib/publicPlans'
import { SCHEDULE_DEMO_PATH } from '@/lib/sales'

const ENTERPRISE = PUBLIC_PLANS.find((plan) => plan.id === 'enterprise')

export default function PricingSection({
  heading = 'Bring a real BOM. We run it on the call.',
}: {
  heading?: string
}) {
  const features = ENTERPRISE?.features ?? []

  return (
    <section id="pricing" data-surface="light" className="mk-section">
      <div className="mk-container">
        <Reveal>
          <h2 className="mk-h2 max-w-[18ch]">{heading}</h2>
          <p className="mk-lead mt-6 max-w-[44ch] text-mk-ink-muted">
            Scoped to the BOMs you want monitored and the agents you want deployed.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-12 grid border border-mk-line bg-mk-canvas lg:grid-cols-[1.1fr_1fr]">
            <div className="border-mk-line p-8 sm:p-10 lg:border-r">
              <p className="mk-eyebrow">Enterprise</p>
              <p className="mk-h2 mt-5">Custom</p>
              <p className="mk-body mt-4 max-w-[34ch] text-mk-ink-muted">
                For teams rolling out across procurement, engineering, and quality.
              </p>
              <MagneticCta
                href={SCHEDULE_DEMO_PATH}
                className="mk-btn mk-btn--primary mt-9 w-full sm:w-auto"
              >
                Book a demo
                <ArrowRight size={14} aria-hidden="true" />
              </MagneticCta>
              <p className="mk-eyebrow mt-5">
                30 minutes · your BOM · no integration
              </p>
            </div>

            <div className="border-t border-mk-line p-8 sm:p-10 lg:border-t-0">
              <p className="mk-eyebrow">What&apos;s included</p>
              <ul className="mt-6 space-y-3.5">
                {features.map((feature) => (
                  <li
                    key={feature}
                    className="mk-body flex items-start gap-3 text-mk-ink-muted"
                  >
                    <Check size={15} className="mt-1 shrink-0 text-mk-green" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
