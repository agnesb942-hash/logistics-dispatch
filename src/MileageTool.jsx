// ─────────────────────────────────────────────────────────────────
//  FLEETOPS 里程管理模組  v4.1.0
//  ✦ 資料來源: Firebase Firestore (logi-tool)
//  ✦ Collections: drivers/{id}, vehicles/{id}, logs/{id}, settings/main
//  ✦ Props: onBack (function) — 返回首頁
// ─────────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Truck, Home, BarChart3, Users, FileText, Plus, Trash2,
  Download, Upload, LogOut, ChevronRight, ChevronLeft, Check, X,
  AlertTriangle, CheckCircle, Loader, ArrowRight, Lock, Cpu,
  Activity, Navigation, Menu, MapPin, Sparkles, LayoutGrid, ArrowLeft,
} from 'lucide-react';
import {
  collection, doc, getDocs, getDoc, setDoc, addDoc, deleteDoc,
  updateDoc, onSnapshot, serverTimestamp, query, orderBy, limit,
} from 'firebase/firestore';
import { db } from '../firebase';

// ── DESIGN TOKENS ──────────────────────────────────────────────
const C = {
  bg0: '#04060a', bg1: '#070b11', bg2: '#0c1119', bg3: '#111821', bg4: '#171f2c',
  bd: '#1c2a3a', bdL: '#243447',
  cy: '#22d3ee', cyD: 'rgba(34,211,238,.1)', cyG: 'rgba(34,211,238,.04)',
  am: '#fbbf24', amD: 'rgba(251,191,36,.1)',
  gn: '#34d399', gnD: 'rgba(52,211,153,.1)',
  rd: '#f87171', rdD: 'rgba(248,113,113,.1)',
  t1: '#e2e8f0', t2: '#8fa3b8', t3: '#3d5268',
};

const BTM = {
  cy:    { bg: C.cy,  color: '#04060a', border: 'none' },
  am:    { bg: C.am,  color: '#04060a', border: 'none' },
  gn:    { bg: C.gn,  color: '#04060a', border: 'none' },
  rd:    { bg: C.rd,  color: '#fff',    border: 'none' },
  ghost: { bg: 'transparent', color: C.t2, border: `1px solid ${C.bd}` },
  dark:  { bg: C.bg3, color: C.t1,  border: `1px solid ${C.bd}` },
  link:  { bg: 'transparent', color: C.t2, border: 'none' },
};

const G = {
  btn: (v = 'cy', sm = false) => {
    const { bg, color, border } = BTM[v] || BTM.cy;
    return {
      background: bg, color, border, borderRadius: 6, cursor: 'pointer',
      fontFamily: 'inherit', fontWeight: 700,
      fontSize: sm ? 12 : 14,
      padding: sm ? '6px 12px' : '10px 18px',
      display: 'inline-flex', alignItems: 'center',
      justifyContent: 'center', gap: 6,
      transition: 'opacity .15s, transform .1s',
      letterSpacing: '.02em',
    };
  },
  inp: (err = false, lg = false, mono = false, center = false) => ({
    width: '100%', boxSizing: 'border-box',
    background: C.bg0, border: `1px solid ${err ? C.rd : C.bd}`,
    borderRadius: 6, padding: lg ? '14px 12px' : '10px 12px',
    color: C.t1, fontSize: lg ? 26 : 14,
    fontFamily: mono ? "'Courier New', monospace" : 'inherit',
    fontWeight: lg ? 700 : 400, outline: 'none',
    textAlign: center ? 'center' : 'left',
  }),
  card: (accent = false) => ({
    background: C.bg2,
    border: `1px solid ${accent ? C.cy + '44' : C.bd}`,
    borderRadius: 10, overflow: 'hidden',
    ...(accent ? { borderTop: `2px solid ${C.cy}` } : {}),
  }),
};

// ── UTILS ──────────────────────────────────────────────────────
const fmt    = (n) => Number(n || 0).toLocaleString();
const clean  = (v) => parseFloat(String(v || 0).replace(/,/g, '')) || 0;
const uid    = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fmtDt  = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
};
const curMonth = () => {
  const n = new Date();
  return (n.getDate() <= 5
    ? new Date(n.getFullYear(), n.getMonth() - 1, 1)
    : n
  ).toISOString().slice(0, 7);
};
const parseCSVText = (text) =>
  text.trim().split('\n').slice(1)
    .map((l) => l.split(',').map((p) => p.trim().replace(/^"|"$/g, '')));

// ── FIRESTORE HELPERS ──────────────────────────────────────────
const COL = { d: 'drivers', v: 'vehicles', l: 'logs', s: 'settings' };

async function fsAdd(col, data) {
  const ref = await addDoc(collection(db, col), { ...data, _ts: serverTimestamp() });
  return ref.id;
}
async function fsSet(col, id, data) {
  await setDoc(doc(db, col, id), { ...data, _ts: serverTimestamp() }, { merge: true });
}
async function fsDel(col, id) {
  await deleteDoc(doc(db, col, id));
}
async function fsUpdate(col, id, data) {
  await updateDoc(doc(db, col, id), { ...data, _ts: serverTimestamp() });
}
function useCollection(col, transform) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, col), (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setData(transform ? transform(docs) : docs);
      setLoading(false);
    });
    return unsub;
  }, [col]);
  return { data, loading };
}

// ── SHARED UI ──────────────────────────────────────────────────
const Lbl = ({ c }) => (
  <div style={{ color: C.t3, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>{c}</div>
);
const Tag = ({ c, label }) => (
  <span style={{ background: c + '22', color: c, border: `1px solid ${c}44`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em' }}>{label}</span>
);
const TH = ({ c }) => (
  <th style={{ padding: '10px 14px', textAlign: 'left', color: C.t3, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', background: C.bg1, whiteSpace: 'nowrap' }}>{c}</th>
);

function Toast({ msg, onDone }) {
  useEffect(() => {
    if (msg) { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }
  }, [msg]);
  if (!msg) return null;
  const e = msg.type === 'error';
  return (
    <div style={{
      position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
      padding: '10px 20px', borderRadius: 24, background: e ? '#1a0707' : '#071a0e',
      border: `1px solid ${e ? C.rd + '55' : C.gn + '55'}`, color: e ? C.rd : C.gn,
      fontWeight: 700, fontSize: 13, boxShadow: '0 12px 40px rgba(0,0,0,.7)',
      display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
    }}>
      {e ? <AlertTriangle size={14} /> : <CheckCircle size={14} />} {msg.text}
    </div>
  );
}

function Confirm({ title, body, onOk, onCancel, danger }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 8000, background: 'rgba(0,0,0,.8)',
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20,
    }}>
      <div style={{ ...G.card(), padding: 24, maxWidth: 400, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,.8)' }}>
        <div style={{ color: C.t1, fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{title}</div>
        <div style={{ color: C.t2, fontSize: 14, lineHeight: 1.6, marginBottom: 22 }}>{body}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ ...G.btn('ghost'), flex: 1 }}>取消</button>
          <button onClick={onOk}     style={{ ...G.btn(danger ? 'rd' : 'cy'), flex: 1 }}>確認</button>
        </div>
      </div>
    </div>
  );
}

// ── NAV ────────────────────────────────────────────────────────
const VIEWS = ['home', 'report', 'dashboard', 'vehicles', 'drivers', 'logs'];
const VL = { home: '主頁', report: '里程回報', dashboard: '分析報表', vehicles: '車輛管理', drivers: '人員管理', logs: '申報日誌' };
const VI = { home: Home, report: Navigation, dashboard: BarChart3, vehicles: Truck, drivers: Users, logs: FileText };

function TopNav({ view, setView, isAdmin, adminMode, setAdminMode, onBack }) {
  const [mOpen, setMOpen] = useState(false);
  const navItems = isAdmin ? VIEWS : ['home', 'report'];

  const NavBtn = ({ id }) => {
    const Icon = VI[id];
    const active = view === id;
    return (
      <button onClick={() => { setView(id); setMOpen(false); }} style={{
        background: active ? C.cyD : 'transparent',
        color: active ? C.cy : C.t2,
        border: `1px solid ${active ? C.cy + '44' : 'transparent'}`,
        borderRadius: 6, padding: '7px 14px', cursor: 'pointer',
        fontFamily: 'inherit', fontWeight: 600, fontSize: 13,
        display: 'flex', alignItems: 'center', gap: 6,
        transition: 'all .15s', whiteSpace: 'nowrap',
      }}>
        <Icon size={14} />{VL[id]}
      </button>
    );
  };

  return (
    <>
      <nav style={{ background: C.bg1, borderBottom: `1px solid ${C.bd}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* 返回首頁按鈕 */}
          <button onClick={onBack} style={{ ...G.btn('ghost', true), padding: '6px 10px', flexShrink: 0 }} title="返回平台首頁">
            <ArrowLeft size={14} />
          </button>
          <button onClick={() => setView('home')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
            <div style={{ background: C.cyD, border: `1px solid ${C.cy}33`, borderRadius: 8, padding: 7, lineHeight: 0 }}>
              <Truck size={18} color={C.cy} />
            </div>
            <span style={{ color: C.cy, fontFamily: "'Courier New', monospace", fontWeight: 700, fontSize: 15, letterSpacing: '.1em' }}>FLEETOPS</span>
          </button>

          <div style={{ display: 'flex', gap: 4, marginLeft: 8, flex: 1, overflowX: 'auto' }} className="fo-desktop-nav">
            {navItems.map((id) => <NavBtn key={id} id={id} />)}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexShrink: 0 }}>
            {!adminMode
              ? <button onClick={() => setAdminMode(true)} style={{ ...G.btn('ghost', true) }}><Lock size={12} /> 管理後台</button>
              : <button onClick={() => setAdminMode(false)} style={{ ...G.btn('ghost', true) }}><LogOut size={12} /> 離開後台</button>
            }
            <button onClick={() => setMOpen((o) => !o)} className="fo-mobile-btn"
              style={{ ...G.btn('ghost', true), padding: '8px', display: 'none' }}><Menu size={16} /></button>
          </div>
        </div>
        {mOpen && (
          <div style={{ background: C.bg2, borderTop: `1px solid ${C.bd}`, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navItems.map((id) => <NavBtn key={id} id={id} />)}
          </div>
        )}
      </nav>
      <style>{`
        @media(max-width:640px){
          .fo-desktop-nav{display:none!important}
          .fo-mobile-btn{display:flex!important}
        }
      `}</style>
    </>
  );
}

// ── HOME PAGE ─────────────────────────────────────────────────
function HomePage({ drivers, vehicles, logs, setView, isAdmin, loading }) {
  const thisMonth = curMonth();
  const monthLogs = useMemo(() => logs.filter((l) => l.reportMonth === thisMonth), [logs, thisMonth]);
  const totalKM   = useMemo(() => monthLogs.reduce((s, l) => s + (l.calculatedKM || 0), 0), [monthLogs]);
  const activeV   = useMemo(() => new Set(monthLogs.map((l) => l.vehicleId)).size, [monthLogs]);

  const STATS = [
    { label: '本月總里程', val: `${fmt(totalKM)} KM`, icon: Activity,  color: C.cy },
    { label: '活躍車輛',   val: `${activeV} / ${vehicles.length} 輛`, icon: Truck,    color: C.am },
    { label: '人員總數',   val: `${drivers.length} 人`,                icon: Users,    color: C.gn },
    { label: '本月申報',   val: `${monthLogs.length} 筆`,              icon: FileText, color: '#a78bfa' },
  ];

  const MODULES = [
    { id: 'report',    icon: Navigation, color: C.cy,     title: '里程回報',  desc: '提交月底結算或跨車支援里程', live: true },
    { id: 'dashboard', icon: BarChart3,  color: C.am,     title: '分析報表',  desc: '績效儀表板、趨勢與 AI 診斷', live: true,  admin: true },
    { id: 'vehicles',  icon: Truck,      color: C.gn,     title: '車輛管理',  desc: '車牌建檔、里程基準、匯入匯出', live: true,  admin: true },
    { id: 'drivers',   icon: Users,      color: '#a78bfa',title: '人員管理',  desc: '司機名單、部門分類、資料維護', live: true,  admin: true },
    { id: 'logs',      icon: FileText,   color: C.t2,     title: '申報日誌',  desc: '完整稽核記錄與操作歷程匯出', live: true,  admin: true },
    { id: null,        icon: MapPin,     color: C.t3,     title: '路線規劃',  desc: '智慧派車與最佳路徑（即將推出）', live: false },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px 64px' }}>
      <div style={{ padding: '48px 0 40px', borderBottom: `1px solid ${C.bd}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${C.cyG} 1px,transparent 1px),linear-gradient(90deg,${C.cyG} 1px,transparent 1px)`, backgroundSize: '40px 40px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: loading ? C.am : C.gn, boxShadow: `0 0 10px ${loading ? C.am : C.gn}`, animation: 'fopulse 2s infinite' }} />
            <span style={{ color: loading ? C.am : C.gn, fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase' }}>
              {loading ? '雲端同步中...' : '系統連線 ONLINE'}
            </span>
            <span style={{ color: C.t3, fontSize: 11, marginLeft: 8 }}>{thisMonth}</span>
          </div>
          <h1 style={{ color: C.t1, fontSize: 'clamp(28px,6vw,52px)', fontFamily: "'Courier New', monospace", fontWeight: 700, letterSpacing: '.05em', lineHeight: 1, marginBottom: 8 }}>
            南區物流<span style={{ color: C.cy }}>車隊管理平台</span>
          </h1>
          <p style={{ color: C.t2, fontSize: 14, letterSpacing: '.05em' }}>DANCELIGHT LOGISTICS · 南區物流部 · v4.1.0</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, padding: '24px 0' }}>
        {STATS.map(({ label, val, icon: Icon, color }) => (
          <div key={label} style={{ ...G.card(), padding: '18px 20px', borderLeft: `3px solid ${color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: C.t3, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>{label}</div>
                <div style={{ color, fontFamily: "'Courier New', monospace", fontSize: 'clamp(16px,3vw,22px)', fontWeight: 700 }}>{val}</div>
              </div>
              <div style={{ background: color + '15', borderRadius: 8, padding: 8, lineHeight: 0 }}>
                <Icon size={18} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ color: C.t3, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <LayoutGrid size={12} /> 功能模組
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
          {MODULES.map(({ id, icon: Icon, color, title, desc, live, admin }) => {
            const canUse = live && (isAdmin || !admin);
            return (
              <button key={title} onClick={() => canUse && id && setView(id)} style={{
                background: C.bg2, border: `1px solid ${canUse ? C.bd : C.bg3}`,
                borderRadius: 10, padding: '20px 18px', cursor: canUse ? 'pointer' : 'default',
                textAlign: 'left', fontFamily: 'inherit', outline: 'none', transition: 'all .2s', opacity: canUse ? 1 : .45,
              }}
                onMouseEnter={(e) => { if (canUse) { e.currentTarget.style.borderColor = color + '66'; e.currentTarget.style.background = C.bg3; } }}
                onMouseLeave={(e) => { if (canUse) { e.currentTarget.style.borderColor = C.bd; e.currentTarget.style.background = C.bg2; } }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ background: color + '18', border: `1px solid ${color}33`, borderRadius: 8, padding: 9, lineHeight: 0 }}>
                    <Icon size={20} color={color} />
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {!live && <Tag c={C.t3} label="即將推出" />}
                    {admin && live && !isAdmin && <Tag c={C.am} label="需授權" />}
                    {live && (isAdmin || !admin) && <Tag c={C.gn} label="可用" />}
                  </div>
                </div>
                <div style={{ color: canUse ? C.t1 : C.t3, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{title}</div>
                <div style={{ color: C.t3, fontSize: 12, lineHeight: 1.5 }}>{desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {logs.length > 0 && (
        <div>
          <div style={{ color: C.t3, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={12} /> 最近申報記錄
          </div>
          <div style={{ ...G.card(), overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
              <thead><tr style={{ background: C.bg1 }}>
                {['時間', '申報人', '車牌', '月份', '里程'].map((h) => (
                  <TH key={h} c={h} />
                ))}
              </tr></thead>
              <tbody>
                {logs.slice(0, 6).map((l) => (
                  <tr key={l.id} style={{ borderTop: `1px solid ${C.bg3}` }}>
                    <td style={{ padding: '10px 14px', color: C.t3, fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDt(l.timestamp).slice(5, 16)}</td>
                    <td style={{ padding: '10px 14px', color: C.t1, fontWeight: 600, whiteSpace: 'nowrap' }}>{l.driverName}</td>
                    <td style={{ padding: '10px 14px', color: C.cy, fontFamily: "'Courier New', monospace", fontWeight: 700, whiteSpace: 'nowrap' }}>{l.vehicleId}</td>
                    <td style={{ padding: '10px 14px', color: C.t2, fontSize: 13 }}>{l.reportMonth}</td>
                    <td style={{ padding: '10px 14px', color: C.am, fontFamily: "'Courier New', monospace", fontWeight: 700, whiteSpace: 'nowrap' }}>+{fmt(l.calculatedKM)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <style>{`@keyframes fopulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}

// ── REPORT PAGE ───────────────────────────────────────────────
function ReportPage({ drivers, vehicles, onSubmit }) {
  const [step, setStep]       = useState(1);
  const [driver, setDriver]   = useState(null);
  const [mode, setMode]       = useState('monthly');
  const [month, setMonth]     = useState(curMonth());
  const [vehicle, setVehicle] = useState(null);
  const [endOdo, setEndOdo]   = useState('');
  const [crossMode, setCrossMode] = useState('range');
  const [sKM, setSKM] = useState(''); const [eKM, setEKM] = useState(''); const [dKM, setDKM] = useState('');
  const [busy, setBusy]   = useState(false);
  const [done, setDone]   = useState(false);
  const [lastKM, setLastKM] = useState(0);
  const [dept, setDept]   = useState('全部');

  const depts   = useMemo(() => ['全部', ...Array.from(new Set(drivers.map((d) => d.department || '未分類')))], [drivers]);
  const dlist   = useMemo(() => dept === '全部' ? drivers : drivers.filter((d) => d.department === dept), [drivers, dept]);
  const calc    = useMemo(() => {
    if (mode === 'monthly') { const b = clean(vehicle?.currentMileage ?? 0), e = clean(endOdo); return { start: b, end: e, km: e - b }; }
    if (crossMode === 'range') { const s = clean(sKM), e = clean(eKM); return { start: s, end: e, km: e - s }; }
    return { start: 0, end: 0, km: clean(dKM) };
  }, [mode, vehicle, endOdo, crossMode, sKM, eKM, dKM]);

  const canGo = () => {
    if (!vehicle) return false;
    if (mode === 'monthly')    return endOdo !== '' && calc.km >= 0;
    if (crossMode === 'range') return sKM !== '' && eKM !== '' && calc.km >= 0;
    return dKM !== '' && clean(dKM) > 0;
  };
  const reset = () => { setStep(1); setDriver(null); setVehicle(null); setEndOdo(''); setSKM(''); setEKM(''); setDKM(''); setMode('monthly'); setCrossMode('range'); setDone(false); };
  const submit = async () => {
    setBusy(true);
    try {
      await onSubmit(
        { type: mode, driverName: driver.name, department: driver.department, vehicleId: vehicle.id, reportMonth: month, startMileage: calc.start, endMileage: calc.end, calculatedKM: calc.km, crossMode: mode === 'cross' ? crossMode : null, timestamp: new Date().toISOString() },
        mode === 'monthly' ? { vehicleId: vehicle.id, newMileage: calc.end, driverName: driver.name } : null
      );
      setLastKM(calc.km); setDone(true);
    } finally { setBusy(false); }
  };

  const W = { maxWidth: 540, margin: '0 auto', padding: '24px 16px' };
  const Progress = () => (
    <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
      {[1, 2, 3, 4].map((s) => <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: step > s ? C.cy : step === s ? C.cy + '88' : C.bg4, transition: 'background .3s' }} />)}
    </div>
  );

  if (done) return (
    <div style={{ ...W, textAlign: 'center', paddingTop: 60 }}>
      <div style={{ width: 70, height: 70, borderRadius: '50%', background: C.gnD, border: `2px solid ${C.gn}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Check size={32} color={C.gn} />
      </div>
      <div style={{ color: C.gn, fontWeight: 700, fontSize: 22, marginBottom: 5 }}>申報成功</div>
      <div style={{ color: C.t2, fontSize: 14, marginBottom: 4 }}>{driver?.name} · {vehicle?.id} · {month}</div>
      <div style={{ color: C.am, fontFamily: "'Courier New',monospace", fontSize: 42, fontWeight: 700, margin: '16px 0 32px' }}>
        +{fmt(lastKM)} <span style={{ fontSize: 16, opacity: .5 }}>KM</span>
      </div>
      <button onClick={reset} style={{ ...G.btn('cy'), padding: '12px 32px', fontSize: 15 }}>繼續申報</button>
    </div>
  );

  if (step === 1) return (
    <div style={W}>
      <Progress />
      <div style={{ color: C.cy, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 8 }}>STEP 01 / 04</div>
      <h2 style={{ color: C.t1, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>選擇您的名字</h2>
      <p style={{ color: C.t2, fontSize: 13, marginBottom: 20 }}>點選對應的回報人員</p>
      {depts.length > 2 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {depts.map((d) => <button key={d} onClick={() => setDept(d)} style={{ ...G.btn(dept === d ? 'cy' : 'ghost', true), borderRadius: 20 }}>{d}</button>)}
        </div>
      )}
      {dlist.length === 0 && <div style={{ color: C.t3, padding: '32px 0', textAlign: 'center', fontSize: 14 }}>尚無人員，請由管理後台新增</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {dlist.map((d) => (
          <button key={d.id} onClick={() => { setDriver(d); setStep(2); }} style={{
            background: C.bg2, border: `1px solid ${C.bd}`, borderRadius: 8, padding: '14px',
            cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', outline: 'none', transition: 'all .15s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.cy + '66'; e.currentTarget.style.background = C.cyD; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.bd; e.currentTarget.style.background = C.bg2; }}>
            <div style={{ color: C.t1, fontWeight: 700, fontSize: 15 }}>{d.name}</div>
            <div style={{ color: C.t3, fontSize: 11, marginTop: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>{d.department}</div>
          </button>
        ))}
      </div>
    </div>
  );

  if (step === 2) return (
    <div style={W}>
      <Progress />
      <button onClick={() => setStep(1)} style={{ ...G.btn('link'), marginBottom: 14, marginLeft: -6, fontSize: 13 }}><ChevronLeft size={13} /> 返回</button>
      <div style={{ color: C.cy, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 8 }}>STEP 02 / 04</div>
      <h2 style={{ color: C.t1, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>申報類型</h2>
      <p style={{ color: C.t2, fontSize: 13, marginBottom: 18 }}>已選：<span style={{ color: C.cy }}>{driver?.name}</span></p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {[{ id: 'monthly', title: '月底結算', desc: '輸入本月最終儀表總讀數，系統自動計算行駛差額' },
          { id: 'cross',   title: '跨車支援', desc: '臨時借用其他車輛，記錄本次行駛里程' }].map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            background: mode === m.id ? C.gnD : C.bg2, border: `2px solid ${mode === m.id ? C.gn : C.bd}`,
            borderRadius: 8, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', outline: 'none', transition: 'all .15s',
          }}>
            <div style={{ color: mode === m.id ? C.gn : C.t1, fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{m.title}</div>
            <div style={{ color: C.t2, fontSize: 13 }}>{m.desc}</div>
          </button>
        ))}
      </div>
      <Lbl c="申報月份" />
      <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ ...G.inp(), colorScheme: 'dark', marginBottom: 20 }} />
      <button onClick={() => setStep(3)} style={{ ...G.btn('cy'), width: '100%', padding: '12px', fontSize: 15 }}>下一步 <ChevronRight size={16} /></button>
    </div>
  );

  if (step === 3) return (
    <div style={W}>
      <Progress />
      <button onClick={() => setStep(2)} style={{ ...G.btn('link'), marginBottom: 14, marginLeft: -6, fontSize: 13 }}><ChevronLeft size={13} /> 返回</button>
      <div style={{ color: C.cy, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 8 }}>STEP 03 / 04</div>
      <h2 style={{ color: C.t1, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{mode === 'monthly' ? '月底結算' : '跨車支援'}</h2>
      <p style={{ color: C.t2, fontSize: 13, marginBottom: 18 }}>{driver?.name} · <span style={{ color: C.cy }}>{month}</span></p>
      <Lbl c="選擇車牌號碼" />
      <select value={vehicle?.id || ''} onChange={(e) => setVehicle(vehicles.find((x) => x.id === e.target.value) || null)} style={{ ...G.inp(false, false, true), marginBottom: 18 }}>
        <option value="">── 選取車牌 ──</option>
        {vehicles.map((v) => <option key={v.id} value={v.id}>{v.id}  {v.currentMileage ? `(${fmt(v.currentMileage)} KM)` : ''}</option>)}
      </select>

      {mode === 'monthly' && vehicle && <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.bg0, border: `1px solid ${C.bd}`, borderRadius: 6, padding: '12px 14px', marginBottom: 16 }}>
          <span style={{ color: C.t2, fontSize: 13 }}>上次結算里程（系統基準）</span>
          <span style={{ color: C.cy, fontFamily: "'Courier New',monospace", fontWeight: 700, fontSize: 18 }}>{fmt(vehicle.currentMileage)} KM</span>
        </div>
        <Lbl c="本月最終儀表讀數 (KM)" />
        <input type="number" value={endOdo} onChange={(e) => setEndOdo(e.target.value)} placeholder="輸入目前儀表總里程" inputMode="numeric"
          style={{ ...G.inp(endOdo !== '' && calc.km < 0, true, true, true), marginBottom: 12 }} />
        {endOdo !== '' && (
          <div style={{ background: calc.km >= 0 ? C.gnD : C.rdD, border: `1px solid ${calc.km >= 0 ? C.gn + '44' : C.rd + '44'}`, borderRadius: 6, padding: '12px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: C.t2, fontSize: 13 }}>{calc.km >= 0 ? '本月行駛里程' : '⚠ 讀數低於系統基準'}</span>
            <span style={{ color: calc.km >= 0 ? C.gn : C.rd, fontFamily: "'Courier New',monospace", fontWeight: 700, fontSize: 20 }}>{calc.km >= 0 ? '+' : ''}{fmt(calc.km)} KM</span>
          </div>
        )}
      </>}

      {mode === 'cross' && <>
        <div style={{ display: 'flex', gap: 3, background: C.bg0, padding: 3, borderRadius: 6, marginBottom: 14, border: `1px solid ${C.bd}` }}>
          {[{ id: 'range', l: '輸入起訖讀數' }, { id: 'direct', l: '直接輸入里程' }].map((m) => (
            <button key={m.id} onClick={() => setCrossMode(m.id)} style={{ flex: 1, padding: '9px', borderRadius: 4, border: 'none', cursor: 'pointer', background: crossMode === m.id ? C.bg3 : 'transparent', color: crossMode === m.id ? C.t1 : C.t2, fontWeight: 700, fontSize: 13, fontFamily: 'inherit' }}>{m.l}</button>
          ))}
        </div>
        {crossMode === 'range'
          ? <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 14 }}>
              <div style={{ flex: 1 }}><Lbl c="起始讀數" /><input type="number" value={sKM} onChange={(e) => setSKM(e.target.value)} style={G.inp()} placeholder="0" inputMode="numeric" /></div>
              <div style={{ color: C.t3, paddingBottom: 11 }}><ArrowRight size={16} /></div>
              <div style={{ flex: 1 }}><Lbl c="結束讀數" /><input type="number" value={eKM} onChange={(e) => setEKM(e.target.value)} style={G.inp(eKM !== '' && calc.km < 0)} placeholder="0" inputMode="numeric" /></div>
            </div>
          : <div style={{ marginBottom: 14 }}><Lbl c="本次行駛公里數" /><input type="number" value={dKM} onChange={(e) => setDKM(e.target.value)} placeholder="0" inputMode="numeric" style={G.inp(false, true, true, true)} /></div>
        }
        {calc.km > 0 && (
          <div style={{ background: C.gnD, border: `1px solid ${C.gn}44`, borderRadius: 6, padding: '12px 14px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: C.t2, fontSize: 13 }}>本次行駛里程</span>
            <span style={{ color: C.gn, fontFamily: "'Courier New',monospace", fontWeight: 700, fontSize: 20 }}>+{fmt(calc.km)} KM</span>
          </div>
        )}
      </>}

      <div style={{ marginTop: 20 }}>
        <button onClick={() => setStep(4)} disabled={!canGo()} style={{ ...G.btn('cy'), width: '100%', padding: '12px', fontSize: 15, opacity: canGo() ? 1 : .3 }}>確認申報 <ChevronRight size={16} /></button>
      </div>
    </div>
  );

  if (step === 4) return (
    <div style={W}>
      <Progress />
      <button onClick={() => setStep(3)} style={{ ...G.btn('link'), marginBottom: 14, marginLeft: -6, fontSize: 13 }}><ChevronLeft size={13} /> 返回修改</button>
      <div style={{ color: C.cy, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 8 }}>STEP 04 / 04 · 確認提交</div>
      <h2 style={{ color: C.t1, fontSize: 22, fontWeight: 700, marginBottom: 18 }}>請確認申報資訊</h2>
      <div style={G.card()}>
        {[['申報人員', driver?.name], ['所屬部門', driver?.department], ['申報月份', month], ['車牌號碼', vehicle?.id], ['申報類型', mode === 'monthly' ? '月底結算' : '跨車支援'],
          ...(mode === 'monthly' || (mode === 'cross' && crossMode === 'range') ? [['起始里程', fmt(calc.start) + ' KM'], ['結束里程', fmt(calc.end) + ' KM']] : [])
        ].map(([l, v], i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 16px', borderBottom: `1px solid ${C.bg3}` }}>
            <span style={{ color: C.t2, fontSize: 13 }}>{l}</span>
            <span style={{ color: C.t1, fontWeight: 600, fontSize: 14 }}>{v}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: C.gnD, alignItems: 'center' }}>
          <span style={{ color: C.gn, fontWeight: 700 }}>本次行駛里程</span>
          <span style={{ color: C.gn, fontFamily: "'Courier New',monospace", fontWeight: 700, fontSize: 28 }}>+{fmt(calc.km)} KM</span>
        </div>
      </div>
      <button onClick={submit} disabled={busy} style={{ ...G.btn('gn'), width: '100%', padding: '14px', fontSize: 15, marginTop: 18, opacity: busy ? .6 : 1 }}>
        {busy ? <><Loader size={15} /> 送出中...</> : <><Check size={16} /> 確認並寫入系統</>}
      </button>
    </div>
  );
  return null;
}

// ── DASHBOARD PAGE ────────────────────────────────────────────
function DashboardPage({ drivers, vehicles, logs }) {
  const [period, setPeriod]     = useState('month');
  const [selMonth, setSelMonth] = useState(curMonth());
  const [aiText, setAiText]     = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const filtered = useMemo(() => {
    const now = new Date();
    return logs.filter((l) => {
      if (!l.reportMonth) return false;
      if (period === 'month')   return l.reportMonth === selMonth;
      if (period === 'quarter') { const q = Math.floor(new Date(l.reportMonth + '-01').getMonth() / 3); return q === Math.floor(now.getMonth() / 3) && l.reportMonth.startsWith(String(now.getFullYear())); }
      if (period === 'year')    return l.reportMonth.startsWith(String(now.getFullYear()));
      return true;
    });
  }, [logs, period, selMonth]);

  const vehicleSummary = useMemo(() => vehicles.map((v) => {
    const vl = filtered.filter((l) => l.vehicleId === v.id);
    const hasM = vl.some((l) => l.type === 'monthly');
    const km = hasM ? vl.filter((l) => l.type === 'monthly').reduce((s, l) => s + (l.calculatedKM || 0), 0) : vl.reduce((s, l) => s + (l.calculatedKM || 0), 0);
    return { id: v.id, km, count: vl.length, drvs: Array.from(new Set(vl.map((l) => l.driverName))).join('、') || '—' };
  }).sort((a, b) => b.km - a.km), [vehicles, filtered]);

  const totalKM = vehicleSummary.reduce((s, v) => s + v.km, 0);

  const driverSummary = useMemo(() => {
    const map = {};
    drivers.forEach((d) => { map[d.name] = 0; });
    filtered.forEach((l) => { map[l.driverName] = (map[l.driverName] || 0) + (l.calculatedKM || 0); });
    return Object.entries(map).map(([name, km]) => ({ name, km })).sort((a, b) => b.km - a.km);
  }, [drivers, filtered]);

  const periodLabel = { month: selMonth, quarter: `${new Date().getFullYear()} Q${Math.floor(new Date().getMonth() / 3) + 1}`, year: `${new Date().getFullYear()} 年度`, all: '全部期間' }[period];

  const exportCSV = () => {
    const rows = vehicleSummary.map((v) => `${v.id},${v.km},"${v.drvs}",${v.count}`);
    const blob = new Blob(['\uFEFF車號,里程(KM),行駛人員,筆數\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `里程報表_${periodLabel}.csv`; a.click();
  };

  const callAI = async () => {
    setAiLoading(true); setAiText('');
    const vDetails = vehicleSummary.map((v) => `  · ${v.id}：${fmt(v.km)} KM（${v.count}筆｜駕駛：${v.drvs}）`).join('\n');
    const dDetails = driverSummary.map((d) => `  · ${d.name}：${fmt(d.km)} KM`).join('\n');
    const prompt = `你是一位資深物流車隊管理顧問，負責分析車隊運營數據並提供專業建議。\n\n【統計週期】${periodLabel}\n【整體概況】\n  · 總里程：${fmt(totalKM)} KM\n  · 活躍車輛：${vehicleSummary.filter((v) => v.km > 0).length} 輛（總計 ${vehicles.length} 輛）\n  · 申報筆數：${filtered.length} 筆\n  · 參與人數：${new Set(filtered.map((l) => l.driverName)).size} 人\n\n【車輛里程明細】\n${vDetails}\n\n【司機里程明細】\n${dDetails}\n\n【零里程項目】\n  · 未申報車輛：${vehicleSummary.filter((v) => v.km === 0).map((v) => v.id).join('、') || '無'}\n  · 零里程司機：${driverSummary.filter((d) => d.km === 0).map((d) => d.name).join('、') || '無'}\n\n請提供以下五項分析（繁體中文，每項以標題開頭，條列格式，語氣專業精準）：\n\n1. 📊 整體績效評估\n2. 🏆 關鍵表現指標\n3. ⚠️ 異常與風險提示\n4. 💡 效率改善建議\n5. 📈 下期管理重點`;
    try {
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');
      setAiText(data.text || 'AI 回應異常，請稍後再試。');
    } catch (e) {
      setAiText('❌ AI 連線失敗：' + e.message + '\n\n請確認 Vercel 後台已正確設定 ANTHROPIC_API_KEY 環境變數。');
    } finally { setAiLoading(false); }
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px 64px' }}>
      <div style={{ padding: '20px 0 16px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['month', '月份'], ['quarter', '本季'], ['year', '年度'], ['all', '全部']].map(([id, l]) => (
          <button key={id} onClick={() => setPeriod(id)} style={{ ...G.btn(period === id ? 'cy' : 'ghost', true), borderRadius: 20 }}>{l}</button>
        ))}
        {period === 'month' && <input type="month" value={selMonth} onChange={(e) => setSelMonth(e.target.value)} style={{ ...G.inp(), width: 'auto', colorScheme: 'dark', padding: '7px 12px', fontSize: 14 }} />}
        <span style={{ flex: 1 }} />
        <button onClick={exportCSV} style={{ ...G.btn('dark', true) }}><Download size={13} /> 匯出 CSV</button>
      </div>

      <div style={{ ...G.card(true), padding: '28px 24px', marginBottom: 16, textAlign: 'center', background: `linear-gradient(135deg,${C.bg2},${C.bg1})` }}>
        <div style={{ color: C.t3, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 8 }}>本期總里程 · {periodLabel}</div>
        <div style={{ color: C.am, fontFamily: "'Courier New',monospace", fontSize: 'clamp(40px,8vw,72px)', fontWeight: 700, lineHeight: 1 }}>
          {fmt(totalKM)} <span style={{ fontSize: 'clamp(16px,3vw,24px)', opacity: .4 }}>KM</span>
        </div>
        <div style={{ color: C.t3, fontSize: 13, marginTop: 8 }}>{filtered.length} 筆申報 · {vehicleSummary.filter((v) => v.km > 0).length} 輛作業 · {new Set(filtered.map((l) => l.driverName)).size} 位司機</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(400px,1fr))', gap: 16, marginBottom: 20 }}>
        <div style={G.card()}>
          <div style={{ padding: '11px 16px', borderBottom: `1px solid ${C.bg3}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck size={14} color={C.am} /><span style={{ color: C.t1, fontWeight: 700, fontSize: 14 }}>車輛里程彙整</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><TH c="車牌" /><TH c="里程 KM" /><TH c="司機" /><TH c="筆數" /></tr></thead>
              <tbody>
                {vehicleSummary.map((v) => (
                  <tr key={v.id} style={{ borderTop: `1px solid ${C.bg3}` }} onMouseEnter={(e) => e.currentTarget.style.background = C.bg3} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 14px', color: C.cy, fontFamily: "'Courier New',monospace", fontWeight: 700 }}>{v.id}</td>
                    <td style={{ padding: '10px 14px', color: C.am, fontFamily: "'Courier New',monospace", fontWeight: 700 }}>{fmt(v.km)}</td>
                    <td style={{ padding: '10px 14px', color: C.t2, fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.drvs}</td>
                    <td style={{ padding: '10px 14px', color: C.t3, fontSize: 13 }}>{v.count}</td>
                  </tr>
                ))}
                {vehicleSummary.length === 0 && <tr><td colSpan={4} style={{ padding: 28, textAlign: 'center', color: C.t3 }}>本期無資料</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div style={G.card()}>
          <div style={{ padding: '11px 16px', borderBottom: `1px solid ${C.bg3}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={14} color={C.cy} /><span style={{ color: C.t1, fontWeight: 700, fontSize: 14 }}>司機里程彙整</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><TH c="姓名" /><TH c="里程 KM" /><TH c="佔比" /></tr></thead>
              <tbody>
                {driverSummary.map((d) => {
                  const pct = totalKM > 0 ? ((d.km / totalKM) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={d.name} style={{ borderTop: `1px solid ${C.bg3}` }} onMouseEnter={(e) => e.currentTarget.style.background = C.bg3} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 14px', color: C.t1, fontWeight: 600 }}>{d.name}</td>
                      <td style={{ padding: '10px 14px', color: d.km > 0 ? C.gn : C.t3, fontFamily: "'Courier New',monospace", fontWeight: 700 }}>{fmt(d.km)}</td>
                      <td style={{ padding: '10px 14px', minWidth: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 4, background: C.bg4, borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: C.gn, borderRadius: 2 }} />
                          </div>
                          <span style={{ color: C.t2, fontSize: 12, minWidth: 36 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={G.card(true)}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.bg3}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: C.cyD, border: `1px solid ${C.cy}33`, borderRadius: 8, padding: 8, lineHeight: 0 }}><Cpu size={16} color={C.cy} /></div>
            <div>
              <div style={{ color: C.t1, fontWeight: 700, fontSize: 15 }}>AI 物流效能診斷</div>
              <div style={{ color: C.t3, fontSize: 12 }}>由 Claude AI 分析本期車隊數據，提供五大面向專業洞察</div>
            </div>
          </div>
          <button onClick={callAI} disabled={aiLoading || totalKM === 0} style={{ ...G.btn('cy'), opacity: aiLoading || totalKM === 0 ? .5 : 1 }}>
            {aiLoading ? <><Loader size={14} /> 分析中...</> : <><Sparkles size={14} /> 執行 AI 分析</>}
          </button>
        </div>
        {!aiText && !aiLoading && <div style={{ padding: 40, textAlign: 'center', color: C.t3, fontSize: 14 }}>{totalKM === 0 ? '本期尚無里程數據。' : '點擊「執行 AI 分析」取得本期診斷報告。'}</div>}
        {aiLoading && <div style={{ padding: 40, textAlign: 'center', color: C.cy, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}><Loader size={16} /> 正在分析數據，請稍候...</div>}
        {aiText && <div style={{ padding: '20px 24px' }}><pre style={{ color: C.t2, fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{aiText}</pre></div>}
      </div>
    </div>
  );
}

// ── VEHICLES PAGE ─────────────────────────────────────────────
function VehiclesPage({ vehicles, onMsg }) {
  const [plate, setPlate]   = useState('');
  const [km, setKm]         = useState('');
  const [bulk, setBulk]     = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [confirm, setConfirm]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const fileRef = useRef();

  const add = async () => {
    if (!plate.trim()) return;
    const id = plate.trim().toUpperCase();
    if (vehicles.find((v) => v.id === id)) { onMsg({ type: 'error', text: '車牌已存在' }); return; }
    setSaving(true);
    try {
      await fsSet(COL.v, id, { currentMileage: clean(km), lastUpdated: new Date().toISOString() });
      setPlate(''); setKm(''); onMsg({ type: 'success', text: '已新增車輛' });
    } finally { setSaving(false); }
  };

  const addBulk = async () => {
    const lines = bulk.split('\n').map((l) => l.trim()).filter(Boolean);
    const existing = new Set(vehicles.map((v) => v.id));
    const toAdd = lines.map((line) => { const [p, k] = line.split(/\s+/); if (!p) return null; const id = p.toUpperCase(); if (existing.has(id)) return null; return { id, currentMileage: parseFloat(k) || 0 }; }).filter(Boolean);
    if (!toAdd.length) { onMsg({ type: 'error', text: '無新車牌可新增' }); return; }
    setSaving(true);
    try {
      await Promise.all(toAdd.map((v) => fsSet(COL.v, v.id, { currentMileage: v.currentMileage, lastUpdated: new Date().toISOString() })));
      setBulk(''); setShowBulk(false); onMsg({ type: 'success', text: `已批次新增 ${toAdd.length} 輛` });
    } finally { setSaving(false); }
  };

  const del = async (id) => {
    await fsDel(COL.v, id); onMsg({ type: 'success', text: '已移除' });
  };

  const exportCSV = () => {
    const rows = vehicles.map((v) => `${v.id},${v.currentMileage || 0}`);
    const blob = new Blob(['\uFEFF車牌號碼,目前里程\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'vehicles.csv'; a.click();
  };

  const importFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const isXLSX = /\.(xlsx|xls)$/i.test(file.name);
    const r = new FileReader();
    r.onload = async (ev) => {
      let rows = [];
      if (isXLSX) {
        if (!window.XLSX) { onMsg({ type: 'error', text: 'XLSX 載入中，請稍後再試' }); return; }
        const wb = window.XLSX.read(ev.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = window.XLSX.utils.sheet_to_json(ws, { header: 1 }).slice(1);
      } else {
        rows = parseCSVText(ev.target.result);
      }
      const existing = new Set(vehicles.map((v) => v.id));
      const toAdd = rows
        .filter(([p]) => p && String(p).trim())
        .map(([p, k]) => ({ id: String(p).trim().toUpperCase(), currentMileage: parseFloat(k) || 0 }))
        .filter(({ id }) => !existing.has(id));
      if (!toAdd.length) { onMsg({ type: 'error', text: '無新資料可匯入（已存在或格式錯誤）' }); return; }
      await Promise.all(toAdd.map((v) => fsSet(COL.v, v.id, { currentMileage: v.currentMileage, lastUpdated: new Date().toISOString() })));
      onMsg({ type: 'success', text: `已匯入 ${toAdd.length} 輛` });
    };
    if (isXLSX) r.readAsArrayBuffer(file); else r.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px 64px' }}>
      <div style={{ padding: '20px 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ color: C.t1, fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Truck size={20} color={C.am} /> 車輛管理 <Tag c={C.t3} label={`${vehicles.length} 輛`} /></h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={exportCSV} style={{ ...G.btn('dark', true) }}><Download size={12} /> 匯出</button>
          <button onClick={() => fileRef.current?.click()} style={{ ...G.btn('dark', true) }}><Upload size={12} /> 匯入 Excel/CSV</button>
          <button onClick={() => setShowBulk((o) => !o)} style={{ ...G.btn('dark', true) }}><LayoutGrid size={12} /> 批次新增</button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={importFile} />
        </div>
      </div>
      <div style={{ ...G.card(), padding: 16, marginBottom: 16 }}>
        <Lbl c="新增單一車輛" />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input value={plate} onChange={(e) => setPlate(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="車牌號碼（例：BUB-0572）" style={{ ...G.inp(false, false, true), flex: '1 1 180px' }} />
          <input value={km} onChange={(e) => setKm(e.target.value)} placeholder="起始里程（選填）" style={{ ...G.inp(false, false, true), flex: '1 1 140px' }} inputMode="numeric" />
          <button onClick={add} disabled={saving} style={{ ...G.btn('am'), flexShrink: 0 }}><Plus size={14} /> 新增</button>
        </div>
      </div>
      {showBulk && (
        <div style={{ ...G.card(), padding: 16, marginBottom: 16 }}>
          <Lbl c="批次新增（一行一輛，可附起始里程）" />
          <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={5} placeholder={'BUB-0572 266082\nAAA-1234 50000'} style={{ ...G.inp(), resize: 'vertical', marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 8 }}><button onClick={addBulk} disabled={saving} style={G.btn('am')}><Check size={14} /> 確認批次新增</button><button onClick={() => setShowBulk(false)} style={G.btn('ghost', true)}><X size={13} /></button></div>
        </div>
      )}
      <div style={G.card()}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
            <thead><tr><TH c="車牌號碼" /><TH c="目前里程" /><TH c="最後更新" /><TH c="最後駕駛" /><TH c="" /></tr></thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} style={{ borderTop: `1px solid ${C.bg3}` }} onMouseEnter={(e) => e.currentTarget.style.background = C.bg3} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '11px 14px', color: C.cy, fontFamily: "'Courier New',monospace", fontWeight: 700, fontSize: 15 }}>{v.id}</td>
                  <td style={{ padding: '11px 14px', color: C.am, fontFamily: "'Courier New',monospace", fontWeight: 700 }}>{fmt(v.currentMileage)} KM</td>
                  <td style={{ padding: '11px 14px', color: C.t3, fontSize: 12 }}>{fmtDt(v.lastUpdated).slice(0, 16)}</td>
                  <td style={{ padding: '11px 14px', color: C.t2, fontSize: 13 }}>{v.lastDriver || '—'}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                    <button onClick={() => setConfirm({ fn: () => del(v.id), l: v.id })} style={{ background: C.rdD, border: `1px solid ${C.rd}44`, borderRadius: 6, cursor: 'pointer', color: C.rd, padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}><Trash2 size={13} /> 刪除</button>
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: C.t3 }}>尚無車輛，請新增或匯入</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {confirm && <Confirm title={`確認移除 ${confirm.l}？`} body="歷史申報紀錄不受影響，車牌將從選單移除。" danger onOk={() => { confirm.fn(); setConfirm(null); }} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

// ── DRIVERS PAGE ──────────────────────────────────────────────
function DriversPage({ drivers, onMsg }) {
  const [name, setName]     = useState('');
  const [dept, setDept]     = useState('物流部');
  const [bulk, setBulk]     = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [confirm, setConfirm]   = useState(null);
  const [filter, setFilter]     = useState('全部');
  const [saving, setSaving]     = useState(false);
  const fileRef = useRef();
  const DEPTS = ['物流部', '業務部', '其他'];
  const depts = useMemo(() => ['全部', ...Array.from(new Set(drivers.map((d) => d.department || '未分類')))], [drivers]);
  const list  = useMemo(() => filter === '全部' ? drivers : drivers.filter((d) => d.department === filter), [drivers, filter]);

  const add = async () => {
    if (!name.trim()) return;
    if (drivers.find((d) => d.name === name.trim())) { onMsg({ type: 'error', text: '人員已存在' }); return; }
    setSaving(true);
    try {
      await fsAdd(COL.d, { name: name.trim(), department: dept });
      setName(''); onMsg({ type: 'success', text: '已新增人員' });
    } finally { setSaving(false); }
  };

  const addBulk = async () => {
    const lines = bulk.split('\n').map((l) => l.trim()).filter(Boolean);
    const existing = new Set(drivers.map((d) => d.name));
    const toAdd = lines.filter((n) => !existing.has(n));
    if (!toAdd.length) { onMsg({ type: 'error', text: '無新人員可新增' }); return; }
    setSaving(true);
    try {
      await Promise.all(toAdd.map((n) => fsAdd(COL.d, { name: n, department: dept })));
      setBulk(''); setShowBulk(false); onMsg({ type: 'success', text: `已批次新增 ${toAdd.length} 人` });
    } finally { setSaving(false); }
  };

  const del = async (id) => { await fsDel(COL.d, id); onMsg({ type: 'success', text: '已移除' }); };

  const exportCSV = () => {
    const rows = drivers.map((d) => `"${d.name}","${d.department}"`);
    const blob = new Blob(['\uFEFF姓名,部門\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'drivers.csv'; a.click();
  };

  const importCSV = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = async (ev) => {
      const rows = parseCSVText(ev.target.result);
      const existing = new Set(drivers.map((d) => d.name));
      const toAdd = rows.filter(([n]) => n && !existing.has(n)).map(([n, d]) => ({ name: n, department: d || '物流部' }));
      if (!toAdd.length) { onMsg({ type: 'error', text: '無新資料可匯入' }); return; }
      await Promise.all(toAdd.map((d) => fsAdd(COL.d, d)));
      onMsg({ type: 'success', text: `已匯入 ${toAdd.length} 人` });
    };
    r.readAsText(file); e.target.value = '';
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px 64px' }}>
      <div style={{ padding: '20px 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ color: C.t1, fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Users size={20} color={C.cy} /> 人員管理 <Tag c={C.t3} label={`${drivers.length} 人`} /></h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={exportCSV} style={{ ...G.btn('dark', true) }}><Download size={12} /> 匯出</button>
          <button onClick={() => fileRef.current?.click()} style={{ ...G.btn('dark', true) }}><Upload size={12} /> 匯入 CSV</button>
          <button onClick={() => setShowBulk((o) => !o)} style={{ ...G.btn('dark', true) }}><LayoutGrid size={12} /> 批次新增</button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={importCSV} />
        </div>
      </div>
      <div style={{ ...G.card(), padding: 16, marginBottom: 16 }}>
        <Lbl c="新增人員" />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="輸入姓名後按 Enter" style={{ ...G.inp(), flex: '1 1 160px' }} />
          <div style={{ display: 'flex', gap: 4 }}>
            {DEPTS.map((d) => <button key={d} onClick={() => setDept(d)} style={{ ...G.btn(dept === d ? 'cy' : 'ghost', true), borderRadius: 20 }}>{d}</button>)}
          </div>
          <button onClick={add} disabled={saving} style={{ ...G.btn('cy'), flexShrink: 0 }}><Plus size={14} /> 新增</button>
        </div>
      </div>
      {showBulk && (
        <div style={{ ...G.card(), padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Lbl c={`批次新增（部門：${dept}）`} />
            <div style={{ display: 'flex', gap: 4 }}>
              {DEPTS.map((d) => <button key={d} onClick={() => setDept(d)} style={{ ...G.btn(dept === d ? 'cy' : 'ghost', true), borderRadius: 20 }}>{d}</button>)}
            </div>
          </div>
          <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={5} placeholder={'王小明\n李大華\n陳小春'} style={{ ...G.inp(), resize: 'vertical', marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 8 }}><button onClick={addBulk} disabled={saving} style={G.btn('cy')}><Check size={14} /> 確認批次新增</button><button onClick={() => setShowBulk(false)} style={G.btn('ghost', true)}><X size={13} /></button></div>
        </div>
      )}
      {depts.length > 2 && <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {depts.map((d) => <button key={d} onClick={() => setFilter(d)} style={{ ...G.btn(filter === d ? 'cy' : 'ghost', true), borderRadius: 20 }}>{d}</button>)}
      </div>}
      <div style={G.card()}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 320 }}>
            <thead><tr><TH c="姓名" /><TH c="部門" /><TH c="" /></tr></thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id} style={{ borderTop: `1px solid ${C.bg3}` }} onMouseEnter={(e) => e.currentTarget.style.background = C.bg3} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '11px 14px', color: C.t1, fontWeight: 600, fontSize: 15 }}>{d.name}</td>
                  <td style={{ padding: '11px 14px' }}><Tag c={C.cy} label={d.department} /></td>
                  <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                    <button onClick={() => setConfirm({ fn: () => del(d.id), l: d.name })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t3, padding: 4 }} onMouseEnter={(e) => e.currentTarget.style.color = C.rd} onMouseLeave={(e) => e.currentTarget.style.color = C.t3}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={3} style={{ padding: 40, textAlign: 'center', color: C.t3 }}>尚無人員，請新增或匯入</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {confirm && <Confirm title={`確認移除 ${confirm.l}？`} body="歷史申報紀錄不受影響，人員將從選單移除。" danger onOk={() => { confirm.fn(); setConfirm(null); }} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

// ── LOGS PAGE ─────────────────────────────────────────────────
function LogsPage({ logs, onMsg }) {
  const [confirm, setConfirm] = useState(null);
  const del = async (id) => { await fsDel(COL.l, id); onMsg({ type: 'success', text: '已刪除' }); };
  const exportAll = () => {
    const rows = logs.map((l) => `"${fmtDt(l.timestamp)}","${l.driverName}","${l.vehicleId}","${l.reportMonth}","${l.type === 'monthly' ? '月結' : '跨車'}",${l.calculatedKM || 0}`);
    const blob = new Blob(['\uFEFF時間,申報人,車牌,月份,類型,里程(KM)\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '申報日誌_全部.csv'; a.click();
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px 64px' }}>
      <div style={{ padding: '20px 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ color: C.t1, fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={20} color={C.t2} /> 申報日誌 <Tag c={C.t3} label={`${logs.length} 筆`} /></h2>
        <button onClick={exportAll} style={{ ...G.btn('dark', true) }}><Download size={12} /> 匯出全部</button>
      </div>
      <div style={G.card()}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead><tr><TH c="時間" /><TH c="申報人" /><TH c="車牌" /><TH c="月份" /><TH c="類型" /><TH c="里程" /><TH c="" /></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} style={{ borderTop: `1px solid ${C.bg3}` }} onMouseEnter={(e) => e.currentTarget.style.background = C.bg3} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '9px 14px', color: C.t3, fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDt(l.timestamp).slice(5, 16)}</td>
                  <td style={{ padding: '9px 14px', color: C.t1, fontWeight: 600, whiteSpace: 'nowrap' }}>{l.driverName}</td>
                  <td style={{ padding: '9px 14px', color: C.cy, fontFamily: "'Courier New',monospace", fontWeight: 700, whiteSpace: 'nowrap' }}>{l.vehicleId}</td>
                  <td style={{ padding: '9px 14px', color: C.t2, fontSize: 13 }}>{l.reportMonth}</td>
                  <td style={{ padding: '9px 14px' }}><Tag c={l.type === 'monthly' ? C.gn : C.cy} label={l.type === 'monthly' ? '月結' : '跨車'} /></td>
                  <td style={{ padding: '9px 14px', color: C.am, fontFamily: "'Courier New',monospace", fontWeight: 700, whiteSpace: 'nowrap' }}>+{fmt(l.calculatedKM)}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right' }}>
                    <button onClick={() => setConfirm({ fn: () => del(l.id), l: '此筆紀錄' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t3, padding: 4 }} onMouseEnter={(e) => e.currentTarget.style.color = C.rd} onMouseLeave={(e) => e.currentTarget.style.color = C.t3}><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: C.t3 }}>尚無申報紀錄</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {confirm && <Confirm title={`確認刪除${confirm.l}？`} body="此操作無法復原。" danger onOk={() => { confirm.fn(); setConfirm(null); }} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

// ── ADMIN LOGIN ───────────────────────────────────────────────
const ADMIN_PIN = 'A10110030827';

function AdminLogin({ onAuth }) {
  const [p, setP] = useState(''); const [err, setErr] = useState(false);
  const go = () => { if (p === ADMIN_PIN) onAuth(); else { setErr(true); setTimeout(() => setErr(false), 1500); setP(''); } };
  return (
    <div style={{ maxWidth: 360, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ ...G.card(true), padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ background: C.amD, border: `1px solid ${C.am}44`, borderRadius: 8, padding: 8, lineHeight: 0 }}><Lock size={18} color={C.am} /></div>
          <div>
            <div style={{ color: C.t1, fontWeight: 700, fontSize: 17 }}>管理後台</div>
            <div style={{ color: C.t3, fontSize: 12 }}>請輸入管理員授權碼</div>
          </div>
        </div>
        <input type="password" value={p} onChange={(e) => setP(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && go()} autoFocus
          style={{ ...G.inp(err, false, true, true), fontSize: 22, letterSpacing: '.3em', marginBottom: 8 }} placeholder="••••••" />
        {err && <div style={{ color: C.rd, textAlign: 'center', fontSize: 13, marginBottom: 8 }}>授權碼錯誤</div>}
        <button onClick={go} style={{ ...G.btn('am'), width: '100%', padding: '12px', fontSize: 15 }}>驗證並進入</button>
      </div>
    </div>
  );
}

// ── FLEETOPS ROOT ─────────────────────────────────────────────
export default function FleetOps({ onBack }) {
  const { data: drivers, loading: dLoad } = useCollection(COL.d, (d) => d.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-TW')));
  const { data: vehicles, loading: vLoad } = useCollection(COL.v, (d) => d.sort((a, b) => (a.id || '').localeCompare(b.id || '')));
  const { data: logs, loading: lLoad }     = useCollection(COL.l, (d) => d.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')));

  const [view, setView]         = useState('home');
  const [toast, setToast]       = useState(null);
  const [adminMode, setAdminMode] = useState(false);
  const [adminAuth, setAdminAuth] = useState(false);

  const loading = dLoad || vLoad || lLoad;
  const isAdmin = adminMode && adminAuth;
  const msg = (m) => setToast(m);

  const submitLog = async (entry, vehicleUpdate) => {
    await fsAdd(COL.l, entry);
    if (vehicleUpdate) {
      await fsUpdate(COL.v, vehicleUpdate.vehicleId, {
        currentMileage: vehicleUpdate.newMileage,
        lastUpdated: new Date().toISOString(),
        lastDriver: vehicleUpdate.driverName,
      });
    }
  };

  const handleAdminMode = (val) => { setAdminMode(val); if (!val) setAdminAuth(false); };

  const adminPages = ['dashboard', 'vehicles', 'drivers', 'logs'];
  const safeView = adminPages.includes(view) && !isAdmin ? 'home' : view;

  return (
    <div style={{ minHeight: '100vh', background: C.bg1, color: C.t1, fontFamily: "system-ui, -apple-system, 'Segoe UI', 'PingFang TC', 'Noto Sans TC', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.bg4}; border-radius: 3px; }
        select option { background: ${C.bg2}; }
        button:active { transform: scale(.97); }
        @media(max-width:640px){
          .fo-desktop-nav{display:none!important}
          .fo-mobile-btn{display:flex!important}
        }
      `}</style>

      <Toast msg={toast} onDone={() => setToast(null)} />
      <TopNav view={safeView} setView={setView} isAdmin={isAdmin} adminMode={adminMode} setAdminMode={handleAdminMode} onBack={onBack} />

      {adminMode && !adminAuth
        ? <AdminLogin onAuth={() => setAdminAuth(true)} />
        : safeView === 'home'      ? <HomePage      drivers={drivers} vehicles={vehicles} logs={logs} setView={setView} isAdmin={isAdmin} loading={loading} />
        : safeView === 'report'    ? <ReportPage    drivers={drivers} vehicles={vehicles} onSubmit={submitLog} />
        : safeView === 'dashboard' ? <DashboardPage drivers={drivers} vehicles={vehicles} logs={logs} />
        : safeView === 'vehicles'  ? <VehiclesPage  vehicles={vehicles} onMsg={msg} />
        : safeView === 'drivers'   ? <DriversPage   drivers={drivers} onMsg={msg} />
        : safeView === 'logs'      ? <LogsPage      logs={logs} onMsg={msg} />
        : null
      }
    </div>
  );
}
