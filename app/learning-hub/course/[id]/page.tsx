'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAuthToken } from '../../../utils/auth'

interface Lesson {
  _id: string
  title: string
  weekNumber: number
  description: string
  status: string
  objectives: string[]
  videoLinks: { title: string; url: string }[]
  aiSimplifiedContent: string | null
  duration: number
  uploadedBy: { _id: string; name: string }
}

interface Course {
  _id: string
  code: string
  title: string
  description: string
  lecturers: { _id: string; name: string; avatarColor?: string }[]
}

interface Progress {
  lesson: string
  completionPercentage: number
  stepsCompleted: Record<string, boolean>
}

interface Quiz {
  _id: string
  title: string
  description: string
  questions: {
    question: string
    type: string
    options: string[]
    correctAnswer: string
    points: number
    explanation: string
  }[]
  timeLimit: number
  passMark: number
  isPublished: boolean
}

interface QuizAttempt {
  _id: string
  score: number
  totalPoints: number
  percentage: number
  passed: boolean
  answers: { questionIndex: number; answer: string; isCorrect: boolean; pointsEarned: number }[]
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export default function CourseDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [progress, setProgress] = useState<Progress[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'lesson' | 'quiz' | 'sandbox' | 'students'>('overview')
  const [lessonProgress, setLessonProgress] = useState<any[]>([])

  // Quiz state
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [myAttempt, setMyAttempt] = useState<QuizAttempt | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<string[]>([])
  const [quizSubmitting, setQuizSubmitting] = useState(false)
  const [quizResult, setQuizResult] = useState<any>(null)
  const [quizTimer, setQuizTimer] = useState(0)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizStartTime, setQuizStartTime] = useState(0)

  // Create quiz state (for lecturers/admins)
  const [showCreateQuiz, setShowCreateQuiz] = useState(false)
  const [quizTitle, setQuizTitle] = useState('')
  const [quizDesc, setQuizDesc] = useState('')
  const [quizTimeLimit, setQuizTimeLimit] = useState(30)
  const [quizPassMark, setQuizPassMark] = useState(50)
  const [quizQuestions, setQuizQuestions] = useState([
    { question: '', type: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', points: 1, explanation: '' }
  ])
  const [creatingQuiz, setCreatingQuiz] = useState(false)

  // Students attempts state
  const [attempts, setAttempts] = useState<any[]>([])

  const token = getAuthToken()

  useEffect(() => {
    if (!token) return
    const setup = async () => {
      try {
        const [userRes, courseRes, lessonsRes, progressRes] = await Promise.all([
          fetch(`${API_BASE}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/courses/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/lessons/course/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/lessons/progress/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        const userData = await userRes.json()
        const courseData = await courseRes.json()
        const lessonsData = await lessonsRes.json()
        const progressData = await progressRes.json()
        setUser(userData)
        setCourse(courseData)
        setLessons(Array.isArray(lessonsData) ? lessonsData : [])
        setProgress(Array.isArray(progressData) ? progressData : [])
        if (lessonsData?.length > 0) setActiveLesson(lessonsData[0])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    setup()
  }, [id])

  // Load quiz when lesson changes
  useEffect(() => {
    if (!activeLesson || !token) return
    const loadQuiz = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/quiz/lesson/${activeLesson._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setQuiz(data)
          setQuizAnswers(new Array(data.questions?.length || 0).fill(''))

          // Load my attempt if student
          if (user?.role === 'student') {
            const attemptRes = await fetch(`${API_BASE}/api/quiz/${data._id}/my-attempt`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            if (attemptRes.ok) {
              const attemptData = await attemptRes.json()
              setMyAttempt(attemptData)
            }
          }

          // Load all attempts if staff
          if (user?.role !== 'student') {
            const attemptsRes = await fetch(`${API_BASE}/api/quiz/${data._id}/attempts`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            if (attemptsRes.ok) {
              const attemptsData = await attemptsRes.json()
              setAttempts(attemptsData)
            }
          }

                  // Load lesson progress (who read notes, watched videos etc)
        if (user?.role !== 'student') {
          const progRes = await fetch(
            `${API_BASE}/api/lessons/${activeLesson._id}/all-progress`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (progRes.ok) {
            const progData = await progRes.json()
            setLessonProgress(Array.isArray(progData) ? progData : [])
          }
        }

        } else {
          setQuiz(null)
          setMyAttempt(null)
        }
      } catch (err) {
        setQuiz(null)
      }
    }
    loadQuiz()
    setQuizResult(null)
    setQuizStarted(false)
    setShowCreateQuiz(false)
  }, [activeLesson, user])

  // Quiz timer
  useEffect(() => {
    if (!quizStarted || !quiz) return
    const interval = setInterval(() => {
      setQuizTimer(Math.floor((Date.now() - quizStartTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [quizStarted, quizStartTime])

  const getLessonProgress = (lessonId: string) =>
    progress.find(p => p.lesson === lessonId)

  const isLessonUnlocked = (index: number) => {
    if (index === 0) return true
    const prevLesson = lessons[index - 1]
    const prevProgress = getLessonProgress(prevLesson._id)
    return (prevProgress?.completionPercentage || 0) >= 50
  }

  const markStepDone = async (step: string) => {
    if (!activeLesson || !token) return
    try {
      const res = await fetch(`${API_BASE}/api/lessons/${activeLesson._id}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ step }),
      })
      if (res.ok) {
        const updated = await res.json()
        setProgress(prev => {
          const existing = prev.findIndex(p => p.lesson === activeLesson._id)
          if (existing > -1) {
            const newProg = [...prev]
            newProg[existing] = updated
            return newProg
          }
          return [...prev, updated]
        })
      }
    } catch (err) { console.error(err) }
  }

  const deleteLesson = async (lessonId: string) => {
    if (!confirm('Delete this lesson? This cannot be undone.')) return
    try {
      const res = await fetch(`${API_BASE}/api/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setLessons(prev => prev.filter(l => l._id !== lessonId))
        if (activeLesson?._id === lessonId) setActiveLesson(null)
      }
    } catch (err) { console.error(err) }
  }

  const startQuiz = () => {
    setQuizStarted(true)
    setQuizStartTime(Date.now())
    setQuizAnswers(new Array(quiz?.questions?.length || 0).fill(''))
  }

  const submitQuiz = async () => {
    if (!quiz || !token) return
    setQuizSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/quiz/${quiz._id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: quizAnswers, timeTaken: quizTimer }),
      })
      const data = await res.json()
      if (res.ok) {
        setQuizResult(data)
        setMyAttempt(data.attempt)
        setQuizStarted(false)
        await markStepDone('completedQuiz')
      } else {
        alert(data.message)
      }
    } catch (err) { console.error(err) }
    finally { setQuizSubmitting(false) }
  }

  const handleCreateQuiz = async () => {
    if (!activeLesson || !token) return
    setCreatingQuiz(true)
    try {
      const res = await fetch(`${API_BASE}/api/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          lessonId: activeLesson._id,
          courseId: id,
          title: quizTitle,
          description: quizDesc,
          questions: quizQuestions,
          timeLimit: quizTimeLimit,
          passMark: quizPassMark,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setQuiz(data)
        setShowCreateQuiz(false)
        // Publish immediately
        await fetch(`${API_BASE}/api/quiz/${data._id}/publish`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        })
        alert('Quiz created and published!')
      }
    } catch (err) { console.error(err) }
    finally { setCreatingQuiz(false) }
  }

  const addQuestion = () => {
    setQuizQuestions([...quizQuestions, {
      question: '', type: 'multiple_choice',
      options: ['', '', '', ''], correctAnswer: '', points: 1, explanation: '',
    }])
  }

  const removeQuestion = (i: number) => {
    setQuizQuestions(quizQuestions.filter((_, idx) => idx !== i))
  }

  const updateQuestion = (i: number, field: string, value: any) => {
    const updated = [...quizQuestions]
    updated[i] = { ...updated[i], [field]: value }
    setQuizQuestions(updated)
  }

  const updateOption = (qi: number, oi: number, value: string) => {
    const updated = [...quizQuestions]
    updated[qi].options[oi] = value
    setQuizQuestions(updated)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const getInitials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const getCourseColor = (code: string) => {
    const colors = ['#16a34a', '#2563eb', '#7c3aed', '#d97706', '#dc2626', '#0891b2']
    return colors[code?.charCodeAt(0) % colors.length] || '#16a34a'
  }

  const canManage = user?.role === 'lecturer' || user?.role === 'department_admin' ||
    user?.role === 'faculty_admin' || user?.role === 'admin'

  const activeProgress = activeLesson ? getLessonProgress(activeLesson._id) : null
  const color = course ? getCourseColor(course.code) : '#16a34a'

  const moduleSteps = [
    { key: 'readNotes', label: 'Read Notes', icon: '📄' },
    { key: 'watchedVideo', label: 'Watch Video', icon: '🎥' },
    { key: 'readAiExplanation', label: 'AI Explanation', icon: '🤖' },
    { key: 'ranCode', label: 'Run Code', icon: '</>' },
    { key: 'completedSandbox', label: 'Sandbox', icon: '💻' },
    { key: 'completedQuiz', label: 'Quiz', icon: '✅' },
    { key: 'submittedAssignment', label: 'Assignment', icon: '📝' },
    { key: 'joinedDiscussion', label: 'Discussion', icon: '💬' },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
        <p style={{ color: '#4b5563' }}>Loading course...</p>
      </div>
    </div>
  )

  return (
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>

      {/* Course Header */}
      <div style={{
        background: `linear-gradient(135deg, ${color}dd, ${color})`,
        padding: '32px 24px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -60, top: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13 }}>
            <Link href="/learning-hub" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Learning Hub</Link>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>›</span>
            <span style={{ color: 'white', fontWeight: 600 }}>{course?.code} — {course?.title}</span>
          </div>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>{course?.title}</h1>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {course?.lecturers?.map(l => (
              <div key={l._id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: l.avatarColor || '#2563eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 10, fontWeight: 700,
                }}>{getInitials(l.name)}</div>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{l.name}</span>
              </div>
            ))}
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>• {lessons.length} weeks</span>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="course-detail-layout" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>

        {/* Left — Content */}
        <div>

          {/* Active lesson header */}
          {activeLesson && (
            <div style={{
              background: '#052e16', borderRadius: 16, padding: '20px 24px',
              marginBottom: 20, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 600, marginBottom: 4 }}>WEEK {activeLesson.weekNumber}</div>
                  <h2 style={{ color: 'white', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{activeLesson.title}</h2>
                  {activeLesson.description && (
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.5 }}>{activeLesson.description}</p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#4ade80' }}>
                      {activeProgress?.completionPercentage || 0}%
                    </span>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => deleteLesson(activeLesson._id)}
                      style={{
                        background: '#ef4444', border: 'none', borderRadius: 8,
                        color: 'white', padding: '6px 12px', cursor: 'pointer',
                        fontSize: 12, fontWeight: 600,
                      }}
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Content tabs */}
          {activeLesson && (
            <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', overflowX: 'auto', padding: '0 4px' }}>
                {[
                  { key: 'overview', label: '📋 Overview' },
                  { key: 'lesson', label: '📄 Lesson' },
                  { key: 'quiz', label: '✅ Quiz' },
                  { key: 'sandbox', label: '💻 Sandbox' },
                  ...(canManage ? [{ key: 'students', label: '👥 Students' }] : []),
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    style={{
                      padding: '14px 16px', border: 'none', background: 'transparent',
                      borderBottom: activeTab === tab.key ? `2px solid ${color}` : '2px solid transparent',
                      color: activeTab === tab.key ? color : '#6b7280',
                      fontWeight: activeTab === tab.key ? 700 : 400,
                      fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ padding: 24 }}>

                {/* OVERVIEW */}
                {activeTab === 'overview' && (
                  <div>
                    {activeLesson.objectives?.length > 0 && (
                      <div style={{ marginBottom: 24 }}>
                        <h3 style={{ fontSize: 15, marginBottom: 12 }}>🎯 Learning Objectives</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {activeLesson.objectives.map((obj, i) => (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'flex-start', gap: 10,
                              padding: '10px 14px', background: '#f0fdf4',
                              borderRadius: 8, border: '1px solid #bbf7d0',
                            }}>
                              <span style={{ color: '#16a34a', fontSize: 14 }}>✓</span>
                              <span style={{ fontSize: 14, color: '#374151' }}>{obj}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 style={{ fontSize: 15, marginBottom: 16 }}>📊 Module Progress</h3>
                      <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: 8 }}>
                        {moduleSteps.map((step, index) => {
                          const done = activeProgress?.stepsCompleted?.[step.key]
                          return (
                            <div key={step.key} style={{ display: 'flex', alignItems: 'center' }}>
                              <div style={{ textAlign: 'center', minWidth: 70 }}>
                                <div style={{
                                  width: 36, height: 36, borderRadius: '50%',
                                  background: done ? '#16a34a' : '#f3f4f6',
                                  border: done ? '2px solid #16a34a' : '2px solid #e5e7eb',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: done ? 16 : 14, margin: '0 auto 6px',
                                  color: done ? 'white' : '#9ca3af',
                                }}>
                                  {done ? '✓' : step.icon}
                                </div>
                                <div style={{ fontSize: 10, color: done ? '#16a34a' : '#9ca3af', fontWeight: done ? 600 : 400, lineHeight: 1.2 }}>
                                  {step.label}
                                </div>
                              </div>
                              {index < moduleSteps.length - 1 && (
                                <div style={{ width: 32, height: 2, flexShrink: 0, background: done ? '#16a34a' : '#e5e7eb', margin: '0 2px 16px' }} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {activeLesson.videoLinks?.length > 0 && (
                      <div style={{ marginTop: 24 }}>
                        <h3 style={{ fontSize: 15, marginBottom: 12 }}>🎥 Video Resources</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {activeLesson.videoLinks.map((v, i) => (
                            <a key={i} href={v.url} target="_blank" rel="noopener noreferrer"
                              onClick={() => markStepDone('watchedVideo')}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '12px 16px', background: '#fafafa',
                                border: '1px solid #e5e7eb', borderRadius: 10,
                                textDecoration: 'none', color: '#1f2937',
                              }}>
                              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎥</div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{v.title || `Video ${i + 1}`}</div>
                                <div style={{ fontSize: 11, color: '#9ca3af' }}>{v.url}</div>
                              </div>
                              <span style={{ marginLeft: 'auto', color: '#16a34a', fontSize: 18 }}>→</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                                {/* LESSON TAB */}
                {activeTab === 'lesson' && (
                  <div>
                    {activeLesson.aiSimplifiedContent ? (
                      <div>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                          padding: '8px 14px', background: '#f0fdf4', borderRadius: 8,
                          border: '1px solid #bbf7d0', fontSize: 13, color: '#15803d',
                        }}>
                          📄 Lesson content from your lecturer
                        </div>
                        <div style={{ fontSize: 14, lineHeight: 1.8, color: '#374151', whiteSpace: 'pre-wrap' }}>
                          {activeLesson.aiSimplifiedContent}
                        </div>
                        {user?.role === 'student' && (
                          <button onClick={() => markStepDone('readNotes')} className="btn-primary" style={{ marginTop: 24 }}>
                            ✓ Mark as Read
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                        <h3 style={{ marginBottom: 8 }}>No lesson notes yet</h3>
                        <p style={{ color: '#6b7280', fontSize: 14 }}>The lecturer hasn't uploaded notes for this week.</p>
                        {canManage && (
                          <Link href={`/learning-hub/create-lesson?courseId=${id}`}>
                            <button className="btn-primary" style={{ marginTop: 16 }}>+ Add Lesson Notes</button>
                          </Link>
                        )}
                      </div>
                    )}

                    {/* ===== DEPT SPECIFIC CONTENT ===== */}
                    <DeptLessonContent lesson={activeLesson} onStepDone={markStepDone} userRole={user?.role} />
                  </div>
                )}

                {/* QUIZ */}
                {activeTab === 'quiz' && (
                  <div>
                    {/* Staff view — create or manage quiz */}
                    {canManage && (
                      <div>
                        {!quiz ? (
                          <div>
                            {!showCreateQuiz ? (
                              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                                <h3 style={{ marginBottom: 8 }}>No quiz for this lesson</h3>
                                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
                                  Create a quiz to test your students' understanding.
                                </p>
                                <button className="btn-primary" onClick={() => setShowCreateQuiz(true)}>
                                  + Create Quiz
                                </button>
                              </div>
                            ) : (
                              <div>
                                <h3 style={{ fontSize: 16, marginBottom: 20 }}>Create Quiz for Week {activeLesson.weekNumber}</h3>

                                <label>Quiz Title</label>
                                <input type="text" placeholder="e.g. Week 4 Quiz" value={quizTitle} onChange={e => setQuizTitle(e.target.value)} />

                                <label>Description (optional)</label>
                                <input type="text" placeholder="Brief description" value={quizDesc} onChange={e => setQuizDesc(e.target.value)} />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                  <div>
                                    <label>Time Limit (minutes)</label>
                                    <input type="number" value={quizTimeLimit} onChange={e => setQuizTimeLimit(parseInt(e.target.value))} min={5} max={180} />
                                  </div>
                                  <div>
                                    <label>Pass Mark (%)</label>
                                    <input type="number" value={quizPassMark} onChange={e => setQuizPassMark(parseInt(e.target.value))} min={1} max={100} />
                                  </div>
                                </div>

                                <h3 style={{ fontSize: 15, marginTop: 20, marginBottom: 12 }}>Questions</h3>

                                {quizQuestions.map((q, qi) => (
                                  <div key={qi} style={{
                                    background: '#f9fafb', borderRadius: 10, padding: 16,
                                    marginBottom: 16, border: '1px solid #e5e7eb',
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                      <span style={{ fontWeight: 700, color: '#374151', fontSize: 14 }}>Question {qi + 1}</span>
                                      {quizQuestions.length > 1 && (
                                        <button onClick={() => removeQuestion(qi)} style={{
                                          background: '#fef2f2', border: 'none', color: '#ef4444',
                                          borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 12,
                                        }}>Remove</button>
                                      )}
                                    </div>

                                    <label>Question</label>
                                    <input type="text" placeholder="Enter your question" value={q.question} onChange={e => updateQuestion(qi, 'question', e.target.value)} />

                                    <label>Type</label>
                                    <select value={q.type} onChange={e => updateQuestion(qi, 'type', e.target.value)}>
                                      <option value="multiple_choice">Multiple Choice</option>
                                      <option value="true_false">True / False</option>
                                      <option value="short_answer">Short Answer</option>
                                    </select>

                                    {q.type === 'multiple_choice' && (
                                      <div>
                                        <label>Options</label>
                                        {q.options.map((opt, oi) => (
                                          <div key={oi} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                                            <span style={{ width: 20, paddingTop: 8, color: '#6b7280', fontWeight: 700, fontSize: 13 }}>
                                              {String.fromCharCode(65 + oi)}.
                                            </span>
                                            <input type="text" placeholder={`Option ${String.fromCharCode(65 + oi)}`} value={opt} onChange={e => updateOption(qi, oi, e.target.value)} style={{ flex: 1 }} />
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {q.type === 'true_false' && (
                                      <div>
                                        <label>Answer</label>
                                        <select value={q.correctAnswer} onChange={e => updateQuestion(qi, 'correctAnswer', e.target.value)}>
                                          <option value="">Select answer...</option>
                                          <option value="true">True</option>
                                          <option value="false">False</option>
                                        </select>
                                      </div>
                                    )}

                                    {q.type !== 'true_false' && (
                                      <div>
                                        <label>Correct Answer</label>
                                        <input type="text" placeholder={q.type === 'multiple_choice' ? 'e.g. A or Option A text' : 'Correct answer'} value={q.correctAnswer} onChange={e => updateQuestion(qi, 'correctAnswer', e.target.value)} />
                                      </div>
                                    )}

                                    <div style={{ display: 'flex', gap: 12 }}>
                                      <div style={{ flex: 1 }}>
                                        <label>Points</label>
                                        <input type="number" value={q.points} onChange={e => updateQuestion(qi, 'points', parseInt(e.target.value))} min={1} max={10} />
                                      </div>
                                      <div style={{ flex: 2 }}>
                                        <label>Explanation (shown after submission)</label>
                                        <input type="text" placeholder="Why is this the correct answer?" value={q.explanation} onChange={e => updateQuestion(qi, 'explanation', e.target.value)} />
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                <button onClick={addQuestion} style={{
                                  width: '100%', padding: '10px', background: 'none',
                                  border: '1px dashed #e5e7eb', borderRadius: 8,
                                  cursor: 'pointer', fontSize: 13, color: '#6b7280', marginBottom: 20,
                                }}>
                                  + Add Question
                                </button>

                                <div style={{ display: 'flex', gap: 10 }}>
                                  <button onClick={() => setShowCreateQuiz(false)} className="btn-outline">Cancel</button>
                                  <button onClick={handleCreateQuiz} disabled={creatingQuiz || !quizTitle} className="btn-primary" style={{ flex: 1 }}>
                                    {creatingQuiz ? 'Creating...' : '✅ Create & Publish Quiz'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                              <h3 style={{ fontSize: 15 }}>✅ {quiz.title}</h3>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <span style={{
                                  background: quiz.isPublished ? '#f0fdf4' : '#fef3c7',
                                  color: quiz.isPublished ? '#16a34a' : '#92400e',
                                  padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                                }}>
                                  {quiz.isPublished ? '✅ Published' : '⏳ Draft'}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                              {[
                                { label: 'Questions', value: quiz.questions?.length },
                                { label: 'Time Limit', value: `${quiz.timeLimit} min` },
                                { label: 'Pass Mark', value: `${quiz.passMark}%` },
                              ].map(stat => (
                                <div key={stat.label} style={{ background: '#f9fafb', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                                  <div style={{ fontSize: 20, fontWeight: 800, color: color }}>{stat.value}</div>
                                  <div style={{ fontSize: 11, color: '#6b7280' }}>{stat.label}</div>
                                </div>
                              ))}
                            </div>

                            <h4 style={{ fontSize: 14, marginBottom: 12 }}>Questions Preview</h4>
                            {quiz.questions?.map((q, i) => (
                              <div key={i} style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 16px', marginBottom: 8 }}>
                                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                                  {i + 1}. {q.question}
                                </div>
                                <div style={{ fontSize: 12, color: '#16a34a' }}>✓ {q.correctAnswer} ({q.points} pts)</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Student view */}
                    {user?.role === 'student' && (
                      <div>
                        {!quiz ? (
                          <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                            <h3>No quiz available yet</h3>
                            <p style={{ color: '#6b7280', fontSize: 14 }}>Your lecturer hasn't created a quiz for this lesson.</p>
                          </div>
                        ) : myAttempt ? (
                          // Already attempted
                          <div>
                            <div style={{
                              background: myAttempt.passed ? '#f0fdf4' : '#fef2f2',
                              border: `1px solid ${myAttempt.passed ? '#bbf7d0' : '#fecaca'}`,
                              borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 24,
                            }}>
                              <div style={{ fontSize: 48, marginBottom: 12 }}>{myAttempt.passed ? '🎉' : '😔'}</div>
                              <h3 style={{ color: myAttempt.passed ? '#15803d' : '#dc2626', marginBottom: 4 }}>
                                {myAttempt.passed ? 'You Passed!' : 'Not passed yet'}
                              </h3>
                              <div style={{ fontSize: 32, fontWeight: 800, color: myAttempt.passed ? '#16a34a' : '#ef4444' }}>
                                {myAttempt.percentage}%
                              </div>
                              <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                                {myAttempt.score} / {myAttempt.totalPoints} points
                              </div>
                            </div>

                            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Your Answers</h3>
                            {quiz.questions?.map((q, i) => {
                              const ans = myAttempt.answers?.[i]
                              return (
                                <div key={i} style={{
                                  background: ans?.isCorrect ? '#f0fdf4' : '#fef2f2',
                                  border: `1px solid ${ans?.isCorrect ? '#bbf7d0' : '#fecaca'}`,
                                  borderRadius: 10, padding: '14px 16px', marginBottom: 10,
                                }}>
                                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                                    {i + 1}. {q.question}
                                  </div>
                                  <div style={{ fontSize: 13, color: ans?.isCorrect ? '#15803d' : '#dc2626' }}>
                                    Your answer: {ans?.answer || 'Not answered'} {ans?.isCorrect ? '✓' : '✗'}
                                  </div>
                                  {!ans?.isCorrect && (
                                    <div style={{ fontSize: 13, color: '#16a34a', marginTop: 4 }}>
                                      Correct: {q.correctAnswer}
                                    </div>
                                  )}
                                  {q.explanation && (
                                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4, fontStyle: 'italic' }}>
                                      💡 {q.explanation}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ) : !quizStarted ? (
                          // Quiz intro
                          <div style={{ textAlign: 'center', padding: '32px 0' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                            <h3 style={{ marginBottom: 8 }}>{quiz.title}</h3>
                            {quiz.description && <p style={{ color: '#6b7280', marginBottom: 20 }}>{quiz.description}</p>}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 24 }}>
                              {[
                                { label: 'Questions', value: quiz.questions?.length },
                                { label: 'Time Limit', value: `${quiz.timeLimit} min` },
                                { label: 'Pass Mark', value: `${quiz.passMark}%` },
                              ].map(s => (
                                <div key={s.label} style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: 22, fontWeight: 800, color: color }}>{s.value}</div>
                                  <div style={{ fontSize: 12, color: '#6b7280' }}>{s.label}</div>
                                </div>
                              ))}
                            </div>
                            <button className="btn-primary" onClick={startQuiz} style={{ padding: '12px 32px', fontSize: 15 }}>
                              Start Quiz →
                            </button>
                          </div>
                        ) : quizResult ? (
                          // Show result
                          <div style={{ textAlign: 'center', padding: '24px 0' }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>{quizResult.attempt?.passed ? '🎉' : '😔'}</div>
                            <h3>{quizResult.message}</h3>
                            <div style={{ fontSize: 36, fontWeight: 800, color: quizResult.attempt?.passed ? '#16a34a' : '#ef4444', margin: '12px 0' }}>
                              {quizResult.attempt?.percentage}%
                            </div>
                            <p style={{ color: '#6b7280' }}>{quizResult.attempt?.score} / {quizResult.attempt?.totalPoints} points</p>
                          </div>
                        ) : (
                          // Quiz in progress
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                              <h3 style={{ fontSize: 15 }}>{quiz.title}</h3>
                              <div style={{
                                background: '#052e16', color: '#4ade80',
                                padding: '6px 14px', borderRadius: 999, fontSize: 14, fontWeight: 700,
                              }}>
                                ⏱ {formatTime(quizTimer)}
                              </div>
                            </div>

                            {quiz.questions?.map((q, qi) => (
                              <div key={qi} style={{ background: '#f9fafb', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#1f2937' }}>
                                  {qi + 1}. {q.question}
                                  <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>({q.points} pt{q.points > 1 ? 's' : ''})</span>
                                </div>

                                {q.type === 'multiple_choice' && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {q.options?.map((opt, oi) => (
                                      <label key={oi} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                                        background: quizAnswers[qi] === opt ? '#f0fdf4' : 'white',
                                        border: quizAnswers[qi] === opt ? '2px solid #16a34a' : '2px solid #e5e7eb',
                                        transition: 'all 0.15s',
                                      }}>
                                        <input
                                          type="radio"
                                          name={`q${qi}`}
                                          value={opt}
                                          checked={quizAnswers[qi] === opt}
                                          onChange={() => {
                                            const updated = [...quizAnswers]
                                            updated[qi] = opt
                                            setQuizAnswers(updated)
                                          }}
                                          style={{ display: 'none' }}
                                        />
                                        <div style={{
                                          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                                          background: quizAnswers[qi] === opt ? '#16a34a' : 'white',
                                          border: quizAnswers[qi] === opt ? '2px solid #16a34a' : '2px solid #d1d5db',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                          {quizAnswers[qi] === opt && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                                        </div>
                                        <span style={{ fontSize: 14, color: '#374151' }}>{opt}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}

                                {q.type === 'true_false' && (
                                  <div style={{ display: 'flex', gap: 10 }}>
                                    {['true', 'false'].map(opt => (
                                      <button
                                        key={opt}
                                        onClick={() => {
                                          const updated = [...quizAnswers]
                                          updated[qi] = opt
                                          setQuizAnswers(updated)
                                        }}
                                        style={{
                                          flex: 1, padding: '12px', borderRadius: 8, border: 'none',
                                          background: quizAnswers[qi] === opt ? '#16a34a' : '#f3f4f6',
                                          color: quizAnswers[qi] === opt ? 'white' : '#374151',
                                          cursor: 'pointer', fontWeight: 700, fontSize: 14,
                                          textTransform: 'capitalize',
                                        }}
                                      >
                                        {opt === 'true' ? '✓ True' : '✗ False'}
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {q.type === 'short_answer' && (
                                  <input
                                    type="text"
                                    placeholder="Type your answer..."
                                    value={quizAnswers[qi] || ''}
                                    onChange={e => {
                                      const updated = [...quizAnswers]
                                      updated[qi] = e.target.value
                                      setQuizAnswers(updated)
                                    }}
                                  />
                                )}
                              </div>
                            ))}

                            <button
                              onClick={submitQuiz}
                              disabled={quizSubmitting}
                              className="btn-primary"
                              style={{ width: '100%', padding: '14px', fontSize: 15 }}
                            >
                              {quizSubmitting ? 'Submitting...' : '✅ Submit Quiz'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* SANDBOX */}
                {activeTab === 'sandbox' && (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <h3 style={{ fontSize: 15, marginBottom: 4 }}>💻 Code Sandbox</h3>
                      <p style={{ color: '#6b7280', fontSize: 13 }}>Write and run code directly in your browser.</p>
                    </div>
                    <SandboxEditor onRun={() => markStepDone('ranCode')} />
                  </div>
                )}

                                {/* STUDENTS (staff only) */}
                {activeTab === 'students' && canManage && (
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>
                      👥 Student Activity — Week {activeLesson?.weekNumber}: {activeLesson?.title}
                    </h3>

                    {/* ===== LESSON PROGRESS ===== */}
                    <div style={{ marginBottom: 28 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700 }}>📊 Lesson Engagement</h4>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>
                          {lessonProgress.length} student{lessonProgress.length !== 1 ? 's' : ''} accessed this lesson
                        </span>
                      </div>

                      {lessonProgress.length === 0 ? (
                        <div style={{
                          background: '#f9fafb', borderRadius: 10, padding: '24px',
                          textAlign: 'center', color: '#9ca3af',
                        }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>📚</div>
                          <p style={{ fontSize: 13 }}>No students have accessed this lesson yet.</p>
                        </div>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Student</th>
                                <th style={{ padding: '10px 8px', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>📄 Notes</th>
                                <th style={{ padding: '10px 8px', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>🎥 Video</th>
                                <th style={{ padding: '10px 8px', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>🤖 AI</th>
                                <th style={{ padding: '10px 8px', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>💻 Code</th>
                                <th style={{ padding: '10px 8px', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>✅ Quiz</th>
                                <th style={{ padding: '10px 8px', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>Progress</th>
                              </tr>
                            </thead>
                            <tbody>
                              {lessonProgress.map(prog => {
                                const steps = prog.stepsCompleted || {}
                                const done = (key: string) => steps[key]
                                return (
                                  <tr key={prog._id} style={{ borderBottom: '1px solid #f9fafb' }}>
                                    <td style={{ padding: '10px 12px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{
                                          width: 28, height: 28, borderRadius: '50%',
                                          background: prog.student?.avatarColor || '#16a34a',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          color: 'white', fontSize: 10, fontWeight: 700,
                                        }}>
                                          {getInitials(prog.student?.name || '?')}
                                        </div>
                                        <div>
                                          <div style={{ fontWeight: 600, fontSize: 12 }}>{prog.student?.name}</div>
                                          <div style={{ fontSize: 10, color: '#9ca3af' }}>{prog.student?.level}</div>
                                        </div>
                                      </div>
                                    </td>
                                    {[
                                      'readNotes', 'watchedVideo', 'readAiExplanation',
                                      'ranCode', 'completedQuiz'
                                    ].map(step => (
                                      <td key={step} style={{ padding: '10px 8px', textAlign: 'center' }}>
                                        <span style={{ fontSize: 16 }}>
                                          {done(step) ? '✅' : '⬜'}
                                        </span>
                                      </td>
                                    ))}
                                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                                        <div style={{
                                          width: 60, height: 6, background: '#e5e7eb',
                                          borderRadius: 999, overflow: 'hidden',
                                        }}>
                                          <div style={{
                                            height: '100%',
                                            width: `${prog.completionPercentage || 0}%`,
                                            background: prog.completionPercentage >= 80 ? '#16a34a' : prog.completionPercentage >= 40 ? '#d97706' : '#ef4444',
                                            borderRadius: 999,
                                          }} />
                                        </div>
                                        <span style={{ fontSize: 10, color: '#6b7280' }}>
                                          {prog.completionPercentage || 0}%
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* ===== QUIZ RESULTS ===== */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700 }}>🧪 Quiz Results</h4>
                        {quiz && attempts.length > 0 && (
                          <span style={{ fontSize: 12, color: '#6b7280' }}>
                            {attempts.length} attempts •
                            {attempts.filter(a => a.passed).length} passed •
                            {Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length)}% avg
                          </span>
                        )}
                      </div>

                      {!quiz ? (
                        <div style={{
                          background: '#f9fafb', borderRadius: 10, padding: '20px',
                          textAlign: 'center', color: '#9ca3af',
                        }}>
                          <p style={{ fontSize: 13 }}>No quiz created for this lesson yet.</p>
                          <button
                            onClick={() => setActiveTab('quiz')}
                            className="btn-primary"
                            style={{ marginTop: 10, fontSize: 12 }}
                          >
                            Create Quiz →
                          </button>
                        </div>
                      ) : attempts.length === 0 ? (
                        <div style={{
                          background: '#f9fafb', borderRadius: 10, padding: '20px',
                          textAlign: 'center', color: '#9ca3af',
                        }}>
                          <p style={{ fontSize: 13 }}>No students have taken the quiz yet.</p>
                        </div>
                      ) : (
                        <div>
                          {/* Summary */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                            {[
                              { label: 'Attempts', value: attempts.length, color: '#2563eb', bg: '#eff6ff' },
                              { label: 'Passed', value: attempts.filter(a => a.passed).length, color: '#16a34a', bg: '#f0fdf4' },
                              { label: 'Failed', value: attempts.filter(a => !a.passed).length, color: '#dc2626', bg: '#fef2f2' },
                              { label: 'Avg Score', value: `${Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length)}%`, color: '#d97706', bg: '#fffbeb' },
                            ].map(stat => (
                              <div key={stat.label} style={{ background: stat.bg, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                                <div style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                                <div style={{ fontSize: 10, color: '#6b7280' }}>{stat.label}</div>
                              </div>
                            ))}
                          </div>

                          {/* Student scores */}
                          <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                              <thead>
                                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                  {['Student', 'Level', 'Score', 'Percentage', 'Status', 'Time'].map(h => (
                                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 11 }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {[...attempts].sort((a, b) => b.percentage - a.percentage).map(attempt => (
                                  <tr key={attempt._id} style={{ borderBottom: '1px solid #f9fafb' }}>
                                    <td style={{ padding: '10px 12px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{
                                          width: 26, height: 26, borderRadius: '50%',
                                          background: attempt.student?.avatarColor || '#16a34a',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          color: 'white', fontSize: 10, fontWeight: 700,
                                        }}>
                                          {getInitials(attempt.student?.name || '?')}
                                        </div>
                                        <div>
                                          <div style={{ fontWeight: 600 }}>{attempt.student?.name}</div>
                                          <div style={{ fontSize: 10, color: '#9ca3af' }}>{attempt.student?.email}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                      <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                                        {attempt.student?.level}
                                      </span>
                                    </td>
                                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                                      {attempt.score}/{attempt.totalPoints}
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div style={{ width: 50, height: 5, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                                          <div style={{
                                            height: '100%', width: `${attempt.percentage}%`,
                                            background: attempt.passed ? '#16a34a' : '#ef4444', borderRadius: 999,
                                          }} />
                                        </div>
                                        <span style={{ fontWeight: 700, color: attempt.passed ? '#16a34a' : '#ef4444', fontSize: 12 }}>
                                          {attempt.percentage}%
                                        </span>
                                      </div>
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                      <span style={{
                                        background: attempt.passed ? '#f0fdf4' : '#fef2f2',
                                        color: attempt.passed ? '#16a34a' : '#ef4444',
                                        padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600,
                                      }}>
                                        {attempt.passed ? '✅ Passed' : '❌ Failed'}
                                      </span>
                                    </td>
                                    <td style={{ padding: '10px 12px', color: '#6b7280', fontSize: 11 }}>
                                      {attempt.timeTaken ? formatTime(attempt.timeTaken) : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Per question breakdown */}
                          <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📝 Question Breakdown</h4>
                          {quiz.questions?.map((q, qi) => {
                            const correctCount = attempts.filter(a => a.answers?.[qi]?.isCorrect).length
                            const pct = attempts.length > 0 ? Math.round((correctCount / attempts.length) * 100) : 0
                            return (
                              <div key={qi} style={{
                                background: '#f9fafb', borderRadius: 8, padding: '12px 14px', marginBottom: 8,
                                border: '1px solid #f3f4f6',
                              }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', marginBottom: 6 }}>
                                  Q{qi + 1}: {q.question}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                  <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                                    <div style={{
                                      height: '100%', width: `${pct}%`,
                                      background: pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#ef4444',
                                      borderRadius: 999,
                                    }} />
                                  </div>
                                  <span style={{ fontSize: 12, fontWeight: 700, minWidth: 36, color: pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#ef4444' }}>
                                    {pct}%
                                  </span>
                                  <span style={{ fontSize: 11, color: '#9ca3af', minWidth: 80 }}>
                                    {correctCount}/{attempts.length} correct
                                  </span>
                                </div>
                                <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                                  ✓ Answer: {q.correctAnswer}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {lessons.length === 0 && (
            <div style={{ background: 'white', borderRadius: 16, padding: '48px 24px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
              <h3 style={{ marginBottom: 8 }}>No lessons yet</h3>
              <p style={{ color: '#6b7280', fontSize: 14 }}>Your lecturer hasn't uploaded any lessons yet.</p>
              {canManage && (
                <Link href={`/learning-hub/create-lesson?courseId=${id}`}>
                  <button className="btn-primary" style={{ marginTop: 16 }}>+ Create First Lesson</button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right — Sidebar */}
        <div className="course-sidebar">
          <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden', position: 'sticky', top: 80 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Course Content</h3>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>
                {lessons.filter((_, i) => (getLessonProgress(lessons[i]?._id)?.completionPercentage || 0) === 100).length} / {lessons.length} completed
              </p>
            </div>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {lessons.map((lesson, index) => {
                const lessonProg = getLessonProgress(lesson._id)
                const unlocked = isLessonUnlocked(index)
                const isActive = activeLesson?._id === lesson._id
                const pct = lessonProg?.completionPercentage || 0
                return (
                  <div
                    key={lesson._id}
                    onClick={() => unlocked && setActiveLesson(lesson)}
                    style={{
                      padding: '14px 20px', borderBottom: '1px solid #f9fafb',
                      cursor: unlocked ? 'pointer' : 'not-allowed',
                      background: isActive ? '#f0fdf4' : 'white',
                      borderLeft: isActive ? `3px solid ${color}` : '3px solid transparent',
                      opacity: unlocked ? 1 : 0.5,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: pct === 100 ? '#16a34a' : isActive ? color + '20' : '#f3f4f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                      }}>
                        {!unlocked ? '🔒' : pct === 100 ? '✓' : lesson.weekNumber}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12, fontWeight: isActive ? 700 : 500,
                          color: isActive ? color : '#1f2937',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          Week {lesson.weekNumber}: {lesson.title}
                        </div>
                        {pct > 0 && pct < 100 && (
                          <div style={{ marginTop: 4 }}>
                            <div style={{ height: 3, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: color, width: `${pct}%`, borderRadius: 999 }} />
                            </div>
                          </div>
                        )}
                        {pct === 100 && <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 600, marginTop: 2 }}>Completed ✓</div>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ===== DEPARTMENT SPECIFIC LESSON CONTENT =====
function DeptLessonContent({ lesson, onStepDone, userRole }: { lesson: any; onStepDone: (step: string) => void; userRole: string }) {
  const [speaking, setSpeaking] = useState(false)

  const speak = (text: string, lang: string = 'en-GB') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = 0.8
      setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      window.speechSynthesis.speak(utterance)
    }
  }

  const deptType = lesson.departmentType || 'general_studies'
  const hasContent =
    lesson.pronunciationExercises?.length > 0 ||
    lesson.languageVocab?.length > 0 ||
    lesson.syntaxDrills?.length > 0 ||
    lesson.caseStudies?.length > 0 ||
    lesson.labProcedures?.length > 0 ||
    lesson.scriptContent ||
    lesson.fieldObservations?.length > 0 ||
    lesson.codeExercises?.length > 0 ||
    lesson.businessCases?.length > 0 ||
    lesson.articleDrafts?.length > 0 ||
    lesson.broadcastScripts?.length > 0

  if (!hasContent) return null

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ height: 1, background: '#f3f4f6', marginBottom: 24 }} />

      {/* LANGUAGE & LINGUISTICS */}
      {deptType === 'language_linguistics' && (
        <div>
          {/* Pronunciation Exercises */}
          {lesson.pronunciationExercises?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#7c3aed', marginBottom: 12 }}>
                🎧 Pronunciation Exercises
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {lesson.pronunciationExercises.map((ex: any, i: number) => (
                  <div key={i} style={{ background: '#f5f3ff', borderRadius: 10, padding: '14px 16px', border: '1px solid #ddd6fe' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#7c3aed' }}>{ex.word}</div>
                      <button
                        onClick={() => speak(ex.word, ex.language === 'French' ? 'fr-FR' : ex.language === 'Spanish' ? 'es-ES' : 'en-GB')}
                        style={{ background: '#7c3aed', border: 'none', borderRadius: 8, color: 'white', padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                      >
                        🔊 Listen
                      </button>
                    </div>
                    <div style={{ fontSize: 13, color: '#7c3aed', fontFamily: 'monospace', marginBottom: 4 }}>{ex.phonetic}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{ex.language} • {ex.instructions}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vocabulary */}
          {lesson.languageVocab?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#7c3aed', marginBottom: 12 }}>
                📚 Vocabulary List
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                {lesson.languageVocab.map((v: any, i: number) => (
                  <div key={i} style={{ background: '#f5f3ff', borderRadius: 8, padding: '12px 14px', border: '1px solid #ddd6fe' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#7c3aed', marginBottom: 4 }}>{v.word}</div>
                    <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>{v.translation}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>"{v.example}"</div>
                    <div style={{ fontSize: 10, color: '#c4b5fd', marginTop: 4 }}>{v.language}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Syntax Drills */}
          {lesson.syntaxDrills?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#7c3aed', marginBottom: 12 }}>
                🧩 Syntax Drills
              </h3>
              {lesson.syntaxDrills.map((d: any, i: number) => (
                <SyntaxDrillCard key={i} drill={d} index={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* SCIENCE & MEDICINE */}
      {deptType === 'science_medicine' && (
        <div>
          {lesson.caseStudies?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0891b2', marginBottom: 12 }}>📋 Case Studies</h3>
              {lesson.caseStudies.map((cs: any, i: number) => (
                <div key={i} style={{ background: '#ecfeff', borderRadius: 10, padding: '16px', border: '1px solid #a5f3fc', marginBottom: 10 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0891b2', marginBottom: 8 }}>{cs.title}</h4>
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{cs.description}</p>
                </div>
              ))}
            </div>
          )}

          {lesson.labProcedures?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0891b2', marginBottom: 12 }}>🧪 Lab Procedures</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lesson.labProcedures.map((lp: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 14, background: '#ecfeff', borderRadius: 8, padding: '12px 16px', border: '1px solid #a5f3fc' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0891b2', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, color: '#374151' }}>{lp.instruction}</div>
                      {lp.safetyNote && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>⚠️ {lp.safetyNote}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ARTS & PERFORMANCE */}
      {deptType === 'arts_performance' && (
        <div>
          {lesson.scriptContent && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#be185d', marginBottom: 12 }}>📜 Script</h3>
              <div style={{ background: '#fdf2f8', borderRadius: 10, padding: '20px', border: '1px solid #f9a8d4', fontFamily: 'serif', fontSize: 15, lineHeight: 2, whiteSpace: 'pre-wrap', color: '#374151' }}>
                {lesson.scriptContent}
              </div>
            </div>
          )}
          {lesson.performanceNotes?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#be185d', marginBottom: 12 }}>🎬 Performance Notes</h3>
              {lesson.performanceNotes.map((note: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', background: '#fdf2f8', borderRadius: 8, border: '1px solid #f9a8d4', marginBottom: 8 }}>
                  <span style={{ color: '#be185d', fontWeight: 700 }}>•</span>
                  <span style={{ fontSize: 14, color: '#374151' }}>{note}</span>
                </div>
              ))}
            </div>
          )}
          {lesson.creativePrompts?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#be185d', marginBottom: 12 }}>✨ Creative Prompts</h3>
              {lesson.creativePrompts.map((prompt: string, i: number) => (
                <div key={i} style={{ padding: '12px 16px', background: '#fdf2f8', borderRadius: 8, border: '1px dashed #f9a8d4', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: '#374151', fontStyle: 'italic' }}>"{prompt}"</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AGRICULTURE */}
      {deptType === 'agriculture_environment' && lesson.fieldObservations?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#15803d', marginBottom: 12 }}>🌾 Field Observations</h3>
          {lesson.fieldObservations.map((obs: any, i: number) => (
            <div key={i} style={{ background: '#f0fdf4', borderRadius: 10, padding: '14px 16px', border: '1px solid #bbf7d0', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                <span style={{ background: '#16a34a', color: 'white', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{obs.cropType}</span>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>{obs.season}</span>
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#15803d', marginBottom: 4 }}>{obs.title}</h4>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{obs.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* ENGINEERING */}
      {deptType === 'engineering_technology' && lesson.codeExercises?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2563eb', marginBottom: 12 }}>💻 Coding Exercises</h3>
          {lesson.codeExercises.map((ex: any, i: number) => (
            <CodeExerciseCard key={i} exercise={ex} index={i} />
          ))}
        </div>
      )}

      {/* BUSINESS */}
      {deptType === 'business_economics' && lesson.businessCases?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#d97706', marginBottom: 12 }}>🏢 Business Case Studies</h3>
          {lesson.businessCases.map((bc: any, i: number) => (
            <div key={i} style={{ background: '#fffbeb', borderRadius: 10, padding: '16px', border: '1px solid #fde68a', marginBottom: 10 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#d97706', marginBottom: 6 }}>{bc.company}</h4>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{bc.situation}</p>
            </div>
          ))}
        </div>
      )}

      {/* JOURNALISM */}
      {deptType === 'journalism_media' && (
        <div>
          {lesson.articleDrafts?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', marginBottom: 12 }}>✍️ Article Writing Exercise</h3>
              {lesson.articleDrafts.map((a: any, i: number) => (
                <div key={i} style={{ background: '#fef2f2', borderRadius: 10, padding: '16px', border: '1px solid #fecaca', marginBottom: 10 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: '#dc2626', marginBottom: 4 }}>{a.headline}</h4>
                  <p style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>{a.brief}</p>
                  <div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>📝 {a.instructions}</div>
                </div>
              ))}
            </div>
          )}
          {lesson.broadcastScripts?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', marginBottom: 12 }}>📡 Broadcast Scripts</h3>
              {lesson.broadcastScripts.map((s: any, i: number) => (
                <div key={i} style={{ background: '#fef2f2', borderRadius: 10, padding: '16px', border: '1px solid #fecaca', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#dc2626' }}>{s.title}</h4>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>⏱ {s.duration}</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, fontFamily: 'monospace', whiteSpace: 'pre-wrap', background: 'white', padding: '12px', borderRadius: 8 }}>
                    {s.script}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mark as read button */}
      {userRole === 'student' && (
        <button onClick={() => onStepDone('readNotes')} className="btn-primary" style={{ marginTop: 16 }}>
          ✓ Mark Lesson as Read
        </button>
      )}
    </div>
  )
}

// Syntax Drill Card with answer reveal
function SyntaxDrillCard({ drill, index }: { drill: any; index: number }) {
  const [showAnswer, setShowAnswer] = useState(false)
  const [userAnswer, setUserAnswer] = useState('')

  return (
    <div style={{ background: '#f5f3ff', borderRadius: 10, padding: '14px 16px', border: '1px solid #ddd6fe', marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', marginBottom: 4 }}>Drill {index + 1}</div>
      <div style={{ fontSize: 15, color: '#1f2937', marginBottom: 8, fontStyle: 'italic' }}>"{drill.sentence}"</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>{drill.instruction}</div>
      <input
        placeholder="Your answer..."
        value={userAnswer}
        onChange={e => setUserAnswer(e.target.value)}
        style={{ marginBottom: 8 }}
      />
      <button
        onClick={() => setShowAnswer(!showAnswer)}
        style={{ background: showAnswer ? '#f0fdf4' : '#7c3aed', color: showAnswer ? '#16a34a' : 'white', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
      >
        {showAnswer ? '✓ Answer shown' : 'Show Answer'}
      </button>
      {showAnswer && (
        <div style={{ marginTop: 8, padding: '8px 12px', background: '#f0fdf4', borderRadius: 6, fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
          ✓ {drill.answer}
        </div>
      )}
    </div>
  )
}

// Code Exercise Card
function CodeExerciseCard({ exercise, index }: { exercise: any; index: number }) {
  const [code, setCode] = useState(exercise.starterCode || '')
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const runCode = async () => {
    setRunning(true)
    setOutput('Running...')
    try {
      const langVersions: Record<string, string> = {
        python: '3.10.0', javascript: '18.15.0', c: '10.2.0', cpp: '10.2.0', java: '15.0.2',
      }
      const res = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: exercise.language || 'python',
          version: langVersions[exercise.language || 'python'] || '*',
          files: [{ name: `main.${exercise.language === 'python' ? 'py' : exercise.language === 'javascript' ? 'js' : exercise.language || 'py'}`, content: code }],
        }),
      })
      const data = await res.json()
      const result = (data.run?.stdout || '') + (data.run?.stderr ? `\nErrors:\n${data.run.stderr}` : '')
      setOutput(result || 'No output')
    } catch {
      setOutput('Connection error')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div style={{ background: '#eff6ff', borderRadius: 12, padding: '16px', border: '1px solid #bfdbfe', marginBottom: 14 }}>
      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#2563eb', marginBottom: 4 }}>
        Exercise {index + 1}: {exercise.title}
      </h4>
      <p style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}>{exercise.description}</p>

      {/* Code editor */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ background: '#1e1e2e', borderRadius: '8px 8px 0 0', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
          <span style={{ marginLeft: 8, fontSize: 11, color: '#9ca3af' }}>{exercise.language || 'python'}</span>
        </div>
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          style={{ width: '100%', background: '#1e1e2e', color: '#cdd6f4', padding: '12px', border: 'none', outline: 'none', fontSize: 13, fontFamily: 'Courier New, monospace', lineHeight: 1.6, resize: 'vertical', minHeight: 120, borderRadius: '0 0 8px 8px' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button onClick={runCode} disabled={running} style={{ background: running ? '#6b7280' : '#2563eb', color: 'white', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          {running ? '⏳ Running...' : '▶ Run Code'}
        </button>
        {exercise.hints?.length > 0 && (
          <button onClick={() => setShowHint(!showHint)} style={{ background: '#f0fdf4', border: 'none', borderRadius: 6, color: '#16a34a', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            💡 {showHint ? 'Hide Hint' : 'Show Hint'}
          </button>
        )}
      </div>

      {showHint && exercise.hints?.[0] && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 10, fontSize: 13, color: '#15803d' }}>
          💡 {exercise.hints[0]}
        </div>
      )}

      {output && (
        <div style={{ background: '#0f0f23', borderRadius: 6, padding: '10px 14px', fontSize: 12, fontFamily: 'monospace', color: '#cdd6f4' }}>
          <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>OUTPUT:</div>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{output}</pre>
        </div>
      )}

      {exercise.expectedOutput && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
          Expected: <code style={{ color: '#2563eb' }}>{exercise.expectedOutput}</code>
        </div>
      )}
    </div>
  )
}

// ===== SANDBOX =====
function SandboxEditor({ onRun }: { onRun: () => void }) {
  const [code, setCode] = useState(`# Python Example\nprint("Hello, UniWeb!")\n\nfor i in range(5):\n    print(f"Number: {i}")`)
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [language, setLanguage] = useState('python')

  const languages = [
    { value: 'python', label: 'Python', version: '3.12.0', ext: 'py' },
    { value: 'javascript', label: 'JavaScript', version: '18.15.0', ext: 'js' },
    { value: 'c', label: 'C', version: '10.2.0', ext: 'c' },
    { value: 'cpp', label: 'C++', version: '10.2.0', ext: 'cpp' },
    { value: 'java', label: 'Java', version: '15.0.2', ext: 'java' },
  ]

  const runCode = async () => {
    setRunning(true)
    setOutput('Running your code...')
    try {
      const lang = languages.find(l => l.value === language)

      // Use Piston API directly — no auth needed
      const pistonRes = await fetch(`${API_BASE}/api/code/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: language,
          version: lang?.version || '*',
          files: [{
            name: `main.${lang?.ext || 'py'}`,
            content: code
          }],
        }),
      })

      if (!pistonRes.ok) {
        const errText = await pistonRes.text()
        setOutput(`Piston API Error: ${pistonRes.status}\n${errText}`)
        return
      }

      const data = await pistonRes.json()
      const stdout = data.run?.stdout || ''
      const stderr = data.run?.stderr || ''
      const result = stdout + (stderr ? `\nErrors:\n${stderr}` : '')
      setOutput(result || 'Code ran successfully with no output.')
      onRun()
    } catch (err: any) {
      setOutput(`Network error: ${err.message}`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {languages.map(lang => (
          <button key={lang.value} onClick={() => setLanguage(lang.value)} style={{
            padding: '6px 14px', borderRadius: 6, border: 'none',
            background: language === lang.value ? '#16a34a' : '#f3f4f6',
            color: language === lang.value ? 'white' : '#374151',
            cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>{lang.label}</button>
        ))}
      </div>

      <div className="code-editor" style={{ marginBottom: 12 }}>
        <div className="code-editor-header">
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
          <span style={{ marginLeft: 8, fontSize: 12, color: '#9ca3af' }}>{language} • sandbox</span>
        </div>
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          style={{
            width: '100%', background: '#1e1e2e', color: '#cdd6f4',
            padding: '16px', border: 'none', outline: 'none',
            fontSize: 13, fontFamily: 'Courier New, monospace',
            lineHeight: 1.6, resize: 'vertical', minHeight: 200,
          }}
        />
      </div>

      <button onClick={runCode} disabled={running} style={{
        background: running ? '#6b7280' : '#16a34a', color: 'white',
        border: 'none', borderRadius: 8, padding: '10px 24px',
        cursor: running ? 'not-allowed' : 'pointer',
        fontWeight: 700, fontSize: 14, marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {running ? '⏳ Running...' : '▶ Run Code'}
      </button>

      {output && (
        <div className="code-terminal">
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>OUTPUT:</div>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{output}</pre>
        </div>
      )}
    </div>
  )
}