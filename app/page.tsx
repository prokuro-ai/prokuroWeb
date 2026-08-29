import MarketingLanding from '@/components/marketing/LandingPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    absolute: 'Prokuro AI | Procurement Agents That Work Your BOM',
  },
}

export default function Page() {
  return <MarketingLanding />
}

