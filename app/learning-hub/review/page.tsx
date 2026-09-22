'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthToken } from '../../utils/auth'
import { useTheme } from '../../context/ThemeContext' // adjust path to match your project structure

interface Lesson {
  _id: string
  title: string
  weekNumber: number
  description: string
  status: string
  objectives: string[]
  videoLinks: { title: string; url: string }[]
  duration: number
  createdAt: string
  uploadedBy: { name: string; role: string; avatarColor?: string }
  course: { code: string; title: string }
  aiQualityScore: number | null
  reviewNotes: string | null
}

export default function ReviewQueuePage() {
  const router = useRouter()
  const { bg, bgCard, text, textSecondary, border, inputBg, isDark } = useTheme()

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [scheduledFor, setScheduledFor] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

  useEffect(() => {
    const token = getAuthToken()
    if (!token) return
    const setup = async () => {
      const userRes = await fetch(`${API_BASE}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const userData = await userRes.json()
      setUser(userData)

      if (userData.role !== 'faculty_admin' && userData.role !== 'admin' && userData.role !== 'department_admin') {
        router.push('/dashboard')
        return
      }

      await loadQueue(token)
    }
    setup()
  }, [])

  const loadQueue = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/lessons/pending-review`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setLessons(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (decision: 'approve' | 'reject' | 'request_changes') => {
    if (!selectedLesson) return
    setSubmitting(true)
    setMessage('')
    const token = getAuthToken()
    if (!token) return

    try {
      const res = await fetch(
        `${API_BASE}/api/lessons/${selectedLesson._id}/review`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            decision,
            reviewNotes: reviewNotes || null,
            scheduledFor: scheduledFor || null,
          }),
        }
      )

      if (res.ok) {
        setMessage(`Lesson ${decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'sent back for changes'}!`)
        setSelectedLesson(null)
        setReviewNotes('')
        setScheduledFor('')
        await loadQueue(token)
      } else {
        const data = await res.json()
        setMessage(data.message || 'Failed')
      }
    } catch (err) {
      setMessage('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const getInitials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}>
      <p style={{ color: textSecondary }}>Loading review queue...</p>
    </div>
  )

  return (
    <div style={{ background: bg, minHeight: 'calc(100vh - 60px)' }}>

      {/* Header — kept as a fixed purple gradient; it's an intentional accent, not a themed surface */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b, #3730a3)',
        padding: '32px 24px 60px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -60, top: -60, width: 240, height: 240, borderRadius: '50%', border: '1px solid rgba(167,139,250,0.15)' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
            📋 Content Review Queue
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
            {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} pending review
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '-28px auto 0', padding: '0 24px 40px', display: 'grid', gridTemplateColumns: selectedLesson ? '1fr 1fr' : '1fr', gap: 24, position: 'relative', zIndex: 1 }}>

        {/* Lesson queue list */}
        <div>
          {lessons.length === 0 ? (
            <div style={{
              background: bgCard, borderRadius: 16, padding: '48px 24px',
              textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <h3 style={{ marginBottom: 8, color: text }}>All caught up!</h3>
              <p style={{ color: textSecondary }}>No lessons pending review right now.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {lessons.map(lesson => (
                <div
                  key={lesson._id}
                  onClick={() => { setSelectedLesson(lesson); setReviewNotes(''); setScheduledFor('') }}
                  style={{
                    background: bgCard, borderRadius: 14,
                    padding: '18px 20px', cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    border: selectedLesson?._id === lesson._id ? '2px solid #7c3aed' : '2px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: lesson.uploadedBy?.avatarColor || '#2563eb',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 13, fontWeight: 700, flexShrink: 0,
                      }}>
                        {getInitials(lesson.uploadedBy?.name || '?')}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: text }}>
                          {lesson.uploadedBy?.name}
                        </div>
                        <div style={{ fontSize: 11, color: textSecondary }}>
                          {formatDate(lesson.createdAt)}
                        </div>
                      </div>
                    </div>
                    <span style={{
                      background: isDark ? '#451a03' : '#fef3c7',
                      color: isDark ? '#fbbf24' : '#92400e',
                      padding: '3px 10px', borderRadius: 999,
                      fontSize: 11, fontWeight: 600,
                    }}>
                      ⏳ Pending Review
                    </span>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600, marginBottom: 2 }}>
                      {lesson.course?.code} — Week {lesson.weekNumber}
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: text, margin: 0 }}>
                      {lesson.title}
                    </h3>
                    {lesson.description && (
                      <p style={{ fontSize: 13, color: textSecondary, marginTop: 4, lineHeight: 1.5 }}>
                        {lesson.description.slice(0, 100)}...
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      background: isDark ? '#052e16' : '#f0fdf4',
                      color: isDark ? '#86efac' : '#15803d',
                      padding: '2px 8px', borderRadius: 999, fontSize: 11,
                    }}>
                      {lesson.objectives?.length || 0} objectives
                    </span>
                    <span style={{
                      background: isDark ? '#172554' : '#eff6ff',
                      color: isDark ? '#93c5fd' : '#2563eb',
                      padding: '2px 8px', borderRadius: 999, fontSize: 11,
                    }}>
                      {lesson.videoLinks?.length || 0} videos
                    </span>
                    <span style={{
                      background: isDark ? '#2e1065' : '#f5f3ff',
                      color: isDark ? '#c4b5fd' : '#7c3aed',
                      padding: '2px 8px', borderRadius: 999, fontSize: 11,
                    }}>
                      {lesson.duration} days
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review panel */}
        {selectedLesson && (
          <div style={{ position: 'sticky', top: 80, alignSelf: 'start' }}>
            <div style={{
              background: bgCard, borderRadius: 16,
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}>
              {/* Review header — kept as a fixed purple gradient, matches the page header accent */}
              <div style={{
                background: 'linear-gradient(135deg, #1e1b4b, #3730a3)',
                padding: '20px 24px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ color: 'white', margin: 0, fontSize: 15 }}>Review Actions</h3>
                  <button
                    onClick={() => setSelectedLesson(null)}
                    style={{
                      background: 'rgba(255,255,255,0.1)', border: 'none',
                      color: 'white', borderRadius: 6, padding: '4px 10px',
                      cursor: 'pointer', fontSize: 16,
                    }}
                  >×</button>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '4px 0 0' }}>
                  Week {selectedLesson.weekNumber}: {selectedLesson.title}
                </p>
              </div>

              <div style={{ padding: 20 }}>

                {/* Lesson details */}
                <div style={{ background: isDark ? '#0f172a' : '#f9fafb', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                  <h4 style={{ fontSize: 13, marginBottom: 10, color: text }}>Lesson Details</h4>
                  {[
                    { label: 'Course', value: selectedLesson.course?.title },
                    { label: 'Week', value: `Week ${selectedLesson.weekNumber}` },
                    { label: 'Duration', value: `${selectedLesson.duration} days` },
                    { label: 'Objectives', value: `${selectedLesson.objectives?.length || 0}` },
                    { label: 'Videos', value: `${selectedLesson.videoLinks?.length || 0}` },
                    { label: 'By', value: selectedLesson.uploadedBy?.name },
                  ].map(item => (
                    <div key={item.label} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '5px 0', borderBottom: `1px solid ${border}`,
                      fontSize: 12,
                    }}>
                      <span style={{ color: textSecondary }}>{item.label}</span>
                      <span style={{ fontWeight: 600, color: text }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Review notes */}
                <label style={{ fontSize: 13, fontWeight: 600, color: text, display: 'block', marginBottom: 6 }}>
                  Review Notes (optional)
                </label>
                <textarea
                  placeholder="Add feedback for the lecturer..."
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: `1.5px solid ${border}`, borderRadius: 8,
                    fontSize: 13, resize: 'vertical', fontFamily: 'inherit',
                    outline: 'none', marginBottom: 16,
                    background: inputBg, color: text,
                  }}
                />

                {/* Schedule publication */}
                <label style={{ fontSize: 13, fontWeight: 600, color: text, display: 'block', marginBottom: 6 }}>
                  Schedule Publication (optional)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={e => setScheduledFor(e.target.value)}
                  style={{
                    marginBottom: 20,
                    background: inputBg, color: text,
                    border: `1.5px solid ${border}`, borderRadius: 8,
                    padding: '10px 12px', fontSize: 13, width: '100%',
                  }}
                />

                {message && (
                  <div
                    className={message.includes('approved') || message.includes('sent') ? 'alert alert-success' : 'alert alert-error'}
                    style={{ marginBottom: 16 }}
                  >
                    {message}
                  </div>
                )}

                {/* Action buttons — status colors kept fixed on purpose (approve/reject meaning shouldn't shift with theme) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    onClick={() => handleReview('approve')}
                    disabled={submitting}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 10,
                      border: 'none', cursor: 'pointer',
                      background: isDark ? '#052e16' : '#f0fdf4',
                      color: isDark ? '#86efac' : '#15803d',
                      fontWeight: 700, fontSize: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    ✅ Approve Lesson
                  </button>
                  <button
                    onClick={() => handleReview('request_changes')}
                    disabled={submitting}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 10,
                      border: 'none', cursor: 'pointer',
                      background: isDark ? '#451a03' : '#fffbeb',
                      color: isDark ? '#fbbf24' : '#92400e',
                      fontWeight: 700, fontSize: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    🔄 Request Changes
                  </button>
                  <button
                    onClick={() => handleReview('reject')}
                    disabled={submitting}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 10,
                      border: 'none', cursor: 'pointer',
                      background: isDark ? '#450a0a' : '#fef2f2',
                      color: isDark ? '#fca5a5' : '#dc2626',
                      fontWeight: 700, fontSize: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    ✕ Reject Lesson
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}