'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import io from 'socket.io-client'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export default function DriverPortal() {
  const router = useRouter()
  const [driver, setDriver] = useState<any>(null)
  const [isOnShift, setIsOnShift] = useState(false)
  const [availableSeats, setAvailableSeats] = useState(3)
  const [status, setStatus] = useState<'offline' | 'active' | 'full'>('offline')
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const socketRef = useRef<any>(null)
  const watchIdRef = useRef<number | null>(null)
  const tokenRef = useRef<string>('')

  useEffect(() => {
    const token = localStorage.getItem('driver_token')
    const driverData = localStorage.getItem('driver_data')

    if (!token || !driverData) {
      router.push('/driver-login')
      return
    }

    tokenRef.current = token
    const parsed = JSON.parse(driverData)
    setDriver(parsed)
    setAvailableSeats(parsed.availableSeats || parsed.totalSeats || 3)
    setIsOnShift(parsed.isOnShift || false)
    setStatus(parsed.status || 'offline')

    // Fetch fresh data
    fetch(`${API_BASE}/api/drivers/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setDriver(data)
        setAvailableSeats(data.availableSeats)
        setIsOnShift(data.isOnShift)
        setStatus(data.status)
        localStorage.setItem('driver_data', JSON.stringify(data))
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    // Connect socket
    socketRef.current = io(API_BASE)
    return () => {
      if (socketRef.current) socketRef.current.disconnect()
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [])

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('GPS not supported on this device')
      return
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy: acc } = position.coords
        setLocationEnabled(true)
        setLocationError('')
        setLastUpdate(new Date())
        setAccuracy(Math.round(acc))

        // Send location via socket
        if (socketRef.current && isOnShift) {
          socketRef.current.emit('driverLocation', {
            driverId: driver?._id,
            lat: latitude,
            lng: longitude,
            availableSeats,
            status: availableSeats === 0 ? 'full' : 'active',
            token: tokenRef.current,
          })
        }
      },
      (err) => {
        setLocationEnabled(false)
        if (err.code === 1) setLocationError('Location permission denied. Please enable GPS.')
        else if (err.code === 2) setLocationError('GPS signal not found. Move to open area.')
        else setLocationError('GPS error. Try again.')
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    )
  }

  const stopLocationTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setLocationEnabled(false)
  }

  const startShift = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/drivers/start-shift`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      })
      if (res.ok) {
        const data = await res.json()
        setIsOnShift(true)
        setStatus('active')
        setAvailableSeats(data.totalSeats)
        setDriver(data)
        localStorage.setItem('driver_data', JSON.stringify(data))
        startLocationTracking()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const endShift = async () => {
    if (!confirm('End your shift? Your location will stop broadcasting.')) return
    try {
      const res = await fetch(`${API_BASE}/api/drivers/end-shift`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      })
      if (res.ok) {
        setIsOnShift(false)
        setStatus('offline')
        stopLocationTracking()

        if (socketRef.current) {
          socketRef.current.emit('driverDisconnect', { driverId: driver?._id })
        }
      }
    } catch (err) {}
  }

  const updateSeats = async (newSeats: number) => {
    const clamped = Math.max(0, Math.min(driver?.totalSeats || 3, newSeats))
    setAvailableSeats(clamped)
    const newStatus = clamped === 0 ? 'full' : 'active'
    setStatus(newStatus)

    try {
      await fetch(`${API_BASE}/api/drivers/seats`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ availableSeats: clamped }),
      })
    } catch (err) {}
  }

  const logout = () => {
    endShift()
    localStorage.removeItem('driver_token')
    localStorage.removeItem('driver_data')
    router.push('/driver-login')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#052e16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🛺</div>
        <p>Loading your portal...</p>
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: isOnShift ? 'linear-gradient(135deg, #052e16, #16a34a)' : '#1a1a2e',
      padding: '0 0 40px',
      transition: 'background 0.5s',
    }}>

      {/* Header */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🛺</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{driver?.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
              Tricycle {driver?.tricycleNumber}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            background: 'rgba(255,255,255,0.15)', border: 'none',
            borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
            color: 'white', fontSize: 12,
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ padding: '24px 20px', maxWidth: 480, margin: '0 auto' }}>

        {/* Status card */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 20, padding: '24px',
          textAlign: 'center', marginBottom: 24,
          border: `2px solid ${isOnShift ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.1)'}`,
        }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>
            {status === 'offline' ? '😴' : status === 'full' ? '🔴' : '🟢'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 4 }}>
            {status === 'offline' ? 'Off Shift' : status === 'full' ? 'FULL' : 'ON SHIFT'}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            {status === 'offline' ? 'Start your shift to go live' :
             status === 'full' ? 'No seats available' :
             `${availableSeats} of ${driver?.totalSeats} seats available`}
          </div>

          {locationEnabled && lastUpdate && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#4ade80' }}>
              📍 GPS active • Accuracy: {accuracy}m • Updated {new Date(lastUpdate).toLocaleTimeString()}
            </div>
          )}
          {locationError && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#f87171', background: 'rgba(239,68,68,0.1)', padding: '6px 12px', borderRadius: 6 }}>
              ⚠️ {locationError}
            </div>
          )}
        </div>

        {/* Start/End Shift */}
        {!isOnShift ? (
          <button
            onClick={startShift}
            style={{
              width: '100%', padding: '20px',
              background: '#16a34a', color: 'white',
              border: 'none', borderRadius: 16,
              fontWeight: 900, fontSize: 20, cursor: 'pointer',
              marginBottom: 16,
              boxShadow: '0 8px 32px rgba(22,163,74,0.4)',
            }}
          >
            🟢 Start Shift
          </button>
        ) : (
          <div style={{ marginBottom: 24 }}>
            {/* Seat controls */}
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 20, padding: '24px',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 16 }}>
                Available Seats
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                <button
                  onClick={() => updateSeats(availableSeats - 1)}
                  disabled={availableSeats === 0}
                  style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: availableSeats === 0 ? '#374151' : '#dc2626',
                    border: 'none', color: 'white', fontSize: 32,
                    cursor: availableSeats === 0 ? 'not-allowed' : 'pointer',
                    fontWeight: 900,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  }}
                >
                  −
                </button>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 64, fontWeight: 900, color: 'white', lineHeight: 1 }}>
                    {availableSeats}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                    of {driver?.totalSeats}
                  </div>
                </div>

                <button
                  onClick={() => updateSeats(availableSeats + 1)}
                  disabled={availableSeats === driver?.totalSeats}
                  style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: availableSeats === driver?.totalSeats ? '#374151' : '#16a34a',
                    border: 'none', color: 'white', fontSize: 32,
                    cursor: availableSeats === driver?.totalSeats ? 'not-allowed' : 'pointer',
                    fontWeight: 900,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  }}
                >
                  +
                </button>
              </div>

              {/* Seat visual */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                {Array.from({ length: driver?.totalSeats || 3 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 40, height: 40, borderRadius: 8,
                      background: i < availableSeats ? '#4ade80' : '#374151',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, transition: 'background 0.2s',
                    }}
                  >
                    {i < availableSeats ? '🪑' : '❌'}
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                Tap − when a passenger boards • Tap + when they alight
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => updateSeats(0)}
                style={{
                  padding: '14px', borderRadius: 12, border: 'none',
                  background: 'rgba(239,68,68,0.2)', color: '#f87171',
                  cursor: 'pointer', fontWeight: 700, fontSize: 14,
                }}
              >
                🔴 Mark Full
              </button>
              <button
                onClick={() => updateSeats(driver?.totalSeats)}
                style={{
                  padding: '14px', borderRadius: 12, border: 'none',
                  background: 'rgba(74,222,128,0.2)', color: '#4ade80',
                  cursor: 'pointer', fontWeight: 700, fontSize: 14,
                }}
              >
                🟢 All Empty
              </button>
            </div>

            {/* GPS toggle */}
            {!locationEnabled ? (
              <button
                onClick={startLocationTracking}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                  background: 'rgba(59,130,246,0.2)', color: '#60a5fa',
                  cursor: 'pointer', fontWeight: 700, fontSize: 14, marginBottom: 10,
                }}
              >
                📍 Enable GPS Location
              </button>
            ) : (
              <div style={{
                width: '100%', padding: '12px', borderRadius: 12,
                background: 'rgba(74,222,128,0.1)', color: '#4ade80',
                textAlign: 'center', fontSize: 13, fontWeight: 600, marginBottom: 10,
              }}>
                📍 GPS Active — Students can see you
              </div>
            )}

            <button
              onClick={endShift}
              style={{
                width: '100%', padding: '16px', borderRadius: 12, border: 'none',
                background: 'rgba(239,68,68,0.2)', color: '#f87171',
                cursor: 'pointer', fontWeight: 700, fontSize: 16,
              }}
            >
              ⏹ End Shift
            </button>
          </div>
        )}

        {/* Info cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { icon: '🛺', label: 'Tricycle', value: driver?.tricycleNumber },
            { icon: '🪑', label: 'Total Seats', value: driver?.totalSeats },
            { icon: '📞', label: 'Phone', value: driver?.phone },
            { icon: '📊', label: 'Status', value: status.toUpperCase() },
          ].map(info => (
            <div key={info.label} style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '14px',
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{info.icon}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{info.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{info.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}