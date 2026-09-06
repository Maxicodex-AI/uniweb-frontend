// utils/auth.ts
// Helper functions for managing the auth token as a cookie
// We use cookies instead of localStorage because:
// 1. Next.js middleware (server-side) can read cookies but not localStorage
// 2. Cookies work on both server and client side

// Save token as a cookie (expires in 1 day)
export function setAuthToken(token: string) {
  const expires = new Date();
  expires.setDate(expires.getDate() + 1);
  document.cookie = `authToken=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
}

// Read token from cookies
export function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith('authToken='));
  return match ? match.split('=')[1] : null;
}

// Delete the auth token cookie (logout)
export function removeAuthToken() {
  document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}