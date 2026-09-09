'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { getAuthToken } from './utils/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

interface User {
  name: string
  role: string
  faculty: string
  department: string
  level: string | null
}

interface Announcement {
  _id: string
  title: string
  content: string
  faculty: string
  createdAt: string
}

// Plays a looping muted preview clip only while it's actually on screen
// (saves data/battery when scrolled away), and falls back to a plain
// poster image if the visitor has "reduce motion" turned on.
function FeatureVideoThumb({ src, poster, icon, badgeColor }: {
  src: string
  poster?: string
  icon: string
  badgeColor: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (reducedMotion || !videoRef.current) return
    const el = videoRef.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {})
        else el.pause()
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [reducedMotion])

  return (
    <div style={{
      position: 'relative',
      height: 140,
      margin: '-26px -26px 16px',
      overflow: 'hidden',
      borderRadius: '14px 14px 0 0',
      background: '#0e2317',
    }}>
      {reducedMotion ? (
        poster ? (
          <img src={poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%', background: badgeColor + '22',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
          }}>
            {icon}
          </div>
        )
      ) : (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="none"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)',
      }} />
      <div style={{
        position: 'absolute', top: 10, left: 10,
        width: 30, height: 30, borderRadius: 8,
        background: badgeColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      }}>
        {icon}
      </div>
    </div>
  )
}

interface ShowcasePost {
  _id: string
  title: string
  description?: string
  faculty?: string
  department?: string
  tag?: string
  thumbnail?: string
  embedUrl?: string
  videoUrl?: string
  views?: number
  isPinned?: boolean
  postedByName?: string
  createdAt: string
}

// Animated enrollment/faculty counters. Starts from a static fallback
// (`targets`) and swaps in real numbers from the backend if that fetch
// resolves before the counter animation starts.
function StatsBar() {
  const [counts, setCounts] = useState({ students: 0, departments: 0, faculties: 0, lecturers: 0 })
  const [animated, setAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const targetsRef = useRef({ students: 500, departments: 10, faculties: 5, lecturers: 50 })

  useEffect(() => {
    // Fetch real counts from backend
    fetch(`${API_BASE}/api/users/stats`)
      .then(res => {
        if (!res.ok) throw new Error(`Stats request failed: ${res.status}`)
        return res.json()
      })
      .then(data => {
        if (data && typeof data.students === 'number') {
          targetsRef.current = { ...targetsRef.current, ...data }
        }
      })
      .catch(err => console.error(err))

    // Intersection observer — animate when visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated) {
          setAnimated(true)
          animateNumbers()
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const animateNumbers = () => {
    const duration = 2000
    const steps = 60
    const interval = duration / steps
    const targets = targetsRef.current

    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)

      setCounts({
        students: Math.round(targets.students * eased),
        departments: Math.round(targets.departments * eased),
        faculties: Math.round(targets.faculties * eased),
        lecturers: Math.round(targets.lecturers * eased),
      })

      if (step >= steps) clearInterval(timer)
    }, interval)
  }

  const stats = [
    { value: counts.students, suffix: '+', label: 'Students Enrolled', icon: '🎓' },
    { value: counts.lecturers, suffix: '+', label: 'Expert Lecturers', icon: '👨‍🏫' },
    { value: counts.departments, suffix: '', label: 'Departments', icon: '🏛️' },
    { value: counts.faculties, suffix: '', label: 'Faculties', icon: '🎯' },
  ]

  return (
    <div ref={ref} style={{
      background: 'white',
      borderTop: '1px solid #f3f4f6',
      borderBottom: '1px solid #f3f4f6',
      padding: '40px 24px',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 0,
        }}>
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              style={{
                textAlign: 'center',
                padding: '16px 24px',
                borderRight: i < stats.length - 1 ? '1px solid #f3f4f6' : 'none',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>{stat.icon}</div>
              <div style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 900,
                color: '#052e16',
                lineHeight: 1,
                marginBottom: 4,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {stat.value.toLocaleString()}{stat.suffix}
              </div>
              <div style={{
                fontSize: 13,
                color: '#6b7280',
                fontWeight: 500,
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div style={{
          textAlign: 'center',
          marginTop: 28,
          paddingTop: 24,
          borderTop: '1px solid #f3f4f6',
        }}>
          <p style={{
            fontSize: 15,
            color: '#374151',
            fontStyle: 'italic',
            margin: 0,
          }}>
            "Empowering the next generation of leaders, innovators and problem-solvers."
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 10,
          }}>
            <div style={{ width: 32, height: 2, background: '#16a34a', borderRadius: 999 }} />
            <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>ESTABLISHED 2026</span>
            <div style={{ width: 32, height: 2, background: '#16a34a', borderRadius: 999 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Value-proposition section for logged-out visitors. Was previously
// (incorrectly) declared as a function statement in the middle of Home()'s
// JSX return — that doesn't compile. Moved out to a standalone component,
// same as FeatureVideoThumb/StatsBar/ShowcaseSection above.
function WhyUniWeb() {
  return (
    <div style={{
      background: '#f8fafc',
      padding: '64px 24px',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ width: 40, height: 2, background: '#d4a86a', margin: '0 auto 14px' }} />
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: 800,
            color: '#0e2317',
            marginBottom: 12,
            lineHeight: 1.2,
          }}>
            Why Choose UniWeb?
          </h2>
          <p style={{
            fontSize: 16, color: '#6b7280',
            maxWidth: 440, margin: '0 auto', lineHeight: 1.6,
          }}>
            More than a university platform — a complete academic ecosystem.
          </p>
        </div>

        {/* Three cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
        }}>
          {[
            {
              icon: '🎓',
              title: 'World-class Learning',
              desc: 'Live classes, lesson notes, coding sandboxes and quizzes — all in one place. Your child learns with the best tools available today.',
              color: '#16a34a',
              bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
              border: '#bbf7d0',
            },
            {
              icon: '💬',
              title: 'Always Connected',
              desc: 'Real-time chat between students and lecturers. Announcements reach every student instantly. No one is ever left behind.',
              color: '#2563eb',
              bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
              border: '#bfdbfe',
            },
            {
              icon: '🚀',
              title: 'Real Opportunities',
              desc: 'Our campus showcase is visible to the world. Talented students get noticed. The right opportunity finds them here.',
              color: '#7c3aed',
              bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
              border: '#ddd6fe',
            },
          ].map(card => (
            <div
              key={card.title}
              style={{
                background: card.bg,
                border: `1px solid ${card.border}`,
                borderRadius: 16,
                padding: '28px 24px',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, marginBottom: 16,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}>
                {card.icon}
              </div>
              <h3 style={{
                fontSize: 17, fontWeight: 800,
                color: '#0e2317', marginBottom: 10,
              }}>
                {card.title}
              </h3>
              <p style={{
                fontSize: 14, color: '#4b5563',
                lineHeight: 1.7, margin: 0,
              }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom quote */}
        <div style={{
          marginTop: 48, textAlign: 'center',
          padding: '24px 32px',
          background: 'white',
          borderRadius: 14,
          border: '1px solid #f3f4f6',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        }}>
          <p style={{
            fontSize: 17, fontStyle: 'italic',
            color: '#1f2937', margin: '0 0 8px',
            lineHeight: 1.6,
          }}>
            "Your child's future starts with the right environment. UniWeb provides exactly that — a modern, connected and inspiring academic home."
          </p>
          <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>
            — UniWeb Academic Platform
          </span>
        </div>

      </div>
    </div>
  )
}

// Campus showcase grid: pulls short video posts from the /api/showcase
// endpoint and lets visitors filter by faculty/tag and preview inline.
function ShowcaseSection({ token }: { token: string | null }) {
  const [posts, setPosts] = useState<ShowcasePost[]>([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [faculties, setFaculties] = useState<string[]>([])

  useEffect(() => {
    fetch(`${API_BASE}/api/showcase`)
      .then(res => {
        if (!res.ok) throw new Error(`Showcase request failed: ${res.status}`)
        return res.json()
      })
      .then(data => {
        if (Array.isArray(data)) {
          setPosts(data)
          const uniqueFaculties = [...new Set(data.map((p: ShowcasePost) => p.faculty).filter(Boolean))] as string[]
          setFaculties(uniqueFaculties)
        }
      })
      .catch(err => console.error(err))
  }, [])

  const filtered = activeFilter === 'all'
    ? posts
    : posts.filter(p => p.faculty === activeFilter || p.tag === activeFilter)

  if (posts.length === 0) return null

  return (
    <div style={{ background: '#f8fafc', padding: '60px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 999, padding: '4px 16px', marginBottom: 12,
            fontSize: 13, color: '#16a34a', fontWeight: 600,
          }}>
            🎬 Campus Showcase
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1f2937', marginBottom: 8 }}>
            See What's Happening at Our Campus
          </h2>
          <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 500, margin: '0 auto' }}>
            Real moments from our students, lecturers and departments.
          </p>
        </div>

        {/* Filter tabs */}
        {faculties.length > 0 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
            {['all', ...faculties].map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  padding: '6px 18px', borderRadius: 999, border: 'none',
                  background: activeFilter === f ? '#16a34a' : 'white',
                  color: activeFilter === f ? 'white' : '#374151',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  textTransform: f === 'all' ? 'capitalize' : 'none',
                }}
              >
                {f === 'all' ? '🌍 All' : f}
              </button>
            ))}
          </div>
        )}

        {/* Video grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {filtered.map(post => (
            <div
              key={post._id}
              style={{
                background: 'white', borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              {/* Video/Thumbnail */}
              <div style={{ position: 'relative', aspectRatio: '16/9', background: '#1a1a2e', cursor: 'pointer' }}
                onClick={() => setPlayingId(playingId === post._id ? null : post._id)}
              >
                {playingId === post._id && post.embedUrl ? (
                  <iframe
                    src={post.embedUrl}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    {post.thumbnail ? (
                      <img
                        src={post.thumbnail}
                        alt={post.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(135deg, #052e16, #16a34a)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 48,
                      }}>
                        🎬
                      </div>
                    )}
                    {/* Play button overlay */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(0,0,0,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.2s',
                    }}>
                      <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.95)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22,
                      }}>
                        ▶
                      </div>
                    </div>
                    {/* Pinned badge */}
                    {post.isPinned && (
                      <div style={{
                        position: 'absolute', top: 10, left: 10,
                        background: '#16a34a', color: 'white',
                        borderRadius: 6, padding: '3px 8px',
                        fontSize: 11, fontWeight: 700,
                      }}>
                        📌 Featured
                      </div>
                    )}
                    {/* Views */}
                    <div style={{
                      position: 'absolute', bottom: 10, right: 10,
                      background: 'rgba(0,0,0,0.6)', color: 'white',
                      borderRadius: 6, padding: '3px 8px', fontSize: 11,
                    }}>
                      👁 {post.views || 0}
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: '16px 18px' }}>
                {/* Tags */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                  {post.faculty && (
                    <span style={{
                      background: '#f0fdf4', color: '#16a34a',
                      padding: '2px 8px', borderRadius: 999,
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {post.faculty}
                    </span>
                  )}
                  {post.department && (
                    <span style={{
                      background: '#eff6ff', color: '#2563eb',
                      padding: '2px 8px', borderRadius: 999,
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {post.department}
                    </span>
                  )}
                  {post.tag && (
                    <span style={{
                      background: '#f5f3ff', color: '#7c3aed',
                      padding: '2px 8px', borderRadius: 999,
                      fontSize: 11, fontWeight: 600,
                    }}>
                      #{post.tag}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1f2937', marginBottom: 6, lineHeight: 1.4 }}>
                  {post.title}
                </h3>

                {post.description && (
                  <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: 12 }}>
                    {post.description.length > 80 ? post.description.slice(0, 80) + '...' : post.description}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>
                    By {post.postedByName} •{' '}
                    {new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  {post.videoUrl && (
                    <a
                      href={post.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#052e16', color: '#4ade80',
                        padding: '6px 14px', borderRadius: 8,
                        fontSize: 12, fontWeight: 700, textDecoration: 'none',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      Watch Full ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA for visitors */}
        {!token && (
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 16 }}>
              Want to be part of this community?
            </p>
            <a href="/register">
              <button style={{
                background: '#16a34a', color: 'white',
                border: 'none', borderRadius: 10,
                padding: '12px 32px', fontSize: 15, fontWeight: 700,
                cursor: 'pointer',
              }}>
                Join UniWeb Today →
              </button>
            </a>
          </div>
        )}

      </div>
    </div>
  )
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')

    const token = getAuthToken()
    if (!token) { setLoading(false); return }

    const setup = async () => {
      try {
        const userRes = await fetch(`${API_BASE}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!userRes.ok) { setLoading(false); return }
        const userData = await userRes.json()
        setUser(userData)

        const annRes = await fetch(`${API_BASE}/api/announcements`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (annRes.ok) {
          const annData = await annRes.json()
          setAnnouncements(Array.isArray(annData) ? annData.slice(0, 3) : [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    setup()
  }, [])

  const formatDate = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <p style={{ color: '#4b5563' }}>Loading...</p>
    </div>
  )

  const tickerItems = [
    '💬  Real-time chat across every department',
    '📡  Live classes, hosted instantly by lecturers',
    '📢  Announcements, filtered to your level',
    '🎓  Automatic promotion, every session',
  ]

  const token = getAuthToken()

  return (
    <div style={{ background: '#f6f8f7', minHeight: 'calc(100vh - 60px)' }}>

      {/* ===== GLOBAL: fonts + keyframes for this page ===== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap');

        .uw-serif { font-family: 'Fraunces', Georgia, serif; }
        .uw-mono  { font-family: 'JetBrains Mono', ui-monospace, monospace; letter-spacing: 0.06em; }
        .uw-body  { font-family: 'Inter', -apple-system, sans-serif; }

        @keyframes uw-float-a {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(24px, -28px); }
        }
        @keyframes uw-float-b {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-18px, 22px); }
        }
        @keyframes uw-pulse {
          0% { box-shadow: 0 0 0 0 rgba(74,222,128,0.55); }
          70% { box-shadow: 0 0 0 9px rgba(74,222,128,0); }
          100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
        }
        @keyframes uw-pulse-teal {
          0% { box-shadow: 0 0 0 0 rgba(45,212,191,0.55); }
          70% { box-shadow: 0 0 0 8px rgba(45,212,191,0); }
          100% { box-shadow: 0 0 0 0 rgba(45,212,191,0); }
        }
        @keyframes uw-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .uw-ticker-track {
          animation: uw-marquee 26s linear infinite;
        }
        .uw-ticker-wrap:hover .uw-ticker-track {
          animation-play-state: paused;
        }
        .uw-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .uw-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(11,35,23,0.10);
          border-color: rgba(21,128,61,0.35) !important;
        }
        .uw-btn-primary {
          transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;
        }
        .uw-btn-primary:hover {
          transform: translateY(-1px);
          filter: brightness(1.05);
          box-shadow: 0 10px 24px rgba(34,197,94,0.35);
        }
        .uw-btn-ghost {
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .uw-btn-ghost:hover {
          background: rgba(255,255,255,0.10);
          border-color: rgba(212,168,106,0.6) !important;
        }
      `}</style>

      {/* ===== HERO SECTION ===== */}
      <div style={{
        position: 'relative',
        minHeight: 560,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        background: '#04160d',
      }}>

        {/* Background university photo */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/uniweb.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          zIndex: 0,
        }} />

        {/* Tonal wash — lighter at top so the photo breathes, deep forest pooling at the bottom */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(4,22,13,0.55) 0%, rgba(4,22,13,0.72) 45%, rgba(4,22,13,0.94) 82%, #04160d 100%)',
          zIndex: 1,
        }} />

        {/* Film grain for tactile, premium texture */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          opacity: 0.05,
          mixBlendMode: 'overlay',
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }} />

        {/* Ambient glow orbs — slow float, adds quiet motion without noise */}
        <div style={{
          position: 'absolute',
          right: -120, top: -100,
          width: 420, height: 420,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(74,222,128,0.16) 0%, rgba(74,222,128,0) 70%)',
          filter: 'blur(10px)',
          zIndex: 1,
          animation: 'uw-float-a 11s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          left: -80, bottom: -60,
          width: 320, height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,168,106,0.14) 0%, rgba(212,168,106,0) 70%)',
          filter: 'blur(10px)',
          zIndex: 1,
          animation: 'uw-float-b 13s ease-in-out infinite',
        }} />

        {/* Hairline ring, faint — collegiate seal echo, not a template circle-decoration */}
        <div style={{
          position: 'absolute',
          right: -70, top: -70,
          width: 340, height: 340,
          borderRadius: '50%',
          border: '1px solid rgba(212,168,106,0.14)',
          zIndex: 1,
        }} />

        {/* Content */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 980,
          margin: '0 auto',
          padding: '64px 24px 0',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ maxWidth: 620 }}>

            {/* Eyebrow: gold hairline + mono badge */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ width: 34, height: 2, background: '#d4a86a', marginBottom: 12 }} />
              {user ? (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 9,
                  background: 'rgba(74,222,128,0.10)',
                  border: '1px solid rgba(74,222,128,0.28)',
                  borderRadius: 999, padding: '6px 16px',
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', animation: 'uw-pulse 2s ease-out infinite' }} />
                  <span className="uw-mono" style={{ color: '#86efac', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
                    {greeting}, {user.role === 'admin' ? 'Super Admin' : user.role === 'faculty_admin' ? 'Faculty Admin' : user.role === 'department_admin' ? 'Dept Admin' : user.role === 'lecturer' ? 'Lecturer' : `Student · ${user.level}`}
                  </span>
                </div>
              ) : (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 9,
                  background: 'rgba(212,168,106,0.10)',
                  border: '1px solid rgba(212,168,106,0.30)',
                  borderRadius: 999, padding: '6px 16px',
                }}>
                  <span className="uw-mono" style={{ color: '#e6c98a', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
                    🎓 Academic Platform
                  </span>
                </div>
              )}
            </div>

            {/* Main heading — serif, with a gold underline swash on the accent word */}
            <h1 className="uw-serif" style={{
              fontSize: 'clamp(34px, 5vw, 56px)',
              fontWeight: 600,
              color: 'white',
              lineHeight: 1.08,
              marginBottom: 22,
              letterSpacing: '-0.01em',
            }}>
              {user ? (
                <>Welcome to{' '}
                  <span style={{ position: 'relative', display: 'inline-block' }}>
                    <span style={{ color: '#7ee2a8' }}>UniWeb</span>
                    <svg viewBox="0 0 140 12" style={{ position: 'absolute', left: 0, bottom: -8, width: '100%', height: 10 }} preserveAspectRatio="none">
                      <path d="M2 8 C 35 2, 105 2, 138 8" stroke="#d4a86a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    </svg>
                  </span>
                </>
              ) : (
                <>The Smart{' '}
                  <span style={{ position: 'relative', display: 'inline-block' }}>
                    <span style={{ color: '#7ee2a8' }}>Academic</span>
                    <svg viewBox="0 0 220 12" style={{ position: 'absolute', left: 0, bottom: -8, width: '100%', height: 10 }} preserveAspectRatio="none">
                      <path d="M2 8 C 55 2, 165 2, 218 8" stroke="#d4a86a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    </svg>
                  </span>{' '}Platform
                </>
              )}
            </h1>

            <p className="uw-body" style={{
              color: 'rgba(255,255,255,0.72)',
              fontSize: 17, lineHeight: 1.7, marginBottom: 34, maxWidth: 480,
            }}>
              {user
                ? 'Your all-in-one academic platform to connect, teach, learn, and stay informed.'
                : 'Connect students, lecturers, and administrators through real-time chat, live classes, and smart announcements.'}
            </p>

            {/* Feature highlights — logged in only */}
            {user && (
              <div style={{ display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
                {[
                  { icon: '💬', label: 'Real-time Communication', sub: 'Chat with students & staff' },
                  { icon: '📡', label: 'Live & Interactive Classes', sub: 'Engage anywhere, anytime' },
                  { icon: '📢', label: 'Stay Informed', sub: 'Announcements & updates' },
                ].map(f => (
                  <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: 'rgba(74,222,128,0.12)',
                      border: '1px solid rgba(74,222,128,0.28)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, flexShrink: 0,
                    }}>
                      {f.icon}
                    </div>
                    <div>
                      <div className="uw-body" style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{f.label}</div>
                      <div className="uw-body" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{f.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quote card — logged in only */}
            {user && (
              <div style={{
                background: 'rgba(0,0,0,0.28)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(212,168,106,0.22)',
                borderTop: '2px solid rgba(212,168,106,0.55)',
                borderRadius: 10, padding: '16px 20px',
                maxWidth: 360, marginBottom: 30,
              }}>
                <p className="uw-serif" style={{ color: 'rgba(255,255,255,0.88)', fontSize: 14, fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                  "Education is the most powerful weapon which you can use to change the world."
                </p>
                <p className="uw-mono" style={{ color: '#d4a86a', fontSize: 11, marginTop: 10, fontWeight: 600 }}>— NELSON MANDELA</p>
              </div>
            )}

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
              {user ? (
                <>
                  <a href="/dashboard">
                    <button className="uw-btn-primary uw-body" style={{
                      background: 'linear-gradient(135deg, #4ade80 0%, #16a34a 100%)',
                      color: '#052e16',
                      fontWeight: 700, fontSize: 14,
                      padding: '13px 28px', borderRadius: 8, border: 'none',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                      boxShadow: '0 6px 18px rgba(34,197,94,0.28)',
                    }}>
                      Go to Dashboard →
                    </button>
                  </a>
                  <a href="/live">
                    <button className="uw-btn-ghost uw-body" style={{
                      background: 'rgba(255,255,255,0.04)', color: 'white',
                      fontWeight: 600, fontSize: 14,
                      padding: '13px 24px', borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.3)',
                      cursor: 'pointer', backdropFilter: 'blur(4px)',
                    }}>
                      ▶ Explore UniWeb →
                    </button>
                  </a>
                </>
              ) : (
                <>
                  <a href="/register">
                    <button className="uw-btn-primary uw-body" style={{
                      background: 'linear-gradient(135deg, #4ade80 0%, #16a34a 100%)',
                      color: '#052e16',
                      fontWeight: 700, fontSize: 14,
                      padding: '13px 28px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      boxShadow: '0 6px 18px rgba(34,197,94,0.28)',
                    }}>
                      Get Started →
                    </button>
                  </a>
                  <a href="/login">
                    <button className="uw-btn-ghost uw-body" style={{
                      background: 'rgba(255,255,255,0.04)', color: 'white',
                      fontWeight: 600, fontSize: 14,
                      padding: '13px 24px', borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.3)',
                      cursor: 'pointer', backdropFilter: 'blur(4px)',
                    }}>
                      Login
                    </button>
                  </a>
                </>
              )}
            </div>
          </div>

          {/* ===== SIGNATURE ELEMENT: live ticker strip ===== */}
          <div className="uw-ticker-wrap" style={{
            marginTop: 'auto',
            borderTop: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(0,0,0,0.22)',
            backdropFilter: 'blur(6px)',
            padding: '13px 0',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, zIndex: 1,
              background: 'linear-gradient(90deg, rgba(4,22,13,0.9), rgba(4,22,13,0))',
            }} />
            <div style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, zIndex: 1,
              background: 'linear-gradient(270deg, rgba(4,22,13,0.9), rgba(4,22,13,0))',
            }} />
            <div style={{ display: 'flex', width: 'max-content' }} className="uw-ticker-track">
              {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
                <div key={i} className="uw-body" style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  color: 'rgba(255,255,255,0.68)', fontSize: 13,
                  padding: '0 28px', whiteSpace: 'nowrap',
                  borderRight: '1px solid rgba(255,255,255,0.10)',
                }}>
                  {i % tickerItems.length === 0 && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2dd4bf', animation: 'uw-pulse-teal 2s ease-out infinite', flexShrink: 0 }} />
                  )}
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ===== STATS BAR — logged-out position (right after hero) ===== */}
      {!user && <StatsBar />}

      {/* ===== WHY UNIWEB — logged out only ===== */}
      {!user && <WhyUniWeb />}

      {/* ===== QUICK ACCESS (logged in only) ===== */}
      {user && (
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px 0' }}>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}>
            <h2 className="uw-serif" style={{ fontSize: 19, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: '#0e2317' }}>
              ⚡ Quick Access
            </h2>
            <span className="uw-mono" style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase' }}>Shortcuts</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 40,
          }}>
            {[
              {
                icon: '💬',
                title: 'Chat',
                desc: 'Talk to your faculty and students',
                href: '/chat',
                color: '#16a34a',
                bg: '#f0fdf4',
              },
              {
                icon: '📡',
                title: 'Live Classes',
                desc: 'Start or join a live session',
                href: '/live',
                color: '#2563eb',
                bg: '#eff6ff',
              },
              {
                icon: '📢',
                title: 'Announcements',
                desc: 'Stay updated with latest news',
                href: '/announcements',
                color: '#b8862f',
                bg: '#fbf3e3',
              },
              ...(user.role === 'admin' ? [{
                icon: '⚙️',
                title: 'Admin Panel',
                desc: 'Manage the entire platform',
                href: '/admin',
                color: '#dc2626',
                bg: '#fef2f2',
              }] : []),
              ...(user.role === 'faculty_admin' ? [{
                icon: '🛡️',
                title: 'Faculty Panel',
                desc: 'Manage your faculty',
                href: '/faculty-admin',
                color: '#7c3aed',
                bg: '#f5f3ff',
              }] : []),
            ].map(card => (
              <Link key={card.href} href={card.href} style={{ textDecoration: 'none' }}>
                <div className="uw-card" style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 20,
                  border: '1px solid #f3f4f6',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: card.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    flexShrink: 0,
                  }}>
                    {card.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="uw-body" style={{ fontWeight: 700, fontSize: 14, color: '#1f2937', marginBottom: 2 }}>
                      {card.title}
                    </div>
                    <div className="uw-body" style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>
                      {card.desc}
                    </div>
                  </div>
                  <span style={{ color: '#9ca3af', fontSize: 16 }}>›</span>
                </div>
              </Link>
            ))}
          </div>

          {/* ===== STATS BAR — logged-in position (right after Quick Access) ===== */}
          <StatsBar />

          {/* ===== LATEST ANNOUNCEMENTS ===== */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: announcements.length > 0 ? '1fr 1fr' : '1fr',
            gap: 24,
            marginBottom: 40,
            marginTop: 40,
          }}>

            {/* Announcements */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <h2 className="uw-serif" style={{ fontSize: 16, fontWeight: 600, color: '#0e2317' }}>📢 Latest Announcements</h2>
                <Link href="/announcements" style={{ fontSize: 13, color: '#16a34a' }}>
                  View all →
                </Link>
              </div>

              {announcements.length === 0 ? (
                <div style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 32,
                  textAlign: 'center',
                  border: '1px solid #f3f4f6',
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📢</div>
                  <p style={{ color: '#9ca3af', fontSize: 14 }}>No announcements yet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {announcements.map(ann => (
                    <div
                      key={ann._id}
                      style={{
                        background: 'white',
                        borderRadius: 12,
                        padding: 16,
                        border: '1px solid #f3f4f6',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: '#f0fdf4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        flexShrink: 0,
                      }}>
                        📢
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 4,
                        }}>
                          <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                            General
                          </span>
                          <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                            {formatDate(ann.createdAt)}
                          </span>
                        </div>
                        <p style={{ fontWeight: 600, fontSize: 13, color: '#1f2937', marginBottom: 4 }}>
                          {ann.title}
                        </p>
                        <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                          {ann.content.length > 80 ? ann.content.slice(0, 80) + '...' : ann.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Schedule placeholder */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <h2 className="uw-serif" style={{ fontSize: 16, fontWeight: 600, color: '#0e2317' }}>📅 Upcoming Schedule</h2>
                <span style={{ fontSize: 13, color: '#9ca3af' }}>View calendar →</span>
              </div>
              <div style={{
                background: 'white',
                borderRadius: 12,
                padding: 32,
                textAlign: 'center',
                border: '1px solid #f3f4f6',
                height: 'calc(100% - 40px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: '#f9fafb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  marginBottom: 12,
                }}>
                  📅
                </div>
                <p style={{ fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>No upcoming events</p>
                <p style={{ fontSize: 13, color: '#9ca3af' }}>Schedule and events will appear here.</p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ===== FEATURES (logged out only) ===== */}
      {!user && (
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '72px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="uw-mono" style={{ fontSize: 11, color: '#b8862f', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              What's inside
            </span>
            <h2 className="uw-serif" style={{ marginTop: 10, marginBottom: 10, fontSize: 32, fontWeight: 600, color: '#0e2317' }}>
              Everything your campus needs
            </h2>
            <p className="uw-body" style={{ color: '#4b5563', fontSize: 16 }}>
              Built around your faculty, department, and level.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}>
            {[
              { icon: '💬', title: 'Real-time Chat', desc: 'Scoped chat rooms for your department and level.', bg: '#f0fdf4', color: '#15803d', video: '/videos/realtime.mp4' },
              { icon: '📡', title: 'Live Classes', desc: 'Lecturers start live sessions instantly.', bg: '#fbf3e3', color: '#b8862f', video: '/videos/liveclass.mp4' },
              { icon: '📢', title: 'Announcements', desc: 'Filtered by faculty, department, and level.', bg: '#f0fdf4', color: '#15803d', video: '/videos/annous.mp4'},
              { icon: '🎥', title: 'Video Streaming', desc: 'WebRTC-powered peer-to-peer video.', bg: '#effcf6', color: '#0d9488', video: '/videos/stream.mp4' },
              { icon: '🎓', title: 'Academic System', desc: 'Automatic student promotion each year.', bg: '#fbf3e3', color: '#b8862f', video: '/videos/gcu.mp4' },
              { icon: '👥', title: 'Role-based Access', desc: 'Students, lecturers, and admins each see what they need.', bg: '#effcf6', color: '#0d9488', video: '/videos/rac.mp4' },
            ].map(f => (
              <div key={f.title} className="uw-card" style={{
                padding: 26,
                background: 'white',
                borderRadius: 14,
                border: '1px solid #eef1ee',
                boxShadow: '0 1px 3px rgba(11,35,23,0.04)',
                overflow: 'hidden',
              }}>
                {f.video ? (
                  <FeatureVideoThumb src={f.video} icon={f.icon} badgeColor={f.color} />
                ) : (
                  <div style={{
                    width: 46, height: 46, borderRadius: 11,
                    background: f.bg, color: f.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, marginBottom: 16,
                  }}>
                    {f.icon}
                  </div>
                )}
                <h3 className="uw-serif" style={{ marginBottom: 8, fontSize: 17, fontWeight: 600, color: '#0e2317' }}>{f.title}</h3>
                <p className="uw-body" style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== CAMPUS SHOWCASE — shown for both logged in and logged out ===== */}
      <ShowcaseSection token={token} />

      {/* ===== BOTTOM CTA (logged out only) ===== */}
      {!user && (
        <div style={{
          position: 'relative',
          background: '#04160d',
          padding: '64px 24px',
          textAlign: 'center',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.06, mixBlendMode: 'overlay',
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }} />
          <div style={{
            position: 'absolute', left: '50%', top: -140, transform: 'translateX(-50%)',
            width: 480, height: 480, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(74,222,128,0.14) 0%, rgba(74,222,128,0) 70%)',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ width: 34, height: 2, background: '#d4a86a', margin: '0 auto 18px' }} />
            <h2 className="uw-serif" style={{ color: 'white', marginBottom: 10, fontSize: 28, fontWeight: 600 }}>
              Everything your campus needs
            </h2>
            <p className="uw-body" style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 28, fontSize: 15 }}>
              One platform. Unlimited possibilities.
            </p>
            <Link href="/register">
              <button className="uw-btn-primary uw-body" style={{
                background: 'linear-gradient(135deg, #4ade80 0%, #16a34a 100%)',
                color: '#052e16',
                fontWeight: 700,
                fontSize: 15,
                padding: '13px 32px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 6px 18px rgba(34,197,94,0.3)',
              }}>
                Explore UniWeb →
              </button>
            </Link>
          </div>
        </div>
      )}


      {/* ===== FOOTER ===== */}
      <footer className="uw-body" style={{
        borderTop: '1px solid #e5e7eb',
        padding: '24px',
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: 13,
        background: 'white',
      }}>
        © {new Date().getFullYear()} UniWeb — Academic Platform. Built for academic excellence.
      </footer>

    </div>
  )
}
