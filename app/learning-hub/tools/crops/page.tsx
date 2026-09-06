'use client'

import { useState } from 'react'
import Link from 'next/link'

const CROPS = [
  {
    id: 'maize',
    name: 'Maize (Corn)',
    emoji: '🌽',
    family: 'Poaceae',
    origin: 'Mexico',
    season: 'Rainy season (Apr–Sep)',
    soilType: 'Well-drained loamy soil',
    ph: '6.0 – 7.0',
    spacing: '75cm × 30cm',
    maturity: '90–120 days',
    uses: ['Food (grain)', 'Animal feed', 'Ethanol production', 'Starch extraction'],
    diseases: ['Maize streak virus', 'Leaf blight', 'Stem borer'],
    nutrients: 'Heavy feeder — needs NPK fertilizer especially Nitrogen',
    color: '#d97706',
    bg: '#fffbeb',
  },
  {
    id: 'cassava',
    name: 'Cassava',
    emoji: '🥔',
    family: 'Euphorbiaceae',
    origin: 'South America',
    season: 'Year-round, best rainy season',
    soilType: 'Sandy loam, well-drained',
    ph: '5.5 – 6.5',
    spacing: '1m × 1m',
    maturity: '9–24 months',
    uses: ['Food (tuber)', 'Garri production', 'Starch', 'Animal feed'],
    diseases: ['Cassava mosaic', 'Brown streak', 'Bacterial blight'],
    nutrients: 'Tolerates poor soils but needs Potassium and Phosphorus',
    color: '#92400e',
    bg: '#fef3c7',
  },
  {
    id: 'yam',
    name: 'Yam',
    emoji: '🍠',
    family: 'Dioscoreaceae',
    origin: 'West Africa / Asia',
    season: 'Nov–Dec planting, harvest Oct–Nov',
    soilType: 'Deep, well-drained loamy soil',
    ph: '5.5 – 6.5',
    spacing: '1m × 1.5m',
    maturity: '7–9 months',
    uses: ['Food', 'Cultural ceremonies', 'Medicinal uses'],
    diseases: ['Yam mosaic virus', 'Anthracnose', 'Dry rot'],
    nutrients: 'Needs organic matter, NPK, especially Potassium',
    color: '#b45309',
    bg: '#fef9c3',
  },
  {
    id: 'tomato',
    name: 'Tomato',
    emoji: '🍅',
    family: 'Solanaceae',
    origin: 'South America',
    season: 'Dry season (Oct–Feb) for best yield',
    soilType: 'Loamy, well-drained, rich in organic matter',
    ph: '6.0 – 6.8',
    spacing: '60cm × 45cm',
    maturity: '60–90 days',
    uses: ['Fresh consumption', 'Paste/puree', 'Canning', 'Juice'],
    diseases: ['Early blight', 'Late blight', 'Fusarium wilt', 'Tomato mosaic'],
    nutrients: 'Heavy feeder — NPK + Calcium, Magnesium',
    color: '#dc2626',
    bg: '#fef2f2',
  },
  {
    id: 'rice',
    name: 'Rice',
    emoji: '🌾',
    family: 'Poaceae',
    origin: 'Asia',
    season: 'Rainy season, needs standing water',
    soilType: 'Heavy clay soil with good water retention',
    ph: '5.5 – 6.5',
    spacing: '25cm × 25cm',
    maturity: '90–150 days',
    uses: ['Staple food', 'Rice flour', 'Animal feed', 'Beer production'],
    diseases: ['Rice blast', 'Brown spot', 'Sheath blight'],
    nutrients: 'Needs Nitrogen heavily, plus Phosphorus at planting',
    color: '#16a34a',
    bg: '#f0fdf4',
  },
  {
    id: 'cowpea',
    name: 'Cowpea (Black-eyed pea)',
    emoji: '🫘',
    family: 'Fabaceae',
    origin: 'West Africa',
    season: 'Both dry and rainy season',
    soilType: 'Sandy loam to loam, well-drained',
    ph: '6.0 – 7.0',
    spacing: '75cm × 20cm',
    maturity: '60–90 days',
    uses: ['Food (beans)', 'Protein source', 'Animal feed', 'Soil nitrogen fixation'],
    diseases: ['Cowpea mosaic', 'Septoria leaf spot', 'Anthracnose'],
    nutrients: 'Fixes atmospheric Nitrogen — needs Phosphorus and Potassium',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
]

const SEASONS = [
  { name: 'Rainy Season', months: 'Apr – Sep', crops: ['maize', 'cassava', 'yam', 'rice', 'cowpea'], color: '#2563eb', icon: '🌧️' },
  { name: 'Dry Season', months: 'Oct – Mar', crops: ['tomato', 'cowpea'], color: '#d97706', icon: '☀️' },
  { name: 'Year Round', months: 'All year', crops: ['cassava'], color: '#16a34a', icon: '🌍' },
]

export default function CropIdentifier() {
  const [activeTab, setActiveTab] = useState<'identify' | 'calendar' | 'quiz'>('identify')
  const [selectedCrop, setSelectedCrop] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizOptions, setQuizOptions] = useState<string[]>([])
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null)
  const [quizScore, setQuizScore] = useState(0)
  const [quizTotal, setQuizTotal] = useState(0)

  const filteredCrops = CROPS.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.family.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const startQuiz = () => {
    generateQuestion(0)
  }

  const generateQuestion = (index: number) => {
    if (index >= CROPS.length) return
    const correct = CROPS[index]
    const others = CROPS.filter((_, i) => i !== index).sort(() => Math.random() - 0.5).slice(0, 3)
    setQuizOptions([correct.name, ...others.map(o => o.name)].sort(() => Math.random() - 0.5))
    setQuizIndex(index)
    setQuizAnswer(null)
  }

  const answerQuiz = (answer: string) => {
    setQuizAnswer(answer)
    setQuizTotal(prev => prev + 1)
    if (answer === CROPS[quizIndex].name) setQuizScore(prev => prev + 1)
    setTimeout(() => generateQuestion(quizIndex + 1), 1200)
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 60px)' }}>
      <div style={{
        background: 'linear-gradient(135deg, #14532d, #16a34a)',
        padding: '32px 24px 60px',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Link href="/learning-hub" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}>
            ← Back to Learning Hub
          </Link>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, marginBottom: 4, marginTop: 12 }}>
            🌾 Crop Identifier
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            Identify crops, learn growing conditions and plan your farm calendar
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '-28px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>

        {/* Tabs */}
        <div style={{ background: 'white', borderRadius: 14, padding: 6, marginBottom: 16, display: 'flex', gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {[
            { key: 'identify', label: '🔍 Crop Library' },
            { key: 'calendar', label: '📅 Season Calendar' },
            { key: 'quiz', label: '✅ Identify Quiz' },
          ].map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key as any); if (tab.key === 'quiz') startQuiz() }} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: 'none',
              background: activeTab === tab.key ? '#16a34a' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#6b7280',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* CROP LIBRARY */}
        {activeTab === 'identify' && (
          <div>
            {/* Search */}
            <div style={{ background: 'white', borderRadius: 12, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <span>🔍</span>
              <input
                placeholder="Search crops..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedCrop ? '1fr 1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {/* Crop cards */}
              <div style={{ display: 'grid', gridTemplateColumns: selectedCrop ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, alignContent: 'start' }}>
                {filteredCrops.map(crop => (
                  <div
                    key={crop.id}
                    onClick={() => setSelectedCrop(selectedCrop?.id === crop.id ? null : crop)}
                    style={{
                      background: selectedCrop?.id === crop.id ? crop.bg : 'white',
                      border: selectedCrop?.id === crop.id ? `2px solid ${crop.color}` : '2px solid #f3f4f6',
                      borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 12,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 32, flexShrink: 0 }}>{crop.emoji}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>{crop.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{crop.family}</div>
                      <div style={{ fontSize: 11, color: crop.color, fontWeight: 600, marginTop: 2 }}>{crop.season}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Crop detail */}
              {selectedCrop && (
                <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', alignSelf: 'start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <span style={{ fontSize: 48 }}>{selectedCrop.emoji}</span>
                    <div>
                      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1f2937', margin: 0 }}>{selectedCrop.name}</h2>
                      <p style={{ fontSize: 13, color: '#6b7280', margin: '3px 0 0' }}>Family: {selectedCrop.family} • Origin: {selectedCrop.origin}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    {[
                      { label: '📅 Season', value: selectedCrop.season },
                      { label: '🌱 Soil Type', value: selectedCrop.soilType },
                      { label: '⚗️ Soil pH', value: selectedCrop.ph },
                      { label: '📏 Spacing', value: selectedCrop.spacing },
                      { label: '⏱ Maturity', value: selectedCrop.maturity },
                    ].map(item => (
                      <div key={item.label} style={{ background: selectedCrop.bg, borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>🍽️ Uses:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {selectedCrop.uses.map((use: string) => (
                        <span key={use} style={{ background: selectedCrop.color + '15', color: selectedCrop.color, padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{use}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>🦠 Common Diseases:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {selectedCrop.diseases.map((d: string) => (
                        <div key={d} style={{ fontSize: 12, color: '#dc2626', display: 'flex', gap: 6 }}>
                          <span>⚠️</span><span>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#15803d' }}>
                    🌿 <strong>Nutrients:</strong> {selectedCrop.nutrients}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SEASON CALENDAR */}
        {activeTab === 'calendar' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {SEASONS.map(season => (
                <div key={season.name} style={{ background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ background: season.color, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{season.icon}</span>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>{season.name}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{season.months}</div>
                      </div>
                    </div>
                    <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                      {season.crops.length} crops
                    </span>
                  </div>
                  <div style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {season.crops.map(cropId => {
                      const crop = CROPS.find(c => c.id === cropId)
                      if (!crop) return null
                      return (
                        <div key={cropId} onClick={() => { setSelectedCrop(crop); setActiveTab('identify') }} style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          background: crop.bg, border: `1px solid ${crop.color}30`,
                          borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
                        }}>
                          <span style={{ fontSize: 20 }}>{crop.emoji}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: crop.color }}>{crop.name}</div>
                            <div style={{ fontSize: 10, color: '#9ca3af' }}>{crop.maturity}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Planting calendar grid */}
            <div style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>📅 Monthly Planting Calendar</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 600 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>Crop</th>
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                        <th key={m} style={{ padding: '8px 4px', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { crop: CROPS[0], months: [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0] },
                      { crop: CROPS[1], months: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
                      { crop: CROPS[2], months: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1] },
                      { crop: CROPS[3], months: [1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1] },
                      { crop: CROPS[4], months: [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0] },
                      { crop: CROPS[5], months: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
                    ].map(({ crop, months }) => (
                      <tr key={crop.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{crop.emoji}</span>
                          <span style={{ fontSize: 12 }}>{crop.name.split(' ')[0]}</span>
                        </td>
                        {months.map((active, i) => (
                          <td key={i} style={{ padding: '4px', textAlign: 'center' }}>
                            {active ? (
                              <div style={{ width: '100%', height: 20, background: crop.color, borderRadius: 4, opacity: 0.8 }} />
                            ) : (
                              <div style={{ width: '100%', height: 20, background: '#f3f4f6', borderRadius: 4 }} />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 20, height: 12, background: '#16a34a', borderRadius: 2 }} />
                  <span style={{ fontSize: 11, color: '#6b7280' }}>Planting period</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 20, height: 12, background: '#f3f4f6', borderRadius: 2 }} />
                  <span style={{ fontSize: 11, color: '#6b7280' }}>Off season</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QUIZ */}
        {activeTab === 'quiz' && (
          <div style={{ background: 'white', borderRadius: 14, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {quizTotal > 0 && (
              <div style={{ textAlign: 'right', marginBottom: 16, fontSize: 13, color: '#6b7280', fontWeight: 600 }}>
                Score: {quizScore}/{quizTotal} ({Math.round((quizScore / quizTotal) * 100)}%)
              </div>
            )}

            {quizIndex >= CROPS.length ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>{quizScore >= CROPS.length * 0.8 ? '🎉' : '📚'}</div>
                <h3 style={{ fontSize: 20, fontWeight: 800 }}>Quiz Complete!</h3>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#16a34a', margin: '10px 0' }}>{quizScore}/{CROPS.length}</div>
                <button onClick={() => { setQuizScore(0); setQuizTotal(0); startQuiz() }} className="btn-primary" style={{ background: '#16a34a', marginTop: 16 }}>
                  Try Again →
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20, textAlign: 'center' }}>
                  What crop does this describe?
                </p>
                <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '20px', marginBottom: 24, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 10 }}>{CROPS[quizIndex].emoji}</div>
                  <div style={{ fontSize: 14, color: '#374151', marginBottom: 6 }}>
                    <strong>Family:</strong> {CROPS[quizIndex].family}
                  </div>
                  <div style={{ fontSize: 14, color: '#374151', marginBottom: 6 }}>
                    <strong>Season:</strong> {CROPS[quizIndex].season}
                  </div>
                  <div style={{ fontSize: 14, color: '#374151' }}>
                    <strong>Soil pH:</strong> {CROPS[quizIndex].ph}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {quizOptions.map(option => (
                    <button key={option} onClick={() => !quizAnswer && answerQuiz(option)} style={{
                      padding: '14px', borderRadius: 10,
                      background: !quizAnswer ? '#f9fafb'
                        : option === CROPS[quizIndex].name ? '#f0fdf4'
                        : quizAnswer === option ? '#fef2f2' : '#f9fafb',
                      color: !quizAnswer ? '#374151'
                        : option === CROPS[quizIndex].name ? '#16a34a'
                        : quizAnswer === option ? '#ef4444' : '#9ca3af',
                      border: !quizAnswer ? '2px solid #e5e7eb'
                        : option === CROPS[quizIndex].name ? '2px solid #16a34a'
                        : quizAnswer === option ? '2px solid #fecaca' : '2px solid transparent',
                      cursor: quizAnswer ? 'default' : 'pointer',
                      fontSize: 14, fontWeight: 600, transition: 'all 0.15s',
                    }}>
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}