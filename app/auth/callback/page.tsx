'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Hub } from 'aws-amplify/utils'
import { useAuth } from '@/components/AuthProvider'
import { configureAmplify } from '@/lib/amplify-config'
import { consumeNextPath, Link } from '@/lib/navigation'
import { ProkuroWordmark } from '@/components/brand/ProkuroLogo'

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
          router.replace(consumeNextPath())
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
    <div data-surface="light" className="font-mk-sans flex min-h-screen flex-col items-center justify-center bg-mk-raised p-6 text-mk-ink antialiased">
      <Link href="/" className="mb-8 inline-flex text-mk-ink">
        <ProkuroWordmark size={22} />
      </Link>
      <div className="w-full max-w-[400px] border border-mk-line bg-mk-canvas p-8 text-center">
        <h2 className="mk-h3">{failed ? 'Sign-in did not complete' : 'Completing sign-in'}</h2>
        <p className="mk-body mt-3 text-mk-ink-muted">
          {failed
            ? 'Google could not finish the handoff. You can try again from the login page.'
            : 'Hang on while we confirm the session.'}
        </p>
        {failed ? (
          <button type="button" onClick={() => router.replace('/login')} className="mk-btn mk-btn--primary mt-8">
            Return to login
          </button>
        ) : (
          <p className="mk-eyebrow mt-8">Connecting…</p>
        )}
      </div>
    </div>
  )
}
