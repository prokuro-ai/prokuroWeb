export interface BookingConfirmation {
  startTime: string
  timezone: string
  /** Calendly scheduled event URI — used to cancel in-app. */
  eventUri: string
}

export interface BookingRequest {
  startTime: string
  firstName: string
  lastName: string
  email: string
  timezone: string
  /** Optional; sent as Calendly invitee.text_reminder_number (E.164). */
  phone?: string
  notes?: string
}
