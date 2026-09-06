'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAuthToken } from '../utils/auth'

interface User {
  _id: string
  name: string
  email: string
  role: string
  faculty: string
  department: string
  level: string
  canHostLive: boolean
  graduated: boolean
  avatarColor: string
  regNumber?: string
}

interface Course {
  _id: string
  code: string
  title: string
  description: string
  offerings: { faculty: string; department: string; level: string }[]
  lecturers: { _id: string; name: string; avatarColor?: string }[]
}

interface Lesson {
  _id: string
  title: string
  weekNumber: number
  status: string
  course: { code: string; title: string }
  uploadedBy: { name: string; avatarColor?: string }
  createdAt: string
}

export default function DeptAdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [pendingLessons, setPendingLessons] = useState<Lesson[]>([])
  const [message, setMessage] = useState('')

  // Course creation
  const [courseCode, setCourseCode] = useState('')
  const [courseTitle, setCourseTitle] = useState('')
  const [courseDesc, setCourseDesc] = useState('')
  const [courseLevel, setCourseLevel] = useState('')
  const [availableLevels, setAvailableLevels] = useState<string[]>([])
  const [courseSubmitting, setCourseSubmitting] = useState(false)

    // Course edit/delete
  const [editingCourse, setEditingCourse] = useState<any>(null)
  const [editCourseCode, setEditCourseCode] = useState('')
  const [editCourseTitle, setEditCourseTitle] = useState('')

  const [daStudentLevel, setDaStudentLevel] = useState('')

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

  const token = getAuthToken()

  useEffect(() => {
    const check = async () => {
      if (!token) { router.push('/login'); return }
      const res = await fetch(`${API_BASE}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.role !== 'department_admin') { router.push('/dashboard'); return }
      setCurrentUser(data)
      setAuthChecked(true)
      await loadAll(data)
    }
    check()
  }, [])

  const loadAll = async (admin: User) => {
    if (!token) return
    setLoading(true)
    try {
      const [usersRes, coursesRes, lessonsRes, deptsRes] = await Promise.all([
        fetch(`${API_BASE}/api/users/all`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/courses`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/lessons/pending-review`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/departments`),
      ])

      const usersData = await usersRes.json()
      const coursesData = await coursesRes.json()
      const lessonsData = await lessonsRes.json()
      const deptsData = await deptsRes.json()

      // Filter to department only
      const deptUsers = Array.isArray(usersData)
        ? usersData.filter((u: User) => u.faculty === admin.faculty && u.department === admin.department)
        : []

      setUsers(deptUsers)
      setCourses(Array.isArray(coursesData) ? coursesData : [])
      setPendingLessons(Array.isArray(lessonsData) ? lessonsData : [])

      // Get available levels from department
      const dept = Array.isArray(deptsData)
        ? deptsData.find((d: any) => d.name === admin.department && d.faculty === admin.faculty)
        : null
      if (dept) {
        const lvls: string[] = []
        for (let l = 100; l <= dept.maxLevel; l += 100) lvls.push(`${l}L`)
        setAvailableLevels(lvls)
      }

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setCourseSubmitting(true)
    setMessage('')
    try {
      const res = await fetch(`${API_BASE}/api/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          code: courseCode,
          title: courseTitle,
          description: courseDesc,
          offerings: [{
            faculty: currentUser?.faculty,
            department: currentUser?.department,
            level: courseLevel,
          }],
        }),
      })
      if (res.ok) {
        setMessage('Course created successfully!')
        setCourseCode('')
        setCourseTitle('')
        setCourseDesc('')
        setCourseLevel('')
        if (currentUser) await loadAll(currentUser)
      } else {
        const data = await res.json()
        setMessage(data.message || 'Failed to create course')
      }
    } catch (err) {
      setMessage('Something went wrong')
    } finally {
      setCourseSubmitting(false)
    }
  }

    const handleEditCourse = async (courseId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: editCourseCode, title: editCourseTitle }),
      })
      if (res.ok) {
        setEditingCourse(null)
        if (currentUser) await loadAll(currentUser)
      }
    } catch (err) { console.error(err) }
  }

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    if (!confirm(`Delete "${courseTitle}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`${API_BASE}/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        if (currentUser) await loadAll(currentUser)
      }
    } catch (err) { console.error(err) }
  }

  const handleReview = async (lessonId: string, decision: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/lessons/${lessonId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision }),
      })
      if (res.ok) {
        if (currentUser) await loadAll(currentUser)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const toggleHostPermission = async (userId: string, current: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/host-permission`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ canHostLive: !current }),
      })
      if (res.ok && currentUser) await loadAll(currentUser)
    } catch (err) { console.error(err) }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getInitials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  if (!authChecked || loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏛️</div>
        <p style={{ color: '#4b5563' }}>Loading department panel...</p>
      </div>
    </div>
  )

  const students = users.filter(u => u.role === 'student')
  const lecturers = users.filter(u => u.role === 'lecturer' || u.role === 'department_admin')

  const tabStyle = (tab: string): React.CSSProperties => ({
    padding: '10px 16px', cursor: 'pointer', border: 'none',
    borderBottom: activeTab === tab ? '2px solid #16a34a' : '2px solid transparent',
    background: 'transparent',
    color: activeTab === tab ? '#16a34a' : '#4b5563',
    fontWeight: activeTab === tab ? 700 : 400,
    fontSize: 13, whiteSpace: 'nowrap',
  })

  return (
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0369a1 100%)',
        padding: '40px 24px 80px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -80, top: -80, width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(125,211,252,0.15)' }} />

        <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(125,211,252,0.15)', border: '1px solid rgba(125,211,252,0.3)',
            borderRadius: 999, padding: '3px 12px', marginBottom: 8,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7dd3fc' }} />
            <span style={{ color: '#7dd3fc', fontSize: 12, fontWeight: 600 }}>Department Admin</span>
          </div>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
            🏛️ Department Panel
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
            {currentUser?.department} • {currentUser?.faculty}
          </p>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 12, marginTop: 32,
          }}>
            {[
              { label: 'Students', value: students.length, icon: '🎓', color: '#34d399' },
              { label: 'Lecturers', value: lecturers.length, icon: '👨‍🏫', color: '#60a5fa' },
              { label: 'Courses', value: courses.length, icon: '📚', color: '#fbbf24' },
              { label: 'Pending Review', value: pendingLessons.length, icon: '📋', color: '#f472b6' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12, padding: '14px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 960, margin: '-40px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'white', borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden',
        }}>

          {/* Tabs */}
          <div style={{ borderBottom: '1px solid #f3f4f6', display: 'flex', overflowX: 'auto', padding: '0 8px' }}>
            {[
              { key: 'overview', label: '📊 Overview' },
              { key: 'courses', label: '📚 Courses' },
              { key: 'review', label: `📋 Review (${pendingLessons.length})` },
              { key: 'students', label: '🎓 Students' },
              { key: 'lecturers', label: '👨‍🏫 Lecturers' },
              { key: 'hosts', label: '🎙️ Host Permissions' },
            ].map(tab => (
              <button key={tab.key} style={tabStyle(tab.key)} onClick={() => setActiveTab(tab.key)}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 24 }}>

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div>
                <h2 style={{ fontSize: 16, marginBottom: 20 }}>
                  {currentUser?.department} Department Overview
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                  {[
                    { label: 'Total Students', value: students.length, icon: '🎓', color: '#16a34a', bg: '#f0fdf4' },
                    { label: 'Total Lecturers', value: lecturers.length, icon: '👨‍🏫', color: '#2563eb', bg: '#eff6ff' },
                    { label: 'Active Courses', value: courses.length, icon: '📚', color: '#d97706', bg: '#fffbeb' },
                    { label: 'Lessons to Review', value: pendingLessons.length, icon: '📋', color: '#7c3aed', bg: '#f5f3ff' },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      background: stat.bg, borderRadius: 12, padding: '20px',
                      border: `1px solid ${stat.color}20`,
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 10,
                        background: 'white', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: 22,
                      }}>{stat.icon}</div>
                      <div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick actions */}
                <h3 style={{ fontSize: 14, marginBottom: 12 }}>Quick Actions</h3>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn-primary" onClick={() => setActiveTab('courses')}>
                    + Create Course
                  </button>
                  <button className="btn-outline" onClick={() => setActiveTab('review')}>
                    📋 Review Lessons ({pendingLessons.length})
                  </button>
                  <Link href="/learning-hub/create-lesson">
                    <button className="btn-outline">✏️ Create Lesson</button>
                  </Link>
                </div>
              </div>
            )}

            {/* COURSES */}
            {activeTab === 'courses' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                  {/* Create course form */}
                  <div>
                    <h2 style={{ fontSize: 16, marginBottom: 16 }}>
                      Add Course for {currentUser?.department}
                    </h2>
                    <form onSubmit={handleCreateCourse}>
                      <label>Course Code</label>
                      <input
                        type="text" placeholder="e.g. CSC201"
                        value={courseCode}
                        onChange={e => setCourseCode(e.target.value.toUpperCase())}
                        required
                      />
                      <label>Course Title</label>
                      <input
                        type="text" placeholder="e.g. Data Structures"
                        value={courseTitle}
                        onChange={e => setCourseTitle(e.target.value)}
                        required
                      />
                      <label>Description</label>
                      <textarea
                        placeholder="Brief course description..."
                        value={courseDesc}
                        onChange={e => setCourseDesc(e.target.value)}
                        rows={3}
                        style={{
                          width: '100%', padding: '10px 12px',
                          border: '1.5px solid #e5e7eb', borderRadius: 8,
                          fontSize: 14, resize: 'vertical', fontFamily: 'inherit', outline: 'none',
                        }}
                      />
                      <label>Level</label>
                      <select
                        value={courseLevel}
                        onChange={e => setCourseLevel(e.target.value)}
                        required
                      >
                        <option value="">Select level...</option>
                        {availableLevels.map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={courseSubmitting}
                        style={{ marginTop: 16, width: '100%' }}
                      >
                        {courseSubmitting ? 'Creating...' : '+ Create Course'}
                      </button>
                    </form>
                    {message && (
                      <div
                        className={message.includes('success') ? 'alert alert-success' : 'alert alert-error'}
                        style={{ marginTop: 12 }}
                      >
                        {message}
                      </div>
                    )}
                  </div>

                  {/* Course list */}
                  <div>
                    <h2 style={{ fontSize: 16, marginBottom: 16 }}>
                      Active Courses ({courses.length})
                    </h2>
                    {courses.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📚</div>
                        <p>No courses yet. Create your first course.</p>
                      </div>
                    ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {courses.map(course => (
                          <div key={course._id} style={{
                            background: '#f9fafb', borderRadius: 10, padding: '12px 16px',
                            border: '1px solid #e5e7eb',
                          }}>
                            {editingCourse?._id === course._id ? (
                              // Edit mode
                              <div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                                  <div>
                                    <label style={{ fontSize: 11, fontWeight: 600 }}>Code</label>
                                    <input
                                      type="text"
                                      value={editCourseCode}
                                      onChange={e => setEditCourseCode(e.target.value.toUpperCase())}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: 11, fontWeight: 600 }}>Title</label>
                                    <input
                                      type="text"
                                      value={editCourseTitle}
                                      onChange={e => setEditCourseTitle(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button
                                    onClick={() => handleEditCourse(course._id)}
                                    className="btn-primary"
                                    style={{ flex: 1, padding: '6px' }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingCourse(null)}
                                    className="btn-outline"
                                    style={{ flex: 1, padding: '6px' }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // View mode
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>
                                    {course.code}
                                  </span>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                                    {course.title}
                                  </div>
                                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                                    {course.offerings?.map(o => o.level).join(', ')}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <Link href={`/learning-hub/course/${course._id}`}>
                                    <button style={{
                                      background: '#f0fdf4', border: 'none', borderRadius: 6,
                                      color: '#16a34a', padding: '6px 10px',
                                      cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                    }}>
                                      View
                                    </button>
                                  </Link>
                                  <button
                                    onClick={() => {
                                      setEditingCourse(course)
                                      setEditCourseCode(course.code)
                                      setEditCourseTitle(course.title)
                                    }}
                                    style={{
                                      background: '#eff6ff', border: 'none', borderRadius: 6,
                                      color: '#2563eb', padding: '6px 10px',
                                      cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                    }}
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCourse(course._id, course.title)}
                                    style={{
                                      background: '#fef2f2', border: 'none', borderRadius: 6,
                                      color: '#ef4444', padding: '6px 10px',
                                      cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                    }}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* REVIEW QUEUE */}
            {activeTab === 'review' && (
              <div>
                <h2 style={{ fontSize: 16, marginBottom: 16 }}>
                  Lesson Review Queue ({pendingLessons.length})
                </h2>
                {pendingLessons.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
                    <p>All caught up! No lessons pending review.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {pendingLessons.map(lesson => (
                      <div key={lesson._id} style={{
                        background: '#f9fafb', borderRadius: 12, padding: '16px 20px',
                        border: '1px solid #e5e7eb',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: lesson.uploadedBy?.avatarColor || '#2563eb',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontSize: 12, fontWeight: 700,
                            }}>
                              {getInitials(lesson.uploadedBy?.name || '?')}
                            </div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600 }}>{lesson.uploadedBy?.name}</div>
                              <div style={{ fontSize: 11, color: '#9ca3af' }}>{formatDate(lesson.createdAt)}</div>
                            </div>
                          </div>
                          <span style={{
                            background: '#fef3c7', color: '#92400e',
                            padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                          }}>
                            ⏳ Pending
                          </span>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>
                            {lesson.course?.code} • Week {lesson.weekNumber}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>
                            {lesson.title}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleReview(lesson._id, 'approve')}
                            style={{
                              flex: 1, padding: '8px', borderRadius: 8, border: 'none',
                              background: '#f0fdf4', color: '#15803d',
                              cursor: 'pointer', fontWeight: 600, fontSize: 13,
                            }}
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => handleReview(lesson._id, 'request_changes')}
                            style={{
                              flex: 1, padding: '8px', borderRadius: 8, border: 'none',
                              background: '#fffbeb', color: '#92400e',
                              cursor: 'pointer', fontWeight: 600, fontSize: 13,
                            }}
                          >
                            🔄 Request Changes
                          </button>
                          <button
                            onClick={() => handleReview(lesson._id, 'reject')}
                            style={{
                              flex: 1, padding: '8px', borderRadius: 8, border: 'none',
                              background: '#fef2f2', color: '#dc2626',
                              cursor: 'pointer', fontWeight: 600, fontSize: 13,
                            }}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== STUDENTS TAB ===== */}
            {activeTab === 'students' && (
              <div>
                <h2 style={{ marginBottom: 16, fontSize: 16 }}>
                  Students in {currentUser?.department} ({students.length})
                </h2>

                {/* Level filter */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setDaStudentLevel('')}
                    style={{
                      padding: '6px 14px', borderRadius: 8, border: 'none',
                      background: !daStudentLevel ? '#16a34a' : '#f3f4f6',
                      color: !daStudentLevel ? 'white' : '#374151',
                      cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    }}
                  >
                    All Levels ({students.length})
                  </button>
                  {[...new Set(students.map(s => s.level).filter(Boolean))].sort().map(level => (
                    <button
                      key={level}
                      onClick={() => setDaStudentLevel(level)}
                      style={{
                        padding: '6px 14px', borderRadius: 8, border: 'none',
                        background: daStudentLevel === level ? '#16a34a' : '#f3f4f6',
                        color: daStudentLevel === level ? 'white' : '#374151',
                        cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      }}
                    >
                      {level} ({students.filter(s => s.level === level).length})
                    </button>
                  ))}
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        {['Student', 'Level', 'Reg No', 'Status'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {students
                        .filter(u => !daStudentLevel || u.level === daStudentLevel)
                        .map(u => (
                          <tr key={u._id} style={{ borderBottom: '1px solid #f9fafb' }}>
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 32, height: 32, borderRadius: '50%',
                                  background: u.avatarColor || '#16a34a',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: 'white', fontSize: 12, fontWeight: 700,
                                }}>{getInitials(u.name)}</div>
                                <div>
                                  <div style={{ fontWeight: 600 }}>{u.name}</div>
                                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                                {u.level}
                              </span>
                            </td>
                            <td style={{ padding: '12px', color: '#4b5563', fontSize: 12 }}>{u.regNumber || '—'}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                background: u.graduated ? '#dcfce7' : '#f0fdf4',
                                color: u.graduated ? '#15803d' : '#16a34a',
                                padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                              }}>
                                {u.graduated ? 'Graduated' : 'Active'}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* LECTURERS */}
            {activeTab === 'lecturers' && (
              <div>
                <h2 style={{ fontSize: 16, marginBottom: 16 }}>
                  Lecturers in {currentUser?.department} ({lecturers.length})
                </h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        {['Lecturer', 'Role'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lecturers.map(u => (
                        <tr key={u._id} style={{ borderBottom: '1px solid #f9fafb' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: u.avatarColor || '#2563eb',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: 12, fontWeight: 700,
                              }}>{getInitials(u.name)}</div>
                              <div>
                                <div style={{ fontWeight: 600 }}>{u.name}</div>
                                <div style={{ fontSize: 11, color: '#9ca3af' }}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              background: u.role === 'department_admin' ? '#eff6ff' : '#f0fdf4',
                              color: u.role === 'department_admin' ? '#2563eb' : '#16a34a',
                              padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                            }}>
                              {u.role === 'department_admin' ? 'Dept Admin' : 'Lecturer'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

           {/* ===== HOST PERMISSIONS TAB ===== */}
            {activeTab === 'hosts' && (
              <div>
                <div className="alert alert-success" style={{ marginBottom: 20 }}>
                  Grant up to <strong>2 students per level</strong> the ability to host live sessions.
                </div>

                {[...new Set(students.map(s => s.level).filter(Boolean))].sort().map(level => {
                  const levelStudents = students.filter(s => s.level === level)
                  const hostsInLevel = levelStudents.filter(s => s.canHostLive).length
                  return (
                    <div key={level} style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <span style={{
                          background: '#f0fdf4', color: '#16a34a',
                          padding: '3px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700,
                        }}>
                          {level}
                        </span>
                        <span style={{ fontSize: 12, color: hostsInLevel >= 2 ? '#dc2626' : '#9ca3af' }}>
                          {hostsInLevel}/2 hosts granted
                          {hostsInLevel >= 2 && ' — limit reached'}
                        </span>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                            {['Student', 'Can Host Live'].map(h => (
                              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {levelStudents.map(u => {
                            const canGrant = u.canHostLive || hostsInLevel < 2
                            return (
                              <tr key={u._id} style={{ borderBottom: '1px solid #f9fafb' }}>
                                <td style={{ padding: '10px 12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{
                                      width: 28, height: 28, borderRadius: '50%',
                                      background: u.avatarColor || '#16a34a',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      color: 'white', fontSize: 11, fontWeight: 700,
                                    }}>{getInitials(u.name)}</div>
                                    <div>
                                      <div style={{ fontWeight: 500 }}>{u.name}</div>
                                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{u.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '10px 12px' }}>
                                  <button
                                    onClick={() => toggleHostPermission(u._id, u.canHostLive)}
                                    disabled={!canGrant}
                                    style={{
                                      padding: '5px 14px', borderRadius: 6, border: 'none',
                                      cursor: canGrant ? 'pointer' : 'not-allowed',
                                      fontSize: 12, fontWeight: 600,
                                      background: u.canHostLive ? '#dcfce7' : canGrant ? '#f3f4f6' : '#f9fafb',
                                      color: u.canHostLive ? '#15803d' : canGrant ? '#374151' : '#9ca3af',
                                    }}
                                  >
                                    {u.canHostLive ? '✅ Granted' : canGrant ? 'Grant' : 'Limit reached'}
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                })}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}