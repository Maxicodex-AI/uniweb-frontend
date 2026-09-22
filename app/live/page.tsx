'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { io } from 'socket.io-client'
import { getAuthToken } from '../utils/auth'
import { SkeletonList } from '../components/Skeleton'
import { useTheme } from '../context/ThemeContext'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

interface Live {
  _id: string
  title: string
  faculty: string
  department: string
  level: string
  targets: { faculty: string; department: string }[]
  host: { name: string; role: string }
  isActive: boolean
  createdAt: string
}

interface User {
  _id: string
  name: string
  role: string
  faculty: string
  department: string
  level: string
  canHostLive: boolean
}

interface Department {
  _id: string
  name: string
  faculty: string
  maxLevel: number
}

function LiveTimer({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
      const h = Math.floor(diff / 3600)
      const m = Math.floor((diff % 3600) / 60)
      const s = diff % 60
      if (h > 0) setElapsed(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
      else setElapsed(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [createdAt])

  return <span>{elapsed}</span>
}

export default function LivePage() {
  const router = useRouter()
  const { isDark, bg, bgCard, text, textSecondary, border } = useTheme()

  const [liveList, setLiveList] = useState<Live[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Start live form
  const [showForm, setShowForm] = useState(false)
  const [formStep, setFormStep] = useState(1)
  const [title, setTitle] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('')
  const [allDepartments, setAllDepartments] = useState<Department[]>([])
  const [faculties, setFaculties] = useState<string[]>([])
  const [availableLevels, setAvailableLevels] = useState<string[]>([])
  const [targets, setTargets] = useState<{ faculty: string; department: string }[]>([])
  const [addFaculty, setAddFaculty] = useState('')
  const [addDepartment, setAddDepartment] = useState('')
  const [filteredDepts, setFilteredDepts] = useState<Department[]>([])
  const [lecturerEmail, setLecturerEmail] = useState('')
  const [lecturers, setLecturers] = useState<any[]>([])
  const [starting, setStarting] = useState(false)
  const [message, setMessage] = useState('')

  const loadLive = async () => {
    const token = getAuthToken()
    if (!token) return
    const res = await fetch(`${API_BASE}/api/live`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setLiveList(data)
    setLoading(false)
  }

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      router.push('/login')
      return
    }

    const setup = async () => {
      const userRes = await fetch(`${API_BASE}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!userRes.ok) {
        router.push('/login')
        return
      }
      const userData = await userRes.json()
      setUser(userData)

      if (userData.role === 'student' && userData.canHostLive) {
        const lecturersRes = await fetch(
          `${API_BASE}/api/users/lecturers/${encodeURIComponent(userData.faculty)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const lecturersData = await lecturersRes.json()
        setLecturers(lecturersData)
      }

      if (userData.role === 'lecturer' || userData.role === 'admin') {
        const deptsRes = await fetch(`${API_BASE}/api/departments`)
        const deptsData = await deptsRes.json()
        setAllDepartments(Array.isArray(deptsData) ? deptsData : [])

        if (Array.isArray(deptsData) && deptsData.length > 0) {
          const uniqueFaculties = [...new Set(deptsData.map((d: Department) => d.faculty))] as string[]
          setFaculties(uniqueFaculties)
          const maxLevelOverall = Math.max(...deptsData.map((d: Department) => d.maxLevel))
          const lvls: string[] = []
          for (let l = 100; l <= maxLevelOverall; l += 100) lvls.push(`${l}L`)
          setAvailableLevels(lvls)
        } else {
          setFaculties([])
          setAvailableLevels([])
        }
      }

      await loadLive()
    }

    setup()

    const socket = io(API_BASE)
    socket.on('liveStarted', () => loadLive())
    socket.on('liveEnded', () => loadLive())
    return () => { socket.disconnect() }
  }, [router])

  useEffect(() => {
    if (!addFaculty) {
      setFilteredDepts([])
      setAddDepartment('')
      return
    }
    setFilteredDepts(allDepartments.filter(d => d.faculty === addFaculty))
    setAddDepartment('')
  }, [addFaculty, allDepartments])

  const addTarget = () => {
    if (!addFaculty || !addDepartment) return
    if (targets.some(t => t.faculty === addFaculty && t.department === addDepartment)) return
    setTargets(prev => [...prev, { faculty: addFaculty, department: addDepartment }])
    setAddFaculty('')
    setAddDepartment('')
  }

  const removeTarget = (index: number) => {
    setTargets(prev => prev.filter((_, i) => i !== index))
  }

  const handleStartLive = async (e: React.FormEvent) => {
    e.preventDefault()
    setStarting(true)
    setMessage('')
    const token = getAuthToken()
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/api/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          faculty: user?.role === 'student' ? user.faculty : undefined,
          department: user?.role === 'student' ? user.department : undefined,
          level: user?.role === 'student' ? user.level : selectedLevel,
          targets: user?.role === 'student'
            ? [{ faculty: user.faculty, department: user.department }]
            : targets,
          lecturerEmail: user?.role === 'student' ? lecturerEmail : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setTitle('')
        setSelectedLevel('')
        setTargets([])
        setAddFaculty('')
        setAddDepartment('')
        setLecturerEmail('')
        setShowForm(false)
        setFormStep(1)
        await loadLive()
      } else {
        setMessage(data.message || 'Failed to start live session')
      }
    } catch (err) {
      setMessage('Something went wrong')
    } finally {
      setStarting(false)
    }
  }

  const handleEndLive = async (id: string) => {
    const token = getAuthToken()
    if (!token) return
    await fetch(`${API_BASE}/api/live/${id}/end`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    })
    await loadLive()
  }

  const joinLive = async (id: string) => {
    const token = getAuthToken()
    if (!token) return
    const res = await fetch(`${API_BASE}/api/live/${id}/join`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (res.ok) {
      router.push(`/live/video?liveId=${id}`)
    } else {
      alert(data.message)
    }
  }

    const canHost =
    user?.role === 'lecturer' ||
    user?.role === 'admin' ||
    user?.role === 'faculty_admin' ||
    user?.role === 'department_admin' ||
    (user?.role === 'student' && user?.canHostLive === true)

  const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

if (loading) return (
  <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 24px' }}>
    <SkeletonList count={4} />
  </div>
)

return (
    <div className="live-page" style={{ background: bg, minHeight: 'calc(100vh - 60px)' }}>
      <div className="page">

        {/* ===== HEADER ===== */}
        <div className="live-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 36,
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <div>
            <div className="live-eyebrow">Live Classes</div>
            <h1 style={{ marginBottom: 6, letterSpacing: '-0.02em', color: text }}>Live Classes</h1>
            <p style={{ color: '#64748b', fontSize: 14.5 }}>
              {liveList.length > 0
                ? `${liveList.length} active session${liveList.length > 1 ? 's' : ''} right now`
                : 'No active sessions right now'}
            </p>
          </div>
          {canHost && (
            <button
              className="btn-primary live-start-btn"
              onClick={() => { setShowForm(!showForm); setFormStep(1) }}
            >
              {!showForm && (
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'white',
                  display: 'inline-block',
                  animation: 'pulse 1.5s infinite',
                }} />
              )}
              {showForm ? 'Cancel' : 'Start Live'}
            </button>
          )}
        </div>


        {/* ===== START LIVE FORM ===== */}
        {showForm && (
          <div className="live-form-card fade-in-up" style={{
            background: bgCard,
            borderRadius: 20,
            boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 20px 48px -12px rgba(15,23,42,0.14)',
            marginBottom: 36,
            overflow: 'hidden',
          }}>

            {/* Form header */}
            <div style={{
              background: 'linear-gradient(135deg, #14532d, #16a34a 65%, #22c55e)',
              padding: '24px 28px',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', right: -30, top: -30, width: 160, height: 160,
                borderRadius: '50%', background: 'rgba(255,255,255,0.07)',
              }} />
              <h2 style={{ color: 'white', marginBottom: 4, fontSize: 20, letterSpacing: '-0.01em', position: 'relative' }}>🎙️ Start a Live Session</h2>
              <p style={{ opacity: 0.85, fontSize: 13, position: 'relative' }}>
                {user?.role === 'student'
                  ? 'Start a session for your classmates'
                  : 'Choose your session details and target classes'}
              </p>

              {/* Step indicator for lecturers */}
              {(user?.role === 'lecturer' || user?.role === 'admin') && (
                <div style={{ display: 'flex', gap: 8, marginTop: 20, position: 'relative' }}>
                  {['Session Info', 'Target Classes', 'Confirm'].map((step, i) => (
                    <div
                      key={step}
                      className="live-step"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        cursor: i + 1 < formStep ? 'pointer' : 'default',
                      }}
                      onClick={() => i + 1 < formStep && setFormStep(i + 1)}
                    >
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: formStep >= i + 1 ? 'white' : 'rgba(255,255,255,0.25)',
                        color: formStep >= i + 1 ? '#16a34a' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        transition: 'all 0.2s ease',
                      }}>
                        {formStep > i + 1 ? '✓' : i + 1}
                      </div>
                      <span style={{
                        fontSize: 12,
                        fontWeight: formStep === i + 1 ? 700 : 500,
                        opacity: formStep === i + 1 ? 1 : 0.65,
                      }}>
                        {step}
                      </span>
                      {i < 2 && (
                        <div style={{
                          width: 28,
                          height: 1,
                          background: 'rgba(255,255,255,0.35)',
                          marginLeft: 4,
                        }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: 28 }}>
              <form onSubmit={handleStartLive}>

                {/* STEP 1: Session Info */}
                {(formStep === 1 || user?.role === 'student') && (
                  <div className="fade-in-up">
                    <label htmlFor="live-title" style={{ fontSize: 13.5, fontWeight: 600, color: textSecondary }}>
                      Session Title
                    </label>
                    <input
                      id="live-title"
                      type="text"
                      placeholder="e.g. MTH201 — Calculus Week 5"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      style={{ marginBottom: 18 }}
                    />

                    {/* Level for lecturers */}
                    {(user?.role === 'lecturer' || user?.role === 'admin') && (
                      <div>
                        <label htmlFor="live-level" style={{ fontSize: 13.5, fontWeight: 600, color: textSecondary }}>
                          Level (applies to all target classes)
                        </label>
                        <select
                          id="live-level"
                          value={selectedLevel}
                          onChange={(e) => setSelectedLevel(e.target.value)}
                          required
                        >
                          <option value="">Select level...</option>
                          {availableLevels.map(l => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Lecturer tag for student hosts */}
                    {user?.role === 'student' && (
                      <div>
                        <label htmlFor="live-lecturer" style={{ fontSize: 13.5, fontWeight: 600, color: textSecondary }}>
                          Tag your lecturer
                        </label>
                        <select
                          id="live-lecturer"
                          value={lecturerEmail}
                          onChange={(e) => setLecturerEmail(e.target.value)}
                          required
                        >
                          <option value="">Select lecturer to invite...</option>
                          {lecturers.map((l) => (
                            <option key={l._id} value={l.email}>
                              {l.name} — {l.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {user?.role === 'student' ? (
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={starting}
                        style={{ marginTop: 22, width: '100%', padding: '13px' }}
                      >
                        {starting ? 'Starting...' : '📡 Go Live Now'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={!title || !selectedLevel}
                        onClick={() => setFormStep(2)}
                        style={{ marginTop: 22 }}
                      >
                        Next: Choose Classes →
                      </button>
                    )}
                  </div>
                )}

                {/* STEP 2: Target Classes */}
                {formStep === 2 && (user?.role === 'lecturer' || user?.role === 'admin') && (
                  <div className="fade-in-up">
                    <p style={{ color: '#64748b', fontSize: 14, marginBottom: 18, lineHeight: 1.6 }}>
                      Add the faculty/department combinations for this <strong style={{ color: '#16a34a' }}>{selectedLevel}</strong> session.
                      Students from all selected classes will be able to join.
                    </p>

                    {/* Picker */}
                    <div className="live-target-picker" style={{
                      display: 'flex',
                      gap: 8,
                      marginBottom: 18,
                      flexWrap: 'wrap',
                    }}>
                      <select
                        aria-label="Select faculty"
                        value={addFaculty}
                        onChange={(e) => setAddFaculty(e.target.value)}
                        style={{ flex: 1, minWidth: 140 }}
                      >
                        <option value="">Select faculty...</option>
                        {faculties.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>

                      <select
                        aria-label="Select department"
                        value={addDepartment}
                        onChange={(e) => setAddDepartment(e.target.value)}
                        disabled={!addFaculty}
                        style={{ flex: 1, minWidth: 140 }}
                      >
                        <option value="">Select department...</option>
                        {filteredDepts.map(d => (
                          <option key={d._id} value={d.name}>{d.name}</option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={addTarget}
                        disabled={!addFaculty || !addDepartment}
                        className="btn-primary"
                        style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}
                      >
                        + Add
                      </button>
                    </div>

                    {/* Added targets */}
                    {targets.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '36px 20px',
                        background: bg,
                        borderRadius: 12,
                        border: `2px dashed ${border}`,
                        color: '#9ca3af',
                        fontSize: 14,
                      }}>
                        No classes added yet — add at least one above
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                        {targets.map((t, i) => (
                          <div
                            key={i}
                            className="live-target-chip fade-in-up"
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: 10,
                              padding: '11px 16px',
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 700, fontSize: 14, color: '#15803d' }}>
                                {t.department}
                              </span>
                              <span style={{ color: '#4b5563', fontSize: 13, marginLeft: 8 }}>
                                {t.faculty} • {selectedLevel}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeTarget(i)}
                              style={{
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#ef4444',
                                borderRadius: 6,
                                padding: '4px 10px',
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => setFormStep(1)}
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={targets.length === 0}
                        onClick={() => setFormStep(3)}
                        style={{ flex: 1 }}
                      >
                        Next: Confirm →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Confirm */}
                {formStep === 3 && (user?.role === 'lecturer' || user?.role === 'admin') && (
                  <div className="fade-in-up">
                    <div style={{
                      background: bg,
                      borderRadius: 14,
                      padding: 22,
                      marginBottom: 22,
                      border: `1px solid ${border}`,
                    }}>
                      <h3 style={{ marginBottom: 16, color: text, fontSize: 15 }}>Session Summary</h3>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <span style={{ color: '#9ca3af', fontSize: 13, width: 80 }}>Title</span>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <span style={{ color: '#9ca3af', fontSize: 13, width: 80 }}>Level</span>
                          <span className="badge badge-green">{selectedLevel}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <span style={{ color: '#9ca3af', fontSize: 13, width: 80 }}>Classes</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {targets.map((t, i) => (
                              <span key={i} style={{ fontSize: 13, color: '#374151' }}>
                                📚 {t.department} — {t.faculty}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {message && (
                      <div className="alert alert-error" style={{ marginBottom: 16 }}>
                        {message}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => setFormStep(2)}
                      >
                        ← Back
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={starting}
                        style={{ flex: 1, fontSize: 15 }}
                      >
                        {starting ? 'Starting...' : '📡 Go Live Now'}
                      </button>
                    </div>
                  </div>
                )}

              </form>
            </div>
          </div>
        )}


        {/* ===== LIVE LIST ===== */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 72 }}>
            <div className="live-loading-icon" style={{ fontSize: 38, marginBottom: 14 }}>📡</div>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>Loading sessions...</p>
          </div>
        )}

        {!loading && liveList.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '56px 24px',
            background: bgCard,
            borderRadius: 24,
            boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 20px 48px -16px rgba(15,23,42,0.10)',
            overflow: 'hidden',
            position: 'relative',
          }}>

            {/* Background decoration */}
            <div style={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #dcfce7, #f0fdf4)',
              opacity: 0.6,
            }} />
            <div style={{
              position: 'absolute',
              bottom: -60,
              left: -60,
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
              opacity: 0.4,
            }} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>

              {/* Animated icon */}
              <div className="live-empty-icon" style={{
                width: 104,
                height: 104,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 26px',
                fontSize: 44,
                boxShadow: '0 12px 32px rgba(22,163,74,0.28)',
              }}>
                📡
              </div>

              <h2 style={{ marginBottom: 12, color: text, letterSpacing: '-0.01em' }}>
                {canHost ? 'Ready to go live?' : 'No live classes right now'}
              </h2>

              <p style={{
                color: '#64748b',
                fontSize: 15,
                maxWidth: 380,
                margin: '0 auto 32px',
                lineHeight: 1.75,
              }}>
                {canHost
                  ? 'Start a live session and your students will be notified instantly. You can reach multiple classes at once.'
                  : 'Your lecturer hasn\'t started a session yet. Stay on this page — it updates automatically when a class begins.'}
              </p>

              {/* Features row */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 32,
                flexWrap: 'wrap',
                marginBottom: canHost ? 32 : 0,
              }}>
                {[
                  { icon: '🎥', label: 'HD Video' },
                  { icon: '🎤', label: 'Clear Audio' },
                  { icon: '👥', label: 'Multi-class' },
                  { icon: '⚡', label: 'Instant' },
                ].map(f => (
                  <div key={f.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{f.icon}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{f.label}</div>
                  </div>
                ))}
              </div>

              {canHost && (
                <button
                  className="btn-primary"
                  onClick={() => setShowForm(true)}
                  style={{
                    padding: '13px 34px',
                    fontSize: 15,
                    borderRadius: 999,
                    boxShadow: '0 8px 24px rgba(22,163,74,0.32)',
                  }}
                >
                  📡 Start Live Session
                </button>
              )}

              {!canHost && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 999,
                  padding: '9px 20px',
                  fontSize: 13,
                  color: '#15803d',
                  fontWeight: 600,
                }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#16a34a',
                    animation: 'pulse 1.5s infinite',
                  }} />
                  Watching for live sessions...
                </div>
              )}

            </div>
          </div>
        )}

        <div className="live-list-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 22,
        }}>
          {liveList.map((live, idx) => (
            <div
              key={live._id}
              className="live-card fade-in-up"
              style={{
                background: bgCard,
                borderRadius: 18,
                overflow: 'hidden',
                boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -8px rgba(15,23,42,0.10)',
                border: '1px solid #f0fdf4',
                animationDelay: `${idx * 45}ms`,
              }}
            >
              {/* Card top — gradient header */}
              <div style={{
                background: 'linear-gradient(135deg, #14532d, #15803d 55%, #22c55e)',
                padding: '22px 20px 30px',
                position: 'relative',
              }}>

                {/* Live badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 12,
                }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#fbbf24',
                    boxShadow: '0 0 0 3px rgba(251,191,36,0.3)',
                    animation: 'pulse 1.5s infinite',
                  }} />
                  <span style={{
                    color: 'white',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                  }}>
                    LIVE NOW
                  </span>
                  <span style={{
                    marginLeft: 'auto',
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: 12,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    ⏱ <LiveTimer createdAt={live.createdAt} />
                  </span>
                </div>

                <h3 style={{
                  color: 'white',
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 0,
                  lineHeight: 1.35,
                  letterSpacing: '-0.01em',
                }}>
                  {live.title}
                </h3>

                {/* Host avatar */}
                <div className="live-avatar-ring" style={{
                  position: 'absolute',
                  bottom: -20,
                  left: 20,
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: 'white',
                  border: '3px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#15803d',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                }}>
                  {getInitials(live.host?.name || '?')}
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: '30px 20px 20px' }}>

                {/* Host name */}
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
                  Hosted by <strong style={{ color: text }}>{live.host?.name}</strong>
                </p>

                {/* Level badge */}
                <div style={{ marginBottom: 14 }}>
                  <span className="badge badge-green">
                    🎓 {live.level}
                  </span>
                </div>

                {/* Target classes */}
                <div style={{ marginBottom: 18 }}>
                  {live.targets?.map((t, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        fontSize: 13,
                        color: '#374151',
                        marginBottom: 5,
                      }}
                    >
                      <span style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#16a34a',
                        flexShrink: 0,
                      }} />
                      {t.department} • {t.faculty}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn-primary live-join-btn"
                    style={{
                      flex: 1,
                      padding: '11px',
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                    onClick={() => joinLive(live._id)}
                  >
                    <span>▶</span> Join Session
                  </button>

                  {(user?.role === 'admin' || live.host?.name === user?.name) && (
                    <button
                      className="btn-danger"
                      style={{ padding: '11px 16px' }}
                      onClick={() => handleEndLive(live._id)}
                    >
                      End
                    </button>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes floatIcon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        .live-page .fade-in-up {
          animation: fadeInUp 0.35s ease both;
        }

        .live-page .live-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: #16a34a;
          text-transform: uppercase;
          margin-bottom: 4px;
          opacity: 0;
          height: 0;
          overflow: hidden;
        }

        .live-page .live-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .live-page .live-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 1px 2px rgba(15,23,42,0.04), 0 20px 40px -12px rgba(15,23,42,0.18) !important;
        }

        .live-page .live-avatar-ring {
          transition: transform 0.2s ease;
        }
        .live-page .live-card:hover .live-avatar-ring {
          transform: scale(1.06);
        }

        .live-page .live-join-btn {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .live-page .live-join-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(22,163,74,0.28);
        }

        .live-page .live-start-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 22px;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .live-page .live-start-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(22,163,74,0.28);
        }

        .live-page .live-empty-icon {
          animation: floatIcon 3.5s ease-in-out infinite;
        }

        .live-page .live-loading-icon {
          animation: floatIcon 1.6s ease-in-out infinite;
        }

        .live-page input,
        .live-page select {
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .live-page input:focus,
        .live-page select:focus {
          border-color: #16a34a !important;
          box-shadow: 0 0 0 3px rgba(22,163,74,0.12) !important;
          outline: none;
        }

        .live-page .live-target-chip {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .live-page .live-target-chip:hover {
          transform: translateX(2px);
        }

        @media (max-width: 640px) {
          .live-page .live-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .live-page .live-start-btn {
            width: 100%;
            justify-content: center;
          }
          .live-page .live-target-picker {
            flex-direction: column;
          }
          .live-page .live-target-picker select,
          .live-page .live-target-picker button {
            width: 100%;
            flex: none !important;
          }
          .live-page .live-list-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  )
}