'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getAuthToken, removeAuthToken } from './utils/auth'

interface User {
  name: string
  role: string
  faculty: string
  department: string
  level: string | null
  avatarColor?: string
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

  useEffect(() => {
    const token = getAuthToken()
    if (!token) return
    fetch(`${API_BASE}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => data && setUser(data))
      .catch(() => {})
  }, [pathname])

  const handleLogout = () => {
    removeAuthToken()
    setUser(null)
    router.push('/login')
    onClose()
  }

  const getInitials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const getRoleLabel = () => {
    if (!user) return ''
    if (user.role === 'admin') return 'Super Admin'
    if (user.role === 'faculty_admin') return 'Faculty Admin'
    if (user.role === 'lecturer') return 'Lecturer'
    return `Student • ${user.level}`
  }

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  // Navigation items based on role
  const mainNavItems = [
    { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { href: '/chat', icon: '💬', label: 'Chat', badge: 0 },
    { href: '/live', icon: '📡', label: 'Live Classes' },
    { href: '/learning-hub', icon: '🎓', label: 'Learning Hub', isNew: true },
    ...(user?.department && [
      'Computer Science',
      'Computer Science with Statistics',
      'Computer Robotics',
      'Statistics',
      'Mathematics',
      'Physics and Astronomy',
      'Electronic Engineering',
      'Electrical Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
      //'Biomedical Engineering',
      //'Mechatronic Engineering',
      //'Metallurgical and Materials Engineering',
      'Agricultural and Bioresources Engineering',
      'Computer Education',
      'Science Laboratory Technology',
    ].includes(user.department) ? [
      { href: '/learning-hub/tools/sandbox', icon: '💻', label: 'Code Sandbox' },
    ] : []),
    ...(user?.role === 'lecturer' || user?.role === 'faculty_admin' || user?.role === 'department_admin' ? [
      { href: '/learning-hub/create-lesson', icon: '✏️', label: 'Create Lesson' },
    ] : []),
    ...(user?.role === 'faculty_admin' || user?.role === 'admin' || user?.role === 'department_admin' ? [
      { href: '/learning-hub/review', icon: '📋', label: 'Review Queue' },
    ] : []),
        { href: '/intranet', icon: '🌐', label: 'Intranet' },
    { href: '/announcements', icon: '📢', label: 'Announcements', badge: 0 },
  ]

  const academicItems = [
    { href: '/courses', icon: '📚', label: 'Courses' },
    { href: '/timetable', icon: '📅', label: 'Timetable' },
    { href: '/documents', icon: '📄', label: 'Documents' },
  ]

  const adminItems = user?.role === 'admin' ? [
    { href: '/admin', icon: '⚙️', label: 'Admin Panel' },
  ] : user?.role === 'faculty_admin' ? [
    { href: '/faculty-admin', icon: '🛡️', label: 'Faculty Panel' },
  ] : user?.role === 'department_admin' ? [
    { href: '/dept-admin', icon: '🏛️', label: 'Dept Panel' },
  ] : []

  const bottomItems = [
  { href: '/settings', icon: '⚙️', label: 'Settings' },
  { href: '/profile', icon: '👤', label: 'Profile' },
]

  // Don't show sidebar on public pages
  const publicPages = ['/', '/login', '/register']
  if (publicPages.includes(pathname)) return null
  if (!user) return null

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>

        {/* Logo */}
        <div className="sidebar-logo">
          <Link href="/dashboard" onClick={onClose} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #16a34a, #4ade80)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>🎓</div>
              <div>
                <div className="sidebar-logo-text">UniWeb</div>
                <div className="sidebar-logo-sub">Academic Platform</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Main nav */}
        <nav className="sidebar-nav">

          <div className="sidebar-section-label">Main</div>
          {mainNavItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive(item.href) ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.isNew && <span className="sidebar-item-new">NEW</span>}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="sidebar-item-badge">{item.badge}</span>
              )}
            </Link>
          ))}

          <div className="sidebar-section-label" style={{ marginTop: 8 }}>Academic</div>
          {academicItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive(item.href) ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          {adminItems.length > 0 && (
            <>
              <div className="sidebar-section-label" style={{ marginTop: 8 }}>Administration</div>
              {adminItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-item ${isActive(item.href) ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <span className="sidebar-item-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </>
          )}

          <div className="sidebar-section-label" style={{ marginTop: 8 }}>Account</div>
          {bottomItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive(item.href) ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          {/* Learning streak */}
          <div className="streak-card" style={{ margin: '16px 12px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>🔥</span>
              <span className="streak-days">0</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>day streak</span>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              Keep learning daily!
            </p>
          </div>

        </nav>

        {/* User footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={handleLogout}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: user?.avatarColor || '#16a34a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0,
            }}>
              {getInitials(user?.name || '?')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>
                {getRoleLabel()}
              </div>
            </div>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>↩</span>
          </div>
        </div>

      </aside>
    </>
  )
}