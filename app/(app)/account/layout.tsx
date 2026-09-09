import { PAGE, pageMetadata } from '@/lib/pageTitle'

export const metadata = pageMetadata(PAGE.settings)

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children
}
