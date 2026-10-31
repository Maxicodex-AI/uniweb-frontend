'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import io from 'socket.io-client'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
const CAMPUS_CENTER = { lat: 6.8699, lng: 7.4082 }

// Estimates. Tune these after testing on campus.
const ASSUMED_SPEED_MS = (15 * 1000) / 3600 // about 15 km/h
const ROAD_FACTOR = 1.3 // roads are longer than a straight line
const STOPPED_BELOW_M = 15 // moved less than this in the window = stopped
const DIRECTION_DELTA_M = 10 // change in distance needed to call it toward/away
const HISTORY_MS = 60 * 1000
const STALE_AFTER_S = 60

type LatLng = { lat: number; lng: number }
type Pt = LatLng & { t: number }
type Dir = 'toward' | 'away' | 'passing' | 'stopped' | 'moving' | 'unknown'

function haversine(a: LatLng, b: LatLng) {
  const R = 6371000
  const rad = (x: number) => (x * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

const formatDistance = (m: number) =>
  m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`

const etaMinutes = (m: number) =>
  Math.max(1, Math.round((m * ROAD_FACTOR) / ASSUMED_SPEED_MS / 60))

const ageText = (sec: number) =>
  sec < 60 ? `${sec}s ago` : `${Math.floor(sec / 60)} min ago`

// Driver-entered text goes into map markers, so escape it.
const esc = (s: string) =>
  String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  )

function getDirection(points: Pt[] | undefined, user: LatLng | null): Dir {
  if (!points || points.length < 2) return 'unknown'
  const first = points[0]
  const last = points[points.length - 1]
  if (last.t - first.t < 8000) return 'unknown'
  if (haversine(first, last) < STOPPED_BELOW_M) return 'stopped'
  if (!user) return 'moving'
  const before = haversine(first, user)
  const after = haversine(last, user)
  if (after < before - DIRECTION_DELTA_M) return 'toward'
  if (after > before + DIRECTION_DELTA_M) return 'away'
  return 'passing'
}

const DIR_LABEL: Record<Dir, string> = {
  toward: 'Coming toward you',
  away: 'Moving away',
  passing: 'Passing by',
  stopped: 'Stopped',
  moving: 'Moving',
  unknown: 'Locating',
}

const DIR_COLOR: Record<Dir, string> = {
  toward: '#4ade80',
  away: '#f87171',
  passing: '#fbbf24',
  stopped: '#94a3b8',
  moving: '#60a5fa',
  unknown: '#94a3b8',
}

const isFull = (d: any) => d.status === 'full' || d.availableSeats <= 0
const seatColor = (d: any) => (isFull(d) ? '#ef4444' : d.availableSeats === 1 ? '#d97706' : '#16a34a')
const seatText = (d: any) => (isFull(d) ? 'Full' : `${d.availableSeats} of ${d.totalSeats} seats free`)

function makeIcon(L: any, d: any, active: boolean) {
  const html = `<div style="position:absolute;transform:translate(-50%,-50%)${active ? ' scale(1.15)' : ''};background:${seatColor(d)};color:#fff;padding:5px 10px;border-radius:999px;font:800 12px Arial,sans-serif;white-space:nowrap;border:${active ? '3px' : '2px'} solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)">${esc(d.tricycleNumber)} · ${d.availableSeats}/${d.totalSeats}</div>`
  return L.divIcon({ html, className: '', iconSize: [0, 0] })
}

export default function TransportPage() {
  const [drivers, setDrivers] = useState<any[]>([])
  const [userLocation, setUserLocation] = useState<LatLng | null>(null)
  const [locError, setLocError] = useState('')
  const [showList, setShowList] = useState(false)
  const [tab, setTab] = useState<'available' | 'all'>('available')
  const [followId, setFollowId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const [now, setNow] = useState(Date.now())

  const containerRef = useRef<HTMLDivElement>(null)
  const mapObj = useRef<any>(null)
  const leafletRef = useRef<any>(null)
  const markersRef = useRef<Record<string, any>>({})
  const lineRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const historyRef = useRef<Record<string, Pt[]>>({})
  const driversRef = useRef<any[]>([])
  const userRef = useRef<LatLng | null>(null)
  const watchRef = useRef<number | null>(null)
  const centeredRef = useRef(false)
  const loadingRef = useRef(false)

  driversRef.current = drivers
  userRef.current = userLocation

  const recordPoint = (id: string, lat: number, lng: number) => {
    const t = Date.now()
    const list = (historyRef.current[id] || []).filter(p => t - p.t <= HISTORY_MS)
    list.push({ lat, lng, t })
    historyRef.current[id] = list.slice(-10)
  }

  const loadDrivers = async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    try {
      const res = await fetch(`${API_BASE}/api/drivers/active`)
      if (!res.ok) return
      const data = await res.json()
      if (!Array.isArray(data)) return
      const mapped = data.map((d: any) => {
        const loc = d.currentLocation
        if (loc?.lat != null && !historyRef.current[d._id]) {
          recordPoint(d._id, loc.lat, loc.lng)
        }
        return {
          ...d,
          lastSeen: loc?.updatedAt ? new Date(loc.updatedAt).getTime() : Date.now(),
        }
      })
      setDrivers(mapped)
    } catch {
      /* ignore, the next refresh will retry */
    } finally {
      loadingRef.current = false
    }
  }

  // ===== Live data =====
  useEffect(() => {
    loadDrivers()
    const socket = io(API_BASE)

    socket.on('driverLocationUpdate', (data: any) => {
      recordPoint(data.driverId, data.lat, data.lng)
      if (!driversRef.current.some(d => d._id === data.driverId)) {
        loadDrivers()
        return
      }
      setDrivers(prev =>
        prev.map(d =>
          d._id === data.driverId
            ? {
                ...d,
                currentLocation: { lat: data.lat, lng: data.lng, updatedAt: data.updatedAt },
                availableSeats: data.availableSeats,
                status: data.status,
                lastSeen: Date.now(),
              }
            : d
        )
      )
    })

    socket.on('driverUpdate', (data: any) => {
      setDrivers(prev =>
        prev.map(d =>
          d._id === data.driverId
            ? { ...d, availableSeats: data.availableSeats, totalSeats: data.totalSeats, status: data.status }
            : d
        )
      )
    })

    socket.on('driverOnline', () => loadDrivers())

    socket.on('driverOffline', (data: any) => {
      delete historyRef.current[data.driverId]
      setDrivers(prev => prev.filter(d => d._id !== data.driverId))
    })

    const tick = setInterval(() => setNow(Date.now()), 10000)
    const refresh = setInterval(loadDrivers, 60000)

    return () => {
      socket.disconnect()
      clearInterval(tick)
      clearInterval(refresh)
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, [])

  // ===== Map setup =====
  useEffect(() => {
    let cancelled = false
    let map: any = null
    ;(async () => {
      const mod: any = await import('leaflet')
      const L = mod.default || mod
      if (cancelled || !containerRef.current) return
      leafletRef.current = L
      map = L.map(containerRef.current, {
        center: [CAMPUS_CENTER.lat, CAMPUS_CENTER.lng],
        zoom: 16,
      })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)
      mapObj.current = map
      setMapReady(true)
    })()
    return () => {
      cancelled = true
      if (map) map.remove()
      mapObj.current = null
      markersRef.current = {}
      lineRef.current = null
      userMarkerRef.current = null
    }
  }, [])

  const startFollow = (id: string) => {
    const d = driversRef.current.find(x => x._id === id)
    setFollowId(id)
    setShowList(false)
    setNotice('')
    const map = mapObj.current
    if (!d || !map || d.currentLocation?.lat == null) return
    const u = userRef.current
    const target: [number, number] = [d.currentLocation.lat, d.currentLocation.lng]
    if (u) {
      map.fitBounds([[u.lat, u.lng], target], { padding: [70, 70], maxZoom: 18 })
    } else {
      map.setView(target, 18)
    }
  }

  // ===== Tricycle markers =====
  useEffect(() => {
    const L = leafletRef.current
    const map = mapObj.current
    if (!mapReady || !L || !map) return

    const seen = new Set<string>()
    drivers.forEach(d => {
      if (d.currentLocation?.lat == null) return
      seen.add(d._id)
      const latlng: [number, number] = [d.currentLocation.lat, d.currentLocation.lng]
      const icon = makeIcon(L, d, d._id === followId)
      const existing = markersRef.current[d._id]
      if (existing) {
        existing.setLatLng(latlng)
        existing.setIcon(icon)
      } else {
        markersRef.current[d._id] = L.marker(latlng, { icon })
          .addTo(map)
          .on('click', () => startFollow(d._id))
      }
      // Keep a followed tricycle in view when there is no line to fit
      if (d._id === followId && !userRef.current && !map.getBounds().contains(latlng)) {
        map.panTo(latlng)
      }
    })

    Object.keys(markersRef.current).forEach(id => {
      if (!seen.has(id)) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
      }
    })
  }, [drivers, followId, mapReady])

  // ===== My location marker =====
  useEffect(() => {
    const L = leafletRef.current
    const map = mapObj.current
    if (!mapReady || !L || !map || !userLocation) return
    const latlng: [number, number] = [userLocation.lat, userLocation.lng]
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(latlng)
    } else {
      userMarkerRef.current = L.circleMarker(latlng, {
        radius: 8,
        color: '#ffffff',
        weight: 3,
        fillColor: '#2563eb',
        fillOpacity: 1,
      })
        .addTo(map)
        .bindTooltip('You')
    }
    if (!centeredRef.current) {
      centeredRef.current = true
      map.setView(latlng, 17)
    }
  }, [userLocation, mapReady])

  // ===== Line from you to the followed tricycle =====
  useEffect(() => {
    const L = leafletRef.current
    const map = mapObj.current
    if (!mapReady || !L || !map) return
    const d = drivers.find(x => x._id === followId)
    if (!d || !userLocation || d.currentLocation?.lat == null) {
      if (lineRef.current) {
        lineRef.current.remove()
        lineRef.current = null
      }
      return
    }
    const pts: [number, number][] = [
      [userLocation.lat, userLocation.lng],
      [d.currentLocation.lat, d.currentLocation.lng],
    ]
    if (lineRef.current) lineRef.current.setLatLngs(pts)
    else lineRef.current = L.polyline(pts, { color: '#3b82f6', weight: 4, dashArray: '8 8' }).addTo(map)
  }, [drivers, userLocation, followId, mapReady])

  // ===== Followed tricycle went offline =====
  useEffect(() => {
    if (followId && !drivers.some(d => d._id === followId)) {
      setFollowId(null)
      setNotice('The tricycle you were following is no longer active.')
    }
  }, [drivers, followId])

  const enableLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Location is not supported on this device.')
      return
    }
    if (watchRef.current != null) return
    watchRef.current = navigator.geolocation.watchPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocError('')
      },
      err => {
        watchRef.current = null
        setLocError(
          err.code === 1
            ? 'Location permission was denied. Allow it in your browser settings to see distances.'
            : 'Could not get your location. Try again in an open area.'
        )
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )
  }

  const describe = (d: any) => {
    const loc = d.currentLocation
    const dist = userLocation && loc?.lat != null ? haversine(userLocation, loc) : null
    const dir = getDirection(historyRef.current[d._id], userLocation)
    const ageSec = d.lastSeen ? Math.max(0, Math.round((now - d.lastSeen) / 1000)) : null
    return { dist, dir, ageSec }
  }

  const rows = drivers
    .filter(d => d.currentLocation?.lat != null)
    .map(d => ({ d, ...describe(d) }))
    .filter(r => tab === 'all' || !isFull(r.d))
    .sort((a, b) =>
      a.dist != null && b.dist != null ? a.dist - b.dist : b.d.availableSeats - a.d.availableSeats
    )

  const availableCount = drivers.filter(d => !isFull(d)).length
  const followed = drivers.find(d => d._id === followId) || null
  const followedInfo = followed ? describe(followed) : null

  const pill = (color: string): React.CSSProperties => ({
    background: color + '22',
    color,
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
  })

  return (
    <div style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />

      {/* Header */}
      <div style={{
        background: '#1e293b', padding: '12px 16px', display: 'flex',
        alignItems: 'center', gap: 14, borderBottom: '1px solid #334155', flexShrink: 0,
      }}>
        <Link href="/intranet" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13 }}>
          ← Intranet
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: 'white', margin: 0 }}>Campus Transport</h1>
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
            {drivers.length} tricycle{drivers.length !== 1 ? 's' : ''} active now
          </p>
        </div>
        <button
          onClick={enableLocation}
          style={{
            background: userLocation ? '#16a34a' : '#334155', border: 'none', borderRadius: 8,
            padding: '8px 14px', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}
        >
          {userLocation ? 'Location on' : 'My Location'}
        </button>
      </div>

      {/* Map + overlays */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

        {(locError || notice) && (
          <div style={{
            position: 'absolute', top: 12, left: 12, right: 12, zIndex: 1000, maxWidth: 480,
            margin: '0 auto', background: '#7c2d12', color: '#ffedd5', borderRadius: 10,
            padding: '10px 14px', fontSize: 13, display: 'flex', gap: 10, alignItems: 'center',
          }}>
            <span style={{ flex: 1 }}>{locError || notice}</span>
            <button
              onClick={() => { setLocError(''); setNotice('') }}
              style={{ background: 'none', border: 'none', color: '#ffedd5', cursor: 'pointer', fontSize: 18 }}
            >
              ×
            </button>
          </div>
        )}

        {/* Open-list button */}
        {!showList && !followed && (
          <button
            onClick={() => setShowList(true)}
            style={{
              position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
              zIndex: 1000, background: '#16a34a', color: 'white', border: 'none',
              borderRadius: 999, padding: '14px 26px', fontWeight: 800, fontSize: 15,
              cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', whiteSpace: 'nowrap',
            }}
          >
            View available tricycles ({availableCount})
          </button>
        )}

        {/* List sheet */}
        {showList && (
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1000,
            maxWidth: 560, margin: '0 auto', maxHeight: '62%', display: 'flex',
            flexDirection: 'column', background: '#1e293b', borderTopLeftRadius: 16,
            borderTopRightRadius: 16, boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
              borderBottom: '1px solid #334155',
            }}>
              {([
                ['available', `Available (${availableCount})`],
                ['all', `All (${drivers.length})`],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none',
                    background: tab === key ? '#16a34a' : '#334155',
                    color: tab === key ? 'white' : '#94a3b8',
                    cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  }}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => setShowList(false)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 22 }}
              >
                ×
              </button>
            </div>

            {!userLocation && (
              <div style={{
                padding: '10px 16px', background: '#0f172a', color: '#94a3b8', fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ flex: 1 }}>Turn on your location to sort by distance and see which way each tricycle is moving.</span>
                <button
                  onClick={enableLocation}
                  style={{ background: '#2563eb', border: 'none', borderRadius: 6, color: 'white', padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Turn on
                </button>
              </div>
            )}

            <div style={{ overflowY: 'auto' }}>
              {rows.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b', fontSize: 14 }}>
                  {tab === 'available'
                    ? 'No tricycles with free seats right now.'
                    : 'No tricycles are active right now.'}
                </div>
              ) : (
                rows.map(({ d, dist, dir, ageSec }) => {
                  const stale = ageSec != null && ageSec > STALE_AFTER_S
                  return (
                    <div
                      key={d._id}
                      onClick={() => startFollow(d._id)}
                      style={{
                        padding: '14px 16px', borderBottom: '1px solid #334155', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 14, opacity: stale ? 0.6 : 1,
                      }}
                    >
                      <div style={{
                        width: 6, alignSelf: 'stretch', borderRadius: 3, background: seatColor(d), flexShrink: 0,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>{d.tricycleNumber}</span>
                          <span style={pill(seatColor(d))}>{seatText(d)}</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {dist != null && <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{formatDistance(dist)} away</span>}
                          <span style={{ color: DIR_COLOR[dir], fontWeight: 600 }}>{DIR_LABEL[dir]}</span>
                          {stale && ageSec != null && <span style={{ color: '#fbbf24' }}>Last seen {ageText(ageSec)}</span>}
                        </div>
                      </div>
                      <span style={{ color: '#64748b', fontSize: 20 }}>›</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Following card */}
        {followed && followedInfo && (
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1000, maxWidth: 560,
            margin: '0 auto', background: '#1e293b', borderTopLeftRadius: 16, borderTopRightRadius: 16,
            padding: '16px 18px', boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 2 }}>FOLLOWING</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>{followed.tricycleNumber}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Driver: {followed.name}</div>
              </div>
              <span style={pill(seatColor(followed))}>{seatText(followed)}</span>
            </div>

            {followedInfo.dist != null ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div style={{ background: '#0f172a', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>{formatDistance(followedInfo.dist)}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>straight-line distance</div>
                </div>
                <div style={{ background: '#0f172a', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  {followedInfo.dir === 'away' ? (
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#f87171' }}>Moving away</div>
                  ) : (
                    <div style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>~{etaMinutes(followedInfo.dist)} min</div>
                  )}
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    {followedInfo.dir === 'away' ? 'no ETA while it leaves' : 'rough estimate'}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                background: '#0f172a', borderRadius: 10, padding: '10px 12px', marginBottom: 12,
                fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ flex: 1 }}>Turn on your location to see the distance and a line to this tricycle.</span>
                <button
                  onClick={enableLocation}
                  style={{ background: '#2563eb', border: 'none', borderRadius: 6, color: 'white', padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Turn on
                </button>
              </div>
            )}

            <div style={{ fontSize: 12, marginBottom: 12, display: 'flex', gap: 12 }}>
              <span style={{ color: DIR_COLOR[followedInfo.dir], fontWeight: 700 }}>{DIR_LABEL[followedInfo.dir]}</span>
              {followedInfo.ageSec != null && followedInfo.ageSec > STALE_AFTER_S && (
                <span style={{ color: '#fbbf24' }}>Last seen {ageText(followedInfo.ageSec)}</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setFollowId(null); setShowList(true) }}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: '#334155', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Back to list
              </button>
              <button
                onClick={() => setFollowId(null)}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: '#7f1d1d', color: '#fecaca', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Stop following
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}