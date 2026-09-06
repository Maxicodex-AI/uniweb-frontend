'use client'

import { useState } from 'react'
import Link from 'next/link'

const TEACHING_METHODS = [
  { method: 'Direct Instruction', icon: '🎯', description: 'Teacher-centred approach where the teacher explicitly teaches skills and concepts', when: 'Best for introducing new concepts, procedures, or foundational knowledge', steps: ['State learning objectives', 'Demonstrate/explain clearly', 'Guided practice with feedback', 'Independent practice', 'Assessment'], color: '#2563eb' },
  { method: 'Inquiry-Based Learning', icon: '🔍', description: 'Students investigate questions, problems or scenarios to develop knowledge and skills', when: 'Best for developing critical thinking and problem-solving skills', steps: ['Pose a driving question', 'Students investigate and explore', 'Create and share findings', 'Reflect and evaluate', 'Connect to real world'], color: '#16a34a' },
  { method: 'Cooperative Learning', icon: '👥', description: 'Students work in small groups to achieve shared learning goals', when: 'Best for developing teamwork, communication and social skills', steps: ['Form heterogeneous groups', 'Assign individual and group roles', 'Set clear group goals', 'Monitor group interactions', 'Assess individual and group work'], color: '#7c3aed' },
  { method: 'Problem-Based Learning', icon: '🧩', description: 'Students learn through solving complex, real-world problems', when: 'Best for applied learning and professional preparation', steps: ['Present complex problem', 'Students identify what they know', 'Students identify what they need to learn', 'Independent study and research', 'Apply knowledge to solve problem', 'Evaluate solution'], color: '#d97706' },
  { method: 'Flipped Classroom', icon: '🔄', description: 'Students learn content at home (video/reading) and do active work in class', when: 'Best for maximising class time for discussion and practice', steps: ['Assign pre-class content (videos, readings)', 'Students review at home', 'Class time for discussion, activities, problem-solving', 'Teacher facilitates rather than lectures', 'Assessment of understanding'], color: '#dc2626' },
]

const BLOOM_LEVELS = [
  { level: 1, name: 'Remember', verbs: ['Define', 'List', 'Recall', 'Identify', 'Name', 'State', 'Recognise'], color: '#dc2626', desc: 'Recall facts and basic concepts', example: 'List the bones of the human body' },
  { level: 2, name: 'Understand', verbs: ['Explain', 'Describe', 'Summarise', 'Classify', 'Compare', 'Interpret'], color: '#d97706', desc: 'Explain ideas or concepts', example: 'Explain the process of photosynthesis' },
  { level: 3, name: 'Apply', verbs: ['Use', 'Demonstrate', 'Solve', 'Calculate', 'Implement', 'Execute'], color: '#eab308', desc: 'Use information in new situations', example: 'Calculate the area of a triangle' },
  { level: 4, name: 'Analyse', verbs: ['Break down', 'Compare', 'Differentiate', 'Examine', 'Infer', 'Distinguish'], color: '#16a34a', desc: 'Draw connections among ideas', example: 'Compare the causes of World War I and II' },
  { level: 5, name: 'Evaluate', verbs: ['Judge', 'Justify', 'Critique', 'Assess', 'Defend', 'Recommend'], color: '#2563eb', desc: 'Justify a decision or course of action', example: 'Evaluate the effectiveness of a government policy' },
  { level: 6, name: 'Create', verbs: ['Design', 'Develop', 'Construct', 'Formulate', 'Produce', 'Compose'], color: '#7c3aed', desc: 'Produce new or original work', example: 'Design an experiment to test a hypothesis' },
]

const ASSESSMENT_TYPES = [
  { type: 'Formative Assessment', icon: '📝', purpose: 'Monitor learning during instruction', examples: ['Exit tickets', 'Think-pair-share', 'Quick quizzes', 'Observation', 'Questioning'], timing: 'During learning', color: '#16a34a' },
  { type: 'Summative Assessment', icon: '📊', purpose: 'Evaluate learning at end of a unit or course', examples: ['Examinations', 'Final projects', 'Standardised tests', 'End-of-term essays', 'Portfolios'], timing: 'After learning', color: '#2563eb' },
  { type: 'Diagnostic Assessment', icon: '🔍', purpose: 'Identify prior knowledge and misconceptions before teaching', examples: ['Pre-tests', 'KWL charts', 'Concept maps', 'Interviews', 'Surveys'], timing: 'Before learning', color: '#d97706' },
  { type: 'Peer Assessment', icon: '👥', purpose: 'Students evaluate each other\'s work using criteria', examples: ['Peer marking with rubric', 'Structured feedback forms', 'Group presentations', 'Portfolio review'], timing: 'During/after learning', color: '#7c3aed' },
]

export default function EducationStudiesHub() {
  const [activeTab, setActiveTab] = useState<'plan' | 'bloom' | 'methods' | 'assessment'>('plan')
  const [selectedMethod, setSelectedMethod] = useState<any>(null)

  // Lesson Plan Builder
  const [planSubject, setPlanSubject] = useState('')
  const [planTopic, setPlanTopic] = useState('')
  const [planClass, setPlanClass] = useState('')
  const [planDuration, setPlanDuration] = useState('40')
  const [planObjectives, setPlanObjectives] = useState([''])
  const [planMaterials, setPlanMaterials] = useState([''])
  const [planIntro, setPlanIntro] = useState('')
  const [planDevelopment, setPlanDevelopment] = useState('')
  const [planConclusion, setPlanConclusion] = useState('')
  const [planAssessment, setPlanAssessment] = useState('')
  const [showPlanPreview, setShowPlanPreview] = useState(false)

  // Bloom's objective builder
  const [selectedBloomLevel, setSelectedBloomLevel] = useState<any>(null)
  const [bloomTopic, setBloomTopic] = useState('')
  const [bloomVerb, setBloomVerb] = useState('')
  const [generatedObjectives, setGeneratedObjectives] = useState<string[]>([])

  const generateObjective = () => {
    if (!bloomVerb || !bloomTopic) return
    const objective = `By the end of this lesson, students will be able to ${bloomVerb.toLowerCase()} ${bloomTopic}.`
    setGeneratedObjectives(prev => [objective, ...prev.slice(0, 4)])
  }

  const addObjective = () => setPlanObjectives([...planObjectives, ''])
  const addMaterial = () => setPlanMaterials([...planMaterials, ''])

  return (
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', padding: '32px 24px 60px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Link href="/learning-hub" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}>
            ← Back to Learning Hub
          </Link>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, marginBottom: 4, marginTop: 12 }}>
            🎒 Education Studies Hub
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            Lesson planning, Bloom's taxonomy, teaching methods and assessment strategies
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '-28px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>

        {/* Tabs */}
        <div style={{ background: 'white', borderRadius: 14, padding: 6, marginBottom: 16, display: 'flex', gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {[
            { key: 'plan', label: '📋 Lesson Planner' },
            { key: 'bloom', label: "🎯 Bloom's Taxonomy" },
            { key: 'methods', label: '📚 Teaching Methods' },
            { key: 'assessment', label: '📊 Assessment' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: 'none',
              background: activeTab === tab.key ? '#2563eb' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#6b7280',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* LESSON PLANNER */}
        {activeTab === 'plan' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: showPlanPreview ? '1fr 1fr' : '1fr', gap: 20 }}>
              <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>📋 Lesson Plan Builder</h3>
                  <button onClick={() => setShowPlanPreview(!showPlanPreview)} style={{
                    background: '#eff6ff', border: 'none', borderRadius: 8,
                    color: '#2563eb', padding: '6px 14px', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600,
                  }}>
                    {showPlanPreview ? 'Hide Preview' : '👁️ Preview'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
                  <div>
                    <label>Subject</label>
                    <input placeholder="e.g. Mathematics" value={planSubject} onChange={e => setPlanSubject(e.target.value)} />
                  </div>
                  <div>
                    <label>Class/Level</label>
                    <input placeholder="e.g. JSS 2 / 200L" value={planClass} onChange={e => setPlanClass(e.target.value)} />
                  </div>
                </div>

                <label>Topic</label>
                <input placeholder="e.g. Quadratic Equations" value={planTopic} onChange={e => setPlanTopic(e.target.value)} />

                <label>Duration (minutes)</label>
                <input type="number" value={planDuration} onChange={e => setPlanDuration(e.target.value)} />

                <label>Learning Objectives</label>
                {planObjectives.map((obj, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <input placeholder={`Objective ${i + 1}`} value={obj} onChange={e => { const u = [...planObjectives]; u[i] = e.target.value; setPlanObjectives(u) }} style={{ flex: 1 }} />
                    {planObjectives.length > 1 && <button onClick={() => setPlanObjectives(planObjectives.filter((_, idx) => idx !== i))} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, color: '#ef4444', cursor: 'pointer', padding: '0 10px', fontSize: 16 }}>×</button>}
                  </div>
                ))}
                <button onClick={addObjective} style={{ background: 'none', border: '1px dashed #bfdbfe', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#2563eb', width: '100%', marginBottom: 12 }}>+ Add Objective</button>

                <label>Materials/Resources</label>
                {planMaterials.map((mat, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <input placeholder={`Material ${i + 1}`} value={mat} onChange={e => { const u = [...planMaterials]; u[i] = e.target.value; setPlanMaterials(u) }} style={{ flex: 1 }} />
                    {planMaterials.length > 1 && <button onClick={() => setPlanMaterials(planMaterials.filter((_, idx) => idx !== i))} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, color: '#ef4444', cursor: 'pointer', padding: '0 10px', fontSize: 16 }}>×</button>}
                  </div>
                ))}
                <button onClick={addMaterial} style={{ background: 'none', border: '1px dashed #bfdbfe', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#2563eb', width: '100%', marginBottom: 12 }}>+ Add Material</button>

                <label>Introduction (Set Induction)</label>
                <textarea placeholder="How will you introduce the lesson? Hook the students..." value={planIntro} onChange={e => setPlanIntro(e.target.value)} rows={2}
                  style={{ width: '100%', padding: '10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', outline: 'none' }} />

                <label>Lesson Development (Main Content)</label>
                <textarea placeholder="Step by step teaching activities, explanations, examples, demonstrations..." value={planDevelopment} onChange={e => setPlanDevelopment(e.target.value)} rows={5}
                  style={{ width: '100%', padding: '10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', outline: 'none' }} />

                <label>Conclusion</label>
                <textarea placeholder="How will you wrap up and summarise the lesson?" value={planConclusion} onChange={e => setPlanConclusion(e.target.value)} rows={2}
                  style={{ width: '100%', padding: '10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', outline: 'none' }} />

                <label>Assessment / Evaluation</label>
                <textarea placeholder="How will you check if students have learned? (Questions, exercises, exit ticket...)" value={planAssessment} onChange={e => setPlanAssessment(e.target.value)} rows={2}
                  style={{ width: '100%', padding: '10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', outline: 'none' }} />
              </div>

              {/* Preview */}
              {showPlanPreview && (
                <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', alignSelf: 'start', position: 'sticky', top: 80 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    📋 Lesson Plan Preview
                  </h3>

                  <div style={{ borderBottom: '2px solid #2563eb', paddingBottom: 12, marginBottom: 12 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1f2937', margin: 0 }}>{planTopic || 'Topic Not Set'}</h2>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                      {planSubject && `${planSubject} • `}{planClass && `${planClass} • `}{planDuration && `${planDuration} mins`}
                    </div>
                  </div>

                  {planObjectives.filter(o => o.trim()).length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', marginBottom: 6, textTransform: 'uppercase' }}>Objectives</div>
                      {planObjectives.filter(o => o.trim()).map((obj, i) => (
                        <div key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 3, display: 'flex', gap: 6 }}>
                          <span style={{ color: '#2563eb', fontWeight: 700 }}>{i + 1}.</span><span>{obj}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {planMaterials.filter(m => m.trim()).length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', marginBottom: 6, textTransform: 'uppercase' }}>Materials</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {planMaterials.filter(m => m.trim()).map((mat, i) => (
                          <span key={i} style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>{mat}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {[
                    { label: 'Introduction', content: planIntro },
                    { label: 'Development', content: planDevelopment },
                    { label: 'Conclusion', content: planConclusion },
                    { label: 'Assessment', content: planAssessment },
                  ].map(section => section.content && (
                    <div key={section.label} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', marginBottom: 4, textTransform: 'uppercase' }}>{section.label}</div>
                      <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.5, margin: 0 }}>{section.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BLOOM'S TAXONOMY */}
        {activeTab === 'bloom' && (
          <div>
            <div style={{ background: 'white', borderRadius: 14, padding: 24, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>🎯 Bloom's Taxonomy Pyramid</h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Click a level to see action verbs and build learning objectives</p>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                {[...BLOOM_LEVELS].reverse().map((level, i) => (
                  <div key={level.level} onClick={() => setSelectedBloomLevel(selectedBloomLevel?.level === level.level ? null : level)}
                    style={{ width: `${(i + 1) * 15 + 10}%`, maxWidth: '100%', cursor: 'pointer' }}>
                    <div style={{
                      background: selectedBloomLevel?.level === level.level ? level.color : level.color + '20',
                      border: `2px solid ${level.color}`,
                      borderRadius: 8, padding: '10px 16px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      transition: 'all 0.15s',
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: selectedBloomLevel?.level === level.level ? 'white' : level.color }}>
                          Level {level.level}: {level.name}
                        </div>
                        <div style={{ fontSize: 11, color: selectedBloomLevel?.level === level.level ? 'rgba(255,255,255,0.8)' : '#6b7280' }}>
                          {level.desc}
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: selectedBloomLevel?.level === level.level ? 'rgba(255,255,255,0.7)' : '#9ca3af' }}>
                        {level.verbs.length} verbs
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedBloomLevel && (
              <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: selectedBloomLevel.color, marginBottom: 4 }}>
                  Level {selectedBloomLevel.level}: {selectedBloomLevel.name}
                </h3>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>Example: {selectedBloomLevel.example}</p>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Action Verbs:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selectedBloomLevel.verbs.map((verb: string) => (
                      <button key={verb} onClick={() => setBloomVerb(verb)} style={{
                        background: bloomVerb === verb ? selectedBloomLevel.color : selectedBloomLevel.color + '15',
                        color: bloomVerb === verb ? 'white' : selectedBloomLevel.color,
                        border: 'none', borderRadius: 999, padding: '4px 12px',
                        cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      }}>
                        {verb}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label>Topic/Skill</label>
                    <input placeholder="e.g. the water cycle, quadratic equations..." value={bloomTopic} onChange={e => setBloomTopic(e.target.value)} />
                  </div>
                  <button onClick={generateObjective} disabled={!bloomVerb || !bloomTopic} style={{
                    background: selectedBloomLevel.color, color: 'white', border: 'none',
                    borderRadius: 8, padding: '11px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
                  }}>
                    Generate →
                  </button>
                </div>

                {generatedObjectives.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Generated Objectives:</div>
                    {generatedObjectives.map((obj, i) => (
                      <div key={i} style={{ padding: '10px 14px', background: selectedBloomLevel.color + '10', borderRadius: 8, border: `1px solid ${selectedBloomLevel.color}30`, marginBottom: 6, fontSize: 13, color: '#374151' }}>
                        {obj}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TEACHING METHODS */}
        {activeTab === 'methods' && (
          <div>
            {!selectedMethod ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {TEACHING_METHODS.map(method => (
                  <div key={method.method} onClick={() => setSelectedMethod(method)} style={{
                    background: 'white', borderRadius: 14, padding: '20px',
                    border: `2px solid ${method.color}30`, cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.15s',
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>{method.icon}</div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: method.color, marginBottom: 6 }}>{method.method}</h3>
                    <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: 10 }}>{method.description}</p>
                    <div style={{ fontSize: 12, color: method.color, fontWeight: 600 }}>
                      📌 {method.when.slice(0, 50)}...
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <button onClick={() => setSelectedMethod(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, marginBottom: 16 }}>
                  ← Back to Methods
                </button>
                <div style={{ background: 'white', borderRadius: 14, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                    <span style={{ fontSize: 48 }}>{selectedMethod.icon}</span>
                    <div>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: selectedMethod.color, margin: 0 }}>{selectedMethod.method}</h2>
                      <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{selectedMethod.description}</p>
                    </div>
                  </div>

                  <div style={{ background: selectedMethod.color + '10', borderRadius: 10, padding: '14px 18px', marginBottom: 20, border: `1px solid ${selectedMethod.color}30` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: selectedMethod.color, marginBottom: 4 }}>📌 When to Use</div>
                    <p style={{ fontSize: 14, color: '#374151', margin: 0 }}>{selectedMethod.when}</p>
                  </div>

                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📋 Steps to Implement:</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedMethod.steps.map((step: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 16px', background: '#f9fafb', borderRadius: 10, border: '1px solid #f3f4f6' }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: selectedMethod.color, color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: 13, flexShrink: 0,
                        }}>
                          {i + 1}
                        </div>
                        <span style={{ fontSize: 14, color: '#374151', paddingTop: 3 }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ASSESSMENT */}
        {activeTab === 'assessment' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {ASSESSMENT_TYPES.map(assessment => (
              <div key={assessment.type} style={{
                background: 'white', borderRadius: 14, overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: `1px solid ${assessment.color}20`,
              }}>
                <div style={{ background: assessment.color, padding: '16px 20px' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{assessment.icon}</div>
                  <h3 style={{ color: 'white', fontSize: 15, fontWeight: 800, margin: 0 }}>{assessment.type}</h3>
                  <div style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, marginTop: 6, display: 'inline-block' }}>
                    {assessment.timing}
                  </div>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, marginBottom: 12 }}>
                    <strong>Purpose:</strong> {assessment.purpose}
                  </p>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Examples:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {assessment.examples.map((ex, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#6b7280' }}>
                        <span style={{ color: assessment.color, fontWeight: 700 }}>•</span>
                        <span>{ex}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}