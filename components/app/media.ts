'use client'

import { useEffect, useState } from 'react'

/**
 * Desktop chrome cut. Keep in sync with `--breakpoint-mk` in styles/brand.css
 * (900px) — the same width marketing uses for its compact layout.
 */
export const MK_DESKTOP_PX = 900
export const MK_DESKTOP_MQ = `(min-width: ${MK_DESKTOP_PX}px)`

export function useMkDesktop() {
  const [desktop, setDesktop] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(MK_DESKTOP_MQ)
    const sync = () => setDesktop(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return desktop
}
