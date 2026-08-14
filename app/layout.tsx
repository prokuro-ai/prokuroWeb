import type { Metadata } from 'next'
import { Suspense } from 'react'
import localFont from 'next/font/local'
import { Providers } from '@/components/Providers'
import SelfServeRedirect from '@/components/SelfServeRedirect'
import './globals.css'

const plexSans = localFont({
  src: [
    { path: './fonts/ibm-plex-sans-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: './fonts/ibm-plex-sans-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/ibm-plex-sans-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-plex-sans',
  display: 'swap',
  fallback: ['Helvetica Neue', 'Arial', 'sans-serif'],
})

const jetbrainsMono = localFont({
  src: [
    { path: './fonts/jetbrains-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/jetbrains-mono-latin-500-normal.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
})

export const metadata: Metadata = {
  title: 'Prokuro.ai | AI Procurement Analyst for BOM Risk',
  description:
    'Prokuro is your AI procurement analyst. It tells you which parts in your BOM are about to become a problem, hands you the proven solution, and eliminates the cross-functional coordination that usually takes days.',
  icons: { icon: '/favicon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plexSans.variable} ${jetbrainsMono.variable}`}>
      <body className={plexSans.className}>
        <Providers>
          <Suspense fallback={null}>
            <SelfServeRedirect />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  )
}
