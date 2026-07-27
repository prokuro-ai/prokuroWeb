import { Clock, Globe, Video } from 'lucide-react'
import { formatConfirmation, timeZoneLabel } from '@/lib/schedule/datetime'
import { DEMO_MEETING } from '@/lib/schedule/meeting'
import styles from './schedule.module.css'

interface MeetingSummaryProps {
  timeZone: string
  selectedStartTime: string | null
}

export default function MeetingSummary({ timeZone, selectedStartTime }: MeetingSummaryProps) {
  return (
    <div className={styles.summary}>
      <p className={styles.brand}>
        <span className={styles.brandDot} aria-hidden="true" />
        Prokuro.ai
      </p>

      <h2 className={styles.summaryTitle}>{DEMO_MEETING.title}</h2>
      <p className={styles.summaryLead}>{DEMO_MEETING.lead}</p>

      <ul className={styles.metaList}>
        <li className={styles.metaItem}>
          <Clock size={15} aria-hidden="true" />
          {DEMO_MEETING.durationMinutes} minutes
        </li>
        <li className={styles.metaItem}>
          <Video size={15} aria-hidden="true" />
          {DEMO_MEETING.location}
        </li>
        <li className={styles.metaItem}>
          <Globe size={15} aria-hidden="true" />
          {timeZoneLabel(timeZone)}
        </li>
      </ul>

      {selectedStartTime ? (
        <div className={styles.selectedSlot}>
          <p className={styles.selectedSlotLabel}>Selected time</p>
          <p className={styles.selectedSlotValue}>{formatConfirmation(selectedStartTime)}</p>
        </div>
      ) : null}
    </div>
  )
}
