'use client'

import { format } from 'date-fns'
import { ArrowRight, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { dayKey, formatDayLong, formatTime } from '@/lib/schedule/datetime'
import styles from './schedule.module.css'

interface SlotPickerProps {
  weekDays: Date[]
  /** ISO start times grouped by `yyyy-MM-dd` key. */
  slotsByDay: Map<string, string[]>
  selectedDay: string | null
  selectedStartTime: string | null
  loading: boolean
  error: string | null
  canGoBack: boolean
  onPreviousWeek: () => void
  onNextWeek: () => void
  onSelectDay: (day: string) => void
  onSelectStartTime: (startTime: string) => void
  onContinue: () => void
}

export default function SlotPicker({
  weekDays,
  slotsByDay,
  selectedDay,
  selectedStartTime,
  loading,
  error,
  canGoBack,
  onPreviousWeek,
  onNextWeek,
  onSelectDay,
  onSelectStartTime,
  onContinue,
}: SlotPickerProps) {
  const daySlots = selectedDay ? (slotsByDay.get(selectedDay) ?? []) : []
  const selectedDate = weekDays.find((date) => dayKey(date) === selectedDay) ?? null

  return (
    <>
      <div className={styles.pickerHead}>
        <div>
          <p className={styles.pickerRange}>
            {format(weekDays[0], 'MMM d')} – {format(weekDays[6], 'MMM d, yyyy')}
          </p>
          <p className={styles.pickerHint}>Pick a day, then a time that works for you.</p>
        </div>
        <div className={styles.weekNav}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onPreviousWeek}
            disabled={!canGoBack}
            aria-label="Previous week"
          >
            <ChevronLeft size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onNextWeek}
            aria-label="Next week"
          >
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={styles.days} role="group" aria-label="Days this week">
        {weekDays.map((date) => {
          const key = dayKey(date)
          const count = slotsByDay.get(key)?.length ?? 0
          const isSelected = key === selectedDay
          const classNames = [styles.day]
          if (isSelected) classNames.push(styles.daySelected)

          return (
            <button
              key={key}
              type="button"
              className={classNames.join(' ')}
              onClick={() => onSelectDay(key)}
              disabled={loading || count === 0}
              aria-pressed={isSelected}
            >
              <span className={styles.dayWeekday}>{format(date, 'EEE')}</span>
              <span className={styles.dayNumber}>{format(date, 'd')}</span>
              <span className={count > 0 ? styles.dayDot : styles.dayDotEmpty} aria-hidden="true" />
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className={styles.state}>
          <Loader2 size={20} className={styles.spinner} aria-hidden="true" />
          Loading available times
        </div>
      ) : error ? (
        <div className={styles.state}>
          <p className={styles.errorText}>{error}</p>
        </div>
      ) : daySlots.length === 0 ? (
        <div className={styles.state}>
          No open times {selectedDate ? `on ${formatDayLong(selectedDate)}` : 'this week'}. Try
          another day.
        </div>
      ) : (
        <>
          <div className={styles.timesHead}>
            <p className={styles.timesTitle}>
              {selectedDate ? formatDayLong(selectedDate) : 'Available times'}
            </p>
            <p className={styles.timesCount}>{daySlots.length} open</p>
          </div>

          <div className={styles.times} role="group" aria-label="Available times">
            {daySlots.map((startTime) => {
              const isSelected = startTime === selectedStartTime
              const classNames = [styles.time]
              if (isSelected) classNames.push(styles.timeSelected)

              return (
                <button
                  key={startTime}
                  type="button"
                  className={classNames.join(' ')}
                  onClick={() => onSelectStartTime(startTime)}
                  aria-pressed={isSelected}
                >
                  {formatTime(startTime)}
                </button>
              )
            })}
          </div>
        </>
      )}

      <div className={styles.pickerFooter}>
        <p className={styles.footerNote}>Times shown in your local timezone.</p>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={onContinue}
          disabled={!selectedStartTime}
        >
          Continue
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </>
  )
}
