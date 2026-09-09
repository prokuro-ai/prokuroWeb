import { PAGE, pageMetadata } from '@/lib/pageTitle'

export const metadata = pageMetadata(PAGE.signingIn)

export default function AuthCallbackLayout({ children }: { children: React.ReactNode }) {
  return children
}
