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

const instrumentSerif = localFont({
  src: [
    { path: './fonts/instrument-serif-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/instrument-serif-latin-400-italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-instrument-serif',
  display: 'swap',
  fallback: ['Iowan Old Style', 'Georgia', 'serif'],
})

const geist = localFont({
  src: [
    { path: './fonts/geist-sans-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: './fonts/geist-sans-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/geist-sans-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/geist-sans-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-geist',
  display: 'swap',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://prokuro.ai'),
  title: {
    default: 'Prokuro AI | Procurement Agents That Work Your BOM',
    template: '%s | Prokuro AI',
  },
  description:
    'Prokuro deploys procurement agents against your BOM. They screen every line, source in-stock parts across distributors, drive landed cost down, plan the buy against your build date, and clear trade exposure. You approve, they execute.',
  icons: {
    icon: [{ url: '/brand/prokuro-mark.svg', type: 'image/svg+xml' }],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://prokuro.ai',
    siteName: 'Prokuro',
    title: 'Prokuro AI | Procurement Agents That Work Your BOM',
    description:
      'Upload a BOM. Agents screen every line, source in-stock parts across distributors, cut landed cost, plan the buy, and clear trade exposure.',
    images: [{ url: '/og.svg', width: 1200, height: 630, alt: 'Prokuro' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prokuro AI | Procurement Agents That Work Your BOM',
    description:
      'Upload a BOM. Agents screen every line, source in-stock parts across distributors, cut landed cost, plan the buy, and clear trade exposure.',
    images: ['/og.svg'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} ${geist.variable}`}
    >
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
