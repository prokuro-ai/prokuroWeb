'use client'

import { ArrowRight } from 'lucide-react'
import Reveal from '@/components/marketing/motion/Reveal'
import { MagneticCta } from '@/components/marketing/motion/primitives'
import { SCHEDULE_DEMO_PATH } from '@/lib/sales'

export default function PricingSection() {
  return (
    <section id="pricing" data-surface="light" className="mk-section">
      <div className="mk-container">
        <Reveal>
          <h2 className="mk-h2 max-w-[16ch]">See how Prokuro fits your workflow.</h2>
          <p className="mk-lead mt-6 max-w-[36ch] text-mk-ink-muted">
            A short call to learn how you buy and get your team onboarded.
          </p>
          <MagneticCta
            href={SCHEDULE_DEMO_PATH}
            className="mk-btn mk-btn--contrast mt-8 min-h-13 px-6"
          >
            Book a demo
            <ArrowRight size={16} aria-hidden="true" />
          </MagneticCta>
        </Reveal>
      </div>
    </section>
  )
}
