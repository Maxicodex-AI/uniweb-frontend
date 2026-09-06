'use client'

import { useEffect, useState } from 'react'
import type { FormEvent, CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { SkeletonTable } from '../components/Skeleton'
import { getAuthToken, removeAuthToken } from '../utils/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

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
  firstLogin: boolean
  avatarColor: string
  regNumber?: string
}

interface Department {
  _id: string
  name: string
  faculty: string
  maxLevel: number
}

interface Academic {
  _id: string
  session: string
  semester: number
  isActive: boolean
  promotionDone: boolean
}

interface ShowcasePost {
  _id: string
  title: string
  description?: string
  faculty?: string
  department?: string
  tag?: string
  videoUrl: string
  embedUrl?: string
  thumbnail?: string
  views: number
  isPinned: boolean
  postedByName?: string
  createdAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('departments')
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [adminUser, setAdminUser] = useState<User | null>(null)

  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [academic, setAcademic] = useState<Academic | null>(null)
  const [showcasePosts, setShowcasePosts] = useState<ShowcasePost[]>([])


  const [deptName, setDeptName] = useState('')
  const [deptFaculty, setDeptFaculty] = useState('')
  const [deptMaxLevel, setDeptMaxLevel] = useState('400')
  const [deptMessage, setDeptMessage] = useState('')
  const [deptSubmitting, setDeptSubmitting] = useState(false)

    // Faculty wizard
  const [faculties, setFaculties] = useState<any[]>([])
  const [facultyName, setFacultyName] = useState('')
  const [facultyDesc, setFacultyDesc] = useState('')
  const [showFacultyStep2, setShowFacultyStep2] = useState(false)
  const [assignFacultyAdmin, setAssignFacultyAdmin] = useState<boolean | null>(null)
  const [selectedFacultyAdmin, setSelectedFacultyAdmin] = useState('')

  // Department wizard
  const [showDeptStep2, setShowDeptStep2] = useState(false)
  const [showDeptStep3, setShowDeptStep3] = useState(false)
  const [deptDesc, setDeptDesc] = useState('')
  const [deptLearningType, setDeptLearningType] = useState('general_studies')
  const [assignDeptAdmin, setAssignDeptAdmin] = useState<boolean | null>(null)
  const [selectedDeptAdmin, setSelectedDeptAdmin] = useState('')
  const [expandedFaculty, setExpandedFaculty] = useState<string | null>(null)

  const [sessionName, setSessionName] = useState('')
  const [semester, setSemester] = useState('1')
  const [academicMessage, setAcademicMessage] = useState('')
  const [academicSubmitting, setAcademicSubmitting] = useState(false)

  // Showcase form state
  const [showcaseTitle, setShowcaseTitle] = useState('')
  const [showcaseDesc, setShowcaseDesc] = useState('')
  const [showcaseUrl, setShowcaseUrl] = useState('')
  const [showcaseFaculty, setShowcaseFaculty] = useState('')
  const [showcaseDept, setShowcaseDept] = useState('')
  const [showcaseTag, setShowcaseTag] = useState('')
  const [showcaseMessage, setShowcaseMessage] = useState('')
  const [showcaseSubmitting, setShowcaseSubmitting] = useState(false)

  // Student filters
  const [studentFilterFaculty, setStudentFilterFaculty] = useState('')
  const [studentFilterDept, setStudentFilterDept] = useState('')
  const [studentFilterLevel, setStudentFilterLevel] = useState('')

  const token = getAuthToken()

  // Derived lists — must be declared before anything that uses them (e.g. filteredStudents)
  const students = users.filter(u => u.role === 'student')
  const lecturers = users.filter(u => u.role === 'lecturer')
  const facultyAdmins = users.filter(u => u.role === 'faculty_admin')

  const filteredStudents = students.filter(u => {
    if (studentFilterFaculty && u.faculty !== studentFilterFaculty) return false
    if (studentFilterDept && u.department !== studentFilterDept) return false
    if (studentFilterLevel && u.level !== studentFilterLevel) return false
    return true
  })

  useEffect(() => {
    const check = async () => {
      if (!token) { router.push('/login'); return }
      try {
        const res = await fetch(`${API_BASE}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          removeAuthToken()
          router.push('/login')
          return
        }
        const data = await res.json()
        if (data.role !== 'admin') { router.push('/dashboard'); return }
        setAdminUser(data)
        setAuthChecked(true)
        await loadAll()
      } catch (err) {
        console.error(err)
        removeAuthToken()
        router.push('/login')
      }
    }
    check()
  }, [])

    const loadAll = async () => {
    if (!token) return
    setLoading(true)
    try {
      const [usersRes, deptsRes, acadRes, showcaseRes, facultiesRes] = await Promise.all([
        fetch(`${API_BASE}/api/users/all`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/departments`),
        fetch(`${API_BASE}/api/academic`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/showcase`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/faculties`),
      ])
      const usersData = usersRes.ok ? await usersRes.json() : []
      const deptsData = deptsRes.ok ? await deptsRes.json() : []
      const acadData = acadRes.ok ? await acadRes.json() : null
      const showcaseData = showcaseRes.ok ? await showcaseRes.json() : []
      const facultiesData = facultiesRes.ok ? await facultiesRes.json() : []
      setUsers(Array.isArray(usersData) ? usersData : [])
      setDepartments(Array.isArray(deptsData) ? deptsData : [])
      setAcademic(acadData)
      setShowcasePosts(Array.isArray(showcaseData) ? showcaseData : [])
      setFaculties(Array.isArray(facultiesData) ? facultiesData : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

    const handleCreateFaculty = async () => {
    setDeptSubmitting(true)
    setDeptMessage('')
    try {
      const res = await fetch(`${API_BASE}/api/faculties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: facultyName,
          description: facultyDesc,
          facultyAdminId: assignFacultyAdmin && selectedFacultyAdmin ? selectedFacultyAdmin : null,
        }),
      })
      if (res.ok) {
        setDeptMessage(`Faculty "${facultyName}" created successfully!`)
        setFacultyName('')
        setFacultyDesc('')
        setShowFacultyStep2(false)
        setAssignFacultyAdmin(null)
        setSelectedFacultyAdmin('')
        await loadAll()
      } else {
        const data = await res.json()
        setDeptMessage(data.message || 'Failed to create faculty')
      }
    } catch (err) {
      setDeptMessage('Something went wrong')
    } finally {
      setDeptSubmitting(false)
    }
  }

  const handleCreateDept = async () => {
    setDeptSubmitting(true)
    setDeptMessage('')
    try {
      const res = await fetch(`${API_BASE}/api/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: deptName,
          faculty: deptFaculty,
          maxLevel: parseInt(deptMaxLevel),
          description: deptDesc,
          learningType: deptLearningType,
          departmentAdminId: assignDeptAdmin && selectedDeptAdmin ? selectedDeptAdmin : null,
        }),
      })
      if (res.ok) {
        setDeptMessage(`Department "${deptName}" created successfully!`)
        setDeptName('')
        setDeptFaculty('')
        setDeptMaxLevel('400')
        setDeptDesc('')
        setDeptLearningType('general_studies')
        setShowDeptStep2(false)
        setShowDeptStep3(false)
        setAssignDeptAdmin(null)
        setSelectedDeptAdmin('')
        await loadAll()
      } else {
        const data = await res.json()
        setDeptMessage(data.message || 'Failed to create department')
      }
    } catch (err) {
      setDeptMessage('Something went wrong')
    } finally {
      setDeptSubmitting(false)
    }
  }

  const deleteDepartment = async (deptId: string, deptName: string) => {
    if (!confirm(`Delete "${deptName}"? This will also delete all its rooms.`)) return
    try {
      const res = await fetch(`${API_BASE}/api/departments/${deptId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) await loadAll()
      else alert('Failed to delete department')
    } catch (err) { console.error(err) }
  }

  const toggleHostPermission = async (userId: string, current: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/host-permission`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ canHostLive: !current }),
      })
      if (res.ok) await loadAll()
    } catch (err) { console.error(err) }
  }

  const promoteToAdmin = async (userId: string) => {
    if (!confirm('Promote this user to Super Admin?')) return
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/promote-admin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      if (res.ok) await loadAll()
      else { const d = await res.json(); alert(d.message) }
    } catch (err) { console.error(err) }
  }

  const promoteToFacultyAdmin = async (userId: string) => {
    if (!confirm('Promote this lecturer to Faculty Admin?')) return
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/promote-faculty-admin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      if (res.ok) { await loadAll(); setActiveTab('faculty_admins') }
      else { const d = await res.json(); alert(d.message) }
    } catch (err) { console.error(err) }
  }

  const demoteFromAdmin = async (userId: string) => {
    if (!confirm('Remove admin status? This user will become a lecturer.')) return
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/demote-admin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      if (res.ok) await loadAll()
      else { const d = await res.json(); alert(d.message) }
    } catch (err) { console.error(err) }
  }

  const promoteToDeptAdmin = async (userId: string) => {
    if (!confirm('Promote this lecturer to Department Admin?')) return
    try {
      const res = await fetch(
        `${API_BASE}/api/users/${userId}/promote-department-admin`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        }
      )
      if (res.ok) { await loadAll(); setActiveTab('dept_admins') }
      else { const d = await res.json(); alert(d.message) }
    } catch (err) { console.error(err) }
  }

  const demoteDeptAdmin = async (userId: string) => {
    if (!confirm('Remove department admin status? This user will become a lecturer.')) return
    try {
      const res = await fetch(
        `${API_BASE}/api/users/${userId}/demote-department-admin`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        }
      )
      if (res.ok) await loadAll()
      else { const d = await res.json(); alert(d.message) }
    } catch (err) { console.error(err) }
  }

  const handleCreateSession = async (e: FormEvent) => {
    e.preventDefault()
    setAcademicSubmitting(true)
    setAcademicMessage('')
    try {
      const res = await fetch(`${API_BASE}/api/academic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ session: sessionName, semester: parseInt(semester) }),
      })
      if (res.ok) {
        setAcademicMessage('Session created successfully!')
        setSessionName('')
        setSemester('1')
        await loadAll()
      } else {
        const data = await res.json()
        setAcademicMessage(data.message || 'Failed')
      }
    } catch (err) { setAcademicMessage('Something went wrong') }
    finally { setAcademicSubmitting(false) }
  }

  const handleNextSemester = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/academic/next`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) { setAcademicMessage('Semester advanced!'); await loadAll() }
    } catch (err) { console.error(err) }
  }

  const handlePromote = async () => {
    if (!confirm('Promote all students? This cannot be undone.')) return
    try {
      const res = await fetch(`${API_BASE}/api/academic/promote`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setAcademicMessage(data.message || 'Promotion complete')
      await loadAll()
    } catch (err) { console.error(err) }
  }

  // ===== Showcase handlers =====

  const handleCreateShowcase = async (e: FormEvent) => {
    e.preventDefault()
    setShowcaseSubmitting(true)
    setShowcaseMessage('')
    try {
      const res = await fetch(`${API_BASE}/api/showcase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: showcaseTitle,
          description: showcaseDesc || undefined,
          videoUrl: showcaseUrl,
          faculty: showcaseFaculty || undefined,
          department: showcaseDept || undefined,
          tag: showcaseTag || undefined,
        }),
      })
      if (res.ok) {
        setShowcaseMessage('Video posted successfully!')
        setShowcaseTitle('')
        setShowcaseDesc('')
        setShowcaseUrl('')
        setShowcaseFaculty('')
        setShowcaseDept('')
        setShowcaseTag('')
        await loadAll()
      } else {
        const data = await res.json().catch(() => ({}))
        setShowcaseMessage(data.message || 'Failed to post video. Check the URL and try again.')
      }
    } catch (err) {
      console.error(err)
      setShowcaseMessage('Something went wrong')
    } finally {
      setShowcaseSubmitting(false)
    }
  }

  const handlePinShowcase = async (postId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/showcase/${postId}/pin`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) await loadAll()
      else alert('Failed to update pin status')
    } catch (err) { console.error(err) }
  }

  const handleDeleteShowcase = async (postId: string) => {
    if (!confirm('Delete this video? This cannot be undone.')) return
    try {
      const res = await fetch(`${API_BASE}/api/showcase/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) await loadAll()
      else alert('Failed to delete video')
    } catch (err) { console.error(err) }
  }

  if (!authChecked || loading) return (
  <div style={{ padding: 40 }}>
    <SkeletonTable rows={8} />
  </div>
)

  const tabStyle = (tab: string): CSSProperties => ({
    padding: '10px 16px',
    cursor: 'pointer',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid #16a34a' : '2px solid transparent',
    background: 'transparent',
    color: activeTab === tab ? '#16a34a' : '#4b5563',
    fontWeight: activeTab === tab ? 700 : 400,
    fontSize: 13,
    whiteSpace: 'nowrap',
  })

  const getInitials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 999, padding: '3px 12px', marginBottom: 8,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ color: '#fca5a5', fontSize: 12, fontWeight: 600 }}>Super Admin</span>
              </div>
              <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
                ⚙️ Admin Control Panel
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                Full system control — {adminUser?.name}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="admin-stats" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 12,
            marginTop: 32,
          }}>
            {[
              { label: 'Total Users', value: users.length, icon: '👥', color: '#60a5fa' },
              { label: 'Students', value: students.length, icon: '🎓', color: '#34d399' },
              { label: 'Lecturers', value: lecturers.length, icon: '👨‍🏫', color: '#a78bfa' },
              { label: 'Dept Admins', value: users.filter(u => u.role === 'department_admin').length, icon: '🏛️', color: '#60a5fa' },
              { label: 'Faculty Admins', value: users.filter(u => u.role === 'faculty_admin').length, icon: '🛡️', color: '#fb923c' },
              { label: 'Departments', value: departments.length, icon: '🏛️', color: '#f472b6' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12, padding: '16px 12px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* ===== MAIN CONTENT ===== */}
      <div style={{ maxWidth: 960, margin: '-40px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>

        {/* Tabs card */}
        <div style={{
          background: 'white', borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}>

          {/* Tab bar */}
          <div className="admin-tabs" style={{
            borderBottom: '1px solid #f3f4f6',
            display: 'flex',
            overflowX: 'auto',
            padding: '0 8px',
          }}>
            {[
              { key: 'departments', label: '🏛️ Departments' },
              { key: 'students', label: '🎓 Students' },
              { key: 'lecturers', label: '👨‍🏫 All Staff' },
              { key: 'dept_admins', label: '🏛️ Dept Admins' },
              { key: 'faculty_admins', label: '🛡️ Faculty Admins' },
              { key: 'hosts', label: '🎙️ Host Permissions' },
              { key: 'showcase', label: '🎬 Showcase' },
              { key: 'academic', label: '📅 Academic' },
            ].map(tab => (
              <button key={tab.key} style={tabStyle(tab.key)} onClick={() => setActiveTab(tab.key)}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: 24 }}>

                       {/* ===== DEPARTMENTS TAB ===== */}
            {activeTab === 'departments' && (
              <div>

                {/* ===== FACULTY CREATION WIZARD ===== */}
                <div style={{
                  background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                  border: '1px solid #bbf7d0',
                  borderRadius: 14, padding: 24, marginBottom: 28,
                }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                    🏛️ Create New Faculty
                  </h2>
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
                    After creating a faculty you can assign a Faculty Admin who will then create departments and courses.
                  </p>

                  {/* Faculty wizard steps */}
                  {!showFacultyStep2 ? (
                    // Step 1: Basic info
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div>
                          <label>Faculty Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Faculty of Physical Science"
                            value={facultyName}
                            onChange={e => setFacultyName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label>Description</label>
                          <input
                            type="text"
                            placeholder="Brief description of this faculty"
                            value={facultyDesc}
                            onChange={e => setFacultyDesc(e.target.value)}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (!facultyName.trim()) return alert('Please enter a faculty name')
                          setShowFacultyStep2(true)
                        }}
                        className="btn-primary"
                      >
                        Continue →
                      </button>
                    </div>
                  ) : (
                    // Step 2: Assign faculty admin
                    <div>
                      <div style={{
                        background: 'white', borderRadius: 10, padding: 16,
                        marginBottom: 16, border: '1px solid #e5e7eb',
                      }}>
                        <h3 style={{ fontSize: 14, marginBottom: 4 }}>
                          Do you want to assign a Faculty Admin for <strong>{facultyName}</strong> now?
                        </h3>
                        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>
                          The Faculty Admin will be responsible for creating departments and managing all staff in this faculty.
                          You can always assign one later from the Staff tab.
                        </p>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                          <button
                            onClick={() => setAssignFacultyAdmin(true)}
                            style={{
                              flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                              background: assignFacultyAdmin ? '#16a34a' : '#f3f4f6',
                              color: assignFacultyAdmin ? 'white' : '#374151',
                              cursor: 'pointer', fontWeight: 600, fontSize: 13,
                            }}
                          >
                            ✅ Yes, assign now
                          </button>
                          <button
                            onClick={() => { setAssignFacultyAdmin(false); setSelectedFacultyAdmin('') }}
                            style={{
                              flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                              background: assignFacultyAdmin === false ? '#16a34a' : '#f3f4f6',
                              color: assignFacultyAdmin === false ? 'white' : '#374151',
                              cursor: 'pointer', fontWeight: 600, fontSize: 13,
                            }}
                          >
                            ⏭️ Skip for now
                          </button>
                        </div>

                        {assignFacultyAdmin && (
                          <div>
                            <label>Select a Lecturer to become Faculty Admin</label>
                            <select
                              value={selectedFacultyAdmin}
                              onChange={e => setSelectedFacultyAdmin(e.target.value)}
                            >
                              <option value="">Choose lecturer...</option>
                              {users.filter(u => u.role === 'lecturer').map(u => (
                                <option key={u._id} value={u._id}>
                                  {u.name} — {u.department || 'No dept'} ({u.faculty || 'No faculty'})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {deptMessage && (
                        <div className={deptMessage.includes('success') ? 'alert alert-success' : 'alert alert-error'} style={{ marginBottom: 12 }}>
                          {deptMessage}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          onClick={() => setShowFacultyStep2(false)}
                          className="btn-outline"
                        >
                          ← Back
                        </button>
                        <button
                          onClick={handleCreateFaculty}
                          className="btn-primary"
                          disabled={deptSubmitting}
                          style={{ flex: 1 }}
                        >
                          {deptSubmitting ? 'Creating...' : '🏛️ Create Faculty'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ===== DEPARTMENT CREATION WIZARD ===== */}
                <div id="create-dept-form" style={{
                  background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                  border: '1px solid #bfdbfe',
                  borderRadius: 14, padding: 24, marginBottom: 28,
                }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                    📚 Create New Department
                  </h2>
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
                    Set up a department with its learning type and optionally assign a Department Admin.
                  </p>

                  {!showDeptStep2 ? (
                    // Step 1: Basic dept info
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label>Faculty *</label>
                          <select value={deptFaculty} onChange={e => setDeptFaculty(e.target.value)}>
                            <option value="">Select faculty...</option>
                            {faculties.map(f => (
                              <option key={f._id || f.name} value={f.name}>{f.name}</option>
                            ))}
                            {/* Also show from existing departments */}
                            {[...new Set(departments.map(d => d.faculty))].filter(f => !faculties.find((fc: any) => fc.name === f)).map(f => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label>Department Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Computer Science"
                            value={deptName}
                            onChange={e => setDeptName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label>Max Level</label>
                          <select value={deptMaxLevel} onChange={e => setDeptMaxLevel(e.target.value)}>
                            <option value="400">400L (4-year)</option>
                            <option value="500">500L (5-year)</option>
                            <option value="600">600L (6-year)</option>
                          </select>
                        </div>
                        <div>
                          <label>Department Description</label>
                          <input
                            type="text"
                            placeholder="What do students study here?"
                            value={deptDesc}
                            onChange={e => setDeptDesc(e.target.value)}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (!deptName.trim() || !deptFaculty) return alert('Please fill in faculty and department name')
                          setShowDeptStep2(true)
                        }}
                        className="btn-primary"
                        style={{ marginTop: 16 }}
                      >
                        Continue →
                      </button>
                    </div>
                  ) : !showDeptStep3 ? (
                    // Step 2: Learning type
                    <div>
                      <h3 style={{ fontSize: 14, marginBottom: 4 }}>
                        What best describes <strong>{deptName}</strong>?
                      </h3>
                      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
                        This helps us create the right learning environment for students in this department.
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 16 }}>
                        {[
                          { value: 'language_linguistics', label: '🗣️ Language & Linguistics', desc: 'Phonetics, syntax, language learning' },
                          { value: 'science_medicine', label: '🔬 Science & Medicine', desc: 'Lab work, diagrams, case studies' },
                          { value: 'arts_performance', label: '🎭 Arts & Performance', desc: 'Scripts, performance, critique' },
                          { value: 'agriculture_environment', label: '🌱 Agriculture & Environment', desc: 'Crop science, soil, farming' },
                          { value: 'engineering_technology', label: '⚙️ Engineering & Technology', desc: 'Code, circuits, problem solving' },
                          { value: 'business_economics', label: '💼 Business & Economics', desc: 'Case studies, finance, markets' },
                          { value: 'journalism_media', label: '📰 Journalism & Media', desc: 'Writing, broadcast, media analysis' },
                          { value: 'law_studies', label: '⚖️ Law & Legal Studies', desc: 'Case law, legal arguments, moot court' },
                          { value: 'health_sciences', label: '🏥 Health Sciences', desc: 'Clinical cases, patient simulation, anatomy' },
                          { value: 'education_studies', label: '🎒 Education Studies', desc: 'Lesson planning, pedagogy, assessment' },
                          { value: 'general_studies', label: '📚 General Studies', desc: 'Standard notes, quiz, video' },
                        ].map(type => (
                          <div
                            key={type.value}
                            onClick={() => setDeptLearningType(type.value)}
                            style={{
                              padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                              border: deptLearningType === type.value ? '2px solid #2563eb' : '2px solid #e5e7eb',
                              background: deptLearningType === type.value ? '#eff6ff' : 'white',
                              transition: 'all 0.15s',
                            }}
                          >
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', marginBottom: 3 }}>{type.label}</div>
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>{type.desc}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setShowDeptStep2(false)} className="btn-outline">← Back</button>
                        <button
                          onClick={() => setShowDeptStep3(true)}
                          className="btn-primary"
                          disabled={!deptLearningType}
                          style={{ flex: 1 }}
                        >
                          Continue →
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Step 3: Assign dept admin
                    <div>
                      <div style={{
                        background: 'white', borderRadius: 10, padding: 16,
                        marginBottom: 16, border: '1px solid #e5e7eb',
                      }}>
                        <h3 style={{ fontSize: 14, marginBottom: 4 }}>
                          Assign a Department Admin for <strong>{deptName}</strong>?
                        </h3>
                        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>
                          The Department Admin manages courses, lessons, timetable and student reps for this department.
                        </p>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                          <button
                            onClick={() => setAssignDeptAdmin(true)}
                            style={{
                              flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                              background: assignDeptAdmin ? '#2563eb' : '#f3f4f6',
                              color: assignDeptAdmin ? 'white' : '#374151',
                              cursor: 'pointer', fontWeight: 600, fontSize: 13,
                            }}
                          >
                            ✅ Yes, assign now
                          </button>
                          <button
                            onClick={() => { setAssignDeptAdmin(false); setSelectedDeptAdmin('') }}
                            style={{
                              flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                              background: assignDeptAdmin === false ? '#2563eb' : '#f3f4f6',
                              color: assignDeptAdmin === false ? 'white' : '#374151',
                              cursor: 'pointer', fontWeight: 600, fontSize: 13,
                            }}
                          >
                            ⏭️ Skip for now
                          </button>
                        </div>

                        {assignDeptAdmin && (
                          <div>
                            <label>Select a Lecturer</label>
                            <select
                              value={selectedDeptAdmin}
                              onChange={e => setSelectedDeptAdmin(e.target.value)}
                            >
                              <option value="">Choose lecturer...</option>
                              {users.filter(u => u.role === 'lecturer' && (!deptFaculty || u.faculty === deptFaculty)).map(u => (
                                <option key={u._id} value={u._id}>
                                  {u.name} — {u.department || 'No dept'}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Summary */}
                      <div style={{
                        background: '#f9fafb', borderRadius: 10, padding: 14,
                        marginBottom: 16, border: '1px solid #e5e7eb',
                        fontSize: 13,
                      }}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>📋 Summary</div>
                        {[
                          { label: 'Faculty', value: deptFaculty },
                          { label: 'Department', value: deptName },
                          { label: 'Max Level', value: `${deptMaxLevel}L` },
                          { label: 'Learning Type', value: deptLearningType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) },
                        ].map(item => (
                          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f3f4f6' }}>
                            <span style={{ color: '#6b7280' }}>{item.label}</span>
                            <span style={{ fontWeight: 600 }}>{item.value}</span>
                          </div>
                        ))}
                      </div>

                      {deptMessage && (
                        <div className={deptMessage.includes('success') ? 'alert alert-success' : 'alert alert-error'} style={{ marginBottom: 12 }}>
                          {deptMessage}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setShowDeptStep3(false)} className="btn-outline">← Back</button>
                        <button
                          onClick={handleCreateDept}
                          className="btn-primary"
                          disabled={deptSubmitting}
                          style={{ flex: 1 }}
                        >
                          {deptSubmitting ? 'Creating...' : '✅ Create Department'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ===== EXISTING FACULTIES ===== */}
                <div style={{ marginBottom: 28 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
                    Faculties ({faculties.length})
                  </h2>
                  {faculties.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', background: '#f9fafb', borderRadius: 10 }}>
                      No faculties yet. Create your first faculty above.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {faculties.map((faculty: any) => {
                        const facultyDepts = departments.filter(d => d.faculty === faculty.name)
                        const isExpanded = expandedFaculty === faculty.name
                        return (
                          <div key={faculty._id || faculty.name} style={{
                            background: 'white', borderRadius: 14,
                            border: '1px solid #e5e7eb',
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          }}>
                            {/* Faculty header — clickable */}
                            <div
                              onClick={() => setExpandedFaculty(isExpanded ? null : faculty.name)}
                              style={{
                                display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', padding: '16px 20px',
                                cursor: 'pointer',
                                background: isExpanded ? '#f0fdf4' : 'white',
                                transition: 'background 0.15s',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                  width: 40, height: 40, borderRadius: 10,
                                  background: isExpanded ? '#16a34a' : '#f3f4f6',
                                  display: 'flex', alignItems: 'center',
                                  justifyContent: 'center', fontSize: 20,
                                  transition: 'all 0.15s',
                                }}>
                                  🏛️
                                </div>
                                <div>
                                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1f2937', margin: 0 }}>
                                    {faculty.name}
                                  </h3>
                                  {faculty.description && (
                                    <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>
                                      {faculty.description.slice(0, 60)}{faculty.description.length > 60 ? '...' : ''}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{
                                  background: isExpanded ? '#f0fdf4' : '#f3f4f6',
                                  color: isExpanded ? '#16a34a' : '#6b7280',
                                  padding: '3px 10px', borderRadius: 999,
                                  fontSize: 12, fontWeight: 700,
                                }}>
                                  {facultyDepts.length} dept{facultyDepts.length !== 1 ? 's' : ''}
                                </span>
                                {faculty.facultyAdmin ? (
                                  <span style={{
                                    background: '#f5f3ff', color: '#7c3aed',
                                    padding: '3px 10px', borderRadius: 999,
                                    fontSize: 11, fontWeight: 600,
                                  }}>
                                    🛡️ {faculty.facultyAdmin?.name || 'Admin assigned'}
                                  </span>
                                ) : (
                                  <span style={{
                                    background: '#fef3c7', color: '#92400e',
                                    padding: '3px 10px', borderRadius: 999,
                                    fontSize: 11, fontWeight: 600,
                                  }}>
                                    ⚠️ No admin
                                  </span>
                                )}
                                <span style={{
                                  fontSize: 18, color: '#9ca3af',
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s', display: 'inline-block',
                                }}>
                                  ▾
                                </span>
                              </div>
                            </div>

                            {/* Departments under this faculty — expandable */}
                            {isExpanded && (
                              <div style={{
                                borderTop: '1px solid #f3f4f6',
                                padding: '16px 20px',
                                background: '#fafafa',
                              }}>
                                {facultyDepts.length === 0 ? (
                                  <div style={{ textAlign: 'center', padding: '16px', color: '#9ca3af', fontSize: 13 }}>
                                    No departments yet under this faculty.
                                    <br />
                                    <span style={{ fontSize: 12 }}>Use the "Create New Department" form above to add departments.</span>
                                  </div>
                                ) : (
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                                    {facultyDepts.map(dept => {
                                      const learningTypeLabels: Record<string, { label: string; icon: string }> = {
                                        language_linguistics: { label: 'Language', icon: '🗣️' },
                                        science_medicine: { label: 'Science', icon: '🔬' },
                                        arts_performance: { label: 'Arts', icon: '🎭' },
                                        agriculture_environment: { label: 'Agriculture', icon: '🌱' },
                                        engineering_technology: { label: 'Engineering', icon: '⚙️' },
                                        business_economics: { label: 'Business', icon: '💼' },
                                        journalism_media: { label: 'Media', icon: '📰' },
                                        law_studies: { label: 'Law', icon: '⚖️' },
                                        health_sciences: { label: 'Health Sciences', icon: '🏥' },
                                        education_studies: { label: 'Education', icon: '🎒' },
                                        general_studies: { label: 'General', icon: '📚' },
                                      }
                                      const typeInfo = learningTypeLabels[(dept as any).learningType] || { label: 'General', icon: '📚' }
                                      return (
                                        <div key={dept._id} style={{
                                          background: 'white', borderRadius: 10,
                                          padding: '14px 16px', border: '1px solid #e5e7eb',
                                        }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1f2937', margin: 0 }}>
                                              {dept.name}
                                            </h4>
                                            <button
                                              onClick={() => deleteDepartment(dept._id, dept.name)}
                                              style={{
                                                background: '#fef2f2', border: 'none',
                                                color: '#ef4444', borderRadius: 6,
                                                padding: '2px 8px', cursor: 'pointer',
                                                fontSize: 11, fontWeight: 600,
                                              }}
                                            >
                                              Delete
                                            </button>
                                          </div>
                                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            <span style={{
                                              background: '#f3f4f6', color: '#374151',
                                              padding: '2px 8px', borderRadius: 999,
                                              fontSize: 11, fontWeight: 600,
                                            }}>
                                              🎓 Max {dept.maxLevel}L
                                            </span>
                                            <span style={{
                                              background: '#f5f3ff', color: '#7c3aed',
                                              padding: '2px 8px', borderRadius: 999,
                                              fontSize: 11, fontWeight: 600,
                                            }}>
                                              {typeInfo.icon} {typeInfo.label}
                                            </span>
                                          </div>
                                          {(dept as any).departmentAdmin && (
                                            <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, marginTop: 6 }}>
                                              🏛️ {(dept as any).departmentAdmin?.name || 'Admin assigned'}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}

                                {/* Add dept button for this faculty */}
                                <button
                                  onClick={() => {
                                    setDeptFaculty(faculty.name)
                                    setShowDeptStep2(false)
                                    setShowDeptStep3(false)
                                    // Scroll to create dept form
                                    document.getElementById('create-dept-form')?.scrollIntoView({ behavior: 'smooth' })
                                  }}
                                  style={{
                                    marginTop: 12, width: '100%',
                                    padding: '8px', borderRadius: 8,
                                    border: '1px dashed #d1d5db', background: 'none',
                                    color: '#6b7280', cursor: 'pointer', fontSize: 12,
                                    fontWeight: 600,
                                  }}
                                >
                                  + Add Department to {faculty.name}
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ===== STUDENTS TAB ===== */}
            {activeTab === 'students' && (
              <div>
                <h2 style={{ marginBottom: 16, fontSize: 16 }}>Students</h2>

                {/* Faculty → Department → Level filter */}
                <div style={{
                  background: '#f9fafb', borderRadius: 12, padding: 16,
                  marginBottom: 20, border: '1px solid #e5e7eb',
                }}>
                  <p style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 12 }}>
                    Filter Students
                  </p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {/* Faculty */}
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Faculty</label>
                      <select
                        value={studentFilterFaculty}
                        onChange={e => {
                          setStudentFilterFaculty(e.target.value)
                          setStudentFilterDept('')
                          setStudentFilterLevel('')
                        }}
                        style={{ marginTop: 4 }}
                      >
                        <option value="">All Faculties</option>
                        {[...new Set(users.filter(u => u.role === 'student').map(u => u.faculty).filter(Boolean))].map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    {/* Department */}
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Department</label>
                      <select
                        value={studentFilterDept}
                        onChange={e => { setStudentFilterDept(e.target.value); setStudentFilterLevel('') }}
                        disabled={!studentFilterFaculty}
                        style={{ marginTop: 4 }}
                      >
                        <option value="">All Departments</option>
                        {[...new Set(
                          users.filter(u => u.role === 'student' && u.faculty === studentFilterFaculty)
                            .map(u => u.department).filter(Boolean)
                        )].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    {/* Level */}
                    <div style={{ flex: 1, minWidth: 100 }}>
                      <label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Level</label>
                      <select
                        value={studentFilterLevel}
                        onChange={e => setStudentFilterLevel(e.target.value)}
                        disabled={!studentFilterDept}
                        style={{ marginTop: 4 }}
                      >
                        <option value="">All Levels</option>
                        {[...new Set(
                          users.filter(u =>
                            u.role === 'student' &&
                            u.faculty === studentFilterFaculty &&
                            u.department === studentFilterDept
                          ).map(u => u.level).filter(Boolean)
                        )].sort().map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>

                    {/* Clear */}
                    {(studentFilterFaculty || studentFilterDept || studentFilterLevel) && (
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button
                          onClick={() => { setStudentFilterFaculty(''); setStudentFilterDept(''); setStudentFilterLevel('') }}
                          style={{
                            padding: '8px 14px', borderRadius: 8, border: 'none',
                            background: '#fef2f2', color: '#ef4444',
                            cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Results count */}
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                  Showing {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
                  {studentFilterLevel && ` in ${studentFilterLevel}`}
                  {studentFilterDept && ` • ${studentFilterDept}`}
                  {studentFilterFaculty && ` • ${studentFilterFaculty}`}
                </p>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        {['Student', 'Faculty', 'Department', 'Level', 'Reg No', 'Status'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map(u => (
                        <tr key={u._id} style={{ borderBottom: '1px solid #f9fafb' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: u.avatarColor || '#16a34a',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: 12, fontWeight: 700,
                              }}>
                                {getInitials(u.name)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600 }}>{u.name}</div>
                                <div style={{ fontSize: 11, color: '#9ca3af' }}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px', color: '#4b5563', fontSize: 12 }}>{u.faculty || '—'}</td>
                          <td style={{ padding: '12px', color: '#4b5563', fontSize: 12 }}>{u.department || '—'}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              background: '#f0fdf4', color: '#16a34a',
                              padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                            }}>{u.level || '—'}</span>
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
                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>
                            No students found with the selected filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ===== LECTURERS TAB ===== */}
            {activeTab === 'lecturers' && (
              <div>
                <h2 style={{ marginBottom: 16, fontSize: 16 }}>All Staff ({users.filter(u => u.role !== 'student').length})</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        {['Lecturer', 'Faculty', 'Department', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.role !== 'student').map(u => (
                        <tr key={u._id} style={{ borderBottom: '1px solid #f9fafb' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: u.avatarColor || '#2563eb',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0,
                              }}>{getInitials(u.name)}</div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                                <div style={{ fontSize: 11, color: '#9ca3af' }}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px', color: '#4b5563', fontSize: 12 }}>{u.faculty || '—'}</td>
                          <td style={{ padding: '12px', color: '#4b5563', fontSize: 12 }}>{u.department || '—'}</td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                              {/* Role badge */}
                              <span style={{
                                padding: '3px 8px', borderRadius: 999,
                                fontSize: 11, fontWeight: 700,
                                background:
                                  u.role === 'admin' ? '#fef2f2' :
                                  u.role === 'faculty_admin' ? '#f5f3ff' :
                                  u.role === 'department_admin' ? '#eff6ff' : '#f0fdf4',
                                color:
                                  u.role === 'admin' ? '#dc2626' :
                                  u.role === 'faculty_admin' ? '#7c3aed' :
                                  u.role === 'department_admin' ? '#2563eb' : '#16a34a',
                              }}>
                                {u.role === 'admin' ? '⚙️ Super Admin' :
                                  u.role === 'faculty_admin' ? '🛡️ Faculty Admin' :
                                  u.role === 'department_admin' ? '🏛️ Dept Admin' : '👨‍🏫 Lecturer'}
                              </span>

                              {/* Promote to Dept Admin — only for lecturers */}
                              {u.role === 'lecturer' && (
                                <button onClick={() => promoteToDeptAdmin(u._id)} style={{
                                  padding: '3px 8px', borderRadius: 6, border: 'none',
                                  cursor: 'pointer', background: '#eff6ff', color: '#2563eb',
                                  fontWeight: 600, fontSize: 11,
                                }}>
                                  Make Dept Admin
                                </button>
                              )}

                              {/* Promote to Faculty Admin — only for lecturers */}
                              {u.role === 'lecturer' && (
                                <button onClick={() => promoteToFacultyAdmin(u._id)} style={{
                                  padding: '3px 8px', borderRadius: 6, border: 'none',
                                  cursor: 'pointer', background: '#f0fdf4', color: '#15803d',
                                  fontWeight: 600, fontSize: 11,
                                }}>
                                  Make Faculty Admin
                                </button>
                              )}

                              {/* Promote to Super Admin — only for lecturers */}
                              {u.role === 'lecturer' && (
                                <button onClick={() => promoteToAdmin(u._id)} style={{
                                  padding: '3px 8px', borderRadius: 6, border: 'none',
                                  cursor: 'pointer', background: '#fef2f2', color: '#dc2626',
                                  fontWeight: 600, fontSize: 11,
                                }}>
                                  Make Super Admin
                                </button>
                              )}

                              {/* Demote Dept Admin back to lecturer */}
                              {u.role === 'department_admin' && (
                                <button onClick={() => demoteDeptAdmin(u._id)} style={{
                                  padding: '3px 8px', borderRadius: 6, border: 'none',
                                  cursor: 'pointer', background: '#fef2f2', color: '#dc2626',
                                  fontWeight: 600, fontSize: 11,
                                }}>
                                  Remove Dept Admin
                                </button>
                              )}

                              {/* Demote Faculty Admin back to lecturer */}
                              {u.role === 'faculty_admin' && (
                                <button onClick={() => demoteFromAdmin(u._id)} style={{
                                  padding: '3px 8px', borderRadius: 6, border: 'none',
                                  cursor: 'pointer', background: '#fef2f2', color: '#dc2626',
                                  fontWeight: 600, fontSize: 11,
                                }}>
                                  Remove Faculty Admin
                                </button>
                              )}

                              {/* Demote Super Admin back to lecturer */}
                              {u.role === 'admin' && u._id !== adminUser?._id && (
                                <button onClick={() => demoteFromAdmin(u._id)} style={{
                                  padding: '3px 8px', borderRadius: 6, border: 'none',
                                  cursor: 'pointer', background: '#fef2f2', color: '#dc2626',
                                  fontWeight: 600, fontSize: 11,
                                }}>
                                  Remove Super Admin
                                </button>
                              )}

                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ===== DEPT ADMINS TAB ===== */}
            {activeTab === 'dept_admins' && (
              <div>
                <h2 style={{ marginBottom: 16, fontSize: 16 }}>
                  Department Admins ({users.filter(u => u.role === 'department_admin').length})
                </h2>
                {users.filter(u => u.role === 'department_admin').length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🏛️</div>
                    <p>No department admins yet. Promote a lecturer from the Lecturers tab.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          {['Name', 'Faculty', 'Department', 'Actions'].map(h => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter(u => u.role === 'department_admin').map(u => (
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
                            <td style={{ padding: '12px', color: '#4b5563', fontSize: 12 }}>{u.faculty || '—'}</td>
                            <td style={{ padding: '12px', color: '#4b5563', fontSize: 12 }}>{u.department || '—'}</td>
                            <td style={{ padding: '12px' }}>
                              <button
                                onClick={() => demoteDeptAdmin(u._id)}
                                style={{
                                  padding: '4px 10px', borderRadius: 6, border: 'none',
                                  cursor: 'pointer', background: '#fef2f2', color: '#dc2626',
                                  fontWeight: 600, fontSize: 11,
                                }}
                              >
                                Remove Admin
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ===== FACULTY ADMINS TAB ===== */}
            {activeTab === 'faculty_admins' && (
              <div>
                <h2 style={{ marginBottom: 16, fontSize: 16 }}>Faculty Admins ({facultyAdmins.length})</h2>
                {facultyAdmins.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🛡️</div>
                    <p>No faculty admins yet. Promote a lecturer from the Lecturers tab.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          {['Faculty Admin', 'Faculty', 'Department', 'Actions'].map(h => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {facultyAdmins.map(u => (
                          <tr key={u._id} style={{ borderBottom: '1px solid #f9fafb' }}>
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 32, height: 32, borderRadius: '50%',
                                  background: u.avatarColor || '#7c3aed',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0,
                                }}>{getInitials(u.name)}</div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px', color: '#4b5563', fontSize: 12 }}>{u.faculty || '—'}</td>
                            <td style={{ padding: '12px', color: '#4b5563', fontSize: 12 }}>{u.department || '—'}</td>
                            <td style={{ padding: '12px' }}>
                              <button onClick={() => demoteFromAdmin(u._id)} style={{
                                padding: '4px 10px', borderRadius: 6, border: 'none',
                                cursor: 'pointer', background: '#fef2f2', color: '#dc2626',
                                fontWeight: 600, fontSize: 11,
                              }}>Remove Admin</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}


            {/* ===== HOST PERMISSIONS TAB ===== */}
            {activeTab === 'hosts' && (
              <div>
                <div className="alert alert-success" style={{ marginBottom: 20 }}>
                  Grant up to <strong>2 students per department per level</strong> the ability to host live sessions.
                </div>

                {/* Group by department and level */}
                {[...new Set(students.map(s => s.department).filter(Boolean))].map(dept => (
                  <div key={dept} style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 12, padding: '8px 12px', background: '#f9fafb', borderRadius: 8 }}>
                      🏛️ {dept}
                    </h3>
                    {[...new Set(students.filter(s => s.department === dept).map(s => s.level).filter(Boolean))].sort().map(level => {
                      const levelStudents = students.filter(s => s.department === dept && s.level === level)
                      const hostsInLevel = levelStudents.filter(s => s.canHostLive).length
                      return (
                        <div key={level} style={{ marginBottom: 12, paddingLeft: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <span style={{
                              background: '#f0fdf4', color: '#16a34a',
                              padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                            }}>
                              {level}
                            </span>
                            <span style={{ fontSize: 12, color: '#9ca3af' }}>
                              {hostsInLevel}/2 hosts granted
                            </span>
                          </div>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <tbody>
                              {levelStudents.map(u => {
                                const canGrant = u.canHostLive || hostsInLevel < 2
                                return (
                                  <tr key={u._id} style={{ borderBottom: '1px solid #f9fafb' }}>
                                    <td style={{ padding: '8px 12px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{
                                          width: 28, height: 28, borderRadius: '50%',
                                          background: u.avatarColor || '#16a34a',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          color: 'white', fontSize: 11, fontWeight: 700,
                                        }}>{getInitials(u.name)}</div>
                                        <span style={{ fontWeight: 500 }}>{u.name}</span>
                                      </div>
                                    </td>
                                    <td style={{ padding: '8px 12px' }}>
                                      <button
                                        onClick={() => toggleHostPermission(u._id, u.canHostLive)}
                                        disabled={!canGrant}
                                        style={{
                                          padding: '4px 12px', borderRadius: 6, border: 'none',
                                          cursor: canGrant ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 600,
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
                ))}
              </div>
            )}

            {/* ===== SHOWCASE TAB ===== */}
            {activeTab === 'showcase' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>

                  {/* Post form */}
                  <div>
                    <h2 style={{ fontSize: 16, marginBottom: 16 }}>📹 Post Campus Video</h2>
                    <form onSubmit={handleCreateShowcase}>
                      <label>Video Title *</label>
                      <input
                        type="text" placeholder="e.g. Theatre Arts End of Year Performance"
                        value={showcaseTitle} onChange={e => setShowcaseTitle(e.target.value)} required
                      />
                      <label>Description</label>
                      <textarea
                        placeholder="Tell visitors what this video is about..."
                        value={showcaseDesc} onChange={e => setShowcaseDesc(e.target.value)}
                        rows={3}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, resize: 'vertical', fontFamily: 'inherit', outline: 'none' }}
                      />
                      <label>YouTube / Vimeo URL *</label>
                      <input
                        type="url" placeholder="https://youtube.com/watch?v=..."
                        value={showcaseUrl} onChange={e => setShowcaseUrl(e.target.value)} required
                      />
                      <label>Faculty (optional)</label>
                      <input
                        type="text" placeholder="e.g. Physical Science"
                        value={showcaseFaculty} onChange={e => setShowcaseFaculty(e.target.value)}
                      />
                      <label>Department (optional)</label>
                      <input
                        type="text" placeholder="e.g. Theatre Arts"
                        value={showcaseDept} onChange={e => setShowcaseDept(e.target.value)}
                      />
                      <label>Tag (optional)</label>
                      <input
                        type="text" placeholder="e.g. Performance, Research, Sports"
                        value={showcaseTag} onChange={e => setShowcaseTag(e.target.value)}
                      />
                      <button type="submit" className="btn-primary" disabled={showcaseSubmitting} style={{ marginTop: 16, width: '100%' }}>
                        {showcaseSubmitting ? 'Posting...' : '🎬 Post Video'}
                      </button>
                      {showcaseMessage && (
                        <div className={showcaseMessage.includes('success') ? 'alert alert-success' : 'alert alert-error'} style={{ marginTop: 10 }}>
                          {showcaseMessage}
                        </div>
                      )}
                    </form>
                  </div>

                  {/* Info panel */}
                  <div style={{ background: '#f9fafb', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                    <h3 style={{ fontSize: 14, marginBottom: 12 }}>📋 Supported Links</h3>
                    {[
                      { icon: '🎥', label: 'YouTube', example: 'youtube.com/watch?v=...' },
                      { icon: '📱', label: 'YouTube Shorts', example: 'youtube.com/shorts/...' },
                      { icon: '🎬', label: 'Vimeo', example: 'vimeo.com/...' },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                        <span style={{ fontSize: 18 }}>{item.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{item.example}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 16, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 12, color: '#15803d' }}>
                      💡 Videos appear on the public homepage — visitors can watch them without logging in.
                    </div>
                  </div>
                </div>

                {/* Posted videos */}
                <h2 style={{ fontSize: 16, marginBottom: 16 }}>Posted Videos ({showcasePosts.length})</h2>
                {showcasePosts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>🎬</div>
                    <p>No videos posted yet. Post your first campus video above.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                    {showcasePosts.map(post => (
                      <div key={post._id} style={{ background: '#f9fafb', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                        {/* Thumbnail */}
                        <div style={{ position: 'relative', aspectRatio: '16/9', background: '#1a1a2e' }}>
                          {post.thumbnail ? (
                            <img src={post.thumbnail} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #052e16, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🎬</div>
                          )}
                          {post.isPinned && (
                            <div style={{ position: 'absolute', top: 6, left: 6, background: '#16a34a', color: 'white', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700 }}>
                              📌 Featured
                            </div>
                          )}
                        </div>
                        <div style={{ padding: '12px 14px' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {post.title}
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8 }}>
                            👁 {post.views} views • {new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => handlePinShowcase(post._id)}
                              style={{
                                flex: 1, padding: '5px', borderRadius: 6, border: 'none',
                                background: post.isPinned ? '#fef3c7' : '#f3f4f6',
                                color: post.isPinned ? '#92400e' : '#374151',
                                cursor: 'pointer', fontSize: 11, fontWeight: 600,
                              }}
                            >
                              {post.isPinned ? '📌 Unpin' : '📌 Pin'}
                            </button>
                            <button
                              onClick={() => handleDeleteShowcase(post._id)}
                              style={{
                                flex: 1, padding: '5px', borderRadius: 6, border: 'none',
                                background: '#fef2f2', color: '#ef4444',
                                cursor: 'pointer', fontSize: 11, fontWeight: 600,
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== ACADEMIC TAB ===== */}
            {activeTab === 'academic' && (
              <div>
                {/* Current session */}
                <div style={{
                  background: '#f9fafb', borderRadius: 12, padding: 20, marginBottom: 24,
                  border: '1px solid #e5e7eb',
                }}>
                  <h2 style={{ marginBottom: 16, fontSize: 16 }}>Current Academic Session</h2>
                  {academic ? (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
                        {[
                          { label: 'Session', value: academic.session },
                          { label: 'Semester', value: `Semester ${academic.semester}` },
                          { label: 'Status', value: academic.isActive ? '🟢 Active' : '🔴 Inactive' },
                          { label: 'Promotion', value: academic.promotionDone ? '✅ Done' : '⏳ Pending' },
                        ].map(item => (
                          <div key={item.label} style={{ background: 'white', borderRadius: 8, padding: '12px 16px', border: '1px solid #e5e7eb' }}>
                            <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{item.label}</p>
                            <p style={{ fontWeight: 700, color: '#1f2937', fontSize: 14 }}>{item.value}</p>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button className="btn-outline" onClick={handleNextSemester}>→ Next Semester</button>
                        <button
                          className="btn-primary"
                          onClick={handlePromote}
                          disabled={academic.promotionDone}
                          style={{ opacity: academic.promotionDone ? 0.5 : 1 }}
                        >
                          🎓 Promote Students
                        </button>
                      </div>
                      {academicMessage && (
                        <div className={academicMessage.includes('success') || academicMessage.includes('complete') ? 'alert alert-success' : 'alert alert-error'} style={{ marginTop: 12 }}>
                          {academicMessage}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ color: '#9ca3af' }}>No active session. Create one below.</p>
                  )}
                </div>

                {/* Create session */}
                <div style={{ background: '#f9fafb', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                  <h2 style={{ marginBottom: 16, fontSize: 16 }}>Create New Session</h2>
                  <form onSubmit={handleCreateSession}>
                    <label>Session Name</label>
                    <input type="text" placeholder="e.g. 2025/2026" value={sessionName} onChange={e => setSessionName(e.target.value)} required />
                    <label>Starting Semester</label>
                    <select value={semester} onChange={e => setSemester(e.target.value)}>
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                    </select>
                    <button type="submit" className="btn-primary" disabled={academicSubmitting} style={{ marginTop: 16 }}>
                      {academicSubmitting ? 'Creating...' : 'Create Session'}
                    </button>
                  </form>
                  {academicMessage && (
                    <div className={academicMessage.includes('success') ? 'alert alert-success' : 'alert alert-error'} style={{ marginTop: 12 }}>
                      {academicMessage}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}