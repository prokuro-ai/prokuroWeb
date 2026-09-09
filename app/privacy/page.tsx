import type { Metadata } from 'next'
import PrivacyPage from '@/components/PrivacyPage'
import { PAGE, pageMetadata } from '@/lib/pageTitle'

export const metadata: Metadata = pageMetadata(PAGE.privacy, {
  description: 'How Prokuro collects, uses, and protects your account and BOM data.',
})

export default function PrivacyRoute() {
  return <PrivacyPage />
}
