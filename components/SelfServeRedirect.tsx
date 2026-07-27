'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { isBlockedRoute } from '@/lib/access'
import { SCHEDULE_DEMO_PATH } from '@/lib/sales'

/**
 * Replaces middleware on static GitHub Pages builds (middleware cannot be exported).
 * On Amplify/SSR, middleware still runs; this is a harmless second check.
 */
export default function SelfServeRedirect() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!pathname) return
    if (isBlockedRoute(pathname)) {
      router.replace(SCHEDULE_DEMO_PATH)
    }
  }, [pathname, router])

  return null
}
