'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SkeletonCourse } from '../components/Skeleton'
import { getAuthToken } from '../utils/auth'

interface Course {
  _id: string
  code: string
  title: string
  description: string
  lecturers: { _id: string; name: string; avatarColor?: string }[]
  offerings: { faculty: string; department: string; level: string }[]
}

interface Enrollment {
  _id: string
  course: Course
  overallProgress: number
  currentLesson: { title: string; weekNumber: number } | null
  completedLessons: string[]
}

interface Streak {
  currentStreak: number
  longestStreak: number
  weeklyActivity: boolean[]
  totalStudyDays: number
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export default function LearningHubPage() {
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [streak, setStreak] = useState<Streak | null>(null)
  const [deptLearningType, setDeptLearningType] = useState('general_studies')
  const [deptInfo, setDeptInfo] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'my-courses' | 'explore'>('my-courses')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    const token = getAuthToken()
    if (!token) return

    const setup = async () => {
      try {
        // Get user
        const userRes = await fetch(`${API_BASE}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const userData = await userRes.json()
        setUser(userData)

                // Get department learning type
                if (userData.faculty && userData.department) {
          console.log('Fetching dept for:', userData.faculty, userData.department)
          const deptRes = await fetch(
            `${API_BASE}/api/departments/profile?faculty=${encodeURIComponent(userData.faculty)}&name=${encodeURIComponent(userData.department)}`
          )
          if (deptRes.ok) {
            const deptData = await deptRes.json()
            console.log('Dept data:', deptData)
            setDeptLearningType(deptData.learningType || 'general_studies')
            setDeptInfo(deptData)
          } else {
            console.log('Dept fetch failed:', deptRes.status)
          }
        }

        // Get enrollments
        const enrollRes = await fetch(`${API_BASE}/api/courses/my-enrollments`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const enrollData = await enrollRes.json()
        setEnrollments(Array.isArray(enrollData) ? enrollData : [])

        // Get available courses
        const coursesRes = await fetch(`${API_BASE}/api/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const coursesData = await coursesRes.json()
        setAvailableCourses(Array.isArray(coursesData) ? coursesData : [])

        // Check if student needs onboarding
      if (userData.role === 'student' && enrollData.length === 0 && coursesData.length > 0) {
        setShowOnboarding(true)
      }

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    setup()
  }, [])

  const getInitials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  
  const handleBulkEnroll = async () => {
    if (selectedCourses.length === 0) return
    setEnrolling(true)
    const token = getAuthToken()
    if (!token) return
    try {
      await Promise.all(
        selectedCourses.map(courseId =>
          fetch(`${API_BASE}/api/courses/${courseId}/enroll`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      )
      // Reload enrollments
      const enrollRes = await fetch(`${API_BASE}/api/courses/my-enrollments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const enrollData = await enrollRes.json()
      setEnrollments(Array.isArray(enrollData) ? enrollData : [])
      setShowOnboarding(false)
    } catch (err) {
      console.error(err)
    } finally {
      setEnrolling(false)
    }
  }

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  const getCourseColor = (code: string) => {
    const colors = ['#16a34a', '#2563eb', '#7c3aed', '#d97706', '#dc2626', '#0891b2']
    const index = code.charCodeAt(0) % colors.length
    return colors[index]
  }

  const enrolledCourseIds = enrollments.map(e => e.course?._id)
  const unenrolledCourses = availableCourses.filter(c => !enrolledCourseIds.includes(c._id))

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  if (loading) return <SkeletonCourse />

  return (
    <>
    {/* ===== ONBOARDING MODAL ===== */}
      {showOnboarding && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            background: 'white', borderRadius: 20,
            width: '100%', maxWidth: 560,
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          }}>

            {/* Modal header */}
            <div style={{
              background: 'linear-gradient(135deg, #052e16, #16a34a)',
              padding: '28px 28px 20px',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎓</div>
              <h2 style={{ color: 'white', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
                Welcome to Learning Hub!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                Select the courses you're offering this semester to get started.
              </p>
            </div>

            <div style={{ padding: 24 }}>

              {availableCourses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
                  <h3 style={{ marginBottom: 8 }}>No courses available yet</h3>
                  <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
                    Your department admin hasn't added any courses yet. Check back later.
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => setShowOnboarding(false)}
                  >
                    Continue Anyway
                  </button>
                </div>
              ) : (
                <>
                  <p style={{ color: '#4b5563', fontSize: 14, marginBottom: 16 }}>
                    {selectedCourses.length} of {availableCourses.length} courses selected
                  </p>

                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: 8,
                    maxHeight: 320, overflowY: 'auto', marginBottom: 20,
                  }}>
                    {availableCourses.map(course => {
                      const selected = selectedCourses.includes(course._id)
                      const color = getCourseColor(course.code)
                      return (
                        <div
                          key={course._id}
                          onClick={() => toggleCourseSelection(course._id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                            border: selected ? `2px solid ${color}` : '2px solid #e5e7eb',
                            background: selected ? color + '10' : 'white',
                            transition: 'all 0.15s',
                          }}
                        >
                          {/* Checkbox */}
                          <div style={{
                            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                            background: selected ? color : 'white',
                            border: selected ? `2px solid ${color}` : '2px solid #d1d5db',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {selected && <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>✓</span>}
                          </div>

                          {/* Course info */}
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                              <span style={{
                                fontSize: 11, fontWeight: 700, color: color,
                                background: color + '15', padding: '1px 6px', borderRadius: 4,
                              }}>
                                {course.code}
                              </span>
                              {course.offerings?.[0]?.level && (
                                <span style={{ fontSize: 11, color: '#9ca3af' }}>
                                  {course.offerings[0].level}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                              {course.title}
                            </div>
                            {course.lecturers?.[0] && (
                              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                                👨‍🏫 {course.lecturers[0].name}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => setShowOnboarding(false)}
                      style={{
                        flex: 1, padding: '12px', borderRadius: 10,
                        border: '1px solid #e5e7eb', background: 'white',
                        cursor: 'pointer', fontSize: 14, color: '#6b7280',
                      }}
                    >
                      Skip for now
                    </button>
                    <button
                      onClick={handleBulkEnroll}
                      disabled={selectedCourses.length === 0 || enrolling}
                      style={{
                        flex: 2, padding: '12px', borderRadius: 10,
                        border: 'none', cursor: selectedCourses.length === 0 ? 'not-allowed' : 'pointer',
                        background: selectedCourses.length === 0 ? '#e5e7eb' : '#16a34a',
                        color: selectedCourses.length === 0 ? '#9ca3af' : 'white',
                        fontSize: 14, fontWeight: 700,
                      }}
                    >
                      {enrolling ? 'Enrolling...' : `Enroll in ${selectedCourses.length} Course${selectedCourses.length !== 1 ? 's' : ''} →`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>
      {/* ===== HERO ===== */}
      <div style={{
        background: 'linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%)',
        padding: '40px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -80, top: -80, width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(34,197,94,0.15)' }} />

        <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: 999, padding: '3px 12px', marginBottom: 8,
              }}>
                <span style={{ color: '#86efac', fontSize: 12, fontWeight: 600 }}>🎓 Learning Hub</span>
              </div>
              <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
                Your Academic Journey
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                Learn, practice, and grow — at your own peace
              </p>
            </div>

            {/* Learning streak */}
            <div style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 16, padding: '16px 20px',
              minWidth: 200,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>🔥</span>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#4ade80' }}>
                    {streak?.currentStreak || 0}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>day streak</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {days.map((day, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: streak?.weeklyActivity?.[i] ? '#16a34a' : 'rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: 'white', fontWeight: 600, marginBottom: 2,
                    }}>
                      {streak?.weeklyActivity?.[i] ? '✓' : ''}
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{day}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12, marginTop: 28,
          }}>
            {[
              { label: 'Enrolled Courses', value: enrollments.length, icon: '📚', color: '#34d399' },
              { label: 'Completed Lessons', value: enrollments.reduce((a, e) => a + e.completedLessons.length, 0), icon: '✅', color: '#60a5fa' },
              { label: 'Study Days', value: streak?.totalStudyDays || 0, icon: '📅', color: '#fbbf24' },
              { label: 'Longest Streak', value: `${streak?.longestStreak || 0}d`, icon: '🏆', color: '#f472b6' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12, padding: '14px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div style={{ maxWidth: 960, margin: '-40px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>

        {user?.role === 'student' ? (
          <StudentHub
            user={user}
            deptLearningType={deptLearningType}
            deptInfo={deptInfo}
            enrollments={enrollments}
            availableCourses={availableCourses}
            getCourseColor={getCourseColor}
            getInitials={getInitials}
          />
        ) : (
          <StaffHub
            user={user}
            enrollments={enrollments}
            availableCourses={availableCourses}
            unenrolledCourses={unenrolledCourses}
            streak={streak}
            getCourseColor={getCourseColor}
            getInitials={getInitials}
          />
        )}

      </div>
    </div>
    </>
  )
}

const LEARNING_TYPE_CONFIG: Record<string, {
  icon: string
  label: string
  color: string
  bg: string
  border: string
  tools: { icon: string; label: string; desc: string; href: string }[]
  description: string
}> = {
  language_linguistics: {
    icon: '🗣️',
    label: 'Language & Linguistics',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    description: 'Your learning hub is tailored for language study — pronunciation, phonetics, syntax and more.',
    tools: [
      { icon: '🎧', label: 'Audio Pronunciation', desc: 'Listen and practice pronunciation', href: '/learning-hub/tools/pronunciation' },
      { icon: '🔤', label: 'Phonetics Trainer', desc: 'Learn phonetic symbols and sounds', href: '/learning-hub/tools/phonetics' },
      { icon: '🧩', label: 'Syntax Builder', desc: 'Practice sentence structure', href: '/learning-hub/tools/syntax' },
      { icon: '🌍', label: 'Language Lab', desc: 'Immersive language learning', href: '/learning-hub/tools/language-lab' },
    ],
  },
  science_medicine: {
    icon: '🔬',
    label: 'Science & Medicine',
    color: '#0891b2',
    bg: '#ecfeff',
    border: '#a5f3fc',
    description: 'Your learning hub is tailored for scientific study — diagrams, case studies, lab work and research.',
    tools: [
      { icon: '🧬', label: 'Diagram Lab', desc: 'Label and study scientific diagrams', href: '/learning-hub/tools/diagrams' },
      { icon: '📋', label: 'Case Studies', desc: 'Analyze real medical/science cases', href: '/learning-hub/tools/cases' },
      { icon: '🧪', label: 'Virtual Lab', desc: 'Simulate lab experiments', href: '/learning-hub/tools/lab' },
      { icon: '📊', label: 'Data Analysis', desc: 'Analyze scientific data', href: '/learning-hub/tools/data' },
    ],
  },
  arts_performance: {
    icon: '🎭',
    label: 'Arts & Performance',
    color: '#be185d',
    bg: '#fdf2f8',
    border: '#f9a8d4',
    description: 'Your learning hub is tailored for arts — scripts, performance notes, critique and creative work.',
    tools: [
      { icon: '📜', label: 'Script Reader', desc: 'Study and annotate scripts', href: '/learning-hub/tools/scripts' },
      { icon: '🎬', label: 'Performance Notes', desc: 'Record performance observations', href: '/learning-hub/tools/performance' },
      { icon: '🖼️', label: 'Art Critique', desc: 'Analyse and critique artworks', href: '/learning-hub/tools/critique' },
      { icon: '🎵', label: 'Creative Studio', desc: 'Creative writing and expression', href: '/learning-hub/tools/studio' },
    ],
  },
  agriculture_environment: {
    icon: '🌱',
    label: 'Agriculture & Environment',
    color: '#15803d',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    description: 'Your learning hub is tailored for agriculture — crop science, soil analysis, farming techniques.',
    tools: [
      { icon: '🌾', label: 'Crop Identifier', desc: 'Identify and learn about crops', href: '/learning-hub/tools/crops' },
      { icon: '🪱', label: 'Soil Analysis', desc: 'Study soil types and properties', href: '/learning-hub/tools/soil' },
      { icon: '📅', label: 'Season Planner', desc: 'Plan farming seasons and activities', href: '/learning-hub/tools/planner' },
      { icon: '🌿', label: 'Field Notes', desc: 'Document field observations', href: '/learning-hub/tools/field' },
    ],
  },
  engineering_technology: {
    icon: '⚙️',
    label: 'Engineering & Technology',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    description: 'Your learning hub is tailored for engineering — code, circuits, problem solving and technical design.',
    tools: [
      { icon: '💻', label: 'Code Sandbox', desc: 'Write and run code', href: '/learning-hub/tools/sandbox' },
      { icon: '⚡', label: 'Circuit Designer', desc: 'Design and simulate circuits', href: '/learning-hub/tools/circuits' },
      { icon: '📐', label: 'Engineering Calc', desc: 'Technical calculations', href: '/learning-hub/tools/calc' },
      { icon: '🔧', label: 'Problem Sets', desc: 'Engineering problem practice', href: '/learning-hub/tools/problems' },
    ],
  },
  business_economics: {
    icon: '💼',
    label: 'Business & Economics',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    description: 'Your learning hub is tailored for business — case studies, financial analysis, market research.',
    tools: [
      { icon: '📈', label: 'Market Analyser', desc: 'Study market trends and data', href: '/learning-hub/tools/market' },
      { icon: '💰', label: 'Financial Calc', desc: 'Financial calculations and models', href: '/learning-hub/tools/finance' },
      { icon: '🏢', label: 'Business Cases', desc: 'Analyse real business cases', href: '/learning-hub/tools/business' },
      { icon: '📊', label: 'Economics Lab', desc: 'Economic data and analysis', href: '/learning-hub/tools/economics' },
    ],
  },
  journalism_media: {
    icon: '📰',
    label: 'Journalism & Media',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    description: 'Your learning hub is tailored for media — journalism writing, broadcast skills, media analysis.',
    tools: [
      { icon: '✍️', label: 'Article Writer', desc: 'Practice journalism writing', href: '/learning-hub/tools/writing' },
      { icon: '📡', label: 'Broadcast Studio', desc: 'Broadcast skills and scripts', href: '/learning-hub/tools/broadcast' },
      { icon: '🎙️', label: 'Interview Prep', desc: 'Practice interview techniques', href: '/learning-hub/tools/interview' },
      { icon: '📱', label: 'Media Analysis', desc: 'Analyse media and news', href: '/learning-hub/tools/media' },
    ],
  },
  general_studies: {
    icon: '📚',
    label: 'General Studies',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    description: 'Your standard learning hub with notes, quizzes, videos and coding sandbox.',
    tools: [],
  },
}

function LearningTypeBanner({ learningType, department }: { learningType: string; department: string }) {
  const config = LEARNING_TYPE_CONFIG[learningType] || LEARNING_TYPE_CONFIG.general_studies
  if (learningType === 'general_studies') return null

  return (
    <div style={{
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: 14, padding: '20px 24px',
      marginBottom: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: 'white', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          {config.icon}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: config.color, marginBottom: 2 }}>
            {department.toUpperCase()} • LEARNING ENVIRONMENT
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1f2937', margin: 0 }}>
            {config.label} Hub
          </h3>
        </div>
      </div>

      <p style={{ fontSize: 13, color: '#4b5563', marginBottom: 16, lineHeight: 1.5 }}>
        {config.description}
      </p>

      {/* Department-specific tools */}
      {config.tools.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Specialised Learning Tools
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
            {config.tools.map(tool => (
              <div
                key={tool.label}
                style={{
                  background: 'white',
                  border: `1px solid ${config.border}`,
                  borderRadius: 10, padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}
                onClick={() => window.location.href = tool.href}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{tool.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1f2937', marginBottom: 2 }}>
                    {tool.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.3 }}>
                    {tool.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coming soon note for unbuilt tools */}
      <div style={{
        marginTop: 12, padding: '8px 12px',
        background: 'rgba(255,255,255,0.6)',
        borderRadius: 8, fontSize: 11, color: '#9ca3af',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span>🚧</span>
        <span>More specialised tools for {config.label} are coming soon. Your courses and lessons are available below.</span>
      </div>
    </div>
  )
}

// ===== STUDENT HUB =====
function StudentHub({ user, deptLearningType, deptInfo, enrollments, availableCourses, getCourseColor, getInitials }: any) {
  const [activeSection, setActiveSection] = useState<'tools' | 'courses' | 'explore'>('tools')

  const LEARNING_TYPE_CONFIG: Record<string, {
    icon: string; label: string; color: string; bg: string; border: string
    tools: { icon: string; label: string; desc: string; href: string; available: boolean }[]
    description: string
  }> = {
    language_linguistics: {
      icon: '🗣️', label: 'Language & Linguistics', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
      description: 'Master pronunciation, phonetics, syntax and language skills.',
      tools: [
        { icon: '🎧', label: 'Pronunciation Trainer', desc: 'Listen and practice in 10 languages', href: '/learning-hub/tools/pronunciation', available: true },
        { icon: '🔤', label: 'Phonetics Trainer', desc: 'Learn IPA symbols and sounds', href: '/learning-hub/tools/phonetics', available: true },
        { icon: '🧩', label: 'Syntax Builder', desc: 'Practice sentence structure', href: '/learning-hub/tools/syntax', available: true },
        { icon: '🌍', label: 'Language Lab', desc: 'Vocabulary, flashcards and quizzes', href: '/learning-hub/tools/language-lab', available: true },
      ],
    },
    science_medicine: {
      icon: '🔬', label: 'Science & Medicine', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc',
      description: 'Explore diagrams, case studies and scientific concepts.',
      tools: [
        { icon: '🧬', label: 'Diagram Lab', desc: 'Label and study diagrams', href: '/learning-hub/tools/diagrams', available: true },
        { icon: '📋', label: 'Case Studies', desc: 'Analyse real cases', href: '/learning-hub/tools/cases', available: false },
        { icon: '🧪', label: 'Virtual Lab', desc: 'Simulate experiments', href: '/learning-hub/tools/lab', available: false },
        { icon: '📊', label: 'Data Analysis', desc: 'Analyse scientific data', href: '/learning-hub/tools/data', available: false },
      ],
    },
    arts_performance: {
      icon: '🎭', label: 'Arts & Performance', color: '#be185d', bg: '#fdf2f8', border: '#f9a8d4',
      description: 'Scripts, performance notes and creative expression.',
      tools: [
        { icon: '📜', label: 'Script Reader', desc: 'Study and annotate scripts', href: '/learning-hub/tools/scripts', available: true },
        { icon: '🎬', label: 'Performance Notes', desc: 'Record observations', href: '/learning-hub/tools/performance', available: false },
        { icon: '🖼️', label: 'Art Critique', desc: 'Analyse artworks', href: '/learning-hub/tools/critique', available: false },
        { icon: '🎵', label: 'Creative Studio', desc: 'Creative writing', href: '/learning-hub/tools/studio', available: false },
      ],
    },
    agriculture_environment: {
      icon: '🌱', label: 'Agriculture & Environment', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0',
      description: 'Crop science, soil analysis and farming techniques.',
      tools: [
        { icon: '🌾', label: 'Crop Identifier', desc: 'Learn about crops', href: '/learning-hub/tools/crops', available: true },
        { icon: '🪱', label: 'Soil Analysis', desc: 'Study soil properties', href: '/learning-hub/tools/soil', available: false },
        { icon: '📅', label: 'Season Planner', desc: 'Plan farming seasons', href: '/learning-hub/tools/planner', available: false },
        { icon: '🌿', label: 'Field Notes', desc: 'Document observations', href: '/learning-hub/tools/field', available: false },
      ],
    },
    engineering_technology: {
      icon: '⚙️', label: 'Engineering & Technology', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
      description: 'Code, circuits, problem solving and technical design.',
      tools: [
        { icon: '💻', label: 'Code Sandbox', desc: 'Write and run code', href: '/learning-hub/tools/sandbox', available: true },
        { icon: '⚡', label: 'Circuit Designer', desc: 'Design circuits', href: '/learning-hub/tools/circuits', available: false },
        { icon: '📐', label: 'Engineering Calc', desc: 'Technical calculations', href: '/learning-hub/tools/calc', available: false },
        { icon: '🔧', label: 'Problem Sets', desc: 'Engineering practice', href: '/learning-hub/tools/problems', available: false },
      ],
    },
    business_economics: {
      icon: '💼', label: 'Business & Economics', color: '#d97706', bg: '#fffbeb', border: '#fde68a',
      description: 'Case studies, financial analysis and market research.',
      tools: [
        { icon: '📈', label: 'Market Analyser', desc: 'Study market trends', href: '/learning-hub/tools/market', available: true },
        { icon: '💰', label: 'Financial Calc', desc: 'Financial models', href: '/learning-hub/tools/finance', available: false },
        { icon: '🏢', label: 'Business Cases', desc: 'Analyse businesses', href: '/learning-hub/tools/business', available: false },
        { icon: '📊', label: 'Economics Lab', desc: 'Economic analysis', href: '/learning-hub/tools/economics', available: false },
      ],
    },
    journalism_media: {
      icon: '📰', label: 'Journalism & Media', color: '#dc2626', bg: '#fef2f2', border: '#fecaca',
      description: 'Journalism writing, broadcast skills and media analysis.',
      tools: [
        { icon: '✍️', label: 'Article Writer', desc: 'Practice journalism', href: '/learning-hub/tools/writing', available: true },
        { icon: '📡', label: 'Broadcast Studio', desc: 'Broadcast skills', href: '/learning-hub/tools/broadcast', available: false },
        { icon: '🎙️', label: 'Interview Prep', desc: 'Interview techniques', href: '/learning-hub/tools/interview', available: false },
        { icon: '📱', label: 'Media Analysis', desc: 'Analyse media', href: '/learning-hub/tools/media', available: false },
      ],
    },

        law_studies: {
      icon: '⚖️', label: 'Law & Legal Studies', color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe',
      description: 'Case law, legal principles, moot court and Latin maxims.',
      tools: [
        { icon: '📚', label: 'Case Law Reader', desc: 'Study landmark cases and ratio', href: '/learning-hub/tools/law', available: true },
        { icon: '⚖️', label: 'Legal Principles', desc: 'Latin maxims and legal concepts', href: '/learning-hub/tools/law', available: true },
        { icon: '🏛️', label: 'Moot Court', desc: 'Practice legal arguments', href: '/learning-hub/tools/law', available: true },
        { icon: '✅', label: 'Latin Quiz', desc: 'Test your legal Latin knowledge', href: '/learning-hub/tools/law', available: true },
      ],
    },
    health_sciences: {
      icon: '🏥', label: 'Health Sciences', color: '#1e3a5f', bg: '#f0f9ff', border: '#bae6fd',
      description: 'Clinical cases, anatomy, pharmacology and vital signs checker.',
      tools: [
        { icon: '🩺', label: 'Patient Cases', desc: 'Real clinical case studies', href: '/learning-hub/tools/health', available: true },
        { icon: '🫀', label: 'Anatomy Systems', desc: 'Study body systems', href: '/learning-hub/tools/health', available: true },
        { icon: '💊', label: 'Pharmacology', desc: 'Drug classes and mechanisms', href: '/learning-hub/tools/health', available: true },
        { icon: '📊', label: 'Vitals Checker', desc: 'Check normal vital signs', href: '/learning-hub/tools/health', available: true },
      ],
    },
    education_studies: {
      icon: '🎒', label: 'Education Studies', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
      description: 'Lesson planning, Bloom\'s taxonomy, teaching methods and assessment.',
      tools: [
        { icon: '📋', label: 'Lesson Planner', desc: 'Build complete lesson plans', href: '/learning-hub/tools/education', available: true },
        { icon: '🎯', label: "Bloom's Taxonomy", desc: 'Generate learning objectives', href: '/learning-hub/tools/education', available: true },
        { icon: '📚', label: 'Teaching Methods', desc: '5 evidence-based methods', href: '/learning-hub/tools/education', available: true },
        { icon: '📊', label: 'Assessment Types', desc: 'Formative, summative and more', href: '/learning-hub/tools/education', available: true },
      ],
    },

    general_studies: {
      icon: '📚', label: 'General Studies', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0',
      description: 'Standard learning hub with notes, quizzes and sandbox.',
      tools: [
        { icon: '💻', label: 'Code Sandbox', desc: 'Write and run code', href: '/learning-hub/tools/sandbox', available: true },
        { icon: '📄', label: 'Lesson Notes', desc: 'Read course notes', href: '/learning-hub', available: true },
        { icon: '✅', label: 'Quizzes', desc: 'Test your knowledge', href: '/learning-hub', available: true },
        { icon: '🎥', label: 'Video Resources', desc: 'Watch learning videos', href: '/learning-hub', available: true },
      ],
    },
  }

  const config = LEARNING_TYPE_CONFIG[deptLearningType] || LEARNING_TYPE_CONFIG.general_studies
  const enrolledCourseIds = enrollments.map((e: any) => e.course?._id)
  const unenrolledCourses = availableCourses.filter((c: any) => !enrolledCourseIds.includes(c._id))

  return (
    <div>
      {/* Department Hub Header */}
      <div style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: 16, padding: '20px 24px',
        marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12,
          background: 'white', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          flexShrink: 0,
        }}>
          {config.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: config.color, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {user.department} • Learning Hub
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1f2937', margin: 0 }}>
            {config.label} Hub
          </h2>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0' }}>{config.description}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: config.color }}>{enrollments.length}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Enrolled</div>
        </div>
      </div>

      {/* Section tabs */}
      <div style={{
        background: 'white', borderRadius: 12,
        display: 'flex', padding: 4, gap: 4,
        marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        {[
          { key: 'tools', label: `${config.icon} My Tools` },
          { key: 'courses', label: `📚 My Courses (${enrollments.length})` },
          { key: 'explore', label: `🔍 Explore (${unenrolledCourses.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key as any)}
            style={{
              flex: 1, padding: '10px', borderRadius: 8, border: 'none',
              background: activeSection === tab.key ? config.color : 'transparent',
              color: activeSection === tab.key ? 'white' : '#6b7280',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TOOLS SECTION */}
      {activeSection === 'tools' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
            {config.tools.map((tool: any) => (
              <div
                key={tool.label}
                onClick={() => tool.available && (window.location.href = tool.href)}
                style={{
                  background: 'white', borderRadius: 14, padding: '20px 18px',
                  border: tool.available ? `1px solid ${config.border}` : '1px solid #e5e7eb',
                  cursor: tool.available ? 'pointer' : 'default',
                  transition: 'all 0.15s', position: 'relative',
                  opacity: tool.available ? 1 : 0.7,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                {!tool.available && (
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    background: '#f3f4f6', color: '#9ca3af',
                    padding: '2px 6px', borderRadius: 4,
                    fontSize: 9, fontWeight: 700,
                  }}>
                    COMING SOON
                  </div>
                )}
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: tool.available ? config.bg : '#f3f4f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, marginBottom: 12,
                }}>
                  {tool.icon}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
                  {tool.label}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>
                  {tool.desc}
                </div>
                {tool.available && (
                  <div style={{ marginTop: 12, fontSize: 12, color: config.color, fontWeight: 600 }}>
                    Open →
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Coming soon notice */}
          <div style={{
            background: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#78350f',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>🚧</span>
            <span>More tools for {config.label} are being developed. You'll be notified when they're ready.</span>
          </div>
        </div>
      )}

      {/* MY COURSES SECTION */}
      {activeSection === 'courses' && (
        <div>
          {enrollments.length === 0 ? (
            <div style={{
              background: 'white', borderRadius: 16, padding: '40px 24px',
              textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
              <h3 style={{ marginBottom: 8 }}>No courses enrolled yet</h3>
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
                Explore available courses and enroll to start learning
              </p>
              <button
                className="btn-primary"
                onClick={() => setActiveSection('explore')}
              >
                Explore Courses →
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {enrollments.map((enrollment: any) => {
                const course = enrollment.course
                if (!course) return null
                const color = getCourseColor(course.code)
                return (
                  <a key={enrollment._id} href={`/learning-hub/course/${course._id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'white', borderRadius: 14,
                      border: '1px solid #f3f4f6',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      overflow: 'hidden', cursor: 'pointer',
                    }}>
                      <div style={{ background: color, padding: '18px 20px' }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{course.code}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'white', marginTop: 2 }}>{course.title}</div>
                      </div>
                      <div style={{ padding: '14px 20px' }}>
                        {course.lecturers?.[0] && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%',
                              background: course.lecturers[0].avatarColor || '#2563eb',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontSize: 9, fontWeight: 700,
                            }}>
                              {getInitials(course.lecturers[0].name)}
                            </div>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>{course.lecturers[0].name}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>Progress</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color }}>{enrollment.overallProgress}%</span>
                        </div>
                        <div style={{ height: 4, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: color, width: `${enrollment.overallProgress}%`, borderRadius: 999 }} />
                        </div>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* EXPLORE SECTION */}
      {activeSection === 'explore' && (
        <div>
          {unenrolledCourses.length === 0 ? (
            <div style={{
              background: 'white', borderRadius: 16, padding: '40px 24px',
              textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <h3 style={{ marginBottom: 8 }}>
                {availableCourses.length === 0
                  ? 'No courses available yet'
                  : 'You\'re enrolled in all available courses!'}
              </h3>
              <p style={{ color: '#6b7280', fontSize: 14 }}>
                {availableCourses.length === 0
                  ? 'Your department admin will add courses soon. Check back later.'
                  : 'Check back for new courses as they are added.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {unenrolledCourses.map((course: any) => {
                const color = getCourseColor(course.code)
                return (
                  <div key={course._id} style={{
                    background: 'white', borderRadius: 14,
                    border: '1px solid #f3f4f6',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                  }}>
                    <div style={{ background: color, padding: '18px 20px' }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{course.code}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'white', marginTop: 2 }}>{course.title}</div>
                    </div>
                    <div style={{ padding: '14px 20px' }}>
                      {course.description && (
                        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12, lineHeight: 1.5 }}>
                          {course.description.slice(0, 80)}...
                        </p>
                      )}
                      <EnrollButton courseId={course._id} color={color} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ===== STAFF HUB =====
function StaffHub({ user, enrollments, availableCourses, streak, getCourseColor, getInitials }: any) {
  const [activeTab, setActiveTab] = useState<'my-courses' | 'explore'>('my-courses')
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const enrolledCourseIds = enrollments.map((e: any) => e.course?._id)
  const unenrolledCourses = availableCourses.filter((c: any) => !enrolledCourseIds.includes(c._id))

  return (
    <div style={{
      background: 'white', borderRadius: 16,
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      overflow: 'hidden',
    }}>
      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #f3f4f6', display: 'flex', padding: '0 24px' }}>
        {[
          { key: 'my-courses', label: '📚 My Courses', count: enrollments.length },
          { key: 'explore', label: '🔍 Explore Courses', count: unenrolledCourses.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '16px 4px', marginRight: 24,
              border: 'none', background: 'transparent',
              borderBottom: activeTab === tab.key ? '2px solid #16a34a' : '2px solid transparent',
              color: activeTab === tab.key ? '#16a34a' : '#6b7280',
              fontWeight: activeTab === tab.key ? 700 : 400,
              fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {tab.label}
            <span style={{
              background: activeTab === tab.key ? '#f0fdf4' : '#f3f4f6',
              color: activeTab === tab.key ? '#16a34a' : '#6b7280',
              borderRadius: 999, padding: '1px 8px', fontSize: 12, fontWeight: 700,
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div style={{ padding: 24 }}>
        {activeTab === 'my-courses' && (
          <div>
            {enrollments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📚</div>
                <h3 style={{ marginBottom: 8 }}>No courses yet</h3>
                <p style={{ color: '#6b7280', marginBottom: 20 }}>
                  Explore available courses
                </p>
                <button className="btn-primary" onClick={() => setActiveTab('explore')}>
                  Explore Courses →
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {enrollments.map((enrollment: any) => {
                  const course = enrollment.course
                  if (!course) return null
                  const color = getCourseColor(course.code)
                  return (
                    <a key={enrollment._id} href={`/learning-hub/course/${course._id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        background: 'white', borderRadius: 14,
                        border: '1px solid #f3f4f6',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        overflow: 'hidden',
                      }}>
                        <div style={{ background: color, padding: '20px 20px 16px' }}>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{course.code}</div>
                          <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: '4px 0 0' }}>{course.title}</h3>
                        </div>
                        <div style={{ padding: '16px 20px' }}>
                          {course.lecturers?.[0] && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                              <div style={{
                                width: 22, height: 22, borderRadius: '50%',
                                background: course.lecturers[0].avatarColor || '#2563eb',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: 9, fontWeight: 700,
                              }}>
                                {getInitials(course.lecturers[0].name)}
                              </div>
                              <span style={{ fontSize: 12, color: '#6b7280' }}>{course.lecturers[0].name}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>Progress</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color }}>{enrollment.overallProgress}%</span>
                          </div>
                          <div style={{ height: 4, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: color, width: `${enrollment.overallProgress}%`, borderRadius: 999 }} />
                          </div>
                        </div>
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'explore' && (
          <div>
            {unenrolledCourses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                <h3>All caught up!</h3>
                <p style={{ color: '#6b7280' }}>No new courses to explore right now.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {unenrolledCourses.map((course: any) => {
                  const color = getCourseColor(course.code)
                  return (
                    <div key={course._id} style={{
                      background: 'white', borderRadius: 14,
                      border: '1px solid #f3f4f6',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      overflow: 'hidden',
                    }}>
                      <div style={{ background: color, padding: '20px 20px 16px' }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{course.code}</div>
                        <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: '4px 0 0' }}>{course.title}</h3>
                      </div>
                      <div style={{ padding: '14px 20px' }}>
                        {course.description && (
                          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                            {course.description.slice(0, 80)}...
                          </p>
                        )}
                        <EnrollButton courseId={course._id} color={color} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function EnrollButton({ courseId, color }: { courseId: string; color: string }) {
  const [enrolling, setEnrolling] = useState(false)
  const [enrolled, setEnrolled] = useState(false)
  const [error, setError] = useState('')
  const token = getAuthToken()
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

  const enroll = async () => {
    setEnrolling(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setEnrolled(true)
        setTimeout(() => window.location.reload(), 1000)
      } else {
        const data = await res.json()
        setError(data.message || 'Failed to enroll')
      }
    } catch (err) {
      setError('Connection error')
    } finally {
      setEnrolling(false)
    }
  }

  if (enrolled) return (
    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#16a34a', fontWeight: 700, textAlign: 'center' }}>
      ✅ Enrolled! Loading...
    </div>
  )

  return (
    <div>
      <button
        onClick={enroll}
        disabled={enrolling}
        style={{
          width: '100%', padding: '10px', borderRadius: 8, border: 'none',
          background: enrolling ? '#9ca3af' : color,
          color: 'white', cursor: enrolling ? 'not-allowed' : 'pointer',
          fontWeight: 700, fontSize: 13,
        }}
      >
        {enrolling ? 'Enrolling...' : 'Enroll Now →'}
      </button>
      {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>{error}</div>}
    </div>
  )
}