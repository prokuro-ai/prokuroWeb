'use client'

import { useEffect, useRef, useState } from 'react'

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
  const refs = useRef<Map<number, HTMLVideoElement>>(new Map())
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
  const prefetch = live.length > 1 ? live[(active + 1) % live.length] : null
  const mounted = prefetch == null ? [visible] : [visible, prefetch]

  useEffect(() => {
    if (!hydrated || reduce || live.length < 2) return
    const id = window.setInterval(() => {
      setActive((slot) => (slot + 1) % live.length)
    }, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [hydrated, reduce, live.length])

  useEffect(() => {
    if (!hydrated || reduce) return
    for (const index of mounted) {
      const el = refs.current.get(index)
      if (!el) continue
      if (index === visible) void el.play().catch(() => {})
      else el.pause()
    }
  }, [hydrated, reduce, visible, prefetch])

  useEffect(() => {
    if (!hydrated || reduce) return
    const wrap = wrapRef.current
    if (!wrap) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        for (const index of mounted) {
          const el = refs.current.get(index)
          if (!el) continue
          if (entry.isIntersecting && index === visible) void el.play().catch(() => {})
          else el.pause()
        }
      },
      { threshold: 0 },
    )
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [hydrated, reduce, visible, prefetch])

  if (!hydrated || reduce || live.length === 0) return null

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {mounted.map((index) => {
        const src = sources[index]
        if (!src) return null
        return (
          <video
            key={src}
            ref={(el) => {
              if (el) refs.current.set(index, el)
              else refs.current.delete(index)
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
            preload={index === visible ? 'auto' : 'metadata'}
            src={src}
            onError={() => {
              setFailed((prev) => {
                if (prev.has(index)) return prev
                const nextFailed = new Set(prev)
                nextFailed.add(index)
                return nextFailed
              })
            }}
          />
        )
      })}
    </div>
  )
}
