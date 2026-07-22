import { Suspense } from 'react'
import BomResultPage from '@/components/BomResultPage'

export default async function BomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Suspense fallback={null}>
      <BomResultPage id={id} />
    </Suspense>
  )
}
