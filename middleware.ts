import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pages that don't require login
const publicRoutes = ['/', '/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes through without checking
  if (publicRoutes.includes(pathname)) {
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
// FIX: previously whitelisted individual filenames (icon-192.png, icon-512.png,
// manifest.json) which meant any OTHER static file in /public — like uniweb.png,
// imgbg.png, imgbg1.png, ekpoR.jpg — fell through to the auth check and got
// redirected to /login. This now excludes ANY path with a file extension
// (images, fonts, json, etc.) so every current and future /public asset is
// automatically public, without needing to be listed by name.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|json|woff|woff2|ttf|mp4|webm|mov|ogg)$).*)',
  ],
};