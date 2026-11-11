'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import io from 'socket.io-client'
import { getAuthToken } from '../utils/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
const TZ = 'Africa/Lagos'

// ===== Types =====
type Me = {
  actor: { id: string; kind: 'head' | 'superadmin' | 'admin'; name: string; isHead: boolean }
  today: string
  counts: { pending: number; approved: number; suspended: number; onShift: number; vehicles: number }
}
type ApiResult = { ok: boolean; status: number; data: any }
type Api = (path: string, opts?: { method?: string; body?: any }) => Promise<ApiResult>
type Say = (ok: boolean, text: string) => void
type DialogCfg = {
  title: string
  body?: string
  confirm: string
  danger?: boolean
  reason?: boolean
  onConfirm: (reason: string) => Promise<void> | void
}
type Ask = (cfg: DialogCfg) => void

// ===== Styles =====
const CSS = `
.fp{--bg:#f3f6f4;--card:#fff;--ink:#10231a;--mut:#5d6e64;--line:#dfe7e2;--accent:#16a34a;--soft:#eaf6ee;--warnbg:#fef3c7;--warn:#92400e;--badbg:#fee2e2;--bad:#b91c1c;--okbg:#dcfce7;--ok:#166534;--mutbg:#eceff0;--shadow:0 1px 3px rgba(16,35,26,.06);font-family:Inter,system-ui,-apple-system,'Segoe UI',sans-serif;background:var(--bg);color:var(--ink);min-height:100vh;line-height:1.5}
@media (prefers-color-scheme:dark){.fp{--bg:#0a120e;--card:#121d17;--ink:#e6f0ea;--mut:#9fb2a8;--line:#22332a;--soft:#17271e;--warnbg:#3a2a08;--warn:#fbbf24;--badbg:#3b1414;--bad:#fca5a5;--okbg:#10331d;--ok:#86efac;--mutbg:#1b2a22;--shadow:none}}
.fp *{box-sizing:border-box}
.fp h1,.fp h2,.fp h3,.fp h4,.fp p{margin:0}
.fp a{color:inherit;text-decoration:none}
.fp button{font-family:inherit;cursor:pointer}
.fp :focus-visible{outline:3px solid var(--accent);outline-offset:2px;border-radius:6px}

.fp-top{background:linear-gradient(135deg,#052e16,#0b3d24 60%,#14532d);color:#fff;padding:14px 20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.fp-brand{display:flex;align-items:center;gap:12px;flex:1;min-width:220px}
.fp-brand i{font-style:normal;font-size:30px}
.fp-brand b{display:block;font-size:16px;font-weight:800;letter-spacing:.2px}
.fp-brand small{color:rgba(255,255,255,.6);font-size:12px}
.fp-who{display:flex;align-items:center;gap:10px;font-size:13px}
.fp-who span{background:rgba(255,255,255,.12);border-radius:999px;padding:4px 12px;font-weight:600}
.fp-link{background:rgba(255,255,255,.12);border:0;color:#fff;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:600}
.fp-link:hover{background:rgba(255,255,255,.22)}

.fp-tabs{background:var(--card);border-bottom:1px solid var(--line);display:flex;overflow-x:auto;padding:0 10px;position:sticky;top:0;z-index:20}
.fp-tab{border:0;background:none;color:var(--mut);padding:13px 14px;font-size:13px;font-weight:600;white-space:nowrap;border-bottom:3px solid transparent;display:flex;gap:6px;align-items:center}
.fp-tab.on{color:var(--accent);border-bottom-color:var(--accent)}
.fp-badge{background:#dc2626;color:#fff;border-radius:999px;font-size:11px;padding:1px 7px;font-weight:700}

.fp-main{max-width:1000px;margin:0 auto;padding:22px 18px 60px}
.fp-h{font-size:20px;font-weight:800;margin-bottom:4px}
.fp-sub{color:var(--mut);font-size:13px;margin-bottom:18px}
.fp-card{background:var(--card);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);padding:16px}
.fp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:22px}
.fp-stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;text-align:left;box-shadow:var(--shadow);transition:transform .15s,border-color .15s}
.fp-stat:hover{transform:translateY(-2px);border-color:var(--accent)}
.fp-stat b{display:block;font-size:30px;font-weight:800;line-height:1.1}
.fp-stat span{color:var(--mut);font-size:12px}
.fp-stat.warn b{color:var(--warn)}
.fp-list{display:flex;flex-direction:column;gap:10px}
.fp-row{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:13px 14px;display:flex;align-items:center;gap:12px;box-shadow:var(--shadow)}
.fp-row.tap{cursor:pointer;transition:border-color .15s}
.fp-row.tap:hover{border-color:var(--accent)}
.fp-av{width:40px;height:40px;border-radius:50%;background:var(--accent);color:#fff;display:grid;place-items:center;font-weight:800;font-size:14px;flex-shrink:0}
.fp-grow{flex:1;min-width:0}
.fp-name{font-weight:700;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fp-meta{color:var(--mut);font-size:12px;display:flex;gap:10px;flex-wrap:wrap}
.fp-meta a{color:var(--accent);font-weight:600}
.fp-pill{display:inline-block;border-radius:999px;padding:2px 9px;font-size:11px;font-weight:700;background:var(--mutbg);color:var(--mut);white-space:nowrap}
.fp-pill.ok{background:var(--okbg);color:var(--ok)}
.fp-pill.warn{background:var(--warnbg);color:var(--warn)}
.fp-pill.bad{background:var(--badbg);color:var(--bad)}
.fp-actions{display:flex;gap:8px;flex-wrap:wrap}
.fp-btn{border:0;border-radius:9px;padding:9px 14px;font-size:13px;font-weight:700;transition:opacity .15s,transform .1s}
.fp-btn:active{transform:scale(.97)}
.fp-btn:disabled{opacity:.5;cursor:not-allowed}
.fp-p{background:var(--accent);color:#fff}
.fp-d{background:#dc2626;color:#fff}
.fp-g{background:var(--mutbg);color:var(--ink)}
.fp-s{padding:6px 11px;font-size:12px}
.fp-input,.fp-select,.fp-text{width:100%;border:1.5px solid var(--line);background:var(--card);color:var(--ink);border-radius:9px;padding:10px 12px;font-size:14px;font-family:inherit}
.fp-text{resize:vertical;min-height:90px}
.fp-label{display:block;font-size:12px;font-weight:700;color:var(--mut);margin:12px 0 5px}
.fp-chips{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0 16px}
.fp-chip{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;padding:6px 14px;font-size:13px;font-weight:600}
.fp-chip.on{background:var(--accent);border-color:var(--accent);color:#fff}
.fp-empty{text-align:center;color:var(--mut);padding:36px 16px;font-size:14px}
.fp-empty i{font-style:normal;display:block;font-size:34px;margin-bottom:8px}
.fp-two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.fp-info{display:grid;grid-template-columns:130px 1fr;gap:6px 12px;font-size:13px;margin:14px 0}
.fp-info dt{color:var(--mut)}
.fp-info dd{margin:0;font-weight:600;word-break:break-word}
.fp-hist{font-size:13px;display:flex;flex-direction:column;gap:8px;margin-top:8px}
.fp-hist div{border-left:3px solid var(--line);padding-left:10px}
.fp-hist small{display:block;color:var(--mut);font-size:11px}
.fp-sec{font-size:13px;font-weight:800;margin:20px 0 4px;text-transform:uppercase;letter-spacing:.5px;color:var(--mut)}

.fp-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px;animation:fp-fade .15s ease}
.fp-modal{background:var(--card);color:var(--ink);border-radius:16px;width:100%;max-width:440px;max-height:90vh;overflow:auto;box-shadow:0 24px 60px rgba(0,0,0,.35)}
.fp-modal.wide{max-width:640px}
.fp-modal-head{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--card);z-index:1}
.fp-modal-head h3{font-size:16px;font-weight:800}
.fp-x{border:0;background:none;color:var(--mut);font-size:26px;line-height:1}
.fp-modal-body{padding:16px 18px 20px}
.fp-modal-body .fp-actions{margin-top:16px;justify-content:flex-end}
.fp-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:200;padding:11px 18px;border-radius:12px;font-size:13px;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,.35);max-width:92vw;animation:fp-up .2s ease}
.fp-toast.ok{background:#14532d;color:#dcfce7}
.fp-toast.bad{background:#7f1d1d;color:#fee2e2}
.fp-gate{max-width:440px;margin:60px auto;padding:0 18px}
.fp-gate .fp-card{padding:24px;text-align:center}
.fp-gate .fp-btn{display:block;width:100%;margin-top:12px;padding:13px}
.fp-load{text-align:center;padding:80px 20px;color:var(--mut)}

@keyframes fp-fade{from{opacity:0}to{opacity:1}}
@keyframes fp-up{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
@media (max-width:640px){
  .fp-two{grid-template-columns:1fr}
  .fp-info{grid-template-columns:100px 1fr}
  .fp-overlay{align-items:flex-end;padding:0}
  .fp-modal,.fp-modal.wide{max-width:none;border-radius:16px 16px 0 0;max-height:92vh}
  .fp-row{flex-wrap:wrap}
}
@media (prefers-reduced-motion:reduce){.fp *{animation:none!important;transition:none!important}}
`

// ===== Helpers =====
const fmtDateTime = (d?: string | Date | null) =>
  d
    ? new Date(d).toLocaleString('en-GB', {
        timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : '—'

const fmtDate = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const ago = (d?: string | Date | null) => {
  if (!d) return '—'
  const s = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  return `${Math.floor(s / 86400)} d ago`
}

const initials = (n?: string) =>
  (n || '?').split(' ').filter(Boolean).map(p => p[0]).join('').toUpperCase().slice(0, 2)

const STATUS_PILL: Record<string, string> = {
  pending: 'warn', approved: 'ok', suspended: 'bad', rejected: '',
}

function describeAudit(e: any): string {
  const a = e.actor?.name || 'System'
  const t = e.target?.label || ''
  const x = e.details || {}
  const reason = x.reason ? ` — “${x.reason}”` : ''
  switch (e.action) {
    case 'driver.register': return `${t || a} registered as a driver`
    case 'driver.approve': return `${a} approved ${t}`
    case 'driver.reject': return `${a} rejected ${t}${reason}`
    case 'driver.suspend': return `${a} suspended ${t}${reason}`
    case 'driver.reinstate': return `${a} reinstated ${t}`
    case 'driver.checkin': return `${a} checked in with ${x.vehicle}`
    case 'driver.reassign': return `${a} assigned ${x.vehicle} to ${t}`
    case 'admin.add': return `${a} made ${t} a fleet admin`
    case 'admin.remove': return `${a} removed ${t} as a fleet admin`
    case 'head.appoint': return `${a} appointed ${t} as Fleet Head${x.replaced ? ` (replacing ${x.replaced})` : ''}`
    case 'head.remove': return `${a} removed ${t} as Fleet Head`
    case 'vehicle.create': return `${a} added tricycle ${t}`
    case 'vehicle.update': return `${a} updated tricycle ${t}`
    case 'vehicle.delete': return `${a} deleted tricycle ${t}`
    case 'checkin.release': return `${a} released ${x.vehicle} from ${t}`
    case 'announcement.send': {
      const who = x.audience === 'all' ? 'all drivers' : x.audience === 'onShift' ? 'drivers on shift' : 'one driver'
      return `${a} sent “${x.title}” to ${who} (${x.recipients})`
    }
    default: return `${a}: ${e.action}`
  }
}

// Loads a list from the API and reloads when the path or `version` changes
function useLoad(api: Api, path: string, version: number) {
  const [data, setData] = useState<any>(null) // null = still loading
  const [err, setErr] = useState('')
  useEffect(() => {
    let alive = true
    setErr('')
    api(path).then(r => {
      if (!alive) return
      if (r.ok) setData(r.data)
      else setErr(r.data?.message || 'Could not load this')
    })
    return () => { alive = false }
  }, [api, path, version])
  return { data, err, setData }
}

function Loading({ err }: { err?: string }) {
  return <div className="fp-empty">{err ? `⚠️ ${err}` : 'Loading…'}</div>
}

// ===== Dialogs =====
function Modal({ title, onClose, children, wide }: any) {
  return (
    <div className="fp-overlay" onClick={onClose}>
      <div className={`fp-modal${wide ? ' wide' : ''}`} onClick={e => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="fp-modal-head">
          <h3>{title}</h3>
          <button className="fp-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="fp-modal-body">{children}</div>
      </div>
    </div>
  )
}

function ConfirmDialog({ cfg, onClose }: { cfg: DialogCfg; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const needsReason = !!cfg.reason && reason.trim().length < 3
  return (
    <Modal title={cfg.title} onClose={onClose}>
      {cfg.body && <p style={{ fontSize: 14, color: 'var(--mut)' }}>{cfg.body}</p>}
      {cfg.reason && (
        <>
          <label className="fp-label">Reason (the driver will see this)</label>
          <textarea
            className="fp-text"
            value={reason}
            maxLength={300}
            onChange={e => setReason(e.target.value)}
            placeholder="Write a short, clear reason"
            autoFocus
          />
        </>
      )}
      <div className="fp-actions">
        <button className="fp-btn fp-g" onClick={onClose}>Cancel</button>
        <button
          className={`fp-btn ${cfg.danger ? 'fp-d' : 'fp-p'}`}
          disabled={busy || needsReason}
          onClick={async () => {
            setBusy(true)
            await cfg.onConfirm(reason.trim())
            setBusy(false)
            onClose()
          }}
        >
          {busy ? 'Please wait…' : cfg.confirm}
        </button>
      </div>
    </Modal>
  )
}

// ===== Tab: Overview =====
function Overview({ me, api, goTab, version }: { me: Me; api: Api; goTab: (t: string) => void; version: number }) {
  const { data: recent } = useLoad(api, '/audit?limit=6', version)
  const c = me.counts
  const cards = [
    { label: 'Waiting for approval', value: c.pending, tab: 'approvals', warn: c.pending > 0 },
    { label: 'On shift now', value: c.onShift, tab: 'live' },
    { label: 'Approved drivers', value: c.approved, tab: 'drivers' },
    { label: 'Suspended', value: c.suspended, tab: 'drivers' },
    { label: 'Tricycles available', value: c.vehicles, tab: 'tricycles' },
  ]
  return (
    <div>
      <h2 className="fp-h">Overview</h2>
      <p className="fp-sub">Today is {fmtDate(me.today)}. Tap a card to open that section.</p>
      <div className="fp-grid">
        {cards.map(card => (
          <button key={card.label} className={`fp-stat${card.warn ? ' warn' : ''}`} onClick={() => goTab(card.tab)}>
            <b>{card.value}</b>
            <span>{card.label}</span>
          </button>
        ))}
      </div>

      <h3 className="fp-sec">Recent activity</h3>
      {!recent ? (
        <Loading />
      ) : recent.length === 0 ? (
        <div className="fp-empty"><i>🧾</i>Nothing has happened yet.</div>
      ) : (
        <div className="fp-card">
          <div className="fp-hist" style={{ marginTop: 0 }}>
            {recent.map((e: any) => (
              <div key={e._id}>
                {describeAudit(e)}
                <small>{ago(e.createdAt)}</small>
              </div>
            ))}
          </div>
          <button className="fp-btn fp-g fp-s" style={{ marginTop: 14 }} onClick={() => goTab('activity')}>See all activity</button>
        </div>
      )}
    </div>
  )
}

// ===== Tab: Approvals =====
function Approvals({ api, say, ask, version, refreshAll, openDriver }: any) {
  const { data, err } = useLoad(api, '/drivers?status=pending', version)

  const approve = (d: any) =>
    ask({
      title: `Approve ${d.name}?`,
      body: 'They will be able to pick a tricycle, start shifts and appear on the campus map while on shift.',
      confirm: 'Approve',
      onConfirm: async () => {
        const r = await api(`/drivers/${d._id}/approve`, { method: 'PUT' })
        say(r.ok, r.data?.message || 'Could not approve')
        await refreshAll()
      },
    })

  const reject = (d: any) =>
    ask({
      title: `Reject ${d.name}?`,
      body: 'They will see your reason when they sign in. They cannot register again with the same phone or licence number.',
      confirm: 'Reject',
      danger: true,
      reason: true,
      onConfirm: async (reason: string) => {
        const r = await api(`/drivers/${d._id}/reject`, { method: 'PUT', body: { reason } })
        say(r.ok, r.data?.message || 'Could not reject')
        await refreshAll()
      },
    })

  return (
    <div>
      <h2 className="fp-h">Approvals</h2>
      <p className="fp-sub">Check each applicant’s licence number before you approve. New applications appear here as they arrive.</p>
      {!data ? (
        <Loading err={err} />
      ) : data.length === 0 ? (
        <div className="fp-empty"><i>✅</i>No applications waiting.</div>
      ) : (
        <div className="fp-list">
          {data.map((d: any) => (
            <div key={d._id} className="fp-row">
              <div className="fp-av">{initials(d.name)}</div>
              <div className="fp-grow">
                <div className="fp-name">{d.name}</div>
                <div className="fp-meta">
                  <a href={`tel:${d.phone}`}>{d.phone}</a>
                  <span>Licence: <b>{d.licenseNumber || '—'}</b></span>
                  <span>Applied {ago(d.createdAt)}</span>
                  <span>{d.locationConsent ? '✓ Location consent' : 'No location consent'}</span>
                </div>
              </div>
              <div className="fp-actions">
                <button className="fp-btn fp-g fp-s" onClick={() => openDriver(d._id)}>Details</button>
                <button className="fp-btn fp-d fp-s" onClick={() => reject(d)}>Reject</button>
                <button className="fp-btn fp-p fp-s" onClick={() => approve(d)}>Approve</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== Tab: Drivers =====
const FILTERS: [string, string][] = [
  ['', 'All'], ['pending', 'Pending'], ['approved', 'Approved'],
  ['suspended', 'Suspended'], ['rejected', 'Rejected'], ['admins', 'Fleet admins'],
]

function DriversTab({ api, version, openDriver }: any) {
  const [filter, setFilter] = useState('')
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  const params = new URLSearchParams()
  if (filter === 'admins') params.set('admins', 'true')
  else if (filter) params.set('status', filter)
  if (debounced) params.set('q', debounced)
  const { data, err } = useLoad(api, `/drivers?${params.toString()}`, version)

  return (
    <div>
      <h2 className="fp-h">Drivers</h2>
      <p className="fp-sub">Search by name, phone, licence or tricycle number. Tap a driver for details and actions.</p>
      <input className="fp-input" placeholder="Search drivers…" value={q} onChange={e => setQ(e.target.value)} />
      <div className="fp-chips">
        {FILTERS.map(([key, label]) => (
          <button key={key} className={`fp-chip${filter === key ? ' on' : ''}`} onClick={() => setFilter(key)}>{label}</button>
        ))}
      </div>
      {!data ? (
        <Loading err={err} />
      ) : data.length === 0 ? (
        <div className="fp-empty"><i>🔍</i>No drivers match.</div>
      ) : (
        <div className="fp-list">
          {data.map((d: any) => (
            <div key={d._id} className="fp-row tap" onClick={() => openDriver(d._id)}>
              <div className="fp-av">{initials(d.name)}</div>
              <div className="fp-grow">
                <div className="fp-name">{d.name}</div>
                <div className="fp-meta">
                  <span>{d.phone}</span>
                  {d.todayVehicle && <span>🛺 {d.todayVehicle} today</span>}
                  {d.isOnShift && <span style={{ color: 'var(--ok)', fontWeight: 700 }}>● On shift</span>}
                </div>
              </div>
              {d.isFleetAdmin && <span className="fp-pill ok">Fleet admin</span>}
              <span className={`fp-pill ${STATUS_PILL[d.accountStatus] || ''}`}>{d.accountStatus}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== Driver detail =====
function DriverDrawer({ id, me, api, say, ask, version, refreshAll, onClose, composeTo }: any) {
  const [info, setInfo] = useState<any>(null)
  const [err, setErr] = useState('')
  const [vehicles, setVehicles] = useState<any[]>([])
  const [pick, setPick] = useState('')

  useEffect(() => {
    let alive = true
    api(`/drivers/${id}`).then((r: ApiResult) => {
      if (!alive) return
      if (r.ok) setInfo(r.data)
      else setErr(r.data?.message || 'Could not load this driver')
    })
    api('/vehicles').then((r: ApiResult) => { if (alive && r.ok) setVehicles(r.data) })
    return () => { alive = false }
  }, [api, id, version])

  const d = info?.driver
  const todayCI = info?.checkIns?.find((c: any) => c.day === me.today)
  const isMe = me.actor.kind === 'admin' && d && String(d._id) === String(me.actor.id)
  const locked = d?.isFleetAdmin && !me.actor.isHead
  const canAct = d && !isMe && !locked

  const run = (path: string, success?: string) => async (reason?: string) => {
    const r = await api(path, { method: 'PUT', body: reason ? { reason } : undefined })
    say(r.ok, r.data?.message || success || (r.ok ? 'Done' : 'Something went wrong'))
    await refreshAll()
  }

  const options = vehicles.filter(
    v => v.status === 'available' && (!v.heldBy || v.number === todayCI?.vehicleNumber)
  )

  return (
    <Modal title={d ? d.name : 'Driver'} onClose={onClose} wide>
      {!d ? (
        <Loading err={err} />
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className={`fp-pill ${STATUS_PILL[d.accountStatus] || ''}`}>{d.accountStatus}</span>
            {d.isFleetAdmin && <span className="fp-pill ok">Fleet admin</span>}
            {d.isOnShift && <span className="fp-pill ok">On shift</span>}
          </div>

          <dl className="fp-info">
            <dt>Phone</dt><dd><a href={`tel:${d.phone}`} style={{ color: 'var(--accent)' }}>{d.phone}</a></dd>
            <dt>Licence number</dt><dd>{d.licenseNumber || '—'}</dd>
            <dt>Registered</dt><dd>{fmtDate(d.createdAt)}</dd>
            <dt>Location consent</dt><dd>{d.locationConsent ? `Yes (${fmtDate(d.consentAt)})` : 'Not yet'}</dd>
            <dt>Today’s tricycle</dt><dd>{todayCI ? todayCI.vehicleNumber : 'Not checked in'}</dd>
            {d.reviewedBy && (<><dt>Last reviewed by</dt><dd>{d.reviewedBy.name} · {fmtDate(d.reviewedAt)}</dd></>)}
            {d.statusReason && (<><dt>Reason</dt><dd>{d.statusReason}</dd></>)}
          </dl>

          {isMe && <p className="fp-sub">This is your own account. Another admin or the Fleet Head must make changes to it.</p>}
          {locked && <p className="fp-sub">Only the Fleet Head can change a fleet admin.</p>}

          {canAct && (
            <>
              <div className="fp-actions">
                {(d.accountStatus === 'pending' || d.accountStatus === 'rejected') && (
                  <button className="fp-btn fp-p" onClick={() => ask({
                    title: `Approve ${d.name}?`, confirm: 'Approve',
                    body: 'They will be able to pick a tricycle and start shifts.',
                    onConfirm: run(`/drivers/${d._id}/approve`),
                  })}>Approve</button>
                )}
                {d.accountStatus === 'pending' && (
                  <button className="fp-btn fp-d" onClick={() => ask({
                    title: `Reject ${d.name}?`, confirm: 'Reject', danger: true, reason: true,
                    onConfirm: run(`/drivers/${d._id}/reject`),
                  })}>Reject</button>
                )}
                {d.accountStatus === 'approved' && (
                  <button className="fp-btn fp-d" onClick={() => ask({
                    title: `Suspend ${d.name}?`, confirm: 'Suspend', danger: true, reason: true,
                    body: 'This ends their shift now, frees their tricycle and hides them from every map.',
                    onConfirm: run(`/drivers/${d._id}/suspend`),
                  })}>Suspend</button>
                )}
                {d.accountStatus === 'suspended' && (
                  <button className="fp-btn fp-p" onClick={() => ask({
                    title: `Reinstate ${d.name}?`, confirm: 'Reinstate',
                    onConfirm: run(`/drivers/${d._id}/reinstate`),
                  })}>Reinstate</button>
                )}
                {d.accountStatus === 'approved' && (
                  <button className="fp-btn fp-g" onClick={() => composeTo({ id: d._id, name: d.name })}>Send message</button>
                )}
                {me.actor.isHead && d.accountStatus === 'approved' && !d.isFleetAdmin && (
                  <button className="fp-btn fp-g" onClick={() => ask({
                    title: `Make ${d.name} a fleet admin?`, confirm: 'Make fleet admin',
                    body: 'They will be able to approve drivers, assign tricycles and send announcements. They get no UniWeb access.',
                    onConfirm: run(`/drivers/${d._id}/make-admin`),
                  })}>Make fleet admin</button>
                )}
                {me.actor.isHead && d.isFleetAdmin && (
                  <button className="fp-btn fp-g" onClick={() => ask({
                    title: `Remove ${d.name} as fleet admin?`, confirm: 'Remove', danger: true,
                    onConfirm: run(`/drivers/${d._id}/remove-admin`),
                  })}>Remove fleet admin</button>
                )}
              </div>

              {d.accountStatus === 'approved' && (
                <>
                  <label className="fp-label">Assign or change today’s tricycle</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select className="fp-select" value={pick} onChange={e => setPick(e.target.value)}>
                      <option value="">Choose a free tricycle…</option>
                      {options.map(v => (
                        <option key={v._id} value={v._id}>{v.number} ({v.seats} seats){v.number === todayCI?.vehicleNumber ? ' — current' : ''}</option>
                      ))}
                    </select>
                    <button
                      className="fp-btn fp-p"
                      disabled={!pick}
                      onClick={async () => {
                        const r = await api(`/drivers/${d._id}/vehicle`, { method: 'PUT', body: { vehicleId: pick } })
                        say(r.ok, r.data?.message || 'Could not assign')
                        setPick('')
                        await refreshAll()
                      }}
                    >
                      Assign
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {info.checkIns?.length > 0 && (
            <>
              <h3 className="fp-sec">Recent tricycles</h3>
              <div className="fp-hist">
                {info.checkIns.map((c: any) => (
                  <div key={c._id}>{c.vehicleNumber}<small>{fmtDate(c.day)}</small></div>
                ))}
              </div>
            </>
          )}

          {info.history?.length > 0 && (
            <>
              <h3 className="fp-sec">History</h3>
              <div className="fp-hist">
                {info.history.map((e: any) => (
                  <div key={e._id}>{describeAudit(e)}<small>{fmtDateTime(e.createdAt)}</small></div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  )
}

// ===== Tab: Tricycles =====
function VehiclesTab({ api, say, ask, version, refreshAll }: any) {
  const { data, err } = useLoad(api, '/vehicles', version)
  const [number, setNumber] = useState('')
  const [plate, setPlate] = useState('')
  const [seats, setSeats] = useState('3')
  const [adding, setAdding] = useState(false)
  const [edit, setEdit] = useState<any>(null)

  const add = async () => {
    setAdding(true)
    const r = await api('/vehicles', { method: 'POST', body: { number, plate, seats: Number(seats) } })
    setAdding(false)
    say(r.ok, r.ok ? `${number.toUpperCase()} added` : r.data?.message || 'Could not add')
    if (r.ok) { setNumber(''); setPlate(''); setSeats('3'); await refreshAll() }
  }

  return (
    <div>
      <h2 className="fp-h">Tricycles</h2>
      <p className="fp-sub">The TETFund fleet. Drivers pick one of these at their daily check-in. Mark a tricycle “maintenance” to stop drivers choosing it.</p>

      <div className="fp-card" style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Add a tricycle</h3>
        <div className="fp-two">
          <div><label className="fp-label" style={{ marginTop: 0 }}>Tricycle number</label>
            <input className="fp-input" placeholder="e.g. TET-001" value={number} onChange={e => setNumber(e.target.value)} /></div>
          <div><label className="fp-label" style={{ marginTop: 0 }}>Plate number (optional)</label>
            <input className="fp-input" value={plate} onChange={e => setPlate(e.target.value)} /></div>
        </div>
        <label className="fp-label">Passenger seats</label>
        <select className="fp-select" style={{ maxWidth: 140 }} value={seats} onChange={e => setSeats(e.target.value)}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <div className="fp-actions" style={{ marginTop: 14 }}>
          <button className="fp-btn fp-p" disabled={!number.trim() || adding} onClick={add}>{adding ? 'Adding…' : 'Add tricycle'}</button>
        </div>
      </div>

      {!data ? (
        <Loading err={err} />
      ) : data.length === 0 ? (
        <div className="fp-empty"><i>🛺</i>No tricycles yet. Add the first one above.</div>
      ) : (
        <div className="fp-list">
          {data.map((v: any) => (
            <div key={v._id} className="fp-row tap" onClick={() => setEdit(v)}>
              <div className="fp-av" style={{ background: v.status === 'available' ? 'var(--accent)' : '#6b7280' }}>🛺</div>
              <div className="fp-grow">
                <div className="fp-name">{v.number}</div>
                <div className="fp-meta">
                  <span>{v.seats} seats</span>
                  {v.plate && <span>Plate {v.plate}</span>}
                  {v.heldBy && <span>In use today: <b>{v.heldBy}</b></span>}
                </div>
              </div>
              <span className={`fp-pill ${v.status === 'available' ? 'ok' : v.status === 'maintenance' ? 'warn' : ''}`}>{v.status}</span>
            </div>
          ))}
        </div>
      )}

      {edit && (
        <VehicleEditor
          vehicle={edit}
          api={api}
          say={say}
          ask={ask}
          onClose={() => setEdit(null)}
          onSaved={async () => { setEdit(null); await refreshAll() }}
        />
      )}
    </div>
  )
}

function VehicleEditor({ vehicle, api, say, ask, onClose, onSaved }: any) {
  const [f, setF] = useState({
    number: vehicle.number, plate: vehicle.plate || '', seats: String(vehicle.seats),
    status: vehicle.status, notes: vehicle.notes || '',
  })
  const [busy, setBusy] = useState(false)
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })

  const save = async () => {
    setBusy(true)
    const r = await api(`/vehicles/${vehicle._id}`, { method: 'PUT', body: { ...f, seats: Number(f.seats) } })
    setBusy(false)
    say(r.ok, r.ok ? 'Saved' : r.data?.message || 'Could not save')
    if (r.ok) onSaved()
  }

  return (
    <Modal title={`Edit ${vehicle.number}`} onClose={onClose}>
      <label className="fp-label" style={{ marginTop: 0 }}>Tricycle number</label>
      <input className="fp-input" value={f.number} onChange={set('number')} />
      <label className="fp-label">Plate number</label>
      <input className="fp-input" value={f.plate} onChange={set('plate')} />
      <div className="fp-two">
        <div>
          <label className="fp-label">Seats</label>
          <select className="fp-select" value={f.seats} onChange={set('seats')}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="fp-label">Status</label>
          <select className="fp-select" value={f.status} onChange={set('status')}>
            <option value="available">Available</option>
            <option value="maintenance">In maintenance</option>
            <option value="retired">Retired</option>
          </select>
        </div>
      </div>
      <label className="fp-label">Notes</label>
      <textarea className="fp-text" value={f.notes} onChange={set('notes')} style={{ minHeight: 60 }} />
      <div className="fp-actions" style={{ justifyContent: 'space-between' }}>
        <button
          className="fp-btn fp-g"
          onClick={() => ask({
            title: `Delete ${vehicle.number}?`,
            body: 'Only a tricycle that has never been used can be deleted. Otherwise mark it retired.',
            confirm: 'Delete', danger: true,
            onConfirm: async () => {
              const r = await api(`/vehicles/${vehicle._id}`, { method: 'DELETE' })
              say(r.ok, r.data?.message || 'Could not delete')
              if (r.ok) onSaved()
            },
          })}
        >
          Delete
        </button>
        <button className="fp-btn fp-p" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </Modal>
  )
}

// ===== Tab: Today =====
function TodayTab({ api, say, ask, version, refreshAll, me }: any) {
  const board = useLoad(api, '/checkins', version)
  const roster = useLoad(api, '/vehicles', version)

  const list = board.data?.checkIns || []
  const free = (roster.data || []).filter((v: any) => v.status === 'available' && !v.heldBy)

  return (
    <div>
      <h2 className="fp-h">Today’s board</h2>
      <p className="fp-sub">{fmtDate(me.today)} · Each driver has one tricycle per day.</p>
      {!board.data ? (
        <Loading err={board.err} />
      ) : (
        <>
          <p className="fp-sub"><b>{list.length}</b> tricycle{list.length === 1 ? '' : 's'} in use · <b>{free.length}</b> free</p>
          {list.length === 0 ? (
            <div className="fp-empty"><i>🌅</i>No driver has checked in yet today.</div>
          ) : (
            <div className="fp-list">
              {list.map((c: any) => (
                <div key={c._id} className="fp-row">
                  <div className="fp-av">🛺</div>
                  <div className="fp-grow">
                    <div className="fp-name">{c.vehicleNumber}</div>
                    <div className="fp-meta"><span>{c.driverName}</span><span>Checked in {fmtDateTime(c.checkedInAt)}</span></div>
                  </div>
                  <button
                    className="fp-btn fp-g fp-s"
                    onClick={() => ask({
                      title: `Release ${c.vehicleNumber}?`,
                      body: `${c.driverName} will be taken off shift and must pick a tricycle again. Use this if they forgot to end the day.`,
                      confirm: 'Release', danger: true,
                      onConfirm: async () => {
                        const r = await api(`/checkins/${c._id}`, { method: 'DELETE' })
                        say(r.ok, r.data?.message || 'Could not release')
                        await refreshAll()
                      },
                    })}
                  >
                    Release
                  </button>
                </div>
              ))}
            </div>
          )}
          {free.length > 0 && (
            <>
              <h3 className="fp-sec">Still free</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {free.map((v: any) => <span key={v._id} className="fp-pill ok">{v.number}</span>)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

// ===== Tab: Messages =====
const AUDIENCE_LABEL: Record<string, string> = { all: 'All drivers', onShift: 'Drivers on shift', driver: 'One driver' }

function Announcements({ api, say, version, refreshAll, composeFor, clearCompose }: any) {
  const list = useLoad(api, '/announcements', version)
  const [audience, setAudience] = useState<'all' | 'onShift' | 'driver'>('all')
  const [driverId, setDriverId] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [sending, setSending] = useState(false)
  const [drivers, setDrivers] = useState<any[]>([])

  // "Send message" from a driver’s page pre-fills the form
  useEffect(() => {
    if (composeFor) { setAudience('driver'); setDriverId(composeFor.id) }
  }, [composeFor])

  useEffect(() => {
    if (audience !== 'driver') return
    api('/drivers?status=approved').then((r: ApiResult) => r.ok && setDrivers(r.data))
  }, [api, audience])

  const ready = title.trim() && body.trim() && (audience !== 'driver' || driverId)

  const send = async () => {
    setSending(true)
    const r = await api('/announcements', { method: 'POST', body: { title, body, urgent, audience, driverId } })
    setSending(false)
    if (r.ok) {
      say(true, `Sent to ${r.data.recipientCount} driver${r.data.recipientCount === 1 ? '' : 's'}`)
      setTitle(''); setBody(''); setUrgent(false); setDriverId(''); clearCompose()
      await refreshAll()
    } else say(false, r.data?.message || 'Could not send')
  }

  return (
    <div>
      <h2 className="fp-h">Messages</h2>
      <p className="fp-sub">Send an announcement to drivers. It appears on their screen straight away if their app is open.</p>

      <div className="fp-card" style={{ marginBottom: 20 }}>
        <label className="fp-label" style={{ marginTop: 0 }}>Send to</label>
        <select className="fp-select" value={audience} onChange={e => setAudience(e.target.value as any)}>
          <option value="all">All approved drivers</option>
          <option value="onShift">Drivers on shift right now</option>
          <option value="driver">One driver</option>
        </select>
        {audience === 'driver' && (
          <>
            <label className="fp-label">Driver</label>
            <select className="fp-select" value={driverId} onChange={e => setDriverId(e.target.value)}>
              <option value="">Choose a driver…</option>
              {composeFor && !drivers.some(d => d._id === composeFor.id) && <option value={composeFor.id}>{composeFor.name}</option>}
              {drivers.map(d => <option key={d._id} value={d._id}>{d.name} — {d.phone}</option>)}
            </select>
          </>
        )}
        <label className="fp-label">Title</label>
        <input className="fp-input" maxLength={100} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Fuel station closed today" />
        <label className="fp-label">Message</label>
        <textarea className="fp-text" maxLength={1000} value={body} onChange={e => setBody(e.target.value)} />
        <div style={{ fontSize: 11, color: 'var(--mut)', textAlign: 'right' }}>{body.length}/1000</div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginTop: 10 }}>
          <input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} />
          Mark as urgent (shown as a pop-up on the driver’s screen)
        </label>
        <div className="fp-actions" style={{ marginTop: 14 }}>
          <button className="fp-btn fp-p" disabled={!ready || sending} onClick={send}>{sending ? 'Sending…' : 'Send'}</button>
        </div>
      </div>

      <h3 className="fp-sec">Sent</h3>
      {!list.data ? (
        <Loading err={list.err} />
      ) : list.data.length === 0 ? (
        <div className="fp-empty"><i>📢</i>Nothing sent yet.</div>
      ) : (
        <div className="fp-list">
          {list.data.map((a: any) => (
            <div key={a._id} className="fp-row" style={{ alignItems: 'flex-start' }}>
              <div className="fp-grow">
                <div className="fp-name" style={{ whiteSpace: 'normal' }}>
                  {a.urgent && <span className="fp-pill bad" style={{ marginRight: 6 }}>Urgent</span>}
                  {a.title}
                </div>
                <p style={{ fontSize: 13, margin: '4px 0 6px' }}>{a.body}</p>
                <div className="fp-meta">
                  <span>{AUDIENCE_LABEL[a.audience]}</span>
                  <span>Read by {a.readCount} of {a.recipientCount}</span>
                  <span>{a.createdBy?.name} · {fmtDateTime(a.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== Tab: Live =====
function LiveTab({ api, version }: any) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 15000)
    return () => clearInterval(t)
  }, [])
  const { data, err } = useLoad(api, '/live', version + tick)

  return (
    <div>
      <h2 className="fp-h">Live</h2>
      <p className="fp-sub">Drivers on shift right now. Updates every 15 seconds.</p>
      {!data ? (
        <Loading err={err} />
      ) : data.length === 0 ? (
        <div className="fp-empty"><i>🌙</i>No driver is on shift.</div>
      ) : (
        <div className="fp-list">
          {data.map((d: any) => {
            const loc = d.currentLocation
            const age = loc?.updatedAt ? Math.round((Date.now() - new Date(loc.updatedAt).getTime()) / 1000) : null
            const tone = age == null ? 'bad' : age > 180 ? 'bad' : age > 60 ? 'warn' : 'ok'
            return (
              <div key={d._id} className="fp-row">
                <div className="fp-av">🛺</div>
                <div className="fp-grow">
                  <div className="fp-name">{d.tricycleNumber || '—'} · {d.name}</div>
                  <div className="fp-meta">
                    <a href={`tel:${d.phone}`}>{d.phone}</a>
                    <span>{d.availableSeats} of {d.totalSeats} seats free</span>
                    {loc?.lat != null && (
                      <a href={`https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=18/${loc.lat}/${loc.lng}`} target="_blank" rel="noopener noreferrer">View on map ↗</a>
                    )}
                  </div>
                </div>
                <span className={`fp-pill ${tone}`}>{loc?.updatedAt ? `Seen ${ago(loc.updatedAt)}` : 'No location'}</span>
                <span className={`fp-pill ${d.status === 'full' ? 'bad' : 'ok'}`}>{d.status}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ===== Tab: Activity =====
function ActivityTab({ api, version }: any) {
  const [items, setItems] = useState<any[] | null>(null)
  const [more, setMore] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    let alive = true
    api('/audit?limit=30').then((r: ApiResult) => {
      if (!alive) return
      if (r.ok) { setItems(r.data); setMore(r.data.length === 30) } else setErr(r.data?.message || 'Could not load')
    })
    return () => { alive = false }
  }, [api, version])

  const loadMore = async () => {
    if (!items || items.length === 0) return
    setBusy(true)
    const r = await api(`/audit?limit=30&before=${encodeURIComponent(items[items.length - 1].createdAt)}`)
    setBusy(false)
    if (r.ok) { setItems([...items, ...r.data]); setMore(r.data.length === 30) }
  }

  return (
    <div>
      <h2 className="fp-h">Activity</h2>
      <p className="fp-sub">Every action in the fleet portal, with who did it and when. Entries cannot be edited or deleted.</p>
      {!items ? (
        <Loading err={err} />
      ) : items.length === 0 ? (
        <div className="fp-empty"><i>🧾</i>Nothing has happened yet.</div>
      ) : (
        <div className="fp-card">
          <div className="fp-hist" style={{ marginTop: 0 }}>
            {items.map(e => (
              <div key={e._id}>{describeAudit(e)}<small>{fmtDateTime(e.createdAt)}</small></div>
            ))}
          </div>
          {more && <button className="fp-btn fp-g" style={{ marginTop: 14 }} disabled={busy} onClick={loadMore}>{busy ? 'Loading…' : 'Load older'}</button>}
        </div>
      )}
    </div>
  )
}

// ===== The portal =====
const TABS: [string, string, string][] = [
  ['overview', 'Overview', '📊'], ['approvals', 'Approvals', '📝'], ['drivers', 'Drivers', '👥'],
  ['tricycles', 'Tricycles', '🛺'], ['today', 'Today', '📅'], ['messages', 'Messages', '📢'],
  ['live', 'Live', '📍'], ['activity', 'Activity', '🧾'],
]

export default function FleetPortal() {
  const [phase, setPhase] = useState<'loading' | 'gate' | 'ready'>('loading')
  const [me, setMe] = useState<Me | null>(null)
  const [tab, setTab] = useState('overview')
  const [version, setVersion] = useState(0)
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null)
  const [dialog, setDialog] = useState<DialogCfg | null>(null)
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [composeFor, setComposeFor] = useState<{ id: string; name: string } | null>(null)
  const tokenRef = useRef('')

  const api: Api = useCallback(async (path, opts = {}) => {
    try {
      const res = await fetch(`${API_BASE}/api/fleet${path}`, {
        method: opts.method || 'GET',
        headers: {
          Authorization: `Bearer ${tokenRef.current}`,
          ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
      })
      const data = await res.json().catch(() => null)
      if (res.status === 401) setPhase('gate') // signed out or token expired
      return { ok: res.ok, status: res.status, data }
    } catch {
      return { ok: false, status: 0, data: { message: 'Network problem. Check your connection and try again.' } }
    }
  }, [])

  const say: Say = useCallback((ok, text) => setToast({ ok, text }), [])
  const ask: Ask = useCallback(cfg => setDialog(cfg), [])

  const refreshMe = useCallback(async () => {
    const r = await api('/me')
    if (r.ok) setMe(r.data)
  }, [api])

  const refreshAll = useCallback(async () => {
    await refreshMe()
    setVersion(v => v + 1)
  }, [refreshMe])

  // ----- Sign-in: the Fleet Head uses a UniWeb token, fleet admins a driver token -----
  useEffect(() => {
    let alive = true
    ;(async () => {
      const candidates: string[] = []
      const uniweb = getAuthToken()
      if (uniweb) candidates.push(uniweb)
      const driver = localStorage.getItem('driver_token')
      if (driver) candidates.push(driver)

      for (const t of candidates) {
        try {
          const res = await fetch(`${API_BASE}/api/fleet/me`, { headers: { Authorization: `Bearer ${t}` } })
          if (res.ok) {
            if (!alive) return
            tokenRef.current = t
            setMe(await res.json())
            setPhase('ready')
            return
          }
        } catch { /* try the next token */ }
      }
      if (alive) setPhase('gate')
    })()
    return () => { alive = false }
  }, [])

  // ----- Live updates: new applications and shift changes -----
  useEffect(() => {
    if (phase !== 'ready') return
    const socket = io(API_BASE, { auth: { token: tokenRef.current } })
    const bump = () => { refreshAll() }
    socket.on('driverRegistered', (d: any) => { say(true, `New driver application: ${d?.name || 'a driver'}`); bump() })
    socket.on('driverOnline', bump)
    socket.on('driverOffline', bump)
    return () => { socket.disconnect() }
  }, [phase, refreshAll, say])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4500)
    return () => clearTimeout(t)
  }, [toast])

  const signOut = () => {
    localStorage.removeItem('driver_token')
    localStorage.removeItem('driver_data')
    window.location.href = '/driver-login'
  }

  // ----- Screens -----
  if (phase === 'loading') {
    return (<div className="fp"><style>{CSS}</style><div className="fp-load">Opening the fleet portal…</div></div>)
  }

  if (phase === 'gate' || !me) {
    return (
      <div className="fp">
        <style>{CSS}</style>
        <div className="fp-gate">
          <div className="fp-card">
            <div style={{ fontSize: 44 }}>🛺</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: '6px 0' }}>TETFund Fleet Portal</h1>
            <p style={{ color: 'var(--mut)', fontSize: 14 }}>This area is for the Fleet Head and fleet admins. Choose how you sign in.</p>
            <a className="fp-btn fp-p" href="/login?redirect=/fleet">I’m the Fleet Head (UniWeb sign-in)</a>
            <a className="fp-btn fp-g" href="/driver-login?next=/fleet">I’m a fleet admin (driver sign-in)</a>
          </div>
        </div>
      </div>
    )
  }

  const roleLabel = me.actor.kind === 'head' ? 'Fleet Head' : me.actor.kind === 'superadmin' ? 'Super Admin' : 'Fleet Admin'

  return (
    <div className="fp">
      <style>{CSS}</style>

      <header className="fp-top">
        <div className="fp-brand">
          <i>🛺</i>
          <div><b>TETFund Campus Tricycle Fleet</b><small>Fleet portal · Powered by UniWeb</small></div>
        </div>
        <div className="fp-who">
          <span>{me.actor.name} · {roleLabel}</span>
          {me.actor.isHead ? (
            <Link className="fp-link" href="/dashboard">← UniWeb</Link>
          ) : (
            <>
              <Link className="fp-link" href="/driver">Driver app</Link>
              <button className="fp-link" onClick={signOut}>Sign out</button>
            </>
          )}
        </div>
      </header>

      <nav className="fp-tabs" aria-label="Fleet sections">
        {TABS.map(([key, label, icon]) => (
          <button key={key} className={`fp-tab${tab === key ? ' on' : ''}`} onClick={() => setTab(key)}>
            <span>{icon}</span>{label}
            {key === 'approvals' && me.counts.pending > 0 && <span className="fp-badge">{me.counts.pending}</span>}
          </button>
        ))}
      </nav>

      <main className="fp-main">
        {tab === 'overview' && <Overview me={me} api={api} goTab={setTab} version={version} />}
        {tab === 'approvals' && <Approvals api={api} say={say} ask={ask} version={version} refreshAll={refreshAll} openDriver={setDrawerId} />}
        {tab === 'drivers' && <DriversTab api={api} version={version} openDriver={setDrawerId} />}
        {tab === 'tricycles' && <VehiclesTab api={api} say={say} ask={ask} version={version} refreshAll={refreshAll} />}
        {tab === 'today' && <TodayTab api={api} say={say} ask={ask} version={version} refreshAll={refreshAll} me={me} />}
        {tab === 'messages' && <Announcements api={api} say={say} version={version} refreshAll={refreshAll} composeFor={composeFor} clearCompose={() => setComposeFor(null)} />}
        {tab === 'live' && <LiveTab api={api} version={version} />}
        {tab === 'activity' && <ActivityTab api={api} version={version} />}
      </main>

      {drawerId && (
        <DriverDrawer
          id={drawerId}
          me={me}
          api={api}
          say={say}
          ask={ask}
          version={version}
          refreshAll={refreshAll}
          onClose={() => setDrawerId(null)}
          composeTo={(d: { id: string; name: string }) => { setComposeFor(d); setDrawerId(null); setTab('messages') }}
        />
      )}

      {dialog && <ConfirmDialog cfg={dialog} onClose={() => setDialog(null)} />}
      {toast && <div className={`fp-toast ${toast.ok ? 'ok' : 'bad'}`} role="status">{toast.text}</div>}
    </div>
  )
}