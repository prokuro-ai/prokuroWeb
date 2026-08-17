import { Suspense } from 'react'
import OverviewPage from '@/components/OverviewPage'

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <OverviewPage />
    </Suspense>
  )
}
