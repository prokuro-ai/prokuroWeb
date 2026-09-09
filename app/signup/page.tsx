import type { Metadata } from 'next'
import { Suspense } from 'react'
import SignupPage from '@/components/SignupPage'
import { PAGE, pageMetadata } from '@/lib/pageTitle'

export const metadata: Metadata = pageMetadata(PAGE.signup, {
  description: 'Create a Prokuro account and upload a BOM. No credit card required.',
})

export default function SignupRoute() {
  return (
    <Suspense>
      <SignupPage />
    </Suspense>
  )
}
