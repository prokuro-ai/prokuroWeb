'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { addDays, startOfDay, startOfMonth, startOfWeek, subWeeks } from 'date-fns'
import { fetchAvailability } from '@/lib/calendly/client'
import type { BookingConfirmation } from '@/lib/calendly/types'
import { browserTimeZone, dayKey } from '@/lib/schedule/datetime'
import BookingConfirmed from './BookingConfirmed'
import DetailsForm from './DetailsForm'
import MeetingSummary from './MeetingSummary'
import MonthCalendar from './MonthCalendar'
import SlotPicker from './SlotPicker'
import styles from './schedule.module.css'

const WEEK_OPTIONS = { weekStartsOn: 0 } as const

interface BookDemoProps {
  configured: boolean
}

interface Confirmed {
  booking: BookingConfirmation
  email: string
}

export default function BookDemo({ configured }: BookDemoProps) {
  const today = useMemo(() => startOfDay(new Date()), [])
  const [timeZone, setTimeZone] = useState('UTC')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(startOfDay(new Date()), WEEK_OPTIONS))
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()))
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(configured)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null)
  const [step, setStep] = useState<'time' | 'details'>('time')
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null)

  useEffect(() => {
    setTimeZone(browserTimeZone())
  }, [])

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  )

  const slotsByDay = useMemo(() => {
    const grouped = new Map<string, string[]>()
    for (const startTime of slots) {
      const key = dayKey(startTime)
      const existing = grouped.get(key)
      if (existing) {
        existing.push(startTime)
      } else {
        grouped.set(key, [startTime])
      }
    }
    return grouped
  }, [slots])

  const loadWeek = useCallback(async () => {
    if (!configured) return

    setLoading(true)
    setLoadError(null)
    try {
      setSlots(await fetchAvailability(weekStart, addDays(weekStart, 7)))
    } catch (error) {
      setSlots([])
      setLoadError(error instanceof Error ? error.message : 'Could not load available times')
    } finally {
      setLoading(false)
    }
  }, [configured, weekStart])

  useEffect(() => {
    void loadWeek()
  }, [loadWeek])

  // Keep the visitor's day choice when it is still in view, otherwise fall back
  // to the first day of the week that has open times.
  useEffect(() => {
    const keys = weekDays.map(dayKey)
    const todayKey = dayKey(today)

    setSelectedStartTime(null)
    setSelectedDay((current) => {
      if (current && keys.includes(current)) return current
      return keys.find((key) => slotsByDay.has(key)) ?? keys.find((key) => key >= todayKey) ?? null
    })
  }, [slotsByDay, today, weekDays])

  const goToWeek = useCallback((nextWeekStart: Date) => {
    setWeekStart(nextWeekStart)
    setVisibleMonth(startOfMonth(addDays(nextWeekStart, 3)))
  }, [])

  const selectDate = useCallback(
    (date: Date) => {
      setSelectedDay(dayKey(date))
      setSelectedStartTime(null)
      setWeekStart(startOfWeek(date, WEEK_OPTIONS))
    },
    [],
  )

  function resetBooking() {
    setConfirmed(null)
    setStep('time')
    setSelectedStartTime(null)
    void loadWeek()
  }

  if (confirmed) {
    return (
      <BookingConfirmed
        booking={confirmed.booking}
        email={confirmed.email}
        onBookAnother={resetBooking}
      />
    )
  }

  const inDetails = step === 'details' && selectedStartTime !== null

  return (
    <div className={styles.widget}>
      <MeetingSummary
        timeZone={timeZone}
        selectedStartTime={inDetails ? selectedStartTime : null}
      />

      <div className={styles.calendarPane}>
        <MonthCalendar
          month={visibleMonth}
          selected={selectedDay ? new Date(`${selectedDay}T00:00:00`) : null}
          minDate={today}
          disabled={inDetails}
          onMonthChange={setVisibleMonth}
          onSelect={selectDate}
        />
      </div>

      <div className={styles.picker}>
        {inDetails && selectedStartTime ? (
          <DetailsForm
            startTime={selectedStartTime}
            timeZone={timeZone}
            onBack={() => setStep('time')}
            onBooked={(booking, email) => setConfirmed({ booking, email })}
          />
        ) : (
          <SlotPicker
            weekDays={weekDays}
            slotsByDay={slotsByDay}
            selectedDay={selectedDay}
            selectedStartTime={selectedStartTime}
            loading={loading}
            error={loadError}
            canGoBack={weekStart > startOfWeek(today, WEEK_OPTIONS)}
            onPreviousWeek={() => goToWeek(subWeeks(weekStart, 1))}
            onNextWeek={() => goToWeek(addDays(weekStart, 7))}
            onSelectDay={(day) => {
              setSelectedDay(day)
              setSelectedStartTime(null)
            }}
            onSelectStartTime={setSelectedStartTime}
            onContinue={() => setStep('details')}
          />
        )}
      </div>
    </div>
  )
}
