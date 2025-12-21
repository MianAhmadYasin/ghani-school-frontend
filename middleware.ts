import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // For professional CRM session management, we let the client handle everything
  // This ensures smooth refresh without redirects
  // The AuthContext and AuthGate components handle authentication properly
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}



