'use client'

import { useEffect, useState } from 'react'
import { getAuthToken } from '../utils/auth'

interface TimetableEntry {
  _id: string
  courseCode: string
  courseTitle: string
  lecturer: string
  day: string
  startTime: string
  endTime: string
  venue: string
  type: string
  color: string
}

interface Timetable {
  _id: string
  faculty: string
  department: string
  level: string
  semester: string
  entries: TimetableEntry[]
  isPublished: boolean
  createdBy: { name: string }
  lastUpdatedBy: { name: string }
  updatedAt: string
}

interface PersonalEvent {
  _id: string
  title: string
  description: string
  type: string
  date: string
  startTime: string
  endTime: string
  reminderMinutes: number
  isRecurring: boolean
  recurringDays: string[]
  color: string
  courseCode: string
  isCompleted: boolean
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const TIMES = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
const TYPES = ['Lecture', 'Lab', 'Tutorial', 'Live', 'Seminar']
const TYPE_COLORS: Record<string, string> = {
  Lecture: '#16a34a', Lab: '#2563eb', Tutorial: '#7c3aed',
  Live: '#dc2626', Seminar: '#d97706',
}
const EVENT_COLORS: Record<string, string> = {
  study: '#16a34a', meeting: '#2563eb', deadline: '#dc2626',
  reminder: '#d97706', class: '#7c3aed', other: '#6b7280',
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export default function TimetablePage() {
  const [mainTab, setMainTab] = useState<'department' | 'personal'>('department')
  const [timetables, setTimetables] = useState<Timetable[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'week' | 'list'>('week')
  const [activeTimetable, setActiveTimetable] = useState<Timetable | null>(null)
  const [activeLevel, setActiveLevel] = useState('')
  const [availableLevels, setAvailableLevels] = useState<string[]>([])

  const [selectedDept, setSelectedDept] = useState('')
  const [selectedDeptLevel, setSelectedDeptLevel] = useState('')
  const [deptsList, setDeptsList] = useState<any[]>([])
  const [deptLevels, setDeptLevels] = useState<string[]>([])
  const [viewingDeptTimetable, setViewingDeptTimetable] = useState<Timetable | null>(null)

  // Timetable creation
  const [showCreate, setShowCreate] = useState(false)
  const [createLevel, setCreateLevel] = useState('')
  const [createSemester, setCreateSemester] = useState('')
  const [creating, setCreating] = useState(false)
  const [createMessage, setCreateMessage] = useState('')

  // Add class entry
  const [showAddEntry, setShowAddEntry] = useState(false)
  const [newEntry, setNewEntry] = useState({
    courseCode: '', courseTitle: '', lecturer: '',
    day: 'Monday', startTime: '08:00', endTime: '10:00',
    venue: '', type: 'Lecture', color: '#16a34a',
  })
  const [addingEntry, setAddingEntry] = useState(false)

  // Personal planner
  const [personalEvents, setPersonalEvents] = useState<PersonalEvent[]>([])
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', type: 'study',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00', endTime: '09:00',
    reminderMinutes: 15, isRecurring: false,
    recurringDays: [] as string[], color: '#16a34a', courseCode: '',
  })
  const [addingEvent, setAddingEvent] = useState(false)

  const token = getAuthToken()

  // Single source of truth for which timetable is on screen right now.
  // Faculty admins browse per-department via the selector below; everyone
  // else sees their own department's timetable for the selected level.
  const displayTimetable = user?.role === 'faculty_admin' ? viewingDeptTimetable : activeTimetable

  useEffect(() => {
    if (!token) return
    const setup = async () => {
      try {
        const userRes = await fetch(`${API_BASE}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const userData = await userRes.json()
        setUser(userData)

        const deptsRes = await fetch(`${API_BASE}/api/departments`)
        const deptsData = await deptsRes.json()

        // For faculty admin — get ALL departments in their faculty
if (userData.role === 'faculty_admin') {
  const facultyDepts = deptsData.filter((d: any) => d.faculty === userData.faculty)
  setDeptsList(facultyDepts)
        }

        const dept = deptsData.find(
          (d: any) => d.name === userData.department && d.faculty === userData.faculty
        )
        if (dept) {
          const lvls: string[] = []
          for (let l = 100; l <= dept.maxLevel; l += 100) lvls.push(`${l}L`)
          setAvailableLevels(lvls)
          setActiveLevel(userData.role === 'student' ? userData.level : lvls[0] || '')
        }

        await loadTimetables()
        await loadPersonalEvents()
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    setup()
  }, [])

  useEffect(() => {
    // Match on department too, not just level — a shared level string
    // ("100L") across departments must never cross-match another dept's row.
    const found = timetables.find(
      t => t.level === activeLevel && t.department === user?.department
    )
    setActiveTimetable(found || null)
  }, [activeLevel, timetables, user])

  // Reminder check every minute
  useEffect(() => {
    const interval = setInterval(checkReminders, 60000)
    return () => clearInterval(interval)
  }, [personalEvents])

  useEffect(() => {
    if (user?.role !== 'faculty_admin' || !selectedDept || !selectedDeptLevel) return
    const loadDeptTimetable = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/timetable?department=${encodeURIComponent(selectedDept)}&level=${selectedDeptLevel}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setViewingDeptTimetable(data[0])
        } else {
          setViewingDeptTimetable(null)
        }
      } catch (err) { console.error(err) }
    }
    loadDeptTimetable()
  }, [selectedDept, selectedDeptLevel])

useEffect(() => {
  if (!selectedDept) {
    setDeptLevels([])
    return
  }
  const dept = deptsList.find(d => d.name === selectedDept)
  if (dept) {
    const lvls: string[] = []
    for (let l = 100; l <= dept.maxLevel; l += 100) lvls.push(`${l}L`)
    setDeptLevels(lvls)
    setSelectedDeptLevel('') // wait for the admin to pick a level
  }
}, [selectedDept, deptsList])

  const loadTimetables = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/timetable`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setTimetables(Array.isArray(data) ? data : [])
    } catch (err) { console.error(err) }
  }

  const loadPersonalEvents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/personal-events`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setPersonalEvents(Array.isArray(data) ? data : [])
    } catch (err) { console.error(err) }
  }

  const checkReminders = () => {
    const now = new Date()
    personalEvents.forEach(event => {
      if (event.isCompleted) return
      const eventDate = new Date(event.date)
      const [h, m] = event.startTime.split(':').map(Number)
      eventDate.setHours(h, m, 0, 0)
      const diffMins = Math.floor((eventDate.getTime() - now.getTime()) / 60000)
      if (diffMins === event.reminderMinutes || diffMins === 0) {
        const msg = diffMins === 0
          ? `⏰ "${event.title}" is starting now!`
          : `⏰ "${event.title}" starts in ${diffMins} minutes`
        setNotifications(prev => [{ id: event._id + Date.now(), message: msg }, ...prev.slice(0, 3)])
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('UniWeb Reminder', { body: msg })
        }
      }
    })
  }

  const handleCreateTimetable = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setCreateMessage('')
    try {
      const res = await fetch(`${API_BASE}/api/timetable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ level: createLevel || activeLevel, semester: createSemester }),
      })
      const data = await res.json()
      if (res.ok) {
        setTimetables(prev => [...prev, data])
        setActiveTimetable(data)
        setShowCreate(false)
        setCreateSemester('')
      } else {
        setCreateMessage(data.message || 'Failed')
      }
    } catch (err) { setCreateMessage('Something went wrong') }
    finally { setCreating(false) }
  }

  // Writes an updated timetable back to whichever state slot is actually
  // being displayed right now, so faculty admins editing another
  // department's timetable update the right piece of state.
  const updateTimetableState = (updated: Timetable) => {
    if (user?.role === 'faculty_admin') {
      setViewingDeptTimetable(updated)
    } else {
      setActiveTimetable(updated)
    }
    setTimetables(prev => prev.map(t => (t._id === updated._id ? updated : t)))
  }

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayTimetable) return
    setAddingEntry(true)
    try {
      const updatedEntries = [
        ...displayTimetable.entries,
        { ...newEntry, color: TYPE_COLORS[newEntry.type] || '#16a34a' },
      ]
      const res = await fetch(`${API_BASE}/api/timetable/${displayTimetable._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ entries: updatedEntries }),
      })
      if (res.ok) {
        const updated = await res.json()
        updateTimetableState(updated)
        setShowAddEntry(false)
        setNewEntry({
          courseCode: '', courseTitle: '', lecturer: '',
          day: 'Monday', startTime: '08:00', endTime: '10:00',
          venue: '', type: 'Lecture', color: '#16a34a',
        })
      }
    } catch (err) { console.error(err) }
    finally { setAddingEntry(false) }
  }

  const handleRemoveEntry = async (entryId: string) => {
    if (!displayTimetable || !confirm('Remove this class?')) return
    try {
      const res = await fetch(
        `${API_BASE}/api/timetable/${displayTimetable._id}/entry/${entryId}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.ok) {
        const updated = await res.json()
        updateTimetableState(updated)
      }
    } catch (err) { console.error(err) }
  }

  const handlePublish = async () => {
    if (!displayTimetable) return
    try {
      const res = await fetch(`${API_BASE}/api/timetable/${displayTimetable._id}/publish`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        updateTimetableState(data.timetable)
      }
    } catch (err) { console.error(err) }
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingEvent(true)
    try {
      const res = await fetch(`${API_BASE}/api/personal-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newEvent),
      })
      if (res.ok) {
        const data = await res.json()
        setPersonalEvents(prev => [...prev, data])
        setShowAddEvent(false)
        setNewEvent({
          title: '', description: '', type: 'study',
          date: new Date().toISOString().split('T')[0],
          startTime: '08:00', endTime: '09:00',
          reminderMinutes: 15, isRecurring: false,
          recurringDays: [], color: '#16a34a', courseCode: '',
        })
      }
    } catch (err) { console.error(err) }
    finally { setAddingEvent(false) }
  }

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return
    await fetch(`${API_BASE}/api/personal-events/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    })
    setPersonalEvents(prev => prev.filter(e => e._id !== id))
  }

  const markComplete = async (id: string) => {
    const res = await fetch(`${API_BASE}/api/personal-events/${id}/complete`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setPersonalEvents(prev => prev.map(e => e._id === id ? { ...e, isCompleted: true } : e))
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) await Notification.requestPermission()
  }

  const canManage = ['department_admin', 'faculty_admin', 'admin'].includes(user?.role) ||
    (user?.role === 'student' && user?.canHostLive)

  const getEntryForSlot = (day: string, time: string, timetable: Timetable | null = activeTimetable) => {
    if (!timetable) return null
    return timetable.entries.find(e =>
      e.day === day && time >= e.startTime && time < e.endTime
    )
  }

  const formatTime = (t: string) => {
    const [h] = t.split(':')
    const hour = parseInt(h)
    return `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:${t.split(':')[1]} ${hour >= 12 ? 'PM' : 'AM'}`
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

  const today = new Date().toISOString().split('T')[0]
  const todayEvents = personalEvents.filter(e => e.date?.split('T')[0] === today && !e.isCompleted)
  const upcomingEvents = personalEvents.filter(e => e.date?.split('T')[0] > today && !e.isCompleted)
  const completedEvents = personalEvents.filter(e => e.isCompleted)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}>
      <p style={{ color: '#6b7280' }}>Loading timetable...</p>
    </div>
  )

  return (
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>

      {/* ===== MODALS — rendered at top level with high z-index ===== */}

      {/* Create timetable modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420 }}>
            <h3 style={{ marginBottom: 20, fontSize: 17 }}>📅 Create Timetable</h3>
            <form onSubmit={handleCreateTimetable}>
              {user?.role !== 'student' && availableLevels.length > 0 && (
                <>
                  <label>Level</label>
                  <select value={createLevel || activeLevel} onChange={e => setCreateLevel(e.target.value)} required>
                    <option value="">Select level...</option>
                    {availableLevels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </>
              )}
              <label>Semester</label>
              <input
                type="text" placeholder="e.g. 2025/2026 - Semester 1"
                value={createSemester} onChange={e => setCreateSemester(e.target.value)} required
              />
              {createMessage && (
                <div className="alert alert-error" style={{ marginTop: 8 }}>{createMessage}</div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={creating} style={{ flex: 2 }}>
                  {creating ? 'Creating...' : 'Create Timetable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add class entry modal */}
      {showAddEntry && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 28,
            width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h3 style={{ marginBottom: 20, fontSize: 17 }}>+ Add Class to Timetable</h3>
            <form onSubmit={handleAddEntry}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label>Course Code *</label>
                  <input
                    type="text" placeholder="e.g. CSC201"
                    value={newEntry.courseCode}
                    onChange={e => setNewEntry({ ...newEntry, courseCode: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div>
                  <label>Class Type *</label>
                  <select
                    value={newEntry.type}
                    onChange={e => setNewEntry({
                      ...newEntry, type: e.target.value,
                      color: TYPE_COLORS[e.target.value] || '#16a34a',
                    })}
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <label>Course Title *</label>
              <input
                type="text" placeholder="e.g. Data Structures"
                value={newEntry.courseTitle}
                onChange={e => setNewEntry({ ...newEntry, courseTitle: e.target.value })}
                required
              />

              <label>Lecturer *</label>
              <input
                type="text" placeholder="e.g. Dr. Okeke"
                value={newEntry.lecturer}
                onChange={e => setNewEntry({ ...newEntry, lecturer: e.target.value })}
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label>Day *</label>
                  <select value={newEntry.day} onChange={e => setNewEntry({ ...newEntry, day: e.target.value })}>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label>Start Time *</label>
                  <input
                    type="time" value={newEntry.startTime}
                    onChange={e => setNewEntry({ ...newEntry, startTime: e.target.value })} required
                  />
                </div>
                <div>
                  <label>End Time *</label>
                  <input
                    type="time" value={newEntry.endTime}
                    onChange={e => setNewEntry({ ...newEntry, endTime: e.target.value })} required
                  />
                </div>
              </div>

              <label>Venue / Room *</label>
              <input
                type="text" placeholder="e.g. LT 3 / Lab 1 / Online"
                value={newEntry.venue}
                onChange={e => setNewEntry({ ...newEntry, venue: e.target.value })} required
              />

              {/* Preview badge */}
              <div style={{ marginTop: 12, marginBottom: 4 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: (TYPE_COLORS[newEntry.type] || '#16a34a') + '15',
                  border: `1px solid ${TYPE_COLORS[newEntry.type] || '#16a34a'}40`,
                  borderLeft: `3px solid ${TYPE_COLORS[newEntry.type] || '#16a34a'}`,
                  borderRadius: 6, padding: '6px 12px',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLORS[newEntry.type] }}>
                    {newEntry.courseCode || 'CODE'}
                  </span>
                  <span style={{ fontSize: 12, color: '#374151' }}>
                    {newEntry.courseTitle || 'Course Title'} • {newEntry.day} {formatTime(newEntry.startTime)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button type="button" onClick={() => setShowAddEntry(false)} className="btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={addingEntry} style={{ flex: 2 }}>
                  {addingEntry ? 'Adding...' : '+ Add Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add personal event modal */}
      {showAddEvent && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 28,
            width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h3 style={{ marginBottom: 20, fontSize: 17 }}>📋 Add Personal Event</h3>
            <form onSubmit={handleAddEvent}>

              <label>Event Title *</label>
              <input
                type="text" placeholder="e.g. Study CSC201, Assignment Due"
                value={newEvent.title}
                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} required
              />

              <label>Event Type *</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {[
                  { value: 'study', label: '📚 Study' },
                  { value: 'meeting', label: '🤝 Meeting' },
                  { value: 'deadline', label: '⏰ Deadline' },
                  { value: 'reminder', label: '🔔 Reminder' },
                  { value: 'class', label: '🎓 Class' },
                  { value: 'other', label: '📌 Other' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNewEvent({ ...newEvent, type: opt.value, color: EVENT_COLORS[opt.value] })}
                    style={{
                      padding: '6px 12px', borderRadius: 8, border: 'none',
                      background: newEvent.type === opt.value ? EVENT_COLORS[opt.value] : '#f3f4f6',
                      color: newEvent.type === opt.value ? 'white' : '#374151',
                      cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <label>Course Code (optional)</label>
              <input
                type="text" placeholder="e.g. CSC201"
                value={newEvent.courseCode}
                onChange={e => setNewEvent({ ...newEvent, courseCode: e.target.value.toUpperCase() })}
              />

              <label>Description (optional)</label>
              <input
                type="text" placeholder="Brief description"
                value={newEvent.description}
                onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label>Date *</label>
                  <input
                    type="date" value={newEvent.date}
                    onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} required
                  />
                </div>
                <div>
                  <label>Start Time *</label>
                  <input
                    type="time" value={newEvent.startTime}
                    onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })} required
                  />
                </div>
                <div>
                  <label>End Time</label>
                  <input
                    type="time" value={newEvent.endTime}
                    onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  />
                </div>
              </div>

              <label>Remind me before</label>
              <select
                value={newEvent.reminderMinutes}
                onChange={e => setNewEvent({ ...newEvent, reminderMinutes: parseInt(e.target.value) })}
              >
                <option value={5}>5 minutes before</option>
                <option value={10}>10 minutes before</option>
                <option value={15}>15 minutes before</option>
                <option value={30}>30 minutes before</option>
                <option value={60}>1 hour before</option>
                <option value={1440}>1 day before</option>
              </select>

              {/* Recurring toggle */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', background: '#f9fafb', borderRadius: 8, margin: '12px 0',
              }}>
                <div
                  onClick={() => setNewEvent({ ...newEvent, isRecurring: !newEvent.isRecurring })}
                  style={{
                    width: 42, height: 24, borderRadius: 999, cursor: 'pointer',
                    background: newEvent.isRecurring ? '#16a34a' : '#d1d5db',
                    position: 'relative', transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: 'white',
                    position: 'absolute', top: 3,
                    left: newEvent.isRecurring ? 21 : 3,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
                <label style={{ cursor: 'pointer', fontWeight: 500, fontSize: 14 }}>
                  🔄 Recurring event
                </label>
              </div>

              {newEvent.isRecurring && (
                <div style={{ marginBottom: 12 }}>
                  <label>Repeat on</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <button
                        key={day} type="button"
                        onClick={() => {
                          const days = newEvent.recurringDays.includes(day)
                            ? newEvent.recurringDays.filter(d => d !== day)
                            : [...newEvent.recurringDays, day]
                          setNewEvent({ ...newEvent, recurringDays: days })
                        }}
                        style={{
                          padding: '5px 12px', borderRadius: 6, border: 'none',
                          background: newEvent.recurringDays.includes(day) ? '#16a34a' : '#f3f4f6',
                          color: newEvent.recurringDays.includes(day) ? 'white' : '#374151',
                          cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        }}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button type="button" onClick={() => setShowAddEvent(false)} className="btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={addingEvent} style={{ flex: 2 }}>
                  {addingEvent ? 'Adding...' : '+ Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ===== HERO ===== */}
      <div style={{
        background: 'linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%)',
        padding: '32px 24px 40px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -80, top: -80, width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(34,197,94,0.15)' }} />
        <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>📅 Timetable</h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                {user?.department} • {user?.faculty}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FACULTY ADMIN — Department selector ===== */}
      {user?.role === 'faculty_admin' && deptsList.length > 0 && (
        <div style={{
          background: 'white', borderRadius: 12, padding: '16px 20px',
          marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 10, fontWeight: 600 }}>
            📋 Viewing timetable for:
          </p>
          {/* Department + Level selector */}
<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
  {/* Department selector */}
  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
    {deptsList.map(dept => (
      <button
        key={dept._id}
        onClick={() => setSelectedDept(dept.name)}
        style={{
          padding: '6px 14px', borderRadius: 8,
          background: selectedDept === dept.name ? '#052e16' : '#f9fafb',
          color: selectedDept === dept.name ? 'white' : '#374151',
          cursor: 'pointer', fontSize: 12, fontWeight: 600,
          border: selectedDept === dept.name ? 'none' : '1px solid #e5e7eb',
        }}
      >
        {dept.name}
      </button>
    ))}
  </div>

  {/* Level selector — appears under the department row once one is picked */}
  {deptLevels.length > 0 && (
    <div style={{
      display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
      paddingTop: 10, borderTop: '1px solid #f3f4f6',
    }}>
      <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginRight: 4 }}>
        Level:
      </span>
      {deptLevels.map(level => (
        <button
          key={level}
          onClick={() => setSelectedDeptLevel(level)}
          style={{
            padding: '6px 12px', borderRadius: 8,
            background: selectedDeptLevel === level ? '#16a34a' : '#f9fafb',
            color: selectedDeptLevel === level ? 'white' : '#374151',
            cursor: 'pointer', fontSize: 12, fontWeight: 600,
            border: selectedDeptLevel === level ? 'none' : '1px solid #e5e7eb',
          }}
        >
          {level}
        </button>
      ))}
    </div>
  )}
</div>
          {/* Show viewing timetable status */}
{viewingDeptTimetable ? (
  <div style={{ marginTop: 10, fontSize: 12, color: '#16a34a' }}>
    ✅ Showing timetable for {selectedDept} • {selectedDeptLevel}
  </div>
) : selectedDept && selectedDeptLevel ? (
  <div style={{ marginTop: 10, fontSize: 12, color: '#9ca3af' }}>
    No timetable found for {selectedDept} • {selectedDeptLevel}
  </div>
) : selectedDept ? (
  <div style={{ marginTop: 10, fontSize: 12, color: '#9ca3af' }}>
    Select a level to view its timetable
  </div>
) : (
  <div style={{ marginTop: 10, fontSize: 12, color: '#9ca3af' }}>
    Select a department to get started
  </div>
)}
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px' }}>

        {/* Notifications */}
        {notifications.map(n => (
          <div key={n.id} style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 10, padding: '10px 16px', marginBottom: 10,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 14, color: '#15803d', fontWeight: 500 }}>{n.message}</span>
            <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18 }}>×</button>
          </div>
        ))}

        {/* Tab switcher */}
        <div style={{
          display: 'flex', background: 'white', borderRadius: 12,
          padding: 4, gap: 4, marginBottom: 20, width: 'fit-content',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          {[
            { key: 'department', label: '🏛️ Department Timetable' },
            { key: 'personal', label: '📋 My Planner' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setMainTab(tab.key as any)} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: mainTab === tab.key ? '#16a34a' : 'transparent',
              color: mainTab === tab.key ? 'white' : '#6b7280',
              cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
            }}>
              {tab.label}
            </button>
          ))}
        </div>


        {/* ===== DEPARTMENT TIMETABLE ===== */}
        {mainTab === 'department' && (
          <div>
            {/* Controls row */}
            <div style={{
              display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center',
            }}>
              {/* Level selector — only relevant for non-faculty-admin roles,
                  since faculty admins use the department/level selector above */}
              {user?.role !== 'student' && user?.role !== 'faculty_admin' && availableLevels.length > 0 && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {availableLevels.map(level => (
                    <button key={level} onClick={() => setActiveLevel(level)} style={{
                      padding: '6px 14px', borderRadius: 8, border: 'none',
                      background: activeLevel === level ? '#052e16' : 'white',
                      color: activeLevel === level ? 'white' : '#374151',
                      cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    }}>
                      {level}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                {/* View toggle */}
                {['week', 'list'].map(v => (
                  <button key={v} onClick={() => setView(v as any)} style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none',
                    background: view === v ? '#16a34a' : 'white',
                    color: view === v ? 'white' : '#374151',
                    cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  }}>
                    {v === 'week' ? '📊 Week' : '📋 List'}
                  </button>
                ))}

                {canManage && displayTimetable && (
                  <button onClick={() => setShowAddEntry(true)} className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>
                    + Add Class
                  </button>
                )}

                {canManage && !displayTimetable && user?.role !== 'faculty_admin' && (
                  <button onClick={() => setShowCreate(true)} style={{
                    padding: '6px 16px', borderRadius: 8, border: 'none',
                    background: '#16a34a', color: 'white',
                    cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  }}>
                    + Create Timetable
                  </button>
                )}
              </div>
            </div>

            {/* No timetable */}
            {!displayTimetable && (
              <div style={{
                background: 'white', borderRadius: 16, padding: '48px 24px',
                textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📅</div>
                <h3 style={{ marginBottom: 8 }}>
                  {user?.role === 'faculty_admin'
                    ? (selectedDept && selectedDeptLevel ? `No timetable for ${selectedDept} • ${selectedDeptLevel}` : 'Select a department and level')
                    : (activeLevel ? `No timetable for ${activeLevel}` : 'No timetable yet')}
                </h3>
                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
                  {canManage ? 'Create a timetable to get started.' : 'Your department admin hasn\'t uploaded the timetable yet.'}
                </p>
                {canManage && user?.role !== 'faculty_admin' && (
                  <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Create Timetable</button>
                )}
              </div>
            )}

            {/* Timetable */}
            {displayTimetable && (
              <div>
                {/* Status bar */}
                <div style={{
                  background: 'white', borderRadius: 12, padding: '12px 20px', marginBottom: 16,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  flexWrap: 'wrap', gap: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1f2937' }}>
                      {displayTimetable.department} • {displayTimetable.level}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      {displayTimetable.semester} • Updated by {displayTimetable.lastUpdatedBy?.name || 'N/A'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      background: displayTimetable.isPublished ? '#f0fdf4' : '#fef3c7',
                      color: displayTimetable.isPublished ? '#16a34a' : '#92400e',
                      padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                    }}>
                      {displayTimetable.isPublished ? '✅ Published' : '⏳ Draft'}
                    </span>
                    {canManage && !displayTimetable.isPublished && (
                      <button onClick={handlePublish} className="btn-primary" style={{ padding: '5px 12px', fontSize: 12 }}>
                        Publish
                      </button>
                    )}
                  </div>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  {TYPES.map(type => (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: TYPE_COLORS[type] }} />
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{type}</span>
                    </div>
                  ))}
                </div>

                {/* WEEK VIEW */}
                {view === 'week' && (
                  <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                        <thead>
                          <tr style={{ background: '#f9fafb' }}>
                            <th style={{ padding: '12px 16px', fontSize: 11, color: '#9ca3af', fontWeight: 600, textAlign: 'left', width: 80, borderBottom: '1px solid #f3f4f6' }}>
                              Time
                            </th>
                            {DAYS.map(day => (
                              <th key={day} style={{
                                padding: '12px 8px', fontSize: 12, fontWeight: 700,
                                color: '#1f2937', textAlign: 'center',
                                borderBottom: '1px solid #f3f4f6', borderLeft: '1px solid #f3f4f6', minWidth: 110,
                              }}>
                                {day.slice(0, 3)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {TIMES.map(time => (
                            <tr key={time} style={{ borderBottom: '1px solid #f9fafb' }}>
                              <td style={{ padding: '6px 16px', fontSize: 10, color: '#9ca3af', fontWeight: 500, verticalAlign: 'top', paddingTop: 10 }}>
                                {formatTime(time)}
                              </td>
                              {DAYS.map(day => {
                                const entry = getEntryForSlot(day, time, displayTimetable)
                                const isStart = entry?.startTime === time
                                return (
                                  <td key={day} style={{ padding: 3, verticalAlign: 'top', borderLeft: '1px solid #f9fafb', minWidth: 110 }}>
                                    {entry && isStart && (
                                      <div style={{
                                        background: entry.color + '15',
                                        border: `1px solid ${entry.color}30`,
                                        borderLeft: `3px solid ${entry.color}`,
                                        borderRadius: 6, padding: '6px 8px', position: 'relative',
                                      }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: entry.color }}>{entry.courseCode}</div>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: '#1f2937', marginTop: 1 }}>{entry.courseTitle}</div>
                                        <div style={{ fontSize: 9, color: '#6b7280', marginTop: 1 }}>📍 {entry.venue}</div>
                                        <div style={{ fontSize: 9, color: '#9ca3af' }}>{formatTime(entry.startTime)} – {formatTime(entry.endTime)}</div>
                                        {entry.type === 'Live' && (
                                          <div style={{ fontSize: 8, fontWeight: 700, color: '#dc2626', background: '#fef2f2', borderRadius: 3, padding: '1px 4px', marginTop: 2, display: 'inline-block' }}>
                                            ● LIVE
                                          </div>
                                        )}
                                        {canManage && (
                                          <button
                                            onClick={() => handleRemoveEntry(entry._id)}
                                            style={{ position: 'absolute', top: 3, right: 3, background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 1 }}
                                          >×</button>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* LIST VIEW */}
                {view === 'list' && (
                  <div>
                    {displayTimetable.entries.length === 0 ? (
                      <div style={{ background: 'white', borderRadius: 16, padding: '40px 24px', textAlign: 'center' }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
                        <h3>No classes added yet</h3>
                        {canManage && <button className="btn-primary" onClick={() => setShowAddEntry(true)} style={{ marginTop: 12 }}>+ Add First Class</button>}
                      </div>
                    ) : (
                      DAYS.map(day => {
                        const dayEntries = displayTimetable.entries
                          .filter(e => e.day === day)
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        if (dayEntries.length === 0) return null
                        return (
                          <div key={day} style={{ marginBottom: 20 }}>
                            <h3 style={{ fontSize: 13, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                              {day}
                            </h3>
                            {dayEntries.map(entry => (
                              <div key={entry._id} style={{
                                background: 'white', borderRadius: 10, padding: '12px 16px', marginBottom: 8,
                                display: 'flex', alignItems: 'center', gap: 14,
                                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                                borderLeft: `4px solid ${entry.color}`,
                              }}>
                                <div style={{
                                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                                  background: entry.color + '15',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                                }}>
                                  {entry.type === 'Lab' ? '🔬' : entry.type === 'Live' ? '📡' : entry.type === 'Tutorial' ? '📖' : '📚'}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: entry.color }}>{entry.courseCode}</span>
                                    <span style={{ fontSize: 11, color: '#9ca3af' }}>• {formatTime(entry.startTime)} – {formatTime(entry.endTime)}</span>
                                  </div>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>{entry.courseTitle}</div>
                                  <div style={{ fontSize: 12, color: '#6b7280' }}>👨‍🏫 {entry.lecturer} • 📍 {entry.venue}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ background: entry.color + '15', color: entry.color, padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                                    {entry.type}
                                  </span>
                                  {canManage && (
                                    <button onClick={() => handleRemoveEntry(entry._id)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, color: '#ef4444', padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}


        {/* ===== PERSONAL PLANNER ===== */}
        {mainTab === 'personal' && (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>My Personal Planner</h2>
                <p style={{ fontSize: 13, color: '#6b7280' }}>
                  {personalEvents.filter(e => !e.isCompleted).length} upcoming •
                  {completedEvents.length} completed
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={requestNotificationPermission} style={{
                  background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a',
                  borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}>
                  🔔 Enable Reminders
                </button>
                <button onClick={() => setShowAddEvent(true)} className="btn-primary">
                  + Add Event
                </button>
              </div>
            </div>

            {personalEvents.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 16, padding: '48px 24px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📋</div>
                <h3 style={{ marginBottom: 8 }}>Your planner is empty</h3>
                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
                  Add study sessions, deadlines, and reminders to stay organized.
                </p>
                <button className="btn-primary" onClick={() => setShowAddEvent(true)}>+ Add First Event</button>
              </div>
            ) : (
              <div>
                {/* Today */}
                {todayEvents.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Today ({todayEvents.length})
                      </h3>
                    </div>
                    {todayEvents.map(e => <EventCard key={e._id} event={e} onComplete={markComplete} onDelete={deleteEvent} />)}
                  </div>
                )}

                {/* Upcoming */}
                {upcomingEvents.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                      Upcoming ({upcomingEvents.length})
                    </h3>
                    {upcomingEvents.map(e => <EventCard key={e._id} event={e} onComplete={markComplete} onDelete={deleteEvent} />)}
                  </div>
                )}

                {/* Completed */}
                {completedEvents.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                      Completed ({completedEvents.length})
                    </h3>
                    {completedEvents.map(e => <EventCard key={e._id} event={e} onComplete={markComplete} onDelete={deleteEvent} />)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

// ===== EVENT CARD COMPONENT =====
function EventCard({ event, onComplete, onDelete }: {
  event: PersonalEvent
  onComplete: (id: string) => void
  onDelete: (id: string) => void
}) {
  const typeIcons: Record<string, string> = {
    study: '📚', meeting: '🤝', deadline: '⏰',
    reminder: '🔔', class: '🎓', other: '📌',
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div style={{
      background: 'white', borderRadius: 12, padding: '14px 16px', marginBottom: 8,
      display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      borderLeft: `4px solid ${event.color || '#16a34a'}`,
      opacity: event.isCompleted ? 0.6 : 1,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        background: (event.color || '#16a34a') + '15',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
      }}>
        {typeIcons[event.type] || '📌'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
          {event.courseCode && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: event.color || '#16a34a',
              background: (event.color || '#16a34a') + '15', padding: '1px 6px', borderRadius: 4,
            }}>
              {event.courseCode}
            </span>
          )}
          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            {formatDate(event.date)} • {event.startTime}
            {event.endTime ? ` – ${event.endTime}` : ''}
          </span>
        </div>
        <div style={{
          fontSize: 14, fontWeight: 600, color: '#1f2937',
          textDecoration: event.isCompleted ? 'line-through' : 'none',
        }}>
          {event.title}
        </div>
        {event.description && (
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{event.description}</div>
        )}
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3, display: 'flex', gap: 8 }}>
          <span>🔔 {event.reminderMinutes}min reminder</span>
          {event.isRecurring && <span>🔄 Recurring</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {!event.isCompleted && (
          <button onClick={() => onComplete(event._id)} style={{
            background: '#f0fdf4', border: 'none', borderRadius: 6,
            color: '#16a34a', padding: '6px 10px', cursor: 'pointer', fontSize: 12,
          }}>
            ✓ Done
          </button>
        )}
        <button onClick={() => onDelete(event._id)} style={{
          background: '#fef2f2', border: 'none', borderRadius: 6,
          color: '#ef4444', padding: '6px 10px', cursor: 'pointer', fontSize: 12,
        }}>
          🗑️
        </button>
      </div>
    </div>
  )
}