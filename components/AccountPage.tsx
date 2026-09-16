'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { settingsPaneFromQuery, useSettings } from '@/components/settings/SettingsContext'
import { GOOGLE_OAUTH_FLAG_KEY } from '@/components/settings/helpers'

export default function AccountPage() {
  const router = useRouter()
  const { openSettings } = useSettings()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const google = params.get('google')
    if (google === 'connected' || google === 'denied' || google === 'error') {
      sessionStorage.setItem(GOOGLE_OAUTH_FLAG_KEY, google)
      openSettings('integrations')
    } else {
      openSettings(settingsPaneFromQuery(params.get('pane')))
    }
    router.replace('/dashboard')
  }, [openSettings, router])

  return null
}
