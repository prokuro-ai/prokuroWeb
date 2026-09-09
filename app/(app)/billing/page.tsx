'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSettings } from '@/components/settings/SettingsContext'

export default function BillingRedirectPage() {
  const router = useRouter()
  const { openSettings } = useSettings()

  useEffect(() => {
    openSettings('billing')
    router.replace('/dashboard')
  }, [openSettings, router])

  return null
}
