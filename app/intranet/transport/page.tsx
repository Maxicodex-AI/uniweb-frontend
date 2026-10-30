'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import io from 'socket.io-client'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

// UNN campus center coordinates
const CAMPUS_CENTER = { lat: 6.8699, lng: 7.4082 }

export default function TransportPage() {
  const [drivers, setDrivers] = useState<any[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'available'>('all')
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Record<string, any>>({})
  const socketRef = useRef<any>(null)
  const leafletRef = useRef<any>(null)

  useEffect(() => {
    // Load active drivers
    loadDrivers()

    // Connect socket for real-time updates
    socketRef.current = io(API_BASE)

    socketRef.current.on('driverLocationUpdate', (data: any) => {
      setDrivers(prev => {
        const existing = prev.find(d => d._id === data.driverId)
        if (existing) {
          const updated = prev.map(d =>
            d._id === data.driverId
              ? { ...d, currentLocation: { lat: data.lat, lng: data.lng }, availableSeats: data.availableSeats, status: data.status }
              : d
          )
          updateMarker(data)
          return updated
        }
        return prev
      })
    })

    socketRef.current.on('driverOnline', (data: any) => {
      loadDrivers()
    })

    socketRef.current.on('driverOffline', (data: any) => {
      setDrivers(prev => prev.filter(d => d._id !== data.driverId))
      if (markersRef.current[data.driverId]) {
        markersRef.current[data.driverId].remove()
        delete markersRef.current[data.driverId]
      }
    })

    // Load Leaflet map
    loadMap()

    return () => {
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [])

  const loadDrivers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/drivers/active`)
      if (res.ok) {
        const data = await res.json()
        setDrivers(data)
      }
    } catch (err) {}
  }

  const loadMap = async () => {
    if (typeof window === 'undefined') return

    // Dynamically load Leaflet
    const L = await import('leaflet' as any)
    leafletRef.current = L

    // Fix default marker icons
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })

    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: [CAMPUS_CENTER.lat, CAMPUS_CENTER.lng],
      zoom: 16,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map

    // Load existing drivers onto map
    const res = await fetch(`${API_BASE}/api/drivers/active`)
    if (res.ok) {
      const activeDrivers = await res.json()
      activeDrivers.forEach((driver: any) => {
        if (driver.currentLocation?.lat) {
          addDriverMarker(driver, L, map)
        }
      })
    }
  }

  const addDriverMarker = (driver: any, L: any, map: any) => {
    const color = driver.status === 'full' ? '#ef4444' : driver.availableSeats <= 1 ? '#d97706' : '#16a34a'

    const icon = L.divIcon({
      html: `
        <div style="
          background: ${color};
          color: white;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 2px solid white;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          🛺 ${driver.tricycleNumber}
          <span style="background: rgba(255,255,255,0.3); padding: 1px 5px; border-radius: 10px; font-size: 10px;">
            ${driver.availableSeats}/${driver.totalSeats}
          </span>
        </div>
      `,
      className: '',
      iconAnchor: [40, 20],
    })

    const marker = L.marker([driver.currentLocation.lat, driver.currentLocation.lng], { icon })
      .addTo(map)
      .on('click', () => setSelectedDriver(driver))

    markersRef.current[driver._id] = marker
  }

  const updateMarker = (data: any) => {
    const L = leafletRef.current
    const map = mapInstanceRef.current
    if (!L || !map) return

    if (markersRef.current[data.driverId]) {
      markersRef.current[data.driverId].setLatLng([data.lat, data.lng])
    } else {
      // Find driver and add marker
      setDrivers(prev => {
        const driver = prev.find(d => d._id === data.driverId)
        if (driver) {
          addDriverMarker({ ...driver, currentLocation: { lat: data.lat, lng: data.lng } }, L, map)
        }
        return prev
      })
    }
  }

  const enableLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(pos => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setUserLocation(loc)
      setLocationEnabled(true)

      if (mapInstanceRef.current && leafletRef.current) {
        const L = leafletRef.current
        const userIcon = L.divIcon({
          html: `<div style="background: #2563eb; color: white; padding: 6px; border-radius: 50%; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">📍</div>`,
          className: '',
          iconAnchor: [15, 15],
        })
        L.marker([loc.lat, loc.lng], { icon: userIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup('You are here')
        mapInstanceRef.current.setView([loc.lat, loc.lng], 17)
      }
    })
  }

  const getDistance = (driver: any) => {
    if (!userLocation || !driver.currentLocation?.lat) return null
    const R = 6371000
    const dLat = (driver.currentLocation.lat - userLocation.lat) * Math.PI / 180
    const dLng = (driver.currentLocation.lng - userLocation.lng) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(driver.currentLocation.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    if (dist < 1000) return `${Math.round(dist)}m`
    return `${(dist / 1000).toFixed(1)}km`
  }

  const filteredDrivers = filter === 'available'
    ? drivers.filter(d => d.status !== 'full')
    : drivers

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>

      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />

      {/* Header */}
      <div style={{
        background: '#1e293b', padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
        borderBottom: '1px solid #334155', flexShrink: 0,
      }}>
        <Link href="/intranet" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13 }}>
          ← Intranet
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: 'white', margin: 0 }}>
            🛺 Campus Transport
          </h1>
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
            {drivers.length} tricycle{drivers.length !== 1 ? 's' : ''} active now
          </p>
        </div>
        <button
          onClick={enableLocation}
          style={{
            background: locationEnabled ? '#16a34a' : '#334155',
            border: 'none', borderRadius: 8, padding: '8px 12px',
            color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}
        >
          {locationEnabled ? '📍 Located' : '📍 My Location'}
        </button>
      </div>

      {/* Map */}
      <div ref={mapRef} style={{ flex: 1, position: 'relative', zIndex: 0 }} />

      {/* Bottom panel */}
      <div style={{
        background: '#1e293b',
        borderTop: '1px solid #334155',
        maxHeight: '40%',
        overflowY: 'auto',
        flexShrink: 0,
      }}>

        {/* Filter tabs */}
        <div style={{ display: 'flex', padding: '10px 16px', gap: 8, borderBottom: '1px solid #334155' }}>
          {[
            { key: 'all', label: `All (${drivers.length})` },
            { key: 'available', label: `Available (${drivers.filter(d => d.status !== 'full').length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none',
                background: filter === tab.key ? '#16a34a' : '#334155',
                color: filter === tab.key ? 'white' : '#94a3b8',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={loadDrivers}
            style={{
              marginLeft: 'auto', padding: '6px 12px', borderRadius: 8, border: 'none',
              background: '#334155', color: '#94a3b8', cursor: 'pointer', fontSize: 12,
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {filteredDrivers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🛺</div>
            <p style={{ fontSize: 14, marginBottom: 4 }}>
              {filter === 'available' ? 'No available tricycles right now' : 'No active tricycles right now'}
            </p>
            <p style={{ fontSize: 12 }}>Check back soon or refresh</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {filteredDrivers.map(driver => {
              const distance = getDistance(driver)
              const statusColor = driver.status === 'full' ? '#ef4444' : driver.availableSeats <= 1 ? '#d97706' : '#16a34a'
              const isSelected = selectedDriver?._id === driver._id

              return (
                <div
                  key={driver._id}
                  onClick={() => {
                    setSelectedDriver(driver)
                    if (driver.currentLocation?.lat && mapInstanceRef.current) {
                      mapInstanceRef.current.setView([driver.currentLocation.lat, driver.currentLocation.lng], 18)
                    }
                  }}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #334155',
                    background: isSelected ? '#1e3a5f' : 'transparent',
                    cursor: 'pointer', transition: 'background 0.15s',
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}
                >
                  {/* Tricycle icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: statusColor + '20',
                    border: `2px solid ${statusColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                  }}>
                    🛺
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>
                        {driver.tricycleNumber}
                      </span>
                      <span style={{
                        background: statusColor + '20', color: statusColor,
                        padding: '1px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                      }}>
                        {driver.status === 'full' ? 'FULL' : 'AVAILABLE'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      Driver: {driver.name}
                      {distance && <span style={{ marginLeft: 8, color: '#4ade80' }}>• {distance} away</span>}
                    </div>
                  </div>

                  {/* Seats */}
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: statusColor }}>
                      {driver.availableSeats}
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>
                      seats free
                    </div>
                  </div>

                  {/* Seat dots */}
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {Array.from({ length: driver.totalSeats }).map((_, i) => (
                      <div key={i} style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: i < driver.availableSeats ? statusColor : '#374151',
                        transition: 'background 0.2s',
                      }} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected driver detail */}
      {selectedDriver && (
        <div style={{
          position: 'absolute', bottom: '42%', left: '50%',
          transform: 'translateX(-50%)',
          background: '#1e293b', borderRadius: 16, padding: '16px 20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          border: '1px solid #334155', zIndex: 1000,
          minWidth: 280, maxWidth: 360,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>{selectedDriver.tricycleNumber}</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>Driver: {selectedDriver.name}</div>
            </div>
            <button onClick={() => setSelectedDriver(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>×</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: selectedDriver.status === 'full' ? '#ef4444' : '#4ade80' }}>
                {selectedDriver.availableSeats}
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>seats available</div>
            </div>
            <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: selectedDriver.status === 'full' ? '#ef4444' : '#4ade80' }}>
                {selectedDriver.status === 'full' ? '🔴 FULL' : '🟢 AVAILABLE'}
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>current status</div>
            </div>
          </div>

          {selectedDriver.currentLocation?.lat && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#64748b', textAlign: 'center' }}>
              📍 Location updated live
            </div>
          )}
        </div>
      )}
    </div>
  )
}