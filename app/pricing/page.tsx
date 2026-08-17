import type { Metadata } from 'next'
import PricingPage from '@/components/PricingPage'

export const metadata: Metadata = {
  title: 'Pricing | Prokuro.ai',
  description: 'Free, Growth ($149), and Scale ($399) plans for BOM risk analysis and purchasing.',
}

export default function PricingRoute() {
  return <PricingPage />
}
