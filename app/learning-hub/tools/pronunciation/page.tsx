'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { code: 'yo', label: 'Yoruba', flag: '🇳🇬' },
  { code: 'ig', label: 'Igbo', flag: '🇳🇬' },
  { code: 'ha', label: 'Hausa', flag: '🇳🇬' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'zh', label: 'Mandarin', flag: '🇨🇳' },
  { code: 'pt', label: 'Portuguese', flag: '🇵🇹' },
]

const PRACTICE_WORDS: Record<string, { word: string; phonetic: string; meaning: string }[]> = {
  en: [
    { word: 'through', phonetic: '/θruː/', meaning: 'from one end to another' },
    { word: 'thought', phonetic: '/θɔːt/', meaning: 'past tense of think' },
    { word: 'thorough', phonetic: '/ˈθʌrə/', meaning: 'complete in every detail' },
    { word: 'choir', phonetic: '/ˈkwaɪər/', meaning: 'a group of singers' },
    { word: 'colonel', phonetic: '/ˈkɜːnəl/', meaning: 'a military officer' },
  ],
  fr: [
    { word: 'bonjour', phonetic: '/bɔ̃ʒuʁ/', meaning: 'hello / good day' },
    { word: 'merci', phonetic: '/mɛʁsi/', meaning: 'thank you' },
    { word: 'croissant', phonetic: '/kʁwasɑ̃/', meaning: 'a type of pastry' },
    { word: 'château', phonetic: '/ʃɑto/', meaning: 'castle or manor house' },
    { word: 'grenouille', phonetic: '/ɡʁənuj/', meaning: 'frog' },
  ],
  es: [
    { word: 'hola', phonetic: '/ˈola/', meaning: 'hello' },
    { word: 'gracias', phonetic: '/ˈɡɾaθjas/', meaning: 'thank you' },
    { word: 'queso', phonetic: '/ˈkeso/', meaning: 'cheese' },
    { word: 'jalapeño', phonetic: '/xalaˈpeɲo/', meaning: 'a type of chili pepper' },
    { word: 'lluvia', phonetic: '/ˈʎuβja/', meaning: 'rain' },
  ],
}

export default function PronunciationTool() {
  // selectedLang holds the full BCP-47 tag used by speechSynthesis (e.g. 'fr-FR'),
  // matching the codes in LANGUAGES below.
  const [selectedLang, setSelectedLang] = useState('en-GB')
  const [inputText, setInputText] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [recording, setRecording] = useState(false)
  const [selectedWord, setSelectedWord] = useState<any>(null)
  const [practiceMode, setPracticeMode] = useState<'listen' | 'practice' | 'test'>('listen')
  const [voicesReady, setVoicesReady] = useState(false)
  const [translatedText, setTranslatedText] = useState('')
  const [translating, setTranslating] = useState(false)
  const [translateError, setTranslateError] = useState('')

  // Voice lists load asynchronously in some browsers (notably Chrome) — they can be
  // empty on first render. Re-check once the browser fires 'voiceschanged' so the
  // voice-matching in speak() below has real data to work with.
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const handleVoicesChanged = () => setVoicesReady(true)
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)
    // Some browsers already have voices loaded by the time this runs
    if (window.speechSynthesis.getVoices().length > 0) setVoicesReady(true)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
  }, [])

  // Clear any previous translation whenever the student changes the text or
  // switches target language, so a stale translation is never spoken.
  useEffect(() => {
    setTranslatedText('')
    setTranslateError('')
  }, [inputText, selectedLang])

  const speak = (text: string, lang: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech not supported in your browser')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.75
    utterance.pitch = 1

    // Explicitly pick a matching voice where possible. Some browsers will still
    // fall back to a default (often English) voice if utterance.lang alone
    // doesn't match any installed voice, so this catches that case too.
    const voices = window.speechSynthesis.getVoices()
    const matchingVoice =
      voices.find(v => v.lang === lang) ||
      voices.find(v => v.lang.startsWith(lang.split('-')[0]))
    if (matchingVoice) {
      utterance.voice = matchingVoice
    }

    setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => {
      setSpeaking(false)
      alert('Voice not available for this language on your device. Try English or French.')
    }

    // If no voice matches this language at all, warn up front rather than
    // silently speaking with whatever default voice the browser picks.
    if (!matchingVoice) {
      setSpeaking(false)
      alert('Voice not available for this language on your device. Try English or French.')
      return
    }

    window.speechSynthesis.speak(utterance)
  }

  // Translates English input into the selected language using the free
  // MyMemory API (no key required, but rate-limited — see note below).
  //
  // NOTE: MyMemory is fine for demos and light personal use, but has daily
  // request caps that are easy to hit with real traffic. For a production
  // app, swap this out for a paid provider (Google Cloud Translation, DeepL,
  // or Azure Translator) — same function shape, just a different fetch URL
  // and an API key stored server-side (never in client code).
  const translateText = async (text: string, targetLangKey: string) => {
    if (!text.trim()) return
    if (targetLangKey === 'en') {
      // Already English — nothing to translate, just speak it directly.
      setTranslatedText(text)
      speak(text, selectedLang)
      return
    }
    setTranslating(true)
    setTranslateError('')
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLangKey}`
      )
      const data = await res.json()
      const translated = data?.responseData?.translatedText
      if (!translated || data?.responseStatus !== 200) {
        throw new Error('No translation returned')
      }
      setTranslatedText(translated)
      speak(translated, selectedLang)
    } catch (err) {
      setTranslateError(
        `Couldn't translate to ${LANGUAGES.find(l => l.code === selectedLang)?.label || 'this language'} right now. Try again, or type the word directly in that language and press Listen.`
      )
    } finally {
      setTranslating(false)
    }
  }

  // PRACTICE_WORDS is keyed by short language codes ('en', 'fr', 'es'), while
  // selectedLang holds a full locale tag ('en-GB', 'fr-FR') for speechSynthesis.
  // Strip the region suffix before looking up word data.
  const langKey = selectedLang.split('-')[0]
  const practiceWords = PRACTICE_WORDS[langKey] || PRACTICE_WORDS.en
  const currentLang = LANGUAGES.find(l => l.code === selectedLang)

  return (
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
        padding: '32px 24px 60px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -60, top: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Link href="/learning-hub" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}>
            ← Back to Learning Hub
          </Link>
          <div style={{ marginTop: 12 }}>
            <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
              🎧 Pronunciation Trainer
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
              Listen, repeat and master pronunciation in multiple languages
            </p>
          </div>

          {/* Language selector */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => { setSelectedLang(lang.code); setSelectedWord(null) }}
                style={{
                  padding: '6px 14px', borderRadius: 999, border: 'none',
                  background: selectedLang === lang.code ? 'white' : 'rgba(255,255,255,0.15)',
                  color: selectedLang === lang.code ? '#7c3aed' : 'white',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {lang.flag} {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '-28px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>

        {/* Mode selector */}
        <div style={{
          background: 'white', borderRadius: 14, padding: '6px',
          marginBottom: 20, display: 'flex', gap: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          {[
            { key: 'listen', label: '🎧 Listen & Learn' },
            { key: 'practice', label: '🎤 Practice Speaking' },
            { key: 'test', label: '✅ Test Yourself' },
          ].map(mode => (
            <button
              key={mode.key}
              onClick={() => setPracticeMode(mode.key as any)}
              style={{
                flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                background: practiceMode === mode.key ? '#7c3aed' : 'transparent',
                color: practiceMode === mode.key ? 'white' : '#6b7280',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                transition: 'all 0.15s',
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* LISTEN & LEARN MODE */}
        {practiceMode === 'listen' && (
          <div>
            {/* Custom text input */}
            <div style={{
              background: 'white', borderRadius: 14, padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16,
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                🔊 Text to Speech — {currentLang?.flag} {currentLang?.label}
              </h3>
              <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
                Type a word or phrase in {currentLang?.label} to hear it pronounced — or type in English and use "Translate & Speak" to hear the {currentLang?.label} translation.
              </p>
              <textarea
                placeholder={`Type in ${currentLang?.label}, or type English to translate...`}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                rows={3}
                style={{
                  width: '100%', padding: '12px', border: '1.5px solid #e5e7eb',
                  borderRadius: 8, fontSize: 14, resize: 'vertical',
                  fontFamily: 'inherit', outline: 'none', marginBottom: 10,
                }}
              />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  onClick={() => speak(inputText || 'Hello, welcome to the pronunciation trainer', selectedLang)}
                  disabled={speaking}
                  style={{
                    background: speaking ? '#6b7280' : '#7c3aed',
                    color: 'white', border: 'none', borderRadius: 8,
                    padding: '10px 24px', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {speaking ? '🔊 Speaking...' : '▶ Listen (as typed)'}
                </button>
                {langKey !== 'en' && (
                  <button
                    onClick={() => translateText(inputText, langKey)}
                    disabled={translating || !inputText.trim()}
                    style={{
                      background: translating || !inputText.trim() ? '#e5e7eb' : '#059669',
                      color: translating || !inputText.trim() ? '#9ca3af' : 'white',
                      border: 'none', borderRadius: 8,
                      padding: '10px 24px', cursor: translating || !inputText.trim() ? 'default' : 'pointer',
                      fontWeight: 700, fontSize: 14,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    {translating ? '🌐 Translating...' : `🌐 Translate & Speak`}
                  </button>
                )}
              </div>
              {translatedText && !translateError && (
                <div style={{
                  marginTop: 14, padding: '12px 14px', background: '#ecfdf5',
                  border: '1px solid #a7f3d0', borderRadius: 8,
                }}>
                  <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, marginBottom: 4 }}>
                    {currentLang?.label} translation
                  </div>
                  <div style={{ fontSize: 15, color: '#1f2937', fontWeight: 600 }}>
                    {translatedText}
                  </div>
                </div>
              )}
              {translateError && (
                <div style={{
                  marginTop: 14, padding: '12px 14px', background: '#fef2f2',
                  border: '1px solid #fecaca', borderRadius: 8,
                  fontSize: 13, color: '#b91c1c',
                }}>
                  {translateError}
                </div>
              )}
            </div>

            {/* Practice words */}
            <div style={{
              background: 'white', borderRadius: 14, padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
                📚 Practice Words — {currentLang?.flag} {currentLang?.label}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {practiceWords.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 10,
                      background: selectedWord?.word === item.word ? '#f5f3ff' : '#f9fafb',
                      border: selectedWord?.word === item.word ? '2px solid #7c3aed' : '2px solid transparent',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedWord(item)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginBottom: 3 }}>
                        {item.word}
                      </div>
                      <div style={{ fontSize: 13, color: '#7c3aed', fontFamily: 'monospace', marginBottom: 2 }}>
                        {item.phonetic}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{item.meaning}</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); speak(item.word, selectedLang) }}
                      style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: '#7c3aed', border: 'none',
                        color: 'white', cursor: 'pointer', fontSize: 18,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      🔊
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PRACTICE SPEAKING MODE */}
        {practiceMode === 'practice' && (
          <PracticeSpeaking
            words={practiceWords}
            lang={selectedLang}
            selectedWord={selectedWord}
            setSelectedWord={setSelectedWord}
            onSpeak={speak}
          />
        )}

        {/* TEST MODE */}
        {practiceMode === 'test' && (
          <PronunciationTest words={practiceWords} lang={selectedLang} onSpeak={speak} />
        )}

      </div>
    </div>
  )
}

function PracticeSpeaking({
  words, lang, selectedWord, setSelectedWord, onSpeak,
}: {
  words: any[]
  lang: string
  selectedWord: any
  setSelectedWord: (w: any) => void
  onSpeak: (text: string, lang: string) => void
}) {
  const [recording, setRecording] = useState(false)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [playingBack, setPlayingBack] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Clean up the object URL when it changes or the component unmounts,
  // so we don't leak memory across multiple recordings.
  useEffect(() => {
    return () => {
      if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    }
  }, [recordedUrl])

  // Reset the recording whenever the student switches words, so they
  // don't compare a new target word against an old recording.
  useEffect(() => {
    setRecordedUrl(null)
  }, [selectedWord?.word])

  const startRecording = async () => {
    try {
      setRecordedUrl(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      const chunks: BlobPart[] = []

      mediaRecorder.ondataavailable = e => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setRecordedUrl(URL.createObjectURL(blob))
        setRecording(false)
        setCountdown(null)
      }

      mediaRecorder.start()
      setRecording(true)

      // 3-second countdown so the student can see time remaining
      let secondsLeft = 3
      setCountdown(secondsLeft)
      const interval = setInterval(() => {
        secondsLeft -= 1
        setCountdown(secondsLeft)
        if (secondsLeft <= 0) {
          clearInterval(interval)
          mediaRecorder.stop()
        }
      }, 1000)
    } catch (err) {
      setRecording(false)
      setCountdown(null)
      alert('Microphone access denied. Please allow microphone access to practice pronunciation.')
    }
  }

  const playRecording = () => {
    if (!recordedUrl || !audioRef.current) return
    setPlayingBack(true)
    audioRef.current.currentTime = 0
    audioRef.current.play()
  }

  return (
    <div style={{
      background: 'white', borderRadius: 14, padding: 28,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center',
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎤</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
        Record Your Pronunciation
      </h3>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
        Pick a word, listen to how it should sound, then record yourself and compare.
      </p>

      {/* Word selector */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
        {words.map(item => (
          <button
            key={item.word}
            onClick={() => setSelectedWord(item)}
            style={{
              padding: '6px 14px', borderRadius: 8, border: 'none',
              background: selectedWord?.word === item.word ? '#7c3aed' : '#f3f4f6',
              color: selectedWord?.word === item.word ? 'white' : '#374151',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            {item.word}
          </button>
        ))}
      </div>

      {selectedWord && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1f2937', marginBottom: 4 }}>
            {selectedWord.word}
          </div>
          <div style={{ fontSize: 16, color: '#7c3aed', fontFamily: 'monospace', marginBottom: 16 }}>
            {selectedWord.phonetic}
          </div>
          <button
            onClick={() => onSpeak(selectedWord.word, lang)}
            style={{
              background: '#f5f3ff', border: '1px solid #ddd6fe',
              color: '#7c3aed', borderRadius: 8, padding: '8px 20px',
              cursor: 'pointer', fontWeight: 600, fontSize: 14, marginBottom: 16,
            }}
          >
            🔊 Hear it first
          </button>
        </div>
      )}

      <button
        onClick={startRecording}
        disabled={recording || !selectedWord}
        style={{
          width: 80, height: 80, borderRadius: '50%', border: 'none',
          background: recording ? '#ef4444' : selectedWord ? '#7c3aed' : '#d1d5db',
          color: 'white', cursor: recording || !selectedWord ? 'default' : 'pointer', fontSize: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto',
          boxShadow: recording ? '0 0 0 8px rgba(239,68,68,0.2)' : '0 4px 16px rgba(124,58,237,0.3)',
          transition: 'all 0.2s',
        }}
      >
        {recording ? countdown : '🎤'}
      </button>
      <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 12 }}>
        {!selectedWord ? 'Pick a word above first' : recording ? 'Recording...' : 'Press to record (3 seconds)'}
      </p>

      {/* Compare panel — only appears once a recording exists */}
      {recordedUrl && selectedWord && (
        <div style={{
          marginTop: 28, paddingTop: 24, borderTop: '1px solid #e5e7eb',
        }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#374151' }}>
            🔁 Compare your pronunciation
          </h4>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => onSpeak(selectedWord.word, lang)}
              style={{
                background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed',
                borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              }}
            >
              🔊 Model pronunciation
            </button>
            <button
              onClick={playRecording}
              disabled={playingBack}
              style={{
                background: playingBack ? '#e5e7eb' : '#ecfdf5',
                border: '1px solid #a7f3d0', color: '#059669',
                borderRadius: 8, padding: '10px 20px',
                cursor: playingBack ? 'default' : 'pointer', fontWeight: 600, fontSize: 14,
              }}
            >
              {playingBack ? '▶ Playing your recording...' : '🎧 Your recording'}
            </button>
          </div>
          <audio
            ref={audioRef}
            src={recordedUrl}
            onEnded={() => setPlayingBack(false)}
            style={{ display: 'none' }}
          />
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 14 }}>
            Listen to both back to back — notice the vowel sounds and stress in particular.
          </p>
        </div>
      )}
    </div>
  )
}

function PronunciationTest({ words, lang, onSpeak }: { words: any[]; lang: string; onSpeak: (text: string, lang: string) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<Record<number, boolean>>({})
  const [showResult, setShowResult] = useState(false)
  const [options, setOptions] = useState<string[]>([])

  useEffect(() => {
    generateOptions()
  }, [currentIndex])

  const generateOptions = () => {
    const correct = words[currentIndex].word
    const others = words.filter((_, i) => i !== currentIndex).map(w => w.word)
    const shuffled = [correct, ...others.slice(0, 3)].sort(() => Math.random() - 0.5)
    setOptions(shuffled)
  }

  const handleAnswer = (answer: string) => {
    const correct = words[currentIndex].word
    const isCorrect = answer === correct
    setAnswers(prev => ({ ...prev, [currentIndex]: isCorrect }))
    if (isCorrect) setScore(prev => prev + 1)

    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        setShowResult(true)
      }
    }, 800)
  }

  if (showResult) return (
    <div style={{ background: 'white', borderRadius: 14, padding: 32, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>{score >= words.length * 0.8 ? '🎉' : score >= words.length * 0.5 ? '👍' : '📚'}</div>
      <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
        {score >= words.length * 0.8 ? 'Excellent!' : score >= words.length * 0.5 ? 'Good effort!' : 'Keep practising!'}
      </h3>
      <div style={{ fontSize: 36, fontWeight: 800, color: '#7c3aed', marginBottom: 8 }}>
        {score}/{words.length}
      </div>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        {Math.round((score / words.length) * 100)}% correct
      </p>
      <button
        onClick={() => { setCurrentIndex(0); setScore(0); setAnswers({}); setShowResult(false) }}
        style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 700 }}
      >
        Try Again →
      </button>
    </div>
  )

  const current = words[currentIndex]
  return (
    <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <span style={{ fontSize: 13, color: '#6b7280' }}>Question {currentIndex + 1} of {words.length}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>Score: {score}</span>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <button
          onClick={() => onSpeak(current.word, lang)}
          style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#7c3aed', border: 'none',
            color: 'white', cursor: 'pointer', fontSize: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
          }}
        >
          🔊
        </button>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Listen and select the correct word</p>
        <div style={{ fontSize: 18, color: '#7c3aed', fontFamily: 'monospace', marginTop: 8 }}>
          {current.phonetic}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {options.map(option => {
          const answered = answers[currentIndex] !== undefined
          const isCorrect = option === current.word
          return (
            <button
              key={option}
              onClick={() => !answered && handleAnswer(option)}
              style={{
                padding: '14px', borderRadius: 10,
                background: !answered ? '#f9fafb' :
                  isCorrect ? '#f0fdf4' : answers[currentIndex] === false && option !== current.word ? '#fef2f2' : '#f9fafb',
                color: !answered ? '#1f2937' : isCorrect ? '#16a34a' : '#ef4444',
                cursor: answered ? 'default' : 'pointer',
                fontSize: 15, fontWeight: 700,
                border: !answered ? '2px solid #e5e7eb' :
                  isCorrect ? '2px solid #16a34a' : '2px solid #fecaca',
              }}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}