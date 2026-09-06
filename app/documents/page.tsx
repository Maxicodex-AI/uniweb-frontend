'use client'

import { useEffect, useState } from 'react'
import { getAuthToken } from '../utils/auth'
import Link from 'next/link'

interface Lesson {
  _id: string
  title: string
  weekNumber: number
  aiSimplifiedContent: string | null
  videoLinks: { title: string; url: string }[]
  objectives: string[]
  course: { _id: string; code: string; title: string }
  uploadedBy: { name: string }
  publishedAt: string
  status: string
}

interface Enrollment {
  _id: string
  course: { _id: string; code: string; title: string }
}

export default function DocumentsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [user, setUser] = useState<any>(null)
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

  useEffect(() => {
    const token = getAuthToken()
    if (!token) return

    const setup = async () => {
      try {
        const userRes = await fetch(`${API_BASE}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const userData = await userRes.json()
        setUser(userData)

        // Get enrollments
        const enrollRes = await fetch(`${API_BASE}/api/courses/my-enrollments`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const enrollData = await enrollRes.json()
        setEnrollments(Array.isArray(enrollData) ? enrollData : [])

        // Get lessons for all enrolled courses
        if (Array.isArray(enrollData) && enrollData.length > 0) {
          const allLessons: Lesson[] = []
          await Promise.all(
            enrollData.map(async (enrollment: Enrollment) => {
              if (!enrollment.course?._id) return
              const lessonsRes = await fetch(
                `${API_BASE}/api/lessons/course/${enrollment.course._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              )
              const lessonsData = await lessonsRes.json()
              if (Array.isArray(lessonsData)) {
                allLessons.push(...lessonsData)
              }
            })
          )
          setLessons(allLessons)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    setup()
  }, [])

  const getFileIcon = (lesson: Lesson) => {
    if (lesson.aiSimplifiedContent) return '📄'
    if (lesson.videoLinks?.length > 0) return '🎥'
    return '📚'
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  const uniqueCourses = [...new Set(lessons.map(l => l.course?.code).filter(Boolean))]

  const filtered = lessons.filter(l => {
    if (activeFilter !== 'all' && l.course?.code !== activeFilter) return false
    if (search && !l.title.toLowerCase().includes(search.toLowerCase()) &&
      !l.course?.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #052e16 0%, #14532d 100%)',
        padding: '32px 24px 60px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -80, top: -80, width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(34,197,94,0.15)' }} />
        <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 999, padding: '3px 12px', marginBottom: 8,
          }}>
            <span style={{ color: '#86efac', fontSize: 12, fontWeight: 600 }}>📄 Course Materials</span>
          </div>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
            Documents & Resources
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
            Lesson notes and materials from your enrolled courses
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Materials', value: lessons.length, color: '#34d399' },
              { label: 'With Notes', value: lessons.filter(l => l.aiSimplifiedContent).length, color: '#60a5fa' },
              { label: 'With Videos', value: lessons.filter(l => l.videoLinks?.length > 0).length, color: '#fbbf24' },
              { label: 'Courses', value: enrollments.length, color: '#f472b6' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10, padding: '10px 16px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '-28px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>

        {/* Search + Filter */}
        <div style={{
          background: 'white', borderRadius: 12, padding: '12px 16px',
          marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flexWrap: 'wrap',
        }}>
          <span>🔍</span>
          <input
            placeholder="Search materials..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 14, color: '#374151', minWidth: 120,
            }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveFilter('all')}
              style={{
                padding: '4px 12px', borderRadius: 999, border: 'none',
                background: activeFilter === 'all' ? '#16a34a' : '#f3f4f6',
                color: activeFilter === 'all' ? 'white' : '#374151',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}
            >
              All
            </button>
            {uniqueCourses.map(code => (
              <button
                key={code}
                onClick={() => setActiveFilter(code)}
                style={{
                  padding: '4px 12px', borderRadius: 999, border: 'none',
                  background: activeFilter === code ? '#16a34a' : '#f3f4f6',
                  color: activeFilter === code ? 'white' : '#374151',
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#6b7280' }}>Loading your materials...</p>
          </div>
        )}

        {/* No enrollments */}
        {!loading && enrollments.length === 0 && (
          <div style={{
            background: 'white', borderRadius: 16, padding: '48px 24px',
            textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <h3 style={{ marginBottom: 8 }}>No materials yet</h3>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
              Enroll in courses to see your lesson materials here.
            </p>
            <Link href="/learning-hub">
              <button className="btn-primary">Go to Learning Hub →</button>
            </Link>
          </div>
        )}

        {/* No lessons */}
        {!loading && enrollments.length > 0 && lessons.length === 0 && (
          <div style={{
            background: 'white', borderRadius: 16, padding: '48px 24px',
            textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
            <h3 style={{ marginBottom: 8 }}>No materials published yet</h3>
            <p style={{ color: '#6b7280', fontSize: 14 }}>
              Your lecturers haven't published any lesson materials yet. Check back soon.
            </p>
          </div>
        )}

        {/* Materials list */}
        {!loading && filtered.length > 0 && (
          <div style={{
            background: 'white', borderRadius: 16,
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden',
          }}>
            {filtered.map((lesson, i) => (
              <Link
                key={lesson._id}
                href={`/learning-hub/course/${lesson.course?._id}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid #f9fafb' : 'none',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}>
                  {/* Icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                    background: lesson.aiSimplifiedContent ? '#f0fdf4' : '#eff6ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>
                    {getFileIcon(lesson)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: '#16a34a',
                        background: '#f0fdf4', padding: '1px 6px', borderRadius: 4,
                      }}>
                        {lesson.course?.code}
                      </span>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>
                        Week {lesson.weekNumber}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: '#1f2937',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {lesson.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                      By {lesson.uploadedBy?.name} •
                      {lesson.aiSimplifiedContent ? ' Has notes' : ' No notes yet'} •
                      {lesson.videoLinks?.length > 0 ? ` ${lesson.videoLinks.length} video(s)` : ' No videos'}
                    </div>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {lesson.aiSimplifiedContent && (
                      <span style={{
                        background: '#f0fdf4', color: '#16a34a',
                        padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                      }}>
                        📄 Notes
                      </span>
                    )}
                    {lesson.videoLinks?.length > 0 && (
                      <span style={{
                        background: '#fef2f2', color: '#dc2626',
                        padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                      }}>
                        🎥 Video
                      </span>
                    )}
                  </div>

                  <span style={{ color: '#9ca3af', fontSize: 18, flexShrink: 0 }}>›</span>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}