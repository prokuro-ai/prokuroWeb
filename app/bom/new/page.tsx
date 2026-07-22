'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppShell from '@/components/app/AppShell'
import { useAuth } from '@/components/AuthProvider'

/** Opens the upload modal immediately; kept for deep links and legacy /bom/new bookmarks. */
export default function NewBomPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) router.replace('/login')
  }, [loading, user, router])

  if (loading || !user) return null

  return (
    <AppShell initialUploadOpen>
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-500">
        Upload a BOM using the modal above.
      </div>
    </AppShell>
  )
}
