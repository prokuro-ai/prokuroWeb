'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Hub } from 'aws-amplify/utils'
import { useAuth } from '@/components/AuthProvider'
import { configureAmplify } from '@/lib/amplify-config'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    configureAmplify()
    const stopListening = Hub.listen('auth', async ({ payload }) => {
      if (payload.event === 'signInWithRedirect') {
        try {
          await refresh()
          router.replace('/dashboard')
        } catch {
          setFailed(true)
        }
      } else if (payload.event === 'signInWithRedirect_failure') {
        setFailed(true)
      }
    })

    void import('aws-amplify/auth/enable-oauth-listener').catch(() => {
      setFailed(true)
    })

    return stopListening
  }, [refresh, router])

  return (
    <main className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-[15px] font-medium text-[#0f1b2d]">
          {failed ? 'Google sign-in could not be completed.' : 'Completing sign-in...'}
        </p>
        {failed ? (
          <button
            type="button"
            onClick={() => router.replace('/login')}
            className="mt-4 text-[14px] font-semibold text-[#0062ff] hover:underline"
          >
            Return to login
          </button>
        ) : null}
      </div>
    </main>
  )
}
