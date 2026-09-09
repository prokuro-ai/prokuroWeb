import { Suspense } from 'react'
import BomResultPage from '@/components/BomResultPage'
import { PAGE, pageMetadata } from '@/lib/pageTitle'

export const metadata = pageMetadata(PAGE.bom)

/** Required for `output: 'export'` — no BOM ids are pre-rendered. */
export function generateStaticParams() {
  return []
}

export default async function BomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Suspense fallback={null}>
      <BomResultPage id={id} />
    </Suspense>
  )
}
