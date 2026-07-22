'use client'

import { useEffect, useState } from 'react'

interface PortfolioFeedProps {
  messages: string[]
}

export default function PortfolioFeed({ messages }: PortfolioFeedProps) {
  const [active, setActive] = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    setActive(0)
  }, [messages])

  useEffect(() => {
    if (messages.length <= 1) return
    const timer = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setActive((current) => (current + 1) % messages.length)
        setFading(false)
      }, 300)
    }, 5000)
    return () => clearInterval(timer)
  }, [messages.length])

  if (messages.length === 0) return null

  return (
    <div className="mb-6" style={{ transition: 'opacity 0.3s', opacity: fading ? 0 : 1 }}>
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
        <p className="flex-1 text-sm font-medium text-slate-700">{messages[active]}</p>
        {messages.length > 1 && (
          <div className="flex shrink-0 gap-1.5">
            {messages.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Show insight ${index + 1}`}
                onClick={() => {
                  setActive(index)
                  setFading(false)
                }}
                className="h-1.5 w-1.5 rounded-full transition-all duration-300"
                style={{ background: index === active ? '#0062ff' : '#cbd5e1' }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
