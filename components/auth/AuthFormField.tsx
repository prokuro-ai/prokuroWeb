'use client'

import { CircleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuthFormFieldProps {
  id: string
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string | null
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  autoComplete?: string
}

export function AuthFormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  inputMode,
  autoComplete,
}: AuthFormFieldProps) {
  const hasError = Boolean(error)

  return (
    <div>
      <label htmlFor={id} className={cn('mk-eyebrow mb-2 block', hasError && 'text-mk-red')}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
        className={cn(
          'w-full rounded-lg border bg-mk-canvas px-3 py-2.5 font-mk-sans text-[length:var(--mk-text-base)] text-mk-ink placeholder:text-mk-ink-subtle focus:outline-none',
          hasError
            ? 'border-mk-red focus:border-mk-red focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--mk-red)_16%,transparent)]'
            : 'border-mk-line focus:border-mk-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--mk-accent)_16%,transparent)]',
        )}
      />
      {hasError ? (
        <p id={`${id}-error`} className="mk-small mt-2 flex items-center gap-1.5 text-mk-red">
          <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  )
}
