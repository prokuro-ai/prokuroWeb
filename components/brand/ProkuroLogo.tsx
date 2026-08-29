'use client'

import { useId } from 'react'

/**
 * Chamfered chip body with an L-shaped routed trace cut through it.
 *
 * The chamfer carries over from the previous CSS-only mark; the routed channel
 * (orthogonal run into a 45-degree turn) is the same geometry the hero
 * autorouter draws. Everything is `currentColor`, so the mark inverts across
 * the dark and light surfaces without a second asset.
 */
export function ProkuroMark({
  size = 28,
  className,
}: {
  size?: number
  className?: string
}) {
  const maskId = useId()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
        <rect width="32" height="32" fill="white" />
        <path
          d="M0 20.5 H13.5 L23 11 V0"
          stroke="black"
          strokeWidth="4"
          strokeLinejoin="miter"
          fill="none"
        />
      </mask>
      <path
        d="M11 3 H29 V21 L21 29 H3 V11 Z"
        fill="currentColor"
        mask={`url(#${maskId})`}
      />
    </svg>
  )
}

export function ProkuroWordmark({
  size = 28,
  className,
  markClassName,
}: {
  size?: number
  className?: string
  markClassName?: string
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
      <ProkuroMark size={size} className={markClassName} />
      <span className="font-mk-sans text-[1.0625rem] font-semibold tracking-[-0.02em] text-mk-ink">
        Prokuro
      </span>
    </span>
  )
}

export default ProkuroWordmark
