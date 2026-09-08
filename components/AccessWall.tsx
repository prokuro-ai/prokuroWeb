'use client'

import { useAuth } from '@/components/AuthProvider'
import { appPrimaryBtn } from '@/components/app/chrome'
import { signOut } from '@/lib/auth'

export default function AccessWall() {
  const { refresh } = useAuth()

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-mk-canvas px-6 text-center">
      <p className="mk-eyebrow">Registration logged</p>
      <h1 className="mk-app-title mt-2 max-w-[22ch] text-mk-ink">We have your request and will reach out</h1>
      <p className="mt-3 max-w-[42ch] text-[13px] leading-relaxed text-mk-ink-muted">
        Thanks for signing up. Your account is not enabled yet. We emailed you a confirmation and will contact you
        after we review the registration.
      </p>
      <button
        type="button"
        className={`${appPrimaryBtn} mt-8`}
        onClick={async () => {
          await signOut()
          await refresh()
          window.location.href = '/'
        }}
      >
        Sign out
      </button>
    </div>
  )
}
