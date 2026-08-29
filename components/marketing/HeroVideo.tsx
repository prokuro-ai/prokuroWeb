'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Hero background plate — crossfades through every clip in `public/hero/`.
 *
 * Videos must mount as soon as the component is allowed to play. Gating the
 * markup on `onLoadedData` never fires that event, so the stack stays empty.
 *
 * Skipped under `prefers-reduced-motion`. Shown on all viewport sizes so a
 * split-pane desktop window still gets the plate.
 */

const HERO_VIDEO_SOURCES = [
  '/hero/hero-01.mp4',
  '/hero/hero-02.mp4',
  '/hero/hero-03.mp4',
  '/hero/hero-04.mp4',
  '/hero/hero-05.mp4',
] as const

const MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const ROTATE_MS = 11_000
const FADE_MS = 1_400

export default function HeroVideo({
  sources = HERO_VIDEO_SOURCES,
}: {
  sources?: readonly string[]
}) {
  const [reduce, setReduce] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [active, setActive] = useState(0)
  const [failed, setFailed] = useState<Set<number>>(() => new Set())
  const refs = useRef<(HTMLVideoElement | null)[]>([])
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHydrated(true)
    const still = window.matchMedia(MOTION_QUERY)
    const update = () => setReduce(still.matches)
    update()
    still.addEventListener('change', update)
    return () => still.removeEventListener('change', update)
  }, [])

  const live = sources.map((_, index) => index).filter((index) => !failed.has(index))
  const visible = live.length > 0 ? live[active % live.length] : 0

  useEffect(() => {
    if (!hydrated || reduce || live.length < 2) return
    const id = window.setInterval(() => {
      setActive((slot) => (slot + 1) % live.length)
    }, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [hydrated, reduce, live.length])

  useEffect(() => {
    if (!hydrated || reduce) return
    refs.current.forEach((el, index) => {
      if (!el) return
      if (index === visible) void el.play().catch(() => {})
      else el.pause()
    })
  }, [hydrated, reduce, visible])

  useEffect(() => {
    if (!hydrated || reduce) return
    const wrap = wrapRef.current
    if (!wrap) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        refs.current.forEach((el, index) => {
          if (!el) return
          if (entry.isIntersecting && index === visible) void el.play().catch(() => {})
          else el.pause()
        })
      },
      { threshold: 0 },
    )
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [hydrated, reduce, visible])

  if (!hydrated || reduce || live.length === 0) return null

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {sources.map((src, index) =>
        failed.has(index) ? null : (
          <video
            key={src}
            ref={(el) => {
              refs.current[index] = el
            }}
            className="absolute inset-0 h-full w-full object-cover transition-opacity ease-out"
            style={{
              opacity: index === visible ? 1 : 0,
              transitionDuration: `${FADE_MS}ms`,
            }}
            autoPlay={index === visible}
            muted
            loop
            playsInline
            preload={index === 0 ? 'auto' : 'metadata'}
            src={src}
            onError={() => {
              setFailed((prev) => {
                if (prev.has(index)) return prev
                const next = new Set(prev)
                next.add(index)
                return next
              })
            }}
          />
        ),
      )}
    </div>
  )
}
