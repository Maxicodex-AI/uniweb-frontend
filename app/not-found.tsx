'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>

        {/* Animated number */}
        <div style={{
          fontSize: 'clamp(80px, 20vw, 140px)',
          fontWeight: 900,
          lineHeight: 1,
          background: 'linear-gradient(135deg, #16a34a, #052e16)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 8,
          letterSpacing: '-0.04em',
        }}>
          404
        </div>

        <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>

        <h1 style={{
          fontSize: 24, fontWeight: 800,
          color: '#1f2937', marginBottom: 10,
        }}>
          Page Not Found
        </h1>

        <p style={{
          fontSize: 15, color: '#6b7280',
          lineHeight: 1.7, marginBottom: 32,
        }}>
          The page you are looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard">
            <button style={{
              background: 'linear-gradient(135deg, #16a34a, #052e16)',
              color: 'white', border: 'none', borderRadius: 10,
              padding: '12px 28px', cursor: 'pointer',
              fontWeight: 700, fontSize: 14,
            }}>
              Go to Dashboard →
            </button>
          </Link>
          <Link href="/">
            <button style={{
              background: 'white', color: '#374151',
              border: '1.5px solid #e5e7eb', borderRadius: 10,
              padding: '12px 28px', cursor: 'pointer',
              fontWeight: 600, fontSize: 14,
            }}>
              Go Home
            </button>
          </Link>
        </div>

        {/* Quick links */}
        <div style={{ marginTop: 40 }}>
          <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>
            Or go directly to:
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: '💬 Chat', href: '/chat' },
              { label: '📡 Live Classes', href: '/live' },
              { label: '🎓 Learning Hub', href: '/learning-hub' },
              { label: '📢 Announcements', href: '/announcements' },
            ].map(link => (
              <Link key={link.href} href={link.href}>
                <button style={{
                  background: '#f3f4f6', border: 'none',
                  borderRadius: 8, padding: '6px 14px',
                  cursor: 'pointer', fontSize: 13,
                  color: '#374151', fontWeight: 500,
                }}>
                  {link.label}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}