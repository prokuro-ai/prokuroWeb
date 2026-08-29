import type { Metadata } from 'next'
import { Suspense } from 'react'
import SignupPage from '@/components/SignupPage'

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create a Prokuro account and upload a BOM. No credit card required.',
}

export default function SignupRoute() {
  return (
    <Suspense>
      <SignupPage />
    </Suspense>
  )
}
