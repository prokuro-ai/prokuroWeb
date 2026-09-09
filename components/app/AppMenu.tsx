'use client'

import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { appMenu, appMenuItem, appToolbarBtn } from '@/components/app/chrome'
import { cn } from '@/lib/utils'

export type AppMenuAction = {
  label: string
  onSelect: () => void
}

export default function AppMenu({
  label,
  items,
  align = 'end',
  ariaLabel,
  triggerClassName,
}: {
  label: ReactNode
  items: AppMenuAction[]
  align?: 'start' | 'end'
  ariaLabel?: string
  triggerClassName?: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(appToolbarBtn, triggerClassName)}
          aria-label={ariaLabel}
          aria-haspopup="menu"
        >
          {label}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={`${appMenu} z-[70]`}>
        {items.map((item) => (
          <DropdownMenuItem key={item.label} className={appMenuItem} onSelect={item.onSelect}>
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
