'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

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

        <div style={{ fontSize: 80, marginBottom: 16 }}>⚠️</div>

        <h1 style={{
          fontSize: 24, fontWeight: 800,
          color: '#1f2937', marginBottom: 10,
        }}>
          Something went wrong
        </h1>

        <p style={{
          fontSize: 15, color: '#6b7280',
          lineHeight: 1.7, marginBottom: 8,
        }}>
          An unexpected error occurred. Don't worry — your data is safe.
        </p>

        {error?.message && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 8, padding: '10px 14px',
            fontSize: 12, color: '#dc2626',
            marginBottom: 24, fontFamily: 'monospace',
            textAlign: 'left',
          }}>
            {error.message}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
          <button
            onClick={reset}
            style={{
              background: 'linear-gradient(135deg, #16a34a, #052e16)',
              color: 'white', border: 'none', borderRadius: 10,
              padding: '12px 28px', cursor: 'pointer',
              fontWeight: 700, fontSize: 14,
            }}
          >
            Try Again →
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{
              background: 'white', color: '#374151',
              border: '1.5px solid #e5e7eb', borderRadius: 10,
              padding: '12px 28px', cursor: 'pointer',
              fontWeight: 600, fontSize: 14,
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}