import type { Metadata } from 'next'
import { Suspense } from 'react'
import LoginPage from '@/components/LoginPage'

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Log in to Prokuro and run a BOM through screening, sourcing, and compliance agents.',
}

export default function LoginRoute() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  )
}
