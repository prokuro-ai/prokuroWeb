import AdminPage from '@/components/AdminPage'
import { PAGE, pageMetadata } from '@/lib/pageTitle'

export const metadata = pageMetadata(PAGE.admin)

export default function AdminRoute() {
  return <AdminPage />
}
