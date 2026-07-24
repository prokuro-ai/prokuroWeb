'use client'

import { CircleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

const INPUT_CLASS =
  'w-full px-3 py-2.5 rounded-md border border-[#d6deea] bg-white text-[15px] text-[#0f1b2d] placeholder:text-[#98a3b6] focus:outline-none focus:ring-2 focus:ring-[#0062ff]/20 focus:border-[#0062ff] transition-all'

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
      <label
        htmlFor={id}
        className={cn(
          'mb-1.5 block text-[13px] font-medium',
          hasError ? 'text-red-600' : 'text-[#0f1b2d]',
        )}
      >
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
          INPUT_CLASS,
          hasError && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
        )}
      />
      {hasError ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-[13px] text-red-600">
          <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  )
}
