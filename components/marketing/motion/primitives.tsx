'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

export function MagneticCta({
  href,
  children,
  className,
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const reduce = useReducedMotion()
  const [delta, setDelta] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (reduce) return
    const el = ref.current
    if (!el) return
    const onMove = (event: MouseEvent) => {
      const box = el.getBoundingClientRect()
      const x = event.clientX - (box.left + box.width / 2)
      const y = event.clientY - (box.top + box.height / 2)
      setDelta({ x: x * 0.18, y: y * 0.18 })
    }
    const onLeave = () => setDelta({ x: 0, y: 0 })
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [reduce])

  return (
    <a
      ref={ref}
      href={href}
      className={className}
      style={{ transform: `translate(${delta.x}px, ${delta.y}px)` }}
    >
      {children}
    </a>
  )
}
