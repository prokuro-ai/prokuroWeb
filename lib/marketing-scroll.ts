import type { MouseEvent } from 'react'
import type Lenis from 'lenis'

/** Matches the fixed marketing header (`h-14`). */
export const MARKETING_NAV_OFFSET = -56

let lenis: Lenis | null = null

export function setMarketingLenis(instance: Lenis | null) {
  lenis = instance
}

export function scrollToMarketingHash(hash: string, immediate = false) {
  const id = hash.startsWith('#') ? hash.slice(1) : hash
  if (!id) return

  const target = document.getElementById(id)
  if (!target) return

  if (lenis) {
    lenis.scrollTo(target, { offset: MARKETING_NAV_OFFSET, immediate })
    return
  }

  target.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth', block: 'start' })
}

/** Same-page `/#section` clicks. Next.js Link swallows the first hash jump. */
export function handleMarketingHashClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
  const hashIndex = href.indexOf('#')
  if (hashIndex === -1) return

  const path = href.slice(0, hashIndex) || '/'
  const hash = href.slice(hashIndex)
  const here = window.location.pathname.replace(/\/$/, '') || '/'
  const there = path.replace(/\/$/, '') || '/'
  if (here !== there) return

  event.preventDefault()
  if (hash !== window.location.hash) {
    window.history.pushState(null, '', hash)
  }
  scrollToMarketingHash(hash)
}
