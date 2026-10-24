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

// ===== STYLES (one block; responsive; keyboard focus; reduced motion) =====
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
.uw{--deep:#04160d;--forest:#0a2a1c;--leaf:#16a34a;--mint:#7ee2a8;--gold:#d4a86a;--paper:#f3f6f4;--ink:#0e2317;--mut:#56665d;--line:#dfe6e1;background:var(--paper);color:var(--ink);font-family:'Inter',-apple-system,sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased;min-height:calc(100vh - 60px)}
.uw *{box-sizing:border-box}
.uw a{color:inherit;text-decoration:none}
.uw button{font-family:inherit;cursor:pointer}
.uw :focus-visible{outline:3px solid var(--gold);outline-offset:3px;border-radius:6px}
.uw h1,.uw h2,.uw h3,.uw h4,.uw p{margin:0}
.serif{font-family:'Fraunces',Georgia,serif}
.wrap{max-width:1100px;margin:0 auto;padding:0 24px}
.sec{padding:72px 0}
.sec-dark{background:var(--deep);color:#fff}
.sec-white{background:#fff}

/* buttons */
.btn{display:inline-flex;align-items:center;gap:8px;border:0;border-radius:10px;padding:13px 26px;font-size:15px;font-weight:700;transition:transform .15s,box-shadow .2s,background .2s}
.btn-p{background:linear-gradient(135deg,#4ade80,#16a34a);color:#052e16;box-shadow:0 8px 20px rgba(22,163,74,.28)}
.btn-p:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(22,163,74,.38)}
.btn-g{background:rgba(255,255,255,.06);color:#fff;border:1px solid rgba(255,255,255,.3)}
.btn-g:hover{background:rgba(255,255,255,.14);border-color:var(--gold)}
.btn-l{background:#fff;color:var(--ink);border:1px solid var(--line)}
.btn-l:hover{border-color:var(--leaf)}

/* headings */
.head{max-width:620px;margin:0 0 40px}
.head.c{margin:0 auto 44px;text-align:center}
.head h2{font-family:'Fraunces',Georgia,serif;font-size:clamp(28px,4vw,40px);font-weight:600;line-height:1.12;letter-spacing:-.01em}
.head p{margin-top:12px;color:var(--mut);font-size:17px;max-width:520px}
.head.c p{margin-left:auto;margin-right:auto}
.dark .head p,.sec-dark .head p{color:rgba(255,255,255,.62)}
.rule{width:44px;height:3px;background:var(--gold);border-radius:3px;margin-bottom:16px}
.head.c .rule{margin-left:auto;margin-right:auto}

/* hero */
.hero{position:relative;overflow:hidden;background:var(--deep);color:#fff}
.hero-bg{position:absolute;inset:0;background:url(/uniweb.png) center top/cover}
.hero-wash{position:absolute;inset:0;background:linear-gradient(100deg,rgba(4,22,13,.96) 8%,rgba(4,22,13,.78) 55%,rgba(4,22,13,.9)),linear-gradient(180deg,transparent 60%,#04160d)}
.hero-in{position:relative;z-index:2;display:grid;grid-template-columns:1.1fr .9fr;gap:48px;align-items:center;padding:84px 24px 72px}
.hero h1{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:clamp(40px,6vw,68px);line-height:1.04;letter-spacing:-.02em;margin:18px 0 20px}
.hero .lead{font-size:18px;color:rgba(255,255,255,.76);max-width:480px;margin-bottom:30px}
.badge{display:inline-flex;align-items:center;gap:9px;border-radius:999px;padding:7px 16px;font-size:13px;font-weight:600;background:rgba(74,222,128,.12);border:1px solid rgba(74,222,128,.3);color:#a7f3c4}
.badge.gold{background:rgba(212,168,106,.12);border-color:rgba(212,168,106,.35);color:#ecd3a1}
.dot{width:8px;height:8px;border-radius:50%;background:#4ade80;animation:pulse 2s ease-out infinite}
.cta-row{display:flex;gap:12px;flex-wrap:wrap}
.hl{display:flex;gap:22px;flex-wrap:wrap;margin-bottom:26px}
.hl div{display:flex;align-items:center;gap:10px}
.hl i{font-style:normal;width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:rgba(74,222,128,.12);border:1px solid rgba(74,222,128,.28)}
.hl b{display:block;font-size:13px}
.hl small{color:rgba(255,255,255,.55);font-size:12px}
.quote{border-left:3px solid var(--gold);padding:4px 0 4px 16px;margin-bottom:28px;max-width:400px;color:rgba(255,255,255,.88)}
.quote p{font-family:'Fraunces',Georgia,serif;font-style:italic;font-size:16px}
.quote span{display:block;margin-top:8px;font-size:13px;font-weight:600;color:var(--gold)}

/* hero noticeboard (the one memorable element) */
.board{position:relative;height:380px}
.note{position:absolute;width:290px;background:#fff;color:var(--ink);border-radius:14px;padding:16px 18px;box-shadow:0 24px 50px rgba(0,0,0,.35);display:flex;gap:14px;align-items:flex-start;border-top:4px solid var(--c)}
.note i{font-style:normal;font-size:22px;width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:color-mix(in srgb,var(--c) 14%,white);flex-shrink:0}
.note b{display:block;font-size:15px}
.note span{font-size:13px;color:var(--mut)}
.note:nth-child(1){top:0;left:0;transform:rotate(-3deg);--c:#16a34a;animation:rise .8s .3s both}
.note:nth-child(2){top:128px;right:0;transform:rotate(2.5deg);--c:#2563eb;animation:rise .8s .5s both}
.note:nth-child(3){top:256px;left:28px;transform:rotate(-1.5deg);--c:#b8862f;animation:rise .8s .7s both}
.hero-in>div:first-child>*{animation:rise .7s both}
.hero-in>div:first-child>*:nth-child(2){animation-delay:.1s}
.hero-in>div:first-child>*:nth-child(3){animation-delay:.2s}
.hero-in>div:first-child>*:nth-child(n+4){animation-delay:.3s}

/* ticker */
.ticker{position:relative;z-index:2;border-top:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.28);padding:13px 0;overflow:hidden}
.ticker-track{display:flex;width:max-content;animation:marquee 28s linear infinite}
.ticker:hover .ticker-track{animation-play-state:paused}
.ticker-item{display:flex;align-items:center;gap:10px;padding:0 28px;white-space:nowrap;font-size:14px;color:rgba(255,255,255,.72);border-right:1px solid rgba(255,255,255,.1)}

/* stats */
.stats{background:#fff;border-bottom:1px solid var(--line)}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr)}
.stat{padding:32px 16px;text-align:center;border-right:1px solid var(--line)}
.stat:last-child{border-right:0}
.stat b{display:block;font-family:'Fraunces',Georgia,serif;font-size:clamp(32px,4.4vw,46px);font-weight:600;line-height:1;font-variant-numeric:tabular-nums;color:var(--forest)}
.stat span{display:block;margin-top:8px;font-size:14px;color:var(--mut)}
.stat i{font-style:normal;font-size:22px;display:block;margin-bottom:8px}
.tagline{text-align:center;padding:22px 24px 30px;font-family:'Fraunces',Georgia,serif;font-style:italic;font-size:17px;color:#2f4a3b}
.tagline small{display:block;margin-top:8px;font-family:'Inter',sans-serif;font-style:normal;font-size:13px;font-weight:600;color:var(--mut)}

/* cards */
.card{background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:0 1px 3px rgba(10,42,28,.05);transition:transform .2s,box-shadow .2s,border-color .2s}
.card.hov:hover{transform:translateY(-4px);box-shadow:0 16px 32px rgba(10,42,28,.12);border-color:rgba(22,163,74,.45)}
.why{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.why .card{padding:28px 24px}
.why i{font-style:normal;font-size:26px;width:54px;height:54px;border-radius:14px;display:grid;place-items:center;margin-bottom:16px;background:var(--bg)}
.why h3{font-family:'Fraunces',Georgia,serif;font-size:21px;font-weight:600;margin-bottom:8px}
.why p{color:var(--mut);font-size:15px}
.big-quote{margin-top:40px;padding:28px 32px;text-align:center}
.big-quote p{font-family:'Fraunces',Georgia,serif;font-style:italic;font-size:19px;max-width:700px;margin:0 auto 10px}
.big-quote span{font-size:14px;font-weight:600;color:var(--mut)}

/* quick access */
.qa-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:18px}
.qa-head h2{font-family:'Fraunces',Georgia,serif;font-size:26px;font-weight:600}
.qa-head span{font-size:14px;color:var(--mut)}
.qa{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}
.qa .card{padding:20px;display:flex;align-items:center;gap:16px;height:100%}
.qa i{font-style:normal;font-size:24px;width:52px;height:52px;border-radius:14px;display:grid;place-items:center;flex-shrink:0}
.qa b{display:block;font-size:16px}
.qa small{color:var(--mut);font-size:13px;line-height:1.4;display:block}
.qa em{margin-left:auto;font-style:normal;font-size:22px;color:#9aa8a0}

/* announcements + schedule */
.split{display:grid;grid-template-columns:1fr 1fr;gap:28px}
.split.one{grid-template-columns:1fr}
.split h2{font-family:'Fraunces',Georgia,serif;font-size:22px;font-weight:600}
.split-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:16px}
.split-top a,.split-top span{font-size:14px;color:var(--leaf);font-weight:600}
.ann{display:flex;gap:14px;padding:16px;margin-bottom:12px;align-items:flex-start}
.ann i{font-style:normal;width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:#eaf8ef;flex-shrink:0}
.ann-top{display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px}
.ann-top b{color:var(--leaf)}
.ann-top span{color:#8a9890;white-space:nowrap}
.ann h4{font-size:15px;margin-bottom:4px}
.ann p{font-size:14px;color:var(--mut)}
.empty{padding:36px 24px;text-align:center;color:var(--mut)}
.empty i{font-style:normal;display:block;font-size:34px;margin-bottom:10px}
.empty b{display:block;color:var(--ink);margin-bottom:4px}

/* features bento */
.bento{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.bento .card{overflow:hidden;display:flex;flex-direction:column}
.bento .s2{grid-column:span 2}
.fvt{position:relative;height:190px;background:#0e2317;overflow:hidden}
.bento .s2 .fvt{height:230px}
.fvt video,.fvt img{width:100%;height:100%;object-fit:cover;display:block}
.fvt .ph{width:100%;height:100%;display:grid;place-items:center;font-size:36px}
.fvt::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,rgba(0,0,0,.4))}
.fvt-badge{position:absolute;z-index:2;top:12px;left:12px;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-size:17px;box-shadow:0 4px 10px rgba(0,0,0,.3)}
.bento-body{padding:20px 22px 24px}
.bento-body h3{font-family:'Fraunces',Georgia,serif;font-size:20px;font-weight:600;margin-bottom:6px}
.bento-body p{color:var(--mut);font-size:15px}

/* post cards (shared by all three showcase views) */
.posts{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:20px}
.pc{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden;transition:transform .2s,box-shadow .2s}
.pc:hover{transform:translateY(-4px);box-shadow:0 16px 32px rgba(10,42,28,.14)}
.pc-media{position:relative;aspect-ratio:16/9;background:#12261b;cursor:pointer}
.pc-media img,.pc-media iframe{width:100%;height:100%;object-fit:cover;border:0;display:block}
.pc-ph{width:100%;height:100%;display:grid;place-items:center;font-size:42px;background:linear-gradient(135deg,color-mix(in srgb,var(--c) 55%,#04160d),#12261b)}
.pc-play{position:absolute;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.28);transition:background .2s}
.pc-media:hover .pc-play{background:rgba(0,0,0,.12)}
.pc-play span{width:54px;height:54px;border-radius:50%;background:rgba(255,255,255,.95);display:grid;place-items:center;color:var(--ink);font-size:18px;padding-left:3px}
.pc-pin{position:absolute;top:10px;left:10px;background:var(--leaf);color:#fff;border-radius:8px;padding:3px 9px;font-size:12px;font-weight:700}
.pc-views{position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,.65);color:#fff;border-radius:8px;padding:3px 9px;font-size:12px}
.pc-body{padding:16px 18px 18px}
.chips{display:flex;gap:6px;flex-wrap:wrap}
.chips:not(:empty){margin-bottom:10px}
.chip{border-radius:999px;padding:2px 10px;font-size:12px;font-weight:600}
.c1{background:#eaf8ef;color:#15803d}.c2{background:#e8f0fe;color:#2563eb}.c3{background:#f1ecfe;color:#7c3aed}
.pc h4{font-size:16px;font-weight:700;line-height:1.35;margin-bottom:6px}
.pc p{font-size:14px;color:var(--mut);margin-bottom:12px}
.pc-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:12px;color:#8a9890}
.pc-foot a{background:var(--forest);color:#86efac;border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;white-space:nowrap}
.pc-foot a:hover{background:var(--leaf);color:#fff}
.pc.dk{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.12);color:#fff}
.pc.dk p{color:#9db0a5}.pc.dk .pc-foot{color:#7e9488}
.pc.dk .pc-foot a{background:var(--c);color:#fff}
.pc.dk .c1{background:rgba(74,222,128,.15);color:#86efac}.pc.dk .c2{background:rgba(96,165,250,.15);color:#93c5fd}.pc.dk .c3{background:rgba(167,139,250,.18);color:#c4b5fd}
.filters{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:32px}
.pill{border:1px solid var(--line);background:#fff;color:#33463b;border-radius:999px;padding:7px 18px;font-size:14px;font-weight:600;transition:background .15s,color .15s}
.pill:hover{border-color:var(--leaf)}
.pill.on{background:var(--leaf);border-color:var(--leaf);color:#fff}
.join{text-align:center;margin-top:48px}
.join p{color:var(--mut);margin-bottom:14px}

/* faculty explorer (dark) */
.fx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px}
.fx-card{text-align:left;color:#fff;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:22px;transition:transform .2s,background .2s,border-color .2s;overflow:hidden}
.fx-card:hover{transform:translateY(-4px);background:rgba(255,255,255,.1);border-color:var(--c,rgba(255,255,255,.35))}
.fx-card i{font-style:normal;font-size:34px;display:block;margin-bottom:12px}
.fx-card h3{font-size:17px;font-weight:700;margin-bottom:6px;line-height:1.3}
.fx-card p{font-size:14px;color:#9db0a5;margin-bottom:12px}
.fx-meta{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#7e9488}
.fx-count{background:var(--c,#16a34a);color:#fff;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:700}
.fx-go{margin-top:14px;font-size:14px;font-weight:600;color:var(--c,#4ade80)}
.fx-card.dept{padding:0;border-color:color-mix(in srgb,var(--c) 40%,transparent)}
.fx-thumb{height:90px;position:relative;overflow:hidden;display:grid;place-items:center;font-size:34px;background:linear-gradient(135deg,color-mix(in srgb,var(--c) 40%,transparent),color-mix(in srgb,var(--c) 12%,transparent))}
.fx-thumb img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.6}
.fx-thumb .fx-count{position:absolute;top:10px;right:10px}
.fx-dept-body{padding:14px 16px 16px}
.fx-dept-body small{display:block;color:var(--c);font-weight:700;font-size:13px;margin-bottom:4px}
.fx-dept-body h4{font-size:15px;font-weight:700}
.crumbs{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:28px;color:#6f857a}
.crumb{background:rgba(255,255,255,.1);border:0;color:#fff;border-radius:8px;padding:7px 14px;font-size:14px}
.crumb:hover{background:rgba(255,255,255,.2)}
.fx-title{font-family:'Fraunces',Georgia,serif;font-size:24px;font-weight:600;color:#fff;margin:0 0 18px}
.fx-sub{font-size:17px;font-weight:700;color:#fff;margin-bottom:14px}
.fx-sep{height:1px;background:rgba(255,255,255,.12);margin:8px 0 28px}
.dept-head{display:flex;align-items:center;gap:18px;border-radius:18px;padding:22px 26px;margin-bottom:28px;border:1px solid color-mix(in srgb,var(--c) 40%,transparent);background:linear-gradient(120deg,color-mix(in srgb,var(--c) 22%,transparent),transparent)}
.dept-head i{font-style:normal;font-size:42px}
.dept-head h3{font-family:'Fraunces',Georgia,serif;font-size:24px;font-weight:600}
.dept-head p{color:#9db0a5;font-size:14px;margin-top:4px}
.dept-head div:last-child{margin-left:auto;text-align:right}
.dept-head b{display:block;font-size:28px;font-family:'Fraunces',Georgia,serif}
.dept-head small{color:#7e9488}
.msg{text-align:center;padding:56px 24px;color:#9db0a5}
.msg i{font-style:normal;font-size:44px;display:block;margin-bottom:10px}
.msg h3{color:#fff;font-size:19px;margin-bottom:6px}

/* final call + footer */
.final{position:relative;overflow:hidden;background:var(--deep);text-align:center;color:#fff;padding:80px 24px}
.final::before{content:'';position:absolute;left:50%;top:-180px;width:520px;height:520px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(circle,rgba(74,222,128,.16),transparent 70%)}
.final>div{position:relative}
.final h2{font-family:'Fraunces',Georgia,serif;font-size:clamp(28px,4vw,40px);font-weight:600;margin-bottom:10px}
.final p{color:rgba(255,255,255,.6);margin-bottom:28px;font-size:17px}
.foot{background:#fff;border-top:1px solid var(--line);padding:24px;text-align:center;color:#8a9890;font-size:14px}
.loading{text-align:center;padding:90px;color:var(--mut)}

@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(74,222,128,.55)}70%{box-shadow:0 0 0 9px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}
@keyframes marquee{to{transform:translateX(-50%)}}
@keyframes rise{from{opacity:0;translate:0 22px}to{opacity:1;translate:0 0}}

@media (max-width:860px){
  .hero-in{grid-template-columns:1fr;padding-top:56px;gap:0}
  .board{display:none}
  .stats-grid{grid-template-columns:repeat(2,1fr)}
  .stat:nth-child(2){border-right:0}
  .stat:nth-child(-n+2){border-bottom:1px solid var(--line)}
  .why,.split,.bento{grid-template-columns:1fr}
  .bento .s2{grid-column:auto}
  .sec{padding:56px 0}
  .dept-head{flex-wrap:wrap}
}
@media (prefers-reduced-motion:reduce){
  .uw *,.uw *::before{animation:none!important;transition:none!important}
}
`

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
    <div className="fvt">
      {reducedMotion ? (
        poster ? (
          <img src={poster} alt="" />
        ) : (
          <div className="ph" style={{ background: badgeColor + '22' }}>{icon}</div>
        )
      ) : (
        <video ref={videoRef} src={src} poster={poster} muted loop playsInline preload="none" />
      )}
      <div className="fvt-badge" style={{ background: badgeColor }}>{icon}</div>
    </div>
  )
}

// One post card used by every showcase view (campus, faculty, department).
function PostCard({ post, playing, onToggle, accent = '#16a34a', dark = false, scope = false }: {
  post: ShowcasePost
  playing: boolean
  onToggle: () => void
  accent?: string
  dark?: boolean
  scope?: boolean
}) {
  return (
    <div className={`pc${dark ? ' dk' : ''}`} style={{ ['--c' as any]: accent }}>
      <div className="pc-media" onClick={onToggle}>
        {playing && post.embedUrl ? (
          <iframe
            src={post.embedUrl}
            title={post.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            {post.thumbnail ? (
              <img
                src={post.thumbnail}
                alt={post.title}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div className="pc-ph">🎬</div>
            )}
            <div className="pc-play"><span>▶</span></div>
            {post.isPinned && <div className="pc-pin">📌 Featured</div>}
            <div className="pc-views">👁 {post.views || 0}</div>
          </>
        )}
      </div>
      <div className="pc-body">
        <div className="chips">
          {scope && post.faculty && <span className="chip c1">{post.faculty}</span>}
          {scope && post.department && <span className="chip c2">{post.department}</span>}
          {post.tag && <span className="chip c3">#{post.tag}</span>}
        </div>
        <h4>{post.title}</h4>
        {post.description && (
          <p>{post.description.length > 80 ? post.description.slice(0, 80) + '...' : post.description}</p>
        )}
        <div className="pc-foot">
          <span>
            {post.postedByName ? `By ${post.postedByName} • ` : ''}
            {new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          {post.videoUrl && (
            <a href={post.videoUrl} target="_blank" rel="noopener noreferrer">Watch ↗</a>
          )}
        </div>
      </div>
    </div>
  )
}

// Faculty → Department → Posts explorer. Visitors drill down from a grid of
// faculties to a grid of departments, then to that department's video posts.
function FacultyShowcaseSection() {
  const [faculties, setFaculties] = useState<any[]>([])
  const [selectedFaculty, setSelectedFaculty] = useState<any>(null)
  const [selectedDept, setSelectedDept] = useState<any>(null)
  const [deptPosts, setDeptPosts] = useState<any[]>([])
  const [facultyPosts, setFacultyPosts] = useState<any[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)

  const LEARNING_TYPE_COLORS: Record<string, string> = {
    language_linguistics: '#a78bfa',
    science_medicine: '#22d3ee',
    arts_performance: '#f472b6',
    agriculture_environment: '#4ade80',
    engineering_technology: '#60a5fa',
    business_economics: '#fbbf24',
    journalism_media: '#f87171',
    law_studies: '#818cf8',
    health_sciences: '#5eead4',
    education_studies: '#60a5fa',
    general_studies: '#4ade80',
  }

  const LEARNING_TYPE_ICONS: Record<string, string> = {
    language_linguistics: '🗣️',
    science_medicine: '🔬',
    arts_performance: '🎭',
    agriculture_environment: '🌱',
    engineering_technology: '⚙️',
    business_economics: '💼',
    journalism_media: '📰',
    law_studies: '⚖️',
    health_sciences: '🏥',
    education_studies: '🎒',
    general_studies: '📚',
  }

  useEffect(() => {
    fetch(`${API_BASE}/api/showcase/faculties`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Only show faculties that have at least one department
          setFaculties(data.filter((f: any) => f.departments?.length > 0))
        }
      })
      .catch(() => {})
  }, [])

  const loadDeptPosts = async (faculty: any, dept: any) => {
    setSelectedDept(dept)
    setLoadingPosts(true)
    setDeptPosts([])
    setPlayingId(null)
    try {
      const res = await fetch(
        `${API_BASE}/api/showcase/department/${encodeURIComponent(faculty.name)}/${encodeURIComponent(dept.name)}`
      )
      if (res.ok) {
        const data = await res.json()
        setDeptPosts(Array.isArray(data) ? data : [])
      }
    } catch (err) {}
    finally { setLoadingPosts(false) }
  }

  const handleFacultyClick = async (faculty: any) => {
    setSelectedFaculty(faculty)
    setSelectedDept(null)
    setFacultyPosts([])
    setPlayingId(null)
    // Load faculty-level posts (posts with no specific department)
    try {
      const res = await fetch(
        `${API_BASE}/api/showcase/faculty-level/${encodeURIComponent(faculty.name)}`
      )
      if (res.ok) {
        const data = await res.json()
        setFacultyPosts(Array.isArray(data) ? data : [])
      }
    } catch (err) {}
  }

  if (faculties.length === 0) return null

  const deptColor = (d: any) => LEARNING_TYPE_COLORS[d?.learningType] || '#4ade80'
  const deptIcon = (d: any) => LEARNING_TYPE_ICONS[d?.learningType] || '📚'

  return (
    <section className="sec sec-dark">
      <div className="wrap">
        <div className="head c">
          <div className="rule" />
          <h2>What's happening across campus</h2>
          <p>Explore real activities from every faculty and department.</p>
        </div>

        {/* ===== FACULTY GRID ===== */}
        {!selectedFaculty && (
          <div className="fx-grid">
            {faculties.map(faculty => (
              <button key={faculty._id} className="fx-card" onClick={() => handleFacultyClick(faculty)}>
                <i>🏛️</i>
                <h3>{faculty.name}</h3>
                {faculty.description && (
                  <p>{faculty.description.slice(0, 60)}{faculty.description.length > 60 ? '...' : ''}</p>
                )}
                <div className="fx-meta">
                  <span>{faculty.departments?.length} department{faculty.departments?.length !== 1 ? 's' : ''}</span>
                  {faculty.postCount > 0 && <span className="fx-count">{faculty.postCount} posts</span>}
                </div>
                <div className="fx-go">Explore departments</div>
              </button>
            ))}
          </div>
        )}

        {/* ===== DEPARTMENT GRID ===== */}
        {selectedFaculty && !selectedDept && (
          <div>
            <div className="crumbs">
              <button className="crumb" onClick={() => setSelectedFaculty(null)}>← All faculties</button>
              <span>›</span>
              <b style={{ color: '#fff' }}>{selectedFaculty.name}</b>
            </div>

            {/* Faculty-level posts */}
            {facultyPosts.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <h3 className="fx-sub">📌 Faculty posts</h3>
                <div className="posts" style={{ marginBottom: 24 }}>
                  {facultyPosts.map(post => (
                    <PostCard
                      key={post._id}
                      post={post}
                      dark
                      accent="#4ade80"
                      playing={playingId === post._id}
                      onToggle={() => setPlayingId(playingId === post._id ? null : post._id)}
                    />
                  ))}
                </div>
                <div className="fx-sep" />
              </div>
            )}

            <h3 className="fx-title">Departments in {selectedFaculty.name}</h3>
            <div className="fx-grid">
              {selectedFaculty.departments?.map((dept: any) => (
                <button
                  key={dept._id}
                  className="fx-card dept"
                  style={{ ['--c' as any]: deptColor(dept) }}
                  onClick={() => loadDeptPosts(selectedFaculty, dept)}
                >
                  <div className="fx-thumb">
                    {dept.latestThumbnail ? <img src={dept.latestThumbnail} alt={dept.name} /> : deptIcon(dept)}
                    {dept.postCount > 0 && <span className="fx-count">{dept.postCount} posts</span>}
                  </div>
                  <div className="fx-dept-body">
                    <small>
                      {deptIcon(dept)} {dept.learningType?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </small>
                    <h4>{dept.name}</h4>
                    {dept.description && (
                      <p style={{ fontSize: 13, color: '#8ea398', marginTop: 4 }}>
                        {dept.description.slice(0, 50)}{dept.description.length > 50 ? '...' : ''}
                      </p>
                    )}
                    <div className="fx-go" style={{ marginTop: 10, fontSize: 13 }}>
                      {dept.postCount > 0 ? `View ${dept.postCount} post${dept.postCount !== 1 ? 's' : ''}` : 'No posts yet'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== DEPARTMENT POSTS WALL ===== */}
        {selectedFaculty && selectedDept && (
          <div>
            <div className="crumbs">
              <button className="crumb" onClick={() => { setSelectedFaculty(null); setSelectedDept(null) }}>All faculties</button>
              <span>›</span>
              <button className="crumb" onClick={() => setSelectedDept(null)}>{selectedFaculty.name}</button>
              <span>›</span>
              <b style={{ color: '#fff' }}>{selectedDept.name}</b>
            </div>

            <div className="dept-head" style={{ ['--c' as any]: deptColor(selectedDept) }}>
              <i>{deptIcon(selectedDept)}</i>
              <div>
                <h3>{selectedDept.name}</h3>
                <p>
                  {selectedFaculty.name}
                  {selectedDept.description ? ` • ${selectedDept.description}` : ''}
                </p>
              </div>
              <div>
                <b>{deptPosts.length}</b>
                <small>posts</small>
              </div>
            </div>

            {loadingPosts ? (
              <div className="msg"><i>⏳</i><p>Loading posts...</p></div>
            ) : deptPosts.length === 0 ? (
              <div className="msg">
                <i>🎬</i>
                <h3>No posts yet</h3>
                <p>The {selectedDept.name} department hasn't posted anything yet. Check back soon!</p>
              </div>
            ) : (
              <div className="posts">
                {deptPosts.map(post => (
                  <PostCard
                    key={post._id}
                    post={post}
                    dark
                    accent={deptColor(selectedDept)}
                    playing={playingId === post._id}
                    onToggle={() => setPlayingId(playingId === post._id ? null : post._id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
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
    <div ref={ref} className="stats">
      <div className="wrap">
        <div className="stats-grid">
          {stats.map(stat => (
            <div key={stat.label} className="stat">
              <i>{stat.icon}</i>
              <b>{stat.value.toLocaleString()}{stat.suffix}</b>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
        <div className="tagline">
          "Empowering the next generation of leaders, innovators and problem-solvers."
          <small>Established 2026</small>
        </div>
      </div>
    </div>
  )
}

// Value-proposition section for logged-out visitors.
function WhyUniWeb() {
  const cards = [
    {
      icon: '🎓',
      title: 'World-class Learning',
      desc: 'Live classes, lesson notes, coding sandboxes and quizzes — all in one place. Your child learns with the best tools available today.',
      bg: '#eaf8ef',
    },
    {
      icon: '💬',
      title: 'Always Connected',
      desc: 'Real-time chat between students and lecturers. Announcements reach every student instantly. No one is ever left behind.',
      bg: '#e8f0fe',
    },
    {
      icon: '🚀',
      title: 'Real Opportunities',
      desc: 'Our campus showcase is visible to the world. Talented students get noticed. The right opportunity finds them here.',
      bg: '#f1ecfe',
    },
  ]
  return (
    <section className="sec">
      <div className="wrap">
        <div className="head c">
          <div className="rule" />
          <h2>Why choose UniWeb?</h2>
          <p>More than a university platform — a complete academic ecosystem.</p>
        </div>
        <div className="why">
          {cards.map(card => (
            <div key={card.title} className="card hov">
              <i style={{ background: card.bg }}>{card.icon}</i>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </div>
          ))}
        </div>
        <div className="card big-quote">
          <p>"Your child's future starts with the right environment. UniWeb provides exactly that — a modern, connected and inspiring academic home."</p>
          <span>— UniWeb Academic Platform</span>
        </div>
      </div>
    </section>
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
    <section className="sec sec-white">
      <div className="wrap">
        <div className="head c">
          <div className="rule" />
          <h2>See what's happening at our campus</h2>
          <p>Real moments from our students, lecturers and departments.</p>
        </div>

        {faculties.length > 0 && (
          <div className="filters">
            {['all', ...faculties].map(f => (
              <button key={f} className={`pill${activeFilter === f ? ' on' : ''}`} onClick={() => setActiveFilter(f)}>
                {f === 'all' ? '🌍 All' : f}
              </button>
            ))}
          </div>
        )}

        <div className="posts">
          {filtered.map(post => (
            <PostCard
              key={post._id}
              post={post}
              scope
              playing={playingId === post._id}
              onToggle={() => setPlayingId(playingId === post._id ? null : post._id)}
            />
          ))}
        </div>

        {!token && (
          <div className="join">
            <p>Want to be part of this community?</p>
            <a href="/register"><button className="btn btn-p">Join UniWeb today</button></a>
          </div>
        )}
      </div>
    </section>
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
    <div className="uw">
      <style>{CSS}</style>
      <div className="loading"><p>Loading...</p></div>
    </div>
  )

  const tickerItems = [
    '💬  Real-time chat across every department',
    '📡  Live classes, hosted instantly by lecturers',
    '📢  Announcements, filtered to your level',
    '🎓  Automatic promotion, every session',
  ]

  const features = [
    { icon: '💬', title: 'Real-time Chat', desc: 'Scoped chat rooms for your department and level.', color: '#15803d', video: '/videos/realtime.mp4' },
    { icon: '📡', title: 'Live Classes', desc: 'Lecturers start live sessions instantly.', color: '#b8862f', video: '/videos/liveclass.mp4' },
    { icon: '📢', title: 'Announcements', desc: 'Filtered by faculty, department, and level.', color: '#15803d', video: '/videos/annous.mp4' },
    { icon: '🎥', title: 'Video Streaming', desc: 'WebRTC-powered peer-to-peer video.', color: '#0d9488', video: '/videos/stream.mp4' },
    { icon: '🎓', title: 'Academic System', desc: 'Automatic student promotion each year.', color: '#b8862f', video: '/videos/gcu.mp4' },
    { icon: '👥', title: 'Role-based Access', desc: 'Students, lecturers, and admins each see what they need.', color: '#0d9488', video: '/videos/rac.mp4' },
  ]
  const spans = ['s2', '', '', 's2', 's2', '']

  const roleLabel = user
    ? user.role === 'admin' ? 'Super Admin'
      : user.role === 'faculty_admin' ? 'Faculty Admin'
      : user.role === 'department_admin' ? 'Dept Admin'
      : user.role === 'lecturer' ? 'Lecturer'
      : `Student · ${user.level}`
    : ''

  const quickCards = user ? [
    { icon: '💬', title: 'Chat', desc: 'Talk to your faculty and students', href: '/chat', bg: '#eaf8ef' },
    { icon: '📡', title: 'Live Classes', desc: 'Start or join a live session', href: '/live', bg: '#e8f0fe' },
    { icon: '📢', title: 'Announcements', desc: 'Stay updated with latest news', href: '/announcements', bg: '#fbf3e3' },
    ...(user.role === 'admin' ? [{ icon: '⚙️', title: 'Admin Panel', desc: 'Manage the entire platform', href: '/admin', bg: '#fdecec' }] : []),
    ...(user.role === 'faculty_admin' ? [{ icon: '🛡️', title: 'Faculty Panel', desc: 'Manage your faculty', href: '/faculty-admin', bg: '#f1ecfe' }] : []),
  ] : []

  const token = getAuthToken()

  return (
    <div className="uw">
      <style>{CSS}</style>

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-wash" />
        <div className="wrap hero-in">
          <div>
            {user ? (
              <span className="badge"><span className="dot" />{greeting}, {roleLabel}</span>
            ) : (
              <span className="badge gold">🎓 Academic Platform</span>
            )}

            <h1>{user ? 'Welcome to UniWeb' : 'The Smart Academic Platform'}</h1>

            <p className="lead">
              {user
                ? 'Your all-in-one academic platform to connect, teach, learn, and stay informed.'
                : 'Connect students, lecturers, and administrators through real-time chat, live classes, and smart announcements.'}
            </p>

            {user && (
              <div className="hl">
                {[
                  { icon: '💬', label: 'Real-time Communication', sub: 'Chat with students & staff' },
                  { icon: '📡', label: 'Live & Interactive Classes', sub: 'Engage anywhere, anytime' },
                  { icon: '📢', label: 'Stay Informed', sub: 'Announcements & updates' },
                ].map(f => (
                  <div key={f.label}>
                    <i>{f.icon}</i>
                    <span><b>{f.label}</b><small>{f.sub}</small></span>
                  </div>
                ))}
              </div>
            )}

            {user && (
              <div className="quote">
                <p>"Education is the most powerful weapon which you can use to change the world."</p>
                <span>— Nelson Mandela</span>
              </div>
            )}

            <div className="cta-row">
              {user ? (
                <>
                  <a href="/dashboard"><button className="btn btn-p">Go to Dashboard</button></a>
                  <a href="/live"><button className="btn btn-g">▶ Explore UniWeb</button></a>
                </>
              ) : (
                <>
                  <a href="/register"><button className="btn btn-p">Get Started</button></a>
                  <a href="/login"><button className="btn btn-g">Login</button></a>
                </>
              )}
            </div>
          </div>

          {/* Campus noticeboard: three pinned notes */}
          <div className="board" aria-hidden="true">
            <div className="note"><i>💬</i><span><b>Real-time Chat</b><span>Rooms for your department and level.</span></span></div>
            <div className="note"><i>📡</i><span><b>Live Classes</b><span>Lecturers start live sessions instantly.</span></span></div>
            <div className="note"><i>📢</i><span><b>Announcements</b><span>Filtered by faculty, department, and level.</span></span></div>
          </div>
        </div>

        {/* Ticker strip */}
        <div className="ticker">
          <div className="ticker-track">
            {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
              <div key={i} className="ticker-item">{item}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS BAR — logged-out position (right after hero) ===== */}
      {!user && <StatsBar />}

      {/* ===== WHY UNIWEB — logged out only ===== */}
      {!user && <WhyUniWeb />}

      {/* ===== QUICK ACCESS + ANNOUNCEMENTS (logged in only) ===== */}
      {user && (
        <>
          <section className="sec" style={{ paddingBottom: 40 }}>
            <div className="wrap">
              <div className="qa-head">
                <h2>⚡ Quick Access</h2>
                <span>Shortcuts</span>
              </div>
              <div className="qa">
                {quickCards.map(card => (
                  <Link key={card.href} href={card.href}>
                    <div className="card hov">
                      <i style={{ background: card.bg }}>{card.icon}</i>
                      <div>
                        <b>{card.title}</b>
                        <small>{card.desc}</small>
                      </div>
                      <em>›</em>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* ===== STATS BAR — logged-in position (right after Quick Access) ===== */}
          <StatsBar />

          <section className="sec">
            <div className="wrap">
              <div className={`split${announcements.length > 0 ? '' : ' one'}`}>
                <div>
                  <div className="split-top">
                    <h2>📢 Latest Announcements</h2>
                    <Link href="/announcements">View all</Link>
                  </div>
                  {announcements.length === 0 ? (
                    <div className="card empty"><i>📢</i><p>No announcements yet</p></div>
                  ) : (
                    announcements.map(ann => (
                      <div key={ann._id} className="card ann">
                        <i>📢</i>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="ann-top">
                            <b>General</b>
                            <span>{formatDate(ann.createdAt)}</span>
                          </div>
                          <h4>{ann.title}</h4>
                          <p>{ann.content.length > 80 ? ann.content.slice(0, 80) + '...' : ann.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div>
                  <div className="split-top">
                    <h2>📅 Upcoming Schedule</h2>
                    <span style={{ color: '#8a9890', fontWeight: 400 }}>View calendar</span>
                  </div>
                  <div className="card empty" style={{ padding: '48px 24px' }}>
                    <i>📅</i>
                    <b>No upcoming events</b>
                    <p>Schedule and events will appear here.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ===== FEATURES (logged out only) ===== */}
      {!user && (
        <section className="sec" style={{ paddingTop: 24 }}>
          <div className="wrap">
            <div className="head c">
              <div className="rule" />
              <h2>Everything your campus needs</h2>
              <p>Built around your faculty, department, and level.</p>
            </div>
            <div className="bento">
              {features.map((f, i) => (
                <div key={f.title} className={`card hov ${spans[i]}`}>
                  <FeatureVideoThumb src={f.video} icon={f.icon} badgeColor={f.color} />
                  <div className="bento-body">
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== CAMPUS SHOWCASE — shown for both logged in and logged out ===== */}
      <ShowcaseSection token={token} />

      {/* ===== FACULTY & DEPARTMENT SHOWCASE ===== */}
      <FacultyShowcaseSection />

      {/* ===== BOTTOM CTA (logged out only) ===== */}
      {!user && (
        <section className="final">
          <div>
            <div className="rule" style={{ margin: '0 auto 18px' }} />
            <h2>Everything your campus needs</h2>
            <p>One platform. Unlimited possibilities.</p>
            <Link href="/register"><button className="btn btn-p">Explore UniWeb</button></Link>
          </div>
        </section>
      )}

      {/* ===== FOOTER ===== */}
      <footer className="foot">
        © {new Date().getFullYear()} UniWeb — Academic Platform. Built for academic excellence.
      </footer>
    </div>
  )
}