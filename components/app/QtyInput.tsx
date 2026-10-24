'use client'

import type { KeyboardEvent } from 'react'
import { Minus, Plus } from 'lucide-react'

const STEP_BTN =
  'flex w-7 items-center justify-center text-mk-ink-subtle transition-colors hover:bg-mk-raised hover:text-mk-ink disabled:pointer-events-none disabled:opacity-35'

/** Whole-number quantity with − / + steppers. `value` is the raw text so the field can be cleared while typing. */
export default function QtyInput({
  value,
  onChange,
  label,
  min = 1,
  max = 1_000_000,
  onBlur,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  min?: number
  max?: number
  onBlur?: () => void
}) {
  const parsed = Number.parseInt(value, 10)
  const current = Number.isFinite(parsed) ? parsed : min
  const lower = label.charAt(0).toLowerCase() + label.slice(1)

  function step(delta: number) {
    onChange(String(Math.min(max, Math.max(min, current + delta))))
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      step(event.key === 'ArrowUp' ? 1 : -1)
    }
  }

  return (
    <div className="inline-flex h-8 shrink-0 items-stretch overflow-hidden rounded-[8px] border border-mk-line bg-mk-canvas transition-colors focus-within:border-mk-accent">
      <button
        type="button"
        tabIndex={-1}
        aria-label={`Decrease ${lower}`}
        disabled={current <= min}
        onClick={() => step(-1)}
        className={STEP_BTN}
      >
        <Minus className="h-3 w-3" aria-hidden />
      </button>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 7))}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        className="mk-data w-12 border-x border-mk-line bg-transparent px-1 text-center text-[13px] tabular-nums text-mk-ink focus:outline-none"
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={`Increase ${lower}`}
        disabled={current >= max}
        onClick={() => step(1)}
        className={STEP_BTN}
      >
        <Plus className="h-3 w-3" aria-hidden />
      </button>
    </div>
  )
}
