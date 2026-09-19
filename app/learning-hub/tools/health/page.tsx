'use client'

import { useState } from 'react'
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

const SPECIALTIES = [
  { id: 'cardiology', label: 'Cardiology', icon: '❤️', color: '#dc2626', desc: 'Heart and circulatory system' },
  { id: 'neurology', label: 'Neurology', icon: '🧠', color: '#7c3aed', desc: 'Brain and nervous system' },
  { id: 'respiratory', label: 'Respiratory', icon: '🫁', color: '#2563eb', desc: 'Lungs and breathing' },
  { id: 'gastroenterology', label: 'Gastroenterology', icon: '🫃', color: '#16a34a', desc: 'Digestive system' },
  { id: 'endocrinology', label: 'Endocrinology', icon: '⚗️', color: '#d97706', desc: 'Hormones and metabolism' },
  { id: 'infectious', label: 'Infectious Disease', icon: '🦠', color: '#be185d', desc: 'Infections and immunity' },
  { id: 'surgery', label: 'Surgery', icon: '🔪', color: '#374151', desc: 'Surgical emergencies' },
  { id: 'paediatrics', label: 'Paediatrics', icon: '👶', color: '#0891b2', desc: 'Children\'s medicine' },
  { id: 'obstetrics', label: 'Obstetrics', icon: '🤰', color: '#db2777', desc: 'Pregnancy and childbirth' },
  { id: 'psychiatry', label: 'Psychiatry', icon: '🧘', color: '#6d28d9', desc: 'Mental health conditions' },
  { id: 'pharmacology', label: 'Pharmacology', icon: '💊', color: '#b45309', desc: 'Drugs and mechanisms' },
  { id: 'biochemistry', label: 'Biochemistry', icon: '🔬', color: '#0f766e', desc: 'Chemical processes in life' },
]

const DIFFICULTIES = [
  { id: 'beginner', label: '🌱 Beginner', desc: 'Year 1-2 medical student', color: '#16a34a' },
  { id: 'intermediate', label: '📚 Intermediate', desc: 'Year 3-4 clinical student', color: '#d97706' },
  { id: 'advanced', label: '🔥 Advanced', desc: 'Final year / House officer', color: '#dc2626' },
]

const MODES = [
  { id: 'case', label: '🩺 Patient Case', desc: 'Diagnose and manage a patient' },
  { id: 'quiz', label: '❓ MCQ Quiz', desc: '5 multiple choice questions' },
  { id: 'drug', label: '💊 Drug Explainer', desc: 'Learn about any drug' },
  { id: 'anatomy', label: '🫀 Anatomy Quiz', desc: 'Test your anatomy knowledge' },
  { id: 'chemistry', label: '⚗️ Biochemistry', desc: 'Chemistry concepts explained' },
]

export default function HealthSciencesHub() {
  const [activeTab, setActiveTab] = useState<'ai' | 'vitals' | 'reference'>('ai')

  // AI Generator state
  const [selectedSpecialty, setSelectedSpecialty] = useState<any>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<any>(null)
  const [selectedMode, setSelectedMode] = useState<any>(null)
  const [customTopic, setCustomTopic] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [error, setError] = useState('')

  // Case interaction
  const [userDiagnosis, setUserDiagnosis] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [drugQuery, setDrugQuery] = useState('')

  // Vitals
  const [hrValue, setHrValue] = useState('')
  const [bpSys, setBpSys] = useState('')
  const [bpDia, setBpDia] = useState('')
  const [tempValue, setTempValue] = useState('')
  const [rrValue, setRrValue] = useState('')
  const [o2Value, setO2Value] = useState('')
  const [gcsValue, setGcsValue] = useState('')

  const generateContent = async () => {
    if (!selectedMode) return
    setGenerating(true)
    setError('')
    setGeneratedContent(null)
    setShowAnswer(false)
    setUserDiagnosis('')
    setSelectedAnswer(null)
    setShowExplanation(false)
    setQuizAnswers({})
    setQuizSubmitted(false)

    try {
      let prompt = ''

      if (selectedMode.id === 'case') {
        prompt = `You are a medical education expert. Generate a realistic patient case for a ${selectedDifficulty?.id || 'intermediate'} level medical student studying ${selectedSpecialty?.label || 'General Medicine'}.

Return ONLY valid JSON in this exact format:
{
  "title": "Case title",
  "specialty": "${selectedSpecialty?.label || 'General Medicine'}",
  "difficulty": "${selectedDifficulty?.label || 'Intermediate'}",
  "presenting": "Detailed presenting complaint (2-3 sentences with age, sex, symptoms)",
  "vitals": {
    "BP": "xxx/xx mmHg",
    "HR": "xx bpm",
    "RR": "xx/min",
    "Temp": "xx.x°C",
    "O2Sat": "xx%"
  },
  "history": "Relevant past medical history, medications, social history",
  "examination": "Key examination findings",
  "investigations": [
    {"test": "Test name", "result": "Result value", "abnormal": true/false}
  ],
  "diagnosis": "The correct diagnosis",
  "differentials": ["differential 1", "differential 2", "differential 3"],
  "management": ["step 1", "step 2", "step 3", "step 4"],
  "keyLearning": "The single most important teaching point from this case",
  "mnemonic": "A helpful mnemonic or memory aid related to this case"
}`

      } else if (selectedMode.id === 'quiz') {
        prompt = `Generate 5 multiple choice questions for a ${selectedDifficulty?.id || 'intermediate'} medical student about ${selectedSpecialty?.label || 'General Medicine'}${customTopic ? ` focusing on ${customTopic}` : ''}.

Return ONLY valid JSON:
{
  "title": "Quiz title",
  "questions": [
    {
      "question": "Question text",
      "options": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
      "answer": "A",
      "explanation": "Why this is correct and why others are wrong",
      "keyPoint": "The main learning point"
    }
  ]
}`

      } else if (selectedMode.id === 'drug') {
        prompt = `Explain the drug "${drugQuery || 'Metformin'}" for a medical student.

Return ONLY valid JSON:
{
  "drugName": "Drug name",
  "class": "Drug class",
  "mechanism": "Detailed mechanism of action",
  "uses": ["use 1", "use 2", "use 3"],
  "sideEffects": ["side effect 1", "side effect 2", "side effect 3"],
  "contraindications": ["contraindication 1", "contraindication 2"],
  "interactions": ["interaction 1", "interaction 2"],
  "dose": "Typical adult dose",
  "monitoring": "What to monitor",
  "mnemonic": "Memory aid",
  "clinicalPearl": "Most important clinical tip",
  "funFact": "Interesting fact about this drug"
}`

      } else if (selectedMode.id === 'anatomy') {
        prompt = `Generate an anatomy quiz about ${selectedSpecialty?.label || 'the cardiovascular system'} for a ${selectedDifficulty?.id || 'intermediate'} medical student.

Return ONLY valid JSON:
{
  "title": "Anatomy quiz title",
  "system": "${selectedSpecialty?.label}",
  "questions": [
    {
      "question": "Anatomy question",
      "options": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
      "answer": "A",
      "explanation": "Detailed anatomical explanation",
      "clinicalRelevance": "Why this matters clinically"
    }
  ]
}`

      } else if (selectedMode.id === 'chemistry') {
        prompt = `Explain this biochemistry/chemistry concept for medical students: "${customTopic || selectedSpecialty?.label || 'ATP production'}".

Return ONLY valid JSON:
{
  "topic": "Topic name",
  "simpleExplanation": "Explain in simple terms a student can understand",
  "detailedExplanation": "More detailed scientific explanation",
  "keyMolecules": [{"name": "molecule", "role": "its role"}],
  "clinicalRelevance": "How this relates to disease or treatment",
  "commonDisorders": [{"disorder": "name", "mechanism": "how it relates"}],
  "keyPoints": ["point 1", "point 2", "point 3"],
  "mnemonic": "Memory aid",
  "funFact": "Interesting fact"
}`
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      const data = await response.json()
      const text = data.content?.[0]?.text || ''

      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Invalid response format')

      const parsed = JSON.parse(jsonMatch[0])
      setGeneratedContent(parsed)

    } catch (err: any) {
      setError('Failed to generate content. Please try again.')
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  const checkVital = (value: number, min: number, max: number) => {
    if (value < min) return { color: '#2563eb', label: 'LOW ↓', bg: '#eff6ff' }
    if (value > max) return { color: '#dc2626', label: 'HIGH ↑', bg: '#fef2f2' }
    return { color: '#16a34a', label: 'NORMAL ✓', bg: '#f0fdf4' }
  }

  const VitalResult = ({ label, value, min, max, unit, advice }: any) => {
    const num = parseFloat(value)
    if (!value || isNaN(num)) return null
    const result = checkVital(num, min, max)
    return (
      <div style={{ background: result.bg, border: `1px solid ${result.color}30`, borderRadius: 10, padding: '12px 16px', marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{label}</span>
          <span style={{ background: result.color, color: 'white', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{result.label}</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: result.color, marginBottom: 4 }}>{value} {unit}</div>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>Normal: {min}–{max} {unit}</div>
        {result.label !== 'NORMAL ✓' && advice && (
          <div style={{ fontSize: 12, color: result.color, marginTop: 6 }}>⚠️ {advice}</div>
        )}
      </div>
    )
  }

  const quizScore = generatedContent?.questions
    ? generatedContent.questions.filter((q: any, i: number) => quizAnswers[i] === q.answer).length
    : 0

  return (
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', padding: '32px 24px 60px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Link href="/learning-hub" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}>
            ← Back to Learning Hub
          </Link>
          <div style={{ marginTop: 12 }}>
            <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
              🏥 Health Sciences Hub
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
              AI-powered patient cases, quizzes, drug explainer and anatomy — different every time
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '-28px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>

        {/* Main tabs */}
        <div style={{ background: 'white', borderRadius: 14, padding: 6, marginBottom: 20, display: 'flex', gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {[
            { key: 'ai', label: '🤖 AI Learning Generator' },
            { key: 'vitals', label: '📊 Vitals Checker' },
            { key: 'reference', label: '📚 Quick Reference' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
              flex: 1, padding: '12px', borderRadius: 10, border: 'none',
              background: activeTab === tab.key ? '#1e3a5f' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#6b7280',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== AI GENERATOR ===== */}
        {activeTab === 'ai' && (
          <div>
            {/* Setup panel */}
            {!generatedContent && !generating && (
              <div style={{ background: 'white', borderRadius: 16, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Configure Your Learning Session</h2>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 28 }}>
                  Choose your specialty, difficulty and mode — the AI will generate fresh content every time.
                </p>

                {/* Step 1: Mode */}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#374151' }}>
                    Step 1: What do you want to practice?
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                    {MODES.map(mode => (
                      <div key={mode.id} onClick={() => setSelectedMode(mode)} style={{
                        padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                        border: selectedMode?.id === mode.id ? '2px solid #1e3a5f' : '2px solid #e5e7eb',
                        background: selectedMode?.id === mode.id ? '#f0f9ff' : 'white',
                        transition: 'all 0.15s',
                      }}>
                        <div style={{ fontSize: 24, marginBottom: 6 }}>{mode.label.split(' ')[0]}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: selectedMode?.id === mode.id ? '#1e3a5f' : '#1f2937', marginBottom: 2 }}>
                          {mode.label.slice(2)}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{mode.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 2: Specialty */}
                {selectedMode && selectedMode.id !== 'drug' && (
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#374151' }}>
                      Step 2: Choose Specialty / Topic
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                      {SPECIALTIES.map(spec => (
                        <div key={spec.id} onClick={() => setSelectedSpecialty(spec)} style={{
                          padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                          border: selectedSpecialty?.id === spec.id ? `2px solid ${spec.color}` : '2px solid #f3f4f6',
                          background: selectedSpecialty?.id === spec.id ? spec.color + '10' : 'white',
                          transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                          <span style={{ fontSize: 20 }}>{spec.icon}</span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: selectedSpecialty?.id === spec.id ? spec.color : '#1f2937' }}>{spec.label}</div>
                            <div style={{ fontSize: 10, color: '#9ca3af' }}>{spec.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drug input */}
                {selectedMode?.id === 'drug' && (
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#374151' }}>
                      Step 2: Which drug do you want to learn about?
                    </h3>
                    <input
                      type="text"
                      placeholder="e.g. Metformin, Warfarin, Atorvastatin, Amoxicillin..."
                      value={drugQuery}
                      onChange={e => setDrugQuery(e.target.value)}
                    />
                  </div>
                )}

                {/* Custom topic */}
                {selectedMode && ['chemistry', 'quiz'].includes(selectedMode.id) && (
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#374151' }}>
                      Specific Topic (optional)
                    </h3>
                    <input
                      type="text"
                      placeholder="e.g. Krebs cycle, ECG interpretation, Fluid management..."
                      value={customTopic}
                      onChange={e => setCustomTopic(e.target.value)}
                    />
                  </div>
                )}

                {/* Step 3: Difficulty */}
                {selectedMode && selectedMode.id !== 'drug' && selectedMode.id !== 'chemistry' && (
                  <div style={{ marginBottom: 28 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#374151' }}>
                      Step 3: Difficulty Level
                    </h3>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {DIFFICULTIES.map(diff => (
                        <button key={diff.id} onClick={() => setSelectedDifficulty(diff)} style={{
                          flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                          background: selectedDifficulty?.id === diff.id ? diff.color : '#f3f4f6',
                          color: selectedDifficulty?.id === diff.id ? 'white' : '#374151',
                          cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
                        }}>
                          {diff.label}
                          <div style={{ fontSize: 11, fontWeight: 400, marginTop: 2, opacity: 0.8 }}>{diff.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generate button */}
                <button
                  onClick={generateContent}
                  disabled={!selectedMode || (!selectedSpecialty && selectedMode?.id !== 'drug' && selectedMode?.id !== 'chemistry') || generating}
                  style={{
                    width: '100%', padding: '16px',
                    background: selectedMode ? 'linear-gradient(135deg, #1e3a5f, #2563eb)' : '#e5e7eb',
                    color: selectedMode ? 'white' : '#9ca3af',
                    border: 'none', borderRadius: 12, cursor: selectedMode ? 'pointer' : 'not-allowed',
                    fontWeight: 800, fontSize: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}
                >
                  🤖 Generate with AI →
                </button>

                {error && (
                  <div style={{ marginTop: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* Loading state */}
            {generating && (
              <div style={{ background: 'white', borderRadius: 16, padding: '60px 28px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: 56, marginBottom: 20 }}>🤖</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1f2937', marginBottom: 8 }}>
                  Generating your {selectedMode?.label}...
                </h3>
                <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
                  AI is creating fresh content for {selectedSpecialty?.label || drugQuery || 'your topic'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 10, height: 10, borderRadius: '50%', background: '#1e3a5f',
                      animation: `bounce 0.8s ${i * 0.15}s infinite`,
                    }} />
                  ))}
                </div>
                <style>{`
                  @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
                    40% { transform: scale(1.2); opacity: 1; }
                  }
                `}</style>
              </div>
            )}

            {/* ===== PATIENT CASE RESULT ===== */}
            {generatedContent && selectedMode?.id === 'case' && (
              <div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  <button onClick={() => setGeneratedContent(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 }}>
                    ← Back
                  </button>
                  <button onClick={generateContent} style={{ background: '#1e3a5f', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    🔄 Generate New Case
                  </button>
                </div>

                {/* Case header */}
                <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', borderRadius: 14, padding: '20px 24px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 4 }}>
                        {generatedContent.specialty} • {generatedContent.difficulty}
                      </div>
                      <h2 style={{ color: 'white', fontSize: 20, fontWeight: 800, margin: 0 }}>{generatedContent.title}</h2>
                    </div>
                    <span style={{ fontSize: 40 }}>🩺</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  {/* Presenting complaint */}
                  <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', gridColumn: '1 / -1' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2563eb', marginBottom: 10 }}>🗣️ Presenting Complaint</h3>
                    <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8, margin: 0 }}>{generatedContent.presenting}</p>
                  </div>

                  {/* Vitals */}
                  <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2563eb', marginBottom: 12 }}>📊 Vital Signs</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {Object.entries(generatedContent.vitals || {}).map(([key, val]) => (
                        <div key={key} style={{ background: '#f9fafb', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>{key}</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#1e3a5f' }}>{val as string}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* History */}
                  <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2563eb', marginBottom: 10 }}>📋 History</h3>
                    <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0 }}>{generatedContent.history}</p>
                  </div>

                  {/* Examination */}
                  <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', gridColumn: '1 / -1' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2563eb', marginBottom: 10 }}>🔍 Examination</h3>
                    <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0 }}>{generatedContent.examination}</p>
                  </div>

                  {/* Investigations */}
                  <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', gridColumn: '1 / -1' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2563eb', marginBottom: 12 }}>🧪 Investigations</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(generatedContent.investigations || []).map((inv: any, i: number) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 14px',
                          background: inv.abnormal ? '#fef2f2' : '#f0fdf4',
                          borderRadius: 8, border: `1px solid ${inv.abnormal ? '#fecaca' : '#bbf7d0'}`,
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{inv.test}</span>
                          <span style={{ fontSize: 13, color: inv.abnormal ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{inv.result}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Diagnosis section */}
                <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e3a5f', marginBottom: 12 }}>
                    ✅ What is your diagnosis?
                  </h3>
                  <input
                    placeholder="Type your diagnosis here before revealing the answer..."
                    value={userDiagnosis}
                    onChange={e => setUserDiagnosis(e.target.value)}
                    style={{ marginBottom: 12 }}
                  />

                  <button
                    onClick={() => setShowAnswer(!showAnswer)}
                    style={{
                      background: showAnswer ? '#f0fdf4' : 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                      color: showAnswer ? '#16a34a' : 'white',
                      border: 'none', borderRadius: 8, padding: '10px 20px',
                      cursor: 'pointer', fontWeight: 700, fontSize: 14, marginBottom: 16,
                    }}
                  >
                    {showAnswer ? '✅ Answer shown' : '🔍 Reveal Diagnosis & Management'}
                  </button>

                  {showAnswer && (
                    <div>
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px', marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>DIAGNOSIS</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#1f2937' }}>{generatedContent.diagnosis}</div>
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📋 Management:</div>
                        {(generatedContent.management || []).map((m: string, i: number) => (
                          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#374151' }}>
                            <span style={{ color: '#2563eb', fontWeight: 700 }}>→</span><span>{m}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🔄 Differentials:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {(generatedContent.differentials || []).map((d: string) => (
                            <span key={d} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151', padding: '3px 10px', borderRadius: 999, fontSize: 12 }}>{d}</span>
                          ))}
                        </div>
                      </div>

                      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', marginBottom: 6 }}>🔑 KEY LEARNING POINT</div>
                        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>{generatedContent.keyLearning}</p>
                      </div>

                      {generatedContent.mnemonic && (
                        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 16px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706', marginBottom: 6 }}>🧠 MNEMONIC</div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>{generatedContent.mnemonic}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== MCQ QUIZ RESULT ===== */}
            {generatedContent && (selectedMode?.id === 'quiz' || selectedMode?.id === 'anatomy') && (
              <div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  <button onClick={() => setGeneratedContent(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 }}>← Back</button>
                  <button onClick={generateContent} style={{ background: '#1e3a5f', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    🔄 New Quiz
                  </button>
                  {quizSubmitted && (
                    <div style={{ marginLeft: 'auto', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 700, color: '#16a34a' }}>
                      Score: {quizScore}/{generatedContent.questions?.length} ({Math.round((quizScore / generatedContent.questions?.length) * 100)}%)
                    </div>
                  )}
                </div>

                <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>{generatedContent.title}</h2>

                  {(generatedContent.questions || []).map((q: any, qi: number) => (
                    <div key={qi} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: qi < generatedContent.questions.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', marginBottom: 12 }}>
                        {qi + 1}. {q.question}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {Object.entries(q.options || {}).map(([key, val]) => {
                          const isSelected = quizAnswers[qi] === key
                          const isCorrect = key === q.answer
                          const showResult = quizSubmitted
                          return (
                            <button
                              key={key}
                              onClick={() => !quizSubmitted && setQuizAnswers(prev => ({ ...prev, [qi]: key }))}
                              style={{
                                padding: '12px 14px', borderRadius: 10, textAlign: 'left',
                                border: showResult
                                  ? isCorrect ? '2px solid #16a34a' : isSelected ? '2px solid #ef4444' : '2px solid transparent'
                                  : isSelected ? '2px solid #2563eb' : '2px solid #e5e7eb',
                                background: showResult
                                  ? isCorrect ? '#f0fdf4' : isSelected ? '#fef2f2' : '#f9fafb'
                                  : isSelected ? '#eff6ff' : '#f9fafb',
                                cursor: quizSubmitted ? 'default' : 'pointer',
                                fontSize: 13, fontWeight: isSelected ? 600 : 400,
                                color: showResult ? isCorrect ? '#16a34a' : isSelected ? '#ef4444' : '#6b7280' : '#374151',
                                transition: 'all 0.15s',
                              }}
                            >
                              <span style={{ fontWeight: 700, marginRight: 8 }}>{key}.</span>{val as string}
                            </button>
                          )
                        })}
                      </div>

                      {quizSubmitted && (
                        <div style={{ marginTop: 10, background: '#f0f9ff', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#0369a1', lineHeight: 1.6 }}>
                          <strong>Explanation:</strong> {q.explanation}
                          {q.clinicalRelevance && <div style={{ marginTop: 6 }}><strong>Clinical relevance:</strong> {q.clinicalRelevance}</div>}
                          {q.keyPoint && <div style={{ marginTop: 6, fontWeight: 700, color: '#2563eb' }}>💡 {q.keyPoint}</div>}
                        </div>
                      )}
                    </div>
                  ))}

                  {!quizSubmitted ? (
                    <button
                      onClick={() => setQuizSubmitted(true)}
                      disabled={Object.keys(quizAnswers).length < (generatedContent.questions?.length || 0)}
                      className="btn-primary"
                      style={{ width: '100%', padding: '14px', fontSize: 15 }}
                    >
                      Submit Quiz →
                    </button>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <div style={{ fontSize: 48, marginBottom: 8 }}>{quizScore >= generatedContent.questions.length * 0.8 ? '🎉' : quizScore >= generatedContent.questions.length * 0.5 ? '👍' : '📚'}</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#1e3a5f', marginBottom: 4 }}>
                        {quizScore}/{generatedContent.questions.length} correct
                      </div>
                      <p style={{ color: '#6b7280', marginBottom: 16 }}>
                        {quizScore === generatedContent.questions.length ? 'Perfect! Excellent work!' : 'Review the explanations above and try again.'}
                      </p>
                      <button onClick={generateContent} style={{ background: '#1e3a5f', color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 700 }}>
                        Generate New Quiz →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== DRUG EXPLAINER RESULT ===== */}
            {generatedContent && selectedMode?.id === 'drug' && (
              <div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  <button onClick={() => setGeneratedContent(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 }}>← Back</button>
                  <button onClick={generateContent} style={{ background: '#1e3a5f', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    🔄 Search Another Drug
                  </button>
                </div>

                <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                  <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', padding: '24px 28px' }}>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>{generatedContent.class}</div>
                    <h2 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: 0 }}>{generatedContent.drugName}</h2>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Dose: {generatedContent.dose}</div>
                  </div>

                  <div style={{ padding: '24px 28px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {[
                        { label: '⚙️ Mechanism', content: generatedContent.mechanism, color: '#2563eb' },
                        { label: '✅ Uses', content: (generatedContent.uses || []).join(', '), color: '#16a34a' },
                        { label: '⚠️ Side Effects', content: (generatedContent.sideEffects || []).join(', '), color: '#d97706' },
                        { label: '🚫 Contraindications', content: (generatedContent.contraindications || []).join(', '), color: '#dc2626' },
                        { label: '💊 Drug Interactions', content: (generatedContent.interactions || []).join(', '), color: '#7c3aed' },
                        { label: '🔬 Monitoring', content: generatedContent.monitoring, color: '#0891b2' },
                      ].map(item => (
                        <div key={item.label} style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 6 }}>{item.label}</div>
                          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{item.content}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706', marginBottom: 6 }}>🧠 MNEMONIC</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>{generatedContent.mnemonic}</div>
                      </div>
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', marginBottom: 6 }}>⭐ CLINICAL PEARL</div>
                        <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{generatedContent.clinicalPearl}</div>
                      </div>
                    </div>

                    {generatedContent.funFact && (
                      <div style={{ marginTop: 12, background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 6 }}>🎯 FUN FACT</div>
                        <div style={{ fontSize: 13, color: '#374151' }}>{generatedContent.funFact}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===== BIOCHEMISTRY RESULT ===== */}
            {generatedContent && selectedMode?.id === 'chemistry' && (
              <div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  <button onClick={() => setGeneratedContent(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 }}>← Back</button>
                  <button onClick={generateContent} style={{ background: '#1e3a5f', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    🔄 Generate New Topic
                  </button>
                </div>

                <div style={{ background: 'white', borderRadius: 14, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f766e', marginBottom: 20 }}>⚗️ {generatedContent.topic}</h2>

                  <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, padding: '16px 18px', marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f766e', marginBottom: 6 }}>💡 SIMPLE EXPLANATION</div>
                    <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>{generatedContent.simpleExplanation}</p>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🔬 Detailed Explanation</div>
                    <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>{generatedContent.detailedExplanation}</p>
                  </div>

                  {generatedContent.keyMolecules?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>⚛️ Key Molecules</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                        {generatedContent.keyMolecules.map((mol: any, i: number) => (
                          <div key={i} style={{ background: '#f0fdfa', borderRadius: 8, padding: '10px 12px', border: '1px solid #99f6e4' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f766e', marginBottom: 3 }}>{mol.name}</div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>{mol.role}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ background: '#eff6ff', borderRadius: 10, padding: '14px 16px', marginBottom: 14, border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', marginBottom: 6 }}>🏥 CLINICAL RELEVANCE</div>
                    <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>{generatedContent.clinicalRelevance}</p>
                  </div>

                  {generatedContent.commonDisorders?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>⚠️ Related Disorders</div>
                      {generatedContent.commonDisorders.map((d: any, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: '#fef2f2', borderRadius: 8, marginBottom: 6, border: '1px solid #fecaca' }}>
                          <span style={{ color: '#dc2626', fontWeight: 700, flexShrink: 0 }}>⚠️</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>{d.disorder}</div>
                            <div style={{ fontSize: 12, color: '#374151' }}>{d.mechanism}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706', marginBottom: 6 }}>🧠 MNEMONIC</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>{generatedContent.mnemonic}</div>
                    </div>
                    <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 6 }}>🎯 FUN FACT</div>
                      <div style={{ fontSize: 13, color: '#374151' }}>{generatedContent.funFact}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== VITALS CHECKER ===== */}
        {activeTab === 'vitals' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📊 Vital Signs Checker</h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Enter patient vitals to assess normality</p>
              <label>Heart Rate (bpm)</label>
              <input type="number" placeholder="e.g. 88" value={hrValue} onChange={e => setHrValue(e.target.value)} />
              <label>Systolic BP (mmHg)</label>
              <input type="number" placeholder="e.g. 120" value={bpSys} onChange={e => setBpSys(e.target.value)} />
              <label>Diastolic BP (mmHg)</label>
              <input type="number" placeholder="e.g. 80" value={bpDia} onChange={e => setBpDia(e.target.value)} />
              <label>Temperature (°C)</label>
              <input type="number" placeholder="e.g. 37.2" value={tempValue} onChange={e => setTempValue(e.target.value)} step="0.1" />
              <label>Respiratory Rate (/min)</label>
              <input type="number" placeholder="e.g. 16" value={rrValue} onChange={e => setRrValue(e.target.value)} />
              <label>O2 Saturation (%)</label>
              <input type="number" placeholder="e.g. 98" value={o2Value} onChange={e => setO2Value(e.target.value)} />
              <label>GCS Score (3-15)</label>
              <input type="number" placeholder="e.g. 15" value={gcsValue} onChange={e => setGcsValue(e.target.value)} min="3" max="15" />
            </div>

            <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Results</h3>
              <VitalResult label="Heart Rate" value={hrValue} min={60} max={100} unit="bpm" advice="Tachycardia >100 or bradycardia <60 — assess clinically" />
              <VitalResult label="Systolic BP" value={bpSys} min={90} max={140} unit="mmHg" advice="BP >180 = hypertensive urgency. BP <90 = hypotension/shock" />
              <VitalResult label="Diastolic BP" value={bpDia} min={60} max={90} unit="mmHg" advice="Diastolic >90 = hypertension" />
              <VitalResult label="Temperature" value={tempValue} min={36.1} max={37.9} unit="°C" advice="Fever >38°C = infection. Hypothermia <35°C is dangerous" />
              <VitalResult label="Respiratory Rate" value={rrValue} min={12} max={20} unit="/min" advice="Tachypnoea >20 is early deterioration sign" />
              <VitalResult label="O2 Saturation" value={o2Value} min={95} max={100} unit="%" advice="<94% needs O2. <90% = emergency" />
              <VitalResult label="GCS" value={gcsValue} min={15} max={15} unit="/15" advice="GCS <8 = intubate. GCS <14 = significant concern" />
            </div>
          </div>
        )}

        {/* ===== QUICK REFERENCE ===== */}
        {activeTab === 'reference' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {[
              { title: 'ABCDE Assessment', icon: '🚨', color: '#dc2626', points: ['A — Airway: patent? obstruction?', 'B — Breathing: RR, O2 sat, chest', 'C — Circulation: HR, BP, capillary refill', 'D — Disability: GCS, glucose, pupils', 'E — Exposure: full examination'] },
              { title: 'SBAR Handover', icon: '💬', color: '#2563eb', points: ['S — Situation: who, what is happening NOW', 'B — Background: PMH, medications', 'A — Assessment: your clinical impression', 'R — Recommendation: what you need'] },
              { title: 'SOCRATES Pain', icon: '📋', color: '#16a34a', points: ['S — Site', 'O — Onset', 'C — Character', 'R — Radiation', 'A — Associations', 'T — Time course', 'E — Exacerbating/Relieving', 'S — Severity (0-10)'] },
              { title: 'DKA Management', icon: '💉', color: '#d97706', points: ['IV 0.9% NaCl fluid resuscitation', 'Fixed rate insulin infusion 0.1u/kg/hr', 'Replace potassium (K+ drops with insulin)', 'Monitor glucose hourly', 'Monitor ketones 2-hourly', 'Find precipitating cause'] },
              { title: 'CURB-65 (Pneumonia)', icon: '🫁', color: '#7c3aed', points: ['C — Confusion', 'U — Urea >7 mmol/L', 'R — RR ≥30/min', 'B — BP <90 systolic or ≤60 diastolic', '65 — Age ≥65', 'Score 0-1: home | 2: hospital | 3+: ICU'] },
              { title: 'FAST (Stroke)', icon: '🧠', color: '#be185d', points: ['F — Face drooping', 'A — Arm weakness', 'S — Speech difficulty', 'T — Time to call emergency', 'Thrombolysis within 4.5 hours of onset', 'Door-to-needle time target < 60 mins'] },
              { title: 'Normal Lab Values', icon: '🔬', color: '#0891b2', points: ['Na: 135-145 mmol/L', 'K: 3.5-5.0 mmol/L', 'Hb: 13-18g/dL (M) 11.5-16g/dL (F)', 'WBC: 4-11 × 10⁹/L', 'Creatinine: 60-120 µmol/L', 'Glucose (fasting): 3.9-5.5 mmol/L'] },
              { title: 'ECG Interpretation', icon: '📈', color: '#374151', points: ['Rate: 300/large squares between R waves', 'Rhythm: regular? P before every QRS?', 'Axis: normal -30° to +90°', 'P wave: <0.12s, upright in I and II', 'PR interval: 0.12-0.20s', 'QRS: <0.12s | QTc: <0.44s'] },
            ].map(card => (
              <div key={card.title} style={{ background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ background: card.color, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{card.icon}</span>
                  <h3 style={{ color: 'white', fontSize: 14, fontWeight: 800, margin: 0 }}>{card.title}</h3>
                </div>
                <div style={{ padding: '14px 18px' }}>
                  {card.points.map((point, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 12, color: '#374151' }}>
                      <span style={{ color: card.color, fontWeight: 700, flexShrink: 0 }}>•</span><span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}