import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// ════════════════════════════════════════════════════════════════════════
// 休假管理系統 — Leave Management Tool
// ════════════════════════════════════════════════════════════════════════

// ── Firebase Config ──────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAe5gxLBHN9CQ6zVhKF6zQGbvgMXCbqoF4",
  authDomain: "jc-logi-map.firebaseapp.com",
  projectId: "jc-logi-map",
  storageBucket: "jc-logi-map.firebasestorage.app",
  messagingSenderId: "98258062805",
  appId: "1:98258062805:web:d004b291c639e126e7c15c"
};

let _fbLeave = null;
const initLeaveFirebase = async () => {
  if (_fbLeave) return _fbLeave;
  try {
    const fbApp  = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const fstore = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const existing = fbApp.getApps();
    const app = existing.length > 0 ? existing[0] : fbApp.initializeApp(FIREBASE_CONFIG);
    const db  = fstore.getFirestore(app);
    _fbLeave = { db, ...fstore };
    return _fbLeave;
  } catch (e) { console.warn('[LeaveTool][Firebase]', e); return null; }
};

// ════════════════════════════════════════════════════════════════════════
// Firestore DB helpers（每筆獨立 document，無 1MB 上限問題）
// ════════════════════════════════════════════════════════════════════════
const DB = {
  async getAll(coll) {
    const fb = await initLeaveFirebase(); if (!fb) return [];
    try { const snap=await fb.getDocs(fb.collection(fb.db,coll)); return snap.docs.map(d=>d.data()); }
    catch(e){ console.warn('[DB.getAll]',coll,e); return []; }
  },
  async set(coll, id, data) {
    const fb = await initLeaveFirebase(); if (!fb) return false;
    try { await fb.setDoc(fb.doc(fb.db,coll,id),{...data,_ts:new Date().toISOString()}); return true; }
    catch(e){ console.warn('[DB.set]',coll,id,e); return false; }
  },
  async del(coll, id) {
    const fb = await initLeaveFirebase(); if (!fb) return false;
    try { await fb.deleteDoc(fb.doc(fb.db,coll,id)); return true; }
    catch(e){ console.warn('[DB.del]',coll,id,e); return false; }
  },
  async getOne(coll, id) {
    const fb = await initLeaveFirebase(); if (!fb) return null;
    try { const snap=await fb.getDoc(fb.doc(fb.db,coll,id)); return snap.exists()?snap.data():null; }
    catch(e){ console.warn('[DB.getOne]',coll,id,e); return null; }
  },
  async batchSet(coll, items) {
    const fb = await initLeaveFirebase(); if (!fb) return false;
    try {
      const batch=fb.writeBatch(fb.db);
      items.forEach(item=>batch.set(fb.doc(fb.db,coll,item.id),{...item,_ts:new Date().toISOString()}));
      await batch.commit(); return true;
    } catch(e){ console.warn('[DB.batchSet]',coll,e); return false; }
  },
  async batchOps(ops) {
    const fb = await initLeaveFirebase(); if (!fb) return false;
    try {
      const batch=fb.writeBatch(fb.db);
      ops.forEach(op=>{
        const ref=fb.doc(fb.db,op.coll,op.id);
        if(op.type==='set') batch.set(ref,{...op.data,_ts:new Date().toISOString()});
        else if(op.type==='del') batch.delete(ref);
      });
      await batch.commit(); return true;
    } catch(e){ console.warn('[DB.batchOps]',e); return false; }
  },
};

const COLL = {
  req:  'leave_requests',    // 每筆假單獨立 document
  pers: 'leave_personnel',   // 每位人員獨立 document
  log:  'leave_audit_log',   // 每筆 log 獨立 document
  cfg:  'leave_config',      // document id='settings'
  block:'leave_blocked',     // 禁休日期 document id=日期字串
};

// ════════════════════════════════════════════════════════════════════════
// 台灣人事行政局國定假日（2025–2026）
// 資料來源：行政院人事行政總處 https://www.dgpa.gov.tw
// ════════════════════════════════════════════════════════════════════════
const TW_HOLIDAYS = {
  // ── 2025 ─────────────────────────────────────────────────────────
  '2025-01-01':{ name:'元旦', type:'national' },
  '2025-01-27':{ name:'農曆除夕', type:'lunar_new_year' },
  '2025-01-28':{ name:'春節初一', type:'lunar_new_year' },
  '2025-01-29':{ name:'春節初二', type:'lunar_new_year' },
  '2025-01-30':{ name:'春節初三', type:'lunar_new_year' },
  '2025-01-31':{ name:'春節初四', type:'lunar_new_year' },
  '2025-02-02':{ name:'春節補假', type:'lunar_new_year' },
  '2025-02-03':{ name:'春節補假', type:'lunar_new_year' },
  '2025-02-28':{ name:'和平紀念日', type:'national' },
  '2025-04-03':{ name:'兒童節補假', type:'national' },
  '2025-04-04':{ name:'兒童節/清明節', type:'national' },
  '2025-05-01':{ name:'勞動節', type:'labor' },
  '2025-05-30':{ name:'端午節補假', type:'national' },
  '2025-06-02':{ name:'端午節', type:'national' },
  '2025-10-06':{ name:'中秋節補假', type:'national' },
  '2025-10-10':{ name:'國慶日', type:'national' },
  '2025-10-31':{ name:'補假', type:'national' },
  '2025-12-25':{ name:'行憲紀念日', type:'national' },
  // ── 補班日（需上班的週六） ────────────────────────────────────────
  '2025-01-18':{ name:'補班日', type:'makeup_work' },
  '2025-02-08':{ name:'補班日', type:'makeup_work' },
  // ── 2026 ─────────────────────────────────────────────────────────
  '2026-01-01':{ name:'元旦', type:'national' },
  '2026-02-16':{ name:'農曆除夕', type:'lunar_new_year' },
  '2026-02-17':{ name:'春節初一', type:'lunar_new_year' },
  '2026-02-18':{ name:'春節初二', type:'lunar_new_year' },
  '2026-02-19':{ name:'春節初三', type:'lunar_new_year' },
  '2026-02-20':{ name:'春節補假', type:'lunar_new_year' },
  '2026-02-28':{ name:'和平紀念日', type:'national' },
  '2026-04-03':{ name:'兒童節補假', type:'national' },
  '2026-04-04':{ name:'兒童節', type:'national' },
  '2026-04-05':{ name:'清明節', type:'national' },
  '2026-05-01':{ name:'勞動節', type:'labor' },
  '2026-06-19':{ name:'端午節', type:'national' },
  '2026-06-20':{ name:'端午節補假', type:'national' },
  '2026-09-25':{ name:'中秋節', type:'national' },
  '2026-10-10':{ name:'國慶日', type:'national' },
  '2026-12-25':{ name:'行憲紀念日', type:'national' },
  // ── 補班日 2026 ──────────────────────────────────────────────────
  '2026-02-14':{ name:'補班日', type:'makeup_work' },
};

// 國定假日類型樣式
const HOLIDAY_STYLE = {
  national:       { bg:'#fef2f2', text:'#dc2626', border:'#fecaca' },
  lunar_new_year: { bg:'#fef9c3', text:'#a16207', border:'#fde047' },
  labor:          { bg:'#f0fdf4', text:'#16a34a', border:'#bbf7d0' },
  makeup_work:    { bg:'#f3f4f6', text:'#6b7280', border:'#e5e7eb' },
};

// 連休門檻（工作天數 ≥ 此值時視為「連休」，強制主管審核）
const CONSECUTIVE_THRESHOLD = 3;

// 標準工時（每日小時數，用於天↔小時換算）
const WORK_HOURS_PER_DAY = 8; // 08:00–17:00

// ── Constants ─────────────────────────────────────────────────────────
// LEAVE_DEPTS 改為從 leaveConfig 讀取（動態，管理者可新增）
// 預設只有物流部；初始化時若 leaveConfig.depts 為空則使用此值
const DEFAULT_LEAVE_DEPTS = [
  { id: 'dept_logi', name: '物流部', code: 'LOGI', color: '#3b82f6' },
];

const LEAVE_TYPES = [
  { id: 'annual',       name: '特休假', short: '特休', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 'personal',     name: '事假',   short: '事假', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  { id: 'sick',         name: '病假',   short: '病假', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  { id: 'official',     name: '公假',   short: '公假', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { id: 'compensatory', name: '補休假', short: '補休', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { id: 'other',        name: '其他',   short: '其他', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
];

const STATUS_CFG = {
  pending:          { label: '待審核',   badge: 'bg-amber-100 text-amber-700',   dot: '#f59e0b' },
  approved:         { label: '已核准',   badge: 'bg-emerald-100 text-emerald-700', dot: '#10b981' },
  rejected:         { label: '已駁回',   badge: 'bg-red-100 text-red-700',       dot: '#ef4444' },
  conflict_pending: { label: '衝突待審', badge: 'bg-orange-100 text-orange-700', dot: '#f97316' },
};

const LEAVE_ADMIN_PW = 'admin2024';

const DEFAULT_LEAVE_PERSONNEL = [
  // 物流部
  { id:'lp01',name:'陳承業',deptId:'dept_logi',email:'',status:'active' },
  { id:'lp02',name:'馬一帆',deptId:'dept_logi',email:'',status:'active' },
  { id:'lp03',name:'蕭頎俊',deptId:'dept_logi',email:'',status:'active' },
  { id:'lp04',name:'吳泓諭',deptId:'dept_logi',email:'',status:'active' },
  { id:'lp05',name:'林凱鴻',deptId:'dept_logi',email:'',status:'active' },
  { id:'lp06',name:'石宗民',deptId:'dept_logi',email:'',status:'active' },
  { id:'lp07',name:'林信宏',deptId:'dept_logi',email:'',status:'active' },
  { id:'lp08',name:'顏瑋慶',deptId:'dept_logi',email:'',status:'active' },
  { id:'lp09',name:'楊展儀',deptId:'dept_logi',email:'',status:'active' },
  { id:'lp10',name:'陳崇倫',deptId:'dept_logi',email:'',status:'active' },
  { id:'lp11',name:'鄭松岩',deptId:'dept_logi',email:'',status:'active' },
  { id:'lp12',name:'鄭宇婷',deptId:'dept_logi',email:'',status:'active' },
  { id:'lp13',name:'許展綸',deptId:'dept_logi',email:'',status:'active' },
  { id:'lp14',name:'林秉裕',deptId:'dept_logi',email:'',status:'active' },
  { id:'lp15',name:'郭軒齊',deptId:'dept_logi',email:'',status:'active' },
  { id:'lp16',name:'梁鈞為',deptId:'dept_logi',email:'',status:'active' },
  { id:'lp17',name:'吳冠霖',deptId:'dept_logi',email:'',status:'active' },
  // 倉儲部
  { id:'lp18',name:'黃建宏',deptId:'dept_ware',email:'',status:'active' },
  { id:'lp19',name:'劉韋廷',deptId:'dept_ware',email:'',status:'active' },
  { id:'lp20',name:'林彥廷',deptId:'dept_ware',email:'',status:'active' },
  { id:'lp21',name:'陳彥廷',deptId:'dept_ware',email:'',status:'active' },
  { id:'lp22',name:'蔡承翰',deptId:'dept_ware',email:'',status:'active' },
  { id:'lp23',name:'張宥銘',deptId:'dept_ware',email:'',status:'active' },
  { id:'lp24',name:'王俊傑',deptId:'dept_ware',email:'',status:'active' },
  { id:'lp25',name:'許哲維',deptId:'dept_ware',email:'',status:'active' },
  { id:'lp26',name:'洪志豪',deptId:'dept_ware',email:'',status:'active' },
  { id:'lp27',name:'吳承恩',deptId:'dept_ware',email:'',status:'active' },
];

// ── Utilities ─────────────────────────────────────────────────────────
const getTaiwanDate = () => new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Taipei'}));
const toDateStr = d => {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
};
const todayStr = () => toDateStr(getTaiwanDate());

// 計算兩日期間的工作天數（週一～週五）
const calcWorkingDays = (start, end) => {
  if (!start || !end || start > end) return 0;
  let count = 0;
  const cur = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  while (cur <= last) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

// 計算兩日期是否有重疊
const dateOverlap = (s1, e1, s2, e2) => s1 <= e2 && e1 >= s2;

// 生成月份所有日期
const getDaysInMonth = (year, month) => {
  const days = [];
  const total = new Date(year, month, 0).getDate();
  for (let d = 1; d <= total; d++) {
    days.push(`${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
  }
  return days;
};

// Period helpers
const getTaiwanPeriod = () => {
  const d = getTaiwanDate();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
};

const expandPeriods = (range, basePeriod, from, to, allPeriods) => {
  if (!basePeriod) return [];
  const [y, m] = basePeriod.split('-').map(Number);
  if (range === 'month') return [basePeriod];
  if (range === 'quarter') {
    const qs = Math.floor((m-1)/3)*3+1;
    return [0,1,2].map(i => y+'-'+String(qs+i).padStart(2,'0'));
  }
  if (range === 'year') return Array.from({length:12},(_,i)=>y+'-'+String(i+1).padStart(2,'0'));
  if (range === 'custom' && from && to) return allPeriods.filter(p=>p>=from&&p<=to);
  return [basePeriod];
};

const periodLabel = (range, base, from, to) => {
  if (!base) return '—';
  const [y,m] = base.split('-').map(Number);
  if (range==='month')   return base;
  if (range==='quarter') return `${y} Q${Math.ceil(m/3)}`;
  if (range==='year')    return `${y} 年`;
  if (range==='custom' && from && to) return `${from} ～ ${to}`;
  return base;
};

const fmtNum = n => (n||0).toLocaleString();

// 判斷某日是否為國定假日（非補班日）
const isTWHoliday = d => {
  const h = TW_HOLIDAYS[d];
  return h && h.type !== 'makeup_work';
};

// 判斷某日是否為補班日（週六需上班）
const isMakeupWorkDay = d => {
  const h = TW_HOLIDAYS[d];
  return h && h.type === 'makeup_work';
};

// 計算工作天數（含國定假日排除、補班日計入）
const calcWorkingDaysWithHolidays = (start, end) => {
  if (!start || !end || start > end) return 0;
  let count = 0;
  const cur = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  while (cur <= last) {
    const d = toDateStr(cur);
    const dow = cur.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const makeup = isMakeupWorkDay(d);
    const holiday = isTWHoliday(d);
    if ((!isWeekend && !holiday) || makeup) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

// 展開日期範圍中的所有工作日（用於連休職務代理人）
const getWorkingDaysInRange = (start, end) => {
  if (!start || !end || start > end) return [];
  const days = [];
  const cur = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  while (cur <= last) {
    const d = toDateStr(cur);
    const dow = cur.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const makeup = isMakeupWorkDay(d);
    const holiday = isTWHoliday(d);
    if ((!isWeekend && !holiday) || makeup) days.push(d);
    cur.setDate(cur.getDate() + 1);
  }
  return days;
};

// 取得前一個工作日（含國定假日跳過）
const getPrevWorkingDay = (dateStr) => {
  const cur = new Date(dateStr + 'T00:00:00');
  cur.setDate(cur.getDate() - 1);
  for (let i = 0; i < 10; i++) {
    const d = toDateStr(cur);
    const dow = cur.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const holiday = isTWHoliday(d);
    const makeup = isMakeupWorkDay(d);
    if ((!isWeekend && !holiday) || makeup) return d;
    cur.setDate(cur.getDate() - 1);
  }
  return toDateStr(cur);
};

// uid 產生器
const genUID = () => `${Date.now()}_${Math.random().toString(36).slice(2,6)}`;

// 判斷某日是否為週固定禁休（週一=1、週二=2），遇假日或補班日則解除
const isWeeklyBlocked = (dateStr) => {
  const dow = new Date(dateStr + 'T00:00:00').getDay(); // 0=Sun,1=Mon,2=Tue
  if (dow !== 1 && dow !== 2) return false;          // 只判斷週一、週二
  if (isTWHoliday(dateStr))    return false;          // 遇國定假日：解除
  if (isMakeupWorkDay(dateStr)) return true;           // 補班日仍禁休
  return true;
};

// ════════════════════════════════════════════════════════════════════════
// LeaveTool Component
// ════════════════════════════════════════════════════════════════════════
// ── BlockedDateControl 子元件（管理者禁休設定）────────────────────────
const BlockedDateControl = ({ date, blocked, onToggle }) => {
  const [note, setNote] = React.useState('');
  return (
    <div className="border-t border-gray-100 pt-3 space-y-2">
      <div className="text-xs font-bold text-gray-600">🔴 禁休日期管理（管理者）</div>
      {!blocked ? (
        <>
          <input value={note} onChange={e=>setNote(e.target.value)} placeholder="禁休說明（如：年終出貨高峰）"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-rose-400"/>
          <button onClick={()=>onToggle(date, note)}
            className="w-full py-2 bg-rose-500 text-white rounded-lg text-xs font-bold hover:bg-rose-600 transition-all">
            🚫 設為禁休日
          </button>
          <div className="text-[10px] text-gray-400">僅標示提醒，不阻擋請假，但休假申請將自動進入主管審核</div>
        </>
      ) : (
        <button onClick={()=>onToggle(date, '')}
          className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-300 transition-all">
          ✅ 解除禁休設定
        </button>
      )}
    </div>
  );
};


const LeaveTool = ({ onBack, windowHeight }) => {

  // ── Auth ─────────────────────────────────────────────────────────
  const [currentUser,   setCurrentUser]   = useState(null);
  const [isAdmin,       setIsAdmin]       = useState(false);
  const [loginDept,     setLoginDept]     = useState('');
  const [customName,    setCustomName]    = useState('');
  const [showAdminPw,   setShowAdminPw]   = useState(false);
  const [adminPwInput,  setAdminPwInput]  = useState('');
  const [adminPwError,  setAdminPwError]  = useState(false);

  // ── Core Data ─────────────────────────────────────────────────────
  const [personnel,     setPersonnel]     = useState(DEFAULT_LEAVE_PERSONNEL);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveConfig,   setLeaveConfig]   = useState({ managerEmail: '', calendarId: '', autoApprove: true, depts: DEFAULT_LEAVE_DEPTS });
  const [auditLog,      setAuditLog]      = useState([]);
  const [dataLoading,   setDataLoading]   = useState(false);
  const [syncStatus,    setSyncStatus]    = useState('');

  // ── UI ────────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState('dashboard');

  // Apply form
  const [applyType,     setApplyType]     = useState('annual');
  const [applyStart,    setApplyStart]    = useState('');
  const [applyEnd,      setApplyEnd]      = useState('');
  const [applyHours,    setApplyHours]    = useState('8');
  const [applyUnit,     setApplyUnit]     = useState('day'); // 'day' | 'hour'
  const [applyReason,   setApplyReason]   = useState('');
  const [applyFor,      setApplyFor]      = useState(''); // for admin proxy apply
  const [applySubmitting, setApplySubmitting] = useState(false);
  // 職務代理人（連休時為 {date: personId}，一般為單一 personId）
  const [applyProxy,    setApplyProxy]    = useState('');      // 一般假單
  const [applyProxySched, setApplyProxySched] = useState({}); // 連休：{日期: personId}
  // 送出前知會提醒彈窗
  const [noticeModal,   setNoticeModal]   = useState(null);  // null | {req, prevDay}
  const [noticeConfirm, setNoticeConfirm] = useState(false);

  // Calendar
  const [calYear,       setCalYear]       = useState(getTaiwanDate().getFullYear());
  const [calMonth,      setCalMonth]      = useState(getTaiwanDate().getMonth()+1);
  const [calDeptFilter, setCalDeptFilter] = useState('all');
  const [calBlockedDates, setCalBlockedDates] = useState({}); // {日期: {note, setBy}}
  const [calDayDetail,  setCalDayDetail]  = useState(null);   // 點擊日期彈窗
  const [cancelModal,    setCancelModal]    = useState(null);   // 銷假確認彈窗 {req}

  // Stats / Export / AI
  const [statsRange,    setStatsRange]    = useState('month');
  const [statsBase,     setStatsBase]     = useState(getTaiwanPeriod());
  const [statsFrom,     setStatsFrom]     = useState('');
  const [statsTo,       setStatsTo]       = useState('');
  const [statsDept,     setStatsDept]     = useState('all');
  const [statsPersonId, setStatsPersonId] = useState('all');
  const [exportRange,   setExportRange]   = useState('month');
  const [exportBase,    setExportBase]    = useState(getTaiwanPeriod());
  const [exportFrom,    setExportFrom]    = useState('');
  const [exportTo,      setExportTo]      = useState('');
  const [exportDept,    setExportDept]    = useState('all');
  const [aiLoading,     setAiLoading]     = useState(false);
  const [aiResult,      setAiResult]      = useState('');
  const [aiRange,       setAiRange]       = useState('month');
  const [aiBase,        setAiBase]        = useState(getTaiwanPeriod());
  const [aiFrom,        setAiFrom]        = useState('');
  const [aiTo,          setAiTo]          = useState('');

  // Review
  const [reviewTab,     setReviewTab]     = useState('conflict');
  const [reviewNote,    setReviewNote]    = useState({});
  const [notifyLoading, setNotifyLoading] = useState(null);

  // Logs
  const [logFilter,     setLogFilter]     = useState('all');

  // Settings edit
  const [settingEdit,   setSettingEdit]   = useState(null);
  const [settingForm,   setSettingForm]   = useState({});
  const [settingDeptForm, setSettingDeptForm] = useState({ name:'', code:'', color:'#3b82f6' });
  const [settingDeptEdit, setSettingDeptEdit] = useState(null);

  // ── Firestore CRUD wrappers ────────────────────────────────────────
  const syncTimerRef = useRef(null);
  const setSaving = useCallback(()=>setSyncStatus('saving'),[]);
  const setSaved  = useCallback(()=>{
    setSyncStatus('saved');
    clearTimeout(syncTimerRef.current);
    syncTimerRef.current=setTimeout(()=>setSyncStatus(''),2500);
  },[]);
  const setDbErr  = useCallback(()=>setSyncStatus('error'),[]);

  const saveReq   = useCallback(async r=>{setSaving();const ok=await DB.set(COLL.req,r.id,r);ok?setSaved():setDbErr();return ok;},[setSaving,setSaved,setDbErr]);
  const delReq    = useCallback(async id=>{setSaving();const ok=await DB.del(COLL.req,id);ok?setSaved():setDbErr();return ok;},[setSaving,setSaved,setDbErr]);
  const batchReqs = useCallback(async list=>{setSaving();const ok=await DB.batchSet(COLL.req,list);ok?setSaved():setDbErr();return ok;},[setSaving,setSaved,setDbErr]);
  const savePersF = useCallback(async p=>{setSaving();const ok=await DB.set(COLL.pers,p.id,p);ok?setSaved():setDbErr();return ok;},[setSaving,setSaved,setDbErr]);
  const delPersF  = useCallback(async id=>{setSaving();const ok=await DB.del(COLL.pers,id);ok?setSaved():setDbErr();return ok;},[setSaving,setSaved,setDbErr]);
  const saveCfgF  = useCallback(async cfg=>{setSaving();const ok=await DB.set(COLL.cfg,'settings',cfg);ok?setSaved():setDbErr();},[setSaving,setSaved,setDbErr]);
  const saveBlock = useCallback(async(dateStr,data)=>{setSaving();const ok=await DB.set(COLL.block,dateStr,{date:dateStr,...data});ok?setSaved():setDbErr();return ok;},[setSaving,setSaved,setDbErr]);
  const delBlock  = useCallback(async dateStr=>{setSaving();const ok=await DB.del(COLL.block,dateStr);ok?setSaved():setDbErr();return ok;},[setSaving,setSaved,setDbErr]);

  // ── Load from Firestore ────────────────────────────────────────────
  useEffect(()=>{
    let cancelled = false;
    (async()=>{
      setDataLoading(true);
      const [reqs, pers, cfg, logs, blocks] = await Promise.all([
        DB.getAll(COLL.req),
        DB.getAll(COLL.pers),
        DB.getOne(COLL.cfg,'settings'),
        DB.getAll(COLL.log),
        DB.getAll(COLL.block),
      ]);
      if (cancelled) return;
      if (reqs.length>0)   setLeaveRequests(reqs.sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')));
      if (pers.length>0)   setPersonnel(pers);
      if (cfg)             setLeaveConfig(prev=>({...prev,...cfg}));
      if (logs.length>0)   setAuditLog(logs.sort((a,b)=>(b.ts||'').localeCompare(a.ts||'')));
      if (blocks.length>0) {
        const bMap={};
        blocks.forEach(b=>{ bMap[b.date]=b; });
        setCalBlockedDates(bMap);
      }
      setDataLoading(false);
    })();
    return ()=>{cancelled=true;};
  },[]);

  // ── logAction ─────────────────────────────────────────────────────
  const logAction = useCallback((category, action, detail) => {
    const entry = {
      id: `llog_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      category, action, detail,
      operator: currentUser?.name || '—',
      ts: new Date().toISOString(),
    };
    setAuditLog(prev=>{
      const updated = [entry,...prev].slice(0,500);
      DB.set(COLL.log, entry.id, entry).catch(()=>{});
      return updated;
    });
  },[currentUser]);

  // ── Conflict detection ────────────────────────────────────────────
  const detectConflicts = useCallback((deptId, start, end, excludeId=null) => {
    return leaveRequests.filter(r =>
      r.id !== excludeId &&
      r.deptId === deptId &&
      r.status !== 'rejected' &&
      dateOverlap(r.startDate, r.endDate, start, end)
    );
  },[leaveRequests]);

  // ── Submit leave ──────────────────────────────────────────────────
  // ── handleSubmitLeave ──────────────────────────────────────────────
  // 邏輯：衝突 → conflict_pending；連休(≥3工作天) → pending；autoApprove → approved
  const handleSubmitLeave = useCallback(async () => {
    const targetPerson = isAdmin && applyFor
      ? personnel.find(p=>p.id===applyFor)
      : currentUser;
    if (!targetPerson) return alert('請選擇申請人');
    if (!applyStart || !applyEnd) return alert('請填寫休假日期');
    if (applyStart > applyEnd) return alert('開始日期不能晚於結束日期');

    const leaveTypeDef = LEAVE_TYPES.find(t=>t.id===applyType);
    const isHourUnit = applyUnit === 'hour' && applyType !== 'compensatory';
    const workDays = applyType==='compensatory'
      ? 0
      : isHourUnit ? 0 : calcWorkingDaysWithHolidays(applyStart, applyEnd);
    const hours = applyType==='compensatory'
      ? parseFloat(applyHours)||0
      : isHourUnit ? parseFloat(applyHours)||0 : workDays*8;
    const isConsecutive = !isHourUnit && workDays >= CONSECUTIVE_THRESHOLD;

    // 職務代理人驗證
    if (applyType !== 'compensatory') {
      if (isConsecutive) {
        const workDayList = getWorkingDaysInRange(applyStart, applyEnd);
        const missing = workDayList.filter(d => !applyProxySched[d]);
        if (missing.length > 0) return alert(`⚠️ 連休假單需為每個工作日指定職務代理人\n缺少：${missing.join('、')}`);
      } else {
        if (!applyProxy) return alert('⚠️ 請指定職務代理人');
      }
    }

    const conflicts = detectConflicts(targetPerson.deptId, applyStart, applyEnd);
    const isConflict = conflicts.length > 0;
    const isBlockedRange = Object.keys(calBlockedDates).some(d=>d>=applyStart&&d<=applyEnd);
    // 週一/二固定禁休（除非遇假）
    const isWeeklyBlockedRange = !isHourUnit && (() => {
      const cur = new Date(applyStart + 'T00:00:00');
      const last = new Date(applyEnd + 'T00:00:00');
      while (cur <= last) {
        if (isWeeklyBlocked(toDateStr(cur))) return true;
        cur.setDate(cur.getDate()+1);
      }
      return false;
    })();

    // 狀態決定（優先級：衝突 > 連休 > 禁休日重疊 > autoApprove）
    let status;
    if (isConflict || isConsecutive || isBlockedRange || isWeeklyBlockedRange) {
      status = 'pending'; // 統一進待審（主管審核）
      if (isConflict) status = 'conflict_pending';
    } else {
      status = leaveConfig.autoApprove !== false ? 'approved' : 'pending';
    }

    const newReq = {
      id: `lr_${genUID()}`,
      employeeId:    targetPerson.id,
      employeeName:  targetPerson.name,
      deptId:        targetPerson.deptId,
      deptName:      LEAVE_DEPTS.find(d=>d.id===targetPerson.deptId)?.name||'',
      leaveType:     applyType,
      leaveTypeName: leaveTypeDef?.name || applyType,
      startDate:     applyStart,
      endDate:       applyEnd,
      days:          workDays,
      unit:          isHourUnit ? 'hour' : 'day',
      hours,
      reason:        applyReason,
      isConsecutive,
      // 職務代理人
      proxyId:       isConsecutive ? null : applyProxy,
      proxyName:     isConsecutive ? null : (personnel.find(p=>p.id===applyProxy)?.name||applyProxy),
      proxySchedule: isConsecutive ? applyProxySched : null, // {日期: personId}
      status,
      conflictWith:  conflicts.map(r=>r.employeeName),
      conflictIds:   conflicts.map(r=>r.id),
      blockedOverlap: isBlockedRange,
      createdAt:     new Date().toISOString(),
      updatedAt:     new Date().toISOString(),
      reviewedBy: null, reviewedAt: null, reviewNote: '',
      notified: false, notifiedGmail: false, notifiedGcal: false,
      proxyBy: (isAdmin&&applyFor) ? currentUser?.name : null,
    };

    // 顯示知會提醒彈窗（送出前必看）
    const prevDay = getPrevWorkingDay(applyStart);
    setNoticeModal({ req: newReq, prevDay });
  }, [currentUser, isAdmin, applyFor, applyType, applyStart, applyEnd, applyHours,
      applyUnit, applyReason, applyProxy, applyProxySched, personnel, leaveConfig,
      detectConflicts, calBlockedDates]);

  // 知會彈窗確認後真正送出
  const handleConfirmSubmit = useCallback(async () => {
    if (!noticeModal) return;
    const { req } = noticeModal;
    setLeaveRequests(prev=>[req,...prev]);
    await saveReq(req);
    const ltDef = LEAVE_TYPES.find(t=>t.id===req.leaveType);
    logAction('apply','申請休假',
      `${req.employeeName}・${ltDef?.name}・${req.startDate}～${req.endDate}・` +
      `${req.days}天・${STATUS_CFG[req.status]?.label}` +
      (req.isConsecutive?' [連休]':'') +
      (req.conflictWith?.length?' ⚠️衝突:'+req.conflictWith.join(','):'')
    );
    setNoticeModal(null); setNoticeConfirm(false);
    setApplyType('annual'); setApplyStart(''); setApplyEnd('');
    setApplyHours('8'); setApplyReason(''); setApplyFor('');
    setApplyProxy(''); setApplyProxySched({}); setApplyUnit('day');
    setActiveSection('calendar');
    const statusLabel = STATUS_CFG[req.status]?.label || req.status;
    if (req.status==='conflict_pending') alert(`⚠️ 衝突提醒\n同部門 ${req.conflictWith.join('、')} 於該期間已排休。\n申請已送出，等待主管審核。`);
    else alert(`✅ 休假申請送出（${statusLabel}）`);
  }, [noticeModal, saveReq, logAction]);


  const handleReview = useCallback(async (id, action) => {
    const req = leaveRequests.find(r=>r.id===id); if (!req) return;
    const note = reviewNote[id]||'';
    const now  = new Date().toISOString();
    const newStatus = action==='approve' ? 'approved' : 'rejected';
    const updatedReq = {...req, status:newStatus, reviewedBy:currentUser?.name||'Admin', reviewedAt:now, reviewNote:note, updatedAt:now};

    // 連動清理其他衝突假單的 conflictWith
    const related = leaveRequests.filter(r=>
      r.id!==id && r.status==='conflict_pending' &&
      (r.conflictIds?.includes(id)||r.conflictWith?.includes(req.employeeName))
    ).map(r=>{
      const newCW  = (r.conflictWith||[]).filter(n=>n!==req.employeeName);
      const newCID = (r.conflictIds||[]).filter(i=>i!==id);
      const autoOk = newStatus==='rejected' && newCW.length===0 && leaveConfig.autoApprove!==false && !r.isConsecutive;
      return {...r, conflictWith:newCW, conflictIds:newCID, status:autoOk?'approved':r.status, updatedAt:now};
    });

    const allUpdates = [updatedReq, ...related];
    setLeaveRequests(prev=>prev.map(r=>allUpdates.find(u=>u.id===r.id)||r));
    if (related.length>0) await batchReqs(allUpdates); else await saveReq(updatedReq);

    const autoNames = related.filter(r=>r.status==='approved').map(r=>r.employeeName);
    if (autoNames.length>0) logAction('approve','連動自動核准', autoNames.join('、')+'（衝突解除後自動核准）');
    logAction(action==='approve'?'approve':'reject', action==='approve'?'核准假單':'駁回假單',
      `${req.employeeName}・${req.leaveTypeName}・${req.startDate}～${req.endDate}${note?`・備註:${note}`:''}`);
    setReviewNote(prev=>({...prev,[id]:''}));
  },[leaveRequests, currentUser, reviewNote, leaveConfig, saveReq, batchReqs, logAction]);


  const handleDeleteLeave = useCallback(async (id) => {
    if (!window.confirm('確認刪除此假單？此操作無法復原。')) return;
    const req = leaveRequests.find(r=>r.id===id); if (!req) return;
    const now = new Date().toISOString();
    // 清理其他假單 conflictWith（避免孤立衝突記錄）
    const related = leaveRequests.filter(r=>
      r.id!==id && (r.conflictIds?.includes(id)||r.conflictWith?.includes(req.employeeName))
    ).map(r=>{
      const newCW  = (r.conflictWith||[]).filter(n=>n!==req.employeeName);
      const newCID = (r.conflictIds||[]).filter(i=>i!==id);
      const autoOk = newCW.length===0 && r.status==='conflict_pending' && leaveConfig.autoApprove!==false && !r.isConsecutive;
      return {...r, conflictWith:newCW, conflictIds:newCID, status:autoOk?'approved':r.status, updatedAt:now};
    });
    setLeaveRequests(prev=>{
      const without=prev.filter(r=>r.id!==id);
      return without.map(r=>related.find(u=>u.id===r.id)||r);
    });
    await delReq(id);
    if (related.length>0) await batchReqs(related);
    logAction('delete','刪除假單',`${req.employeeName}・${req.leaveTypeName}・${req.startDate}～${req.endDate}`);
  },[leaveRequests, leaveConfig, delReq, batchReqs, logAction]);

  // 銷假（使用者自行取消已申請的假單）
  const handleCancelLeave = useCallback(async (req) => {
    const now = new Date().toISOString();
    // 清理其他假單的衝突記錄
    const related = leaveRequests.filter(r=>
      r.id!==req.id && (r.conflictIds?.includes(req.id)||r.conflictWith?.includes(req.employeeName))
    ).map(r=>{
      const newCW  = (r.conflictWith||[]).filter(n=>n!==req.employeeName);
      const newCID = (r.conflictIds||[]).filter(i=>i!==req.id);
      const autoOk = newCW.length===0 && r.status==='conflict_pending' && leaveConfig.autoApprove!==false && !r.isConsecutive;
      return {...r, conflictWith:newCW, conflictIds:newCID, status:autoOk?'approved':r.status, updatedAt:now};
    });
    setLeaveRequests(prev=>{
      const without = prev.filter(r=>r.id!==req.id);
      return without.map(r=>related.find(u=>u.id===r.id)||r);
    });
    await delReq(req.id);
    if (related.length>0) await batchReqs(related);
    logAction('cancel','銷假',`${req.employeeName}・${req.leaveTypeName}・${req.startDate}～${req.endDate}`);
    setCancelModal(null);
  },[leaveRequests, leaveConfig, delReq, batchReqs, logAction]);


  const handleNotify = useCallback(async (id, type) => {
    setNotifyLoading(id+type);
    const req = leaveRequests.find(r=>r.id===id);
    if (!req) { setNotifyLoading(null); return; }
    try {
      const endpoint = type==='gmail' ? '/api/leave-notify' : '/api/leave-gcal';
      const res  = await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({request:req, managerEmail:leaveConfig.managerEmail, calendarId:leaveConfig.calendarId})});
      const data = await res.json();
      if (data.ok) {
        const now = new Date().toISOString();
        const upd = {...req, notified:true, notifiedAt:now, updatedAt:now,
          notifiedGmail: type==='gmail' ? true : (req.notifiedGmail||false),
          notifiedGcal:  type==='gcal'  ? true : (req.notifiedGcal||false)};
        setLeaveRequests(prev=>prev.map(r=>r.id===id?upd:r));
        await saveReq(upd);
        logAction('notify', type==='gmail'?'Gmail 通知':'行事曆新增',
          `${req.employeeName}・${req.leaveTypeName}・${req.startDate}～${req.endDate}`);
        alert(type==='gmail'?'📧 郵件通知已發送至主管':'📅 已新增至主管 Google Calendar');
      } else { alert('通知失敗：'+(data.error||'未知錯誤')); }
    } catch(e){ alert('無法連線：'+e.message); }
    setNotifyLoading(null);
  },[leaveRequests, leaveConfig, saveReq, logAction]);


  // ── Derived data ──────────────────────────────────────────────────
  // 動態部門清單（從 leaveConfig 讀取，管理者可新增）
  const LEAVE_DEPTS = useMemo(()=>
    (leaveConfig.depts?.length ? leaveConfig.depts : DEFAULT_LEAVE_DEPTS)
  ,[leaveConfig.depts]);

  const personnelByDept = useMemo(()=>{
    const map = {};
    LEAVE_DEPTS.forEach(d=>{
      map[d.id] = personnel.filter(p=>p.deptId===d.id&&p.status==='active');
    });
    return map;
  },[personnel, LEAVE_DEPTS]);

  const allPeriods = useMemo(()=>
    [...new Set(leaveRequests.map(r=>r.startDate.slice(0,7)))].sort().reverse()
  ,[leaveRequests]);

  // Periods for stats
  const statsPeriodList = useMemo(()=>
    expandPeriods(statsRange, statsBase, statsFrom, statsTo, allPeriods)
  ,[statsRange, statsBase, statsFrom, statsTo, allPeriods]);

  const statsLabel = useMemo(()=>periodLabel(statsRange,statsBase,statsFrom,statsTo),[statsRange,statsBase,statsFrom,statsTo]);

  // Filtered requests for stats
  const statsRequests = useMemo(()=>
    leaveRequests.filter(r=>{
      const inPeriod = statsPeriodList.length===0 || statsPeriodList.includes(r.startDate.slice(0,7));
      const inDept   = statsDept==='all'||r.deptId===statsDept;
      const inPerson = statsPersonId==='all'||r.employeeId===statsPersonId;
      return inPeriod && inDept && inPerson && r.status!=='rejected';
    })
  ,[leaveRequests, statsPeriodList, statsDept, statsPersonId]);

  // Dashboard stats
  const dashStats = useMemo(()=>{
    const today = todayStr();
    const onLeaveToday = leaveRequests.filter(r=>r.status==='approved'&&r.startDate<=today&&r.endDate>=today);
    const pendingCount = leaveRequests.filter(r=>r.status==='pending'||r.status==='conflict_pending').length;
    const conflictCount = leaveRequests.filter(r=>r.status==='conflict_pending').length;
    const thisMonth = getTaiwanPeriod();
    const thisMonthApproved = leaveRequests.filter(r=>r.status==='approved'&&r.startDate.startsWith(thisMonth));
    return { onLeaveToday, pendingCount, conflictCount, thisMonthApproved };
  },[leaveRequests]);

  // ── Menu ──────────────────────────────────────────────────────────
  const menuItems = [
    { key:'dashboard', icon:'🏠', label:'首頁概覽' },
    { key:'apply',     icon:'✏️',  label:'申請休假' },
    ...(isAdmin?[{ key:'review', icon:'📋', label:`審核管理${dashStats.conflictCount>0?` (${dashStats.conflictCount})`:''}` }]:[]),
    { key:'calendar',  icon:'📅', label:'月曆檢視' },
    ...(isAdmin?[
      { key:'stats',    icon:'📊', label:'統計報表' },
      { key:'ai',       icon:'🤖', label:'AI 分析' },
      { key:'export',   icon:'⬇️', label:'匯出報表' },
      { key:'logs',     icon:'🗂️',  label:'操作記錄' },
      { key:'settings', icon:'⚙️', label:'系統設定' },
    ]:[]),
  ];

  // ════════════════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ════════════════════════════════════════════════════════════════════
  if (!currentUser) {
    return (
      <div style={{minHeight:windowHeight+'px'}} className="bg-gradient-to-br from-slate-900 via-slate-800 to-violet-900 flex items-start justify-center font-sans overflow-y-auto py-10">
        <div className="w-full max-w-md mx-4">
          <button onClick={onBack} className="text-white text-opacity-40 hover:text-opacity-80 text-xs mb-6 flex items-center gap-1 transition-all">← 返回主頁</button>
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🗓️</div>
            <h1 className="text-xl font-bold text-white tracking-wider">休假管理系統</h1>
            <p className="text-violet-400 text-xs tracking-widest mt-2 uppercase">Leave Management System</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur rounded-2xl p-6 border border-white border-opacity-20 space-y-4">
            {!loginDept ? (
              <>
                <div className="text-xs text-violet-300 font-bold tracking-wider mb-2">請選擇部門</div>
                <div className="grid grid-cols-2 gap-3">
                  {LEAVE_DEPTS.map(d=>(
                    <button key={d.id} onClick={()=>setLoginDept(d.id)}
                      className="py-5 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-xl text-white text-sm font-bold hover:bg-violet-500 hover:bg-opacity-30 hover:border-violet-400 transition-all">
                      {d.name}
                      <div className="text-[10px] text-white text-opacity-30 mt-1">
                        {personnelByDept[d.id]?.length||0} 人
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-violet-300 font-bold tracking-wider">
                    {LEAVE_DEPTS.find(d=>d.id===loginDept)?.name} — 請選擇姓名
                  </div>
                  <button onClick={()=>setLoginDept('')} className="text-[10px] text-white text-opacity-40 hover:text-opacity-80">← 返回</button>
                </div>
                <div className="grid grid-cols-3 gap-1.5 max-h-56 overflow-y-auto">
                  {(personnelByDept[loginDept]||[]).map(p=>(
                    <button key={p.id} onClick={()=>{
                      setCurrentUser(p);
                      setApplyFor('');
                      setTimeout(()=>logAction('login','使用者登入',`${p.name}・${LEAVE_DEPTS.find(d=>d.id===p.deptId)?.name}・名單登入`),0);
                    }}
                      className="py-2.5 px-2 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white text-xs font-bold hover:bg-violet-500 hover:bg-opacity-30 hover:border-violet-400 transition-all">
                      {p.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <input value={customName} onChange={e=>setCustomName(e.target.value)} placeholder="其他人員姓名"
                    className="flex-1 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg px-3 py-2 text-white text-xs placeholder-white placeholder-opacity-30 focus:outline-none" />
                  <button disabled={!customName.trim()} onClick={()=>{
                    const p={ id:`custom_${Date.now()}`,name:customName.trim(),deptId:loginDept,email:'',status:'active' };
                    setCurrentUser(p);
                    setTimeout(()=>logAction('login','自訂名稱登入',`${p.name}・${LEAVE_DEPTS.find(d=>d.id===loginDept)?.name}・⚠️ 非名單用戶`),0);
                  }}
                    className="px-4 py-2 bg-violet-500 text-white rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-violet-600 transition-all">
                    登入
                  </button>
                </div>
              </>
            )}
            {/* Admin 入口 */}
            <div className="border-t border-white border-opacity-10 pt-3">
              {!showAdminPw ? (
                <button onClick={()=>setShowAdminPw(true)} className="w-full text-[11px] text-white text-opacity-30 hover:text-opacity-60 transition-all py-1">⚙️ 管理者登入</button>
              ) : (
                <div className="flex gap-2">
                  <input type="password" value={adminPwInput} onChange={e=>setAdminPwInput(e.target.value)}
                    placeholder="管理者密碼"
                    onKeyDown={e=>{ if(e.key==='Enter'){
                      if(adminPwInput===LEAVE_ADMIN_PW){setIsAdmin(true);setCurrentUser({id:'admin',name:'管理者',deptId:'',isAdmin:true});setShowAdminPw(false);setAdminPwInput('');}
                      else{setAdminPwError(true);setTimeout(()=>setAdminPwError(false),2000);}
                    }}}
                    className={`flex-1 bg-white bg-opacity-10 border ${adminPwError?'border-red-400':'border-white border-opacity-20'} rounded-lg px-3 py-2 text-white text-xs focus:outline-none`} />
                  <button onClick={()=>{
                    if(adminPwInput===LEAVE_ADMIN_PW){setIsAdmin(true);setCurrentUser({id:'admin',name:'管理者',deptId:'',isAdmin:true});setShowAdminPw(false);setAdminPwInput('');}
                    else{setAdminPwError(true);setTimeout(()=>setAdminPwError(false),2000);}
                  }} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600">進入</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // MAIN LAYOUT
  // ════════════════════════════════════════════════════════════════════

  // ── SECTION: DASHBOARD ──────────────────────────────────────────
  const renderDashboard = () => {
    const today = todayStr();
    const myLeaves = leaveRequests.filter(r=>r.employeeId===currentUser.id).sort((a,b)=>b.startDate.localeCompare(a.startDate));
    const myPending = myLeaves.filter(r=>r.status==='pending'||r.status==='conflict_pending');
    const myUpcoming = leaveRequests.filter(r=>r.employeeId===currentUser.id&&r.status==='approved'&&r.startDate>=today).sort((a,b)=>a.startDate.localeCompare(b.startDate));
    const thisYear = String(getTaiwanDate().getFullYear());


    return (
      <div className="space-y-4">
        {/* 歡迎 + 特休剩餘 */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-lg font-bold">{currentUser.name} {isAdmin&&<span className="text-xs bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full ml-1">管理者</span>}</div>
              <div className="text-violet-200 text-xs mt-1">{LEAVE_DEPTS.find(d=>d.id===currentUser.deptId)?.name || '—'} · {thisYear} 年</div>
            </div>
            <button onClick={()=>setActiveSection('apply')} className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-all px-4 py-2 rounded-xl text-sm font-bold">✏️ 申請休假</button>
          </div>

        </div>

        {/* 今日在休 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="text-sm font-bold text-gray-700 mb-3">📍 今日在休（{today}）</div>
          {dashStats.onLeaveToday.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-4">今日無人在休</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {dashStats.onLeaveToday.map(r=>{
                const lt = LEAVE_TYPES.find(t=>t.id===r.leaveType);
                const dept = LEAVE_DEPTS.find(d=>d.id===r.deptId);
                return (
                  <div key={r.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border" style={{backgroundColor:lt?.bg,borderColor:lt?.border,color:lt?.color}}>
                    <span>{r.employeeName}</span>
                    <span className="opacity-70">{dept?.name}</span>
                    <span>·</span>
                    <span>{lt?.short}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 待辦 + 我的近期假單 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 我的待審 */}
          {!currentUser.isAdmin && myPending.length > 0 && (
            <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4">
              <div className="text-sm font-bold text-orange-700 mb-3">⏳ 待審核假單 ({myPending.length})</div>
              <div className="space-y-2">
                {myPending.slice(0,3).map(r=>(
                  <div key={r.id} className="flex items-center justify-between text-xs border border-orange-100 rounded-xl p-2.5 bg-orange-50">
                    <div>
                      <span className="font-bold text-gray-700">{r.leaveTypeName}</span>
                      <span className="text-gray-400 ml-2">{r.startDate} ～ {r.endDate}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_CFG[r.status]?.badge}`}>{STATUS_CFG[r.status]?.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin 待審 */}
          {isAdmin && dashStats.pendingCount > 0 && (
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4">
              <div className="text-sm font-bold text-amber-700 mb-3">🔔 需要審核 ({dashStats.pendingCount})</div>
              <div className="space-y-2">
                {leaveRequests.filter(r=>r.status==='pending'||r.status==='conflict_pending').slice(0,3).map(r=>(
                  <div key={r.id} className="flex items-center justify-between text-xs border border-amber-100 rounded-xl p-2.5 bg-amber-50">
                    <div>
                      <span className="font-bold">{r.employeeName}</span>
                      <span className="text-gray-500 ml-2">{r.leaveTypeName} {r.startDate}～{r.endDate}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_CFG[r.status]?.badge}`}>{STATUS_CFG[r.status]?.label}</span>
                  </div>
                ))}
              </div>
              <button onClick={()=>setActiveSection('review')} className="w-full mt-3 py-1.5 text-xs text-amber-700 font-bold border border-amber-200 rounded-lg hover:bg-amber-50 transition-all">
                前往審核 →
              </button>
            </div>
          )}

          {/* 我的近期假單 */}
          {!currentUser.isAdmin && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="text-sm font-bold text-gray-700 mb-3">📋 近期假單</div>
              {myLeaves.length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-4">尚無假單記錄</div>
              ) : (
                <div className="space-y-2">
                  {myLeaves.slice(0,5).map(r=>{
                    const lt = LEAVE_TYPES.find(t=>t.id===r.leaveType);
                    const canCancel = r.status !== 'rejected'; // 非已拒絕皆可銷假
                    return (
                      <div key={r.id} className="flex items-center justify-between text-xs border border-gray-100 rounded-xl p-2.5 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor:lt?.color}}></div>
                          <div className="min-w-0">
                            <span className="font-bold text-gray-700">{r.leaveTypeName}</span>
                            <span className="text-gray-400 ml-2">{r.startDate}～{r.endDate}</span>
                            <span className="text-gray-400 ml-2">
                              {r.unit==='hour'||r.leaveType==='compensatory' ? r.hours+'H' : r.days+'天'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_CFG[r.status]?.badge}`}>{STATUS_CFG[r.status]?.label}</span>
                          {canCancel && (
                            <button
                              onClick={()=>setCancelModal(r)}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all">
                              銷假
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── SECTION: APPLY ───────────────────────────────────────────────
  const renderApply = () => {
    const targetId     = isAdmin && applyFor ? applyFor : currentUser?.id;
    const targetPerson = personnel.find(p=>p.id===targetId)||(currentUser?.isAdmin?null:currentUser);
    const isHourUnit    = applyUnit === 'hour' && applyType !== 'compensatory';
    const workDays     = applyType==='compensatory' ? 0
      : isHourUnit ? 0
      : (applyStart&&applyEnd&&applyStart<=applyEnd ? calcWorkingDaysWithHolidays(applyStart,applyEnd) : 0);
    const isConsecutive = !isHourUnit && workDays >= CONSECUTIVE_THRESHOLD;
    // 週一/二固定禁休範圍偵測（UI 提示用）
    const hasWeeklyBlock = !isHourUnit && applyStart && applyEnd && (() => {
      const cur = new Date(applyStart+'T00:00:00');
      const last = new Date(applyEnd+'T00:00:00');
      while (cur<=last){ if(isWeeklyBlocked(toDateStr(cur))) return true; cur.setDate(cur.getDate()+1); }
      return false;
    })();
    const workDayList   = isConsecutive && applyStart && applyEnd ? getWorkingDaysInRange(applyStart,applyEnd) : [];
    const conflicts     = (targetPerson && applyStart && applyEnd && applyStart<=applyEnd)
      ? detectConflicts(targetPerson.deptId, applyStart, applyEnd) : [];
    const leaveTypeDef  = LEAVE_TYPES.find(t=>t.id===applyType);
    const blockedInRange= Object.entries(calBlockedDates).filter(([d])=>d>=applyStart&&d<=applyEnd);
    const deptPeers     = personnel.filter(p=>p.id!==targetId && p.deptId===targetPerson?.deptId && p.status==='active');
    const allPeers      = personnel.filter(p=>p.id!==targetId && p.status==='active');

    return (
      <div className="max-w-xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="text-base font-bold text-gray-800">✏️ 申請休假</div>

          {/* 申請人（管理者可代申請） */}
          {isAdmin && (
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">代申請對象</label>
              <select value={applyFor} onChange={e=>setApplyFor(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400">
                <option value="">-- 請選擇員工 --</option>
                {LEAVE_DEPTS.map(d=>(
                  <optgroup key={d.id} label={d.name}>
                    {(personnelByDept[d.id]||[]).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
          )}

          {/* 假別 */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">假別</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {LEAVE_TYPES.map(t=>(
                <button key={t.id} onClick={()=>setApplyType(t.id)}
                  className="py-2.5 rounded-xl text-xs font-bold border-2 transition-all"
                  style={applyType===t.id?{backgroundColor:t.bg,borderColor:t.color,color:t.color}:{backgroundColor:'#f9fafb',borderColor:'transparent',color:'#6b7280'}}>
                  {t.short}
                </button>
              ))}
            </div>
          </div>

          {/* 日期 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">開始日期</label>
              <input type="date" value={applyStart}
                onChange={e=>{setApplyStart(e.target.value);if(!applyEnd)setApplyEnd(e.target.value);setApplyProxySched({});}}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">結束日期</label>
              <input type="date" value={applyEnd} min={applyStart}
                onChange={e=>{setApplyEnd(e.target.value);setApplyProxySched({});}}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400"/>
            </div>
          </div>

          {/* 請假單位切換：所有人均可選天或小時 */}
          {applyType !== 'compensatory' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">請假單位</label>
              <div className="flex gap-2">
                {[{v:'day',l:'📅 以天計算'},{v:'hour',l:'⏱ 以小時計算'}].map(o=>(
                  <button key={o.v} onClick={()=>setApplyUnit(o.v)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all
                      ${applyUnit===o.v?'bg-violet-50 border-violet-400 text-violet-700':'bg-gray-50 border-transparent text-gray-400'}`}>
                    {o.l}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">標準工時 08:00–17:00（8H/天）；半天請假填 4H</div>
            </div>
          )}

          {/* 補休／小時制：輸入時數 */}
          {(applyType==='compensatory' || isHourUnit) && (
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">
                {applyType==='compensatory' ? '補休時數' : '請假時數'}
              </label>
              <input type="number" value={applyHours} min="0.5" max="72" step="0.5"
                onChange={e=>setApplyHours(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400"
                placeholder="例：4（半天）、8（整天）"/>
              <div className="text-[10px] text-gray-400 mt-1">標準工時 8H/天（08:00–17:00）；半天 = 4H</div>
            </div>
          )}

          {/* 計算天數/時數 + 連休標示 */}
          {(workDays > 0 || (isHourUnit && parseFloat(applyHours)>0)) && (
            <div className="flex items-center flex-wrap gap-2">
              {isHourUnit ? (
                <span className="text-sm text-gray-500">請假時數：<span className="font-bold text-violet-700">{applyHours} 小時</span>
                  <span className="text-gray-400 ml-1">（約 {(parseFloat(applyHours)||0)/8 % 1 === 0 ? (parseFloat(applyHours)||0)/8 : ((parseFloat(applyHours)||0)/8).toFixed(1)} 天）</span>
                </span>
              ) : (
                <span className="text-sm text-gray-500">工作天數：<span className="font-bold text-violet-700">{workDays} 天</span>
                  <span className="text-gray-400 ml-1">（{workDays * WORK_HOURS_PER_DAY} 小時）</span>
                </span>
              )}
              {isConsecutive && (
                <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                  🔴 連休（≥{CONSECUTIVE_THRESHOLD}天）— 需主管審核
                </span>
              )}
            </div>
          )}

          {/* 事由 */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label className="text-xs font-bold text-gray-500">事由</label>
              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">選填・僅管理者可見</span>
            </div>
            <textarea value={applyReason} onChange={e=>setApplyReason(e.target.value)} rows={2}
              placeholder="此欄位僅管理者可見，非強制填寫"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 resize-none"/>
          </div>

          {/* ── 職務代理人 ── */}
          {applyType !== 'compensatory' && (
            <div className="border-t border-gray-100 pt-4">
              <label className="block text-xs font-bold text-gray-700 mb-2">
                👤 職務代理人 <span className="text-red-500">*</span>
                {isConsecutive && <span className="text-orange-500 ml-1">（連休：每工作日各需指定）</span>}
              </label>

              {!isConsecutive ? (
                /* 一般假單：單一代理人 */
                <select value={applyProxy} onChange={e=>setApplyProxy(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400">
                  <option value="">-- 請選擇代理人 --</option>
                  <optgroup label="同部門">
                    {deptPeers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                  </optgroup>
                  <optgroup label="其他部門">
                    {allPeers.filter(p=>p.deptId!==targetPerson?.deptId).map(p=><option key={p.id} value={p.id}>{p.name}（{LEAVE_DEPTS.find(d=>d.id===p.deptId)?.name}）</option>)}
                  </optgroup>
                </select>
              ) : (
                /* 連休假單：每工作日各選代理人 */
                <div className="space-y-2 max-h-56 overflow-y-auto border border-orange-100 rounded-xl p-3 bg-orange-50">
                  {workDayList.map(d=>(
                    <div key={d} className="flex items-center gap-2">
                      <div className="text-xs font-mono text-gray-600 w-24 flex-shrink-0">{d}</div>
                      {TW_HOLIDAYS[d] && <span className="text-[10px] bg-red-100 text-red-600 px-1 py-0.5 rounded">{TW_HOLIDAYS[d].name}</span>}
                      <select value={applyProxySched[d]||''} onChange={e=>setApplyProxySched(prev=>({...prev,[d]:e.target.value}))}
                        className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-violet-400">
                        <option value="">-- 選代理人 --</option>
                        {deptPeers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                        {allPeers.filter(p=>p.deptId!==targetPerson?.deptId).map(p=><option key={p.id} value={p.id}>{p.name}（他部門）</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 週固定禁休警告（週一/二） */}
          {hasWeeklyBlock && (
            <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-3">
              <div className="text-xs font-bold text-rose-700 mb-1">📅 範圍內含固定禁休日（週一/二）</div>
              <div className="text-xs text-rose-600">每週一、週二為固定禁休日（遇國定假日解除）。申請將自動進入主管審核。</div>
            </div>
          )}

          {/* 禁休日期重疊警告 */}
          {blockedInRange.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
              <div className="text-xs font-bold text-red-700 mb-1">🚫 範圍內含禁休日期（將需主管審核）</div>
              {blockedInRange.map(([d,b])=>(
                <div key={d} className="text-xs text-red-600">• {d}：{b.note||'禁休'}</div>
              ))}
            </div>
          )}

          {/* 衝突警告 */}
          {conflicts.length > 0 && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
              <div className="text-sm font-bold text-orange-700 mb-2">⚠️ 同部門同日排休提醒</div>
              <div className="flex flex-wrap gap-1.5">
                {conflicts.map(r=>(
                  <span key={r.id} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-bold">
                    {r.employeeName}（{r.startDate}～{r.endDate}）
                  </span>
                ))}
              </div>
              <div className="text-xs text-orange-600 mt-2">可預排申請，但將進入主管審核流程。</div>
            </div>
          )}

          <button onClick={handleSubmitLeave}
            disabled={!applyStart||!applyEnd||applyStart>applyEnd||(isAdmin&&!applyFor&&currentUser?.isAdmin)||applySubmitting}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
            style={{backgroundColor: leaveTypeDef?.color||'#7c3aed'}}>
            {conflicts.length>0||isConsecutive?'⚠️ 送出申請（需主管審核）':'送出申請'}
          </button>
        </div>
      </div>
    );
  };


  const renderReview = () => {
    const conflictList = leaveRequests.filter(r=>r.status==='conflict_pending').sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
    const pendingList  = leaveRequests.filter(r=>r.status==='pending').sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
    const doneList     = leaveRequests.filter(r=>r.status==='approved'||r.status==='rejected').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
    const showList     = reviewTab==='conflict'?conflictList : reviewTab==='pending'?pendingList : doneList;

    const ReviewCard = ({r}) => {
      const lt  = LEAVE_TYPES.find(t=>t.id===r.leaveType);
      const dept= LEAVE_DEPTS.find(d=>d.id===r.deptId);
      const isPending = r.status==='pending'||r.status==='conflict_pending';
      return (
        <div className={`rounded-2xl border-2 p-4 space-y-3 ${r.status==='conflict_pending'?'border-orange-200 bg-orange-50':r.status==='approved'?'border-emerald-100 bg-emerald-50':r.status==='rejected'?'border-red-100 bg-red-50':'border-gray-100 bg-white'}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="font-bold text-gray-800 flex items-center gap-2">
                {r.employeeName}
                <span className="text-xs text-gray-400">{dept?.name}</span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                <span className="font-bold" style={{color:lt?.color}}>{r.leaveTypeName}</span>
                <span className="ml-2">{r.startDate} ～ {r.endDate}</span>
                <span className="ml-2">
                  {r.unit==='hour' || r.leaveType==='compensatory'
                    ? r.hours+'H'
                    : r.days+'天'}
                  {isAdmin && r.unit!=='hour' && r.leaveType!=='compensatory' && r.days>0 &&
                    <span className="text-gray-400 ml-1">({r.days*WORK_HOURS_PER_DAY}H)</span>}
                </span>
              </div>
              {isAdmin && r.reason && <div className="text-xs text-gray-500 mt-1">📝 事由：{r.reason}</div>}
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_CFG[r.status]?.badge}`}>{STATUS_CFG[r.status]?.label}</span>
          </div>

          {/* 衝突資訊 */}
          {r.status==='conflict_pending' && r.conflictWith?.length>0 && (
            <div className="bg-orange-100 rounded-xl p-3 text-xs text-orange-700">
              <span className="font-bold">衝突人員：</span>{r.conflictWith.join('、')}
            </div>
          )}

          {/* 已審核資訊 */}
          {(r.status==='approved'||r.status==='rejected') && (
            <div className="text-xs text-gray-500">
              審核：{r.reviewedBy} · {r.reviewedAt?.slice(0,10)}
              {r.reviewNote && <span className="ml-2 text-gray-600">備註：{r.reviewNote}</span>}
            </div>
          )}

          {/* 審核操作 */}
          {isPending && (
            <div className="space-y-2 pt-1">
              <input value={reviewNote[r.id]||''} onChange={e=>setReviewNote(prev=>({...prev,[r.id]:e.target.value}))}
                placeholder="審核備註（選填）"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-400" />
              <div className="flex gap-2">
                <button onClick={()=>handleReview(r.id,'approve')} className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all">✅ 核准</button>
                <button onClick={()=>handleReview(r.id,'reject')}  className="flex-1 py-2 bg-red-400 text-white rounded-xl text-xs font-bold hover:bg-red-500 transition-all">❌ 駁回</button>
                <button onClick={()=>handleNotify(r.id,'gmail')} disabled={!leaveConfig.managerEmail||notifyLoading===r.id+'gmail'} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-200 transition-all disabled:opacity-40">
                  {notifyLoading===r.id+'gmail'?'…':'📧'}
                </button>
                <button onClick={()=>handleNotify(r.id,'gcal')} disabled={!leaveConfig.calendarId||notifyLoading===r.id+'gcal'} className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-200 transition-all disabled:opacity-40">
                  {notifyLoading===r.id+'gcal'?'…':'📅'}
                </button>
                <button onClick={()=>handleDeleteLeave(r.id)} className="px-3 py-2 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-500 transition-all">🗑️</button>
              </div>
            </div>
          )}
          {!isPending && (
            <div className="flex gap-2 justify-end">
              <button onClick={()=>handleNotify(r.id,'gmail')} disabled={!leaveConfig.managerEmail||notifyLoading===r.id+'gmail'} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 disabled:opacity-40">
                {notifyLoading===r.id+'gmail'?'…':'📧 通知'}
              </button>
              <button onClick={()=>handleNotify(r.id,'gcal')} disabled={!leaveConfig.calendarId||notifyLoading===r.id+'gcal'} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 disabled:opacity-40">
                {notifyLoading===r.id+'gcal'?'…':'📅 行事曆'}
              </button>
              <button onClick={()=>handleDeleteLeave(r.id)} className="px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-xs font-bold hover:bg-red-50 hover:text-red-500 transition-all">🗑️</button>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-4">
        {/* 分頁 */}
        <div className="flex gap-0 border-b border-gray-200">
          {[['conflict',`⚠️ 衝突待審(${conflictList.length})`],['pending',`⏳ 待審核(${pendingList.length})`],['done','✅ 已處理']].map(([k,l])=>(
            <button key={k} onClick={()=>setReviewTab(k)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${reviewTab===k?'border-violet-500 text-violet-700':'border-transparent text-gray-400 hover:text-gray-600'}`}>
              {l}
            </button>
          ))}
        </div>

        {showList.length===0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">目前無待處理項目</div>
        ) : (
          <div className="space-y-3">
            {showList.map(r=><ReviewCard key={r.id} r={r} />)}
          </div>
        )}
      </div>
    );
  };

  // ── SECTION: CALENDAR ────────────────────────────────────────────
  const renderCalendar = () => {
    const daysInMonth   = getDaysInMonth(calYear, calMonth);
    const firstDow      = new Date(`${calYear}-${String(calMonth).padStart(2,'0')}-01`).getDay();
    const paddingDays   = (firstDow+6)%7; // Mon=0
    const today         = todayStr();

    // 當月假單分布
    const dayLeaves = {};
    leaveRequests.forEach(r=>{
      if(r.status==='rejected') return;
      if(calDeptFilter!=='all' && r.deptId!==calDeptFilter) return;
      daysInMonth.forEach(d=>{
        if(d>=r.startDate && d<=r.endDate){ if(!dayLeaves[d]) dayLeaves[d]=[]; dayLeaves[d].push(r); }
      });
    });

    const prevMonth=()=>{ if(calMonth===1){setCalMonth(12);setCalYear(calYear-1);}else setCalMonth(calMonth-1); };
    const nextMonth=()=>{ if(calMonth===12){setCalMonth(1);setCalYear(calYear+1);}else setCalMonth(calMonth+1); };

    // 管理者點擊日期：顯示詳情 + 禁休設定
    const handleDayClick = (d) => {
      setCalDayDetail({ date:d, leaves:dayLeaves[d]||[], holiday:TW_HOLIDAYS[d], blocked:calBlockedDates[d] });
    };
    const handleToggleBlock = async (d, note) => {
      if (calBlockedDates[d]) {
        const updated = {...calBlockedDates}; delete updated[d]; setCalBlockedDates(updated);
        await delBlock(d);
        logAction('settings','解除禁休日',d);
      } else {
        const data = {note, setBy:currentUser?.name, setAt:new Date().toISOString()};
        setCalBlockedDates(prev=>({...prev,[d]:data}));
        await saveBlock(d, data);
        logAction('settings','設定禁休日', d+(note?`・${note}`:''));
      }
      setCalDayDetail(null);
    };

    return (
      <div className="space-y-3">
        {/* 頁面標題 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-gray-800">📅 月曆檢視</div>
            <div className="text-[11px] text-gray-400 mt-0.5">顯示全部部門排休 · <span className="text-violet-500 font-bold">👤</span> 為您的假單 · 點擊日期查看詳情與銷假</div>
          </div>
        </div>
        {/* 控制列 */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">‹</button>
            <div className="text-base font-bold text-gray-800">{calYear} 年 {calMonth} 月</div>
            <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600">›</button>
          </div>
          <select value={calDeptFilter} onChange={e=>setCalDeptFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs">
            <option value="all">全部門</option>
            {LEAVE_DEPTS.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {/* 圖例 */}
        <div className="flex flex-wrap gap-2 text-[10px]">
          {LEAVE_TYPES.map(t=>(
            <div key={t.id} className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:t.color}}></div><span className="text-gray-500">{t.short}</span></div>
          ))}
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div><span className="text-gray-500">待審</span></div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-red-100 rounded border border-red-200"></div><span className="text-gray-500">國定假日</span></div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-rose-900 rounded opacity-30"></div><span className="text-gray-500">禁休日（需主管審核）</span></div>
          {isAdmin && <span className="text-violet-500">（管理者可點選日期設定禁休）</span>}
        </div>

        {/* 日曆格 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {['一','二','三','四','五','六','日'].map((d,i)=>(
              <div key={d} className={`py-2 text-center text-xs font-bold ${i>=5?'text-red-400':'text-gray-400'}`}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array(paddingDays).fill(null).map((_,i)=>(
              <div key={'p'+i} className="min-h-[72px] sm:min-h-[88px] border-r border-b border-gray-50 bg-gray-50"></div>
            ))}
            {daysInMonth.map(d=>{
              const dow    = (new Date(d+'T00:00:00').getDay()+6)%7;
              const isWknd = dow>=5;
              const isToday= d===today;
              const holiday= TW_HOLIDAYS[d];
              const blocked= calBlockedDates[d];
              const leaves = dayLeaves[d]||[];
              const isMakeup = holiday?.type==='makeup_work';
              const isHoliday= holiday && !isMakeup;
              const style  = isHoliday ? HOLIDAY_STYLE[holiday.type] || HOLIDAY_STYLE.national : null;
              return (
                <div key={d}
                  onClick={()=>handleDayClick(d)}
                  className={[
                    'min-h-[72px] sm:min-h-[88px] p-1 border-r border-b border-gray-50 cursor-pointer transition-all hover:brightness-95',
                    isWknd&&!isHoliday ? 'bg-gray-50' : '',
                    isToday ? 'ring-2 ring-violet-400 ring-inset' : '',
                    blocked ? 'bg-rose-50' : '',
                    isHoliday ? '' : '',
                  ].filter(Boolean).join(' ')}
                  style={isHoliday?{backgroundColor:style?.bg}:{}}>
                  <div className="flex items-start justify-between mb-0.5">
                    <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0
                      ${isToday?'bg-violet-600 text-white':isHoliday?'text-red-600':isWknd?'text-red-300':'text-gray-400'}`}>
                      {parseInt(d.slice(8))}
                    </div>
                    <div className="flex gap-0.5 flex-wrap justify-end">
                      {isMakeup && <span className="text-[8px] bg-blue-100 text-blue-600 px-0.5 rounded">補班</span>}
                      {blocked   && <span className="text-[8px] bg-rose-200 text-rose-700 px-0.5 rounded">禁休</span>}
                      {leaves.length>0 && <span className="text-[8px] bg-gray-100 text-gray-500 px-0.5 rounded">{leaves.length}人</span>}
                    </div>
                  </div>
                  {isHoliday && (
                    <div className="text-[8px] font-bold mb-0.5 truncate" style={{color:style?.text}}>{holiday.name}</div>
                  )}
                  <div className="space-y-0.5">
                    {leaves.slice(0,3).map(r=>{
                      const lt=LEAVE_TYPES.find(t=>t.id===r.leaveType);
                      const pend=r.status==='pending'||r.status==='conflict_pending';
                      const isMine = r.employeeId === currentUser?.id;
                      return(
                        <div key={r.id}
                          className={"text-[8px] sm:text-[9px] font-bold px-1 py-0.5 rounded truncate" + (isMine?" ring-1 ring-violet-400":"")}
                          style={{backgroundColor:pend?'#fef3c7':lt?.bg,color:pend?'#92400e':lt?.color,border:`1px solid ${pend?'#fcd34d':lt?.border}`}}>
                          {isMine?'👤':''}{r.employeeName}{pend?'*':''}{r.isConsecutive?'🔴':''}
                        </div>
                      );
                    })}
                    {leaves.length>3 && <div className="text-[8px] text-gray-400 pl-1">+{leaves.length-3}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 日期詳情 + 禁休設定 Modal */}
        {calDayDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
            onClick={e=>{if(e.target===e.currentTarget)setCalDayDetail(null);}}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-base font-bold text-gray-800">{calDayDetail.date}</div>
                  {calDayDetail.holiday && <div className="text-xs text-red-600 font-bold mt-0.5">{calDayDetail.holiday.name}</div>}
                  {calDayDetail.blocked && <div className="text-xs text-rose-700 mt-0.5">🚫 禁休：{calDayDetail.blocked.note||''}</div>}
                </div>
                <button onClick={()=>setCalDayDetail(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>
              {calDayDetail.leaves.length>0 ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {calDayDetail.leaves.map(r=>{
                    const lt=LEAVE_TYPES.find(t=>t.id===r.leaveType);
                    const isMine = r.employeeId===currentUser?.id;
                    const canCancel = isMine && r.status!=='rejected';
                    return(
                    <div key={r.id} className={"text-xs border rounded-lg p-2"+(isMine?" ring-2 ring-violet-300":"")} style={{borderColor:lt?.border,backgroundColor:lt?.bg}}>
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <span className="font-bold" style={{color:lt?.color}}>
                            {isMine?'👤 ':''}{ r.employeeName} · {r.leaveTypeName} {r.isConsecutive?'🔴連休':''}
                          </span>
                        </div>
                        {canCancel && (
                          <button onClick={()=>{setCalDayDetail(null);setCancelModal(r);}}
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-600 hover:bg-rose-200 flex-shrink-0 transition-all">
                            銷假
                          </button>
                        )}
                      </div>
                      <div className="text-gray-500 mt-0.5">
                        {r.startDate}～{r.endDate} ·{' '}
                        {r.unit==='hour'||r.leaveType==='compensatory'?r.hours+'H':r.days+'天'+(isAdmin&&r.days>0?' ('+r.days*WORK_HOURS_PER_DAY+'H)':'')}
                      </div>
                      {(r.proxyName||r.proxySchedule) &&
                        <div className="text-gray-400 mt-0.5">代理：{r.proxyName||Object.values(r.proxySchedule||{}).map(id=>personnel.find(p=>p.id===id)?.name||id).join('/')}</div>
                      }
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_CFG[r.status]?.badge}`}>{STATUS_CFG[r.status]?.label}</span>
                    </div>
                  );})}
                </div>
              ):(
                <div className="text-xs text-gray-400 text-center py-3">該日無排休記錄</div>
              )}
              {isAdmin && (
                <BlockedDateControl
                  date={calDayDetail.date}
                  blocked={calDayDetail.blocked}
                  onToggle={handleToggleBlock}/>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };


  const renderStats = () => {
    // 各人別統計
    const filteredPersonnel = personnel.filter(p=>
      p.status==='active' && (statsDept==='all'||p.deptId===statsDept) && (statsPersonId==='all'||p.id===statsPersonId)
    );

    const personStats = filteredPersonnel.map(p=>{
      const reqs = statsRequests.filter(r=>r.employeeId===p.id);
      const byType = {};
      LEAVE_TYPES.forEach(t=>{ byType[t.id] = reqs.filter(r=>r.leaveType===t.id).reduce((s,r)=>s+(r.days||0),0); });
      const totalDays = Object.values(byType).reduce((s,v)=>s+v,0);
      const compHours = reqs.filter(r=>r.leaveType==='compensatory').reduce((s,r)=>s+r.hours,0);
      return { ...p, byType, totalDays, compHours };
    }).sort((a,b)=>b.totalDays-a.totalDays);

    // 部門彙整
    const deptTotals = LEAVE_DEPTS.map(d=>{
      const dReqs = statsRequests.filter(r=>r.deptId===d.id);
      const total = dReqs.reduce((s,r)=>s+r.days,0);
      const byType = {};
      LEAVE_TYPES.forEach(t=>{ byType[t.id]=dReqs.filter(r=>r.leaveType===t.id).reduce((s,r)=>s+r.days,0); });
      return { ...d, total, byType };
    });

    // 最大值（for SVG bar）
    const maxDays = Math.max(1,...personStats.map(p=>p.totalDays));

    return (
      <div className="space-y-4">
        {/* 篩選列 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-2">
            {[['month','月'],['quarter','季'],['year','年'],['custom','自訂']].map(([v,l])=>(
              <button key={v} onClick={()=>setStatsRange(v)}
                className={'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all '+
                  (statsRange===v?'bg-violet-600 text-white border-violet-600':'bg-white text-gray-500 border-gray-200 hover:border-violet-300')}>
                {l}
              </button>
            ))}
            {statsRange!=='custom' && (
              <select value={statsBase} onChange={e=>setStatsBase(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs">
                {allPeriods.length===0?<option value={getTaiwanPeriod()}>{getTaiwanPeriod()}</option>:
                  allPeriods.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            )}
            {statsRange==='custom'&&<>
              <input type="month" value={statsFrom} onChange={e=>setStatsFrom(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
              <span className="text-gray-400 text-xs">～</span>
              <input type="month" value={statsTo} onChange={e=>setStatsTo(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
            </>}
            <select value={statsDept} onChange={e=>setStatsDept(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs">
              <option value="all">全部門</option>
              {LEAVE_DEPTS.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="mt-2 text-xs font-mono text-violet-700 bg-violet-50 border border-violet-100 rounded px-2 py-1 inline-block">
            📅 {statsLabel}
          </div>
        </div>

        {/* 部門彙整 KPI */}
        <div className="grid grid-cols-2 gap-3">
          {deptTotals.map(d=>(
            <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="text-sm font-bold text-gray-700 mb-2">{d.name}</div>
              <div className="text-2xl font-bold text-gray-800 mb-2">{d.total} <span className="text-sm text-gray-400">天</span></div>
              <div className="space-y-1">
                {LEAVE_TYPES.filter(t=>d.byType[t.id]>0).map(t=>(
                  <div key={t.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor:t.color}}></div>
                      <span className="text-gray-500">{t.short}</span>
                    </div>
                    <span className="font-bold" style={{color:t.color}}>{d.byType[t.id]} 天</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 個人明細表 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-gray-700">個人假況明細（{statsLabel}）</div>
              <select value={statsPersonId} onChange={e=>setStatsPersonId(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs">
                <option value="all">全部人員</option>
                {LEAVE_DEPTS.map(d=>(
                  <optgroup key={d.id} label={d.name}>
                    {(personnelByDept[d.id]||[]).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-gray-500 font-bold">姓名</th>
                  <th className="px-3 py-2.5 text-gray-500 font-bold">部門</th>
                  {LEAVE_TYPES.map(t=>(
                    <th key={t.id} className="px-3 py-2.5 font-bold" style={{color:t.color}}>{t.short}</th>
                  ))}
                  <th className="px-3 py-2.5 text-gray-700 font-bold">補休(H)</th>
                  <th className="px-3 py-2.5 text-gray-700 font-bold">合計(天)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {personStats.map((p,i)=>(
                  <tr key={p.id} className={i%2===0?'':'bg-gray-50'}>
                    <td className="px-4 py-2.5 font-bold text-gray-700">{p.name}</td>
                    <td className="px-3 py-2.5 text-center text-gray-400">{LEAVE_DEPTS.find(d=>d.id===p.deptId)?.name}</td>
                    {LEAVE_TYPES.map(t=>(
                      <td key={t.id} className="px-3 py-2.5 text-center font-bold" style={{color:p.byType[t.id]>0?t.color:'#d1d5db'}}>
                        {p.byType[t.id]>0?p.byType[t.id]:'—'}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-center font-bold text-violet-600">{p.compHours>0?p.compHours:'—'}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-gray-800">{p.totalDays||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {personStats.length===0 && (
            <div className="text-center py-8 text-gray-400 text-sm">該期間無假單記錄</div>
          )}
        </div>

        {/* SVG 長條圖（前10名） */}
        {personStats.filter(p=>p.totalDays>0).length >= 2 && (() => {
          const top = personStats.filter(p=>p.totalDays>0).slice(0,10);
          const bH=120, bW=320, pad=40, barW=Math.min(22,(bW-pad*2)/top.length-3);
          return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="text-sm font-bold text-gray-700 mb-3">📊 假天數分佈（前{top.length}名）</div>
              <svg width="100%" viewBox={`0 0 ${bW} ${bH+30}`} style={{overflow:'visible'}}>
                {[0,1,2,3].map(i=>{
                  const y=bH-i*bH/3;
                  const v=Math.round(maxDays*i/3);
                  return <g key={i}>
                    <line x1={pad} y1={y} x2={bW-pad} y2={y} stroke="#e5e7eb" strokeWidth="0.5"/>
                    <text x={pad-4} y={y+3} textAnchor="end" fontSize="8" fill="#9ca3af">{v}</text>
                  </g>;
                })}
                {top.map((p,i)=>{
                  const x=pad+i*((bW-pad*2)/Math.max(top.length-1,1));
                  const barH=maxDays>0?Math.max(2,(p.totalDays/maxDays)*bH):0;
                  return <g key={p.id}>
                    <rect x={x-barW/2} y={bH-barH} width={barW} height={barH} rx="3" fill="#7c3aed" opacity="0.7"/>
                    <text x={x} y={bH+14} textAnchor="middle" fontSize="8" fill="#6b7280">{p.name.slice(0,2)}</text>
                    {barH>10&&<text x={x} y={bH-barH-3} textAnchor="middle" fontSize="8" fill="#7c3aed" fontWeight="bold">{p.totalDays}</text>}
                  </g>;
                })}
              </svg>
            </div>
          );
        })()}
      </div>
    );
  };

  // ── SECTION: AI ANALYSIS ─────────────────────────────────────────
  const renderAI = () => {
    const aiPeriods = expandPeriods(aiRange, aiBase, aiFrom, aiTo, allPeriods);
    const aiReqs = leaveRequests.filter(r=>{
      const inPeriod = aiPeriods.length===0||aiPeriods.includes(r.startDate.slice(0,7));
      return inPeriod && r.status!=='rejected';
    });

    const handleAIAnalyze = async () => {
      setAiLoading(true);
      setAiResult('');
      try {
        // 建立分析數據
        const totalReqs = aiReqs.length;
        const conflictCount = leaveRequests.filter(r=>r.status==='conflict_pending'||r.conflictWith?.length>0).length;
        const byType = {};
        LEAVE_TYPES.forEach(t=>{ byType[t.name]=aiReqs.filter(r=>r.leaveType===t.id).reduce((s,r)=>s+r.days,0); });
        const byDept = {};
        LEAVE_DEPTS.forEach(d=>{ byDept[d.name]=aiReqs.filter(r=>r.deptId===d.id).reduce((s,r)=>s+r.days,0); });
        const byMonth = {};
        aiReqs.forEach(r=>{ const m=r.startDate.slice(0,7); byMonth[m]=(byMonth[m]||0)+r.days; });

        const promptData = `
【休假管理分析報告】
統計期間：${periodLabel(aiRange,aiBase,aiFrom,aiTo)}
總假單數：${totalReqs} 筆
衝突案件：${conflictCount} 件

【假別天數統計】
${Object.entries(byType).filter(([,v])=>v>0).map(([k,v])=>`- ${k}：${v}天`).join('\n')}

【部門統計】
${Object.entries(byDept).map(([k,v])=>`- ${k}：${v}天`).join('\n')}

【月份分佈】
${Object.entries(byMonth).sort().map(([k,v])=>`- ${k}：${v}天`).join('\n')}

【前5大請假人員】
${(() => {
  const byPerson = {};
  aiReqs.forEach(r=>{ byPerson[r.employeeName]=(byPerson[r.employeeName]||0)+r.days; });
  return Object.entries(byPerson).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([n,d])=>`- ${n}：${d}天`).join('\n');
})()}

請以台灣物流倉儲業主管的角度，針對以上休假數據進行分析，包含：
1. 假況整體評估（用休比例、假別分佈是否合理）
2. 同休衝突風險分析（有無人力覆蓋風險的月份或部門）
3. 個別關注建議（請假天數異常偏高或偏低者）
4. 排班管理建議（如何降低同休衝突、提升人力穩定性）
5. 三條具體可執行的改善行動建議

請以條列式、繁體中文呈現，風格專業務實，約500字。`;

        const resp = await fetch('https://api.anthropic.com/v1/messages',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            model:'claude-haiku-4-5-20251001',
            max_tokens:1500,
            messages:[{role:'user',content:promptData}]
          })
        });
        const data = await resp.json();
        const text = data.content?.filter(c=>c.type==='text').map(c=>c.text).join('') || '分析失敗，請再試一次。';
        setAiResult(text);
        logAction('ai','AI 休假分析',`期間 ${periodLabel(aiRange,aiBase,aiFrom,aiTo)}・${totalReqs} 筆`);
      } catch(e){
        setAiResult('API 呼叫失敗：'+e.message);
      }
      setAiLoading(false);
    };

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="text-sm font-bold text-gray-700 mb-3">🤖 AI 休假分析</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {[['month','月'],['quarter','季'],['year','年'],['custom','自訂']].map(([v,l])=>(
              <button key={v} onClick={()=>setAiRange(v)}
                className={'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all '+
                  (aiRange===v?'bg-violet-600 text-white border-violet-600':'bg-white text-gray-500 border-gray-200 hover:border-violet-300')}>
                {l}
              </button>
            ))}
            {aiRange!=='custom'&&(
              <select value={aiBase} onChange={e=>setAiBase(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs">
                {allPeriods.length===0?<option value={getTaiwanPeriod()}>{getTaiwanPeriod()}</option>:
                  allPeriods.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            )}
            {aiRange==='custom'&&<>
              <input type="month" value={aiFrom} onChange={e=>setAiFrom(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs"/>
              <span className="text-gray-400 text-xs">～</span>
              <input type="month" value={aiTo} onChange={e=>setAiTo(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs"/>
            </>}
          </div>
          <div className="text-xs text-gray-500 mb-4">
            分析期間：<span className="font-mono text-violet-700">{periodLabel(aiRange,aiBase,aiFrom,aiTo)}</span>・
            包含 {aiReqs.length} 筆假單
          </div>
          <button onClick={handleAIAnalyze} disabled={aiLoading}
            className="w-full py-3 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 transition-all">
            {aiLoading?'🤖 分析中…':'🤖 執行 AI 分析'}
          </button>
        </div>

        {aiResult && (
          <div className="bg-white rounded-2xl border border-violet-100 shadow-sm p-5">
            <div className="text-sm font-bold text-violet-700 mb-3">📋 AI 分析結果</div>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{aiResult}</div>
          </div>
        )}
      </div>
    );
  };

  // ── SECTION: EXPORT ──────────────────────────────────────────────
  const renderExport = () => {
    const expPeriods = expandPeriods(exportRange, exportBase, exportFrom, exportTo, allPeriods);
    const expLabel   = periodLabel(exportRange, exportBase, exportFrom, exportTo);
    const expReqs = leaveRequests.filter(r=>{
      const inPeriod = expPeriods.length===0||expPeriods.includes(r.startDate.slice(0,7));
      const inDept   = exportDept==='all'||r.deptId===exportDept;
      return inPeriod&&inDept;
    });

    const exportCSV = () => {
      const header = ['姓名','部門','假別','開始日期','結束日期','工作天數','補休時數','狀態','事由','審核人','備註'];
      const rows = expReqs.map(r=>[
        r.employeeName, r.deptName, r.leaveTypeName,
        r.startDate, r.endDate, r.days, r.hours||0,
        STATUS_CFG[r.status]?.label||r.status,
        r.reason||'', r.reviewedBy||'', r.reviewNote||''
      ]);
      const csv = [header,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href=url; a.download=`休假紀錄_${expLabel}.csv`; a.click();
      URL.revokeObjectURL(url);
      logAction('export','匯出CSV',`期間 ${expLabel}・${expReqs.length} 筆`);
    };

    const exportPDF = async () => {
      if(expReqs.length===0) return alert('無資料可匯出');
      const byType = {};
      LEAVE_TYPES.forEach(t=>{ byType[t.name]=expReqs.filter(r=>r.leaveType===t.id&&r.status!=='rejected').reduce((s,r)=>s+r.days,0); });
      const byDept = {};
      LEAVE_DEPTS.forEach(d=>{ byDept[d.name]=expReqs.filter(r=>r.deptId===d.id&&r.status!=='rejected').reduce((s,r)=>s+r.days,0); });
      const byPerson = {};
      expReqs.filter(r=>r.status!=='rejected').forEach(r=>{ byPerson[r.employeeName]=(byPerson[r.employeeName]||0)+r.days; });
      const topPersons = Object.entries(byPerson).sort((a,b)=>b[1]-a[1]).slice(0,10);

      try {
        const resp = await fetch('https://api.anthropic.com/v1/messages',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            model:'claude-haiku-4-5-20251001',
            max_tokens:3000,
            messages:[{role:'user',content:`
請生成一份 HTML 格式的休假管理月報，要求：
- 繁體中文，排版整齊，適合列印
- 使用 table、style 標籤，配色沿用紫色系 (#7c3aed)
- 標題：休假管理報告 · ${expLabel}
- 包含：(1)概覽KPI (2)假別統計 (3)部門比較 (4)個人排行 (5)衝突案件摘要

數據：
期間：${expLabel}
總假單：${expReqs.length}筆
衝突案件：${expReqs.filter(r=>r.status==='conflict_pending'||r.conflictWith?.length>0).length}件
假別天數：${Object.entries(byType).map(([k,v])=>k+':'+v+'天').join(' / ')}
部門天數：${Object.entries(byDept).map(([k,v])=>k+':'+v+'天').join(' / ')}
個人前10名：${topPersons.map(([n,d])=>n+':'+d+'天').join(' / ')}

只輸出 HTML 代碼，不要其他說明。`}]
          })
        });
        const data = await resp.json();
        let html = data.content?.filter(c=>c.type==='text').map(c=>c.text).join('')||'';
        html = html.replace(/```html|```/g,'').trim();
        const w = window.open('','_blank');
        w.document.write(html);
        w.document.close();
        setTimeout(()=>w.print(),500);
        logAction('export','匯出PDF報告',`期間 ${expLabel}・${expReqs.length} 筆`);
      } catch(e){ alert('PDF 生成失敗：'+e.message); }
    };

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="text-sm font-bold text-gray-700 mb-4">⬇️ 匯出設定</div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">統計區間</label>
              <div className="flex flex-wrap gap-2">
                {[['month','月'],['quarter','季'],['year','年'],['custom','自訂']].map(([v,l])=>(
                  <button key={v} onClick={()=>setExportRange(v)}
                    className={'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all '+
                      (exportRange===v?'bg-violet-600 text-white border-violet-600':'bg-white text-gray-500 border-gray-200 hover:border-violet-300')}>
                    {l}
                  </button>
                ))}
                {exportRange!=='custom'&&(
                  <select value={exportBase} onChange={e=>setExportBase(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs">
                    {allPeriods.length===0?<option value={getTaiwanPeriod()}>{getTaiwanPeriod()}</option>:
                      allPeriods.map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                )}
                {exportRange==='custom'&&<>
                  <input type="month" value={exportFrom} onChange={e=>setExportFrom(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs"/>
                  <span className="text-gray-400 text-xs">～</span>
                  <input type="month" value={exportTo} onChange={e=>setExportTo(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs"/>
                </>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">部門篩選</label>
              <select value={exportDept} onChange={e=>setExportDept(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-xs">
                <option value="all">全部門</option>
                {LEAVE_DEPTS.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            📅 {expLabel}・共 <span className="font-bold text-violet-700">{expReqs.length}</span> 筆
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button onClick={exportCSV} className="py-3 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all">📊 匯出 Excel/CSV</button>
            <button onClick={exportPDF} disabled={expReqs.length===0} className="py-3 rounded-xl text-sm font-bold text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-all disabled:opacity-40">📄 AI 生成 PDF</button>
          </div>
        </div>
      </div>
    );
  };

  // ── SECTION: LOGS ────────────────────────────────────────────────
  const renderLogs = () => {
    const filtered = auditLog.filter(l=>logFilter==='all'||l.category===logFilter);
    const BADGE = {
      login:   'bg-emerald-100 text-emerald-700',
      apply:   'bg-blue-100 text-blue-700',
      approve: 'bg-green-100 text-green-700',
      reject:  'bg-red-100 text-red-700',
      delete:  'bg-gray-200 text-gray-600',
      notify:  'bg-purple-100 text-purple-700',
      export:  'bg-amber-100 text-amber-700',
      ai:      'bg-violet-100 text-violet-700',
    };
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <select value={logFilter} onChange={e=>setLogFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs">
            <option value="all">全部類型</option>
            <option value="login">🔐 登入記錄</option>
            <option value="apply">✏️ 申請假單</option>
            <option value="approve">✅ 審核核准</option>
            <option value="reject">❌ 審核駁回</option>
            <option value="delete">🗑️ 刪除</option>
            <option value="notify">📧 通知</option>
            <option value="export">⬇️ 匯出</option>
            <option value="ai">🤖 AI 分析</option>
          </select>
          <span className="text-xs text-gray-400">{filtered.length} 筆</span>
        </div>
        {auditLog.length===0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">目前尚無操作記錄</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-gray-400 font-bold">時間</th>
                    <th className="px-3 py-2.5 text-gray-400 font-bold">操作</th>
                    <th className="px-3 py-2.5 text-left text-gray-400 font-bold">詳情</th>
                    <th className="px-3 py-2.5 text-gray-400 font-bold">操作人</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((l,i)=>{
                    const ts = new Date(l.ts);
                    const timeStr = `${ts.getFullYear()}-${String(ts.getMonth()+1).padStart(2,'0')}-${String(ts.getDate()).padStart(2,'0')} ${String(ts.getHours()).padStart(2,'0')}:${String(ts.getMinutes()).padStart(2,'0')}`;
                    return (
                      <tr key={l.id} className={i%2===0?'':'bg-gray-50'}>
                        <td className="px-4 py-2.5 font-mono text-gray-400 whitespace-nowrap">{timeStr}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BADGE[l.category]||'bg-gray-100 text-gray-500'}`}>{l.action}</span>
                        </td>
                        <td className="px-3 py-2.5 text-gray-600">{l.detail}</td>
                        <td className="px-3 py-2.5 text-center text-gray-500">{l.operator}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── SECTION: SETTINGS ────────────────────────────────────────────
  const renderSettings = () => {
    const saveConfig = (cfg) => {
      const updated = {...leaveConfig,...cfg};
      setLeaveConfig(updated); saveCfgF(updated);
    };

    return (
      <div className="space-y-5">
        {/* 通知設定 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="text-sm font-bold text-gray-700 mb-4">📧 通知設定</div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">主管 Email（Gmail 通知收件人）</label>
              <input value={leaveConfig.managerEmail||''} onChange={e=>saveConfig({managerEmail:e.target.value})}
                placeholder="manager@company.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Google Calendar ID</label>
              <input value={leaveConfig.calendarId||''} onChange={e=>saveConfig({calendarId:e.target.value})}
                placeholder="primary 或 xxxxx@group.calendar.google.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400"/>
              <div className="text-[10px] text-gray-400 mt-1">需在 Vercel 環境變數設定 GMAIL_USER / GMAIL_APP_PASSWORD / GCAL_SERVICE_ACCOUNT</div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-gray-500">無衝突假單自動核准</label>
              <button onClick={()=>saveConfig({autoApprove:!leaveConfig.autoApprove})}
                className={`w-10 h-5 rounded-full transition-all ${leaveConfig.autoApprove!==false?'bg-violet-500':'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-all mx-0.5 ${leaveConfig.autoApprove!==false?'translate-x-5':''}`} style={{transform:leaveConfig.autoApprove!==false?'translateX(20px)':''}}></div>
              </button>
            </div>
          </div>
        </div>

        {/* 人員管理 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="text-sm font-bold text-gray-700">👥 人員管理</div>
            <button onClick={()=>{ setSettingEdit('new_person'); setSettingForm({name:'',deptId:'dept_logi',email:'',status:'active'}); }}
              className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-xs font-bold border border-violet-200 hover:bg-violet-100 transition-all">
              + 新增人員
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2.5 text-left text-gray-500 font-bold">姓名</th>
                  <th className="px-3 py-2.5 text-gray-500 font-bold">部門</th>
                                    <th className="px-3 py-2.5 text-gray-500 font-bold">狀態</th>
                  <th className="px-3 py-2.5 text-gray-500 font-bold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {personnel.map(p=>(
                  <tr key={p.id} className={p.status!=='active'?'opacity-40':''}>
                    <td className="px-4 py-2.5 font-bold text-gray-700">{p.name}</td>
                    <td className="px-3 py-2.5 text-center text-gray-500">{LEAVE_DEPTS.find(d=>d.id===p.deptId)?.name}</td>
                                        <td className="px-3 py-2.5 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${p.status==='active'?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-500'}`}>
                        {p.status==='active'?'在職':'離職'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={()=>{ setSettingEdit(p.id); setSettingForm({...p}); }}
                          className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-[10px] hover:bg-violet-50 hover:text-violet-600 transition-all">編輯</button>
                        <button onClick={()=>{
                          if(!window.confirm('確認刪除？'))return;
                          const updated=personnel.filter(x=>x.id!==p.id);
                          setPersonnel(updated); savePersF(personToSave).catch(()=>{});
                          logAction('delete','刪除人員',p.name);
                        }}
                          className="px-2 py-1 bg-gray-100 text-gray-400 rounded text-[10px] hover:bg-red-50 hover:text-red-500 transition-all">刪除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 部門管理 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="text-sm font-bold text-gray-700">🏢 部門管理</div>
            <button onClick={()=>setSettingDeptEdit('new')}
              className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-xs font-bold hover:bg-violet-100 transition-all">
              + 新增部門
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2.5 text-left text-gray-500 font-bold">部門名稱</th>
                  <th className="px-3 py-2.5 text-gray-500 font-bold">代碼</th>
                  <th className="px-3 py-2.5 text-gray-500 font-bold">顏色</th>
                  <th className="px-3 py-2.5 text-gray-500 font-bold">人數</th>
                  <th className="px-3 py-2.5 text-gray-500 font-bold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {LEAVE_DEPTS.map(d=>(
                  <tr key={d.id}>
                    <td className="px-4 py-2.5 font-bold text-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor:d.color}}></div>
                        {d.name}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center text-gray-500 font-mono">{d.code}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white" style={{backgroundColor:d.color}}>{d.color}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-violet-700">
                      {personnel.filter(p=>p.deptId===d.id&&p.status==='active').length} 人
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button onClick={()=>{ setSettingDeptEdit(d.id); setSettingDeptForm({name:d.name,code:d.code,color:d.color}); }}
                        className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-[10px] hover:bg-violet-50 hover:text-violet-600 transition-all mr-1">編輯</button>
                      {LEAVE_DEPTS.length > 1 && (
                        <button onClick={()=>{
                          if(!window.confirm(`確認刪除「${d.name}」部門？該部門人員將需重新分配。`)) return;
                          const newDepts = LEAVE_DEPTS.filter(x=>x.id!==d.id);
                          const updated = {...leaveConfig, depts: newDepts};
                          setLeaveConfig(updated); saveCfgF(updated);
                          logAction('settings','刪除部門',d.name);
                        }}
                          className="px-2 py-1 bg-gray-100 text-gray-400 rounded text-[10px] hover:bg-red-50 hover:text-red-500 transition-all">刪除</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 新增/編輯部門 Modal */}
        {settingDeptEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4">
              <div className="text-base font-bold text-gray-800">{settingDeptEdit==='new' ? '新增部門' : '編輯部門'}</div>
              {[['text','name','部門名稱（如：業務部）'],['text','code','代碼（如：SALES，英文大寫）']].map(([type,key,label])=>(
                <div key={key}>
                  <label className="block text-xs font-bold text-gray-500 mb-1">{label}</label>
                  <input type={type} value={settingDeptForm[key]||''} onChange={e=>setSettingDeptForm(prev=>({...prev,[key]:e.target.value}))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400"/>
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">部門顏色</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={settingDeptForm.color||'#3b82f6'}
                    onChange={e=>setSettingDeptForm(prev=>({...prev,color:e.target.value}))}
                    className="w-12 h-9 rounded-lg border border-gray-200 cursor-pointer"/>
                  <span className="text-xs text-gray-500">{settingDeptForm.color}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={()=>{
                  if(!settingDeptForm.name?.trim()) return alert('請填寫部門名稱');
                  if(!settingDeptForm.code?.trim()) return alert('請填寫部門代碼');
                  let newDepts;
                  if(settingDeptEdit==='new'){
                    const nd={ id:'dept_'+Date.now(), name:settingDeptForm.name.trim(), code:settingDeptForm.code.trim().toUpperCase(), color:settingDeptForm.color||'#3b82f6' };
                    newDepts=[...LEAVE_DEPTS, nd];
                    logAction('settings','新增部門',nd.name);
                  } else {
                    newDepts=LEAVE_DEPTS.map(d=>d.id===settingDeptEdit?{...d,...settingDeptForm,code:settingDeptForm.code.trim().toUpperCase()}:d);
                    logAction('settings','編輯部門',settingDeptForm.name);
                  }
                  const updated={...leaveConfig,depts:newDepts};
                  setLeaveConfig(updated); saveCfgF(updated);
                  setSettingDeptEdit(null); setSettingDeptForm({name:'',code:'',color:'#3b82f6'});
                }}
                  className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-all">儲存</button>
                <button onClick={()=>{setSettingDeptEdit(null);setSettingDeptForm({name:'',code:'',color:'#3b82f6'});}}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all">取消</button>
              </div>
            </div>
          </div>
        )}

        {/* 新增/編輯人員 Modal */}
        {settingEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4 shadow-2xl">
              <div className="text-base font-bold text-gray-800">{settingEdit==='new_person'?'新增人員':'編輯人員'}</div>
              {[
                ['text','name','姓名'],
                ['text','email','Email（選填）'],
                              ].map(([type,key,label])=>(
                <div key={key}>
                  <label className="block text-xs font-bold text-gray-500 mb-1">{label}</label>
                  <input type={type} value={settingForm[key]||''} onChange={e=>setSettingForm(prev=>({...prev,[key]:type==='number'?parseInt(e.target.value)||0:e.target.value}))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400"/>
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">部門</label>
                <select value={settingForm.deptId||'dept_logi'} onChange={e=>setSettingForm(prev=>({...prev,deptId:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {LEAVE_DEPTS.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">狀態</label>
                <select value={settingForm.status||'active'} onChange={e=>setSettingForm(prev=>({...prev,status:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="active">在職</option>
                  <option value="inactive">離職</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={()=>{
                  if(!settingForm.name?.trim()){return alert('請填寫姓名');}
                  let updated;
                  if(settingEdit==='new_person'){
                    const np={...settingForm,id:'lp_'+Date.now(),name:settingForm.name.trim()};
                    updated=[...personnel,np];
                    logAction('settings','新增人員',np.name+'・'+LEAVE_DEPTS.find(d=>d.id===np.deptId)?.name);
                  } else {
                    updated=personnel.map(p=>p.id===settingEdit?{...p,...settingForm}:p);
                    logAction('settings','編輯人員',settingForm.name);
                  }
                  setPersonnel(updated); savePersF(updated.find(x=>x.id===(settingEdit==='new'?updated[updated.length-1]?.id:settingEdit))).catch(()=>{});
                  setSettingEdit(null); setSettingForm({});
                }}
                  className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-all">儲存</button>
                <button onClick={()=>{setSettingEdit(null);setSettingForm({});}}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all">取消</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ════════════════════════════════════════════════════════════════════

  // ── 知會提醒 Modal ─────────────────────────────────────────────────

  // ── 銷假確認 Modal ─────────────────────────────────────────────
  const renderCancelModal = () => {
    if (!cancelModal) return null;
    const r = cancelModal;
    const lt = LEAVE_TYPES.find(t=>t.id===r.leaveType);
    const isApproved = r.status === 'approved';
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={e=>{if(e.target===e.currentTarget)setCancelModal(null);}}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
          {/* 標題 */}
          <div className="flex items-start justify-between">
            <div className="text-base font-bold text-gray-800">⚠️ 確認銷假</div>
            <button onClick={()=>setCancelModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
          </div>

          {/* 假單摘要 */}
          <div className="rounded-xl p-4 border-2" style={{backgroundColor:lt?.bg,borderColor:lt?.border}}>
            <div className="text-xs font-bold mb-2" style={{color:lt?.color}}>📋 假單資訊</div>
            <div className="space-y-1 text-xs text-gray-600">
              <div><span className="text-gray-400">假別：</span><span className="font-bold">{r.leaveTypeName}</span></div>
              <div><span className="text-gray-400">日期：</span><span className="font-bold">{r.startDate} ～ {r.endDate}</span></div>
              <div><span className="text-gray-400">時數：</span><span className="font-bold">
                {r.unit==='hour'||r.leaveType==='compensatory' ? r.hours+'H' : r.days+'天（'+r.days*WORK_HOURS_PER_DAY+'H）'}
              </span></div>
              <div><span className="text-gray-400">狀態：</span>
                <span className={`font-bold px-1.5 py-0.5 rounded-full text-[10px] ${STATUS_CFG[r.status]?.badge}`}>{STATUS_CFG[r.status]?.label}</span>
              </div>
            </div>
          </div>

          {/* 警告文字 */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <div className="text-xs font-bold text-amber-700 mb-1">⚠️ 請注意</div>
            <ul className="text-xs text-amber-700 space-y-0.5 list-disc list-inside">
              {isApproved && <li>此假單已核准，銷假後需重新申請。</li>}
              <li>銷假後，假單將從系統中移除，無法復原。</li>
              <li>請確認已通知職務代理人解除代理安排。</li>
              <li>如需重新申請，請至「申請休假」頁面。</li>
            </ul>
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-3">
            <button onClick={()=>setCancelModal(null)}
              className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all">
              返回
            </button>
            <button onClick={()=>handleCancelLeave(r)}
              className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-all">
              確認銷假
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderNoticeModal = () => {
    if (!noticeModal) return null;
    const { req, prevDay } = noticeModal;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
          <div className="flex items-start gap-3">
            <div className="text-3xl">📢</div>
            <div>
              <div className="text-base font-bold text-gray-800">休假前知會提醒</div>
              <div className="text-xs text-gray-500 mt-1">送出前，請確認已完成知會義務</div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-amber-700">📅 本次休假資訊</div>
            <div className="text-sm text-gray-700">
              <span className="font-bold">{req.employeeName}</span> ·&nbsp;
              {req.leaveTypeName} ·&nbsp;
              <span className="font-bold text-violet-700">{req.startDate} ～ {req.endDate}</span>
              {req.isConsecutive && <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-bold">連休 {req.days} 天</span>}
            </div>
            <div className="text-xs text-amber-600">
              ⚠️ 須於 <span className="font-bold text-amber-800">{prevDay}（休假前一工作日）</span> 前完成知會
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-gray-600 mb-2">須知會對象：</div>
            {[
              { icon:'💼', label:'業務', desc:'確認休假期間業務交接狀況' },
              { icon:'📋', label:'業管', desc:'簽核請假單，掌握人力配置' },
              { icon:'💬', label:'部門群組', desc:'於 LINE/Teams 群組告知排休訊息' },
            ].map(item=>(
              <div key={item.label} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <div className="text-xs font-bold text-gray-700">{item.label}</div>
                  <div className="text-[10px] text-gray-500">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input type="checkbox" checked={noticeConfirm} onChange={e=>setNoticeConfirm(e.target.checked)}
              className="w-4 h-4 accent-violet-600 rounded"/>
            <span className="text-xs text-gray-700 font-medium">
              我已了解，將於 <strong>{prevDay}</strong> 前知會業務、主管及部門群組
            </span>
          </label>

          <div className="flex gap-3">
            <button onClick={handleConfirmSubmit} disabled={!noticeConfirm}
              className="flex-1 py-3 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 disabled:opacity-40 transition-all">
              ✅ 確認送出申請
            </button>
            <button onClick={()=>{setNoticeModal(null);setNoticeConfirm(false);}}
              className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all">
              取消
            </button>
          </div>
        </div>
      </div>
    );
  };


  const sectionMap = {
    dashboard: renderDashboard,
    apply:     renderApply,
    review:    renderReview,
    calendar:  renderCalendar,
    stats:     renderStats,
    ai:        renderAI,
    export:    renderExport,
    logs:      renderLogs,
    settings:  renderSettings,
  };

  return (
    <div style={{minHeight:windowHeight+'px'}} className="bg-gray-50 font-sans flex flex-col">
      {renderNoticeModal()}
      {renderCancelModal()}
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-all text-sm">← 返回</button>
            <div className="text-sm font-bold text-gray-800">🗓️ 休假管理系統</div>
            {syncStatus==='saving'&&<span className="text-[10px] text-amber-500">⏳ 儲存中…</span>}
            {syncStatus==='saved' &&<span className="text-[10px] text-emerald-500">✅ 已儲存</span>}
            {syncStatus==='error'&&<span className="text-[10px] text-red-500">❌ 儲存失敗</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{currentUser?.name}</span>
            {isAdmin&&<span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">管理者</span>}
            <button onClick={()=>{ setCurrentUser(null); setIsAdmin(false); setLoginDept(''); }}
              className="text-xs text-gray-400 hover:text-red-500 transition-all ml-1">登出</button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full flex flex-1 px-4 py-4 gap-4">
        {/* ── Sidebar ─────────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col w-44 flex-shrink-0 gap-1">
          {menuItems.map(item=>(
            <button key={item.key} onClick={()=>setActiveSection(item.key)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${activeSection===item.key?'bg-violet-600 text-white shadow-sm':'text-gray-500 hover:bg-white hover:text-gray-700 hover:shadow-sm'}`}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          {dataLoading && <div className="text-[10px] text-gray-400 px-3 mt-2">⏳ 載入中…</div>}
        </div>

        {/* ── Content ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 pb-20 lg:pb-4">
          {(sectionMap[activeSection]||renderDashboard)()}
        </div>
      </div>

      {/* ── Mobile Bottom Nav ─────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-40">
        <div className="flex justify-around">
          {[
            {key:'dashboard',icon:'🏠',label:'首頁'},
            {key:'apply',    icon:'✏️', label:'申請'},
            ...(isAdmin?[{key:'review',icon:'📋',label:`審核${dashStats.conflictCount>0?`(${dashStats.conflictCount})`:''}` }]:[]),
            {key:'calendar', icon:'📅',label:'月曆'},
            ...(isAdmin?[{key:'stats',icon:'📊',label:'統計'}]:[]),
          ].map(item=>(
            <button key={item.key} onClick={()=>setActiveSection(item.key)}
              className={`flex flex-col items-center py-2 px-2 text-[10px] font-bold transition-all ${activeSection===item.key?'text-violet-600':'text-gray-400'}`}>
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaveTool;
