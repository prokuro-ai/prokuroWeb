'use client'

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { appMenu, appMenuItem } from '@/components/app/chrome'

export type BoardOption = { value: string; label: string; detail?: string }

export default function BoardPicker({
  value,
  options,
  onChange,
}: {
  value: string
  options: BoardOption[]
  onChange: (value: string) => void
}) {
  const selected = options.find((option) => option.value === value) ?? options[0]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Board: ${selected?.label ?? ''}`}
          className="flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-[8px] border border-mk-line bg-mk-canvas px-3 text-left text-[13px] text-mk-ink transition-colors hover:bg-mk-raised focus:border-mk-accent focus:outline-none data-[state=open]:border-mk-accent sm:w-60"
        >
          <span className="min-w-0 truncate">
            {selected?.label}
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
