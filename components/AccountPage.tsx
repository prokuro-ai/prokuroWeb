'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { settingsPaneFromQuery, useSettings } from '@/components/settings/SettingsContext'

export default function AccountPage() {
  const router = useRouter()
  const { openSettings } = useSettings()

  useEffect(() => {
    const pane = settingsPaneFromQuery(new URLSearchParams(window.location.search).get('pane'))
    openSettings(pane)
    router.replace('/dashboard')
  }, [openSettings, router])

  return null
}
