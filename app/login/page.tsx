import type { Metadata } from 'next'
import { Suspense } from 'react'
import LoginPage from '@/components/LoginPage'
import { PAGE, pageMetadata } from '@/lib/pageTitle'

export const metadata: Metadata = pageMetadata(PAGE.login, {
  description: 'Log in to open a BOM and see what to buy.',
})

export default function LoginRoute() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  )
}
