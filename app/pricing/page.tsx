import { redirect } from 'next/navigation'
import { SCHEDULE_DEMO_PATH } from '@/lib/sales'

export default function PricingRoute() {
  redirect(SCHEDULE_DEMO_PATH)
}
