'use client'

import { useMemo, useState } from 'react'
import {
  addDays,
  addMonths,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { appField, appMenu } from '@/components/app/chrome'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function parseYmd(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export default function AppDateField({
  value,
  onChange,
  minDate,
  placeholder = 'Select a date',
}: {
  value: string
  onChange: (next: string) => void
  minDate?: Date
  placeholder?: string
}) {
  const selected = parseYmd(value)
  const floor = startOfDay(minDate ?? new Date())
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => startOfMonth(selected ?? floor))

  const weeks = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
    return Array.from({ length: 6 }, (_, week) =>
      Array.from({ length: 7 }, (_, day) => addDays(gridStart, week * 7 + day)),
    ).filter((week) => week.some((date) => isSameMonth(date, month)))
  }, [month])

  const canGoBack = startOfMonth(month).getTime() > startOfMonth(floor).getTime()

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setMonth(startOfMonth(selected ?? floor))
      }}
    >
      <DropdownMenuTrigger asChild>
        <button type="button" className={cn(appField, 'flex items-center gap-2 text-left')}>
          <Calendar className="h-3.5 w-3.5 shrink-0 text-mk-ink-subtle" aria-hidden />
          <span className={cn('min-w-0 flex-1 truncate', selected ? 'text-mk-ink' : 'text-mk-ink-subtle')}>
            {selected ? format(selected, 'MMM d, yyyy') : placeholder}
          </span>
          {selected ? (
            <span
              aria-label="Clear date"
              className="rounded-[6px] p-0.5 text-mk-ink-subtle hover:bg-mk-raised hover:text-mk-ink"
              onPointerDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onChange('')
              }}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </span>
          ) : (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={`${appMenu} z-[70] w-[17.5rem] p-3`}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[13px] font-medium text-mk-ink">{format(month, 'MMMM yyyy')}</p>
          <div className="flex gap-0.5">
            <button
              type="button"
              className="rounded-[6px] p-1 text-mk-ink hover:bg-mk-raised disabled:opacity-30"
              onClick={() => setMonth(subMonths(month, 1))}
              disabled={!canGoBack}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              className="rounded-[6px] p-1 text-mk-ink hover:bg-mk-raised"
              onClick={() => setMonth(addMonths(month, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-0.5" role="grid" aria-label="Select a date">
          {WEEKDAYS.map((weekday, index) => (
            <div
              key={`${weekday}-${index}`}
              className="py-1 text-center font-mk-mono text-[10px] font-medium uppercase tracking-[0.08em] text-mk-ink-subtle"
              aria-hidden
            >
              {weekday}
            </div>
          ))}
          {weeks.flat().map((date) => {
            if (!isSameMonth(date, month)) {
              return <div key={date.toISOString()} />
            }
            const isSelected = selected !== null && isSameDay(date, selected)
            const isToday = isSameDay(date, floor)
            const disabled = isBefore(date, floor)
            return (
              <button
                key={date.toISOString()}
                type="button"
                disabled={disabled}
                aria-pressed={isSelected}
                aria-label={format(date, 'EEEE, MMMM d')}
                onClick={() => {
                  onChange(format(date, 'yyyy-MM-dd'))
                  setOpen(false)
                }}
                className={cn(
                  'grid aspect-square place-items-center rounded-[8px] font-mk-mono text-[12px] tabular-nums text-mk-ink hover:bg-mk-raised disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent',
                  isToday && !isSelected && 'font-semibold text-mk-accent',
                  isSelected && 'bg-mk-ink font-semibold text-mk-canvas hover:bg-mk-ink/90',
                )}
              >
                {format(date, 'd')}
              </button>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
