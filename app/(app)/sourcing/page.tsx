import SourcingPage from '@/components/SourcingPage'
import { PAGE, pageMetadata } from '@/lib/pageTitle'

export const metadata = pageMetadata(PAGE.sourcing)

export default function Page() {
  return <SourcingPage />
}
