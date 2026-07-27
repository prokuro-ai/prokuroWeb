import { redirect } from 'next/navigation'

export default function BomNewRedirect() {
  redirect('/dashboard?tab=boms')
}
