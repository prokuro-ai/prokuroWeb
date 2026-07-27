import path from 'path'
import type { NextConfig } from 'next'

const isStaticExport = process.env.STATIC_EXPORT === '1'

function pagesBasePath(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? ''
  if (!raw || raw === '/') return ''
  return raw.startsWith('/') ? raw.replace(/\/$/, '') : `/${raw.replace(/\/$/, '')}`
}

const basePath = isStaticExport ? pagesBasePath() : ''

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../'),
  ...(isStaticExport
    ? {
        output: 'export' as const,
        images: { unoptimized: true },
        trailingSlash: true,
        ...(basePath ? { basePath, assetPrefix: basePath } : {}),
      }
    : {}),
}

export default nextConfig
