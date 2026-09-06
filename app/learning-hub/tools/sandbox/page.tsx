'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const LANGUAGES = [
  { value: 'python', label: 'Python', version: '3.10.0', ext: 'py', color: '#3b82f6', template: '# Python Sandbox\n# Type your code here — no copy/paste allowed!\n\nprint("Hello, UniWeb!")\n' },
  { value: 'javascript', label: 'JavaScript', version: '18.15.0', ext: 'js', color: '#f59e0b', template: '// JavaScript Sandbox\n// Type your code here — no copy/paste allowed!\n\nconsole.log("Hello, UniWeb!");\n' },
  { value: 'c', label: 'C', version: '10.2.0', ext: 'c', color: '#6b7280', template: '// C Sandbox\n// Type your code here — no copy/paste allowed!\n\n#include <stdio.h>\n\nint main() {\n    printf("Hello, UniWeb!\\n");\n    return 0;\n}\n' },
  { value: 'cpp', label: 'C++', version: '10.2.0', ext: 'cpp', color: '#8b5cf6', template: '// C++ Sandbox\n// Type your code here — no copy/paste allowed!\n\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, UniWeb!" << endl;\n    return 0;\n}\n' },
  { value: 'java', label: 'Java', version: '15.0.2', ext: 'java', color: '#ef4444', template: '// Java Sandbox\n// Type your code here — no copy/paste allowed!\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, UniWeb!");\n    }\n}\n' },
  { value: 'typescript', label: 'TypeScript', version: '5.0.3', ext: 'ts', color: '#2563eb', template: '// TypeScript Sandbox\n// Type your code here — no copy/paste allowed!\n\nconst message: string = "Hello, UniWeb!";\nconsole.log(message);\n' },
]

const CHALLENGES = [
  {
    id: 1,
    title: 'Hello World',
    desc: 'Print "Hello, World!" to the console',
    difficulty: 'Beginner',
    color: '#16a34a',
    hints: ['Use print() in Python', 'Use console.log() in JavaScript', 'Use printf() in C'],
  },
  {
    id: 2,
    title: 'Sum of Two Numbers',
    desc: 'Write a program that adds two numbers and prints the result',
    difficulty: 'Beginner',
    color: '#16a34a',
    hints: ['Use variables to store numbers', 'Use + operator to add', 'Print the result'],
  },
  {
    id: 3,
    title: 'Even or Odd',
    desc: 'Write a program that checks if a number is even or odd',
    difficulty: 'Beginner',
    color: '#d97706',
    hints: ['Use modulo operator %', 'If number % 2 == 0, it is even', 'Use if/else statement'],
  },
  {
    id: 4,
    title: 'FizzBuzz',
    desc: 'Print numbers 1-20. For multiples of 3 print "Fizz", for 5 print "Buzz", for both print "FizzBuzz"',
    difficulty: 'Intermediate',
    color: '#d97706',
    hints: ['Use a for loop', 'Check divisibility with %', 'Check FizzBuzz condition first'],
  },
  {
    id: 5,
    title: 'Fibonacci Sequence',
    desc: 'Print the first 10 numbers of the Fibonacci sequence',
    difficulty: 'Intermediate',
    color: '#7c3aed',
    hints: ['Start with 0 and 1', 'Each number is sum of previous two', 'Use a loop to generate sequence'],
  },
  {
    id: 6,
    title: 'Palindrome Check',
    desc: 'Write a function that checks if a string is a palindrome',
    difficulty: 'Intermediate',
    color: '#7c3aed',
    hints: ['A palindrome reads the same forwards and backwards', 'Compare string with its reverse', '"racecar" is a palindrome'],
  },
  {
    id: 7,
    title: 'Factorial',
    desc: 'Write a recursive function to calculate the factorial of a number',
    difficulty: 'Advanced',
    color: '#dc2626',
    hints: ['factorial(0) = 1', 'factorial(n) = n * factorial(n-1)', 'Use recursion or iteration'],
  },
  {
    id: 8,
    title: 'Bubble Sort',
    desc: 'Implement bubble sort to sort an array of numbers in ascending order',
    difficulty: 'Advanced',
    color: '#dc2626',
    hints: ['Compare adjacent elements', 'Swap if they are in wrong order', 'Repeat until no swaps needed'],
  },
]

export default function CodeSandbox() {
  const [language, setLanguage] = useState(LANGUAGES[0])
  const [code, setCode] = useState(LANGUAGES[0].template)
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [pasteAttempts, setPasteAttempts] = useState(0)
  const [showPasteWarning, setShowPasteWarning] = useState(false)
  const [lineCount, setLineCount] = useState(1)
  const [activeTab, setActiveTab] = useState<'editor' | 'challenges' | 'saved'>('editor')
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null)
  const [savedSnippets, setSavedSnippets] = useState<any[]>([])
  const [snippetName, setSnippetName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [linesTyped, setLinesTyped] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load saved snippets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('uniweb_snippets')
    if (saved) setSavedSnippets(JSON.parse(saved))
  }, [])

  // Update line count
  useEffect(() => {
    const lines = code.split('\n').length
    setLineCount(lines)
    setCharCount(code.length)
  }, [code])

  // ===== BLOCK PASTE =====
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    setPasteAttempts(prev => prev + 1)
    setShowPasteWarning(true)
    setTimeout(() => setShowPasteWarning(false), 3000)
  }

  // Block right-click context menu on textarea
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setPasteAttempts(prev => prev + 1)
    setShowPasteWarning(true)
    setTimeout(() => setShowPasteWarning(false), 3000)
  }

  // Block keyboard shortcuts for paste
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isPaste = (e.ctrlKey || e.metaKey) && e.key === 'v'
    const isCut = (e.ctrlKey || e.metaKey) && e.key === 'x'
    if (isPaste || isCut) {
      e.preventDefault()
      setPasteAttempts(prev => prev + 1)
      setShowPasteWarning(true)
      setTimeout(() => setShowPasteWarning(false), 3000)
      return
    }
    // Count lines typed with Enter
    if (e.key === 'Enter') {
      setLinesTyped(prev => prev + 1)
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value)
  }

  const switchLanguage = (lang: typeof LANGUAGES[0]) => {
    setLanguage(lang)
    setCode(lang.template)
    setOutput('')
    setSelectedChallenge(null)
  }

  const loadChallenge = (challenge: any) => {
    setSelectedChallenge(challenge)
    setCode(`# Challenge: ${challenge.title}\n# ${challenge.desc}\n# Difficulty: ${challenge.difficulty}\n# Hints: ${challenge.hints.join(' | ')}\n\n# Type your solution here:\n\n`)
    setOutput('')
    setActiveTab('editor')
  }

  const runCode = async () => {
    setRunning(true)
    setOutput('⏳ Running your code...')
    try {
      const res = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: language.value,
          version: language.version,
          files: [{
            name: `main.${language.ext}`,
            content: code,
          }],
        }),
      })
      const data = await res.json()
      const stdout = data.run?.stdout || ''
      const stderr = data.run?.stderr || ''
      const result = stdout + (stderr ? `\n⚠️ Errors:\n${stderr}` : '')
      setOutput(result || '✅ Code ran with no output.')
    } catch (err) {
      setOutput('❌ Connection error. Check your internet and try again.')
    } finally {
      setRunning(false)
    }
  }

  const clearCode = () => {
    if (confirm('Clear all code? This cannot be undone.')) {
      setCode(language.template)
      setOutput('')
    }
  }

  const saveSnippet = () => {
    if (!snippetName.trim()) return
    const snippet = {
      id: Date.now(),
      name: snippetName,
      language: language.value,
      code,
      savedAt: new Date().toISOString(),
    }
    const updated = [snippet, ...savedSnippets.slice(0, 19)]
    setSavedSnippets(updated)
    localStorage.setItem('uniweb_snippets', JSON.stringify(updated))
    setShowSaveModal(false)
    setSnippetName('')
  }

  const loadSnippet = (snippet: any) => {
    const lang = LANGUAGES.find(l => l.value === snippet.language) || LANGUAGES[0]
    setLanguage(lang)
    setCode(snippet.code)
    setOutput('')
    setActiveTab('editor')
  }

  const deleteSnippet = (id: number) => {
    const updated = savedSnippets.filter(s => s.id !== id)
    setSavedSnippets(updated)
    localStorage.setItem('uniweb_snippets', JSON.stringify(updated))
  }

  const formatDate = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  return (
    <div style={{ background: '#0f0f23', minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        background: '#1a1a2e', borderBottom: '1px solid #2d2d44',
        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14,
        flexWrap: 'wrap',
      }}>
        <Link href="/learning-hub" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: 13 }}>
          ← Back
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
          <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 8, fontWeight: 700 }}>
            💻 UniWeb Code Sandbox
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, background: '#0f0f23', borderRadius: 8, padding: 3, marginLeft: 'auto' }}>
          {[
            { key: 'editor', label: '💻 Editor' },
            { key: 'challenges', label: '🎯 Challenges' },
            { key: 'saved', label: `💾 Saved (${savedSnippets.length})` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
              padding: '6px 14px', borderRadius: 6, border: 'none',
              background: activeTab === tab.key ? '#7c3aed' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#9ca3af',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#6b7280' }}>
          <span>{lineCount} lines</span>
          <span>{charCount} chars</span>
          {pasteAttempts > 0 && (
            <span style={{ color: '#ef4444', fontWeight: 700 }}>
              ⚠️ {pasteAttempts} paste attempt{pasteAttempts > 1 ? 's' : ''} blocked
            </span>
          )}
        </div>
      </div>

      {/* Paste Warning */}
      {showPasteWarning && (
        <div style={{
          background: '#7f1d1d', borderBottom: '1px solid #dc2626',
          padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10,
          animation: 'slideDown 0.2s ease',
        }}>
          <span style={{ fontSize: 20 }}>🚫</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5' }}>
              Copy/Paste Blocked — This is intentional!
            </div>
            <div style={{ fontSize: 12, color: '#fecaca' }}>
              Typing code yourself builds muscle memory and real understanding. You learn by doing, not copying.
              Even if you have the answer — type it in!
            </div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: '#f87171', fontWeight: 700 }}>
            Attempt #{pasteAttempts}
          </div>
        </div>
      )}

      {/* EDITOR TAB */}
      {activeTab === 'editor' && (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto 1fr auto' }}>

          {/* Language selector + toolbar */}
          <div style={{
            gridColumn: '1 / -1', background: '#1a1a2e',
            borderBottom: '1px solid #2d2d44',
            padding: '8px 16px', display: 'flex', gap: 8,
            alignItems: 'center', flexWrap: 'wrap',
          }}>
            {LANGUAGES.map(lang => (
              <button key={lang.value} onClick={() => switchLanguage(lang)} style={{
                padding: '5px 12px', borderRadius: 6, border: 'none',
                background: language.value === lang.value ? lang.color : '#2d2d44',
                color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                transition: 'all 0.15s',
              }}>
                {lang.label}
              </button>
            ))}

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {selectedChallenge && (
                <div style={{
                  background: selectedChallenge.color + '30',
                  border: `1px solid ${selectedChallenge.color}`,
                  borderRadius: 6, padding: '4px 10px',
                  fontSize: 11, color: selectedChallenge.color, fontWeight: 700,
                }}>
                  🎯 {selectedChallenge.title}
                </div>
              )}
              <button onClick={() => setShowSaveModal(true)} style={{
                background: '#2d2d44', border: 'none', borderRadius: 6,
                color: '#9ca3af', padding: '5px 12px', cursor: 'pointer', fontSize: 12,
              }}>
                💾 Save
              </button>
              <button onClick={clearCode} style={{
                background: '#2d2d44', border: 'none', borderRadius: 6,
                color: '#9ca3af', padding: '5px 12px', cursor: 'pointer', fontSize: 12,
              }}>
                🗑️ Clear
              </button>
            </div>
          </div>

          {/* Code editor */}
          <div style={{ position: 'relative', borderRight: '1px solid #2d2d44' }}>
            {/* Line numbers */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: 48, background: '#1a1a2e', borderRight: '1px solid #2d2d44',
              padding: '16px 0', overflowY: 'hidden', zIndex: 1,
            }}>
              {Array.from({ length: lineCount }).map((_, i) => (
                <div key={i} style={{
                  fontSize: 12, color: '#4b5563', textAlign: 'right',
                  paddingRight: 10, lineHeight: '1.6em', fontFamily: 'monospace',
                }}>
                  {i + 1}
                </div>
              ))}
            </div>

            <textarea
              ref={textareaRef}
              value={code}
              onChange={handleCodeChange}
              onPaste={handlePaste}
              onContextMenu={handleContextMenu}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              style={{
                width: '100%', height: '100%', minHeight: 400,
                background: '#0f0f23', color: '#cdd6f4',
                padding: '16px 16px 16px 64px',
                border: 'none', outline: 'none',
                fontSize: 14, fontFamily: 'JetBrains Mono, Courier New, monospace',
                lineHeight: '1.6em', resize: 'none',
                caretColor: '#7c3aed',
                userSelect: 'text',
              }}
              placeholder="// Start typing your code here..."
            />

            {/* No paste overlay hint */}
            <div style={{
              position: 'absolute', bottom: 12, right: 12,
              background: '#1a1a2e', border: '1px solid #2d2d44',
              borderRadius: 6, padding: '4px 10px',
              fontSize: 11, color: '#6b7280',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ color: '#ef4444' }}>🚫</span>
              Paste disabled — type to learn
            </div>
          </div>

          {/* Output panel */}
          <div style={{ display: 'flex', flexDirection: 'column', background: '#0f0f23' }}>
            <div style={{
              padding: '10px 16px', background: '#1a1a2e',
              borderBottom: '1px solid #2d2d44',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>
                OUTPUT
              </span>
              {output && (
                <button onClick={() => setOutput('')} style={{
                  background: 'none', border: 'none', color: '#6b7280',
                  cursor: 'pointer', fontSize: 12,
                }}>
                  Clear ×
                </button>
              )}
            </div>
            <div style={{ flex: 1, padding: 16, overflowY: 'auto', minHeight: 300 }}>
              {output ? (
                <pre style={{
                  margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  fontSize: 13, fontFamily: 'JetBrains Mono, monospace',
                  color: output.includes('❌') || output.includes('⚠️') ? '#f87171' : '#a6e3a1',
                  lineHeight: 1.6,
                }}>
                  {output}
                </pre>
              ) : (
                <div style={{ textAlign: 'center', paddingTop: 60, color: '#4b5563' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>▶</div>
                  <p style={{ fontSize: 13 }}>Run your code to see output</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom toolbar */}
          <div style={{
            gridColumn: '1 / -1', background: '#1a1a2e',
            borderTop: '1px solid #2d2d44',
            padding: '10px 16px', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 10,
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{
                background: '#2d2d44', borderRadius: 6, padding: '4px 10px',
                fontSize: 11, color: '#9ca3af',
              }}>
                {language.label} {language.version}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>
                Lines typed: {linesTyped} | Chars: {charCount}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={runCode}
                disabled={running || !code.trim()}
                style={{
                  background: running ? '#374151' : '#16a34a',
                  color: 'white', border: 'none', borderRadius: 8,
                  padding: '10px 28px', cursor: running ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: 14,
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'all 0.15s',
                }}
              >
                {running ? '⏳ Running...' : '▶ Run Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHALLENGES TAB */}
      {activeTab === 'challenges' && (
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>

            <div style={{ marginBottom: 24 }}>
              <h2 style={{ color: 'white', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
                🎯 Coding Challenges
              </h2>
              <p style={{ color: '#9ca3af', fontSize: 13 }}>
                Practice coding by solving these challenges. Remember — no copy/paste! Type every character.
              </p>
            </div>

            {/* Difficulty filter */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {['All', 'Beginner', 'Intermediate', 'Advanced'].map(diff => (
                <button key={diff} style={{
                  padding: '5px 14px', borderRadius: 999,
                  border: '1px solid #2d2d44',
                  background: diff === 'All' ? '#7c3aed' : 'transparent',
                  color: diff === 'All' ? 'white' : '#9ca3af',
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}>
                  {diff}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {CHALLENGES.map(challenge => (
                <div key={challenge.id} style={{
                  background: '#1a1a2e', borderRadius: 14,
                  border: `1px solid ${challenge.color}30`,
                  padding: '18px 20px', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.border = `1px solid ${challenge.color}`
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.border = `1px solid ${challenge.color}30`
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>
                      {challenge.title}
                    </h3>
                    <span style={{
                      background: challenge.color + '20',
                      color: challenge.color,
                      padding: '2px 8px', borderRadius: 999,
                      fontSize: 10, fontWeight: 700, flexShrink: 0, marginLeft: 8,
                    }}>
                      {challenge.difficulty}
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.5, marginBottom: 14 }}>
                    {challenge.desc}
                  </p>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Hints:</div>
                    {challenge.hints.map((hint, i) => (
                      <div key={i} style={{ fontSize: 11, color: '#4b5563', marginBottom: 2, display: 'flex', gap: 6 }}>
                        <span style={{ color: challenge.color }}>•</span>
                        <span>{hint}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => loadChallenge(challenge)}
                    style={{
                      width: '100%', padding: '8px',
                      background: challenge.color + '20',
                      border: `1px solid ${challenge.color}40`,
                      borderRadius: 8, color: challenge.color,
                      cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    }}
                  >
                    Start Challenge →
                  </button>
                </div>
              ))}
            </div>

            {/* Anti-cheat notice */}
            <div style={{
              marginTop: 24, background: '#1a1a2e',
              border: '1px solid #ef4444',
              borderRadius: 12, padding: '16px 20px',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>🚫</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f87171', marginBottom: 4 }}>
                  No Copy/Paste Policy
                </div>
                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, lineHeight: 1.6 }}>
                  Copy and paste is permanently disabled in this sandbox. Even if you find the answer online,
                  from AI, or from a friend — <strong style={{ color: '#fca5a5' }}>you must type every character yourself.</strong>
                  This is how real programmers build their skills. Your fingers need to learn, not just your eyes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SAVED SNIPPETS TAB */}
      {activeTab === 'saved' && (
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ color: 'white', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
              💾 Saved Snippets
            </h2>
            <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 20 }}>
              Your saved code snippets — stored on this device.
            </p>

            {savedSnippets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: '#4b5563' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💾</div>
                <h3 style={{ color: '#9ca3af', marginBottom: 8 }}>No saved snippets yet</h3>
                <p style={{ fontSize: 13 }}>Write some code and save it using the Save button in the editor.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {savedSnippets.map(snippet => {
                  const lang = LANGUAGES.find(l => l.value === snippet.language) || LANGUAGES[0]
                  return (
                    <div key={snippet.id} style={{
                      background: '#1a1a2e', borderRadius: 12,
                      border: '1px solid #2d2d44', overflow: 'hidden',
                    }}>
                      <div style={{
                        padding: '12px 16px', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center',
                        borderBottom: '1px solid #2d2d44',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            background: lang.color + '20', color: lang.color,
                            padding: '2px 8px', borderRadius: 4,
                            fontSize: 11, fontWeight: 700,
                          }}>
                            {lang.label}
                          </div>
                          <span style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{snippet.name}</span>
                          <span style={{ color: '#4b5563', fontSize: 11 }}>{formatDate(snippet.savedAt)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => loadSnippet(snippet)} style={{
                            background: '#16a34a', border: 'none', borderRadius: 6,
                            color: 'white', padding: '5px 12px', cursor: 'pointer',
                            fontSize: 12, fontWeight: 600,
                          }}>
                            Load →
                          </button>
                          <button onClick={() => deleteSnippet(snippet.id)} style={{
                            background: '#7f1d1d', border: 'none', borderRadius: 6,
                            color: '#f87171', padding: '5px 10px', cursor: 'pointer',
                            fontSize: 12,
                          }}>
                            🗑️
                          </button>
                        </div>
                      </div>
                      <pre style={{
                        margin: 0, padding: '12px 16px',
                        fontSize: 12, fontFamily: 'monospace',
                        color: '#9ca3af', lineHeight: 1.5,
                        overflow: 'hidden', maxHeight: 80,
                        whiteSpace: 'pre-wrap',
                      }}>
                        {snippet.code.slice(0, 200)}{snippet.code.length > 200 ? '...' : ''}
                      </pre>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 24,
        }} onClick={() => setShowSaveModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#1a1a2e', borderRadius: 14, padding: 24,
            width: '100%', maxWidth: 380, border: '1px solid #2d2d44',
          }}>
            <h3 style={{ color: 'white', fontSize: 16, marginBottom: 16 }}>💾 Save Snippet</h3>
            <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 6 }}>
              Snippet Name
            </label>
            <input
              type="text"
              placeholder="e.g. My Hello World"
              value={snippetName}
              onChange={e => setSnippetName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveSnippet()}
              autoFocus
              style={{
                width: '100%', padding: '10px 14px',
                background: '#0f0f23', border: '1px solid #2d2d44',
                borderRadius: 8, color: 'white', fontSize: 14,
                outline: 'none', marginBottom: 16,
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowSaveModal(false)} style={{
                flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #2d2d44',
                background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontSize: 13,
              }}>
                Cancel
              </button>
              <button onClick={saveSnippet} disabled={!snippetName.trim()} style={{
                flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                background: '#7c3aed', color: 'white', cursor: 'pointer',
                fontSize: 13, fontWeight: 700,
              }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}