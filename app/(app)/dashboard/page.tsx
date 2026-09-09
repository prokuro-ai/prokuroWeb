import { Suspense } from 'react'
import OverviewPage from '@/components/OverviewPage'
import { PAGE, pageMetadata } from '@/lib/pageTitle'

export const metadata = pageMetadata(PAGE.thisWeek)

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <OverviewPage />
    </Suspense>
  )
}
