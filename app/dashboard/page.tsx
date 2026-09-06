'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { SkeletonDashboard } from '../components/Skeleton'
import { getAuthToken, removeAuthToken } from '../utils/auth'
import Link from 'next/link'

interface User {
  _id: string
  name: string
  email: string
  role: string
  faculty: string
  department: string
  level: string | null
  firstLogin: boolean
  avatarColor: string
  canHostLive: boolean
}

interface Enrollment {
  _id: string
  course: { _id: string; code: string; title: string; lecturers: { name: string; avatarColor?: string }[] }
  overallProgress: number
  currentLesson: { title: string; weekNumber: number } | null
  completedLessons: string[]
}

interface Announcement {
  _id: string
  title: string
  content: string
  faculty: string
  priority: string
  author: { name: string; role: string; avatarColor?: string }
  createdAt: string
}

interface LiveSession {
  _id: string
  title: string
  host: { name: string }
  level: string
  targets: { faculty: string; department: string }[]
  isActive: boolean
  createdAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([])
  const [todayClasses, setTodayClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())

  const quotes = [
    '"The beautiful thing about learning is that no one can take it away from you."',
    '"Education is the most powerful weapon which you can use to change the world."',
    '"The more that you read, the more things you will know."',
    '"An investment in knowledge pays the best interest."',
    '"Live as if you were to die tomorrow. Learn as if you were to live forever."',
  ]
  const quote = quotes[new Date().getDay() % quotes.length]

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const todayName = dayNames[new Date().getDay()]
  const timetableDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const timetableTodayName = timetableDayNames[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')

    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const token = getAuthToken()
      if (!token) { router.push('/login'); return }

      try {
        const userRes = await fetch(`${API_BASE}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!userRes.ok) { removeAuthToken(); router.push('/login'); return }
        const userData = await userRes.json()
        setUser(userData)

        if (userData.firstLogin) {
          await fetch(`${API_BASE}/api/users/first-login`, {
            method: 'PUT', headers: { Authorization: `Bearer ${token}` },
          })
        }

        const [annRes, liveRes, enrollRes, timetableRes] = await Promise.all([
          fetch(`${API_BASE}/api/announcements`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/live`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/courses/my-enrollments`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/timetable`, { headers: { Authorization: `Bearer ${token}` } }),
        ])

        const annData = await annRes.json()
        const liveData = await liveRes.json()
        const enrollData = await enrollRes.json()
        const timetableData = await timetableRes.json()

        setAnnouncements(Array.isArray(annData) ? annData.slice(0, 3) : [])
        setLiveSessions(Array.isArray(liveData) ? liveData : [])
        setEnrollments(Array.isArray(enrollData) ? enrollData : [])

        if (Array.isArray(timetableData) && timetableData.length > 0) {
          const todayEntries = timetableData[0].entries
            ?.filter((e: any) => e.day === timetableTodayName)
            .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime)) || []
          setTodayClasses(todayEntries)
        }

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router])

  const handleLogout = () => { removeAuthToken(); router.push('/login') }

  const getInitials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const getRoleLabel = () => {
    if (user?.role === 'admin') return 'Super Admin'
    if (user?.role === 'faculty_admin') return 'Faculty Admin'
    if (user?.role === 'department_admin') return 'Dept Admin'
    if (user?.role === 'lecturer') return 'Lecturer'
    return `Student • ${user?.level}`
  }

  const getRoleColor = () => {
  if (user?.role === 'admin') return '#dc2626'
  if (user?.role === 'faculty_admin') return '#7c3aed'
  if (user?.role === 'department_admin') return '#2563eb'
  if (user?.role === 'lecturer') return '#d97706'
  return '#16a34a' // student
}

  const getCourseColor = (code: string) => {
    const colors = ['#16a34a', '#2563eb', '#7c3aed', '#d97706', '#dc2626', '#0891b2']
    return colors[code?.charCodeAt(0) % colors.length] || '#16a34a'
  }

  const formatDate = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  const formatTime = (t: string) => {
    const [h, m] = t.split(':')
    const hour = parseInt(h)
    return `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
  }

  const isClassNow = (entry: any) => {
    const now = currentTime
    const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    return nowStr >= entry.startTime && nowStr < entry.endTime
  }

  const isClassSoon = (entry: any) => {
    const now = currentTime
    const nowMins = now.getHours() * 60 + now.getMinutes()
    const [sh, sm] = entry.startTime.split(':').map(Number)
    const startMins = sh * 60 + sm
    return startMins - nowMins > 0 && startMins - nowMins <= 60
  }

  const currentCourse = enrollments[0]
  const completedSteps = currentCourse
    ? Math.round((currentCourse.overallProgress / 100) * 8)
    : 0

  const announcementIcons: Record<string, string> = {
    urgent: '🚨', important: '⚠️', general: '📢',
  }
 const announcementColors: Record<string, string> = {
  urgent: '#dc2626', important: '#d97706', general: '#16a34a',
}

if (loading) return <SkeletonDashboard />

return (
  <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>

    {/* ===== GREETING BANNER ===== */}
    <div style={{
      background: 'white', borderBottom: '1px solid #f3f4f6',
      padding: '20px 24px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexWrap: 'wrap', gap: 12,
    }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: getRoleColor() + '15',
            border: `1px solid ${getRoleColor()}30`,
            borderRadius: 999, padding: '3px 10px', marginBottom: 6,
            fontSize: 11, fontWeight: 700, color: getRoleColor(),
          }}>
            {user?.role === 'admin' && '⚙️ Super Administrator'}
            {user?.role === 'faculty_admin' && '🛡️ Faculty Administrator'}
            {user?.role === 'department_admin' && '🏛️ Department Administrator'}
            {user?.role === 'lecturer' && '👨‍🏫 Lecturer'}
            {user?.role === 'student' && `🎓 Student • ${user?.level}`}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>
            {greeting}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            {user?.department && `${user.department} • `}{user?.faculty}
          </p>
        </div>
        <div style={{
          background: '#f9fafb', borderRadius: 12, padding: '12px 20px',
          maxWidth: 380, border: '1px solid #f3f4f6',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <p style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
            {quote}
          </p>
        </div>
      </div>

      <div style={{ padding: '20px 24px' }}>

        {/* ===== STATS ROW ===== */}
                <div className="dashboard-stats" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12, marginBottom: 20,
        }}>
          {[
            {
              icon: '📈', label: 'Courses Enrolled', value: enrollments.length,
              sub: 'Active this semester', color: '#16a34a', bg: '#f0fdf4',
            },
            {
              icon: '📝', label: 'Assignments',
              value: `${currentCourse?.completedLessons?.length || 0} / ${enrollments.reduce((a, e) => a + (e.completedLessons?.length || 0), 0) + 5}`,
              sub: 'Completed', color: '#7c3aed', bg: '#f5f3ff',
            },
            {
              icon: '🏆', label: 'Average Score',
              value: `${currentCourse ? Math.round(currentCourse.overallProgress * 0.864) : 0}%`,
              sub: 'This semester', color: '#2563eb', bg: '#eff6ff',
            },
            {
              icon: '⏱️', label: 'Study Hours',
              value: `${enrollments.length * 6}h`,
              sub: 'This week', color: '#d97706', bg: '#fffbeb',
            },
            {
              icon: '🥇', label: 'Badges Earned',
              value: enrollments.filter(e => e.overallProgress === 100).length,
              sub: 'Keep it up!', color: '#16a34a', bg: '#f0fdf4',
            },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'white', borderRadius: 12, padding: '16px',
              border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: stat.bg, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#1f2937', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{stat.label}</div>
                <div style={{ fontSize: 10, color: stat.color, fontWeight: 600 }}>{stat.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ===== STUDENT/LECTURER LAYOUT ===== */}
        {(user?.role === 'student' || user?.role === 'lecturer') && (
                  <div className="dashboard-three-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: 16, marginBottom: 20 }}>

            {/* TODAY'S SCHEDULE */}
            <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700 }}>Today's Schedule</h2>
                <Link href="/timetable" style={{ fontSize: 12, color: '#16a34a' }}>View Timetable →</Link>
              </div>
              {todayClasses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>☀️</div>
                  <p style={{ fontSize: 13 }}>No classes today — enjoy your day!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {todayClasses.map((cls: any, i: number) => {
                    const active = isClassNow(cls)
                    const soon = isClassSoon(cls)
                    return (
                      <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: i < todayClasses.length - 1 ? 14 : 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 60, flexShrink: 0 }}>
                          <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>{formatTime(cls.startTime)}</span>
                          <div style={{
                            width: 10, height: 10, borderRadius: '50%', margin: '4px 0',
                            background: active ? '#16a34a' : soon ? '#7c3aed' : '#e5e7eb',
                          }} />
                          {i < todayClasses.length - 1 && <div style={{ width: 1, flex: 1, background: '#e5e7eb', minHeight: 20 }} />}
                        </div>
                        <div style={{
                          flex: 1, padding: '8px 12px', borderRadius: 10, marginBottom: 8,
                          background: active ? '#f0fdf4' : soon ? '#f5f3ff' : '#f9fafb',
                          border: active ? '1px solid #bbf7d0' : '1px solid #f3f4f6',
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: cls.color || '#16a34a' }}>{cls.courseCode}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{cls.courseTitle}</div>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>{cls.type} • {cls.venue}</div>
                          {active && <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 700, marginTop: 3 }}>● Happening now</div>}
                          {soon && !active && <div style={{ fontSize: 10, color: '#7c3aed', fontWeight: 700, marginTop: 3 }}>🕐 Starts soon</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {/* Live sessions */}
              {liveSessions.length > 0 && (
                <div style={{ marginTop: 16, borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700 }}>Live Now</h3>
                    <Link href="/live" style={{ fontSize: 11, color: '#16a34a' }}>View all →</Link>
                  </div>
                  {liveSessions.slice(0, 2).map(session => (
                    <div key={session._id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', background: '#fef2f2',
                      border: '1px solid #fecaca', borderRadius: 8, marginBottom: 8,
                    }}>
                      <span style={{ fontSize: 16 }}>📡</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1f2937' }}>{session.title}</div>
                        <div style={{ fontSize: 10, color: '#9ca3af' }}>With {session.host?.name}</div>
                      </div>
                      <Link href="/live">
                        <button style={{
                          background: '#16a34a', border: 'none', borderRadius: 6,
                          color: 'white', padding: '5px 10px', cursor: 'pointer',
                          fontSize: 11, fontWeight: 700,
                        }}>Join</button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CURRENT COURSE */}
            <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700 }}>
                  {user?.role === 'lecturer' ? 'My Teaching' : 'Current Course'}
                </h2>
                <Link href="/learning-hub" style={{ fontSize: 12, color: '#16a34a' }}>Go to Learning Hub →</Link>
              </div>
              {!currentCourse ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📚</div>
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                    {user?.role === 'lecturer' ? 'No courses assigned yet' : 'No courses enrolled yet'}
                  </p>
                  <Link href="/learning-hub">
                    <button className="btn-primary" style={{ fontSize: 12 }}>
                      {user?.role === 'lecturer' ? 'Create Lesson →' : 'Explore Courses →'}
                    </button>
                  </Link>
                </div>
              ) : (
                <div>
                  <div style={{
                    background: 'linear-gradient(135deg, #052e16, #166534)',
                    borderRadius: 12, padding: '16px 20px', marginBottom: 16,
                  }}>
                    <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 600, marginBottom: 4 }}>
                      {currentCourse.currentLesson ? `Week ${currentCourse.currentLesson.weekNumber}` : 'Current Module'}
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: 'white', marginBottom: 8 }}>
                      {currentCourse.currentLesson?.title || currentCourse.course?.title}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#4ade80' }}>
                          {currentCourse.overallProgress}%
                        </span>
                      </div>
                    </div>
                  </div>
                  {[
                    { icon: '📄', label: 'Lecture Notes', sub: 'Study materials' },
                    { icon: '🎥', label: 'Video Links', sub: 'Curated videos' },
                    { icon: '💻', label: 'Sandbox', sub: 'Practice code' },
                    { icon: '✅', label: 'Quiz', sub: 'Test yourself' },
                  ].map(item => (
                    <Link key={item.label} href={`/learning-hub/course/${currentCourse.course?._id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 0', borderBottom: '1px solid #f9fafb', cursor: 'pointer',
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, background: '#f9fafb',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0,
                        }}>{item.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{item.label}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{item.sub}</div>
                        </div>
                        <span style={{ color: '#9ca3af', fontSize: 16 }}>›</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT — Progress + Announcements */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700 }}>Progress Overview</h2>
                  <Link href="/learning-hub" style={{ fontSize: 11, color: '#16a34a' }}>View all →</Link>
                </div>
                {[
                  { label: 'Assignments', value: 78, color: '#16a34a' },
                  { label: 'Quizzes', value: 90, color: '#2563eb' },
                  { label: 'Labs', value: 80, color: '#7c3aed' },
                  { label: 'Attendance', value: 85, color: '#d97706' },
                  { label: 'Discussions', value: 70, color: '#0891b2' },
                ].map(item => (
                  <div key={item.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>{item.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{item.value}%</span>
                    </div>
                    <div style={{ height: 5, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${item.value}%`, background: item.color, borderRadius: 999 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700 }}>Announcements</h2>
                  <Link href="/announcements" style={{ fontSize: 11, color: '#16a34a' }}>View all →</Link>
                </div>
                {announcements.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: '12px 0' }}>No announcements</p>
                ) : (
                  announcements.map(ann => (
                    <div key={ann._id} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: (announcementColors[ann.priority || 'general']) + '15',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                      }}>
                        {announcementIcons[ann.priority || 'general']}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ann.title}
                        </div>
                        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                          {formatDate(ann.createdAt)} • {ann.author?.name}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== ADMIN/DEPT ADMIN/FACULTY ADMIN LAYOUT ===== */}
        {(user?.role === 'admin' || user?.role === 'faculty_admin' || user?.role === 'department_admin') && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

            {/* Quick actions */}
            <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>⚡ Quick Actions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ...(user?.role === 'admin' ? [
                    { icon: '👥', label: 'Manage Users', sub: 'View and manage all users', href: '/admin' },
                    { icon: '🏛️', label: 'Departments', sub: 'Create and manage departments', href: '/admin' },
                    { icon: '📅', label: 'Academic Sessions', sub: 'Manage sessions and promotion', href: '/admin' },
                  ] : []),
                  ...(user?.role === 'faculty_admin' ? [
                    { icon: '👥', label: 'My Faculty Users', sub: 'Manage students and lecturers', href: '/faculty-admin' },
                    { icon: '📢', label: 'Post Announcement', sub: 'Notify your faculty', href: '/announcements' },
                    { icon: '📋', label: 'Review Lessons', sub: 'Approve pending content', href: '/learning-hub/review' },
                  ] : []),
                  ...(user?.role === 'department_admin' ? [
                    { icon: '📚', label: 'Manage Courses', sub: 'Add and update courses', href: '/dept-admin' },
                    { icon: '📋', label: 'Review Lessons', sub: `${0} pending review`, href: '/learning-hub/review' },
                    { icon: '📅', label: 'Timetable', sub: 'Manage class schedule', href: '/timetable' },
                    { icon: '🎙️', label: 'Host Permissions', sub: 'Manage student reps', href: '/dept-admin' },
                  ] : []),
                ].map(action => (
                  <Link key={action.href + action.label} href={action.href} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', background: '#f9fafb', borderRadius: 10,
                      cursor: 'pointer', border: '1px solid #f3f4f6', transition: 'all 0.15s',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, background: '#f0fdf4',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                      }}>{action.icon}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{action.label}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{action.sub}</div>
                      </div>
                      <span style={{ marginLeft: 'auto', color: '#9ca3af' }}>›</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Announcements */}
            <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700 }}>📢 Announcements</h2>
                <Link href="/announcements" style={{ fontSize: 12, color: '#16a34a' }}>View all →</Link>
              </div>
              {announcements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📢</div>
                  <p style={{ fontSize: 13 }}>No announcements yet</p>
                  <Link href="/announcements">
                    <button className="btn-primary" style={{ marginTop: 12, fontSize: 12 }}>Post Announcement</button>
                  </Link>
                </div>
              ) : (
                announcements.map(ann => (
                  <div key={ann._id} style={{
                    display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start',
                    padding: '10px 12px', background: '#f9fafb', borderRadius: 8,
                    borderLeft: `3px solid ${announcementColors[ann.priority || 'general']}`,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{ann.title}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                        {ann.content?.slice(0, 60)}...
                      </div>
                      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                        {formatDate(ann.createdAt)} • {ann.faculty}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ===== MY COURSES (students/lecturers) ===== */}
        {enrollments.length > 0 && (user?.role === 'student' || user?.role === 'lecturer') && (
          <div style={{ background: 'white', borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>
                {user?.role === 'lecturer' ? '📚 My Courses' : '📚 Continue Learning'}
              </h2>
              <Link href="/learning-hub" style={{ fontSize: 12, color: '#16a34a' }}>View All →</Link>
            </div>
            <div className="course-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {enrollments.slice(0, 4).map((enrollment) => {
                const course = enrollment.course
                if (!course) return null
                const color = getCourseColor(course.code)
                return (
                  <Link key={enrollment._id} href={`/learning-hub/course/${course._id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #f3f4f6', cursor: 'pointer' }}>
                      <div style={{ background: color, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{course.code}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1.3 }}>{course.title}</div>
                        </div>
                        <div style={{ fontSize: 20 }}>📚</div>
                      </div>
                      <div style={{ padding: '10px 14px', background: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: '#6b7280' }}>{course.lecturers?.[0]?.name || 'Instructor'}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color }}>{enrollment.overallProgress}%</span>
                        </div>
                        <div style={{ height: 4, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${enrollment.overallProgress}%`, background: color, borderRadius: 999 }} />
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* AI Assistant */}
        <div className="ai-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>🤖</span>
            <div>
              <div className="ai-bar-text">AI Learning Assistant</div>
              <div className="ai-bar-sub">Stuck on a topic? Ask AI to explain, summarize, or generate practice questions.</div>
            </div>
          </div>
          <Link href="/learning-hub">
            <button style={{
              background: '#16a34a', color: 'white', border: 'none',
              borderRadius: 10, padding: '10px 20px', cursor: 'pointer',
              fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
            }}>
              Ask AI Assistant →
            </button>
          </Link>
        </div>

      </div>
    </div>
  )
}