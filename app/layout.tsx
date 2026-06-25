import type { Metadata } from 'next'
import { IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google'
import { Providers } from '@/components/Providers'
import './globals.css'

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-plex-sans',
  weight: ['300', '400', '600'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Prokuro.ai | AI-Powered Supply Chain Intelligence',
  description:
    'Prokuro.ai gives hardware OEMs early warning on component risk before disruptions become production-stopping disasters.',
  icons: { icon: '/favicon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plexSans.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
