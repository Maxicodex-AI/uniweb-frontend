'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import io from 'socket.io-client'
import { getAuthToken } from '../../utils/auth'
import { useTheme } from '../../context/ThemeContext'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
const CAMPUS_CENTER = { lat: 6.8699, lng: 7.4082 }

// ===== Tunables =====
const ASSUMED_SPEED_MS = (15 * 1000) / 3600 // fallback speed, about 15 km/h
const MIN_SPEED_MS = 2 // learned speed is clamped to this range so one
const MAX_SPEED_MS = 11 // noisy GPS reading can't give a silly ETA
const ROAD_FACTOR = 1.3 // roads are longer than a straight line
const STOPPED_BELOW_M = 15 // moved less than this in the window = stopped
const DIRECTION_DELTA_M = 10 // change in distance needed to call it toward/away
const HISTORY_MS = 60 * 1000
const STALE_AFTER_S = 60
const ALERT_RADIUS_M = 200 // "Alert me" distance

type LatLng = { lat: number; lng: number }
type Pt = LatLng & { t: number }
type Dir = 'toward' | 'away' | 'passing' | 'stopped' | 'moving' | 'unknown'
type Info = {
  dist: number | null
  dir: Dir
  ageSec: number | null
  etaMin: number | null
  etaSec: number | null
  learned: boolean
  kmh: number | null
}
type Anim = {
  fromLat: number; fromLng: number
  toLat: number; toLng: number
  curLat: number; curLng: number
  start: number; dur: number; lastAt: number
}

// ===== Styles =====
// Both layouts: the map fills the screen and a button opens the list.
// Phones (< 768px): the list/follow card is a bottom sheet, and the page
//   stops above the bottom tab bar.
// Desktop/tablet (>= 768px): the list/follow card is a floating panel on the
//   left of the map.
//
// Tune these two numbers to match your app shell:
//   --topbar-h : height of your Topbar
//   --tabs-h   : height of BottomTabs on phones (set to 0px if your page
//                content already leaves room for it)
const CSS = `
.tp-root{--topbar-h:60px;--tabs-h:64px;height:calc(100vh - var(--topbar-h) - var(--tabs-h));height:calc(100dvh - var(--topbar-h) - var(--tabs-h));display:flex;flex-direction:column;background:#0f172a;color:#fff}
.tp-root *{box-sizing:border-box}
.tp-head{background:#1e293b;padding:10px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #334155;flex-shrink:0}
.tp-head a{color:#94a3b8;text-decoration:none;font-size:13px;white-space:nowrap}
.tp-title{flex:1;min-width:0}
.tp-title h1{font-size:16px;font-weight:800;color:#fff;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tp-title p{font-size:11px;color:#64748b;margin:0}
.tp-hbtn{border:none;border-radius:8px;padding:8px 12px;color:#fff;cursor:pointer;font-size:12px;font-weight:600;white-space:nowrap;transition:background .2s,transform .1s}
.tp-hbtn:active{transform:scale(.96)}
.tp-body{flex:1;min-height:0;position:relative;display:flex}
.tp-map-wrap{flex:1;position:relative;min-width:0}
.tp-map{position:absolute;inset:0}

/* Notices and alerts */
.tp-stack{position:absolute;top:12px;left:12px;right:64px;z-index:1200;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none}
.tp-stack>*{pointer-events:auto;max-width:480px;width:100%}
.tp-banner{background:#7c2d12;color:#ffedd5;border-radius:10px;padding:10px 14px;font-size:13px;display:flex;gap:10px;align-items:center;animation:tp-drop .25s ease}
.tp-toast{background:#14532d;color:#dcfce7;border:1px solid #16a34a;border-radius:12px;padding:10px 12px 10px 14px;font-size:13px;display:flex;gap:10px;align-items:center;box-shadow:0 8px 24px rgba(0,0,0,.4);animation:tp-drop .25s ease}
.tp-toast button,.tp-banner button{font-family:inherit}

/* Open button */
.tp-open-btn{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);z-index:1200;background:#16a34a;color:#fff;border:none;border-radius:999px;padding:14px 26px;font-weight:800;font-size:15px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.4);white-space:nowrap;transition:background .2s,box-shadow .2s}
.tp-open-btn:hover{background:#15803d;box-shadow:0 10px 28px rgba(22,163,74,.45)}

/* Panel */
.tp-panel{position:absolute;left:0;right:0;bottom:0;z-index:1200;max-height:62%;display:none;flex-direction:column;background:#1e293b;border-radius:16px 16px 0 0;box-shadow:0 -8px 32px rgba(0,0,0,.4);padding-bottom:env(safe-area-inset-bottom,0px)}
.tp-panel.open{display:flex;animation:tp-up .28s cubic-bezier(.2,.8,.2,1)}
.tp-inner{flex:1;min-height:0;display:flex;flex-direction:column;animation:tp-fade .22s ease}
.tp-scroll{overflow-y:auto;-webkit-overflow-scrolling:touch}
.tp-close{margin-left:auto;background:none;border:none;color:#94a3b8;cursor:pointer;font-size:22px}
.tp-row{padding:14px 16px;border-bottom:1px solid #334155;cursor:pointer;display:flex;align-items:center;gap:14px;transition:background .15s}
.tp-row:hover{background:#243247}
.tp-best{margin:12px 12px 4px;padding:12px 14px;border-radius:14px;border:1px solid #b45309;background:linear-gradient(135deg,#422006,#1e293b);display:flex;align-items:center;gap:12px;cursor:pointer}
.tp-best:hover{border-color:#fbbf24}

/* Tricycle markers (they live inside the map) */
.tp-root .tp-mk{position:absolute;left:0;top:0;width:30px;height:30px;transform:translate(-15px,-15px);cursor:pointer}
.tp-root .tp-puck{position:absolute;inset:0;border-radius:50%;background:var(--c);border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.45);display:grid;place-items:center}
.tp-root .tp-dot{width:8px;height:8px;border-radius:50%;background:#fff;transition:opacity .3s}
.tp-root .tp-arrow{position:absolute;inset:0;display:grid;place-items:center;transition:transform .6s ease,opacity .3s}
.tp-root .tp-lab{position:absolute;left:37px;top:50%;transform:translateY(-50%);background:rgba(15,23,42,.93);color:#fff;border-radius:999px;padding:3px 10px;font:700 11px/1.3 system-ui,-apple-system,sans-serif;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;gap:7px;align-items:center}
.tp-root .tp-mk.best .tp-puck{border-color:#fbbf24}
.tp-root .tp-mk.active .tp-puck{animation:tp-ring 1.6s ease-out infinite}

/* My location */
.tp-root .tp-me{position:absolute;width:0;height:0}
.tp-root .tp-me b,.tp-root .tp-me i{position:absolute;left:-9px;top:-9px;width:18px;height:18px;border-radius:50%}
.tp-root .tp-me b{background:rgba(37,99,235,.5);animation:tp-pulse 2s ease-out infinite}
.tp-root .tp-me i{background:#2563eb;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4)}

/* Dark map: darken the standard tiles */
.tp-root .tp-tiles-dark{filter:invert(1) hue-rotate(180deg) brightness(.92) contrast(.88) saturate(.75)}

/* Map controls to match the dark UI */
.tp-root .leaflet-bar a{background:#1e293b;color:#e2e8f0;border-bottom-color:#334155}
.tp-root .leaflet-bar a:hover{background:#334155}
.tp-root .leaflet-control-attribution{background:rgba(15,23,42,.75);color:#94a3b8}
.tp-root .leaflet-control-attribution a{color:#cbd5e1}

@keyframes tp-up{from{transform:translateY(28px);opacity:0}to{transform:none;opacity:1}}
@keyframes tp-in{from{transform:translateX(-28px);opacity:0}to{transform:none;opacity:1}}
@keyframes tp-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes tp-drop{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
@keyframes tp-pulse{0%{transform:scale(1);opacity:.8}100%{transform:scale(3.4);opacity:0}}
@keyframes tp-ring{0%{box-shadow:0 0 0 0 rgba(255,255,255,.6),0 2px 10px rgba(0,0,0,.45)}100%{box-shadow:0 0 0 18px rgba(255,255,255,0),0 2px 10px rgba(0,0,0,.45)}}

@media (max-width:480px){
  .tp-back-txt{display:none}
}
@media (min-width:768px){
  .tp-root{--tabs-h:0px}
  .tp-panel{left:16px;right:auto;top:16px;bottom:16px;width:380px;max-height:none;border-radius:16px;padding-bottom:0;box-shadow:0 12px 40px rgba(0,0,0,.45)}
  .tp-panel.open{animation-name:tp-in}
  .tp-open-btn{bottom:24px}
  .tp-stack{left:412px}
}
@media (prefers-reduced-motion:reduce){
  .tp-root *{animation:none!important;transition:none!important}
}
`

// ===== Helpers =====
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

// Compass bearing from a to b in degrees (0 = north, 90 = east)
function bearing(a: LatLng, b: LatLng) {
  const rad = (x: number) => (x * Math.PI) / 180
  const deg = (x: number) => (x * 180) / Math.PI
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat))
  const x =
    Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
    Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng))
  return (deg(Math.atan2(y, x)) + 360) % 360
}

const formatDistance = (m: number) =>
  m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`

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

// Real speed (m/s) over the last ~30 seconds, or null when the tricycle is
// stopped or there isn't enough data yet. Uses straight displacement, so GPS
// jitter while parked doesn't look like movement.
function recentSpeed(points: Pt[] | undefined): number | null {
  if (!points || points.length < 2) return null
  const last = points[points.length - 1]
  const win = points.filter(p => last.t - p.t <= 30000)
  const first = win[0]
  const dt = (last.t - first.t) / 1000
  if (dt < 8) return null
  const dist = haversine(first, last)
  if (dist < STOPPED_BELOW_M) return null
  return dist / dt
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
const seatShort = (d: any) => (isFull(d) ? 'Full' : `${d.availableSeats} free`)

// Seat dots: filled = free seat, hollow = taken
function Dots({ avail, total }: { avail: number; total: number }) {
  const n = Math.min(total || 0, 8)
  return (
    <span style={{ letterSpacing: 2, fontSize: 12, whiteSpace: 'nowrap' }}>
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} style={{ color: i < avail ? '#4ade80' : '#475569' }}>
          {i < avail ? '●' : '○'}
        </span>
      ))}
    </span>
  )
}

function makeIcon(L: any, d: any, active: boolean, best: boolean, heading: number | null) {
  const full = isFull(d)
  const n = Math.min(d.totalSeats || 0, 8)
  const dots = Array.from({ length: n })
    .map((_, i) =>
      `<span style="color:${i < d.availableSeats ? '#4ade80' : '#475569'}">${i < d.availableSeats ? '●' : '○'}</span>`
    )
    .join('')
  const seats = full ? '<b style="color:#f87171">FULL</b>' : dots
  const html = `<div class="tp-mk${active ? ' active' : ''}${best ? ' best' : ''}" style="--c:${seatColor(d)}">
    <div class="tp-puck">
      <div class="tp-dot" style="opacity:${heading == null ? 1 : 0}"></div>
      <div class="tp-arrow" style="opacity:${heading == null ? 0 : 1};transform:rotate(${heading ?? 0}deg)">
        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2 L20 21 L12 16.5 L4 21 Z" fill="#fff"/></svg>
      </div>
    </div>
    <div class="tp-lab"><span>${esc(d.tricycleNumber)}</span><span style="letter-spacing:1px">${seats}</span>${best ? '<span style="color:#fbbf24">★</span>' : ''}</div>
  </div>`
  return L.divIcon({ html, className: '', iconSize: [0, 0] })
}

export default function TransportPage() {
  const { isDark } = useTheme()

  const [drivers, setDrivers] = useState<any[]>([])
  const [userLocation, setUserLocation] = useState<LatLng | null>(null)
  const [locError, setLocError] = useState('')
  const [showList, setShowList] = useState(false)
  const [tab, setTab] = useState<'available' | 'all'>('available')
  const [followId, setFollowId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [alertOn, setAlertOn] = useState(false)
  const [toast, setToast] = useState<{ id: string | null; text: string } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const mapObj = useRef<any>(null)
  const leafletRef = useRef<any>(null)
  const tileRef = useRef<any>(null)
  const markersRef = useRef<Record<string, any>>({})
  const markerKeyRef = useRef<Record<string, string>>({})
  const angleRef = useRef<Record<string, number>>({})
  const lineRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const historyRef = useRef<Record<string, Pt[]>>({})
  const headingRef = useRef<Record<string, number>>({})
  const animRef = useRef<Record<string, Anim>>({})
  const driversRef = useRef<any[]>([])
  const userRef = useRef<LatLng | null>(null)
  const followIdRef = useRef<string | null>(null)
  const bestIdRef = useRef<string | null>(null)
  const watchRef = useRef<number | null>(null)
  const centeredRef = useRef(false)
  const loadingRef = useRef(false)
  const reducedRef = useRef(false)
  const audioRef = useRef<any>(null)
  const alertedRef = useRef<Set<string>>(new Set())

  driversRef.current = drivers
  userRef.current = userLocation
  followIdRef.current = followId

  const recordPoint = (id: string, lat: number, lng: number) => {
    const t = Date.now()
    const list = (historyRef.current[id] || []).filter(p => t - p.t <= HISTORY_MS)
    list.push({ lat, lng, t })
    historyRef.current[id] = list.slice(-30)

    // Heading: bearing from the oldest recent point that is far enough away
    const here = { lat, lng }
    const recent = list.filter(p => t - p.t <= 20000)
    if (recent.length >= 2) {
      const far = recent.find(p => haversine(p, here) >= 6)
      if (far) headingRef.current[id] = bearing(far, here)
      else delete headingRef.current[id]
    }
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
    const socket = io(API_BASE, { auth: { token: getAuthToken() } })

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
                availableSeats: data.availableSeats ?? d.availableSeats,
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
      delete headingRef.current[data.driverId]
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
    let ro: ResizeObserver | null = null
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ;(async () => {
      const mod: any = await import('leaflet')
      const L = mod.default || mod
      if (cancelled || !containerRef.current) return
      leafletRef.current = L
      map = L.map(containerRef.current, {
        center: [CAMPUS_CENTER.lat, CAMPUS_CENTER.lng],
        zoom: 16,
        zoomControl: false,
      })
      // Top-right so the floating panel on desktop never covers the zoom buttons
      L.control.zoom({ position: 'topright' }).addTo(map)
      mapObj.current = map

      // Re-measure the map whenever its box changes (rotate phone, resize
      // window, switch between phone and desktop layouts)
      ro = new ResizeObserver(() => map && map.invalidateSize())
      ro.observe(containerRef.current)

      setMapReady(true)
    })()
    return () => {
      cancelled = true
      if (ro) ro.disconnect()
      if (map) map.remove()
      mapObj.current = null
      tileRef.current = null
      markersRef.current = {}
      markerKeyRef.current = {}
      lineRef.current = null
      userMarkerRef.current = null
    }
  }, [])

  // ===== Map style follows the light/dark theme =====
  useEffect(() => {
    const L = leafletRef.current
    const map = mapObj.current
    if (!mapReady || !L || !map) return
    if (tileRef.current) tileRef.current.remove()
    // OpenStreetMap tiles need no API key. Dark mode darkens the same tiles
    // with a CSS filter (see .tp-tiles-dark) instead of loading a second set.
    // If traffic grows, swap this URL for a keyed provider (MapTiler, Stadia,
    // Thunderforest) — it is the only line that needs to change.
    tileRef.current = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      className: isDark ? 'tp-tiles-dark' : '',
    }).addTo(map)
    tileRef.current.bringToBack()
  }, [isDark, mapReady])

  // ===== Smooth movement: glide markers between GPS points =====
  const setTarget = (id: string, lat: number, lng: number) => {
    const t = performance.now()
    const a = animRef.current[id]
    if (!a) {
      animRef.current[id] = {
        fromLat: lat, fromLng: lng, toLat: lat, toLng: lng,
        curLat: lat, curLng: lng, start: t, dur: 1, lastAt: t,
      }
      return
    }
    if (a.toLat === lat && a.toLng === lng) return
    const gap = t - a.lastAt
    a.fromLat = a.curLat
    a.fromLng = a.curLng
    a.toLat = lat
    a.toLng = lng
    a.start = t
    a.dur = reducedRef.current ? 1 : Math.min(2500, Math.max(700, gap))
    a.lastAt = t
  }

  useEffect(() => {
    if (!mapReady) return
    let raf = 0
    const step = () => {
      const t = performance.now()
      const fid = followIdRef.current
      let followedMoved = false
      Object.keys(animRef.current).forEach(id => {
        const a = animRef.current[id]
        if (a.curLat === a.toLat && a.curLng === a.toLng) return
        const p = Math.min(1, (t - a.start) / a.dur)
        if (p >= 1) {
          a.curLat = a.toLat
          a.curLng = a.toLng
        } else {
          a.curLat = a.fromLat + (a.toLat - a.fromLat) * p
          a.curLng = a.fromLng + (a.toLng - a.fromLng) * p
        }
        const m = markersRef.current[id]
        if (m) m.setLatLng([a.curLat, a.curLng])
        if (id === fid) followedMoved = true
      })
      // Keep the line to the followed tricycle glued to its gliding marker
      if (followedMoved && lineRef.current && userRef.current && fid) {
        const a = animRef.current[fid]
        if (a) {
          lineRef.current.setLatLngs([
            [userRef.current.lat, userRef.current.lng],
            [a.curLat, a.curLng],
          ])
        }
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [mapReady])

  const startFollow = (id: string) => {
    const d = driversRef.current.find(x => x._id === id)
    setFollowId(id)
    setShowList(false)
    setNotice('')
    const map = mapObj.current
    if (!d || !map || d.currentLocation?.lat == null) return
    const u = userRef.current
    const target: [number, number] = [d.currentLocation.lat, d.currentLocation.lng]
    const isPhone = window.matchMedia('(max-width: 767px)').matches
    // The panel covers part of the map (the bottom on phones, the left side on
    // desktop), so leave extra room there to keep the tricycle and you in view.
    map.fitBounds(u ? [[u.lat, u.lng], target] : [target, target], {
      paddingTopLeft: [isPhone ? 50 : 430, 60],
      paddingBottomRight: [50, isPhone ? 300 : 60],
      maxZoom: 18,
    })
  }

  const applyHeading = (id: string, m: any, h: number | undefined) => {
    const el: HTMLElement | undefined = m.getElement?.()
    if (!el) return
    const arrow = el.querySelector('.tp-arrow') as HTMLElement | null
    const dot = el.querySelector('.tp-dot') as HTMLElement | null
    if (h == null) {
      if (arrow) arrow.style.opacity = '0'
      if (dot) dot.style.opacity = '1'
      return
    }
    // Rotate the short way round (359° → 1° should not spin the long way)
    const last = angleRef.current[id]
    let angle = h
    if (last != null) {
      const delta = ((h - last + 540) % 360) - 180
      angle = last + delta
    }
    angleRef.current[id] = angle
    if (arrow) {
      arrow.style.opacity = '1'
      arrow.style.transform = `rotate(${angle}deg)`
    }
    if (dot) dot.style.opacity = '0'
  }

  // ===== Per-tricycle info (distance, direction, learned ETA) =====
  const describe = (d: any): Info => {
    const loc = d.currentLocation
    const dist = userLocation && loc?.lat != null ? haversine(userLocation, loc) : null
    const hist = historyRef.current[d._id]
    const dir = getDirection(hist, userLocation)
    const ageSec = d.lastSeen ? Math.max(0, Math.round((now - d.lastSeen) / 1000)) : null
    const v = recentSpeed(hist)
    const speed = v != null ? Math.min(MAX_SPEED_MS, Math.max(MIN_SPEED_MS, v)) : ASSUMED_SPEED_MS
    const etaSec = dist != null ? (dist * ROAD_FACTOR) / speed : null
    const etaMin = etaSec != null ? Math.max(1, Math.round(etaSec / 60)) : null
    return { dist, dir, ageSec, etaMin, etaSec, learned: v != null, kmh: v != null ? Math.round(v * 3.6) : null }
  }

  const infoMap: Record<string, Info> = {}
  drivers.forEach(d => {
    if (d.currentLocation?.lat != null) infoMap[d._id] = describe(d)
  })

  // ===== Best match: soonest to reach you, has a seat, heading your way =====
  let bestId: string | null = null
  if (userLocation) {
    const scores: Record<string, number> = {}
    let bestScore = Infinity
    let bestCand: string | null = null
    for (const d of drivers) {
      const i = infoMap[d._id]
      if (!i || i.etaSec == null || isFull(d)) continue
      let s = i.etaSec
      if (i.dir === 'toward') s *= 0.8
      else if (i.dir === 'away') s *= 1.8
      if (i.ageSec != null && i.ageSec > STALE_AFTER_S) s *= 3
      scores[d._id] = s
      if (s < bestScore) {
        bestScore = s
        bestCand = d._id
      }
    }
    // Keep the current pick unless a clearly better one appears (no flicker)
    const cur = bestIdRef.current
    bestId = cur && scores[cur] != null && scores[cur] <= bestScore * 1.25 ? cur : bestCand
  }
  bestIdRef.current = bestId

  // ===== Tricycle markers =====
  useEffect(() => {
    const L = leafletRef.current
    const map = mapObj.current
    if (!mapReady || !L || !map) return

    const seen = new Set<string>()
    drivers.forEach(d => {
      if (d.currentLocation?.lat == null) return
      seen.add(d._id)
      const { lat, lng } = d.currentLocation
      setTarget(d._id, lat, lng)
      const a = animRef.current[d._id]
      const isActive = d._id === followId
      const isBest = d._id === bestId
      const heading = headingRef.current[d._id]
      const key = `${d.tricycleNumber}|${d.availableSeats}|${d.totalSeats}|${d.status}|${isActive ? 1 : 0}|${isBest ? 1 : 0}`

      let m = markersRef.current[d._id]
      if (!m) {
        m = L.marker([a.curLat, a.curLng], {
          icon: makeIcon(L, d, isActive, isBest, heading ?? null),
        })
          .addTo(map)
          .on('click', () => startFollow(d._id))
        markersRef.current[d._id] = m
        markerKeyRef.current[d._id] = key
      } else if (markerKeyRef.current[d._id] !== key) {
        m.setIcon(makeIcon(L, d, isActive, isBest, heading ?? null))
        markerKeyRef.current[d._id] = key
      }
      m.setZIndexOffset(isActive ? 1000 : isBest ? 500 : 0)
      applyHeading(d._id, m, heading)

      // Keep a followed tricycle in view when there is no line to fit
      if (isActive && !userRef.current && !map.getBounds().contains([lat, lng])) {
        map.panTo([lat, lng])
      }
    })

    Object.keys(markersRef.current).forEach(id => {
      if (!seen.has(id)) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
        delete markerKeyRef.current[id]
        delete animRef.current[id]
        delete angleRef.current[id]
      }
    })
  }, [drivers, followId, bestId, mapReady])

  // ===== My location marker (pulsing) =====
  useEffect(() => {
    const L = leafletRef.current
    const map = mapObj.current
    if (!mapReady || !L || !map || !userLocation) return
    const latlng: [number, number] = [userLocation.lat, userLocation.lng]
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(latlng)
    } else {
      userMarkerRef.current = L.marker(latlng, {
        icon: L.divIcon({ html: '<div class="tp-me"><b></b><i></i></div>', className: '', iconSize: [0, 0] }),
        interactive: false,
        keyboard: false,
        zIndexOffset: 2000,
      }).addTo(map)
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
    const a = animRef.current[d._id]
    const end: [number, number] = a ? [a.curLat, a.curLng] : [d.currentLocation.lat, d.currentLocation.lng]
    const pts: [number, number][] = [[userLocation.lat, userLocation.lng], end]
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

  // ===== Alert me =====
  const playChime = () => {
    try {
      const ctx = audioRef.current
      if (!ctx) return
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.setValueAtTime(880, ctx.currentTime)
      o.frequency.setValueAtTime(1175, ctx.currentTime + 0.15)
      g.gain.setValueAtTime(0.0001, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
      o.connect(g)
      g.connect(ctx.destination)
      o.start()
      o.stop(ctx.currentTime + 0.5)
    } catch {
      /* sound is a bonus, never block the alert */
    }
  }

  const fireAlert = (d: any, dist: number) => {
    try {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
    } catch {
      /* not supported on this device */
    }
    playChime()
    setToast({
      id: d._id,
      text: `🔔 ${d.tricycleNumber} is ${Math.round(dist)} m away with ${d.availableSeats} seat${d.availableSeats === 1 ? '' : 's'} free`,
    })
  }

  useEffect(() => {
    if (!alertOn || !userLocation) return
    drivers.forEach(d => {
      const loc = d.currentLocation
      if (loc?.lat == null || isFull(d)) {
        alertedRef.current.delete(d._id)
        return
      }
      const dist = haversine(userLocation, loc)
      if (dist <= ALERT_RADIUS_M) {
        if (!alertedRef.current.has(d._id)) {
          alertedRef.current.add(d._id)
          fireAlert(d, dist)
        }
      } else if (dist > ALERT_RADIUS_M + 100) {
        // Moved well away: allow it to alert again if it comes back
        alertedRef.current.delete(d._id)
      }
    })
  }, [drivers, userLocation, alertOn])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), toast.id ? 12000 : 7000)
    return () => clearTimeout(t)
  }, [toast])

  const toggleAlert = () => {
    if (alertOn) {
      setAlertOn(false)
      alertedRef.current.clear()
      setToast(null)
      return
    }
    // Create the audio context inside the tap so browsers allow the chime later
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext
      if (Ctx) {
        audioRef.current = audioRef.current || new Ctx()
        audioRef.current.resume?.()
      }
    } catch {
      /* ignore */
    }
    setAlertOn(true)
    if (!userRef.current) {
      enableLocation()
      setToast({ id: null, text: '🔔 Alerts need your location. Tap Allow when your browser asks.' })
    } else {
      setToast({
        id: null,
        text: `🔔 Alert on. We'll notify you when a tricycle with a free seat is within ${ALERT_RADIUS_M} m. Keep this page open.`,
      })
    }
  }

  // ===== My location =====
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

  // ===== List data =====
  const rows = drivers
    .filter(d => infoMap[d._id])
    .map(d => ({ d, info: infoMap[d._id] }))
    .filter(r => tab === 'all' || !isFull(r.d))
    .sort((a, b) =>
      a.info.dist != null && b.info.dist != null
        ? a.info.dist - b.info.dist
        : b.d.availableSeats - a.d.availableSeats
    )

  const availableCount = drivers.filter(d => !isFull(d)).length
  const followed = drivers.find(d => d._id === followId) || null
  const followedInfo = followed ? infoMap[followed._id] || describe(followed) : null
  const best = bestId ? drivers.find(d => d._id === bestId) || null : null
  const bestInfo = best ? infoMap[best._id] : null
  const panelOpen = showList || !!followed

  const pill = (color: string): React.CSSProperties => ({
    background: color + '22',
    color,
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  })

  const turnOnBtn: React.CSSProperties = {
    background: '#2563eb', border: 'none', borderRadius: 6, color: 'white',
    padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  }

  return (
    <div className="tp-root">
      <style>{CSS}</style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />

      {/* Header */}
      <div className="tp-head">
        <Link href="/intranet">←<span className="tp-back-txt"> Intranet</span></Link>
        <div className="tp-title">
          <h1>Campus Transport</h1>
          <p>
            {drivers.length} tricycle{drivers.length !== 1 ? 's' : ''} active now
          </p>
        </div>
        <button
          className="tp-hbtn"
          onClick={toggleAlert}
          style={{ background: alertOn ? '#16a34a' : '#334155' }}
          title={`Alert me when a tricycle with a free seat is within ${ALERT_RADIUS_M} m`}
        >
          {alertOn ? '🔔 Alert on' : '🔕 Alert me'}
        </button>
        <button
          className="tp-hbtn"
          onClick={enableLocation}
          style={{ background: userLocation ? '#16a34a' : '#334155' }}
        >
          {userLocation ? 'Location on' : 'My Location'}
        </button>
      </div>

      <div className="tp-body">
        {/* ===== Map ===== */}
        <div className="tp-map-wrap">
          <div ref={containerRef} className="tp-map" />

          <div className="tp-stack">
            {(locError || notice) && (
              <div className="tp-banner">
                <span style={{ flex: 1 }}>{locError || notice}</span>
                <button
                  onClick={() => { setLocError(''); setNotice('') }}
                  style={{ background: 'none', border: 'none', color: '#ffedd5', cursor: 'pointer', fontSize: 18 }}
                >
                  ×
                </button>
              </div>
            )}
            {toast && (
              <div className="tp-toast">
                <span style={{ flex: 1 }}>{toast.text}</span>
                {toast.id && (
                  <button
                    onClick={() => { startFollow(toast.id as string); setToast(null) }}
                    style={{ background: '#16a34a', border: 'none', borderRadius: 6, color: 'white', padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Follow
                  </button>
                )}
                <button
                  onClick={() => setToast(null)}
                  style={{ background: 'none', border: 'none', color: '#bbf7d0', cursor: 'pointer', fontSize: 18 }}
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Opens the list (bottom sheet on phones, floating panel on desktop) */}
          {!panelOpen && (
            <button className="tp-open-btn" onClick={() => setShowList(true)}>
              View available tricycles ({availableCount})
            </button>
          )}
        </div>

        {/* ===== Panel: bottom sheet on phones, floating panel on desktop ===== */}
        <aside className={`tp-panel${panelOpen ? ' open' : ''}`}>
          <div key={followed ? 'follow' : 'list'} className="tp-inner">
            {followed && followedInfo ? (
              /* ----- Following card ----- */
              <div style={{ padding: '16px 18px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 2 }}>
                      FOLLOWING {followed._id === bestId && <span style={{ color: '#fbbf24' }}>· ★ BEST FOR YOU</span>}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>{followed.tricycleNumber}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Driver: {followed.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Dots avail={followed.availableSeats} total={followed.totalSeats} />
                    <div style={{ marginTop: 4 }}>
                      <span style={pill(seatColor(followed))}>{seatText(followed)}</span>
                    </div>
                  </div>
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
                        <div style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>~{followedInfo.etaMin} min</div>
                      )}
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {followedInfo.dir === 'away'
                          ? 'no ETA while it leaves'
                          : followedInfo.learned
                            ? `at its current speed (~${followedInfo.kmh} km/h)`
                            : 'rough estimate'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: '#0f172a', borderRadius: 10, padding: '10px 12px', marginBottom: 12,
                    fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{ flex: 1 }}>Turn on your location to see the distance and a line to this tricycle.</span>
                    <button onClick={enableLocation} style={turnOnBtn}>Turn on</button>
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
            ) : (
              /* ----- List ----- */
              <>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
                  borderBottom: '1px solid #334155', flexShrink: 0,
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
                  <button className="tp-close" onClick={() => setShowList(false)} aria-label="Close list">×</button>
                </div>

                {!userLocation && (
                  <div style={{
                    padding: '10px 16px', background: '#0f172a', color: '#94a3b8', fontSize: 12,
                    display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
                  }}>
                    <span style={{ flex: 1 }}>Turn on your location to sort by distance, see which way each tricycle is moving, and get a best match.</span>
                    <button onClick={enableLocation} style={turnOnBtn}>Turn on</button>
                  </div>
                )}

                <div className="tp-scroll">
                  {/* Best match: one tap to follow */}
                  {best && bestInfo && (
                    <div className="tp-best" onClick={() => startFollow(best._id)}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24', marginBottom: 3 }}>★ BEST FOR YOU</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 16, fontWeight: 900, color: 'white' }}>{best.tricycleNumber}</span>
                          <Dots avail={best.availableSeats} total={best.totalSeats} />
                        </div>
                        <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 3 }}>
                          {bestInfo.dist != null && <>{formatDistance(bestInfo.dist)} away · </>}
                          {bestInfo.etaMin != null && bestInfo.dir !== 'away' && <>~{bestInfo.etaMin} min · </>}
                          <span style={{ color: DIR_COLOR[bestInfo.dir] }}>{DIR_LABEL[bestInfo.dir]}</span>
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); startFollow(best._id) }}
                        style={{ background: '#fbbf24', border: 'none', borderRadius: 10, color: '#422006', padding: '10px 16px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                      >
                        Follow
                      </button>
                    </div>
                  )}

                  {rows.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b', fontSize: 14 }}>
                      {tab === 'available'
                        ? 'No tricycles with free seats right now.'
                        : 'No tricycles are active right now.'}
                    </div>
                  ) : (
                    rows.map(({ d, info }) => {
                      const stale = info.ageSec != null && info.ageSec > STALE_AFTER_S
                      return (
                        <div
                          key={d._id}
                          className="tp-row"
                          onClick={() => startFollow(d._id)}
                          style={{ opacity: stale ? 0.6 : 1 }}
                        >
                          <div style={{
                            width: 6, alignSelf: 'stretch', borderRadius: 3, background: seatColor(d), flexShrink: 0,
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>{d.tricycleNumber}</span>
                              <Dots avail={d.availableSeats} total={d.totalSeats} />
                              <span style={pill(seatColor(d))}>{seatShort(d)}</span>
                              {d._id === bestId && <span style={pill('#fbbf24')}>★ Best</span>}
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              {info.dist != null && (
                                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{formatDistance(info.dist)} away</span>
                              )}
                              {info.etaMin != null && info.dir !== 'away' && !isFull(d) && (
                                <span style={{ color: '#e2e8f0' }}>~{info.etaMin} min</span>
                              )}
                              <span style={{ color: DIR_COLOR[info.dir], fontWeight: 600 }}>{DIR_LABEL[info.dir]}</span>
                              {stale && info.ageSec != null && (
                                <span style={{ color: '#fbbf24' }}>Last seen {ageText(info.ageSec)}</span>
                              )}
                            </div>
                          </div>
                          <span style={{ color: '#64748b', fontSize: 20 }}>›</span>
                        </div>
                      )
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}