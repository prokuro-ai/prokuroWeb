import { redirect } from 'next/navigation'

/** Public interactive demo retired — send visitors to scheduling. */
export default function DemoRoute() {
  redirect('/schedule')
}
