'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import NotificationBell from './NotificationBell'
import { getAuthToken } from './utils/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

interface TopbarProps {
  onMenuClick: () => void
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/chat': 'Chat',
  '/live': 'Live Classes',
  '/learning-hub': 'Learning Hub',
  '/intranet': 'Intranet',
  '/announcements': 'Announcements',
  '/courses': 'Courses',
  '/timetable': 'Timetable',
  '/documents': 'Documents',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/admin': 'Admin Panel',
  '/faculty-admin': 'Faculty Panel',
  '/dept-admin': 'Department Panel',
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<any>(null)
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const token = getAuthToken()

  const publicPages = ['/', '/login', '/register']
  const title = pageTitles[pathname] ||
    Object.entries(pageTitles).find(([key]) => pathname.startsWith(key))?.[1] || 'UniWeb'

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Debounced search
  useEffect(() => {
    if (!search.trim() || search.trim().length < 2) {
      setResults(null)
      setShowResults(false)
      return
    }

    const timer = setTimeout(async () => {
      if (!token) return
      setSearching(true)
      try {
        const res = await fetch(
          `${API_BASE}/api/users/search?q=${encodeURIComponent(search.trim())}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (res.ok) {
          const data = await res.json()
          setResults(data)
          setShowResults(true)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setSearching(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [search])

  const handleResultClick = (href: string) => {
    setSearch('')
    setShowResults(false)
    setResults(null)
    router.push(href)
  }

  const getInitials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const hasResults = results && (
    results.courses?.length > 0 ||
    results.announcements?.length > 0 ||
    results.lessons?.length > 0 ||
    results.users?.length > 0
  )

  if (publicPages.includes(pathname)) return null

  return (
    <div className="topbar">

      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="menu-btn"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 22, padding: 4, color: '#374151',
          display: 'none',
        }}
      >
        ☰
      </button>

      {/* Search */}
      <div ref={searchRef} style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
        <div className="search-bar">
          <span style={{ fontSize: 14, color: searching ? '#16a34a' : '#9ca3af' }}>
            {searching ? '⏳' : '🔍'}
          </span>
          <input
            placeholder={`Search courses, lessons, announcements...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => results && setShowResults(true)}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setResults(null); setShowResults(false) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, padding: '0 4px' }}
            >
              ×
            </button>
          )}
          {!search && (
            <span style={{ fontSize: 11, color: '#d1d5db', border: '1px solid #e5e7eb', borderRadius: 4, padding: '1px 6px' }}>
              ⌘K
            </span>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: 'white', borderRadius: 14, marginTop: 6,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb', zIndex: 1000,
            maxHeight: 480, overflowY: 'auto',
          }}>
            {!hasResults ? (
              <div style={{ padding: '24px 20px', textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                <p style={{ fontSize: 13 }}>No results for "{search}"</p>
              </div>
            ) : (
              <div>

                {/* Courses */}
                {results.courses?.length > 0 && (
                  <div>
                    <div style={{ padding: '10px 16px 4px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Courses
                    </div>
                    {results.courses.map((course: any) => (
                      <div
                        key={course._id}
                        onClick={() => handleResultClick(`/learning-hub/course/${course._id}`)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 16px', cursor: 'pointer',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: '#f0fdf4', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, flexShrink: 0,
                        }}>
                          📚
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>
                            {course.code} — {course.title}
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>Course</div>
                        </div>
                        <span style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: 16 }}>›</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Lessons */}
                {results.lessons?.length > 0 && (
                  <div>
                    <div style={{ padding: '10px 16px 4px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, borderTop: results.courses?.length > 0 ? '1px solid #f3f4f6' : 'none' }}>
                      Lessons
                    </div>
                    {results.lessons.map((lesson: any) => (
                      <div
                        key={lesson._id}
                        onClick={() => handleResultClick(`/learning-hub/course/${lesson.course?._id}`)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 16px', cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: '#eff6ff', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, flexShrink: 0,
                        }}>
                          📄
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>
                            {lesson.title}
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>
                            {lesson.course?.code} • Week {lesson.weekNumber}
                          </div>
                        </div>
                        <span style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: 16 }}>›</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Announcements */}
                {results.announcements?.length > 0 && (
                  <div>
                    <div style={{ padding: '10px 16px 4px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, borderTop: '1px solid #f3f4f6' }}>
                      Announcements
                    </div>
                    {results.announcements.map((ann: any) => (
                      <div
                        key={ann._id}
                        onClick={() => handleResultClick('/announcements')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 16px', cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: '#fffbeb', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, flexShrink: 0,
                        }}>
                          📢
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>
                            {ann.title}
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>
                            Announcement • {ann.faculty}
                          </div>
                        </div>
                        <span style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: 16 }}>›</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Users (staff only) */}
                {results.users?.length > 0 && (
                  <div>
                    <div style={{ padding: '10px 16px 4px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, borderTop: '1px solid #f3f4f6' }}>
                      People
                    </div>
                    {results.users.map((user: any) => (
                      <div
                        key={user._id}
                        onClick={() => handleResultClick('/admin')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 16px', cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: user.avatarColor || '#16a34a',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0,
                        }}>
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>
                            {user.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>
                            {user.role} • {user.department}
                          </div>
                        </div>
                        <span style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: 16 }}>›</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div style={{
                  padding: '10px 16px', borderTop: '1px solid #f3f4f6',
                  fontSize: 11, color: '#9ca3af', textAlign: 'center',
                }}>
                  Press Enter to search • Esc to close
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        <NotificationBell />
        <button
          onClick={() => router.push('/timetable')}
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#f9fafb', border: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 16,
          }}
          title="Timetable"
        >
          📅
        </button>
        <button
          onClick={() => router.push('/settings')}
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#f9fafb', border: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 16,
          }}
          title="Settings"
        >
          ⚙️
        </button>
      </div>
    </div>
  )
}