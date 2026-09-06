'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthToken, removeAuthToken } from '../utils/auth'

interface User {
  _id: string
  name: string
  email: string
  role: string
  faculty: string
  department: string
  level: string | null
  avatarColor: string
  canHostLive: boolean
  regNumber: string | null
  staffId: string | null
  dateOfBirth: string | null
  phone: string | null
  firstLogin: boolean
  graduated: boolean
}

const AVATAR_COLORS = [
  '#16a34a', '#2563eb', '#7c3aed', '#dc2626',
  '#d97706', '#0891b2', '#be185d', '#065f46',
  '#1e40af', '#6d28d9', '#b91c1c', '#b45309',
]

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  // Edit fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [regNumber, setRegNumber] = useState('')
  const [staffId, setStaffId] = useState('')
  const [avatarColor, setAvatarColor] = useState('#16a34a')

  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const token = getAuthToken()

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) { removeAuthToken(); router.push('/login'); return }
        const data = await res.json()
        setUser(data)
        setName(data.name || '')
        setEmail(data.email || '')
        setPhone(data.phone || '')
        setDateOfBirth(data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '')
        setRegNumber(data.regNumber || '')
        setStaffId(data.staffId || '')
        setAvatarColor(data.avatarColor || '#16a34a')
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name, email, avatarColor, phone,
          dateOfBirth: dateOfBirth || undefined,
          regNumber: user?.role === 'student' ? regNumber || undefined : undefined,
          staffId: (user?.role === 'lecturer' || user?.role === 'faculty_admin' || user?.role === 'department_admin') ? staffId || undefined : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setUser(prev => prev ? { ...prev, name, email, avatarColor, phone, dateOfBirth, regNumber, staffId } : null)
        setMessage('Profile updated successfully!')
        setMessageType('success')
        setEditing(false)
      } else {
        setMessage(data.message || 'Failed to update profile')
        setMessageType('error')
      }
    } catch (err) {
      setMessage('Something went wrong')
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmNewPassword) {
      setMessage('New passwords do not match')
      setMessageType('error')
      return
    }
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters')
      setMessageType('error')
      return
    }
    setChangingPassword(true)
    setMessage('')
    try {
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage('Password changed successfully!')
        setMessageType('success')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmNewPassword('')
      } else {
        setMessage(data.message || 'Failed to change password')
        setMessageType('error')
      }
    } catch (err) {
      setMessage('Something went wrong')
      setMessageType('error')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleLogout = () => {
    removeAuthToken()
    router.push('/login')
  }

  const getInitials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const getRoleLabel = () => {
    if (user?.role === 'admin') return 'Super Administrator'
    if (user?.role === 'faculty_admin') return 'Faculty Administrator'
    if (user?.role === 'department_admin') return 'Department Administrator'
    if (user?.role === 'lecturer') return 'Lecturer'
    return `Student • ${user?.level}`
  }

  const getRoleColor = () => {
    if (user?.role === 'admin') return '#dc2626'
    if (user?.role === 'faculty_admin') return '#7c3aed'
    if (user?.role === 'department_admin') return '#2563eb'
    if (user?.role === 'lecturer') return '#2563eb'
    return '#16a34a'
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  const tabStyle = (tab: string): React.CSSProperties => ({
    padding: '10px 20px', cursor: 'pointer', border: 'none',
    borderBottom: activeTab === tab ? '2px solid #16a34a' : '2px solid transparent',
    background: 'transparent',
    color: activeTab === tab ? '#16a34a' : '#6b7280',
    fontWeight: activeTab === tab ? 700 : 400,
    fontSize: 14,
  })

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
        <p style={{ color: '#4b5563' }}>Loading profile...</p>
      </div>
    </div>
  )

  return (
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%)',
        padding: '40px 24px 80px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -80, top: -80, width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(34,197,94,0.15)' }} />

        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>

            {/* Avatar */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: user?.avatarColor || '#16a34a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: 28,
              border: '4px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              flexShrink: 0,
            }}>
              {getInitials(user?.name || '?')}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: getRoleColor() + '30',
                border: `1px solid ${getRoleColor()}50`,
                borderRadius: 999, padding: '3px 12px', marginBottom: 6,
                fontSize: 11, fontWeight: 700, color: 'white',
              }}>
                {getRoleLabel()}
              </div>
              <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, marginBottom: 3 }}>
                {user?.name}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                {user?.email} • {user?.department} • {user?.faculty}
              </p>
            </div>

            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: 'white', borderRadius: 8, padding: '8px 16px',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 760, margin: '-40px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>

        <div style={{
          background: 'white', borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden',
        }}>

          {/* Tabs */}
          <div style={{ borderBottom: '1px solid #f3f4f6', display: 'flex', padding: '0 8px' }}>
            <button style={tabStyle('profile')} onClick={() => { setActiveTab('profile'); setMessage('') }}>
              👤 Profile
            </button>
            <button style={tabStyle('security')} onClick={() => { setActiveTab('security'); setMessage('') }}>
              🔒 Security
            </button>
            <button style={tabStyle('preferences')} onClick={() => { setActiveTab('preferences'); setMessage('') }}>
              🎨 Preferences
            </button>
          </div>

          <div style={{ padding: 28 }}>

            {/* ===== PROFILE TAB ===== */}
            {activeTab === 'profile' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700 }}>Personal Information</h2>
                  <button
                    onClick={() => { setEditing(!editing); setMessage('') }}
                    style={{
                      background: editing ? '#f3f4f6' : '#f0fdf4',
                      border: editing ? '1px solid #e5e7eb' : '1px solid #bbf7d0',
                      color: editing ? '#374151' : '#16a34a',
                      borderRadius: 8, padding: '8px 16px',
                      cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    }}
                  >
                    {editing ? 'Cancel' : '✏️ Edit Profile'}
                  </button>
                </div>

                {message && (
                  <div
                    className={messageType === 'success' ? 'alert alert-success' : 'alert alert-error'}
                    style={{ marginBottom: 20 }}
                  >
                    {message}
                  </div>
                )}

                {editing ? (
                  <form onSubmit={handleSaveProfile}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label>Full Name</label>
                        <input
                          type="text" value={name}
                          onChange={e => setName(e.target.value)} required
                        />
                      </div>
                      <div>
                        <label>Email Address</label>
                        <input
                          type="email" value={email}
                          onChange={e => setEmail(e.target.value)} required
                        />
                      </div>
                      <div>
                        <label>Phone Number</label>
                        <input
                          type="tel" placeholder="+234 801 234 5678"
                          value={phone} onChange={e => setPhone(e.target.value)}
                        />
                      </div>
                      <div>
                        <label>Date of Birth</label>
                        <input
                          type="date" value={dateOfBirth}
                          onChange={e => setDateOfBirth(e.target.value)}
                        />
                      </div>
                      {user?.role === 'student' && (
                        <div>
                          <label>Registration Number</label>
                          <input
                            type="text" placeholder="e.g. PSC/2022/001"
                            value={regNumber} onChange={e => setRegNumber(e.target.value)}
                          />
                        </div>
                      )}
                      {(user?.role === 'lecturer' || user?.role === 'faculty_admin' || user?.role === 'department_admin') && (
                        <div>
                          <label>Staff ID</label>
                          <input
                            type="text" placeholder="e.g. STAFF/2020/042"
                            value={staffId} onChange={e => setStaffId(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                      <button type="button" onClick={() => setEditing(false)} className="btn-outline" style={{ flex: 1 }}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 2 }}>
                        {saving ? 'Saving...' : '✓ Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    {/* Profile info grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                      {[
                        { label: 'Full Name', value: user?.name, icon: '👤' },
                        { label: 'Email Address', value: user?.email, icon: '📧' },
                        { label: 'Phone Number', value: user?.phone || '—', icon: '📱' },
                        { label: 'Date of Birth', value: formatDate(user?.dateOfBirth || null), icon: '🎂' },
                        { label: 'Faculty', value: user?.faculty || '—', icon: '🏛️' },
                        { label: 'Department', value: user?.department || '—', icon: '📚' },
                        ...(user?.role === 'student' ? [
                          { label: 'Level', value: user?.level || '—', icon: '🎓' },
                          { label: 'Reg Number', value: user?.regNumber || '—', icon: '🔢' },
                          { label: 'Status', value: user?.graduated ? 'Graduated' : 'Active', icon: '✅' },
                        ] : []),
                        ...(user?.role === 'lecturer' || user?.role === 'faculty_admin' || user?.role === 'department_admin' ? [
                          { label: 'Staff ID', value: user?.staffId || '—', icon: '🪪' },
                        ] : []),
                        { label: 'Role', value: getRoleLabel(), icon: '🛡️' },
                      ].map((item, i) => (
                        <div key={item.label} style={{
                          padding: '14px 0',
                          borderBottom: '1px solid #f9fafb',
                          display: 'flex', alignItems: 'center', gap: 12,
                          paddingRight: i % 2 === 0 ? 24 : 0,
                          paddingLeft: i % 2 === 1 ? 24 : 0,
                          borderLeft: i % 2 === 1 ? '1px solid #f9fafb' : 'none',
                        }}>
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 2 }}>
                              {item.label.toUpperCase()}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                              {item.value}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Host permission badge */}
                    {user?.role === 'student' && user?.canHostLive && (
                      <div style={{
                        marginTop: 20, background: '#f0fdf4',
                        border: '1px solid #bbf7d0', borderRadius: 10,
                        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <span style={{ fontSize: 20 }}>🎙️</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>
                            Class Representative
                          </div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>
                            You have permission to host live sessions and update the timetable
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ===== SECURITY TAB ===== */}
            {activeTab === 'security' && (
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Change Password</h2>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
                  Make sure your password is strong and unique.
                </p>

                {message && (
                  <div
                    className={messageType === 'success' ? 'alert alert-success' : 'alert alert-error'}
                    style={{ marginBottom: 20 }}
                  >
                    {message}
                  </div>
                )}

                <form onSubmit={handleChangePassword}>
                  <label>Current Password</label>
                  <input
                    type="password" placeholder="Enter your current password"
                    value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required
                  />

                  <label>New Password</label>
                  <input
                    type="password" placeholder="Minimum 6 characters"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                    minLength={6}
                  />

                  <label>Confirm New Password</label>
                  <input
                    type="password" placeholder="Repeat new password"
                    value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required
                  />

                  {confirmNewPassword && newPassword !== confirmNewPassword && (
                    <div className="alert alert-error" style={{ marginTop: 8 }}>
                      Passwords do not match
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={changingPassword}
                    style={{ marginTop: 20 }}
                  >
                    {changingPassword ? 'Changing...' : '🔒 Change Password'}
                  </button>
                </form>

                {/* Danger zone */}
                <div style={{
                  marginTop: 40, padding: 20, border: '1px solid #fecaca',
                  borderRadius: 12, background: '#fef2f2',
                }}>
                  <h3 style={{ fontSize: 15, color: '#dc2626', marginBottom: 6 }}>⚠️ Danger Zone</h3>
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                    Logging out will end your current session on this device.
                  </p>
                  <button
                    onClick={handleLogout}
                    style={{
                      background: '#ef4444', border: 'none', borderRadius: 8,
                      color: 'white', padding: '10px 20px', cursor: 'pointer',
                      fontSize: 13, fontWeight: 700,
                    }}
                  >
                    Logout from UniWeb
                  </button>
                </div>
              </div>
            )}

            {/* ===== PREFERENCES TAB ===== */}
            {activeTab === 'preferences' && (
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Avatar Color</h2>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
                  Choose a color for your profile avatar.
                </p>

                {message && (
                  <div
                    className={messageType === 'success' ? 'alert alert-success' : 'alert alert-error'}
                    style={{ marginBottom: 20 }}
                  >
                    {message}
                  </div>
                )}

                {/* Current avatar preview */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: avatarColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 800, fontSize: 24,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}>
                    {getInitials(user?.name || '?')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1f2937' }}>{user?.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Current avatar preview</div>
                  </div>
                </div>

                {/* Color picker */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
                  {AVATAR_COLORS.map(color => (
                    <div
                      key={color}
                      onClick={() => setAvatarColor(color)}
                      style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: color, cursor: 'pointer',
                        border: avatarColor === color ? '3px solid #1f2937' : '3px solid transparent',
                        boxShadow: avatarColor === color ? '0 0 0 2px white, 0 0 0 4px ' + color : 'none',
                        transition: 'all 0.15s',
                      }}
                    />
                  ))}
                </div>

                <button
                  onClick={async () => {
                    setSaving(true)
                    setMessage('')
                    try {
                      const res = await fetch(`${API_BASE}/api/users/profile`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ avatarColor }),
                      })
                      if (res.ok) {
                        setUser(prev => prev ? { ...prev, avatarColor } : null)
                        setMessage('Avatar color updated!')
                        setMessageType('success')
                      }
                    } catch (err) {
                      setMessage('Failed to update')
                      setMessageType('error')
                    } finally {
                      setSaving(false)
                    }
                  }}
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : '🎨 Save Color'}
                </button>

                {/* Notification preferences */}
                <div style={{ marginTop: 32, borderTop: '1px solid #f3f4f6', paddingTop: 24 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Notifications</h2>
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                    Enable browser notifications to get alerts for live sessions and reminders.
                  </p>
                  <button
                    onClick={async () => {
                      if ('Notification' in window) {
                        const perm = await Notification.requestPermission()
                        if (perm === 'granted') {
                          setMessage('Browser notifications enabled!')
                          setMessageType('success')
                          new Notification('UniWeb', { body: 'Notifications are now enabled! 🎉' })
                        } else {
                          setMessage('Notification permission denied. Please enable in browser settings.')
                          setMessageType('error')
                        }
                      }
                    }}
                    style={{
                      background: '#f0fdf4', border: '1px solid #bbf7d0',
                      color: '#16a34a', borderRadius: 8, padding: '10px 20px',
                      cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    🔔 Enable Browser Notifications
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}