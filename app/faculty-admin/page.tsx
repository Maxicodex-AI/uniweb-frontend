'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthToken } from '../utils/auth'

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
  avatarColor: string
}

interface Department {
  _id: string
  name: string
  faculty: string
  maxLevel: number
}

export default function FacultyAdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

 const [users, setUsers] = useState<User[]>([])
 const [departments, setDepartments] = useState<Department[]>([])

 const allStaff = users.filter(u => u.role !== 'student')

  const [deptName, setDeptName] = useState('')
  const [deptMaxLevel, setDeptMaxLevel] = useState('400')
  const [deptMessage, setDeptMessage] = useState('')
  const [deptSubmitting, setDeptSubmitting] = useState(false)

  const token = getAuthToken()

  const [faStudentDept, setFaStudentDept] = useState('')
  const [faStudentLevel, setFaStudentLevel] = useState('')

  const students = users.filter(u => u.role === 'student')
  const lecturers = users.filter(u => u.role === 'lecturer' || u.role === 'faculty_admin')

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

  const faFilteredStudents = students.filter(u => {
    if (faStudentDept && u.department !== faStudentDept) return false
    if (faStudentLevel && u.level !== faStudentLevel) return false
    return true
  })

  useEffect(() => {
    const check = async () => {
      if (!token) { router.push('/login'); return }
      const res = await fetch(`${API_BASE}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.role !== 'faculty_admin') { router.push('/dashboard'); return }
      setCurrentUser(data)
      setAuthChecked(true)
      await loadAll(data)
    }
    check()
  }, [])

  const loadAll = async (admin: User) => {
    if (!token) return
    setLoading(true)
    try {
      const [usersRes, deptsRes] = await Promise.all([
        fetch(`${API_BASE}/api/users/all`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/departments`),
      ])
      const usersData = await usersRes.json()
      const deptsData = await deptsRes.json()

      const facultyUsers = Array.isArray(usersData)
        ? usersData.filter((u: User) => u.faculty === admin.faculty)
        : []
      const facultyDepts = Array.isArray(deptsData)
        ? deptsData.filter((d: Department) => d.faculty === admin.faculty)
        : []

      setUsers(facultyUsers)
      setDepartments(facultyDepts)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault()
    setDeptSubmitting(true)
    setDeptMessage('')
    try {
      const res = await fetch(`${API_BASE}/api/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: deptName,
          faculty: currentUser?.faculty,
          maxLevel: parseInt(deptMaxLevel),
        }),
      })
      if (res.ok) {
        setDeptMessage('Department created successfully!')
        setDeptName('')
        setDeptMaxLevel('400')
        if (currentUser) await loadAll(currentUser)
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

  const toggleHostPermission = async (userId: string, current: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/host-permission`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ canHostLive: !current }),
      })
      if (res.ok && currentUser) await loadAll(currentUser)
    } catch (err) { console.error(err) }
  }

  // ===== PROMOTE TO DEPT ADMIN =====
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
      if (res.ok && currentUser) await loadAll(currentUser)
      else { const d = await res.json(); alert(d.message) }
    } catch (err) { console.error(err) }
  }

  // ===== DEMOTE DEPT ADMIN =====
  const demoteDeptAdmin = async (userId: string) => {
    if (!confirm('Remove department admin status?')) return
    try {
      const res = await fetch(
        `${API_BASE}/api/users/${userId}/demote-department-admin`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        }
      )
      if (res.ok && currentUser) await loadAll(currentUser)
      else { const d = await res.json(); alert(d.message) }
    } catch (err) { console.error(err) }
  }

  if (!authChecked || loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🛡️</div>
        <p style={{ color: '#4b5563' }}>Loading faculty panel...</p>
      </div>
    </div>
  )

  const tabStyle = (tab: string): React.CSSProperties => ({
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
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)',
        padding: '40px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -80, top: -80, width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(167,139,250,0.15)' }} />
        <div style={{ position: 'absolute', right: -40, top: -40, width: 220, height: 220, borderRadius: '50%', border: '1px solid rgba(167,139,250,0.1)' }} />

        <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)',
                borderRadius: 999, padding: '3px 12px', marginBottom: 8,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }} />
                <span style={{ color: '#c4b5fd', fontSize: 12, fontWeight: 600 }}>Faculty Admin</span>
              </div>
              <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
                🛡️ Faculty Admin Panel
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                Managing — {currentUser?.faculty}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 12,
            marginTop: 32,
          }}>
            {[
              { label: 'Students', value: students.length, icon: '🎓', color: '#34d399' },
              { label: 'Lecturers', value: lecturers.length, icon: '👨‍🏫', color: '#60a5fa' },
              { label: 'Dept Admins', value: users.filter(u => u.role === 'department_admin').length, icon: '🏛️', color: '#a78bfa' },
              { label: 'Departments', value: departments.length, icon: '📂', color: '#f472b6' },
              { label: 'Host Permitted', value: students.filter(s => s.canHostLive).length, icon: '🎙️', color: '#fbbf24' },
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

        <div style={{
          background: 'white', borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}>

          {/* Tab bar */}
          <div style={{
            borderBottom: '1px solid #f3f4f6',
            display: 'flex', overflowX: 'auto', padding: '0 8px',
          }}>
            {[
              { key: 'overview', label: '📊 Overview' },
              { key: 'all_staff', label: '👥 All Staff' },
              { key: 'students', label: '🎓 Students' },
              { key: 'departments', label: '🏛️ Departments' },
              { key: 'hosts', label: '🎙️ Host Permissions' },
              { key: 'learning', label: '🎓 Learning Hub' },
            ].map(tab => (
              <button key={tab.key} style={tabStyle(tab.key)} onClick={() => setActiveTab(tab.key)}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 24 }}>

            {/* ===== OVERVIEW ===== */}
            {activeTab === 'overview' && (
              <div>
                <h2 style={{ marginBottom: 20, fontSize: 16 }}>
                  Faculty Overview — {currentUser?.faculty}
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 16,
                }}>
                  {departments.map(dept => {
                    const deptStudents = students.filter(s => s.department === dept.name)
                    const deptLecturers = lecturers.filter(l => l.department === dept.name)
                    return (
                      <div key={dept._id} style={{
                        background: '#f9fafb', borderRadius: 12, padding: 20,
                        border: '1px solid #e5e7eb',
                      }}>
                        <h3 style={{ fontSize: 14, marginBottom: 12, color: '#1f2937' }}>
                          {dept.name}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {[
                            { label: '🎓 Students', value: deptStudents.length },
                            { label: '👨‍🏫 Lecturers', value: deptLecturers.length },
                            { label: '📚 Max Level', value: `${dept.maxLevel}L` },
                          ].map(item => (
                            <div key={item.label} style={{
                              display: 'flex', justifyContent: 'space-between',
                              fontSize: 13,
                            }}>
                              <span style={{ color: '#6b7280' }}>{item.label}</span>
                              <span style={{ fontWeight: 700, color: '#1f2937' }}>{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}


            {/* ===== STUDENTS TAB ===== */}
            {activeTab === 'students' && (
              <div>
                <h2 style={{ marginBottom: 16, fontSize: 16 }}>
                  Students in {currentUser?.faculty} ({students.length})
                </h2>

                {/* Department → Level filter */}
                <div style={{
                  background: '#f9fafb', borderRadius: 12, padding: 16,
                  marginBottom: 16, border: '1px solid #e5e7eb',
                }}>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Department</label>
                      <select
                        value={faStudentDept}
                        onChange={e => { setFaStudentDept(e.target.value); setFaStudentLevel('') }}
                        style={{ marginTop: 4 }}
                      >
                        <option value="">All Departments</option>
                        {[...new Set(students.map(s => s.department).filter(Boolean))].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1, minWidth: 100 }}>
                      <label style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Level</label>
                      <select
                        value={faStudentLevel}
                        onChange={e => setFaStudentLevel(e.target.value)}
                        disabled={!faStudentDept}
                        style={{ marginTop: 4 }}
                      >
                        <option value="">All Levels</option>
                        {[...new Set(
                          students.filter(s => !faStudentDept || s.department === faStudentDept)
                            .map(s => s.level).filter(Boolean)
                        )].sort().map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                    {(faStudentDept || faStudentLevel) && (
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button
                          onClick={() => { setFaStudentDept(''); setFaStudentLevel('') }}
                          style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                  Showing {faFilteredStudents.length} student{faFilteredStudents.length !== 1 ? 's' : ''}
                </p>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        {['Student', 'Department', 'Level', 'Status'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {faFilteredStudents.map(u => (
                        <tr key={u._id} style={{ borderBottom: '1px solid #f9fafb' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: u.avatarColor || '#16a34a',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: 12, fontWeight: 700,
                              }}>{getInitials(u.name)}</div>
                              <div>
                                <div style={{ fontWeight: 600 }}>{u.name}</div>
                                <div style={{ fontSize: 11, color: '#9ca3af' }}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px', color: '#4b5563', fontSize: 12 }}>{u.department}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                              {u.level}
                            </span>
                          </td>
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
                      {faFilteredStudents.length === 0 && (
                        <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>No students found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ===== ALL STAFF TAB ===== */}
            {activeTab === 'all_staff' && (
              <div>
                <h2 style={{ marginBottom: 16, fontSize: 16 }}>
                  All Staff in {currentUser?.faculty} ({allStaff.length})
                </h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        {['Name', 'Department', 'Role', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allStaff.map(u => (
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
                          <td style={{ padding: '12px', color: '#4b5563', fontSize: 12 }}>{u.department}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              background: u.role === 'faculty_admin' ? '#f5f3ff' : u.role === 'department_admin' ? '#eff6ff' : '#f0fdf4',
                              color: u.role === 'faculty_admin' ? '#7c3aed' : u.role === 'department_admin' ? '#2563eb' : '#16a34a',
                              padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                            }}>
                              {u.role === 'faculty_admin' ? '🛡️ Faculty Admin' : u.role === 'department_admin' ? '🏛️ Dept Admin' : '👨‍🏫 Lecturer'}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {u.role === 'lecturer' && (
                                <button onClick={() => promoteToDeptAdmin(u._id)} style={{
                                  padding: '3px 8px', borderRadius: 6, border: 'none',
                                  cursor: 'pointer', background: '#eff6ff', color: '#2563eb',
                                  fontWeight: 600, fontSize: 11,
                                }}>Make Dept Admin</button>
                              )}
                              {u.role === 'department_admin' && (
                                <button onClick={() => demoteDeptAdmin(u._id)} style={{
                                  padding: '3px 8px', borderRadius: 6, border: 'none',
                                  cursor: 'pointer', background: '#fef2f2', color: '#dc2626',
                                  fontWeight: 600, fontSize: 11,
                                }}>Remove</button>
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

            {/* ===== DEPARTMENTS TAB ===== */}
            {activeTab === 'departments' && (
              <div>
                <h2 style={{ fontSize: 16, marginBottom: 16 }}>
                  Departments in {currentUser?.faculty} ({departments.length})
                </h2>

                {departments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🏛️</div>
                    <p>No departments yet under your faculty.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                    {departments.map((dept: any) => {
                      const learningTypeLabels: Record<string, { label: string; icon: string; color: string }> = {
                        language_linguistics: { label: 'Language & Linguistics', icon: '🗣️', color: '#7c3aed' },
                        science_medicine: { label: 'Science & Medicine', icon: '🔬', color: '#0891b2' },
                        arts_performance: { label: 'Arts & Performance', icon: '🎭', color: '#be185d' },
                        agriculture_environment: { label: 'Agriculture', icon: '🌱', color: '#16a34a' },
                        engineering_technology: { label: 'Engineering & Tech', icon: '⚙️', color: '#2563eb' },
                        business_economics: { label: 'Business & Economics', icon: '💼', color: '#d97706' },
                        journalism_media: { label: 'Journalism & Media', icon: '📰', color: '#dc2626' },
                        general_studies: { label: 'General Studies', icon: '📚', color: '#16a34a' },
                      }
                      const typeInfo = learningTypeLabels[dept.learningType] || { label: 'General', icon: '📚', color: '#16a34a' }
                      return (
                        <div key={dept._id} style={{
                          background: 'white', borderRadius: 12, padding: 18,
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        }}>
                          {/* Dept header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1f2937', margin: 0 }}>
                              {dept.name}
                            </h3>
                            <span style={{
                              background: typeInfo.color + '15',
                              color: typeInfo.color,
                              padding: '2px 8px', borderRadius: 999,
                              fontSize: 11, fontWeight: 700,
                            }}>
                              {typeInfo.icon} {typeInfo.label}
                            </span>
                          </div>

                          {dept.description && (
                            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 10, lineHeight: 1.4 }}>
                              {dept.description}
                            </p>
                          )}

                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                            <span style={{
                              background: '#f3f4f6', color: '#374151',
                              padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                            }}>
                              🎓 Max {dept.maxLevel}L
                            </span>
                            <span style={{
                              background: '#f0fdf4', color: '#16a34a',
                              padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                            }}>
                              {users.filter(u => u.role === 'student' && u.department === dept.name).length} students
                            </span>
                          </div>

                          {dept.departmentAdmin ? (
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '8px 10px', background: '#eff6ff',
                              borderRadius: 8, fontSize: 12, color: '#2563eb', fontWeight: 600,
                            }}>
                              🏛️ {dept.departmentAdmin?.name || 'Admin assigned'}
                            </div>
                          ) : (
                            <div style={{
                              padding: '8px 10px', background: '#fef3c7',
                              borderRadius: 8, fontSize: 12, color: '#92400e', fontWeight: 600,
                            }}>
                              ⚠️ No department admin assigned
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}


            {/* ===== HOST PERMISSIONS ===== */}
            {activeTab === 'hosts' && (
              <div>
                <div className="alert alert-success" style={{ marginBottom: 20 }}>
                  Grant up to <strong>2 students per department</strong> the ability to host live sessions.
                </div>
                <h2 style={{ marginBottom: 16, fontSize: 16 }}>Students ({students.length})</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        {['Student', 'Department', 'Level', 'Can Host Live'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(u => {
                        const deptHostCount = students.filter(s => s.department === u.department && s.faculty === u.faculty && s.canHostLive).length
                        const canGrant = u.canHostLive || deptHostCount < 2
                        return (
                          <tr key={u._id} style={{ borderBottom: '1px solid #f9fafb' }}>
                            <td style={{ padding: '12px' }}>
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
                            <td style={{ padding: '12px', color: '#4b5563', fontSize: 12 }}>{u.department}</td>
                            <td style={{ padding: '12px', color: '#4b5563', fontSize: 12 }}>{u.level}</td>
                            <td style={{ padding: '12px' }}>
                              <button
                                onClick={() => toggleHostPermission(u._id, u.canHostLive)}
                                disabled={!canGrant}
                                style={{
                                  padding: '4px 12px', borderRadius: 6, border: 'none',
                                  cursor: canGrant ? 'pointer' : 'not-allowed',
                                  fontSize: 12, fontWeight: 600,
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
              </div>
            )}

                        {/* ===== LEARNING HUB ANALYTICS TAB ===== */}
            {activeTab === 'learning' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 16, margin: 0 }}>Learning Hub Analytics</h2>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
                      Overview of learning activity across all departments in {currentUser?.faculty}
                    </p>
                  </div>
                </div>

                {/* Faculty summary stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
                  {[
                    { label: 'Total Students', value: students.length, icon: '🎓', color: '#16a34a', bg: '#f0fdf4' },
                    { label: 'Total Lecturers', value: lecturers.length, icon: '👨‍🏫', color: '#2563eb', bg: '#eff6ff' },
                    { label: 'Departments', value: departments.length, icon: '🏛️', color: '#7c3aed', bg: '#f5f3ff' },
                    { label: 'Dept Admins', value: users.filter((u: any) => u.role === 'department_admin').length, icon: '⚙️', color: '#d97706', bg: '#fffbeb' },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      background: stat.bg, borderRadius: 12, padding: '16px',
                      border: `1px solid ${stat.color}20`,
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{ fontSize: 24 }}>{stat.icon}</div>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Department breakdown */}
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Department Breakdown</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {departments.map((dept: any) => {
                    const deptStudents = students.filter((s: any) => s.department === dept.name)
                    const deptLecturers = lecturers.filter((l: any) => l.department === dept.name)
                    const LEARNING_TYPE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
                      language_linguistics: { icon: '🗣️', label: 'Language & Linguistics', color: '#7c3aed' },
                      science_medicine: { icon: '🔬', label: 'Science & Medicine', color: '#0891b2' },
                      arts_performance: { icon: '🎭', label: 'Arts & Performance', color: '#be185d' },
                      agriculture_environment: { icon: '🌱', label: 'Agriculture', color: '#16a34a' },
                      engineering_technology: { icon: '⚙️', label: 'Engineering & Tech', color: '#2563eb' },
                      business_economics: { icon: '💼', label: 'Business & Economics', color: '#d97706' },
                      journalism_media: { icon: '📰', label: 'Journalism & Media', color: '#dc2626' },
                      general_studies: { icon: '📚', label: 'General Studies', color: '#16a34a' },
                    }
                    const typeConfig = LEARNING_TYPE_CONFIG[dept.learningType] || LEARNING_TYPE_CONFIG.general_studies

                    return (
                      <div key={dept._id} style={{
                        background: 'white', borderRadius: 14,
                        border: '1px solid #e5e7eb',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      }}>
                        {/* Dept header */}
                        <div style={{
                          background: typeConfig.color,
                          padding: '14px 20px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 20 }}>{typeConfig.icon}</span>
                            <div>
                              <div style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>{dept.name}</div>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{typeConfig.label}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{deptStudents.length}</div>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>Students</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{deptLecturers.length}</div>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>Lecturers</div>
                            </div>
                          </div>
                        </div>

                        {/* Dept body */}
                        <div style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 12 }}>

                            {/* Students by level */}
                            {[...new Set(deptStudents.map((s: any) => s.level).filter(Boolean))].sort().map(level => (
                              <div key={level as string} style={{
                                background: typeConfig.color + '10',
                                borderRadius: 8, padding: '8px 12px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{level as string}</span>
                                <span style={{ fontSize: 14, fontWeight: 800, color: typeConfig.color }}>
                                  {deptStudents.filter((s: any) => s.level === level).length}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {/* Dept admin */}
                            <div style={{ fontSize: 12 }}>
                              {dept.departmentAdmin ? (
                                <span style={{ color: '#2563eb', fontWeight: 600 }}>
                                  🏛️ {dept.departmentAdmin?.name || 'Admin assigned'}
                                </span>
                              ) : (
                                <span style={{ color: '#d97706', fontWeight: 600 }}>
                                  ⚠️ No department admin
                                </span>
                              )}
                            </div>

                            {/* Max level */}
                            <span style={{
                              background: typeConfig.color + '15',
                              color: typeConfig.color,
                              padding: '3px 10px', borderRadius: 999,
                              fontSize: 11, fontWeight: 700,
                            }}>
                              Up to {dept.maxLevel}L
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {departments.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', background: '#f9fafb', borderRadius: 12 }}>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>🎓</div>
                      <p>No departments set up yet in your faculty.</p>
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