import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session-cookie';

// Next.js Middleware runs on the Edge Runtime, which cannot load Prisma or
// jsonwebtoken (both are Node-only). So this only checks whether a session
// cookie is PRESENT — it does not verify the JWT signature or look up the
// user. That's intentional: this is a fast-path UX redirect, not the real
// security boundary. Actual verification (signature, expiry, banned status,
// admin role) happens in requireUser()/requireAdmin() (src/lib/auth.ts),
// which every protected Server Component and Route Handler calls in the
// normal Node.js runtime. A forged or expired cookie would pass this
// middleware check but still get rejected/redirected at that layer.
const PROTECTED_PREFIXES = ['/dashboard', '/locations/new'];
const ADMIN_PREFIXES = ['/admin'];
const AUTH_PAGES = ['/login', '/register'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSessionCookie = !!req.cookies.get(SESSION_COOKIE_NAME)?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAdmin = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));

  if ((isProtected || isAdmin) && !hasSessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (AUTH_PAGES.includes(pathname) && hasSessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/locations/new', '/admin/:path*', '/login', '/register'],
};
