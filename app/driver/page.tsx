'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import io from 'socket.io-client'
import { DRIVER_CSS } from './driverStyles'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

type ApiResult = { ok: boolean; status: number; data: any }

function clearSession() {
  localStorage.removeItem('driver_token')
  localStorage.removeItem('driver_data')
}

const fmtDateTime = (d?: string | Date | null) =>
  d
    ? new Date(d).toLocaleString('en-GB', {
        timeZone: 'Africa/Lagos', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : ''

export default function DriverApp() {
  const [phase, setPhase] = useState<'loading' | 'ready'>('loading')
  const [driver, setDriver] = useState<any>(null)
  const [today, setToday] = useState<any>(null) // /today: tricycles still free
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [inboxOpen, setInboxOpen] = useState(false)

  const [isOnShift, setIsOnShift] = useState(false)
  const [availableSeats, setAvailableSeats] = useState(3)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)

  const [picked, setPicked] = useState('')
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const tokenRef = useRef('')
  const socketRef = useRef<any>(null)
  const watchIdRef = useRef<number | null>(null)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null)
  const availableSeatsRef = useRef(3)
  const wakeLockRef = useRef<any>(null)

  // ---------- API ----------
  const api = useCallback(async (path: string, opts: { method?: string; body?: any } = {}): Promise<ApiResult> => {
    try {
      const res = await fetch(`${API_BASE}/api/drivers${path}`, {
        method: opts.method || 'GET',
        headers: {
          Authorization: `Bearer ${tokenRef.current}`,
          ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
      })
      const data = await res.json().catch(() => null)
      if (res.status === 401) {
        clearSession()
        window.location.href = '/driver-login'
      }
      return { ok: res.ok, status: res.status, data }
    } catch {
      return { ok: false, status: 0, data: { message: 'No connection. Check your network and try again.' } }
    }
  }, [])

  // ---------- Screen wake lock (a locked phone stops sending GPS) ----------
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
        wakeLockRef.current.addEventListener?.('release', () => { wakeLockRef.current = null })
      }
    } catch {
      /* not supported or refused: the shift still works */
    }
  }
  const releaseWakeLock = () => {
    try { wakeLockRef.current?.release?.() } catch { /* ignore */ }
    wakeLockRef.current = null
  }

  // ---------- GPS ----------
  const sendLocation = (lat: number, lng: number) => {
    if (!socketRef.current) return
    socketRef.current.emit('driverLocation', { lat, lng, availableSeats: availableSeatsRef.current })
  }

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('GPS is not supported on this phone')
      return
    }
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    if (heartbeatRef.current) clearInterval(heartbeatRef.current)

    watchIdRef.current = navigator.geolocation.watchPosition(
      position => {
        const { latitude, longitude, accuracy: acc } = position.coords
        setLocationEnabled(true)
        setLocationError('')
        setLastUpdate(new Date())
        setAccuracy(Math.round(acc))
        lastPosRef.current = { lat: latitude, lng: longitude }
        sendLocation(latitude, longitude)
      },
      err => {
        if (err.code === 3) return // a timeout is not fatal for a watch
        setLocationEnabled(false)
        if (err.code === 1) setLocationError('Location is blocked. Allow location for this site in your browser settings.')
        else if (err.code === 2) setLocationError('No GPS signal. Move to an open area.')
        else setLocationError('GPS problem. Try again.')
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    )

    // A parked phone may send no GPS updates, so repeat the last position
    heartbeatRef.current = setInterval(() => {
      const p = lastPosRef.current
      if (p) sendLocation(p.lat, p.lng)
    }, 20000)

    requestWakeLock()
  }

  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
    lastPosRef.current = null
    setLocationEnabled(false)
    releaseWakeLock()
  }

  // ---------- Loading the driver ----------
  const loadMe = useCallback(async () => {
    const r = await api('/me')
    if (!r.ok) return r
    const d = r.data
    setDriver(d)
    setIsOnShift(!!d.isOnShift)
    availableSeatsRef.current = d.availableSeats ?? d.totalSeats ?? 3
    setAvailableSeats(availableSeatsRef.current)

    if (d.accountStatus === 'approved') {
      if (!d.checkedInToday && !d.isOnShift) {
        const t = await api('/today')
        if (t.ok) setToday(t.data)
      }
      const a = await api('/announcements')
      if (a.ok) setAnnouncements(a.data)
    } else if (d.accountStatus !== 'approved') {
      stopLocationTracking()
    }
    return r
  }, [api])

  // Handlers the live connection calls. Kept in a ref so the connection is
  // created once but always uses the latest functions.
  const live = useRef<any>({})
  live.current = {
    reload: () => loadMe(),
    released: () => {
      stopLocationTracking()
      setIsOnShift(false)
      setMessage({ ok: false, text: 'A fleet admin released your tricycle. Please pick one again.' })
      loadMe()
    },
    announcement: (a: any) => {
      setAnnouncements(prev => (prev.some(x => x._id === a._id) ? prev : [{ ...a, read: false }, ...prev]))
    },
  }

  // ---------- Start-up ----------
  useEffect(() => {
    const token = localStorage.getItem('driver_token')
    if (!token) {
      window.location.href = '/driver-login'
      return
    }
    tokenRef.current = token

    ;(async () => {
      const r = await loadMe()
      if (r && r.ok) {
        setPhase('ready')
        // After a page reload mid-shift, resume GPS automatically if the
        // browser already has permission; otherwise show a button.
        if (r.data.isOnShift && r.data.accountStatus === 'approved') {
          try {
            const perm = await (navigator as any).permissions?.query({ name: 'geolocation' })
            if (perm && perm.state === 'granted') startLocationTracking()
          } catch { /* the "Resume GPS" button covers this */ }
        }
      }
    })()

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      releaseWakeLock()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------- Live connection ----------
  useEffect(() => {
    if (phase !== 'ready') return
    const socket = io(API_BASE, { auth: { token: tokenRef.current } })
    socketRef.current = socket

    socket.on('connect_error', (err: Error) => {
      if (err.message?.includes('Authentication') || err.message?.includes('User not found')) {
        setLocationError('Your session has expired. Please sign in again.')
      }
    })
    socket.on('accountStatusChanged', () => live.current.reload())
    socket.on('vehicleReassigned', () => live.current.reload())
    socket.on('checkInReleased', () => live.current.released())
    socket.on('fleetAnnouncement', (a: any) => live.current.announcement(a))

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [phase])

  // While waiting for approval, check every minute as a backup to the live message
  useEffect(() => {
    if (phase !== 'ready' || driver?.accountStatus !== 'pending') return
    const t = setInterval(() => loadMe(), 60000)
    return () => clearInterval(t)
  }, [phase, driver?.accountStatus, loadMe])

  // Re-acquire the wake lock when the driver comes back to the app
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && watchIdRef.current !== null) requestWakeLock()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // ---------- Actions ----------
  const flash = (ok: boolean, text: string) => setMessage({ ok, text })

  const agreeToConsent = async () => {
    setBusy(true)
    const r = await api('/consent', { method: 'PUT', body: { consent: true } })
    setBusy(false)
    if (r.ok) await loadMe()
    else flash(false, r.data?.message || 'Could not save. Try again.')
  }

  const confirmTricycle = async () => {
    if (!picked) return
    setBusy(true)
    setMessage(null)
    const r = await api('/check-in', { method: 'POST', body: { vehicleId: picked } })
    setBusy(false)
    if (r.ok) {
      setPicked('')
      await loadMe()
    } else {
      flash(false, r.data?.message || 'Could not check in. Try again.')
      setPicked('')
      await loadMe() // refresh the list of free tricycles
    }
  }

  const startShift = async () => {
    setBusy(true)
    setMessage(null)
    const r = await api('/start-shift', { method: 'PUT' })
    setBusy(false)
    if (r.ok) {
      setIsOnShift(true)
      availableSeatsRef.current = r.data.totalSeats
      setAvailableSeats(r.data.totalSeats)
      setDriver((d: any) => ({ ...d, ...r.data, isOnShift: true }))
      startLocationTracking()
    } else {
      flash(false, r.data?.message || 'Could not start your shift.')
      if (r.data?.needsConsent || r.data?.needsCheckIn) await loadMe()
    }
  }

  const endShift = async (ask = true) => {
    if (ask && !confirm('End your shift? Your location will stop being shared.')) return
    const r = await api('/end-shift', { method: 'PUT' })
    if (r.ok) {
      stopLocationTracking()
      setIsOnShift(false)
      setAccuracy(null)
      setLastUpdate(null)
    } else {
      flash(false, r.data?.message || 'Could not end your shift.')
    }
  }

  const updateSeats = async (n: number) => {
    const total = driver?.totalSeats || 3
    const clamped = Math.max(0, Math.min(total, n))
    availableSeatsRef.current = clamped
    setAvailableSeats(clamped)
    const r = await api('/seats', { method: 'PUT', body: { availableSeats: clamped } })
    if (!r.ok) flash(false, r.data?.message || 'Seat count not saved. Check your connection.')
  }

  const logout = async () => {
    if (isOnShift) await endShift(false)
    stopLocationTracking()
    clearSession()
    window.location.href = '/driver-login'
  }

  const markRead = async (id: string) => {
    setAnnouncements(prev => prev.map(a => (a._id === id ? { ...a, read: true } : a)))
    await api(`/announcements/${id}/read`, { method: 'POST' })
  }

  // ---------- Screens ----------
  if (phase === 'loading' || !driver) {
    return (
      <div className="dv">
        <style>{DRIVER_CSS}</style>
        <div className="dv-center" style={{ textAlign: 'center' }}>
          <div><div style={{ fontSize: 54 }}>🛺</div><p style={{ color: 'var(--mut)', marginTop: 8 }}>Opening your app…</p></div>
        </div>
      </div>
    )
  }

  const status = driver.accountStatus
  const unread = announcements.filter(a => !a.read).length
  const urgent = announcements.find(a => a.urgent && !a.read)

  const SignOutLink = (
    <div style={{ textAlign: 'center' }}>
      <button className="dv-link" style={{ background: 'none', border: 0 }} onClick={logout}>Sign out</button>
    </div>
  )

  // ----- Waiting for approval -----
  if (status === 'pending') {
    return (
      <div className="dv">
        <style>{DRIVER_CSS}</style>
        <div className="dv-center">
          <div style={{ width: '100%', maxWidth: 440 }}>
            <div className="dv-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 56 }}>⏳</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: '6px 0' }}>Waiting for approval</h2>
              <p style={{ color: 'var(--mut)', fontSize: 14 }}>
                Thank you, {driver.name?.split(' ')[0]}. A fleet admin is checking your details. This screen
                updates by itself as soon as you are approved.
              </p>
              <div className="dv-info" style={{ textAlign: 'left' }}>
                <div><small>Phone</small><b>{driver.phone}</b></div>
                <div><small>Licence number</small><b>{driver.licenseNumber || '—'}</b></div>
              </div>
              <button className="dv-btn g" style={{ marginTop: 18 }} onClick={() => loadMe()}>Check again</button>
            </div>
            {SignOutLink}
          </div>
        </div>
      </div>
    )
  }

  // ----- Rejected or suspended -----
  if (status === 'rejected' || status === 'suspended') {
    const rejected = status === 'rejected'
    return (
      <div className="dv">
        <style>{DRIVER_CSS}</style>
        <div className="dv-center">
          <div style={{ width: '100%', maxWidth: 440 }}>
            <div className="dv-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 56 }}>{rejected ? '❌' : '🚫'}</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: '6px 0' }}>
                {rejected ? 'Application not approved' : 'Account suspended'}
              </h2>
              {driver.statusReason && (
                <div className="dv-alert warn" style={{ textAlign: 'left' }}>
                  <b>Reason:</b> {driver.statusReason}
                </div>
              )}
              <p style={{ color: 'var(--mut)', fontSize: 14, marginTop: 14 }}>
                Please contact the fleet office if you think this is a mistake.
              </p>
              <button className="dv-btn g" style={{ marginTop: 16 }} onClick={() => loadMe()}>Check again</button>
            </div>
            {SignOutLink}
          </div>
        </div>
      </div>
    )
  }

  // ----- Approved, but has not agreed to share location yet (older accounts) -----
  if (driver.needsConsent) {
    return (
      <div className="dv">
        <style>{DRIVER_CSS}</style>
        <div className="dv-center">
          <div style={{ width: '100%', maxWidth: 440 }}>
            <div className="dv-card">
              <div style={{ fontSize: 48, textAlign: 'center' }}>📍</div>
              <h2 style={{ fontSize: 21, fontWeight: 900, textAlign: 'center', margin: '6px 0 10px' }}>One quick thing</h2>
              <p style={{ color: 'var(--mut)', fontSize: 14 }}>
                The campus now shows live tricycle positions to students and staff. Please confirm you are happy with this.
              </p>
              <label className="dv-check">
                <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
                <span>
                  I agree that while I am on shift, my tricycle’s live location, tricycle number and free seats are
                  visible to students and campus staff, and my name is shown to signed-in students. My location is
                  only shared during a shift.
                </span>
              </label>
              {message && <div className={`dv-alert ${message.ok ? 'ok' : 'bad'}`}>{message.text}</div>}
              <button className="dv-btn p" style={{ marginTop: 18 }} disabled={!agree || busy} onClick={agreeToConsent}>
                {busy ? 'Saving…' : 'I agree, continue'}
              </button>
            </div>
            {SignOutLink}
          </div>
        </div>
      </div>
    )
  }

  // ----- Approved, but no tricycle picked yet today: the daily check-in -----
  const needsCheckIn = !driver.checkedInToday && !driver.isOnShift && !isOnShift
  if (needsCheckIn) {
    const free: any[] = today?.vehicles || []
    return (
      <div className="dv">
        <style>{DRIVER_CSS}</style>
        <div className="dv-wrap" style={{ paddingTop: 36 }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 50 }}>🛺</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>
              {driver.greeting}, {driver.name?.split(' ')[0]}
            </h1>
            <p style={{ color: 'var(--mut)', fontSize: 15, marginTop: 4 }}>Which tricycle are you on today?</p>
          </div>

          {!today ? (
            <p style={{ textAlign: 'center', color: 'var(--mut)', marginTop: 24 }}>Loading tricycles…</p>
          ) : free.length === 0 ? (
            <div className="dv-card" style={{ marginTop: 20, textAlign: 'center' }}>
              <p>No tricycle is free right now.</p>
              <p style={{ color: 'var(--mut)', fontSize: 13, marginTop: 6 }}>Ask a fleet admin, then check again.</p>
              <button className="dv-btn g" style={{ marginTop: 14 }} onClick={() => loadMe()}>Check again</button>
            </div>
          ) : (
            <>
              <div className="dv-vlist">
                {free.map(v => (
                  <button key={v._id} className={`dv-v${picked === v._id ? ' on' : ''}`} onClick={() => setPicked(v._id)}>
                    <b>{v.number}</b>
                    <small>{v.seats} seats{v.plate ? ` · ${v.plate}` : ''}</small>
                  </button>
                ))}
              </div>
              <p style={{ color: 'var(--mut)', fontSize: 12, textAlign: 'center', marginBottom: 14 }}>
                You keep this tricycle for the rest of today. To change it, ask a fleet admin.
              </p>
              {message && <div className={`dv-alert ${message.ok ? 'ok' : 'bad'}`} style={{ marginBottom: 12 }}>{message.text}</div>}
              <button className="dv-btn p" disabled={!picked || busy} onClick={confirmTricycle}>
                {busy ? 'Checking in…' : picked ? `Confirm ${free.find(v => v._id === picked)?.number}` : 'Choose your tricycle'}
              </button>
            </>
          )}
          {SignOutLink}
        </div>
      </div>
    )
  }

  // ----- The shift screen -----
  const total = driver.totalSeats || 3
  const full = availableSeats === 0
  const liveStatus = !isOnShift ? 'offline' : full ? 'full' : 'active'

  return (
    <div className={`dv${isOnShift ? ' live' : ''}`}>
      <style>{DRIVER_CSS}</style>

      <div className="dv-top">
        <span style={{ fontSize: 26 }}>🛺</span>
        <div className="who">
          <b>{driver.name}</b>
          <small>Today: {driver.tricycleNumber || '—'}</small>
        </div>
        <button className="dv-icon" onClick={() => setInboxOpen(true)} aria-label="Messages">
          🔔{unread > 0 && <span className="dv-dot">{unread}</span>}
        </button>
        <button className="dv-mini" onClick={logout}>Sign out</button>
      </div>

      <div className="dv-wrap">
        <div className="dv-card glass dv-status">
          <div className="big">{liveStatus === 'offline' ? '😴' : liveStatus === 'full' ? '🔴' : '🟢'}</div>
          <h2>{liveStatus === 'offline' ? 'Off shift' : liveStatus === 'full' ? 'FULL' : 'ON SHIFT'}</h2>
          <p>
            {liveStatus === 'offline'
              ? 'Start your shift to appear on the campus map'
              : liveStatus === 'full'
                ? 'No seats available'
                : `${availableSeats} of ${total} seats free`}
          </p>
          {isOnShift && locationEnabled && lastUpdate && (
            <div className="dv-gps">📍 GPS active · accuracy {accuracy} m · updated {lastUpdate.toLocaleTimeString()}</div>
          )}
          {locationError && <div className="dv-alert bad" style={{ textAlign: 'left' }}>⚠️ {locationError}</div>}
        </div>

        {message && <div className={`dv-alert ${message.ok ? 'ok' : 'bad'}`} style={{ marginBottom: 14 }}>{message.text}</div>}

        {!isOnShift ? (
          <button className="dv-btn p" style={{ padding: 22, fontSize: 19 }} disabled={busy} onClick={startShift}>
            {busy ? 'Starting…' : '🟢 Start shift'}
          </button>
        ) : (
          <>
            <div className="dv-card glass">
              <p style={{ textAlign: 'center', fontWeight: 700, color: 'rgba(255,255,255,.85)', marginBottom: 14 }}>Free seats</p>
              <div className="dv-seats">
                <button style={{ background: '#dc2626' }} disabled={availableSeats === 0} onClick={() => updateSeats(availableSeats - 1)} aria-label="One passenger boarded">−</button>
                <div>
                  <div className="num">{availableSeats}</div>
                  <div className="of">of {total}</div>
                </div>
                <button style={{ background: '#16a34a' }} disabled={availableSeats === total} onClick={() => updateSeats(availableSeats + 1)} aria-label="One passenger left">+</button>
              </div>
              <div className="dv-pips">
                {Array.from({ length: total }).map((_, i) => (
                  <span key={i} style={{ background: i < availableSeats ? '#4ade80' : '#374151' }}>{i < availableSeats ? '🪑' : '❌'}</span>
                ))}
              </div>
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--mut)' }}>Tap − when a passenger boards, + when they get off</p>
            </div>

            <div className="dv-grid2">
              <button className="dv-btn d" onClick={() => updateSeats(0)}>🔴 Mark full</button>
              <button className="dv-btn p" style={{ boxShadow: 'none' }} onClick={() => updateSeats(total)}>🟢 All empty</button>
            </div>

            {!locationEnabled && (
              <button className="dv-btn b" onClick={startLocationTracking}>📍 Turn on GPS</button>
            )}
            <button className="dv-btn d" style={{ marginTop: 10 }} onClick={() => endShift(true)}>⏹ End shift</button>
          </>
        )}

        {driver.isFleetAdmin && (
          <Link href="/fleet" className="dv-btn g" style={{ marginTop: 14 }}>🛡️ Open fleet portal</Link>
        )}

        <div className="dv-info">
          <div><small>Tricycle today</small><b>{driver.tricycleNumber || '—'}</b></div>
          <div><small>Total seats</small><b>{total}</b></div>
          <div><small>Phone</small><b>{driver.phone}</b></div>
          <div><small>Status</small><b>{liveStatus.toUpperCase()}</b></div>
        </div>
      </div>

      {/* Urgent message: must be acknowledged */}
      {urgent && (
        <div className="dv-overlay">
          <div className="dv-sheet urgent" role="alertdialog" aria-label="Urgent message">
            <span className="dv-tag">URGENT</span>
            <h3>{urgent.title}</h3>
            <p style={{ margin: '10px 0 6px', fontSize: 15 }}>{urgent.body}</p>
            <small style={{ color: 'var(--mut)' }}>{urgent.from ? `From ${urgent.from} · ` : ''}{fmtDateTime(urgent.createdAt)}</small>
            <button className="dv-btn p" style={{ marginTop: 18 }} onClick={() => markRead(urgent._id)}>OK, I understand</button>
          </div>
        </div>
      )}

      {/* Message inbox */}
      {inboxOpen && !urgent && (
        <div className="dv-overlay" onClick={() => setInboxOpen(false)}>
          <div className="dv-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-label="Messages">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h3>Messages</h3>
              <button className="dv-mini" onClick={() => setInboxOpen(false)}>Close</button>
            </div>
            {announcements.length === 0 ? (
              <p style={{ color: 'var(--mut)', padding: '24px 0', textAlign: 'center' }}>No messages yet.</p>
            ) : (
              announcements.map(a => (
                <div
                  key={a._id}
                  className={`dv-ann${a.read ? '' : ' unread'}`}
                  onClick={() => { if (!a.read) markRead(a._id) }}
                >
                  {a.urgent && <span className="dv-tag">URGENT</span>}
                  <b>{a.title}</b>
                  <p>{a.body}</p>
                  <small>{a.from ? `${a.from} · ` : ''}{fmtDateTime(a.createdAt)}</small>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}