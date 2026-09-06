'use client'

import { useState } from 'react'
import Link from 'next/link'

const IPA_VOWELS = [
  { symbol: 'iː', example: 'see', word: 'see', desc: 'Long "ee" sound' },
  { symbol: 'ɪ', example: 'sit', word: 'sit', desc: 'Short "i" sound' },
  { symbol: 'e', example: 'bed', word: 'bed', desc: 'Short "e" sound' },
  { symbol: 'æ', example: 'cat', word: 'cat', desc: 'Short "a" sound' },
  { symbol: 'ɑː', example: 'car', word: 'car', desc: 'Long "ah" sound' },
  { symbol: 'ɒ', example: 'hot', word: 'hot', desc: 'Short "o" sound' },
  { symbol: 'ɔː', example: 'more', word: 'more', desc: 'Long "aw" sound' },
  { symbol: 'ʊ', example: 'book', word: 'book', desc: 'Short "oo" sound' },
  { symbol: 'uː', example: 'food', word: 'food', desc: 'Long "oo" sound' },
  { symbol: 'ʌ', example: 'cup', word: 'cup', desc: 'Short "uh" sound' },
  { symbol: 'ɜː', example: 'bird', word: 'bird', desc: 'Long "er" sound' },
  { symbol: 'ə', example: 'about', word: 'about', desc: 'Schwa - unstressed' },
]

const IPA_CONSONANTS = [
  { symbol: 'p', example: 'pen', word: 'pen', desc: 'Voiceless bilabial stop' },
  { symbol: 'b', example: 'bed', word: 'bed', desc: 'Voiced bilabial stop' },
  { symbol: 't', example: 'ten', word: 'ten', desc: 'Voiceless alveolar stop' },
  { symbol: 'd', example: 'dog', word: 'dog', desc: 'Voiced alveolar stop' },
  { symbol: 'k', example: 'cat', word: 'cat', desc: 'Voiceless velar stop' },
  { symbol: 'g', example: 'get', word: 'get', desc: 'Voiced velar stop' },
  { symbol: 'f', example: 'fan', word: 'fan', desc: 'Voiceless labiodental' },
  { symbol: 'v', example: 'van', word: 'van', desc: 'Voiced labiodental' },
  { symbol: 'θ', example: 'think', word: 'think', desc: 'Voiceless dental' },
  { symbol: 'ð', example: 'the', word: 'the', desc: 'Voiced dental' },
  { symbol: 's', example: 'sun', word: 'sun', desc: 'Voiceless alveolar' },
  { symbol: 'z', example: 'zoo', word: 'zoo', desc: 'Voiced alveolar' },
  { symbol: 'ʃ', example: 'she', word: 'she', desc: 'Voiceless palato-alveolar' },
  { symbol: 'ʒ', example: 'measure', word: 'measure', desc: 'Voiced palato-alveolar' },
  { symbol: 'tʃ', example: 'church', word: 'church', desc: 'Voiceless affricate' },
  { symbol: 'dʒ', example: 'judge', word: 'judge', desc: 'Voiced affricate' },
  { symbol: 'm', example: 'man', word: 'man', desc: 'Bilabial nasal' },
  { symbol: 'n', example: 'now', word: 'now', desc: 'Alveolar nasal' },
  { symbol: 'ŋ', example: 'sing', word: 'sing', desc: 'Velar nasal' },
  { symbol: 'h', example: 'hot', word: 'hot', desc: 'Glottal fricative' },
  { symbol: 'l', example: 'leg', word: 'leg', desc: 'Lateral approximant' },
  { symbol: 'r', example: 'red', word: 'red', desc: 'Rhotic approximant' },
  { symbol: 'j', example: 'yes', word: 'yes', desc: 'Palatal approximant' },
  { symbol: 'w', example: 'wet', word: 'wet', desc: 'Labial-velar approximant' },
]

const DIPHTHONGS = [
  { symbol: 'eɪ', example: 'say', word: 'say', desc: 'As in "say"' },
  { symbol: 'aɪ', example: 'my', word: 'my', desc: 'As in "my"' },
  { symbol: 'ɔɪ', example: 'boy', word: 'boy', desc: 'As in "boy"' },
  { symbol: 'aʊ', example: 'now', word: 'now', desc: 'As in "now"' },
  { symbol: 'əʊ', example: 'go', word: 'go', desc: 'As in "go"' },
  { symbol: 'ɪə', example: 'here', word: 'here', desc: 'As in "here"' },
  { symbol: 'eə', example: 'air', word: 'air', desc: 'As in "air"' },
  { symbol: 'ʊə', example: 'pure', word: 'pure', desc: 'As in "pure"' },
]

export default function PhoneticsTrainer() {
  const [activeSection, setActiveSection] = useState<'vowels' | 'consonants' | 'diphthongs'>('vowels')
  const [selectedSymbol, setSelectedSymbol] = useState<any>(null)
  const [quizMode, setQuizMode] = useState(false)
  const [quizQuestion, setQuizQuestion] = useState<any>(null)
  const [quizOptions, setQuizOptions] = useState<string[]>([])
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null)
  const [quizScore, setQuizScore] = useState(0)
  const [quizTotal, setQuizTotal] = useState(0)

  const speak = (word: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-GB'
      utterance.rate = 0.7
      window.speechSynthesis.speak(utterance)
    }
  }

  const currentData = activeSection === 'vowels' ? IPA_VOWELS
    : activeSection === 'consonants' ? IPA_CONSONANTS : DIPHTHONGS

  const startQuiz = () => {
    const randomIndex = Math.floor(Math.random() * currentData.length)
    const q = currentData[randomIndex]
    setQuizQuestion(q)
    setQuizAnswer(null)

    // Generate wrong options
    const others = currentData.filter((_, i) => i !== randomIndex)
      .sort(() => Math.random() - 0.5).slice(0, 3).map(o => o.symbol)
    setQuizOptions([q.symbol, ...others].sort(() => Math.random() - 0.5))
    setQuizMode(true)
  }

  const answerQuiz = (symbol: string) => {
    setQuizAnswer(symbol)
    setQuizTotal(prev => prev + 1)
    if (symbol === quizQuestion.symbol) {
      setQuizScore(prev => prev + 1)
    }
    setTimeout(() => {
      startQuiz()
    }, 1500)
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
        padding: '32px 24px 60px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Link href="/learning-hub" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}>
            ← Back to Learning Hub
          </Link>
          <div style={{ marginTop: 12 }}>
            <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
              🔤 Phonetics Trainer
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
              Learn International Phonetic Alphabet (IPA) symbols and sounds
            </p>
          </div>

          {/* Score bar (quiz mode) */}
          {quizTotal > 0 && (
            <div style={{
              marginTop: 16, background: 'rgba(255,255,255,0.15)',
              borderRadius: 10, padding: '8px 16px', display: 'inline-flex',
              alignItems: 'center', gap: 10, fontSize: 14, color: 'white',
            }}>
              <span>📊 Quiz Score:</span>
              <span style={{ fontWeight: 800, fontSize: 18 }}>{quizScore}/{quizTotal}</span>
              <span style={{ color: '#4ade80' }}>({Math.round((quizScore / quizTotal) * 100)}%)</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '-28px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>

        {/* Mode toggle */}
        <div style={{
          background: 'white', borderRadius: 14, padding: 6, marginBottom: 16,
          display: 'flex', gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <button
            onClick={() => setQuizMode(false)}
            style={{
              flex: 1, padding: '10px', borderRadius: 10, border: 'none',
              background: !quizMode ? '#7c3aed' : 'transparent',
              color: !quizMode ? 'white' : '#6b7280',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            📖 Study Mode
          </button>
          <button
            onClick={startQuiz}
            style={{
              flex: 1, padding: '10px', borderRadius: 10, border: 'none',
              background: quizMode ? '#7c3aed' : 'transparent',
              color: quizMode ? 'white' : '#6b7280',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            🎯 Quiz Mode
          </button>
        </div>

        {!quizMode ? (
          <div>
            {/* Section tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[
                { key: 'vowels', label: '🗣️ Vowels', count: IPA_VOWELS.length },
                { key: 'consonants', label: '💬 Consonants', count: IPA_CONSONANTS.length },
                { key: 'diphthongs', label: '🔀 Diphthongs', count: DIPHTHONGS.length },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveSection(tab.key as any); setSelectedSymbol(null) }}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none',
                    background: activeSection === tab.key ? '#7c3aed' : 'white',
                    color: activeSection === tab.key ? 'white' : '#374151',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedSymbol ? '1fr 280px' : '1fr', gap: 16 }}>
              {/* Symbols grid */}
              <div style={{
                background: 'white', borderRadius: 14, padding: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                  {currentData.map(item => (
                    <div
                      key={item.symbol}
                      onClick={() => { setSelectedSymbol(item); speak(item.word) }}
                      style={{
                        background: selectedSymbol?.symbol === item.symbol ? '#f5f3ff' : '#f9fafb',
                        border: selectedSymbol?.symbol === item.symbol ? '2px solid #7c3aed' : '2px solid transparent',
                        borderRadius: 10, padding: '12px 8px', textAlign: 'center',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed', marginBottom: 4 }}>
                        {item.symbol}
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{item.example}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected symbol detail */}
              {selectedSymbol && (
                <div style={{
                  background: 'white', borderRadius: 14, padding: 20,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  position: 'sticky', top: 80, alignSelf: 'start',
                }}>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{
                      fontSize: 64, fontWeight: 900, color: '#7c3aed',
                      marginBottom: 8, lineHeight: 1,
                    }}>
                      {selectedSymbol.symbol}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
                      as in "{selectedSymbol.example}"
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                      {selectedSymbol.desc}
                    </div>
                    <button
                      onClick={() => speak(selectedSymbol.word)}
                      style={{
                        background: '#7c3aed', color: 'white', border: 'none',
                        borderRadius: 8, padding: '10px 24px', cursor: 'pointer',
                        fontWeight: 700, fontSize: 14,
                      }}
                    >
                      🔊 Hear it
                    </button>
                  </div>

                  <div style={{ background: '#f5f3ff', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 8 }}>
                      HOW TO PRONOUNCE
                    </div>
                    <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>
                      {selectedSymbol.desc}. Example word: <strong>{selectedSymbol.word}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Quiz mode
          <div style={{
            background: 'white', borderRadius: 14, padding: 28,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center',
          }}>
            {quizQuestion && (
              <div>
                <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
                  Which IPA symbol represents this sound?
                </p>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#1f2937', marginBottom: 8 }}>
                    "{quizQuestion.example}"
                  </div>
                  <button
                    onClick={() => speak(quizQuestion.word)}
                    style={{
                      background: '#f5f3ff', border: '1px solid #ddd6fe',
                      color: '#7c3aed', borderRadius: 8, padding: '8px 20px',
                      cursor: 'pointer', fontWeight: 600, fontSize: 14,
                    }}
                  >
                    🔊 Hear the sound
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 360, margin: '0 auto' }}>
                  {quizOptions.map(option => (
                    <button
                      key={option}
                      onClick={() => !quizAnswer && answerQuiz(option)}
                      style={{
                        padding: '16px',
                        borderRadius: 10,
                        fontSize: 28,
                        fontWeight: 900,
                        cursor: quizAnswer ? 'default' : 'pointer',
                        background: !quizAnswer ? '#f9fafb'
                          : option === quizQuestion.symbol ? '#f0fdf4'
                          : quizAnswer === option ? '#fef2f2' : '#f9fafb',
                        color: !quizAnswer ? '#7c3aed'
                          : option === quizQuestion.symbol ? '#16a34a'
                          : quizAnswer === option ? '#ef4444' : '#9ca3af',
                        border: !quizAnswer ? '2px solid #e5e7eb'
                          : option === quizQuestion.symbol ? '2px solid #16a34a'
                          : quizAnswer === option ? '2px solid #fecaca' : '2px solid #e5e7eb',
                        transition: 'all 0.15s',
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                {quizAnswer && (
                  <div style={{ marginTop: 16, fontSize: 14, color: quizAnswer === quizQuestion.symbol ? '#16a34a' : '#ef4444', fontWeight: 700 }}>
                    {quizAnswer === quizQuestion.symbol ? '✅ Correct!' : `❌ The answer was: ${quizQuestion.symbol}`}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}