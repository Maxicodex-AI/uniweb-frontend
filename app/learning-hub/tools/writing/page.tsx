'use client'

import { useState } from 'react'
import Link from 'next/link'

const ARTICLE_TYPES = [
  { id: 'news', label: '📰 News Article', desc: 'Straight news reporting — who, what, when, where, why', color: '#dc2626' },
  { id: 'feature', label: '📖 Feature Story', desc: 'In-depth storytelling with human interest angle', color: '#7c3aed' },
  { id: 'editorial', label: '✍️ Editorial/Opinion', desc: 'Opinion piece with argument and evidence', color: '#2563eb' },
  { id: 'interview', label: '🎤 Interview', desc: 'Q&A format with a newsworthy subject', color: '#d97706' },
]

const INVERTED_PYRAMID = [
  { level: 1, label: 'Lead (Lede)', size: '100%', desc: 'Most newsworthy information — the 5 Ws and H', color: '#dc2626', content: 'Who did What, When, Where, Why and How?' },
  { level: 2, label: 'Important Details', size: '75%', desc: 'Key facts that support the lead', color: '#d97706', content: 'Supporting facts, quotes, context' },
  { level: 3, label: 'Background', size: '55%', desc: 'General background information', color: '#16a34a', content: 'History, related events, explanations' },
  { level: 4, label: 'Other Details', size: '35%', desc: 'Additional information readers may want', color: '#2563eb', content: 'Secondary quotes, statistics, details' },
  { level: 5, label: 'Least Essential', size: '20%', desc: 'Can be cut if space is needed', color: '#9ca3af', content: 'Background colour, tangential info' },
]

const NEWS_CHECKLIST = [
  { item: 'Answers the 5 Ws (Who, What, When, Where, Why)', key: 'fiveWs' },
  { item: 'Lead paragraph grabs attention', key: 'lead' },
  { item: 'Uses inverted pyramid structure', key: 'pyramid' },
  { item: 'Includes at least 2 direct quotes', key: 'quotes' },
  { item: 'Quotes are properly attributed', key: 'attribution' },
  { item: 'No opinion or bias in news story', key: 'bias' },
  { item: 'Headline is accurate and compelling', key: 'headline' },
  { item: 'Checked for spelling and grammar', key: 'grammar' },
]

export default function ArticleWriter() {
  const [activeTab, setActiveTab] = useState<'learn' | 'write' | 'broadcast' | 'checklist'>('learn')
  const [selectedType, setSelectedType] = useState('news')
  const [headline, setHeadline] = useState('')
  const [byline, setByline] = useState('')
  const [lead, setLead] = useState('')
  const [body, setBody] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})

  // Broadcast
  const [broadcastType, setBroadcastType] = useState('tv_news')
  const [broadcastScript, setBroadcastScript] = useState('')
  const [broadcastDuration, setBroadcastDuration] = useState(0)

  const updateBody = (text: string) => {
    setBody(text)
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length)
  }

  const estimateDuration = (text: string) => {
    const words = text.trim().split(/\s+/).filter(Boolean).length
    const wordsPerMin = broadcastType === 'tv_news' ? 150 : 130
    setBroadcastDuration(Math.ceil((words / wordsPerMin) * 60))
    setBroadcastScript(text)
  }

  const formatDuration = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`

  const checklistScore = Object.values(checklist).filter(Boolean).length

  return (
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>
      <div style={{ background: 'linear-gradient(135deg, #7f1d1d, #dc2626)', padding: '32px 24px 60px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Link href="/learning-hub" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}>
            ← Back to Learning Hub
          </Link>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, marginBottom: 4, marginTop: 12 }}>
            ✍️ Article Writer & Broadcast Studio
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            Learn journalism writing, practice articles and create broadcast scripts
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '-28px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>

        {/* Tabs */}
        <div style={{ background: 'white', borderRadius: 14, padding: 6, marginBottom: 16, display: 'flex', gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {[
            { key: 'learn', label: '📖 Learn' },
            { key: 'write', label: '✍️ Write Article' },
            { key: 'broadcast', label: '📡 Broadcast' },
            { key: 'checklist', label: '✅ Checklist' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: 'none',
              background: activeTab === tab.key ? '#dc2626' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#6b7280',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* LEARN TAB */}
        {activeTab === 'learn' && (
          <div>
            {/* Inverted Pyramid */}
            <div style={{ background: 'white', borderRadius: 14, padding: 24, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>📐 The Inverted Pyramid</h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>The fundamental structure of news writing</p>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {INVERTED_PYRAMID.map((level, i) => (
                  <div key={level.level} style={{ width: level.size, transition: 'width 0.3s' }}>
                    <div style={{
                      background: level.color + '15', border: `2px solid ${level.color}`,
                      borderRadius: 8, padding: '12px 16px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: level.color }}>{level.label}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{level.desc}</div>
                      </div>
                      <div style={{
                        background: level.color, color: 'white',
                        borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                      }}>
                        Level {level.level}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Article types */}
            <div style={{ background: 'white', borderRadius: 14, padding: 24, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📰 Types of Journalism</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {ARTICLE_TYPES.map(type => (
                  <div key={type.id} style={{ background: type.color + '10', border: `1px solid ${type.color}30`, borderRadius: 12, padding: '16px' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: type.color, marginBottom: 6 }}>{type.label}</div>
                    <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{type.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* News values */}
            <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🎯 News Values (What Makes News?)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                {[
                  { icon: '⏰', label: 'Timeliness', desc: 'Is it happening now or recent?' },
                  { icon: '🌍', label: 'Proximity', desc: 'Is it local or relevant to the audience?' },
                  { icon: '⭐', label: 'Prominence', desc: 'Does it involve famous people or places?' },
                  { icon: '💥', label: 'Impact', desc: 'Does it affect many people?' },
                  { icon: '😮', label: 'Conflict', desc: 'Is there a disagreement or struggle?' },
                  { icon: '🔁', label: 'Human Interest', desc: 'Does it evoke emotion?' },
                ].map(v => (
                  <div key={v.label} style={{ background: '#fef2f2', borderRadius: 10, padding: '12px 14px', border: '1px solid #fecaca' }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{v.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 3 }}>{v.label}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{v.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* WRITE ARTICLE TAB */}
        {activeTab === 'write' && (
          <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Write Your Article</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {ARTICLE_TYPES.map(t => (
                  <button key={t.id} onClick={() => setSelectedType(t.id)} style={{
                    padding: '4px 10px', borderRadius: 6, border: 'none',
                    background: selectedType === t.id ? t.color : '#f3f4f6',
                    color: selectedType === t.id ? 'white' : '#374151',
                    cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  }}>
                    {t.label.split(' ')[0]} {t.label.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>

            <label>📰 Headline</label>
            <input type="text" placeholder="Write a compelling headline..." value={headline} onChange={e => setHeadline(e.target.value)} />

            <label>✍️ Byline (Your name)</label>
            <input type="text" placeholder="By John Doe, Staff Reporter" value={byline} onChange={e => setByline(e.target.value)} />

            <label>🎯 Lead Paragraph (The most important information)</label>
            <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>Answer: Who? What? When? Where? Why? How?</p>
            <textarea
              placeholder="Write your opening paragraph here — it should tell the whole story in 1-2 sentences..."
              value={lead}
              onChange={e => setLead(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, resize: 'vertical', fontFamily: 'inherit', outline: 'none', marginBottom: 16 }}
            />

            <label>📄 Body</label>
            <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>Develop the story with supporting facts, quotes and background</p>
            <textarea
              placeholder={'Expand on your lead with:\n• Direct quotes from sources\n• Background information\n• Supporting facts and statistics\n• Context and analysis'}
              value={body}
              onChange={e => updateBody(e.target.value)}
              rows={12}
              style={{ width: '100%', padding: '12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, resize: 'vertical', fontFamily: 'Georgia, serif', lineHeight: 1.8, outline: 'none' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 12, color: '#9ca3af' }}>
              <span>{wordCount} words</span>
              <span>{wordCount < 200 ? '📝 Too short' : wordCount < 500 ? '✅ Good length' : '📰 Long form'}</span>
            </div>

            {/* Preview */}
            {(headline || lead) && (
              <div style={{ marginTop: 20, background: '#f9fafb', borderRadius: 12, padding: '20px 24px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Preview</div>
                {headline && <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1f2937', marginBottom: 4, lineHeight: 1.3 }}>{headline}</h2>}
                {byline && <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>{byline}</p>}
                {lead && <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, fontWeight: 600, marginBottom: 10 }}>{lead}</p>}
                {body && <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}>{body}</p>}
              </div>
            )}
          </div>
        )}

        {/* BROADCAST TAB */}
        {activeTab === 'broadcast' && (
          <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📡 Broadcast Script Writer</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Write scripts for TV news, radio or podcast</p>

            <label>Broadcast Type</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[
                { key: 'tv_news', label: '📺 TV News', wpm: 150 },
                { key: 'radio', label: '📻 Radio', wpm: 130 },
                { key: 'podcast', label: '🎙️ Podcast', wpm: 140 },
              ].map(t => (
                <button key={t.key} onClick={() => setBroadcastType(t.key)} style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                  background: broadcastType === t.key ? '#dc2626' : '#f3f4f6',
                  color: broadcastType === t.key ? 'white' : '#374151',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Script tips */}
            <div style={{ background: '#fef2f2', borderRadius: 10, padding: '12px 16px', marginBottom: 16, border: '1px solid #fecaca' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>📋 Broadcast Writing Rules:</div>
              {[
                'Write for the ear, not the eye — use conversational language',
                'Keep sentences short — one idea per sentence',
                'Avoid jargon and technical terms',
                'Always identify people clearly before quoting them',
                'Use present tense where possible ("says" not "said")',
                'Read your script aloud — if it sounds awkward, rewrite it',
              ].map((rule, i) => (
                <div key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 3, display: 'flex', gap: 6 }}>
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>{i + 1}.</span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>

            <label>Your Broadcast Script</label>
            <textarea
              placeholder={'Good evening. I\'m [Your Name] with the news.\n\n[HEADLINE]\n\n[STORY DETAILS]\n\nFor [Station Name], I\'m [Your Name].'}
              value={broadcastScript}
              onChange={e => estimateDuration(e.target.value)}
              rows={14}
              style={{ width: '100%', padding: '14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, resize: 'vertical', fontFamily: 'Courier New, monospace', lineHeight: 1.8, outline: 'none' }}
            />

            {/* Duration indicator */}
            {broadcastDuration > 0 && (
              <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ background: '#fef2f2', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>⏱</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#dc2626' }}>{formatDuration(broadcastDuration)}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Estimated duration</div>
                  </div>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>📝</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#374151' }}>
                      {broadcastScript.trim().split(/\s+/).filter(Boolean).length}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Words</div>
                  </div>
                </div>
                <div style={{
                  background: broadcastDuration < 60 ? '#fffbeb' : broadcastDuration <= 180 ? '#f0fdf4' : '#fef2f2',
                  borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: broadcastDuration < 60 ? '#d97706' : broadcastDuration <= 180 ? '#16a34a' : '#dc2626' }}>
                    {broadcastDuration < 60 ? '⚠️ Too short' : broadcastDuration <= 180 ? '✅ Good length' : '⚠️ Too long'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CHECKLIST TAB */}
        {activeTab === 'checklist' && (
          <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>✅ News Article Checklist</h3>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#dc2626' }}>
                {checklistScore}/{NEWS_CHECKLIST.length}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 8, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ height: '100%', width: `${(checklistScore / NEWS_CHECKLIST.length) * 100}%`, background: checklistScore === NEWS_CHECKLIST.length ? '#16a34a' : '#dc2626', borderRadius: 999, transition: 'width 0.3s' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {NEWS_CHECKLIST.map(item => (
                <div
                  key={item.key}
                  onClick={() => setChecklist(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                    background: checklist[item.key] ? '#f0fdf4' : '#f9fafb',
                    border: checklist[item.key] ? '2px solid #bbf7d0' : '2px solid #f3f4f6',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                    background: checklist[item.key] ? '#16a34a' : 'white',
                    border: checklist[item.key] ? '2px solid #16a34a' : '2px solid #d1d5db',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 14,
                  }}>
                    {checklist[item.key] && '✓'}
                  </div>
                  <span style={{ fontSize: 14, color: checklist[item.key] ? '#15803d' : '#374151', fontWeight: checklist[item.key] ? 600 : 400 }}>
                    {item.item}
                  </span>
                </div>
              ))}
            </div>

            {checklistScore === NEWS_CHECKLIST.length && (
              <div style={{ marginTop: 20, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                <h3 style={{ color: '#16a34a', fontSize: 16, fontWeight: 800 }}>Article Ready!</h3>
                <p style={{ fontSize: 13, color: '#6b7280' }}>Your article meets all journalism standards. Well done!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}