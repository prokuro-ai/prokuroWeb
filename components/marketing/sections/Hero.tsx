'use client'

import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import HeroVideo from '@/components/marketing/HeroVideo'
import { MARKETING_HEADLINE, MARKETING_LEAD } from '@/lib/marketing-content'
import { MagneticCta } from '@/components/marketing/motion/primitives'
import { SCHEDULE_DEMO_PATH } from '@/lib/sales'

export default function HeroSection() {
  const reduce = useReducedMotion()

  return (
    <section data-surface="dark" className="relative isolate overflow-hidden">
      <HeroVideo />
      <div className="mk-hero-scrim pointer-events-none absolute inset-0" />
      <div className="mk-grain pointer-events-none absolute inset-0" />

      <div className="mk-container relative z-10 flex min-h-[calc(100svh-3.5rem)] flex-col justify-center py-24">
        <h1 className="mk-h1 text-mk-ink">
          {MARKETING_HEADLINE.map((line, index) => (
            <span key={line} className="block overflow-hidden pb-[0.18em] -mb-[0.08em]">
              <motion.span
                className="block"
                initial={reduce ? false : { y: '110%' }}
                animate={{ y: '0%' }}
                transition={{
                  duration: 0.95,
                  delay: 0.1 + index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          className="mk-lead mt-8 max-w-[30ch] text-mk-ink-muted"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {MARKETING_LEAD}
        </motion.p>

        <motion.div
          className="mt-12"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.52, ease: [0.22, 1, 0.36, 1] }}
        >
          <MagneticCta
            href={SCHEDULE_DEMO_PATH}
            className="mk-btn mk-btn--contrast pointer-events-auto min-h-13 px-6"
          >
            Book a demo
            <ArrowRight size={16} aria-hidden="true" />
          </MagneticCta>
        </motion.div>
      </div>
    </section>
  )
}
