'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthToken } from './utils/auth'

interface Notification {
  _id: string
  type: string
  title: string
  message: string
  link: string
  isRead: boolean
  createdAt: string
}

export default function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const token = getAuthToken()
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

  useEffect(() => {
    loadUnreadCount()
    // Poll every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const loadUnreadCount = async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.count)
      }
    } catch (err) {}
  }

  const loadNotifications = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (err) {}
    finally { setLoading(false) }
  }

  const handleOpen = async () => {
    setOpen(!open)
    if (!open) await loadNotifications()
  }

  const markAsRead = async (id: string, link?: string) => {
    if (!token) return
    try {
      await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
      if (link) { setOpen(false); router.push(link) }
    } catch (err) {}
  }

  const markAllRead = async () => {
    if (!token) return
    try {
      await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {}
  }

  const clearAll = async () => {
    if (!token) return
    try {
      await fetch(`${API_BASE}/api/notifications`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications([])
      setUnreadCount(0)
    } catch (err) {}
  }

  const formatTime = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'live_started': return '📡'
      case 'announcement': return '📢'
      case 'lesson_approved': return '✅'
      case 'lesson_rejected': return '❌'
      case 'quiz_available': return '📝'
      case 'reminder': return '🔔'
      default: return '🔔'
    }
  }

  const getTypeBg = (type: string) => {
    switch (type) {
      case 'live_started': return '#fef2f2'
      case 'announcement': return '#fffbeb'
      case 'lesson_approved': return '#f0fdf4'
      case 'lesson_rejected': return '#fef2f2'
      default: return '#f9fafb'
    }
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        style={{
          width: 36, height: 36, borderRadius: 8,
          background: open ? '#f0fdf4' : '#f9fafb',
          border: open ? '1px solid #bbf7d0' : '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative', fontSize: 18,
          transition: 'all 0.15s',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            background: '#ef4444', color: 'white',
            borderRadius: 999, fontSize: 9, fontWeight: 800,
            padding: '1px 5px', minWidth: 16, textAlign: 'center',
            border: '2px solid white', lineHeight: 1.4,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 44,
          width: 360, background: 'white',
          borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          border: '1px solid #e5e7eb', zIndex: 1000,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid #f3f4f6',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Notifications</h3>
              {unreadCount > 0 && (
                <p style={{ fontSize: 11, color: '#16a34a', margin: '2px 0 0', fontWeight: 600 }}>
                  {unreadCount} unread
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, color: '#16a34a', fontWeight: 600,
                }}>
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, color: '#9ca3af',
                }}>
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Notifications list */}
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🔔</div>
                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No notifications yet</p>
                <p style={{ fontSize: 12, color: '#d1d5db', marginTop: 4 }}>
                  You'll see alerts for live classes, announcements and more
                </p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif._id}
                  onClick={() => markAsRead(notif._id, notif.link)}
                  style={{
                    display: 'flex', gap: 12, padding: '12px 16px',
                    borderBottom: '1px solid #f9fafb',
                    background: notif.isRead ? 'white' : '#fafff9',
                    cursor: notif.link ? 'pointer' : 'default',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: getTypeBg(notif.type),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {getTypeIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: notif.isRead ? 500 : 700,
                      color: '#1f2937', marginBottom: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4, marginBottom: 4 }}>
                      {notif.message.length > 60 ? notif.message.slice(0, 60) + '...' : notif.message}
                    </div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>
                      {formatTime(notif.createdAt)}
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!notif.isRead && (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#16a34a', flexShrink: 0, marginTop: 4,
                    }} />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '10px 16px', borderTop: '1px solid #f3f4f6',
              textAlign: 'center',
            }}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, color: '#16a34a', fontWeight: 600,
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}