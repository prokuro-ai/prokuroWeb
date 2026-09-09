import type { Metadata } from 'next'
import TermsPage from '@/components/TermsPage'
import { PAGE, pageMetadata } from '@/lib/pageTitle'

export const metadata: Metadata = pageMetadata(PAGE.terms, {
  description: 'Terms governing your use of Prokuro’s BOM risk analysis service.',
})

export default function TermsRoute() {
  return <TermsPage />
}
