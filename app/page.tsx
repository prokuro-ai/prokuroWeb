import MarketingLanding from '@/components/marketing/LandingPage'
import type { Metadata } from 'next'
import { PAGE } from '@/lib/pageTitle'

export const metadata: Metadata = {
  title: {
    absolute: PAGE.home,
  },
}

export default function Page() {
  return <MarketingLanding />
}

