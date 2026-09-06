'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const LESSONS = [
  {
    id: 1,
    language: 'French',
    flag: '🇫🇷',
    level: 'Beginner',
    topic: 'Greetings & Introductions',
    color: '#2563eb',
    vocab: [
      { word: 'Bonjour', translation: 'Hello / Good day', example: 'Bonjour, comment allez-vous?' },
      { word: 'Bonsoir', translation: 'Good evening', example: 'Bonsoir madame!' },
      { word: 'Au revoir', translation: 'Goodbye', example: 'Au revoir, à bientôt!' },
      { word: 'Merci', translation: 'Thank you', example: 'Merci beaucoup!' },
      { word: 'S\'il vous plaît', translation: 'Please', example: 'S\'il vous plaît, aidez-moi.' },
      { word: 'Je m\'appelle', translation: 'My name is', example: 'Je m\'appelle Marie.' },
    ],
    quiz: [
      { question: 'How do you say "Hello" in French?', answer: 'Bonjour', options: ['Bonjour', 'Bonsoir', 'Au revoir', 'Merci'] },
      { question: 'What does "Merci" mean?', answer: 'Thank you', options: ['Please', 'Thank you', 'Hello', 'Goodbye'] },
      { question: 'How do you say "Goodbye" in French?', answer: 'Au revoir', options: ['Bonjour', 'Merci', 'Au revoir', 'Bonsoir'] },
    ]
  },
  {
    id: 2,
    language: 'Spanish',
    flag: '🇪🇸',
    level: 'Beginner',
    topic: 'Numbers & Counting',
    color: '#dc2626',
    vocab: [
      { word: 'Uno', translation: 'One', example: 'Tengo uno libro.' },
      { word: 'Dos', translation: 'Two', example: 'Son las dos.' },
      { word: 'Tres', translation: 'Three', example: 'Tres amigos.' },
      { word: 'Cuatro', translation: 'Four', example: 'Cuatro estaciones.' },
      { word: 'Cinco', translation: 'Five', example: 'Cinco años.' },
      { word: 'Diez', translation: 'Ten', example: 'Diez minutos.' },
    ],
    quiz: [
      { question: 'What is "Two" in Spanish?', answer: 'Dos', options: ['Uno', 'Dos', 'Tres', 'Cuatro'] },
      { question: 'What does "Cinco" mean?', answer: 'Five', options: ['Three', 'Four', 'Five', 'Six'] },
      { question: 'How do you say "Ten" in Spanish?', answer: 'Diez', options: ['Cinco', 'Siete', 'Diez', 'Ocho'] },
    ]
  },
  {
    id: 3,
    language: 'Yoruba',
    flag: '🇳🇬',
    level: 'Beginner',
    topic: 'Basic Expressions',
    color: '#16a34a',
    vocab: [
      { word: 'Ẹ káàárọ̀', translation: 'Good morning', example: 'Ẹ káàárọ̀, ẹ jọ̀ọ́!' },
      { word: 'Ẹ káàsán', translation: 'Good afternoon', example: 'Ẹ káàsán bọ́!' },
      { word: 'Ẹ káalẹ́', translation: 'Good evening', example: 'Ẹ káalẹ́ o.' },
      { word: 'Ẹ ṣéun', translation: 'Thank you', example: 'Ẹ ṣéun púpọ̀.' },
      { word: 'Báwo ni?', translation: 'How are you?', example: 'Báwo ni, ọ̀rẹ́ mi?' },
      { word: 'Àdúpẹ́', translation: 'We are grateful', example: 'Àdúpẹ́ lọ́wọ́ rẹ.' },
    ],
    quiz: [
      { question: 'How do you say "Good morning" in Yoruba?', answer: 'Ẹ káàárọ̀', options: ['Ẹ káàárọ̀', 'Ẹ káàsán', 'Ẹ káalẹ́', 'Ẹ ṣéun'] },
      { question: 'What does "Ẹ ṣéun" mean?', answer: 'Thank you', options: ['Good morning', 'How are you', 'Thank you', 'Good evening'] },
    ]
  },
]

export default function LanguageLab() {
  const [selectedLesson, setSelectedLesson] = useState(LESSONS[0])
  const [activeTab, setActiveTab] = useState<'vocab' | 'quiz' | 'flashcard'>('vocab')
  const [flashcardFlipped, setFlashcardFlipped] = useState(false)
  const [flashcardIndex, setFlashcardIndex] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  const speak = (text: string, lang: string = 'fr-FR') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = 0.75
      window.speechSynthesis.speak(utterance)
    }
  }

  const getLangCode = (language: string) => {
    const codes: Record<string, string> = {
      'French': 'fr-FR', 'Spanish': 'es-ES', 'Yoruba': 'yo', 'Arabic': 'ar-SA',
    }
    return codes[language] || 'en-GB'
  }

  const quizScore = selectedLesson.quiz.reduce((score, q, i) => {
    return score + (quizAnswers[i] === q.answer ? 1 : 0)
  }, 0)

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
              🌍 Language Lab
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
              Immersive language learning — vocabulary, pronunciation and quizzes
            </p>
          </div>

          {/* Language selector */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            {LESSONS.map(lesson => (
              <button
                key={lesson.id}
                onClick={() => { setSelectedLesson(lesson); setActiveTab('vocab'); setQuizAnswers({}); setQuizSubmitted(false) }}
                style={{
                  padding: '8px 18px', borderRadius: 999, border: 'none',
                  background: selectedLesson.id === lesson.id ? 'white' : 'rgba(255,255,255,0.15)',
                  color: selectedLesson.id === lesson.id ? '#7c3aed' : 'white',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {lesson.flag} {lesson.language}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '-28px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>

        {/* Lesson header */}
        <div style={{
          background: 'white', borderRadius: 14, padding: '16px 20px', marginBottom: 14,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, color: selectedLesson.color, fontWeight: 700, marginBottom: 2 }}>
              {selectedLesson.flag} {selectedLesson.language} • {selectedLesson.level}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedLesson.topic}</div>
          </div>
          <span style={{
            background: selectedLesson.color + '15', color: selectedLesson.color,
            padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
          }}>
            {selectedLesson.vocab.length} words
          </span>
        </div>

        {/* Tabs */}
        <div style={{ background: 'white', borderRadius: 14, padding: 6, marginBottom: 14, display: 'flex', gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {[
            { key: 'vocab', label: '📚 Vocabulary' },
            { key: 'flashcard', label: '🃏 Flashcards' },
            { key: 'quiz', label: '✅ Quiz' },
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

        {/* VOCABULARY TAB */}
        {activeTab === 'vocab' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selectedLesson.vocab.map((item, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: 12, padding: '16px 20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                display: 'flex', alignItems: 'center', gap: 16,
                borderLeft: `4px solid ${selectedLesson.color}`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: selectedLesson.color, marginBottom: 4 }}>
                    {item.word}
                  </div>
                  <div style={{ fontSize: 14, color: '#374151', marginBottom: 6 }}>
                    {item.translation}
                  </div>
                  <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>
                    "{item.example}"
                  </div>
                </div>
                <button
                  onClick={() => speak(item.word, getLangCode(selectedLesson.language))}
                  style={{
                    width: 40, height: 40, borderRadius: '50%', border: 'none',
                    background: selectedLesson.color + '15', color: selectedLesson.color,
                    cursor: 'pointer', fontSize: 18, flexShrink: 0,
                  }}
                >
                  🔊
                </button>
              </div>
            ))}
          </div>
        )}

        {/* FLASHCARDS TAB */}
        {activeTab === 'flashcard' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 20, fontSize: 13, color: '#6b7280' }}>
              Card {flashcardIndex + 1} of {selectedLesson.vocab.length} • Click to flip
            </div>

            <div
              onClick={() => setFlashcardFlipped(!flashcardFlipped)}
              style={{
                background: flashcardFlipped ? selectedLesson.color : 'white',
                borderRadius: 16, padding: '48px 32px', marginBottom: 20,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                cursor: 'pointer', minHeight: 200,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column',
                transition: 'all 0.3s',
              }}
            >
              <div style={{
                fontSize: 32, fontWeight: 800,
                color: flashcardFlipped ? 'white' : selectedLesson.color,
                marginBottom: 12,
              }}>
                {flashcardFlipped
                  ? selectedLesson.vocab[flashcardIndex].translation
                  : selectedLesson.vocab[flashcardIndex].word}
              </div>
              {!flashcardFlipped && (
                <div style={{ fontSize: 13, color: '#9ca3af' }}>Click to see translation</div>
              )}
              {flashcardFlipped && (
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', marginTop: 8 }}>
                  "{selectedLesson.vocab[flashcardIndex].example}"
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => { setFlashcardIndex(Math.max(0, flashcardIndex - 1)); setFlashcardFlipped(false) }}
                disabled={flashcardIndex === 0}
                className="btn-outline"
                style={{ padding: '10px 24px' }}
              >
                ← Previous
              </button>
              <button
                onClick={() => speak(selectedLesson.vocab[flashcardIndex].word, getLangCode(selectedLesson.language))}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: selectedLesson.color + '15', color: selectedLesson.color,
                  cursor: 'pointer', fontWeight: 600, fontSize: 14,
                }}
              >
                🔊 Hear it
              </button>
              <button
                onClick={() => { setFlashcardIndex(Math.min(selectedLesson.vocab.length - 1, flashcardIndex + 1)); setFlashcardFlipped(false) }}
                disabled={flashcardIndex === selectedLesson.vocab.length - 1}
                className="btn-primary"
                style={{ padding: '10px 24px' }}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* QUIZ TAB */}
        {activeTab === 'quiz' && (
          <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
              {selectedLesson.flag} {selectedLesson.language} Quiz — {selectedLesson.topic}
            </h3>

            {selectedLesson.quiz.map((q, qi) => (
              <div key={qi} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', marginBottom: 10 }}>
                  {qi + 1}. {q.question}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {q.options.map(option => (
                    <button
                      key={option}
                      onClick={() => !quizSubmitted && setQuizAnswers(prev => ({ ...prev, [qi]: option }))}
                      style={{
                        padding: '10px 14px', borderRadius: 8,
                        textAlign: 'left', cursor: quizSubmitted ? 'default' : 'pointer',
                        fontSize: 13, fontWeight: 500,
                        background: quizSubmitted
                          ? option === q.answer ? '#f0fdf4'
                          : quizAnswers[qi] === option ? '#fef2f2' : '#f9fafb'
                          : quizAnswers[qi] === option ? selectedLesson.color + '15' : '#f9fafb',
                        color: quizSubmitted
                          ? option === q.answer ? '#16a34a'
                          : quizAnswers[qi] === option ? '#ef4444' : '#6b7280'
                          : quizAnswers[qi] === option ? selectedLesson.color : '#374151',
                        border: quizSubmitted
                          ? option === q.answer ? '2px solid #16a34a'
                          : quizAnswers[qi] === option ? '2px solid #fecaca' : '2px solid transparent'
                          : quizAnswers[qi] === option ? `2px solid ${selectedLesson.color}` : '2px solid transparent',
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {!quizSubmitted ? (
              <button
                onClick={() => setQuizSubmitted(true)}
                className="btn-primary"
                disabled={Object.keys(quizAnswers).length < selectedLesson.quiz.length}
              >
                Submit Quiz →
              </button>
            ) : (
              <div>
                <div style={{
                  background: quizScore === selectedLesson.quiz.length ? '#f0fdf4' : '#fffbeb',
                  border: `1px solid ${quizScore === selectedLesson.quiz.length ? '#bbf7d0' : '#fde68a'}`,
                  borderRadius: 10, padding: '14px 18px', marginBottom: 12,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 24 }}>{quizScore === selectedLesson.quiz.length ? '🎉' : '📚'}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1f2937' }}>
                      {quizScore}/{selectedLesson.quiz.length} correct — {Math.round((quizScore / selectedLesson.quiz.length) * 100)}%
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {quizScore === selectedLesson.quiz.length ? 'Perfect score! Excellent work!' : 'Review the vocabulary and try again.'}
                    </div>
                  </div>
                </div>
                <button onClick={() => { setQuizAnswers({}); setQuizSubmitted(false) }} className="btn-outline">
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