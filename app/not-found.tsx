import type { Metadata } from 'next'
import NotFoundPage from '@/components/NotFoundPage'
import { PAGE, pageMetadata } from '@/lib/pageTitle'

export const metadata: Metadata = pageMetadata(PAGE.notFound, {
  description: 'The page you requested could not be found. Return to Prokuro or book a demo.',
  robots: {
    index: false,
    follow: false,
  },
})

export default function NotFound() {
  return <NotFoundPage />
}
