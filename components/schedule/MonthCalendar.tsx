'use client'

import { addDays, addMonths, format, isBefore, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './schedule.module.css'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface MonthCalendarProps {
  month: Date
  selected: Date | null
  minDate: Date
  disabled?: boolean
  onMonthChange: (month: Date) => void
  onSelect: (date: Date) => void
}

export default function MonthCalendar({
  month,
  selected,
  minDate,
  disabled = false,
  onMonthChange,
  onSelect,
}: MonthCalendarProps) {
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
  const weeks = Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(gridStart, week * 7 + day)),
  ).filter((week) => week.some((date) => isSameMonth(date, month)))

  const canGoBack = !disabled && isBefore(startOfMonth(minDate), startOfMonth(month))

  return (
    <div>
      <div className={styles.calendarHead}>
        <p className={styles.calendarMonth}>{format(month, 'MMMM yyyy')}</p>
        <div className={styles.calendarNav}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => onMonthChange(subMonths(month, 1))}
            disabled={!canGoBack}
            aria-label="Previous month"
          >
            <ChevronLeft size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => onMonthChange(addMonths(month, 1))}
            disabled={disabled}
            aria-label="Next month"
          >
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={styles.calendarGrid} role="grid" aria-label="Select a date">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className={styles.calendarWeekday} aria-hidden="true">
            {weekday.charAt(0)}
          </div>
        ))}

        {weeks.flat().map((date) => {
          if (!isSameMonth(date, month)) {
            return <div key={date.toISOString()} />
          }

          const isSelected = selected !== null && isSameDay(date, selected)
          const classNames = [styles.calendarDay]
          if (isSameDay(date, minDate)) classNames.push(styles.calendarDayToday)
          if (isSelected) classNames.push(styles.calendarDaySelected)

          return (
            <button
              key={date.toISOString()}
              type="button"
              className={classNames.join(' ')}
              onClick={() => onSelect(date)}
              disabled={disabled || isBefore(date, minDate)}
              aria-pressed={isSelected}
              aria-label={format(date, 'EEEE, MMMM d')}
            >
              {format(date, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
