import BomsPage from '@/components/BomsPage'
import { PAGE, pageMetadata } from '@/lib/pageTitle'

export const metadata = pageMetadata(PAGE.boms)

export default function Page() {
  return <BomsPage />
}
