import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isBlockedRoute } from '@/lib/access'
import { SCHEDULE_DEMO_PATH } from '@/lib/sales'

export function middleware(request: NextRequest) {
  if (isBlockedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL(SCHEDULE_DEMO_PATH, request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/login',
    '/signup',
    '/dashboard/:path*',
    '/boms/:path*',
    '/purchasing/:path*',
    '/account/:path*',
    '/bom/:path*',
    '/analyze/:path*',
    '/auth/:path*',
    '/invite/:path*',
  ],
}
