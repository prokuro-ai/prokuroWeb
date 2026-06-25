import { redirect } from 'next/navigation'

export default function NewBomPage() {
  redirect('/dashboard?upload=1')
}
