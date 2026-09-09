import PurchasingPage from '@/components/PurchasingPage'
import { PAGE, pageMetadata } from '@/lib/pageTitle'

export const metadata = pageMetadata(PAGE.buy)

export default function Page() {
  return <PurchasingPage />
}
