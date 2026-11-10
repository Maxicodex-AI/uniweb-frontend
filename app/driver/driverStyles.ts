// app/driver/driverStyles.ts
// Shared styles for the driver sign-in page and the driver app. Mobile first:
// drivers use these on a phone, often in sunlight, so text is large and the
// buttons are big.

export const DRIVER_CSS = `
.dv{--bg:#0b1511;--card:#13241b;--ink:#f1f7f3;--mut:#9fb5a8;--line:#27402f;--accent:#22c55e;--accent-ink:#052e16;--warn:#fbbf24;--bad:#f87171;--bad-bg:#3b1414;--ok-bg:#10331d;min-height:100vh;min-height:100dvh;background:var(--bg);color:var(--ink);font-family:Inter,system-ui,-apple-system,'Segoe UI',sans-serif;line-height:1.5;transition:background .5s}
.dv.live{background:linear-gradient(160deg,#052e16,#14532d)}
.dv *{box-sizing:border-box}
.dv h1,.dv h2,.dv h3,.dv p{margin:0}
.dv a{color:inherit;text-decoration:none}
.dv button{font-family:inherit;cursor:pointer}
.dv :focus-visible{outline:3px solid var(--warn);outline-offset:2px;border-radius:8px}

.dv-wrap{max-width:480px;margin:0 auto;padding:20px 18px 48px}
.dv-center{min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:20px}
.dv-card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:22px;width:100%}
.dv-card.glass{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.14)}
.dv-logo{text-align:center;margin-bottom:18px}
.dv-logo i{font-style:normal;font-size:52px;display:block}
.dv-logo h1{font-size:22px;font-weight:800;margin-top:4px}
.dv-logo p{color:var(--mut);font-size:14px;margin-top:2px}

.dv-tabs{display:flex;background:rgba(255,255,255,.06);border-radius:12px;padding:4px;margin-bottom:18px}
.dv-tabs button{flex:1;border:0;background:none;color:var(--mut);padding:11px;border-radius:9px;font-size:15px;font-weight:700}
.dv-tabs button.on{background:var(--accent);color:var(--accent-ink)}
.dv-label{display:block;font-size:13px;font-weight:700;color:var(--mut);margin:14px 0 6px}
.dv-input{width:100%;border:1.5px solid var(--line);background:#0e1c15;color:var(--ink);border-radius:12px;padding:14px;font-size:16px;font-family:inherit}
.dv-input::placeholder{color:#5f7a6b}
.dv-hint{font-size:12px;color:var(--mut);margin-top:5px}
.dv-check{display:flex;gap:12px;align-items:flex-start;background:rgba(255,255,255,.05);border:1px solid var(--line);border-radius:12px;padding:14px;margin-top:18px;font-size:13px;line-height:1.5;color:#d3e3da}
.dv-check input{width:22px;height:22px;margin-top:2px;flex-shrink:0;accent-color:var(--accent)}

.dv-btn{display:block;width:100%;border:0;border-radius:14px;padding:16px;font-size:16px;font-weight:800;text-align:center;transition:opacity .15s,transform .1s}
.dv-btn:active{transform:scale(.98)}
.dv-btn:disabled{opacity:.5;cursor:not-allowed}
.dv-btn.p{background:var(--accent);color:var(--accent-ink);box-shadow:0 8px 24px rgba(34,197,94,.3)}
.dv-btn.g{background:rgba(255,255,255,.1);color:var(--ink)}
.dv-btn.d{background:rgba(248,113,113,.16);color:var(--bad)}
.dv-btn.b{background:rgba(96,165,250,.16);color:#93c5fd}
.dv-btn + .dv-btn{margin-top:10px}
.dv-alert{border-radius:12px;padding:12px 14px;font-size:14px;margin-top:14px}
.dv-alert.bad{background:var(--bad-bg);color:#fecaca;border:1px solid #7f1d1d}
.dv-alert.ok{background:var(--ok-bg);color:#bbf7d0;border:1px solid #166534}
.dv-alert.warn{background:#3a2a08;color:#fde68a;border:1px solid #78350f}
.dv-link{display:inline-block;color:var(--mut);font-size:13px;margin-top:16px}

.dv-top{background:rgba(0,0,0,.3);padding:14px 18px;display:flex;align-items:center;gap:12px}
.dv-top .who{flex:1;min-width:0}
.dv-top b{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dv-top small{color:var(--mut);font-size:12px}
.dv-icon{position:relative;width:42px;height:42px;border-radius:12px;border:0;background:rgba(255,255,255,.12);color:#fff;font-size:18px}
.dv-dot{position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;border-radius:999px;font-size:11px;font-weight:800;padding:1px 6px}
.dv-mini{border:0;background:rgba(255,255,255,.12);color:#fff;border-radius:10px;padding:9px 13px;font-size:13px;font-weight:700}

.dv-status{text-align:center;margin-bottom:18px}
.dv-status .big{font-size:60px;line-height:1.1}
.dv-status h2{font-size:22px;font-weight:900;margin:6px 0 2px}
.dv-status p{color:var(--mut);font-size:14px}
.dv-gps{margin-top:12px;font-size:12px;color:#86efac}
.dv-seats{display:flex;align-items:center;justify-content:center;gap:22px;margin:6px 0 4px}
.dv-seats button{width:76px;height:76px;border-radius:50%;border:0;font-size:36px;font-weight:900;color:#fff;box-shadow:0 4px 16px rgba(0,0,0,.3)}
.dv-seats button:disabled{background:#374151!important;cursor:not-allowed}
.dv-seats .num{font-size:66px;font-weight:900;line-height:1;text-align:center}
.dv-seats .of{font-size:13px;color:var(--mut);text-align:center;margin-top:4px}
.dv-pips{display:flex;justify-content:center;gap:8px;margin:18px 0 6px}
.dv-pips span{width:40px;height:40px;border-radius:10px;display:grid;place-items:center;font-size:20px;transition:background .2s}
.dv-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}
.dv-info{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}
.dv-info div{background:rgba(255,255,255,.07);border-radius:12px;padding:13px}
.dv-info small{display:block;color:var(--mut);font-size:11px}
.dv-info b{font-size:14px;word-break:break-word}

.dv-vlist{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0}
.dv-v{border:2px solid var(--line);background:#0e1c15;color:var(--ink);border-radius:14px;padding:16px 10px;text-align:center}
.dv-v.on{border-color:var(--accent);background:var(--ok-bg)}
.dv-v b{display:block;font-size:18px}
.dv-v small{color:var(--mut);font-size:12px}

.dv-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:100;display:flex;align-items:flex-end;justify-content:center}
.dv-sheet{background:var(--card);border:1px solid var(--line);border-radius:22px 22px 0 0;width:100%;max-width:520px;max-height:88vh;overflow:auto;padding:20px 18px 28px;animation:dv-up .25s ease}
.dv-sheet.urgent{border-color:#ef4444;border-width:2px}
.dv-sheet h3{font-size:18px;font-weight:800}
.dv-ann{border-top:1px solid var(--line);padding:14px 0}
.dv-ann:first-of-type{border-top:0}
.dv-ann b{display:block;font-size:15px}
.dv-ann p{font-size:14px;color:#d3e3da;margin:4px 0}
.dv-ann small{color:var(--mut);font-size:11px}
.dv-ann.unread b::before{content:'● ';color:#ef4444}
.dv-tag{display:inline-block;background:#7f1d1d;color:#fecaca;border-radius:999px;font-size:11px;font-weight:800;padding:2px 9px;margin-bottom:6px}

@keyframes dv-up{from{transform:translateY(30px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.dv *{animation:none!important;transition:none!important}}
`