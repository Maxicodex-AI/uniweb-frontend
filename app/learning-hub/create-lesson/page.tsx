'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getAuthToken } from '../../utils/auth'

interface Course {
  _id: string
  code: string
  title: string
  offerings: { faculty: string; department: string; level: string }[]
}

const DEPT_COLORS: Record<string, string> = {
  language_linguistics: '#7c3aed',
  science_medicine: '#0891b2',
  arts_performance: '#be185d',
  agriculture_environment: '#16a34a',
  engineering_technology: '#2563eb',
  business_economics: '#d97706',
  journalism_media: '#dc2626',
  general_studies: '#16a34a',
}

const DEPT_LABELS: Record<string, { icon: string; label: string }> = {
  language_linguistics: { icon: '🗣️', label: 'Language & Linguistics' },
  science_medicine: { icon: '🔬', label: 'Science & Medicine' },
  arts_performance: { icon: '🎭', label: 'Arts & Performance' },
  agriculture_environment: { icon: '🌱', label: 'Agriculture & Environment' },
  engineering_technology: { icon: '⚙️', label: 'Engineering & Technology' },
  business_economics: { icon: '💼', label: 'Business & Economics' },
  journalism_media: { icon: '📰', label: 'Journalism & Media' },
  general_studies: { icon: '📚', label: 'General Studies' },
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export default function CreateLessonPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseIdParam = searchParams.get('courseId')

  const [courses, setCourses] = useState<Course[]>([])
  const [user, setUser] = useState<any>(null)
  const [deptLearningType, setDeptLearningType] = useState('general_studies')
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [lessonId, setLessonId] = useState<string | null>(null)
  const [myLessons, setMyLessons] = useState<any[]>([])
  const [showMyLessons, setShowMyLessons] = useState(false)

  // Step 1 — Basic info
  const [courseId, setCourseId] = useState(courseIdParam || '')
  const [weekNumber, setWeekNumber] = useState(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(5)

  // Step 2 — Objectives
  const [objectives, setObjectives] = useState<string[]>([''])

  // Step 3 — Content (changes per dept)
  const [lessonContent, setLessonContent] = useState('')
  const [videoLinks, setVideoLinks] = useState<{ title: string; url: string }[]>([{ title: '', url: '' }])
  const [references, setReferences] = useState<string[]>([''])

  // Language & Linguistics
  const [pronunciationExercises, setPronunciationExercises] = useState<any[]>([])
  const [phoneticsExercises, setPhoneticsExercises] = useState<any[]>([])
  const [syntaxDrills, setSyntaxDrills] = useState<any[]>([])
  const [languageVocab, setLanguageVocab] = useState<any[]>([])

  // Science & Medicine
  const [caseStudies, setCaseStudies] = useState<any[]>([])
  const [labProcedures, setLabProcedures] = useState<any[]>([])

  // Arts & Performance
  const [scriptContent, setScriptContent] = useState('')
  const [performanceNotes, setPerformanceNotes] = useState<string[]>([])
  const [creativePrompts, setCreativePrompts] = useState<string[]>([])

  // Agriculture
  const [fieldObservations, setFieldObservations] = useState<any[]>([])

  // Engineering
  const [codeExercises, setCodeExercises] = useState<any[]>([])

  // Business
  const [businessCases, setBusinessCases] = useState<any[]>([])

  // Journalism
  const [articleDrafts, setArticleDrafts] = useState<any[]>([])
  const [broadcastScripts, setBroadcastScripts] = useState<any[]>([])

  const token = getAuthToken()
  const deptColor = DEPT_COLORS[deptLearningType] || '#16a34a'
  const deptLabel = DEPT_LABELS[deptLearningType] || { icon: '📚', label: 'General Studies' }

  useEffect(() => {
    if (!token) return
    const setup = async () => {
      const userRes = await fetch(`${API_BASE}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const userData = await userRes.json()
      setUser(userData)

      // Get department learning type
      if (userData.faculty && userData.department) {
        const deptRes = await fetch(
          `${API_BASE}/api/departments/profile?faculty=${encodeURIComponent(userData.faculty)}&name=${encodeURIComponent(userData.department)}`
        )
        if (deptRes.ok) {
          const deptData = await deptRes.json()
          setDeptLearningType(deptData.learningType || 'general_studies')
        }
      }

      const coursesRes = await fetch(`${API_BASE}/api/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const coursesData = await coursesRes.json()
      setCourses(Array.isArray(coursesData) ? coursesData : [])

      const myLessonsRes = await fetch(`${API_BASE}/api/lessons/my-lessons`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (myLessonsRes.ok) {
        const myLessonsData = await myLessonsRes.json()
        setMyLessons(Array.isArray(myLessonsData) ? myLessonsData : [])
      }
    }
    setup()
  }, [])

  const buildBody = () => ({
    courseId, weekNumber, title, description, duration,
    objectives: objectives.filter(o => o.trim()),
    videoLinks: videoLinks.filter(v => v.url.trim()),
    references: references.filter(r => r.trim()),
    aiSimplifiedContent: lessonContent || null,
    departmentType: deptLearningType,
    // dept specific
    pronunciationExercises,
    phoneticsExercises,
    syntaxDrills,
    languageVocab,
    caseStudies,
    labProcedures,
    scriptContent,
    performanceNotes,
    creativePrompts,
    fieldObservations,
    codeExercises,
    businessCases,
    articleDrafts,
    broadcastScripts,
  })

  const saveLesson = async (submitForReview = false) => {
    setSubmitting(true)
    setMessage('')
    try {
      let res
      if (lessonId) {
        res = await fetch(`${API_BASE}/api/lessons/${lessonId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(buildBody()),
        })
      } else {
        res = await fetch(`${API_BASE}/api/lessons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(buildBody()),
        })
      }

      const data = await res.json()
      if (!res.ok) { setMessage(data.message || 'Failed to save'); setSubmitting(false); return }
      setLessonId(data._id)

      if (submitForReview) {
        await fetch(`${API_BASE}/api/lessons/${data._id}/submit`, {
          method: 'PUT', headers: { Authorization: `Bearer ${token}` },
        })
        setMessage('Lesson submitted for review!')
        setTimeout(() => router.push('/learning-hub'), 2000)
      } else {
        setMessage('Lesson saved!')
        if (step < 4) setStep(step + 1)
      }
    } catch (err) {
      setMessage('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  // Helpers
  const addVideoLink = () => setVideoLinks([...videoLinks, { title: '', url: '' }])
  const removeVideoLink = (i: number) => setVideoLinks(videoLinks.filter((_, idx) => idx !== i))
  const updateVideoLink = (i: number, field: 'title' | 'url', val: string) => {
    const updated = [...videoLinks]; updated[i][field] = val; setVideoLinks(updated)
  }

  const addObjective = () => setObjectives([...objectives, ''])
  const removeObjective = (i: number) => setObjectives(objectives.filter((_, idx) => idx !== i))
  const updateObjective = (i: number, val: string) => {
    const updated = [...objectives]; updated[i] = val; setObjectives(updated)
  }

  const steps = [
    { number: 1, label: 'Create Topic', desc: 'Define the lesson' },
    { number: 2, label: 'Objectives', desc: 'Learning goals' },
    { number: 3, label: 'Content', desc: 'Lesson materials' },
    { number: 4, label: 'Submit', desc: 'Review and submit' },
  ]

  return (
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>

      {/* Header */}
      <div style={{
        background: deptColor,
        padding: '20px 24px',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <button
          onClick={() => router.push('/learning-hub')}
          style={{
            background: 'rgba(255,255,255,0.15)', border: 'none',
            borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
            fontSize: 13, color: 'white',
          }}
        >
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 2 }}>
            {deptLabel.icon} {deptLabel.label} • Create Lesson
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'white' }}>
            New Lesson
          </h1>
        </div>
        <button
          onClick={() => setShowMyLessons(!showMyLessons)}
          style={{
            background: 'rgba(255,255,255,0.15)', border: 'none',
            borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
            fontSize: 13, color: 'white', fontWeight: 600,
          }}
        >
          📋 My Lessons ({myLessons.length})
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 260px', gap: 24 }}>

        {/* Main form */}
        <div>

          {/* My Lessons Panel */}
          {showMyLessons && (
            <div style={{ background: 'white', borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>My Lessons</h3>
                <button onClick={() => setShowMyLessons(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18 }}>×</button>
              </div>
              {myLessons.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: 13 }}>No lessons yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {myLessons.map((lesson: any) => {
                    const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
                      draft: { color: '#6b7280', bg: '#f3f4f6', label: '📝 Draft' },
                      pending_review: { color: '#d97706', bg: '#fef3c7', label: '⏳ Pending' },
                      published: { color: '#16a34a', bg: '#f0fdf4', label: '✅ Published' },
                      rejected: { color: '#dc2626', bg: '#fef2f2', label: '❌ Rejected' },
                      approved: { color: '#2563eb', bg: '#eff6ff', label: '✓ Approved' },
                    }
                    const cfg = statusConfig[lesson.status] || statusConfig.draft
                    return (
                      <div key={lesson._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, color: deptColor, fontWeight: 600 }}>{lesson.course?.code} • Week {lesson.weekNumber}</div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{lesson.title}</div>
                          {lesson.reviewNotes && (
                            <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3, background: '#fef2f2', padding: '2px 6px', borderRadius: 4 }}>
                              💬 {lesson.reviewNotes}
                            </div>
                          )}
                        </div>
                        <span style={{ background: cfg.bg, color: cfg.color, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                          {cfg.label}
                        </span>
                        {(lesson.status === 'draft' || lesson.status === 'rejected') && (
                          <button
                            onClick={() => {
                              setCourseId(lesson.course?._id || '')
                              setWeekNumber(lesson.weekNumber)
                              setTitle(lesson.title)
                              setDescription(lesson.description || '')
                              setObjectives(lesson.objectives?.length ? lesson.objectives : [''])
                              setVideoLinks(lesson.videoLinks?.length ? lesson.videoLinks : [{ title: '', url: '' }])
                              setLessonContent(lesson.aiSimplifiedContent || '')
                              setScriptContent(lesson.scriptContent || '')
                              setCodeExercises(lesson.codeExercises || [])
                              setLanguageVocab(lesson.languageVocab || [])
                              setPronunciationExercises(lesson.pronunciationExercises || [])
                              setLessonId(lesson._id)
                              setStep(1)
                              setShowMyLessons(false)
                            }}
                            style={{ background: '#f0fdf4', border: 'none', borderRadius: 6, color: '#16a34a', padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                          >
                            ✏️ Edit
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 1 — Basic Info */}
          {step >= 1 && (
            <div style={{
              background: 'white', borderRadius: 14, padding: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16,
              border: step === 1 ? `2px solid ${deptColor}` : '2px solid transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: step > 1 ? deptColor : deptColor + '20',
                  border: `2px solid ${deptColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: step > 1 ? 'white' : deptColor,
                }}>
                  {step > 1 ? '✓' : '1'}
                </div>
                <h2 style={{ fontSize: 16, margin: 0 }}>Lesson Topic</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label>Course *</label>
                  <select value={courseId} onChange={e => setCourseId(e.target.value)} required>
                    <option value="">Select course...</option>
                    {courses.map(c => (
                      <option key={c._id} value={c._id}>{c.code} — {c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Week Number *</label>
                  <input type="number" min={1} max={52} value={weekNumber} onChange={e => setWeekNumber(parseInt(e.target.value))} />
                </div>
              </div>

              <label>Topic Title *</label>
              <input
                type="text" placeholder={`e.g. Week ${weekNumber} — ${deptLabel.label} Fundamentals`}
                value={title} onChange={e => setTitle(e.target.value)} required
              />

              <label>Short Description</label>
              <textarea
                placeholder="Brief overview of this lesson..."
                value={description} onChange={e => setDescription(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, resize: 'vertical', fontFamily: 'inherit', outline: 'none', marginTop: 4 }}
              />

              <label>Duration (days)</label>
              <input type="number" min={1} max={30} value={duration} onChange={e => setDuration(parseInt(e.target.value))} />

              {step === 1 && (
                <button className="btn-primary" onClick={() => saveLesson(false)} disabled={!courseId || !title || submitting} style={{ marginTop: 16, background: deptColor }}>
                  {submitting ? 'Saving...' : 'Save & Continue →'}
                </button>
              )}
            </div>
          )}

          {/* STEP 2 — Objectives */}
          {step >= 2 && (
            <div style={{
              background: 'white', borderRadius: 14, padding: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16,
              border: step === 2 ? `2px solid ${deptColor}` : '2px solid transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: step > 2 ? deptColor : deptColor + '20',
                  border: `2px solid ${deptColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: step > 2 ? 'white' : deptColor,
                }}>
                  {step > 2 ? '✓' : '2'}
                </div>
                <h2 style={{ fontSize: 16, margin: 0 }}>Learning Objectives</h2>
              </div>

              <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 14 }}>
                What will students be able to do after this lesson?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {objectives.map((obj, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: deptColor + '15', border: `1px solid ${deptColor}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, color: deptColor, fontWeight: 700, flexShrink: 0, marginTop: 7,
                    }}>✓</div>
                    <input
                      type="text" placeholder={`Objective ${i + 1}...`}
                      value={obj} onChange={e => updateObjective(i, e.target.value)}
                      style={{ flex: 1 }}
                    />
                    {objectives.length > 1 && (
                      <button onClick={() => removeObjective(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, color: '#ef4444', cursor: 'pointer', padding: '0 10px', fontSize: 16 }}>×</button>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={addObjective} style={{ marginTop: 10, background: 'none', border: `1px dashed ${deptColor}40`, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, color: '#6b7280', width: '100%' }}>
                + Add Objective
              </button>

              {step === 2 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                  <button className="btn-outline" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn-primary" onClick={() => saveLesson(false)} disabled={submitting} style={{ flex: 1, background: deptColor }}>
                    {submitting ? 'Saving...' : 'Save & Continue →'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — Content (dept-specific) */}
          {step >= 3 && (
            <div style={{
              background: 'white', borderRadius: 14, padding: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16,
              border: step === 3 ? `2px solid ${deptColor}` : '2px solid transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: step > 3 ? deptColor : deptColor + '20',
                  border: `2px solid ${deptColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: step > 3 ? 'white' : deptColor,
                }}>
                  {step > 3 ? '✓' : deptLabel.icon}
                </div>
                <div>
                  <h2 style={{ fontSize: 16, margin: 0 }}>Lesson Content</h2>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>
                    {deptLabel.label} specific content
                  </p>
                </div>
              </div>

              {/* GENERAL NOTES — all depts */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  📄 Lesson Notes
                </label>
                <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
                  Main lesson content students will read
                </p>
                <textarea
                  placeholder="Write your lesson notes here..."
                  value={lessonContent} onChange={e => setLessonContent(e.target.value)}
                  rows={8}
                  style={{ width: '100%', padding: '14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, resize: 'vertical', fontFamily: 'monospace', outline: 'none', lineHeight: 1.7, background: '#fafafa' }}
                />
              </div>

              {/* ===== LANGUAGE & LINGUISTICS ===== */}
              {deptLearningType === 'language_linguistics' && (
                <div>
                  <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed', marginBottom: 12 }}>
                      🗣️ Pronunciation Exercises
                    </h3>
                    {pronunciationExercises.map((ex: any, i: number) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8, padding: 10, background: 'white', borderRadius: 8 }}>
                        <input placeholder="Word" value={ex.word || ''} onChange={e => { const u = [...pronunciationExercises]; u[i] = { ...u[i], word: e.target.value }; setPronunciationExercises(u) }} />
                        <input placeholder="Language (e.g. French)" value={ex.language || ''} onChange={e => { const u = [...pronunciationExercises]; u[i] = { ...u[i], language: e.target.value }; setPronunciationExercises(u) }} />
                        <input placeholder="Phonetic /fəˈnɛtɪk/" value={ex.phonetic || ''} onChange={e => { const u = [...pronunciationExercises]; u[i] = { ...u[i], phonetic: e.target.value }; setPronunciationExercises(u) }} />
                        <input placeholder="Instructions for student" value={ex.instructions || ''} onChange={e => { const u = [...pronunciationExercises]; u[i] = { ...u[i], instructions: e.target.value }; setPronunciationExercises(u) }} style={{ gridColumn: '1 / -1' }} />
                      </div>
                    ))}
                    <button onClick={() => setPronunciationExercises([...pronunciationExercises, { word: '', language: '', phonetic: '', instructions: '' }])}
                      style={{ background: 'none', border: '1px dashed #c4b5fd', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#7c3aed', width: '100%' }}>
                      + Add Pronunciation Exercise
                    </button>
                  </div>

                  <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed', marginBottom: 12 }}>
                      📚 Vocabulary List
                    </h3>
                    {languageVocab.map((v: any, i: number) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <input placeholder="Word" value={v.word || ''} onChange={e => { const u = [...languageVocab]; u[i] = { ...u[i], word: e.target.value }; setLanguageVocab(u) }} />
                        <input placeholder="Translation" value={v.translation || ''} onChange={e => { const u = [...languageVocab]; u[i] = { ...u[i], translation: e.target.value }; setLanguageVocab(u) }} />
                        <input placeholder="Language" value={v.language || ''} onChange={e => { const u = [...languageVocab]; u[i] = { ...u[i], language: e.target.value }; setLanguageVocab(u) }} />
                        <input placeholder="Example sentence" value={v.example || ''} onChange={e => { const u = [...languageVocab]; u[i] = { ...u[i], example: e.target.value }; setLanguageVocab(u) }} />
                      </div>
                    ))}
                    <button onClick={() => setLanguageVocab([...languageVocab, { word: '', translation: '', language: '', example: '' }])}
                      style={{ background: 'none', border: '1px dashed #c4b5fd', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#7c3aed', width: '100%' }}>
                      + Add Vocabulary Word
                    </button>
                  </div>

                  <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed', marginBottom: 12 }}>
                      🧩 Syntax Drills
                    </h3>
                    {syntaxDrills.map((d: any, i: number) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8, padding: 10, background: 'white', borderRadius: 8 }}>
                        <input placeholder="Sentence to analyse" value={d.sentence || ''} onChange={e => { const u = [...syntaxDrills]; u[i] = { ...u[i], sentence: e.target.value }; setSyntaxDrills(u) }} />
                        <input placeholder="Instruction for student" value={d.instruction || ''} onChange={e => { const u = [...syntaxDrills]; u[i] = { ...u[i], instruction: e.target.value }; setSyntaxDrills(u) }} />
                        <input placeholder="Expected answer" value={d.answer || ''} onChange={e => { const u = [...syntaxDrills]; u[i] = { ...u[i], answer: e.target.value }; setSyntaxDrills(u) }} style={{ gridColumn: '1 / -1' }} />
                      </div>
                    ))}
                    <button onClick={() => setSyntaxDrills([...syntaxDrills, { sentence: '', instruction: '', answer: '' }])}
                      style={{ background: 'none', border: '1px dashed #c4b5fd', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#7c3aed', width: '100%' }}>
                      + Add Syntax Drill
                    </button>
                  </div>
                </div>
              )}

              {/* ===== SCIENCE & MEDICINE ===== */}
              {deptLearningType === 'science_medicine' && (
                <div>
                  <div style={{ background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0891b2', marginBottom: 12 }}>
                      📋 Case Studies
                    </h3>
                    {caseStudies.map((cs: any, i: number) => (
                      <div key={i} style={{ padding: 12, background: 'white', borderRadius: 8, marginBottom: 8 }}>
                        <input placeholder="Case Study Title" value={cs.title || ''} onChange={e => { const u = [...caseStudies]; u[i] = { ...u[i], title: e.target.value }; setCaseStudies(u) }} style={{ marginBottom: 8 }} />
                        <textarea placeholder="Case description..." value={cs.description || ''} onChange={e => { const u = [...caseStudies]; u[i] = { ...u[i], description: e.target.value }; setCaseStudies(u) }} rows={3}
                          style={{ width: '100%', padding: '10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', outline: 'none' }} />
                      </div>
                    ))}
                    <button onClick={() => setCaseStudies([...caseStudies, { title: '', description: '', questions: [] }])}
                      style={{ background: 'none', border: '1px dashed #67e8f9', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#0891b2', width: '100%' }}>
                      + Add Case Study
                    </button>
                  </div>

                  <div style={{ background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0891b2', marginBottom: 12 }}>
                      🧪 Lab Procedures
                    </h3>
                    {labProcedures.map((lp: any, i: number) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                        <div style={{ textAlign: 'center', fontWeight: 700, color: '#0891b2' }}>Step {i + 1}</div>
                        <input placeholder="Instruction" value={lp.instruction || ''} onChange={e => { const u = [...labProcedures]; u[i] = { ...u[i], instruction: e.target.value }; setLabProcedures(u) }} />
                        <input placeholder="Safety note (optional)" value={lp.safetyNote || ''} onChange={e => { const u = [...labProcedures]; u[i] = { ...u[i], safetyNote: e.target.value }; setLabProcedures(u) }} />
                      </div>
                    ))}
                    <button onClick={() => setLabProcedures([...labProcedures, { step: labProcedures.length + 1, instruction: '', safetyNote: '' }])}
                      style={{ background: 'none', border: '1px dashed #67e8f9', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#0891b2', width: '100%' }}>
                      + Add Lab Step
                    </button>
                  </div>
                </div>
              )}

              {/* ===== ARTS & PERFORMANCE ===== */}
              {deptLearningType === 'arts_performance' && (
                <div>
                  <div style={{ background: '#fdf2f8', border: '1px solid #f9a8d4', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#be185d', marginBottom: 12 }}>
                      📜 Script / Text Content
                    </h3>
                    <textarea
                      placeholder="Paste the script, poem, play or text for students to study..."
                      value={scriptContent} onChange={e => setScriptContent(e.target.value)}
                      rows={10}
                      style={{ width: '100%', padding: '14px', border: '1.5px solid #f9a8d4', borderRadius: 8, fontSize: 14, resize: 'vertical', fontFamily: 'serif', outline: 'none', lineHeight: 1.8 }}
                    />
                  </div>

                  <div style={{ background: '#fdf2f8', border: '1px solid #f9a8d4', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#be185d', marginBottom: 12 }}>
                      🎬 Performance Notes
                    </h3>
                    {performanceNotes.map((note: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <input placeholder={`Note ${i + 1}...`} value={note} onChange={e => { const u = [...performanceNotes]; u[i] = e.target.value; setPerformanceNotes(u) }} />
                        {performanceNotes.length > 1 && (
                          <button onClick={() => setPerformanceNotes(performanceNotes.filter((_, idx) => idx !== i))} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, color: '#ef4444', cursor: 'pointer', padding: '0 10px', fontSize: 16 }}>×</button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => setPerformanceNotes([...performanceNotes, ''])}
                      style={{ background: 'none', border: '1px dashed #f9a8d4', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#be185d', width: '100%' }}>
                      + Add Performance Note
                    </button>
                  </div>

                  <div style={{ background: '#fdf2f8', border: '1px solid #f9a8d4', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#be185d', marginBottom: 12 }}>
                      ✨ Creative Prompts
                    </h3>
                    {creativePrompts.map((prompt: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <input placeholder={`Creative prompt ${i + 1}...`} value={prompt} onChange={e => { const u = [...creativePrompts]; u[i] = e.target.value; setCreativePrompts(u) }} />
                        {creativePrompts.length > 1 && (
                          <button onClick={() => setCreativePrompts(creativePrompts.filter((_, idx) => idx !== i))} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, color: '#ef4444', cursor: 'pointer', padding: '0 10px', fontSize: 16 }}>×</button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => setCreativePrompts([...creativePrompts, ''])}
                      style={{ background: 'none', border: '1px dashed #f9a8d4', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#be185d', width: '100%' }}>
                      + Add Creative Prompt
                    </button>
                  </div>
                </div>
              )}

              {/* ===== AGRICULTURE ===== */}
              {deptLearningType === 'agriculture_environment' && (
                <div>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#15803d', marginBottom: 12 }}>
                      🌾 Field Observations
                    </h3>
                    {fieldObservations.map((obs: any, i: number) => (
                      <div key={i} style={{ padding: 12, background: 'white', borderRadius: 8, marginBottom: 8 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                          <input placeholder="Observation title" value={obs.title || ''} onChange={e => { const u = [...fieldObservations]; u[i] = { ...u[i], title: e.target.value }; setFieldObservations(u) }} />
                          <input placeholder="Crop type" value={obs.cropType || ''} onChange={e => { const u = [...fieldObservations]; u[i] = { ...u[i], cropType: e.target.value }; setFieldObservations(u) }} />
                          <input placeholder="Season" value={obs.season || ''} onChange={e => { const u = [...fieldObservations]; u[i] = { ...u[i], season: e.target.value }; setFieldObservations(u) }} />
                        </div>
                        <textarea placeholder="Observation description..." value={obs.description || ''} onChange={e => { const u = [...fieldObservations]; u[i] = { ...u[i], description: e.target.value }; setFieldObservations(u) }} rows={2}
                          style={{ width: '100%', padding: '8px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', outline: 'none' }} />
                      </div>
                    ))}
                    <button onClick={() => setFieldObservations([...fieldObservations, { title: '', description: '', season: '', cropType: '' }])}
                      style={{ background: 'none', border: '1px dashed #86efac', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#15803d', width: '100%' }}>
                      + Add Field Observation
                    </button>
                  </div>
                </div>
              )}

              {/* ===== ENGINEERING & TECHNOLOGY ===== */}
              {deptLearningType === 'engineering_technology' && (
                <div>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2563eb', marginBottom: 12 }}>
                      💻 Coding Exercises
                    </h3>
                    {codeExercises.map((ex: any, i: number) => (
                      <div key={i} style={{ padding: 12, background: 'white', borderRadius: 8, marginBottom: 8 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                          <input placeholder="Exercise title" value={ex.title || ''} onChange={e => { const u = [...codeExercises]; u[i] = { ...u[i], title: e.target.value }; setCodeExercises(u) }} />
                          <select value={ex.language || 'python'} onChange={e => { const u = [...codeExercises]; u[i] = { ...u[i], language: e.target.value }; setCodeExercises(u) }}>
                            <option value="python">Python</option>
                            <option value="javascript">JavaScript</option>
                            <option value="c">C</option>
                            <option value="cpp">C++</option>
                            <option value="java">Java</option>
                          </select>
                        </div>
                        <input placeholder="Exercise description" value={ex.description || ''} onChange={e => { const u = [...codeExercises]; u[i] = { ...u[i], description: e.target.value }; setCodeExercises(u) }} style={{ marginBottom: 8 }} />
                        <textarea placeholder="Starter code (optional)..." value={ex.starterCode || ''} onChange={e => { const u = [...codeExercises]; u[i] = { ...u[i], starterCode: e.target.value }; setCodeExercises(u) }} rows={4}
                          style={{ width: '100%', padding: '10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'monospace', outline: 'none', background: '#1e1e2e', color: '#cdd6f4', marginBottom: 8 }} />
                        <input placeholder="Expected output" value={ex.expectedOutput || ''} onChange={e => { const u = [...codeExercises]; u[i] = { ...u[i], expectedOutput: e.target.value }; setCodeExercises(u) }} />
                      </div>
                    ))}
                    <button onClick={() => setCodeExercises([...codeExercises, { title: '', description: '', starterCode: '', language: 'python', expectedOutput: '', hints: [] }])}
                      style={{ background: 'none', border: '1px dashed #93c5fd', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#2563eb', width: '100%' }}>
                      + Add Coding Exercise
                    </button>
                  </div>
                </div>
              )}

              {/* ===== BUSINESS & ECONOMICS ===== */}
              {deptLearningType === 'business_economics' && (
                <div>
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#d97706', marginBottom: 12 }}>
                      🏢 Business Case Studies
                    </h3>
                    {businessCases.map((bc: any, i: number) => (
                      <div key={i} style={{ padding: 12, background: 'white', borderRadius: 8, marginBottom: 8 }}>
                        <input placeholder="Company / Organization name" value={bc.company || ''} onChange={e => { const u = [...businessCases]; u[i] = { ...u[i], company: e.target.value }; setBusinessCases(u) }} style={{ marginBottom: 8 }} />
                        <textarea placeholder="Situation / Background..." value={bc.situation || ''} onChange={e => { const u = [...businessCases]; u[i] = { ...u[i], situation: e.target.value }; setBusinessCases(u) }} rows={3}
                          style={{ width: '100%', padding: '10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', outline: 'none' }} />
                      </div>
                    ))}
                    <button onClick={() => setBusinessCases([...businessCases, { company: '', situation: '', questions: [], data: '' }])}
                      style={{ background: 'none', border: '1px dashed #fcd34d', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#d97706', width: '100%' }}>
                      + Add Business Case
                    </button>
                  </div>
                </div>
              )}

              {/* ===== JOURNALISM & MEDIA ===== */}
              {deptLearningType === 'journalism_media' && (
                <div>
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', marginBottom: 12 }}>
                      ✍️ Article Writing Exercises
                    </h3>
                    {articleDrafts.map((a: any, i: number) => (
                      <div key={i} style={{ padding: 12, background: 'white', borderRadius: 8, marginBottom: 8 }}>
                        <input placeholder="Headline / Title" value={a.headline || ''} onChange={e => { const u = [...articleDrafts]; u[i] = { ...u[i], headline: e.target.value }; setArticleDrafts(u) }} style={{ marginBottom: 8 }} />
                        <input placeholder="Brief / Story angle" value={a.brief || ''} onChange={e => { const u = [...articleDrafts]; u[i] = { ...u[i], brief: e.target.value }; setArticleDrafts(u) }} style={{ marginBottom: 8 }} />
                        <input placeholder="Instructions for student" value={a.instructions || ''} onChange={e => { const u = [...articleDrafts]; u[i] = { ...u[i], instructions: e.target.value }; setArticleDrafts(u) }} />
                      </div>
                    ))}
                    <button onClick={() => setArticleDrafts([...articleDrafts, { headline: '', brief: '', instructions: '' }])}
                      style={{ background: 'none', border: '1px dashed #fca5a5', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#dc2626', width: '100%' }}>
                      + Add Article Exercise
                    </button>
                  </div>

                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', marginBottom: 12 }}>
                      📡 Broadcast Scripts
                    </h3>
                    {broadcastScripts.map((s: any, i: number) => (
                      <div key={i} style={{ padding: 12, background: 'white', borderRadius: 8, marginBottom: 8 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginBottom: 8 }}>
                          <input placeholder="Script title" value={s.title || ''} onChange={e => { const u = [...broadcastScripts]; u[i] = { ...u[i], title: e.target.value }; setBroadcastScripts(u) }} />
                          <input placeholder="Duration (e.g. 2 mins)" value={s.duration || ''} onChange={e => { const u = [...broadcastScripts]; u[i] = { ...u[i], duration: e.target.value }; setBroadcastScripts(u) }} />
                        </div>
                        <textarea placeholder="Broadcast script..." value={s.script || ''} onChange={e => { const u = [...broadcastScripts]; u[i] = { ...u[i], script: e.target.value }; setBroadcastScripts(u) }} rows={4}
                          style={{ width: '100%', padding: '10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', outline: 'none' }} />
                      </div>
                    ))}
                    <button onClick={() => setBroadcastScripts([...broadcastScripts, { title: '', script: '', duration: '' }])}
                      style={{ background: 'none', border: '1px dashed #fca5a5', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#dc2626', width: '100%' }}>
                      + Add Broadcast Script
                    </button>
                  </div>
                </div>
              )}

              {/* VIDEO LINKS — all depts */}
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>🎥 Video Links</h3>
                {videoLinks.map((v, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input type="text" placeholder="Video title" value={v.title} onChange={e => updateVideoLink(i, 'title', e.target.value)} style={{ flex: 1 }} />
                    <input type="url" placeholder="https://youtube.com/..." value={v.url} onChange={e => updateVideoLink(i, 'url', e.target.value)} style={{ flex: 2 }} />
                    {videoLinks.length > 1 && (
                      <button onClick={() => removeVideoLink(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, color: '#ef4444', cursor: 'pointer', padding: '0 10px', fontSize: 16 }}>×</button>
                    )}
                  </div>
                ))}
                <button onClick={addVideoLink} style={{ background: 'none', border: '1px dashed #e5e7eb', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#6b7280', width: '100%' }}>
                  + Add Video Link
                </button>
              </div>

              {step === 3 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                  <button className="btn-outline" onClick={() => setStep(2)}>← Back</button>
                  <button className="btn-primary" onClick={() => saveLesson(false)} disabled={submitting} style={{ flex: 1, background: deptColor }}>
                    {submitting ? 'Saving...' : 'Save & Continue →'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — Submit */}
          {step >= 4 && (
            <div style={{
              background: 'white', borderRadius: 14, padding: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16,
              border: `2px solid ${deptColor}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: deptColor + '20', border: `2px solid ${deptColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: deptColor,
                }}>
                  🚀
                </div>
                <h2 style={{ fontSize: 16, margin: 0 }}>Review & Submit</h2>
              </div>

              {/* Summary */}
              <div style={{ background: '#f9fafb', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <h3 style={{ fontSize: 13, marginBottom: 10, color: '#374151' }}>Lesson Summary</h3>
                {[
                  { label: 'Course', value: courses.find(c => c._id === courseId)?.title || '—' },
                  { label: 'Week', value: `Week ${weekNumber}` },
                  { label: 'Title', value: title },
                  { label: 'Department Type', value: `${deptLabel.icon} ${deptLabel.label}` },
                  { label: 'Objectives', value: `${objectives.filter(o => o.trim()).length} added` },
                  { label: 'Video Links', value: `${videoLinks.filter(v => v.url.trim()).length} added` },
                  ...(deptLearningType === 'language_linguistics' ? [
                    { label: 'Pronunciation Exercises', value: pronunciationExercises.length },
                    { label: 'Vocabulary Words', value: languageVocab.length },
                    { label: 'Syntax Drills', value: syntaxDrills.length },
                  ] : []),
                  ...(deptLearningType === 'engineering_technology' ? [
                    { label: 'Coding Exercises', value: codeExercises.length },
                  ] : []),
                  ...(deptLearningType === 'science_medicine' ? [
                    { label: 'Case Studies', value: caseStudies.length },
                    { label: 'Lab Steps', value: labProcedures.length },
                  ] : []),
                  ...(deptLearningType === 'arts_performance' ? [
                    { label: 'Script', value: scriptContent ? 'Added' : 'None' },
                    { label: 'Performance Notes', value: performanceNotes.filter(n => n.trim()).length },
                  ] : []),
                  ...(deptLearningType === 'agriculture_environment' ? [
                    { label: 'Field Observations', value: fieldObservations.length },
                  ] : []),
                  ...(deptLearningType === 'journalism_media' ? [
                    { label: 'Article Exercises', value: articleDrafts.length },
                    { label: 'Broadcast Scripts', value: broadcastScripts.length },
                  ] : []),
                  ...(deptLearningType === 'business_economics' ? [
                    { label: 'Business Cases', value: businessCases.length },
                  ] : []),
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #e5e7eb', fontSize: 13 }}>
                    <span style={{ color: '#6b7280' }}>{item.label}</span>
                    <span style={{ fontWeight: 600, color: '#1f2937' }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {message && (
                <div className={message.includes('submitted') || message.includes('saved') ? 'alert alert-success' : 'alert alert-error'} style={{ marginBottom: 16 }}>
                  {message}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-outline" onClick={() => setStep(3)}>← Back</button>
                <button className="btn-outline" onClick={() => saveLesson(false)} disabled={submitting}>
                  Save Draft
                </button>
                <button
                  onClick={() => saveLesson(true)}
                  disabled={submitting}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: deptColor, color: 'white', fontSize: 14, fontWeight: 700 }}
                >
                  {submitting ? 'Submitting...' : '🚀 Submit for Approval'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Steps sidebar */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Creating Lesson</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {steps.map((s, i) => (
                <div key={s.number} style={{ display: 'flex', gap: 12, paddingBottom: i < steps.length - 1 ? 16 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: step > s.number ? deptColor : step === s.number ? deptColor : '#f3f4f6',
                      color: step >= s.number ? 'white' : '#9ca3af',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>
                      {step > s.number ? '✓' : s.number}
                    </div>
                    {i < steps.length - 1 && (
                      <div style={{ width: 2, flex: 1, minHeight: 20, background: step > s.number ? deptColor : '#e5e7eb', margin: '4px 0' }} />
                    )}
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: step === s.number ? 700 : 500, color: step >= s.number ? '#1f2937' : '#9ca3af' }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dept type badge */}
          <div style={{ background: deptColor + '15', border: `1px solid ${deptColor}30`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{deptLabel.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: deptColor, marginBottom: 4 }}>{deptLabel.label}</div>
            <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.5 }}>
              This lesson creation form is customised for {deptLabel.label} departments.
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}