import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pages that don't require login
const publicRoutes = ['/', '/login', '/register', '/driver-login'];

// Driver portal: /driver and anything under /driver/...
// Drivers sign in with their own token (not the student authToken cookie),
// so the portal checks that token itself and the API/socket auth enforce it
// server-side. Matching exactly (not startsWith('/driver')) avoids making
// unrelated future routes like /drivers-report public by accident.
const isDriverPortal = (pathname: string) =>
  pathname === '/driver' || pathname.startsWith('/driver/');

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes through without checking
  if (publicRoutes.includes(pathname) || isDriverPortal(pathname)) {
    return NextResponse.next();
  }

  // For all other routes, check for auth token
  // Next.js middleware runs on the server, so we check
  // cookies instead of localStorage (localStorage is browser-only)
  const token = request.cookies.get('authToken')?.value;

  if (!token) {
    // Not logged in — redirect to login page
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Tell Next.js which routes this middleware applies to.
// Excludes ANY path with a file extension (images, fonts, json, etc.) so every
// current and future /public asset is automatically public, without needing
// to be listed by name.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|json|woff|woff2|ttf|mp4|webm|mov|ogg)$).*)',
  ],
};