import { redirect } from 'next/navigation'

export default async function BomDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  await params
  redirect('/dashboard?tab=boms')
}
