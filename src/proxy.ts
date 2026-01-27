import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
  const isPublicPage = req.nextUrl.pathname === '/' || isAuthPage

  // For protected pages, client-side auth check will handle redirection
  // This middleware mainly handles static file serving

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png|sw.js|workbox-.*\\.js).*)',
  ],
}