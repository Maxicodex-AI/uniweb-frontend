'use client'

import { useState } from 'react'
import Link from 'next/link'

const DIAGRAMS = [
  {
    id: 'cell',
    title: 'Animal Cell',
    description: 'Label the parts of an animal cell',
    color: '#0891b2',
    parts: [
      { id: 'nucleus', label: 'Nucleus', x: 48, y: 45, description: 'Controls cell activities and contains DNA' },
      { id: 'mitochondria', label: 'Mitochondria', x: 70, y: 60, description: 'Powerhouse of the cell — produces energy (ATP)' },
      { id: 'ribosome', label: 'Ribosome', x: 30, y: 65, description: 'Site of protein synthesis' },
      { id: 'cell_membrane', label: 'Cell Membrane', x: 85, y: 35, description: 'Controls what enters and leaves the cell' },
      { id: 'cytoplasm', label: 'Cytoplasm', x: 20, y: 40, description: 'Jelly-like fluid that fills the cell' },
      { id: 'golgi', label: 'Golgi Apparatus', x: 60, y: 30, description: 'Packages and ships proteins' },
      { id: 'lysosome', label: 'Lysosome', x: 75, y: 75, description: 'Digests waste materials' },
      { id: 'er', label: 'Endoplasmic Reticulum', x: 35, y: 30, description: 'Transport network for molecules' },
    ]
  },
  {
    id: 'heart',
    title: 'Human Heart',
    description: 'Label the chambers and vessels of the heart',
    color: '#dc2626',
    parts: [
      { id: 'left_ventricle', label: 'Left Ventricle', x: 40, y: 65, description: 'Pumps oxygenated blood to the body' },
      { id: 'right_ventricle', label: 'Right Ventricle', x: 62, y: 65, description: 'Pumps deoxygenated blood to lungs' },
      { id: 'left_atrium', label: 'Left Atrium', x: 35, y: 35, description: 'Receives oxygenated blood from lungs' },
      { id: 'right_atrium', label: 'Right Atrium', x: 65, y: 35, description: 'Receives deoxygenated blood from body' },
      { id: 'aorta', label: 'Aorta', x: 30, y: 15, description: 'Largest artery — carries blood from heart to body' },
      { id: 'pulmonary', label: 'Pulmonary Artery', x: 65, y: 15, description: 'Carries blood from heart to lungs' },
      { id: 'vena_cava', label: 'Vena Cava', x: 80, y: 50, description: 'Returns blood from body to heart' },
    ]
  },
  {
    id: 'brain',
    title: 'Human Brain',
    description: 'Label the regions of the brain',
    color: '#7c3aed',
    parts: [
      { id: 'frontal', label: 'Frontal Lobe', x: 25, y: 30, description: 'Controls thinking, planning, personality' },
      { id: 'parietal', label: 'Parietal Lobe', x: 55, y: 20, description: 'Processes sensory information' },
      { id: 'temporal', label: 'Temporal Lobe', x: 20, y: 60, description: 'Controls hearing, memory, language' },
      { id: 'occipital', label: 'Occipital Lobe', x: 80, y: 35, description: 'Processes visual information' },
      { id: 'cerebellum', label: 'Cerebellum', x: 75, y: 70, description: 'Controls balance and coordination' },
      { id: 'brainstem', label: 'Brain Stem', x: 55, y: 80, description: 'Controls vital functions like breathing' },
    ]
  },
]

export default function DiagramLab() {
  const [selectedDiagram, setSelectedDiagram] = useState(DIAGRAMS[0])
  const [mode, setMode] = useState<'study' | 'quiz'>('study')
  const [selectedPart, setSelectedPart] = useState<any>(null)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [shuffledParts, setShuffledParts] = useState<any[]>([])

  const startQuiz = () => {
    const shuffled = [...selectedDiagram.parts].sort(() => Math.random() - 0.5)
    setShuffledParts(shuffled)
    setQuizAnswers({})
    setQuizSubmitted(false)
    setMode('quiz')
  }

  const quizScore = selectedDiagram.parts.filter(p =>
    quizAnswers[p.id]?.toLowerCase().trim() === p.label.toLowerCase()
  ).length

  return (
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>
      <div style={{
        background: 'linear-gradient(135deg, #0c4a6e, #0891b2)',
        padding: '32px 24px 60px',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Link href="/learning-hub" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}>
            ← Back to Learning Hub
          </Link>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, marginBottom: 4, marginTop: 12 }}>
            🧬 Diagram Lab
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            Study and label scientific diagrams
          </p>

          {/* Diagram selector */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            {DIAGRAMS.map(d => (
              <button key={d.id} onClick={() => { setSelectedDiagram(d); setMode('study'); setSelectedPart(null) }} style={{
                padding: '8px 18px', borderRadius: 999, border: 'none',
                background: selectedDiagram.id === d.id ? 'white' : 'rgba(255,255,255,0.15)',
                color: selectedDiagram.id === d.id ? '#0891b2' : 'white',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>
                {d.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '-28px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>

        {/* Mode toggle */}
        <div style={{ background: 'white', borderRadius: 14, padding: 6, marginBottom: 16, display: 'flex', gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <button onClick={() => setMode('study')} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: mode === 'study' ? '#0891b2' : 'transparent', color: mode === 'study' ? 'white' : '#6b7280', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            📖 Study Mode
          </button>
          <button onClick={startQuiz} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: mode === 'quiz' ? '#0891b2' : 'transparent', color: mode === 'quiz' ? 'white' : '#6b7280', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            🎯 Label Quiz
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>

          {/* Diagram area */}
          <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{selectedDiagram.title}</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>{selectedDiagram.description}</p>

            {/* SVG Diagram */}
            <div style={{ position: 'relative', width: '100%', paddingBottom: '70%', background: '#f9fafb', borderRadius: 12, border: '2px solid #e5e7eb', overflow: 'hidden' }}>
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100">
                {/* Background shape based on diagram type */}
                {selectedDiagram.id === 'cell' && (
                  <>
                    <ellipse cx="50" cy="50" rx="45" ry="40" fill="#ecfeff" stroke="#a5f3fc" strokeWidth="1" />
                    <ellipse cx="48" cy="45" rx="12" ry="10" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="0.5" />
                    <ellipse cx="48" cy="45" rx="6" ry="5" fill="#60a5fa" stroke="#3b82f6" strokeWidth="0.5" />
                  </>
                )}
                {selectedDiagram.id === 'heart' && (
                  <>
                    <path d="M50,80 C20,60 10,40 20,25 C30,10 45,15 50,30 C55,15 70,10 80,25 C90,40 80,60 50,80 Z" fill="#fecaca" stroke="#f87171" strokeWidth="1" />
                    <line x1="50" y1="30" x2="50" y2="75" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2,2" />
                    <line x1="25" y1="50" x2="75" y2="50" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2,2" />
                  </>
                )}
                {selectedDiagram.id === 'brain' && (
                  <>
                    <ellipse cx="48" cy="45" rx="38" ry="32" fill="#f5f3ff" stroke="#c4b5fd" strokeWidth="1" />
                    <ellipse cx="65" cy="72" rx="18" ry="14" fill="#ede9fe" stroke="#c4b5fd" strokeWidth="1" />
                    <path d="M30,45 Q50,20 70,45" fill="none" stroke="#c4b5fd" strokeWidth="0.8" />
                    <path d="M25,55 Q48,35 72,55" fill="none" stroke="#c4b5fd" strokeWidth="0.8" />
                  </>
                )}

                {/* Clickable parts */}
                {selectedDiagram.parts.map(part => (
                  <g key={part.id} onClick={() => setSelectedPart(part)} style={{ cursor: 'pointer' }}>
                    <circle
                      cx={part.x} cy={part.y} r="3"
                      fill={selectedPart?.id === part.id ? selectedDiagram.color : 'white'}
                      stroke={selectedDiagram.color}
                      strokeWidth="0.8"
                    />
                    {mode === 'study' && (
                      <text x={part.x + 4} y={part.y + 1} fontSize="3" fill={selectedDiagram.color} fontWeight="bold">
                        {part.label.split(' ')[0]}
                      </text>
                    )}
                    {mode === 'quiz' && (
                      <text x={part.x + 4} y={part.y + 1} fontSize="3" fill="#9ca3af">
                        ?
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            </div>

            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>
              Click on any point to see its details
            </p>
          </div>

          {/* Right panel */}
          <div>
            {mode === 'study' ? (
              <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
                  {selectedPart ? selectedPart.label : 'Click a point to learn'}
                </h3>
                {selectedPart ? (
                  <div>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: selectedDiagram.color + '20', border: `2px solid ${selectedDiagram.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 12 }}>
                      🔬
                    </div>
                    <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                      {selectedPart.description}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>Parts to learn:</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {selectedDiagram.parts.map(part => (
                        <div key={part.id} onClick={() => setSelectedPart(part)} style={{
                          padding: '8px 12px', background: '#f9fafb', borderRadius: 8,
                          cursor: 'pointer', fontSize: 13, fontWeight: 500,
                          border: '1px solid #f3f4f6', color: '#374151',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: selectedDiagram.color, flexShrink: 0 }} />
                          {part.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Quiz mode
              <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Label the parts</h3>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>Type the name of each numbered part</p>

                {!quizSubmitted ? (
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                      {shuffledParts.map((part, i) => (
                        <div key={part.id}>
                          <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 3 }}>
                            Point {i + 1} (at {part.x}%, {part.y}%)
                          </label>
                          <input
                            placeholder="Type label..."
                            value={quizAnswers[part.id] || ''}
                            onChange={e => setQuizAnswers(prev => ({ ...prev, [part.id]: e.target.value }))}
                            style={{ fontSize: 13 }}
                          />
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setQuizSubmitted(true)} className="btn-primary" style={{ width: '100%', background: '#0891b2' }}>
                      Check Answers →
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <div style={{ fontSize: 32, fontWeight: 800, color: '#0891b2' }}>{quizScore}/{selectedDiagram.parts.length}</div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>correct</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                      {shuffledParts.map(part => {
                        const correct = quizAnswers[part.id]?.toLowerCase().trim() === part.label.toLowerCase()
                        return (
                          <div key={part.id} style={{ padding: '8px 10px', borderRadius: 8, background: correct ? '#f0fdf4' : '#fef2f2', border: `1px solid ${correct ? '#bbf7d0' : '#fecaca'}`, fontSize: 12 }}>
                            <span style={{ color: correct ? '#16a34a' : '#ef4444', fontWeight: 700 }}>{correct ? '✓' : '✗'}</span>
                            {' '}{part.label}
                            {!correct && <div style={{ color: '#9ca3af', fontSize: 11 }}>Your answer: {quizAnswers[part.id] || '(blank)'}</div>}
                          </div>
                        )
                      })}
                    </div>
                    <button onClick={startQuiz} className="btn-outline" style={{ width: '100%' }}>Try Again →</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}