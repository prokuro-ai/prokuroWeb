'use client'

import LenisProvider from '@/components/marketing/motion/LenisProvider'
import MarketingShell from '@/components/MarketingShell'
import HeroSection from '@/components/marketing/sections/Hero'
import AgentsSection from '@/components/marketing/sections/Agents'
import DecisionSection from '@/components/marketing/sections/Decision'
import TariffSection from '@/components/marketing/sections/Tariff'
import HowItWorksSection from '@/components/marketing/sections/HowItWorks'
import PricingSection from '@/components/marketing/sections/Pricing'

/**
 * Surfaces alternate dark → light down the page. If you reorder these, keep the
 * alternation intact: two adjacent sections on the same surface read as one
 * oversized block and the page loses its rhythm.
 */
export default function MarketingLanding() {
  return (
    <LenisProvider>
      <MarketingShell surface="dark">
        <main>
          <HeroSection />
          <AgentsSection />
          <DecisionSection />
          <TariffSection />
          <HowItWorksSection />
          <PricingSection />
        </main>
      </MarketingShell>
    </LenisProvider>
  )
}
