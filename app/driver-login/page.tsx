'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DRIVER_CSS } from '../driver/driverStyles'
import { BRAND } from '../brand'
import BrandMark from '../BrandMark'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

// 08012345678, +2348012345678 and 234 801 234 5678 are the same number.
// This mirrors the server so the driver gets an instant message.
function normalizePhone(p: string) {
  let s = p.replace(/[\s\-()]/g, '')
  if (s.startsWith('+234')) s = '0' + s.slice(4)
  else if (s.startsWith('234') && s.length === 13) s = '0' + s.slice(3)
  return s
}

// Where to go after signing in. Only paths inside this site are allowed, so
// the link cannot be used to send someone to another website.
function getNext(): string {
  const r = new URLSearchParams(window.location.search).get('next')
  const safe = r && r.startsWith('/') && !r.startsWith('//') && !r.startsWith('/\\')
  return safe ? (r as string) : '/driver'
}

export default function DriverLogin() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'register'>('signin')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [license, setLicense] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Already signed in? Go straight on. (The driver app clears an expired token,
  // so this cannot loop.)
  useEffect(() => {
    if (localStorage.getItem('driver_token')) router.replace(getNext())
  }, [router])

  const switchMode = (m: 'signin' | 'register') => {
    setMode(m)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanPhone = normalizePhone(phone)
    if (!/^0\d{10}$/.test(cleanPhone)) {
      setError('Enter your 11-digit phone number, for example 08012345678')
      return
    }

    if (mode === 'register') {
      if (name.trim().length < 2) return setError('Enter your full name')
      if (license.replace(/\s+/g, '').length < 5) return setError('Enter your driving licence number')
      if (password.length < 6) return setError('Your password must be at least 6 characters')
      if (password !== confirm) return setError('The two passwords do not match')
      if (!consent) return setError('You must agree to share your location during your shift')
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/drivers/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'register'
            ? { name: name.trim(), phone: cleanPhone, password, licenseNumber: license, locationConsent: true }
            : { phone: cleanPhone, password }
        ),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || 'Something went wrong. Please try again.')
        return
      }

      localStorage.setItem('driver_token', data.token)
      localStorage.setItem('driver_data', JSON.stringify(data.driver))
      router.push(getNext())
    } catch {
      setError('No connection. Check your network and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dv">
      <style>{DRIVER_CSS}</style>
      <div className="dv-center">
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div className="dv-logo">
            {BRAND.logo ? <BrandMark height={46} /> : <i>🛺</i>}
            <h1 style={{ marginTop: 12 }}>{BRAND.driverTitle}</h1>
            <p>{BRAND.driverSubtitle}</p>
          </div>

          <div className="dv-card">
            <div className="dv-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'on' : ''} onClick={() => switchMode('signin')}>Sign in</button>
              <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'on' : ''} onClick={() => switchMode('register')}>Register</button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {mode === 'register' && (
                <>
                  <label className="dv-label" htmlFor="name" style={{ marginTop: 0 }}>Full name</label>
                  <input id="name" className="dv-input" type="text" autoComplete="name" placeholder="e.g. Emeka Johnson" value={name} onChange={e => setName(e.target.value)} />
                </>
              )}

              <label className="dv-label" htmlFor="phone" style={mode === 'signin' ? { marginTop: 0 } : undefined}>Phone number</label>
              <input id="phone" className="dv-input" type="tel" inputMode="tel" autoComplete="tel" placeholder="08012345678" value={phone} onChange={e => setPhone(e.target.value)} />

              {mode === 'register' && (
                <>
                  <label className="dv-label" htmlFor="license">Driving licence number</label>
                  <input id="license" className="dv-input" type="text" autoCapitalize="characters" autoComplete="off" placeholder="As written on your licence" value={license} onChange={e => setLicense(e.target.value)} />
                  <p className="dv-hint">A fleet admin will check this before you can start work.</p>
                </>
              )}

              <label className="dv-label" htmlFor="password">Password</label>
              <input id="password" className="dv-input" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'} value={password} onChange={e => setPassword(e.target.value)} />

              {mode === 'register' && (
                <>
                  <label className="dv-label" htmlFor="confirm">Confirm password</label>
                  <input id="confirm" className="dv-input" type="password" autoComplete="new-password" placeholder="Type it again" value={confirm} onChange={e => setConfirm(e.target.value)} />

                  <label className="dv-check">
                    <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
                    <span>
                      I agree that while I am on shift, my tricycle’s live location, tricycle number and free seats
                      are visible to students and campus staff, and my name is shown to signed-in students.
                      My location is only shared during a shift.
                    </span>
                  </label>
                </>
              )}

              {error && <div className="dv-alert bad" role="alert">{error}</div>}

              <button type="submit" className="dv-btn p" disabled={loading} style={{ marginTop: 20 }}>
                {loading ? 'Please wait…' : mode === 'register' ? 'Create my account' : 'Sign in'}
              </button>
            </form>
          </div>

          <div style={{ textAlign: 'center' }}>
            <a href="/" className="dv-link">← Back to UniWeb</a>
          </div>
        </div>
      </div>
    </div>
  )
}