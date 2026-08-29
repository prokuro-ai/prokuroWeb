'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import {
  MARKETING_NAV_OFFSET,
  setMarketingLenis,
  scrollToMarketingHash,
} from '@/lib/marketing-scroll'

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (window.location.hash) scrollToMarketingHash(window.location.hash, true)
      return
    }

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      anchors: { offset: MARKETING_NAV_OFFSET },
    })
    setMarketingLenis(lenis)

    let raf = 0
    const tick = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    if (window.location.hash) {
      requestAnimationFrame(() => scrollToMarketingHash(window.location.hash, true))
    }

    return () => {
      cancelAnimationFrame(raf)
      setMarketingLenis(null)
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
