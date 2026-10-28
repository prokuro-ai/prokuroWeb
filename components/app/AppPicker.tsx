'use client'

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { appMenu, appMenuItem } from '@/components/app/chrome'

export type AppPickerOption = { value: string; label: string; detail?: string }

/** Single-select menu in product chrome. Used for boards and Google Sheet tabs. */
export default function AppPicker({
  label,
  value,
  options,
  onChange,
  disabled,
  placeholder,
  className,
}: {
  label: string
  value: string
  options: AppPickerOption[]
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}) {
  const selected = options.find((option) => option.value === value)
  const shown = selected?.label ?? placeholder ?? label
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={selected ? `${label}: ${selected.label}` : label}
          className={`flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-[8px] border border-mk-line bg-mk-canvas px-3 text-left text-[13px] text-mk-ink transition-colors hover:bg-mk-raised focus:border-mk-accent focus:outline-none data-[state=open]:border-mk-accent disabled:pointer-events-none disabled:opacity-50 ${className ?? ''}`}
        >
          <span className={`min-w-0 truncate ${selected ? '' : 'text-mk-ink-subtle'}`}>
            {shown}
            {selected?.detail ? <span className="text-mk-ink-subtle"> · {selected.detail}</span> : null}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-mk-ink-subtle" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={`${appMenu} z-[70] max-h-[min(22rem,var(--radix-dropdown-menu-content-available-height))] w-[var(--radix-dropdown-menu-trigger-width)] min-w-[15rem] overflow-y-auto`}
      >
        <DropdownMenuPrimitive.RadioGroup value={value} onValueChange={onChange}>
          {options.map((option) => (
            <DropdownMenuPrimitive.RadioItem
              key={option.value}
              value={option.value}
              className={`${appMenuItem} justify-between gap-3`}
            >
              <span className="min-w-0 truncate">
                {option.label}
                {option.detail ? <span className="text-mk-ink-subtle"> · {option.detail}</span> : null}
              </span>
              <DropdownMenuPrimitive.ItemIndicator>
                <Check className="h-3.5 w-3.5 text-mk-accent" aria-hidden />
              </DropdownMenuPrimitive.ItemIndicator>
            </DropdownMenuPrimitive.RadioItem>
          ))}
        </DropdownMenuPrimitive.RadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
