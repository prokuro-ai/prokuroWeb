import type { Metadata } from 'next'
import { IBM_Plex_Sans, Inter, JetBrains_Mono } from 'next/font/google'
import { Providers } from '@/components/Providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

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
  title: 'Prokuro.ai | AI Procurement Analyst for BOM Risk',
  description:
    'Prokuro is your AI procurement analyst — it tells you which parts in your BOM are about to become a problem, hands you the proven solution, and eliminates the cross-functional coordination that usually takes days.',
  icons: { icon: '/favicon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plexSans.variable} ${jetbrainsMono.variable}`}>
      <body className={plexSans.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
