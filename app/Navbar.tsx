'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getAuthToken, removeAuthToken } from './utils/auth'

interface User {
  name: string
  role: string
  faculty: string
  department: string
  level: string
  avatarColor?: string
}

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const token = getAuthToken()
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch('http://localhost:5001/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [pathname])

  const handleLogout = () => {
    removeAuthToken()
    setUser(null)
    router.push('/login')
  }

  const getAvatarColor = (user: User) => {
    if (user.avatarColor) return user.avatarColor
    if (user.role === 'admin') return '#ef4444'
    if (user.role === 'lecturer') return '#16a34a'
    return '#6b7280'
  }

  return (
    <nav className="navbar">

      {/* Brand */}
      <Link href="/" className="navbar-brand">
        🎓 UniWeb
      </Link>

      {/* Links */}
      <div className="navbar-links">

        {user ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/chat">Chat</Link>
            <Link href="/live">Live</Link>
            <Link href="/announcements">Announcements</Link>
            {user.role === 'admin' && (
              <Link href="/admin">Admin</Link>
            )}
            {user.role === 'faculty_admin' && (
              <Link href="/faculty-admin">My Faculty</Link>
            )}

            {/* User profile indicator — clickable */}
            <Link href="/profile" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                background: '#f0fdf4',
                borderRadius: 8,
                marginLeft: 8,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: getAvatarColor(user),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 13,
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ lineHeight: 1.3 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'capitalize' }}>
                    {user.role}
                    {user.level ? ` • ${user.level}` : ''}
                  </div>
                </div>
              </div>
            </Link>

            <button
              className="btn-danger"
              style={{ padding: '7px 16px', marginLeft: 4 }}
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link href="/register">
              <button className="btn-primary" style={{ padding: '7px 16px' }}>
                Register
              </button>
            </Link>
          </>
        )}

      </div>

    </nav>
  )
}