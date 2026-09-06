'use client'

import { useEffect, useState } from 'react'
import { getAuthToken } from '../utils/auth'
import { SkeletonList } from '../components/Skeleton'

interface Announcement {
  _id: string
  title: string
  content: string
  faculty: string
  department?: string
  level?: string
  link?: string
  priority: 'urgent' | 'important' | 'general'
  author: { _id: string; name: string; role: string; avatarColor?: string }
  createdAt: string
}

interface User {
  _id: string
  role: string
  faculty: string
  department: string
  level: string
  name: string
  avatarColor?: string
}

interface Department {
  _id: string
  name: string
  faculty: string
  maxLevel: number
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'urgent' | 'important' | 'general'>('all')
  const [search, setSearch] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [link, setLink] = useState('')
  const [priority, setPriority] = useState<'urgent' | 'important' | 'general'>('general')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  // Scope for admin
  const [scope, setScope] = useState('all')
  const [scopeFaculty, setScopeFaculty] = useState('')
  const [scopeDepartment, setScopeDepartment] = useState('')
  const [scopeLevel, setScopeLevel] = useState('')
  const [faculties, setFaculties] = useState<string[]>([])
  const [filteredDepts, setFilteredDepts] = useState<Department[]>([])
  const [levels, setLevels] = useState<string[]>([])

  useEffect(() => {
    const token = getAuthToken()
    if (!token) return
    const setup = async () => {
      const userRes = await fetch(`${API_BASE}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const userData = await userRes.json()
      setUser(userData)

      const deptRes = await fetch(`${API_BASE}/api/departments`)
      const deptData = await deptRes.json()
      setDepartments(deptData)
      const uniqueFaculties = [...new Set(deptData.map((d: Department) => d.faculty))] as string[]
      setFaculties(uniqueFaculties)

      await loadAnnouncements(token)
    }
    setup()
  }, [])

  useEffect(() => {
    if (!scopeFaculty) {
      setFilteredDepts([])
      setScopeDepartment('')
      setLevels([])
      setScopeLevel('')
      return
    }
    const filtered = departments.filter(d => d.faculty === scopeFaculty)
    setFilteredDepts(filtered)
    setScopeDepartment('')
    setLevels([])
    setScopeLevel('')
  }, [scopeFaculty, departments])

  useEffect(() => {
    if (!scopeDepartment) { setLevels([]); setScopeLevel(''); return }
    const dept = departments.find(d => d.name === scopeDepartment && d.faculty === scopeFaculty)
    if (!dept) return
    const lvls: string[] = []
    for (let l = 100; l <= dept.maxLevel; l += 100) lvls.push(`${l}L`)
    setLevels(lvls)
    setScopeLevel('')
  }, [scopeDepartment, departments, scopeFaculty])

  const loadAnnouncements = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setAnnouncements(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getScopeValues = () => {
    if (!user) return { faculty: '', department: '', level: '' }
    if (user.role === 'admin') {
      if (scope === 'all') return { faculty: 'All', department: '', level: '' }
      if (scope === 'faculty') return { faculty: scopeFaculty, department: '', level: '' }
      if (scope === 'department') return { faculty: scopeFaculty, department: scopeDepartment, level: '' }
      if (scope === 'level') return { faculty: scopeFaculty, department: scopeDepartment, level: scopeLevel }
    }
    return { faculty: user.faculty, department: '', level: '' }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    const token = getAuthToken()
    if (!token) return
    const { faculty, department, level } = getScopeValues()
    try {
      const res = await fetch(`${API_BASE}/api/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, content, faculty, department, level, link, priority }),
      })
      if (res.ok) {
        setMessage('Announcement posted!')
        setTitle('')
        setContent('')
        setLink('')
        setPriority('general')
        setScope('all')
        setScopeFaculty('')
        setScopeDepartment('')
        setScopeLevel('')
        setShowForm(false)
        await loadAnnouncements(token)
      } else {
        const data = await res.json()
        setMessage(data.message || 'Failed')
      }
    } catch (err) {
      setMessage('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, announcementTitle: string) => {
    if (!confirm(`Delete "${announcementTitle}"? This cannot be undone.`)) return
    const token = getAuthToken()
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/api/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        await loadAnnouncements(token)
      } else {
        const data = await res.json()
        alert(data.message || 'Failed to delete')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const canDelete = (ann: Announcement) => {
    if (!user) return false
    if (user.role === 'admin') return true
    if (user.role === 'faculty_admin' && ann.faculty === user.faculty) {
      return ann.author?.role !== 'admin'
    }
    return false
  }

  const canPost = user?.role === 'admin' || user?.role === 'faculty_admin' || user?.role === 'lecturer'

  const formatDate = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getInitials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const priorityConfig = {
    urgent: { label: 'Urgent', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '🚨' },
    important: { label: 'Important', color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '⚠️' },
    general: { label: 'General', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '📢' },
  }

  const filtered = announcements.filter(ann => {
  if (filter !== 'all' && ann.priority !== filter) return false
  if (search && !ann.title.toLowerCase().includes(search.toLowerCase()) &&
    !ann.content?.toLowerCase().includes(search.toLowerCase())) return false
  return true
})

if (loading) return (
  <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
    <SkeletonList count={5} />
  </div>
)

return (
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>

      {/* ===== HERO HEADER ===== */}
      <div style={{
        background: 'linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%)',
        padding: '40px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -80, top: -80, width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(34,197,94,0.15)' }} />
        <div style={{ position: 'absolute', right: -40, top: -40, width: 220, height: 220, borderRadius: '50%', border: '1px solid rgba(34,197,94,0.1)' }} />

        <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: 999, padding: '3px 12px', marginBottom: 8,
              }}>
                <span style={{ color: '#86efac', fontSize: 12, fontWeight: 600 }}>📢 Notice Board</span>
              </div>
              <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
                Announcements
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                {announcements.length} announcement{announcements.length !== 1 ? 's' : ''} • Stay informed
              </p>
            </div>

            {canPost && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="btn-primary"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 10,
                }}
              >
                {showForm ? '✕ Cancel' : '+ New Announcement'}
              </button>
            )}
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap',
          }}>
            {[
              { label: 'All', value: announcements.length, key: 'all', color: '#60a5fa' },
              { label: '🚨 Urgent', value: announcements.filter(a => a.priority === 'urgent').length, key: 'urgent', color: '#f87171' },
              { label: '⚠️ Important', value: announcements.filter(a => a.priority === 'important').length, key: 'important', color: '#fbbf24' },
              { label: '📢 General', value: announcements.filter(a => a.priority === 'general').length, key: 'general', color: '#34d399' },
            ].map(stat => (
              <div
                key={stat.key}
                onClick={() => setFilter(stat.key as any)}
                style={{
                  background: filter === stat.key ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(8px)',
                  border: filter === stat.key ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10, padding: '10px 16px',
                  cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* ===== MAIN CONTENT ===== */}
      <div style={{ maxWidth: 960, margin: '-40px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>

        {/* Create form */}
        {showForm && (
          <div style={{
            background: 'white', borderRadius: 16, marginBottom: 24,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #15803d, #16a34a)',
              padding: '16px 24px',
            }}>
              <h2 style={{ color: 'white', fontSize: 16, margin: 0 }}>📢 Post Announcement</h2>
            </div>
            <div style={{ padding: 24 }}>
              <form onSubmit={handleCreate}>

                {/* Priority selector */}
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
                  Priority Level
                </label>
                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  {(['general', 'important', 'urgent'] as const).map(p => {
                    const cfg = priorityConfig[p]
                    return (
                      <div
                        key={p}
                        onClick={() => setPriority(p)}
                        style={{
                          flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
                          border: priority === p ? `2px solid ${cfg.color}` : '2px solid #e5e7eb',
                          background: priority === p ? cfg.bg : 'white',
                          textAlign: 'center', transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ fontSize: 20, marginBottom: 2 }}>{cfg.icon}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: priority === p ? cfg.color : '#6b7280' }}>
                          {cfg.label}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <label>Title</label>
                <input
                  type="text"
                  placeholder="Announcement title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />

                <label>Content</label>
                <textarea
                  placeholder="Write your announcement here..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: '1.5px solid #e5e7eb', borderRadius: 8,
                    fontSize: 14, marginTop: 4, resize: 'vertical',
                    fontFamily: 'inherit', outline: 'none',
                  }}
                />

                {/* Scope — admin only */}
                {user?.role === 'admin' && (
                  <div style={{ marginTop: 8 }}>
                    <label>Who should see this?</label>
                    <select value={scope} onChange={e => { setScope(e.target.value); setScopeFaculty(''); setScopeDepartment(''); setScopeLevel('') }}>
                      <option value="all">Everyone (all faculties)</option>
                      <option value="faculty">Specific Faculty</option>
                      <option value="department">Specific Department</option>
                      <option value="level">Specific Level</option>
                    </select>

                    {(scope === 'faculty' || scope === 'department' || scope === 'level') && (
                      <div>
                        <label>Faculty</label>
                        <select value={scopeFaculty} onChange={e => setScopeFaculty(e.target.value)} required>
                          <option value="">Select faculty...</option>
                          {faculties.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                    )}

                    {(scope === 'department' || scope === 'level') && scopeFaculty && (
                      <div>
                        <label>Department</label>
                        <select value={scopeDepartment} onChange={e => setScopeDepartment(e.target.value)} required>
                          <option value="">Select department...</option>
                          {filteredDepts.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                        </select>
                      </div>
                    )}

                    {scope === 'level' && scopeDepartment && (
                      <div>
                        <label>Level</label>
                        <select value={scopeLevel} onChange={e => setScopeLevel(e.target.value)} required>
                          <option value="">Select level...</option>
                          {levels.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Faculty admin — auto-scoped */}
                {(user?.role === 'faculty_admin' || user?.role === 'lecturer') && (
                  <div style={{
                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                    borderRadius: 8, padding: '10px 14px', marginTop: 12,
                    fontSize: 13, color: '#15803d',
                  }}>
                    📍 This announcement will be posted to: <strong>{user?.faculty}</strong>
                  </div>
                )}

                <label>Link (optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={link}
                  onChange={e => setLink(e.target.value)}
                />

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{ marginTop: 20, width: '100%' }}
                >
                  {submitting ? 'Posting...' : '📢 Post Announcement'}
                </button>

              </form>

              {message && (
                <div
                  className={message.includes('posted') ? 'alert alert-success' : 'alert alert-error'}
                  style={{ marginTop: 12 }}
                >
                  {message}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search bar */}
        <div style={{
          background: 'white', borderRadius: 12, padding: '12px 16px',
          marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input
            type="text"
            placeholder="Search announcements..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 14, color: '#374151', background: 'transparent',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ color: '#9ca3af' }}>Loading announcements...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 24px',
            background: 'white', borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📢</div>
            <h3 style={{ marginBottom: 8 }}>
              {search ? 'No results found' : 'No announcements yet'}
            </h3>
            <p style={{ color: '#4b5563', fontSize: 14 }}>
              {search ? `No announcements match "${search}"` : 'Check back later for updates'}
            </p>
          </div>
        )}

        {/* Announcements list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(ann => {
            const cfg = priorityConfig[ann.priority || 'general']
            return (
              <div
                key={ann._id}
                style={{
                  background: 'white', borderRadius: 16,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  overflow: 'hidden',
                  borderLeft: `4px solid ${cfg.color}`,
                }}
              >
                {/* Card header */}
                <div style={{ padding: '16px 20px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1 }}>
                      {/* Author avatar */}
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: ann.author?.avatarColor || '#16a34a',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0,
                      }}>
                        {getInitials(ann.author?.name || '?')}
                      </div>

                      <div style={{ flex: 1 }}>
                        {/* Priority + time row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{
                            background: cfg.bg, color: cfg.color,
                            border: `1px solid ${cfg.border}`,
                            padding: '2px 10px', borderRadius: 999,
                            fontSize: 11, fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}>
                            {cfg.icon} {cfg.label}
                          </span>
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>
                            by <strong>{ann.author?.name}</strong>
                          </span>
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>•</span>
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>
                            {formatDate(ann.createdAt)}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>
                          {ann.title}
                        </h3>

                        {/* Content */}
                        <p style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.6 }}>
                          {ann.content}
                        </p>

                        {/* Link */}
                        {ann.link && (
                          <a
                            href={ann.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              marginTop: 10, fontSize: 13, color: '#16a34a',
                              background: '#f0fdf4', border: '1px solid #bbf7d0',
                              borderRadius: 6, padding: '4px 10px',
                              textDecoration: 'none',
                            }}
                          >
                            🔗 {ann.link}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    {canDelete(ann) && (
                      <button
                        onClick={() => handleDelete(ann._id, ann.title)}
                        style={{
                          background: '#fef2f2', border: '1px solid #fecaca',
                          color: '#ef4444', borderRadius: 8,
                          padding: '6px 12px', cursor: 'pointer',
                          fontSize: 12, fontWeight: 600, flexShrink: 0,
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Card footer — scope badges */}
                <div style={{
                  padding: '10px 20px',
                  background: '#fafafa',
                  borderTop: '1px solid #f3f4f6',
                  display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 11, color: '#9ca3af', marginRight: 4 }}>Visible to:</span>
                  <span style={{
                    background: '#f0fdf4', color: '#15803d',
                    padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                  }}>
                    {ann.faculty === 'All' ? '🌍 Everyone' : `📍 ${ann.faculty}`}
                  </span>
                  {ann.department && (
                    <span style={{
                      background: '#f3f4f6', color: '#4b5563',
                      padding: '2px 8px', borderRadius: 999, fontSize: 11,
                    }}>
                      {ann.department}
                    </span>
                  )}
                  {ann.level && (
                    <span style={{
                      background: '#f3f4f6', color: '#4b5563',
                      padding: '2px 8px', borderRadius: 999, fontSize: 11,
                    }}>
                      {ann.level}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}