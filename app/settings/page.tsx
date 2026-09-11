'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthToken, removeAuthToken } from '../utils/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

const AVATAR_COLORS = [
  '#16a34a', '#2563eb', '#7c3aed', '#dc2626',
  '#d97706', '#0891b2', '#be185d', '#059669',
  '#4338ca', '#b45309', '#0f172a', '#374151',
]

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'password' | 'account' | 'appearance'>('profile')
  const [darkMode, setDarkMode] = useState(false)

  // Profile
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarColor, setAvatarColor] = useState('#16a34a')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')

  // Notifications
  const [notifLive, setNotifLive] = useState(true)
  const [notifAnnouncement, setNotifAnnouncement] = useState(true)
  const [notifLesson, setNotifLesson] = useState(true)
  const [notifQuiz, setNotifQuiz] = useState(true)
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifMessage, setNotifMessage] = useState('')

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)

  const token = getAuthToken()

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) { removeAuthToken(); router.push('/login'); return }
        const data = await res.json()
        setUser(data)
        setName(data.name || '')
        setEmail(data.email || '')
        setAvatarColor(data.avatarColor || '#16a34a')
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getInitials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const getRoleLabel = () => {
    if (user?.role === 'admin') return '⚙️ Super Admin'
    if (user?.role === 'faculty_admin') return '🛡️ Faculty Admin'
    if (user?.role === 'department_admin') return '🏛️ Department Admin'
    if (user?.role === 'lecturer') return '👨‍🏫 Lecturer'
    return `🎓 Student • ${user?.level}`
  }

  const saveProfile = async () => {
    setProfileSaving(true)
    setProfileMessage('')
    try {
      const res = await fetch(`${API_BASE}/api/users/me/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, avatarColor }),
      })
      if (res.ok) {
        setProfileMessage('Profile updated successfully!')
        const data = await res.json()
        setUser(data)
      } else {
        const data = await res.json()
        setProfileMessage(data.message || 'Failed to update profile')
      }
    } catch (err) {
      setProfileMessage('Something went wrong')
    } finally {
      setProfileSaving(false)
    }
  }

  const saveNotifications = async () => {
    setNotifSaving(true)
    setNotifMessage('')
    try {
      const res = await fetch(`${API_BASE}/api/users/me/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          notifLive, notifAnnouncement, notifLesson, notifQuiz,
        }),
      })
      if (res.ok) {
        setNotifMessage('Notification preferences saved!')
      } else {
        setNotifMessage('Failed to save preferences')
      }
    } catch (err) {
      setNotifMessage('Something went wrong')
    } finally {
      setNotifSaving(false)
    }
  }

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMessage('New passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setPasswordMessage('Password must be at least 6 characters')
      return
    }
    setPasswordSaving(true)
    setPasswordMessage('')
    try {
      const res = await fetch(`${API_BASE}/api/users/me/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setPasswordMessage('Password changed successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordMessage(data.message || 'Failed to change password')
      }
    } catch (err) {
      setPasswordMessage('Something went wrong')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleLogout = () => {
    removeAuthToken()
    router.push('/login')
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚙️</div>
        <p style={{ color: '#4b5563' }}>Loading settings...</p>
      </div>
    </div>
  )

  return (
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #052e16, #16a34a)',
        padding: '32px 24px 80px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -60, top: -60, width: 240, height: 240, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} />
        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
            ⚙️ Settings
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            Manage your account, preferences and security
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '-48px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>

        {/* Profile card */}
        <div style={{
          background: 'white', borderRadius: 16, padding: '20px 24px',
          marginBottom: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: avatarColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 22, fontWeight: 800, flexShrink: 0,
          }}>
            {getInitials(user?.name || '?')}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1f2937' }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{user?.email}</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 999, padding: '2px 10px', marginTop: 4,
              fontSize: 12, color: '#16a34a', fontWeight: 600,
            }}>
              {getRoleLabel()}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#dc2626', borderRadius: 8, padding: '8px 16px',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            🚪 Logout
          </button>
        </div>

        {/* Tabs + Content */}
        <div style={{
          background: 'white', borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}>

          {/* Tabs */}
          <div style={{
            borderBottom: '1px solid #f3f4f6',
            display: 'flex', overflowX: 'auto',
          }}>
            {[
              { key: 'profile', label: '👤 Profile' },
              { key: 'notifications', label: '🔔 Notifications' },
              { key: 'appearance', label: '🎨 Appearance' },
              { key: 'password', label: '🔑 Password' },
              { key: 'account', label: '📋 Account Info' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: '14px 20px', border: 'none', background: 'transparent',
                  borderBottom: activeTab === tab.key ? '2px solid #16a34a' : '2px solid transparent',
                  color: activeTab === tab.key ? '#16a34a' : '#6b7280',
                  fontWeight: activeTab === tab.key ? 700 : 400,
                  fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 28 }}>

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Profile Settings</h2>

                <label>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                />

                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  style={{ background: '#f9fafb', color: '#9ca3af', cursor: 'not-allowed' }}
                />
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: -8, marginBottom: 16 }}>
                  Email cannot be changed. Contact an admin if needed.
                </p>

                {/* Avatar color picker */}
                <label>Avatar Color</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                  {AVATAR_COLORS.map(color => (
                    <div
                      key={color}
                      onClick={() => setAvatarColor(color)}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: color, cursor: 'pointer',
                        border: avatarColor === color ? '3px solid #1f2937' : '3px solid transparent',
                        boxShadow: avatarColor === color ? '0 0 0 2px white, 0 0 0 4px #1f2937' : 'none',
                        transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 14, fontWeight: 700,
                      }}
                    >
                      {avatarColor === color && '✓'}
                    </div>
                  ))}
                </div>

                {/* Preview */}
                <div style={{
                  background: '#f9fafb', borderRadius: 12, padding: '16px 20px',
                  marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14,
                  border: '1px solid #f3f4f6',
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: avatarColor, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 18, fontWeight: 800,
                  }}>
                    {getInitials(name || user?.name || '?')}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1f2937' }}>{name || user?.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{user?.email}</div>
                  </div>
                  <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 'auto' }}>Preview</span>
                </div>

                {profileMessage && (
                  <div className={profileMessage.includes('success') ? 'alert alert-success' : 'alert alert-error'} style={{ marginBottom: 16 }}>
                    {profileMessage}
                  </div>
                )}

                <button
                  onClick={saveProfile}
                  disabled={profileSaving}
                  className="btn-primary"
                  style={{ minWidth: 140 }}
                >
                  {profileSaving ? 'Saving...' : '✓ Save Profile'}
                </button>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Notification Preferences</h2>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
                  Choose what notifications you want to receive in your bell.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    {
                      key: 'live',
                      icon: '📡',
                      label: 'Live Classes',
                      desc: 'Get notified when a live session starts in your faculty',
                      value: notifLive,
                      setValue: setNotifLive,
                      color: '#2563eb',
                    },
                    {
                      key: 'announcement',
                      icon: '📢',
                      label: 'Announcements',
                      desc: 'Get notified when a new announcement is posted',
                      value: notifAnnouncement,
                      setValue: setNotifAnnouncement,
                      color: '#d97706',
                    },
                    {
                      key: 'lesson',
                      icon: '📚',
                      label: 'New Lessons',
                      desc: 'Get notified when a new lesson is published in your courses',
                      value: notifLesson,
                      setValue: setNotifLesson,
                      color: '#16a34a',
                    },
                    {
                      key: 'quiz',
                      icon: '✅',
                      label: 'Quiz Available',
                      desc: 'Get notified when a quiz is available for a lesson',
                      value: notifQuiz,
                      setValue: setNotifQuiz,
                      color: '#7c3aed',
                    },
                  ].map((notif, i) => (
                    <div
                      key={notif.key}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 16,
                        padding: '16px 0',
                        borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none',
                      }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: notif.value ? notif.color + '15' : '#f3f4f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, flexShrink: 0, transition: 'all 0.2s',
                      }}>
                        {notif.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', marginBottom: 2 }}>
                          {notif.label}
                        </div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>
                          {notif.desc}
                        </div>
                      </div>
                      {/* Toggle switch */}
                      <div
                        onClick={() => notif.setValue(!notif.value)}
                        style={{
                          width: 48, height: 26, borderRadius: 999,
                          background: notif.value ? notif.color : '#e5e7eb',
                          cursor: 'pointer', position: 'relative',
                          transition: 'background 0.2s', flexShrink: 0,
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: 3,
                          left: notif.value ? 25 : 3,
                          width: 20, height: 20, borderRadius: '50%',
                          background: 'white',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                          transition: 'left 0.2s',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                {notifMessage && (
                  <div className={notifMessage.includes('saved') ? 'alert alert-success' : 'alert alert-error'} style={{ margin: '16px 0' }}>
                    {notifMessage}
                  </div>
                )}

                <button
                  onClick={saveNotifications}
                  disabled={notifSaving}
                  className="btn-primary"
                  style={{ marginTop: 20, minWidth: 140 }}
                >
                  {notifSaving ? 'Saving...' : '✓ Save Preferences'}
                </button>
              </div>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Appearance</h2>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
                  Customise how UniWeb looks for you.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      🌙
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', marginBottom: 2 }}>Dark Mode</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>Easier on the eyes at night</div>
                    </div>
                  </div>
                  <div
                    onClick={() => {
                      const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
                      document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark')
                      localStorage.setItem('uniweb-theme', isDark ? 'light' : 'dark')
                      setDarkMode(!isDark)
                    }}
                    style={{
                      width: 48, height: 26, borderRadius: 999,
                      background: darkMode ? '#16a34a' : '#e5e7eb',
                      cursor: 'pointer', position: 'relative',
                      transition: 'background 0.2s', flexShrink: 0,
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 3,
                      left: darkMode ? 25 : 3,
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'white',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                      transition: 'left 0.2s',
                    }} />
                  </div>
                </div>
              </div>
            )}

            {/* PASSWORD TAB */}
            {activeTab === 'password' && (
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Change Password</h2>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
                  Choose a strong password of at least 6 characters.
                </p>

                <label>Current Password</label>
                <div style={{ position: 'relative', marginBottom: 16 }}>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    onClick={() => setShowPasswords(!showPasswords)}
                    style={{
                      position: 'absolute', right: 12, top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', fontSize: 16,
                      color: '#9ca3af',
                    }}
                  >
                    {showPasswords ? '🙈' : '👁️'}
                  </button>
                </div>

                <label>New Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />

                <label>Confirm New Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />

                {/* Password strength */}
                {newPassword && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Password strength:</div>
                    <div style={{ height: 4, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 999, transition: 'width 0.3s',
                        width: newPassword.length < 6 ? '25%' : newPassword.length < 10 ? '50%' : newPassword.length < 14 ? '75%' : '100%',
                        background: newPassword.length < 6 ? '#ef4444' : newPassword.length < 10 ? '#d97706' : newPassword.length < 14 ? '#16a34a' : '#15803d',
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: newPassword.length < 6 ? '#ef4444' : newPassword.length < 10 ? '#d97706' : '#16a34a', marginTop: 4 }}>
                      {newPassword.length < 6 ? 'Too short' : newPassword.length < 10 ? 'Fair' : newPassword.length < 14 ? 'Good' : 'Strong'}
                    </div>
                  </div>
                )}

                {/* Match indicator */}
                {confirmPassword && (
                  <div style={{
                    fontSize: 12, marginBottom: 16,
                    color: newPassword === confirmPassword ? '#16a34a' : '#ef4444',
                    fontWeight: 600,
                  }}>
                    {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}

                {passwordMessage && (
                  <div className={passwordMessage.includes('success') ? 'alert alert-success' : 'alert alert-error'} style={{ marginBottom: 16 }}>
                    {passwordMessage}
                  </div>
                )}

                <button
                  onClick={changePassword}
                  disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                  className="btn-primary"
                  style={{ minWidth: 160 }}
                >
                  {passwordSaving ? 'Changing...' : '🔑 Change Password'}
                </button>
              </div>
            )}

            {/* ACCOUNT INFO TAB */}
            {activeTab === 'account' && (
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Account Information</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { label: 'Full Name', value: user?.name, icon: '👤' },
                    { label: 'Email', value: user?.email, icon: '📧' },
                    { label: 'Role', value: getRoleLabel(), icon: '🎭' },
                    { label: 'Faculty', value: user?.faculty || '—', icon: '🏛️' },
                    { label: 'Department', value: user?.department || '—', icon: '📚' },
                    { label: 'Level', value: user?.level || '—', icon: '🎓' },
                    { label: 'Registration Number', value: user?.regNumber || '—', icon: '🆔' },
                    { label: 'Can Host Live', value: user?.canHostLive ? '✅ Yes' : '❌ No', icon: '📡' },
                  ].map((item, i) => (
                    <div key={item.label} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 0',
                      borderBottom: i < 7 ? '1px solid #f3f4f6' : 'none',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: '#f3f4f6', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, flexShrink: 0,
                      }}>
                        {item.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                          {item.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Danger zone */}
                <div style={{
                  marginTop: 32, background: '#fef2f2',
                  border: '1px solid #fecaca', borderRadius: 12, padding: '20px 24px',
                }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>
                    ⚠️ Danger Zone
                  </h3>
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14, lineHeight: 1.5 }}>
                    Logging out will end your current session. You can log back in anytime.
                  </p>
                  <button
                    onClick={handleLogout}
                    style={{
                      background: '#dc2626', color: 'white',
                      border: 'none', borderRadius: 8,
                      padding: '10px 20px', cursor: 'pointer',
                      fontWeight: 700, fontSize: 13,
                    }}
                  >
                    🚪 Logout of UniWeb
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