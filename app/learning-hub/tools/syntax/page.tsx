'use client'

import { useState } from 'react'
import Link from 'next/link'

const SENTENCE_PARTS = [
  { id: 'det', label: 'Determiner', color: '#2563eb', bg: '#eff6ff', examples: ['The', 'A', 'An', 'This', 'That', 'My', 'His', 'Her'] },
  { id: 'adj', label: 'Adjective', color: '#7c3aed', bg: '#f5f3ff', examples: ['big', 'small', 'beautiful', 'old', 'new', 'happy', 'clever'] },
  { id: 'noun', label: 'Noun', color: '#16a34a', bg: '#f0fdf4', examples: ['cat', 'dog', 'teacher', 'student', 'book', 'house', 'city'] },
  { id: 'verb', label: 'Verb', color: '#dc2626', bg: '#fef2f2', examples: ['runs', 'eats', 'reads', 'writes', 'loves', 'teaches', 'builds'] },
  { id: 'adv', label: 'Adverb', color: '#d97706', bg: '#fffbeb', examples: ['quickly', 'slowly', 'carefully', 'happily', 'well', 'badly'] },
  { id: 'prep', label: 'Preposition', color: '#0891b2', bg: '#ecfeff', examples: ['in', 'on', 'at', 'by', 'with', 'from', 'to', 'under'] },
  { id: 'conj', label: 'Conjunction', color: '#be185d', bg: '#fdf2f8', examples: ['and', 'but', 'or', 'because', 'although', 'while', 'if'] },
]

const EXERCISES = [
  {
    sentence: 'The quick brown fox jumps over the lazy dog',
    analysis: [
      { word: 'The', part: 'det' },
      { word: 'quick', part: 'adj' },
      { word: 'brown', part: 'adj' },
      { word: 'fox', part: 'noun' },
      { word: 'jumps', part: 'verb' },
      { word: 'over', part: 'prep' },
      { word: 'the', part: 'det' },
      { word: 'lazy', part: 'adj' },
      { word: 'dog', part: 'noun' },
    ]
  },
  {
    sentence: 'She reads books carefully every morning',
    analysis: [
      { word: 'She', part: 'noun' },
      { word: 'reads', part: 'verb' },
      { word: 'books', part: 'noun' },
      { word: 'carefully', part: 'adv' },
    ]
  },
  {
    sentence: 'The clever student writes his assignment quickly',
    analysis: [
      { word: 'The', part: 'det' },
      { word: 'clever', part: 'adj' },
      { word: 'student', part: 'noun' },
      { word: 'writes', part: 'verb' },
      { word: 'his', part: 'det' },
      { word: 'assignment', part: 'noun' },
      { word: 'quickly', part: 'adv' },
    ]
  },
]

export default function SyntaxBuilder() {
  const [activeTab, setActiveTab] = useState<'learn' | 'build' | 'analyse'>('learn')
  const [builtSentence, setBuiltSentence] = useState<{ word: string; part: string }[]>([])
  const [customInput, setCustomInput] = useState('')
  const [currentExercise, setCurrentExercise] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)

  const addWord = (word: string, partId: string) => {
    setBuiltSentence(prev => [...prev, { word, part: partId }])
  }

  const removeWord = (index: number) => {
    setBuiltSentence(prev => prev.filter((_, i) => i !== index))
  }

  const getPart = (id: string) => SENTENCE_PARTS.find(p => p.id === id)

  const checkAnswers = () => {
    const exercise = EXERCISES[currentExercise]
    let correct = 0
    exercise.analysis.forEach((item, i) => {
      if (userAnswers[i] === item.part) correct++
    })
    setScore(correct)
    setShowResults(true)
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
        padding: '32px 24px 60px',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Link href="/learning-hub" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}>
            ← Back to Learning Hub
          </Link>
          <div style={{ marginTop: 12 }}>
            <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
              🧩 Syntax Builder
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
              Learn sentence structure, parts of speech and how they work together
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '-28px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>

        {/* Tabs */}
        <div style={{ background: 'white', borderRadius: 14, padding: 6, marginBottom: 16, display: 'flex', gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {[
            { key: 'learn', label: '📖 Learn Parts of Speech' },
            { key: 'build', label: '🔨 Build a Sentence' },
            { key: 'analyse', label: '🔍 Analyse Sentences' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: 'none',
              background: activeTab === tab.key ? '#7c3aed' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#6b7280',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* LEARN TAB */}
        {activeTab === 'learn' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {SENTENCE_PARTS.map(part => (
              <div key={part.id} style={{ background: part.bg, border: `1px solid ${part.color}30`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: part.color, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {part.label}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {part.examples.map(ex => (
                    <span key={ex} style={{
                      background: 'white', border: `1px solid ${part.color}40`,
                      color: part.color, padding: '3px 10px', borderRadius: 999,
                      fontSize: 13, fontWeight: 600,
                    }}>
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BUILD TAB */}
        {activeTab === 'build' && (
          <div>
            {/* Sentence display */}
            <div style={{
              background: 'white', borderRadius: 14, padding: 20, marginBottom: 16,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minHeight: 100,
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Your Sentence</h3>
              {builtSentence.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: 14 }}>Click words below to build your sentence...</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {builtSentence.map((item, i) => {
                    const part = getPart(item.part)
                    return (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{
                          background: part?.bg, border: `2px solid ${part?.color}40`,
                          borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                        }} onClick={() => removeWord(i)}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: part?.color }}>{item.word}</div>
                          <div style={{ fontSize: 9, color: part?.color, textTransform: 'uppercase', fontWeight: 700 }}>{part?.label}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {builtSentence.length > 0 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, padding: '10px 14px', background: '#f9fafb', borderRadius: 8, fontSize: 15, color: '#1f2937' }}>
                    {builtSentence.map(w => w.word).join(' ')}
                  </div>
                  <button onClick={() => setBuiltSentence([])} style={{ background: '#fef2f2', border: 'none', borderRadius: 8, color: '#ef4444', padding: '10px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Word banks */}
            {SENTENCE_PARTS.map(part => (
              <div key={part.id} style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: part.color, marginBottom: 8, textTransform: 'uppercase' }}>
                  {part.label}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {part.examples.map(word => (
                    <button
                      key={word}
                      onClick={() => addWord(word, part.id)}
                      style={{
                        background: part.bg, border: `1px solid ${part.color}30`,
                        color: part.color, padding: '5px 12px', borderRadius: 999,
                        cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      }}
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ANALYSE TAB */}
        {activeTab === 'analyse' && (
          <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Sentence Analysis Exercise</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {EXERCISES.map((_, i) => (
                  <button key={i} onClick={() => { setCurrentExercise(i); setUserAnswers({}); setShowResults(false) }} style={{
                    width: 30, height: 30, borderRadius: '50%', border: 'none',
                    background: currentExercise === i ? '#7c3aed' : '#f3f4f6',
                    color: currentExercise === i ? 'white' : '#374151',
                    cursor: 'pointer', fontWeight: 700, fontSize: 13,
                  }}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '16px 20px', marginBottom: 20, fontSize: 18, color: '#1f2937', lineHeight: 2 }}>
              {EXERCISES[currentExercise].analysis.map((item, i) => (
                <span key={i} style={{ marginRight: 8 }}>
                  <span style={{ fontWeight: 700 }}>{item.word}</span>
                  {!showResults && (
                    <select
                      value={userAnswers[i] || ''}
                      onChange={e => setUserAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                      style={{
                        marginLeft: 4, fontSize: 11, padding: '2px 4px',
                        borderRadius: 4, border: '1px solid #e5e7eb',
                        color: '#7c3aed', fontWeight: 600,
                      }}
                    >
                      <option value="">?</option>
                      {SENTENCE_PARTS.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  )}
                  {showResults && (
                    <span style={{
                      marginLeft: 4, fontSize: 11, padding: '2px 6px',
                      borderRadius: 4, fontWeight: 700,
                      background: userAnswers[i] === item.part ? '#f0fdf4' : '#fef2f2',
                      color: userAnswers[i] === item.part ? '#16a34a' : '#ef4444',
                    }}>
                      {getPart(item.part)?.label}
                    </span>
                  )}
                </span>
              ))}
            </div>

            {!showResults ? (
              <button onClick={checkAnswers} className="btn-primary">
                Check Answers →
              </button>
            ) : (
              <div>
                <div style={{
                  background: score === EXERCISES[currentExercise].analysis.length ? '#f0fdf4' : '#fffbeb',
                  border: `1px solid ${score === EXERCISES[currentExercise].analysis.length ? '#bbf7d0' : '#fde68a'}`,
                  borderRadius: 10, padding: '12px 16px', marginBottom: 12,
                  fontSize: 14, fontWeight: 600,
                  color: score === EXERCISES[currentExercise].analysis.length ? '#16a34a' : '#d97706',
                }}>
                  {score === EXERCISES[currentExercise].analysis.length
                    ? '🎉 Perfect! All correct!'
                    : `📝 ${score}/${EXERCISES[currentExercise].analysis.length} correct — keep practising!`}
                </div>
                <button onClick={() => { setUserAnswers({}); setShowResults(false) }} className="btn-outline">
                  Try Again →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}