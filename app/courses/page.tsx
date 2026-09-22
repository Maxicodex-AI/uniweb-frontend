'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAuthToken } from '../utils/auth'
import { useTheme } from '../context/ThemeContext' // adjust path to match your project structure

export default function CoursesPage() {
  const { bg, bgCard, text, textSecondary, border } = useTheme()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

  useEffect(() => {
    const token = getAuthToken()
    if (!token) return
        fetch(`${API_BASE}/api/courses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setCourses(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ background: bg, minHeight: 'calc(100vh - 60px)' }}>
      {/* Header — fixed brand gradient */}
      <div style={{
        background: 'linear-gradient(135deg, #052e16, #166534)',
        padding: '32px 24px 60px',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
            📚 Courses
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
            All available courses
          </p>
        </div>
      </div>
      <div style={{ maxWidth: 960, margin: '-28px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: textSecondary }}>Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div style={{
            background: bgCard, borderRadius: 16, padding: '48px 24px',
            textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <h3 style={{ marginBottom: 8, color: text }}>No courses available yet</h3>
            <p style={{ color: textSecondary, marginBottom: 20 }}>
              Courses will appear here once created by your admin or faculty.
            </p>
            <Link href="/learning-hub">
              <button className="btn-primary">Go to Learning Hub →</button>
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {courses.map((course: any) => (
              <Link
                key={course._id}
                href={`/learning-hub/course/${course._id}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: bgCard, borderRadius: 14,
                  padding: '20px', border: `1px solid ${border}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: '#16a34a',
                    marginBottom: 4,
                  }}>
                    {course.code}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: text }}>
                    {course.title}
                  </h3>
                  {course.description && (
                    <p style={{ fontSize: 13, color: textSecondary, lineHeight: 1.5 }}>
                      {course.description.slice(0, 80)}...
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}