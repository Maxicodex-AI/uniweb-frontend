'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTheme } from '../../context/ThemeContext' // from app/intranet/health-services/ -> app/context/
import { getAuthToken } from '../../utils/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

// ===== SETTINGS: fill these in with the medical centre =====
// Leave a number empty until the medical centre confirms it. The page shows a
// clear "not set yet" note instead of a broken call button.
type Hours = { label: string; days: number[]; open: string; close: string } // days: 0=Sun ... 6=Sat, times 'HH:MM'

const HEALTH: {
  centerName: string
  centerPhone: string
  emergencyPhone: string
  securityPhone: string
  counsellingPhone: string
  nationalEmergency: string
  location: string
  open24h: boolean
  hours: Hours[]
  services: string[]
} = {
  centerName: 'School Medical Centre',
  centerPhone: '',
  emergencyPhone: '',      // clinic emergency / ambulance line
  securityPhone: '',       // campus security
  counsellingPhone: '',    // campus counselling service
  nationalEmergency: '112',
  location: '',            // e.g. 'Beside the Senate Building'
  open24h: false,
  hours: [],               // e.g. { label: 'Mon - Fri', days: [1, 2, 3, 4, 5], open: '08:00', close: '16:00' }
  services: [],            // e.g. ['General consultation', 'First aid', 'Dispensary']
}

// ===== TRIAGE: fixed rules, no AI and no internet needed =====
type Tier = 'EMERGENCY' | 'MENTAL_CRISIS' | 'URGENT' | 'MENTAL' | 'ROUTINE'

const EMERGENCY_WORDS = [
  'cant breathe', 'cannot breathe', 'hard to breathe', 'difficulty breathing', 'not breathing',
  'chest pain', 'heart attack', 'stroke', 'unconscious', 'collapsed', 'fainted', 'passed out',
  'seizure', 'convulsion', 'choking', 'heavy bleeding', 'bleeding a lot', 'wont stop bleeding',
  'poison', 'overdose', 'snake bite', 'snakebite', 'allergic reaction', 'swollen throat',
  'stabbed', 'gunshot', 'road accident', 'severe burn',
]
const SELF_HARM_WORDS = [
  'kill myself', 'suicide', 'suicidal', 'end my life', 'want to die', 'hurt myself',
  'self harm', 'cut myself', 'dont want to live',
]
const URGENT_WORDS = [
  'high fever', 'fever', 'vomiting', 'broken', 'fracture', 'deep cut', 'sprain',
  'severe pain', 'cant walk', 'asthma', 'sickle', 'dizzy', 'injury',
]

const normalise = (s: string) =>
  s.toLowerCase().replace(/['\u2019`]/g, '').replace(/\s+/g, ' ').trim()
const hasAny = (text: string, words: string[]) => words.some(w => text.includes(w))

function triage(button: string, raw: string): Tier {
  const t = normalise(raw)
  if (button === 'emergency' || hasAny(t, EMERGENCY_WORDS)) return 'EMERGENCY'
  if (hasAny(t, SELF_HARM_WORDS)) return 'MENTAL_CRISIS'
  if (button === 'injury' || hasAny(t, URGENT_WORDS)) return 'URGENT'
  if (button === 'mental') return 'MENTAL'
  return 'ROUTINE'
}

function openStatus(): { open: boolean | null; text: string } {
  if (HEALTH.open24h) return { open: true, text: 'Open 24 hours' }
  if (HEALTH.hours.length === 0) return { open: null, text: 'Opening hours not set yet' }
  const now = new Date()
  const mins = now.getHours() * 60 + now.getMinutes()
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  const slot = HEALTH.hours.find(h => h.days.includes(now.getDay()) && mins >= toMin(h.open) && mins < toMin(h.close))
  if (slot) return { open: true, text: `Open now - closes at ${slot.close}` }
  return { open: false, text: 'Closed right now' }
}

// ===== Small shared pieces =====
function CallRow({ label, number }: { label: string; number: string }) {
  if (!number) {
    return (
      <div style={{
        border: '2px dashed rgba(255,255,255,0.4)', borderRadius: 12, padding: '14px 18px',
        fontSize: 14, color: 'rgba(255,255,255,0.8)',
      }}>
        ⚠️ {label}: number not set yet
      </div>
    )
  }
  return (
    <a
      href={`tel:${number.replace(/\s+/g, '')}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none',
        background: '#fff', color: '#7f1d1d', borderRadius: 12, padding: '16px 18px',
        fontSize: 16, fontWeight: 800,
      }}
    >
      <span style={{ fontSize: 22 }}>📞</span>
      <span style={{ flex: 1 }}>{label}</span>
      <span>{number}</span>
    </a>
  )
}

// The student's location stays in the browser. It is never sent to UniWeb.
function LocationHelp({ dark }: { dark?: boolean }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const col = dark ? '#fff' : '#111827'

  const ask = () => {
    setError('')
    if (!navigator.geolocation) { setError('Your phone or browser cannot share location.'); return }
    navigator.geolocation.getCurrentPosition(
      pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError('Location was not shared. The numbers above still work.'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const copy = async () => {
    if (!coords) return
    try {
      await navigator.clipboard.writeText(`https://maps.google.com/?q=${coords.lat},${coords.lng}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch { setError('Could not copy. Please share your location another way.') }
  }

  return (
    <div style={{ marginTop: 16, color: col }}>
      {!coords ? (
        <>
          <button onClick={ask} style={{
            width: '100%', padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
            border: '2px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.12)',
            color: col, fontSize: 15, fontWeight: 700,
          }}>
            📍 Share my location to find the nearest hospital
          </button>
          <p style={{ fontSize: 12, margin: '8px 0 0', opacity: 0.8 }}>
            Optional. Your location stays on your phone and is not sent to UniWeb.
          </p>
        </>
      ) : (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a
            href={`https://www.google.com/maps/search/hospital/@${coords.lat},${coords.lng},15z`}
            target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, minWidth: 180, textAlign: 'center', textDecoration: 'none', background: '#fff', color: '#7f1d1d', borderRadius: 12, padding: '14px 16px', fontWeight: 800, fontSize: 14 }}
          >
            🏥 Open nearby hospitals in Maps
          </a>
          <button onClick={copy} style={{ flex: 1, minWidth: 180, background: 'rgba(255,255,255,0.15)', color: col, border: '2px solid rgba(255,255,255,0.5)', borderRadius: 12, padding: '14px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            {copied ? '✅ Copied' : '📋 Copy my location to send'}
          </button>
        </div>
      )}
      {error && <p style={{ fontSize: 13, margin: '10px 0 0' }}>{error}</p>}
    </div>
  )
}

export default function HealthServicesPage() {
  const { bg, bgCard, bgSecondary, text, textSecondary, border, isDark } = useTheme()
  const [name, setName] = useState('')
  const [result, setResult] = useState<Tier | null>(null)
  const [focus, setFocus] = useState<'general' | 'pharmacy'>('general')
  const [typed, setTyped] = useState('')

  useEffect(() => {
    const token = getAuthToken()
    if (!token) return
    fetch(`${API_BASE}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (data?.name) setName(String(data.name).split(' ')[0]) })
      .catch(() => {})
  }, [])

  const go = (button: string, raw = '') => {
    setFocus(button === 'medicine' ? 'pharmacy' : 'general')
    setResult(triage(button, raw))
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const status = openStatus()

  const options = [
    { key: 'unwell', icon: '🤒', title: 'Feeling unwell', desc: 'Fever, headache, stomach, cough' },
    { key: 'injury', icon: '🩹', title: 'Injury', desc: 'Cuts, sprains, falls, accidents' },
    { key: 'medicine', icon: '💊', title: 'Medicine or pharmacy', desc: 'Find a pharmacy or ask about medicine' },
    { key: 'mental', icon: '💬', title: 'Mental wellbeing', desc: 'Stress, worry, low mood, someone to talk to' },
    { key: 'clinic', icon: '🏥', title: 'Visit the medical centre', desc: 'Hours, location and services' },
  ]

  // ----- Medical centre card (used by several results) -----
  const CenterCard = (
    <div style={{ background: bgCard, border: `1px solid ${border}`, borderRadius: 16, padding: 22, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: text, margin: 0 }}>🏥 {HEALTH.centerName}</h3>
          <p style={{ fontSize: 13, color: textSecondary, margin: '4px 0 0' }}>
            {HEALTH.location || 'Location not set yet'}
          </p>
        </div>
        <span style={{
          borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700,
          background: status.open === true ? '#dcfce7' : status.open === false ? '#fee2e2' : bgSecondary,
          color: status.open === true ? '#15803d' : status.open === false ? '#b91c1c' : textSecondary,
        }}>
          {status.text}
        </span>
      </div>
      {HEALTH.hours.length > 0 && (
        <div style={{ marginTop: 14, fontSize: 13, color: textSecondary }}>
          {HEALTH.hours.map(h => (
            <div key={h.label}>{h.label}: {h.open} - {h.close}</div>
          ))}
        </div>
      )}
      {HEALTH.services.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
          {HEALTH.services.map(s => (
            <span key={s} style={{ background: bgSecondary, color: text, borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>{s}</span>
          ))}
        </div>
      )}
      {HEALTH.centerPhone ? (
        <a href={`tel:${HEALTH.centerPhone.replace(/\s+/g, '')}`} style={{ display: 'inline-block', marginTop: 16, background: '#16a34a', color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 14 }}>
          📞 Call {HEALTH.centerPhone}
        </a>
      ) : (
        <p style={{ fontSize: 12, color: textSecondary, margin: '14px 0 0' }}>⚠️ Medical centre phone number not set yet</p>
      )}
    </div>
  )

  const Back = (
    <button onClick={() => setResult(null)} style={{ background: bgCard, border: `1px solid ${border}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: text, marginBottom: 16 }}>
      ← Back
    </button>
  )

  const Note = (
    <p style={{ fontSize: 12, color: textSecondary, textAlign: 'center', margin: '24px 0 0', lineHeight: 1.6 }}>
      This portal does not give medical advice or diagnose. For anything serious, visit the medical centre.
      What you type here stays on your device and is not saved.
    </p>
  )

  return (
    <div style={{ background: bg, minHeight: 'calc(100vh - 60px)' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0369a1 100%)', padding: '40px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -80, top: -80, width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(125,211,252,0.15)' }} />
        <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Link href="/intranet" style={{ color: '#7dd3fc', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>← Back to Intranet</Link>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: '12px 0 4px' }}>
            🏥 Health Services
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0 }}>
            {name ? `Hello, ${name}. ` : 'Hello. '}Campus health and wellness, in one place.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '-40px auto 0', padding: '0 24px 48px', position: 'relative', zIndex: 1 }}>

        {/* ===== HOME ===== */}
        {result === null && (
          <>
            <button
              onClick={() => go('emergency')}
              aria-label="Emergency. Get help now"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
                background: 'linear-gradient(135deg, #b91c1c, #dc2626)', color: '#fff', border: 'none',
                borderRadius: 16, padding: '20px 24px', cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(220,38,38,0.35)', marginBottom: 24,
              }}
            >
              <span style={{ fontSize: 36 }}>🚨</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 20, fontWeight: 800 }}>Emergency</span>
                <span style={{ display: 'block', fontSize: 14, opacity: 0.9 }}>Tap here for immediate help</span>
              </span>
              <span style={{ fontSize: 26 }}>›</span>
            </button>

            <div style={{ background: bgCard, border: `1px solid ${border}`, borderRadius: 16, padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: text, margin: '0 0 4px' }}>What brought you here today?</h2>
              <p style={{ fontSize: 13, color: textSecondary, margin: '0 0 18px' }}>Pick the closest one, or describe it below.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {options.map(o => (
                  <button key={o.key} onClick={() => go(o.key)} style={{
                    textAlign: 'left', background: bgSecondary, border: `1px solid ${border}`,
                    borderRadius: 14, padding: '16px', cursor: 'pointer', color: text,
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{o.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{o.title}</div>
                    <div style={{ fontSize: 12, color: textSecondary, marginTop: 2 }}>{o.desc}</div>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                <input
                  value={typed}
                  onChange={e => setTyped(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && typed.trim()) go('text', typed) }}
                  placeholder="Or describe what is happening..."
                  maxLength={300}
                  style={{ flex: 1, minWidth: 220, padding: '12px 14px', borderRadius: 10, border: `1px solid ${border}`, background: bgSecondary, color: text, fontSize: 14, outline: 'none' }}
                />
                <button
                  onClick={() => typed.trim() && go('text', typed)}
                  disabled={!typed.trim()}
                  style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 22px', fontWeight: 700, fontSize: 14, cursor: typed.trim() ? 'pointer' : 'not-allowed', opacity: typed.trim() ? 1 : 0.5 }}
                >
                  Continue
                </button>
              </div>
            </div>

            {Note}
          </>
        )}

        {/* ===== EMERGENCY ===== */}
        {result === 'EMERGENCY' && (
          <>
            {Back}
            <div style={{ background: 'linear-gradient(135deg, #7f1d1d, #b91c1c)', color: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 12px 32px rgba(127,29,29,0.4)' }}>
              <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px' }}>🚨 Get help now</h2>
              <p style={{ fontSize: 15, margin: '0 0 20px', opacity: 0.95, lineHeight: 1.6 }}>
                Call now. If someone is with you, ask them to call while you stay with the person who needs help.
                Do not wait.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <CallRow label="Medical centre emergency line" number={HEALTH.emergencyPhone || HEALTH.centerPhone} />
                <CallRow label="Campus security" number={HEALTH.securityPhone} />
                <CallRow label="National emergency number" number={HEALTH.nationalEmergency} />
              </div>
              <LocationHelp dark />
            </div>
            <button onClick={() => setResult(null)} style={{ marginTop: 16, background: 'transparent', border: 'none', color: textSecondary, cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
              This is not an emergency - go back
            </button>
          </>
        )}

        {/* ===== MENTAL HEALTH CRISIS ===== */}
        {result === 'MENTAL_CRISIS' && (
          <>
            {Back}
            <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #3730a3)', color: '#fff', borderRadius: 20, padding: 28 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>💙 You are not alone</h2>
              <p style={{ fontSize: 15, margin: '0 0 20px', lineHeight: 1.7, opacity: 0.95 }}>
                Thank you for reaching out. What you are feeling matters, and there are people who want to help
                right now. Please talk to someone today. If you can, stay with a person you trust.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <CallRow label="Campus counselling" number={HEALTH.counsellingPhone} />
                <CallRow label="Medical centre" number={HEALTH.emergencyPhone || HEALTH.centerPhone} />
                <CallRow label="If you are in immediate danger: emergency number" number={HEALTH.nationalEmergency} />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>{CenterCard}</div>
          </>
        )}

        {/* ===== URGENT ===== */}
        {result === 'URGENT' && (
          <>
            {Back}
            <div style={{ background: isDark ? '#451a03' : '#fffbeb', border: `1px solid ${isDark ? '#78350f' : '#fde68a'}`, borderRadius: 16, padding: '18px 22px', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#fde68a' : '#78350f', margin: '0 0 4px' }}>
                This should be seen today
              </h2>
              <p style={{ fontSize: 14, color: isDark ? '#fde68a' : '#78350f', margin: 0, lineHeight: 1.6 }}>
                Please go to the medical centre as soon as you can. If it gets worse, or you feel very unwell, use the Emergency button.
              </p>
            </div>
            {CenterCard}
            {status.open !== true && (
              <div style={{ background: 'linear-gradient(135deg, #7f1d1d, #b91c1c)', borderRadius: 16, padding: 22, marginTop: 16, color: '#fff' }}>
                <p style={{ margin: '0 0 12px', fontWeight: 700 }}>The medical centre may be closed. Find the nearest open hospital:</p>
                <CallRow label="National emergency number" number={HEALTH.nationalEmergency} />
                <LocationHelp dark />
              </div>
            )}
            {Note}
          </>
        )}

        {/* ===== MENTAL WELLBEING (not a crisis) ===== */}
        {result === 'MENTAL' && (
          <>
            {Back}
            <div style={{ background: bgCard, border: `1px solid ${border}`, borderRadius: 16, padding: 22, marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: text, margin: '0 0 6px' }}>💬 Someone to talk to</h2>
              <p style={{ fontSize: 14, color: textSecondary, margin: '0 0 14px', lineHeight: 1.6 }}>
                Feeling stressed, worried or low is common, and talking to someone helps. The campus counselling service
                and the medical centre are there for you.
              </p>
              {HEALTH.counsellingPhone ? (
                <a href={`tel:${HEALTH.counsellingPhone.replace(/\s+/g, '')}`} style={{ display: 'inline-block', background: '#7c3aed', color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 14 }}>
                  📞 Call campus counselling {HEALTH.counsellingPhone}
                </a>
              ) : (
                <p style={{ fontSize: 12, color: textSecondary, margin: 0 }}>⚠️ Campus counselling number not set yet</p>
              )}
            </div>
            {CenterCard}
            {Note}
          </>
        )}

        {/* ===== ROUTINE ===== */}
        {result === 'ROUTINE' && (
          <>
            {Back}
            {CenterCard}
            <div style={{ background: bgCard, border: `1px solid ${border}`, borderRadius: 16, padding: 22, marginTop: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: text, margin: '0 0 6px' }}>
                💊 {focus === 'pharmacy' ? 'Medicine and pharmacies' : 'Pharmacies near campus'}
              </h3>
              <p style={{ fontSize: 13, color: textSecondary, margin: 0, lineHeight: 1.6 }}>
                Verified pharmacies, with their location and opening hours, will be listed here soon.
                For prescriptions, or if symptoms last or get worse, please visit the medical centre first.
              </p>
            </div>
            {Note}
          </>
        )}
      </div>
    </div>
  )
}