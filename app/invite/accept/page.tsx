import { Suspense } from 'react'
import AcceptInvitePage from './AcceptInviteClient'

export default function Page() {
  return (
    <Suspense>
      <AcceptInvitePage />
    </Suspense>
  )
}
