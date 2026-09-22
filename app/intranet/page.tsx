'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useTheme } from '../context/ThemeContext' // adjust path to match your project structure

const resources = [
  { icon: '🛒', title: 'Marketplace', desc: 'Buy, sell and connect with students', href: '#', color: '#16a34a', bg: '#f0fdf4', bgDark: '#052e16' },
  { icon: '📅', title: 'School Events', desc: 'Discover and join campus events', href: '#', color: '#2563eb', bg: '#eff6ff', bgDark: '#172554' },
  { icon: '🔍', title: 'Lost & Found', desc: 'Report or find lost items', href: '#', color: '#d97706', bg: '#fffbeb', bgDark: '#451a03' },
  { icon: '🗺️', title: 'School Map', desc: 'Navigate campus easily', href: '#', color: '#7c3aed', bg: '#f5f3ff', bgDark: '#2e1065' },
  { icon: '🎓', title: 'Scholarships', desc: 'Find scholarship opportunities', href: '#', color: '#dc2626', bg: '#fef2f2', bgDark: '#450a0a' },
  { icon: '💼', title: 'Career Opportunities', desc: 'Jobs, internships and more', href: '#', color: '#0891b2', bg: '#ecfeff', bgDark: '#083344' },
  { icon: '📚', title: 'Library', desc: 'Access digital library resources', href: '#', color: '#16a34a', bg: '#f0fdf4', bgDark: '#052e16' },
  { icon: '🏥', title: 'Health Services', desc: 'Campus health and wellness', href: '#', color: '#dc2626', bg: '#fef2f2', bgDark: '#450a0a' },
  { icon: '🚌', title: 'Transport', desc: 'Bus schedules and routes', href: '#', color: '#d97706', bg: '#fffbeb', bgDark: '#451a03' },
]

const announcements = [
  { title: 'Registration Portal Now Open', time: '2 hours ago', type: 'urgent' },
  { title: 'Library Extended Hours During Exams', time: '1 day ago', type: 'info' },
  { title: 'Campus Wi-Fi Upgrade Scheduled', time: '2 days ago', type: 'info' },
]

export default function IntranetPage() {
  const { bg, bgCard, bgSecondary, text, textSecondary, border, inputBg, isDark } = useTheme()
  const [showMarketModal, setShowMarketModal] = useState(false)
  const [activeSection, setActiveSection] = useState<'home' | 'marketplace'>('home')

  return (
    <div style={{ background: bg, minHeight: 'calc(100vh - 60px)' }}>

      {/* ===== MARKETPLACE CHOICE MODAL ===== */}
      {showMarketModal && (
        <div
          onClick={() => setShowMarketModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: bgCard, borderRadius: 20,
              width: '100%', maxWidth: 520,
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
            }}
          >
            {/* Modal header — fixed brand gradient */}
            <div style={{
              background: 'linear-gradient(135deg, #052e16, #16a34a)',
              padding: '24px 28px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🛒</div>
                  <h2 style={{ color: 'white', fontSize: 20, fontWeight: 800, margin: 0 }}>
                    UniWeb Marketplace
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: '4px 0 0' }}>
                    What would you like to do?
                  </p>
                </div>
                <button
                  onClick={() => setShowMarketModal(false)}
                  style={{
                    background: 'rgba(255,255,255,0.15)', border: 'none',
                    borderRadius: 8, width: 32, height: 32,
                    cursor: 'pointer', color: 'white', fontSize: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Options */}
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Option 1 — Go To Market (groceries) */}
              <a
                href="https://gotomart.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
                onClick={() => setShowMarketModal(false)}
              >
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '18px 20px', borderRadius: 14,
                    border: isDark ? '2px solid #166534' : '2px solid #bbf7d0',
                    background: isDark ? 'linear-gradient(135deg, #052e16, #14532d)' : 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(22,163,74,0.2)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: '#16a34a', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26,
                  }}>
                    🥬
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: isDark ? '#86efac' : '#15803d' }}>
                        Order Groceries
                      </span>
                      <span style={{
                        background: '#16a34a', color: 'white',
                        fontSize: 10, fontWeight: 700, padding: '2px 6px',
                        borderRadius: 4,
                      }}>
                        NEW
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: textSecondary, margin: 0, lineHeight: 1.5 }}>
                      Get fresh market items delivered to your door. Make a list, send it off — no stress.
                    </p>
                    <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginTop: 5 }}>
                      Powered by Go To Market • Opens in new tab ↗
                    </div>
                  </div>
                  <span style={{ color: '#16a34a', fontSize: 22, flexShrink: 0 }}>›</span>
                </div>
              </a>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: border }} />
                <span style={{ fontSize: 12, color: textSecondary, fontWeight: 600 }}>OR</span>
                <div style={{ flex: 1, height: 1, background: border }} />
              </div>

              {/* Option 2 — Student Marketplace */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '18px 20px', borderRadius: 14,
                  border: `2px solid ${border}`,
                  background: bgSecondary,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.border = '2px solid #bfdbfe'
                  e.currentTarget.style.background = isDark ? '#172554' : '#eff6ff'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.border = `2px solid ${border}`
                  e.currentTarget.style.background = bgSecondary
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
                onClick={() => {
                  setShowMarketModal(false)
                  setActiveSection('marketplace')
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: '#2563eb', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26,
                }}>
                  🤝
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: isDark ? '#93c5fd' : '#1e40af' }}>
                      Student Marketplace
                    </span>
                    <span style={{
                      background: isDark ? '#1e3a8a' : '#dbeafe',
                      color: isDark ? '#93c5fd' : '#2563eb',
                      fontSize: 10, fontWeight: 700, padding: '2px 6px',
                      borderRadius: 4,
                    }}>
                      BETA
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: textSecondary, margin: 0, lineHeight: 1.5 }}>
                    Buy and sell textbooks, electronics, clothes and more with fellow students on campus.
                  </p>
                  <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, marginTop: 5 }}>
                    UniWeb Community Market • Free to use
                  </div>
                </div>
                <span style={{ color: '#2563eb', fontSize: 22, flexShrink: 0 }}>›</span>
              </div>

              {/* Info note */}
              <div style={{
                background: isDark ? '#451a03' : '#fffbeb',
                border: isDark ? '1px solid #78350f' : '1px solid #fde68a',
                borderRadius: 10, padding: '10px 14px',
                display: 'flex', gap: 8, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
                <p style={{ fontSize: 12, color: isDark ? '#fde68a' : '#78350f', margin: 0, lineHeight: 1.5 }}>
                  <strong>Go To Market</strong> handles fresh groceries from local markets.
                  The <strong>Student Marketplace</strong> is for buying and selling items between students on campus.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero — fixed brand gradient, not theme-swapped */}
      <div style={{
        background: 'linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0369a1 100%)',
        padding: '40px 24px 80px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -80, top: -80, width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(125,211,252,0.15)' }} />
        <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(125,211,252,0.15)', border: '1px solid rgba(125,211,252,0.3)',
            borderRadius: 999, padding: '3px 12px', marginBottom: 8,
          }}>
            <span style={{ color: '#7dd3fc', fontSize: 12, fontWeight: 600 }}>🌐 UniWeb Intranet</span>
          </div>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
            Explore Campus
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
            Access campus resources, services and opportunities
          </p>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: bgCard, borderRadius: 12, padding: '12px 18px',
            maxWidth: 480, marginTop: 24,
          }}>
            <span style={{ fontSize: 16 }}>🔍</span>
            <input
              placeholder="Search campus resources..."
              style={{
                flex: 1, border: 'none', outline: 'none',
                fontSize: 14, color: text, background: 'transparent',
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '-40px auto 0', padding: '0 24px 40px', position: 'relative', zIndex: 1 }}>

        {/* Back button when inside the marketplace section */}
        {activeSection === 'marketplace' && (
          <button
            onClick={() => setActiveSection('home')}
            style={{
              background: bgCard, border: `1px solid ${border}`,
              borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: text,
              marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            ← Back to Intranet
          </button>
        )}

        {/* ===== HOME SECTION ===== */}
        {activeSection === 'home' && (
          <>
            {/* Resources grid — tile accent colors kept fixed, just swap bg tint by theme */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 12,
              marginBottom: 24,
            }}>
              {resources.map(r => (
                <a
                  key={r.title}
                  href={r.title === 'Marketplace' ? undefined : r.href}
                  onClick={e => {
                    if (r.title === 'Marketplace') {
                      e.preventDefault()
                      setShowMarketModal(true)
                    }
                  }}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: isDark ? r.bgDark : r.bg,
                    borderRadius: 12,
                    padding: '20px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    border: `1px solid ${r.color}20`,
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>{r.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: text, marginBottom: 4 }}>
                      {r.title}
                    </div>
                    <div style={{ fontSize: 11, color: textSecondary, lineHeight: 1.4 }}>
                      {r.desc}
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Two column */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

              {/* Campus announcements */}
              <div style={{
                background: bgCard, borderRadius: 16,
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)', padding: 24,
              }}>
                <h2 style={{ fontSize: 15, marginBottom: 16, color: text }}>📢 Campus Notices</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {announcements.map((ann, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 12, alignItems: 'flex-start',
                      padding: '12px', background: bgSecondary, borderRadius: 10,
                      border: `1px solid ${border}`,
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                        background: ann.type === 'urgent' ? (isDark ? '#450a0a' : '#fef2f2') : (isDark ? '#172554' : '#eff6ff'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16,
                      }}>
                        {ann.type === 'urgent' ? '🚨' : 'ℹ️'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 2 }}>
                          {ann.title}
                        </div>
                        <div style={{ fontSize: 11, color: textSecondary }}>{ann.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div style={{
                background: bgCard, borderRadius: 16,
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)', padding: 24,
              }}>
                <h2 style={{ fontSize: 15, marginBottom: 16, color: text }}>⚡ Quick Links</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Student Portal', icon: '👤', desc: 'Access your student records' },
                    { label: 'Fee Payment', icon: '💳', desc: 'Pay tuition and other fees' },
                    { label: 'Result Checker', icon: '📊', desc: 'Check your academic results' },
                    { label: 'Course Registration', icon: '📝', desc: 'Register for courses' },
                    { label: 'Certificate Request', icon: '🎓', desc: 'Request official documents' },
                  ].map(link => (
                    <div key={link.label} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 10, background: bgSecondary,
                      border: `1px solid ${border}`, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}>
                      <span style={{ fontSize: 20 }}>{link.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: text }}>{link.label}</div>
                        <div style={{ fontSize: 11, color: textSecondary }}>{link.desc}</div>
                      </div>
                      <span style={{ marginLeft: 'auto', color: textSecondary }}>›</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </>
        )}

        {/* ===== STUDENT MARKETPLACE ===== */}
        {activeSection === 'marketplace' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: text, margin: 0 }}>
                  🤝 Student Marketplace
                </h2>
                <p style={{ fontSize: 13, color: textSecondary, margin: '4px 0 0' }}>
                  Buy and sell with fellow students on campus
                </p>
              </div>
              <button
                onClick={() => setShowMarketModal(true)}
                style={{
                  background: '#16a34a', color: 'white', border: 'none',
                  borderRadius: 8, padding: '10px 18px', cursor: 'pointer',
                  fontWeight: 700, fontSize: 13,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                🥬 Order Groceries Instead
              </button>
            </div>

            {/* Categories */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {[
                { icon: '📚', label: 'Textbooks' },
                { icon: '💻', label: 'Electronics' },
                { icon: '👕', label: 'Clothing' },
                { icon: '🛋️', label: 'Furniture' },
                { icon: '🎮', label: 'Games' },
                { icon: '📱', label: 'Phones' },
                { icon: '🔧', label: 'Services' },
                { icon: '🎒', label: 'Bags' },
              ].map(cat => (
                <button key={cat.label} style={{
                  padding: '6px 14px', borderRadius: 999,
                  border: `1px solid ${border}`, background: bgCard,
                  cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 6,
                  color: text,
                }}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            {/* Coming soon state */}
            <div style={{
              background: bgCard, borderRadius: 16,
              padding: '60px 24px', textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: `1px solid ${border}`,
            }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🤝</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: text, marginBottom: 8 }}>
                Student Marketplace Coming Soon
              </h3>
              <p style={{ fontSize: 14, color: textSecondary, maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.7 }}>
                Buy and sell textbooks, electronics, clothes and more with fellow students. Post your items and connect with buyers on campus.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="https://gotomart.netlify.app/" target="_blank" rel="noopener noreferrer">
                  <button style={{
                    background: '#16a34a', color: 'white', border: 'none',
                    borderRadius: 10, padding: '12px 24px', cursor: 'pointer',
                    fontWeight: 700, fontSize: 14,
                  }}>
                    🥬 Order Groceries via Go To Market →
                  </button>
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}