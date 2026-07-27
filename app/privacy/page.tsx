import type { Metadata } from 'next'
import PrivacyPage from '@/components/PrivacyPage'

export const metadata: Metadata = {
  title: 'Privacy Policy | Prokuro.ai',
  description: 'How Prokuro collects, uses, and protects your account and BOM data.',
}

export default function PrivacyRoute() {
  return <PrivacyPage />
}
