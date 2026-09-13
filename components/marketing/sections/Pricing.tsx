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
          <h2 className="mk-h2 max-w-[16ch]">Bring a BOM. We&apos;ll run it.</h2>
          <p className="mk-lead mt-6 max-w-[36ch] text-mk-ink-muted">
            Thirty minutes on a BOM from your stack.
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
