import type { Metadata } from 'next'
import { Suspense } from 'react'
import DemoDashboard from '@/components/DemoDashboard'

export const metadata: Metadata = {
  title: 'Interactive Demo | Prokuro.ai',
  description:
    'Explore a sample Prokuro portfolio with five BOMs covering EOL, NRND, tariffs, lead time, and alternates.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function DemoRoute() {
  return (
    <Suspense fallback={null}>
      <DemoDashboard />
    </Suspense>
  )
}
