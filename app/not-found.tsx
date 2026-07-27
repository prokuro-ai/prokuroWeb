import type { Metadata } from 'next'
import NotFoundPage from '@/components/NotFoundPage'

export const metadata: Metadata = {
  title: 'Page not found | Prokuro.ai',
  description: 'The page you requested could not be found. Return to Prokuro or book a demo.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return <NotFoundPage />
}
