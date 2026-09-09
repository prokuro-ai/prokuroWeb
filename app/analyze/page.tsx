import { redirect } from 'next/navigation'
import { PAGE, pageMetadata } from '@/lib/pageTitle'

export const metadata = pageMetadata(PAGE.boms)

export default function AnalyzeRedirect() {
  redirect('/boms')
}
