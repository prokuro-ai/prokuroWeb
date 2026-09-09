import { Suspense } from 'react'
import AcceptInvitePage from './AcceptInviteClient'
import { PAGE, pageMetadata } from '@/lib/pageTitle'

export const metadata = pageMetadata(PAGE.invite)

export default function Page() {
  return (
    <Suspense>
      <AcceptInvitePage />
    </Suspense>
  )
}
