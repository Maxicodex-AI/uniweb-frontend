'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export default function DriverLogin() {
  const router = useRouter()
  const [isRegister, setIsRegister] = useState(false)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [tricycleNumber, setTricycleNumber] = useState('')
  const [totalSeats, setTotalSeats] = useState('3')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const endpoint = isRegister ? '/api/drivers/register' : '/api/drivers/login'
      const body = isRegister
        ? { name, phone, password, tricycleNumber, totalSeats: parseInt(totalSeats) }
        : { phone, password }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Failed')
        return
      }

      localStorage.setItem('driver_token', data.token)
      localStorage.setItem('driver_data', JSON.stringify(data.driver))
      router.push('/driver')
    } catch (err) {
      setError('Connection error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #052e16, #16a34a)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: '32px 28px',
        width: '100%', maxWidth: 400,
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🛺</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#052e16', marginBottom: 4 }}>
            UniWeb Driver
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            {isRegister ? 'Register your tricycle' : 'Sign in to start your shift'}
          </p>
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 10, padding: 4, marginBottom: 24 }}>
          <button
            onClick={() => setIsRegister(false)}
            style={{
              flex: 1, padding: '10px', borderRadius: 8, border: 'none',
              background: !isRegister ? '#16a34a' : 'transparent',
              color: !isRegister ? 'white' : '#6b7280',
              cursor: 'pointer', fontWeight: 600, fontSize: 14,
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsRegister(true)}
            style={{
              flex: 1, padding: '10px', borderRadius: 8, border: 'none',
              background: isRegister ? '#16a34a' : 'transparent',
              color: isRegister ? 'white' : '#6b7280',
              cursor: 'pointer', fontWeight: 600, fontSize: 14,
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Full Name
              </label>
              <input
                type="text" placeholder="e.g. Emeka Johnson"
                value={name} onChange={e => setName(e.target.value)} required
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 15, outline: 'none', marginBottom: 14 }}
              />

              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Tricycle Number
              </label>
              <input
                type="text" placeholder="e.g. TRI-001"
                value={tricycleNumber} onChange={e => setTricycleNumber(e.target.value)} required
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 15, outline: 'none', marginBottom: 14 }}
              />

              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Total Seats (excluding driver)
              </label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {['2', '3', '4'].map(s => (
                  <button
                    key={s} type="button"
                    onClick={() => setTotalSeats(s)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                      background: totalSeats === s ? '#16a34a' : '#f3f4f6',
                      color: totalSeats === s ? 'white' : '#374151',
                      cursor: 'pointer', fontWeight: 700, fontSize: 16,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}

          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
            Phone Number
          </label>
          <input
            type="tel" placeholder="e.g. 08012345678"
            value={phone} onChange={e => setPhone(e.target.value)} required
            style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 15, outline: 'none', marginBottom: 14 }}
          />

          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
            Password
          </label>
          <input
            type="password" placeholder="Your password"
            value={password} onChange={e => setPassword(e.target.value)} required
            style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 15, outline: 'none', marginBottom: 20 }}
          />

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? '#9ca3af' : '#16a34a',
              color: 'white', border: 'none', borderRadius: 10,
              fontWeight: 800, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Please wait...' : isRegister ? 'Register & Start' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/" style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'none' }}>
            ← Back to UniWeb
          </a>
        </div>
      </div>
    </div>
  )
}