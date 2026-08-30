'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Reveal from '@/components/marketing/motion/Reveal'

const JOBS = [
  { name: 'Screening', role: 'Finds the parts that will fail.' },
  { name: 'Sourcing', role: 'Finds parts that are actually in stock at distributors.' },
  { name: 'Cost', role: 'Cuts what the build actually costs.' },
  { name: 'Planning', role: 'Tells you when to place the order.' },
  { name: 'Compliance', role: 'Keeps tariffs and bans off the board.' },
  { name: 'Buying', role: 'Turns the plan into a real PO.' },
]

const ROTATE_MS = 5000

export default function AgentsSection() {
  const [active, setActive] = useState(0)
  const [held, setHeld] = useState(false)
  const timer = useRef<number | null>(null)

  const select = useCallback((index: number) => {
    setActive(index)
    setHeld(true)
  }, [])

  useEffect(() => {
    if (held) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    timer.current = window.setInterval(() => {
      setActive((current) => (current + 1) % JOBS.length)
    }, ROTATE_MS)
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [held])

  return (
    <section id="product" data-surface="dark" className="mk-section">
      <div className="mk-container">
        <Reveal>
          <h2 className="mk-h2 max-w-[16ch]">
            A team that does the work.
          </h2>
        </Reveal>

        <ul className="mt-16 border-t border-mk-line">
          {JOBS.map((job, index) => {
            const on = index === active
            return (
              <li key={job.name} className="border-b border-mk-line">
                <button
                  type="button"
                  onClick={() => select(index)}
                  onMouseEnter={() => select(index)}
                  aria-pressed={on}
                  className="grid w-full grid-cols-1 gap-2 py-7 text-left transition-colors duration-300 md:grid-cols-[minmax(0,18rem)_1fr] md:items-baseline md:gap-10 md:py-9"
                >
                  <span
                    className="mk-h3 transition-colors duration-300"
                    style={{ color: on ? 'var(--mk-ink)' : 'var(--mk-ink-subtle)' }}
                  >
                    {job.name}
                  </span>
                  <span
                    className="mk-lead transition-colors duration-300"
                    style={{ color: on ? 'var(--mk-ink)' : 'var(--mk-ink-muted)' }}
                  >
                    {job.role}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
