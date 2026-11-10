'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setAuthToken } from '../utils/auth';

// Where to go after login. The middleware sends people here as
// /login?redirect=/some/page, so honour that. Only paths inside this site are
// allowed: "//evil.com" and "https://evil.com" would otherwise turn the login
// page into an open redirect.
function getRedirect(): string {
  const r = new URLSearchParams(window.location.search).get('redirect');
  const safe =
    r &&
    r.startsWith('/') &&
    !r.startsWith('//') &&
    !r.startsWith('/\\') &&
    !r.startsWith('/login');
  return safe ? (r as string) : '/dashboard';
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || 'Login failed');
        return;
      }

      // Save token as cookie instead of localStorage
      setAuthToken(data.token);

      router.push(getRedirect());

    } catch (err) {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-sm">
      <div className="card" style={{ marginTop: 40 }}>
        <h1 style={{ marginBottom: 4 }}>Welcome back</h1>
        <p style={{ color: '#4b5563', marginBottom: 24, fontSize: 14 }}>
          Login to access your UniWeb account
        </p>

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Your email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Your password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: 20 }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {message && (
          <div className="alert alert-error" style={{ marginTop: 16 }}>
            {message}
          </div>
        )}

        <p style={{ marginTop: 20, fontSize: 14, color: '#4b5563' }}>
          Don't have an account?{' '}
          <a href="/register">Register here</a>
        </p>

        <p style={{ marginTop: 8, fontSize: 14, color: '#4b5563' }}>
          Tricycle driver or fleet admin?{' '}
          <a href="/driver-login">Sign in here</a>
        </p>
      </div>
    </div>
  );
}