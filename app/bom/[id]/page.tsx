import { redirect } from 'next/navigation'

export default async function BomDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/dashboard?tab=boms&bom=${encodeURIComponent(id)}`)
}
