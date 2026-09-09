import { PAGE, pageMetadata } from '@/lib/pageTitle'

export const metadata = pageMetadata(PAGE.billing)

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return children
}
