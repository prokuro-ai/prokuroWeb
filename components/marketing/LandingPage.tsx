'use client'

import LenisProvider from '@/components/marketing/motion/LenisProvider'
import MarketingShell from '@/components/MarketingShell'
import HeroSection from '@/components/marketing/sections/Hero'
import AgentsSection from '@/components/marketing/sections/Agents'
import TariffSection from '@/components/marketing/sections/Tariff'
import IntegrationsSection from '@/components/marketing/sections/Integrations'
import PricingSection from '@/components/marketing/sections/Pricing'

/**
 * Black and white alternate down the page. Hero stays dark.
 */
export default function MarketingLanding() {
  return (
    <LenisProvider>
      <MarketingShell surface="dark">
        <main>
          <HeroSection />
          <AgentsSection />
          <TariffSection />
          <IntegrationsSection />
          <PricingSection />
        </main>
      </MarketingShell>
    </LenisProvider>
  )
}
