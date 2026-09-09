import type { Metadata } from 'next'
import { Suspense } from 'react'
import LoginPage from '@/components/LoginPage'
import { PAGE, pageMetadata } from '@/lib/pageTitle'

export const metadata: Metadata = pageMetadata(PAGE.login, {
  description: 'Log in to Prokuro and run a BOM through screening, sourcing, and compliance agents.',
})

export default function LoginRoute() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  )
}
