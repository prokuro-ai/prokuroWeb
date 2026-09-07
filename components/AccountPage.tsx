'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSettings } from '@/components/settings/SettingsContext'

export default function AccountPage() {
  const router = useRouter()
  const { openSettings } = useSettings()

  useEffect(() => {
    const pane = new URLSearchParams(window.location.search).get('pane') === 'team' ? 'team' : 'profile'
    openSettings(pane)
    router.replace('/dashboard')
  }, [openSettings, router])

  return null
}
