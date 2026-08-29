import type { Metadata } from 'next'
import TermsPage from '@/components/TermsPage'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms governing your use of Prokuro’s BOM risk analysis service.',
}

export default function TermsRoute() {
  return <TermsPage />
}
