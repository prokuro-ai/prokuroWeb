'use client'

import LenisProvider from '@/components/marketing/motion/LenisProvider'
import MarketingShell from '@/components/MarketingShell'
import HeroSection from '@/components/marketing/sections/Hero'
import AgentsSection from '@/components/marketing/sections/Agents'
import TariffSection from '@/components/marketing/sections/Tariff'
import HowItWorksSection from '@/components/marketing/sections/HowItWorks'
import IntegrationsSection from '@/components/marketing/sections/Integrations'
import PricingSection from '@/components/marketing/sections/Pricing'

/**
 * Surfaces: dark hero + agents, light tariff, dark how-it-works + stack, light pricing.
 * Adjacent sections on the same surface read as one oversized block.
 */
export default function MarketingLanding() {
  return (
    <LenisProvider>
      <MarketingShell surface="dark">
        <main>
          <HeroSection />
          <AgentsSection />
          <TariffSection />
          <HowItWorksSection />
          <IntegrationsSection />
          <PricingSection />
        </main>
      </MarketingShell>
    </LenisProvider>
  )
}
