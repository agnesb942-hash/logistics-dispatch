import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════
// 車輛里程管理系統 — Phase 1 MVP
// ═══════════════════════════════════════════════════════════════════════

// ── 預設資料 ──────────────────────────────────────────────────────────
const DEFAULT_DEPARTMENTS = [
  { id: 'dept_logi', name: '物流部', code: 'LOGI' },
  { id: 'dept_sale', name: '業務部', code: 'SALE' },
];

const DEFAULT_VEHICLES = [
  { id:'v01',plate:'BMQ-6180',name:'BMQ-6180',deptId:'dept_logi',assignedTo:'',status:'active' },
  { id:'v02',plate:'BMT-6092',name:'BMT-6092',deptId:'dept_logi',assignedTo:'',status:'active' },
  { id:'v03',plate:'BSQ-7353',name:'BSQ-7353',deptId:'dept_logi',assignedTo:'',status:'active' },
  { id:'v04',plate:'BUB-0572',name:'BUB-0572',deptId:'dept_logi',assignedTo:'',status:'active' },
  { id:'v05',plate:'BUB-1036',name:'BUB-1036',deptId:'dept_logi',assignedTo:'',status:'active' },
  { id:'v06',plate:'BUB-1332',name:'BUB-1332',deptId:'dept_logi',assignedTo:'',status:'active' },
  { id:'v07',plate:'BUB-1562',name:'BUB-1562',deptId:'dept_logi',assignedTo:'',status:'active' },
  { id:'v08',plate:'BZH-7903',name:'BZH-7903',deptId:'dept_logi',assignedTo:'',status:'active' },
  { id:'v09',plate:'BZH-8131',name:'BZH-8131',deptId:'dept_logi',assignedTo:'',status:'active' },
  { id:'v10',plate:'BZH-8393',name:'BZH-8393',deptId:'dept_logi',assignedTo:'',status:'active' },
  { id:'v11',plate:'BUF-7506',name:'BUF-7506',deptId:'dept_logi',assignedTo:'',status:'active' },
  { id:'v12',plate:'BUF-7507',name:'BUF-7507',deptId:'dept_logi',assignedTo:'',status:'active' },
  { id:'v13',plate:'BVY-0363',name:'BVY-0363',deptId:'dept_logi',assignedTo:'',status:'active' },
  { id:'v14',plate:'BYV-2830',name:'BYV-2830',deptId:'dept_logi',assignedTo:'',status:'active' },
  { id:'v15',plate:'BYV-2831',name:'BYV-2831',deptId:'dept_logi',assignedTo:'',status:'active' },
  { id:'v16',plate:'BZH-9217',name:'BZH-9217',deptId:'dept_logi',assignedTo:'',status:'active' },
  { id:'v17',plate:'BZH-9223',name:'BZH-9223',deptId:'dept_logi',assignedTo:'',status:'active' },
  { id:'v18',plate:'BKE-7387',name:'BKE-7387',deptId:'dept_sale',assignedTo:'',status:'active' },
  { id:'v19',plate:'BMP-1612',name:'BMP-1612',deptId:'dept_sale',assignedTo:'',status:'active' },
  { id:'v20',plate:'BQC-3793',name:'BQC-3793',deptId:'dept_sale',assignedTo:'',status:'active' },
  { id:'v21',plate:'BQC-7176',name:'BQC-7176',deptId:'dept_sale',assignedTo:'',status:'active' },
  { id:'v22',plate:'BUA-3107',name:'BUA-3107',deptId:'dept_sale',assignedTo:'',status:'active' },
  { id:'v23',plate:'BUA-3265',name:'BUA-3265',deptId:'dept_sale',assignedTo:'',status:'active' },
  { id:'v24',plate:'BUA-3721',name:'BUA-3721',deptId:'dept_sale',assignedTo:'',status:'active' },
  { id:'v25',plate:'BUC-6837',name:'BUC-6837',deptId:'dept_sale',assignedTo:'',status:'active' },
  { id:'v26',plate:'BUC-6933',name:'BUC-6933',deptId:'dept_sale',assignedTo:'',status:'active' },
  { id:'v27',plate:'BUC-7100',name:'BUC-7100',deptId:'dept_sale',assignedTo:'',status:'active' },
  { id:'v28',plate:'BVY-3570',name:'BVY-3570',deptId:'dept_sale',assignedTo:'',status:'active' },
  { id:'v29',plate:'BZH-3897',name:'BZH-3897',deptId:'dept_sale',assignedTo:'',status:'active' },
  { id:'v30',plate:'BZH-3896',name:'BZH-3896',deptId:'dept_sale',assignedTo:'',status:'active' },
  { id:'v31',plate:'BZH-3895',name:'BZH-3895',deptId:'dept_sale',assignedTo:'',status:'active' },
  { id:'v32',plate:'BZH-7913',name:'BZH-7913',deptId:'dept_sale',assignedTo:'',status:'active' },
  { id:'v33',plate:'BMT-5733',name:'BMT-5733',deptId:'dept_sale',assignedTo:'',status:'active' },
  { id:'v34',plate:'BMT-5803',name:'BMT-5803',deptId:'dept_sale',assignedTo:'',status:'active' },
  { id:'v35',plate:'BQC-3661',name:'BQC-3661',deptId:'dept_sale',assignedTo:'',status:'active' },
  { id:'v36',plate:'BQC-3973',name:'BQC-3973',deptId:'dept_sale',assignedTo:'',status:'active' },
];

// 2月份初始里程（作為 seed data）
const FEB_MILEAGE = {
  'BMQ-6180':321243,'BMT-6092':291555,'BSQ-7353':198144,'BUB-0572':273964,
  'BUB-1036':355468,'BUB-1332':359884,'BUB-1562':310872,'BZH-7903':195169,
  'BZH-8131':157607,'BZH-8393':122864,'BUF-7506':82482,'BUF-7507':102753,
  'BVY-0363':71616,'BYV-2830':86531,'BYV-2831':51688,'BZH-9217':38779,
  'BZH-9223':33715,'BKE-7387':327615,'BMP-1612':336583,'BQC-3793':103949,
  'BQC-7176':186551,'BUA-3107':202919,'BUA-3265':257677,'BUA-3721':288001,
  'BUC-6837':54956,'BUC-6933':264241,'BUC-7100':178060,'BVY-3570':103128,
  'BZH-3897':72524,'BZH-3896':113016,'BZH-3895':80826,'BZH-7913':67859,
  'BMT-5733':146226,'BMT-5803':137606,'BQC-3661':191364,'BQC-3973':115342,
};

const DEFAULT_PERSONNEL = [
  // 物流部
  { id:'p01',name:'陳承業',role:'driver',deptId:'dept_logi',status:'active' },
  { id:'p02',name:'馬一帆',role:'driver',deptId:'dept_logi',status:'active' },
  { id:'p15',name:'蕭頎俊',role:'driver',deptId:'dept_logi',status:'active' },
  { id:'p16',name:'吳泓諭',role:'driver',deptId:'dept_logi',status:'active' },
  { id:'p17',name:'林凱鴻',role:'driver',deptId:'dept_logi',status:'active' },
  { id:'p03',name:'石宗民',role:'driver',deptId:'dept_logi',status:'active' },
  { id:'p04',name:'林信宏',role:'driver',deptId:'dept_logi',status:'active' },
  { id:'p05',name:'顏瑋慶',role:'driver',deptId:'dept_logi',status:'active' },
  { id:'p06',name:'楊展儀',role:'driver',deptId:'dept_logi',status:'active' },
  { id:'p07',name:'陳崇倫',role:'driver',deptId:'dept_logi',status:'active' },
  { id:'p08',name:'鄭松岩',role:'driver',deptId:'dept_logi',status:'active' },
  { id:'p09',name:'鄭宇婷',role:'driver',deptId:'dept_logi',status:'active' },
  { id:'p10',name:'許展綸',role:'driver',deptId:'dept_logi',status:'active' },
  { id:'p11',name:'林秉裕',role:'driver',deptId:'dept_logi',status:'active' },
  { id:'p12',name:'郭軒齊',role:'driver',deptId:'dept_logi',status:'active' },
  { id:'p13',name:'梁鈞為',role:'driver',deptId:'dept_logi',status:'active' },
  { id:'p14',name:'吳冠霖',role:'driver',deptId:'dept_logi',status:'active' },
  // 業務部
  { id:'p18',name:'韋羽泰',role:'driver',deptId:'dept_sale',status:'active' },
  { id:'p19',name:'陳柏宏',role:'driver',deptId:'dept_sale',status:'active' },
  { id:'p20',name:'洪彬元',role:'driver',deptId:'dept_sale',status:'active' },
  { id:'p21',name:'羅惠銘',role:'driver',deptId:'dept_sale',status:'active' },
  { id:'p22',name:'張瀧澄',role:'driver',deptId:'dept_sale',status:'active' },
  { id:'p23',name:'邱睿達',role:'driver',deptId:'dept_sale',status:'active' },
  { id:'p24',name:'張秉哲',role:'driver',deptId:'dept_sale',status:'active' },
  { id:'p25',name:'林錩毅',role:'driver',deptId:'dept_sale',status:'active' },
  { id:'p26',name:'謝柏瑋',role:'driver',deptId:'dept_sale',status:'active' },
  { id:'p27',name:'張書懷',role:'driver',deptId:'dept_sale',status:'active' },
  { id:'p28',name:'蔡孟學',role:'driver',deptId:'dept_sale',status:'active' },
  { id:'p29',name:'黃致為',role:'driver',deptId:'dept_sale',status:'active' },
  { id:'p30',name:'顏羽宏',role:'driver',deptId:'dept_sale',status:'active' },
  { id:'p31',name:'吳誌文',role:'driver',deptId:'dept_sale',status:'active' },
];

// ── Firebase 共用 ─────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAe5gxLBHN9CQ6zVhKF6zQGbvgMXCbqoF4",
  authDomain: "jc-logi-map.firebaseapp.com",
  projectId: "jc-logi-map",
  storageBucket: "jc-logi-map.firebasestorage.app",
  messagingSenderId: "98258062805",
  appId: "1:98258062805:web:d004b291c639e126e7c15c"
};

let _fbInstance = null;
const initFirebase = async () => {
  if (_fbInstance) return _fbInstance;
  try {
    const fbApp = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const fstore = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const existingApps = fbApp.getApps();
    const app = existingApps.length > 0 ? existingApps[0] : fbApp.initializeApp(FIREBASE_CONFIG);
    const db = fstore.getFirestore(app);
    _fbInstance = { db, ...fstore };
    return _fbInstance;
  } catch (e) {
    console.warn('[MileageTool][Firebase] init failed:', e);
    return null;
  }
};

// ── 工具函式 ──────────────────────────────────────────────────────────
const getTaiwanPeriod = () => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const getPrevPeriod = (period) => {
  const [y, m] = period.split('-').map(Number);
  const pm = m === 1 ? 12 : m - 1;
  const py = m === 1 ? y - 1 : y;
  return `${py}-${String(pm).padStart(2, '0')}`;
};
const fmtNum = (n) => n == null ? '—' : Number(n).toLocaleString();

// ═══════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════
const MileageTool = ({ onBack, windowHeight }) => {
  // ── Auth ─────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [adminPwInput, setAdminPwInput] = useState('');
  const [adminPwError, setAdminPwError] = useState(false);
  const [loginDept, setLoginDept] = useState('');
  const [customName, setCustomName] = useState('');

  // ── Core Data (Firestore synced) ────────────────────────────────
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [vehicles, setVehicles] = useState(DEFAULT_VEHICLES);
  const [personnel, setPersonnel] = useState(DEFAULT_PERSONNEL);
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [adhocRecords, setAdhocRecords] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  // ── UI State ────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState('dashboard'); // dashboard | monthly | adhoc | vehicles | personnel | departments | export
  const [selectedPeriod, setSelectedPeriod] = useState(getTaiwanPeriod());
  const [filterDept, setFilterDept] = useState('all');
  const [showModal, setShowModal] = useState(null); // null | 'monthly' | 'adhoc' | 'vehicle' | 'person' | 'dept'
  const [editItem, setEditItem] = useState(null);

  // ── Report Form State ───────────────────────────────────────────
  const [reportVehicle, setReportVehicle] = useState('');
  const [reportReading, setReportReading] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  const [reportPeriod, setReportPeriod] = useState(getTaiwanPeriod());
  const [reportProxy, setReportProxy] = useState(''); // 代填：實際回報人 ID
  // Adhoc form
  const [adhocVehicle, setAdhocVehicle] = useState('');
  const [adhocDate, setAdhocDate] = useState(new Date().toISOString().slice(0, 10));
  const [adhocStart, setAdhocStart] = useState('');
  const [adhocEnd, setAdhocEnd] = useState('');
  const [adhocPurpose, setAdhocPurpose] = useState('');
  const [adhocNotes, setAdhocNotes] = useState('');
  const [adhocProxy, setAdhocProxy] = useState(''); // 代填：實際使用人 ID

  // ── Firestore CRUD ──────────────────────────────────────────────
  const saveCollection = async (collName, data) => {
    const fb = await initFirebase();
    if (!fb) { setSyncStatus('error'); return; }
    try {
      setSyncStatus('saving');
      await fb.setDoc(fb.doc(fb.db, 'mileage_config', collName), { data, updatedAt: new Date().toISOString() });
      setSyncStatus('saved');
      setTimeout(() => setSyncStatus(''), 2000);
    } catch (e) {
      console.error('[MileageTool] save failed:', collName, e);
      setSyncStatus('error:' + (e?.code || e?.message || ''));
    }
  };

  const loadCollection = async (collName) => {
    const fb = await initFirebase();
    if (!fb) return null;
    try {
      const snap = await fb.getDoc(fb.doc(fb.db, 'mileage_config', collName));
      if (snap.exists()) return snap.data().data;
    } catch (e) { console.warn('[MileageTool] load failed:', collName, e); }
    return null;
  };

  // ── Initial Load ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setDataLoading(true);
      const [depts, vehs, pers, monthly, adhoc] = await Promise.all([
        loadCollection('departments'),
        loadCollection('vehicles'),
        loadCollection('personnel'),
        loadCollection('monthly_records'),
        loadCollection('adhoc_records'),
      ]);
      if (depts) setDepartments(depts);
      if (vehs) setVehicles(vehs);
      if (pers) setPersonnel(pers);
      if (monthly) setMonthlyRecords(monthly);
      if (adhoc) setAdhocRecords(adhoc);
      setDataLoading(false);
    };
    load();
  }, []);

  // ── Auto Save helpers ───────────────────────────────────────────
  const debounceRef = useRef({});
  const autoSave = (key, data, setter) => {
    setter(data);
    if (debounceRef.current[key]) clearTimeout(debounceRef.current[key]);
    debounceRef.current[key] = setTimeout(() => saveCollection(key, data), 1500);
  };

  // ── Auth helpers ────────────────────────────────────────────────
  const ADMIN_PW = 'admin2024';

  // Group personnel by department for the selection screen
  const personnelByDept = useMemo(() => {
    const active = personnel.filter(p => p.status === 'active');
    const logi = active.filter(p => p.deptId === 'dept_logi');
    const sale = active.filter(p => p.deptId === 'dept_sale');
    return { logi, sale };
  }, [personnel]);

  // ── Get previous reading for a vehicle ──────────────────────────
  const getPrevReading = (vehiclePlate, period) => {
    const prev = getPrevPeriod(period);
    const rec = monthlyRecords.find(r => r.vehiclePlate === vehiclePlate && r.period === prev);
    if (rec) return rec.odometerReading;
    // Fallback to Feb seed data
    if (prev === '2026-02' || !monthlyRecords.some(r => r.vehiclePlate === vehiclePlate)) {
      return FEB_MILEAGE[vehiclePlate] || null;
    }
    return null;
  };

  // ── Get last known mileage for a vehicle (from all sources) ─────
  const getLastKnownMileage = (vehiclePlate) => {
    const readings = [];
    // From monthly records
    monthlyRecords.filter(r => r.vehiclePlate === vehiclePlate).forEach(r => { if (r.odometerReading) readings.push(r.odometerReading); });
    // From trip/adhoc records
    adhocRecords.filter(r => r.vehiclePlate === vehiclePlate).forEach(r => { if (r.endMileage) readings.push(r.endMileage); });
    // From seed data
    if (FEB_MILEAGE[vehiclePlate]) readings.push(FEB_MILEAGE[vehiclePlate]);
    return readings.length > 0 ? Math.max(...readings) : null;
  };

  // ── Submit monthly report ───────────────────────────────────────
  const handleSubmitMonthly = () => {
    if (!reportVehicle || !reportReading) return;
    const reading = parseInt(reportReading);
    if (isNaN(reading) || reading < 0) return;

    const veh = vehicles.find(v => v.id === reportVehicle);
    if (!veh) return;
    const prevReading = getPrevReading(veh.plate, reportPeriod);
    const monthlyMileage = prevReading != null ? reading - prevReading : null;

    // Anomaly check
    if (monthlyMileage != null && monthlyMileage < 0) {
      alert(`錯誤：累計里程 ${fmtNum(reading)} 小於上期 ${fmtNum(prevReading)}，里程表不可能倒退，請重新確認數值。`);
      return;
    }
    if (monthlyMileage != null && monthlyMileage > 10000) {
      if (!window.confirm(`本月行駛里程 ${fmtNum(monthlyMileage)} km 異常偏高，是否確認送出？`)) return;
    }

    // Check if already reported
    const actualPerson = reportProxy ? personnel.find(p => p.id === reportProxy) : currentUser;
    const existingIdx = monthlyRecords.findIndex(r => r.vehiclePlate === veh.plate && r.period === reportPeriod);
    const record = {
      id: existingIdx >= 0 ? monthlyRecords[existingIdx].id : `mr_${Date.now()}`,
      vehicleId: veh.id,
      vehiclePlate: veh.plate,
      reporterId: actualPerson?.id || currentUser.id,
      reporterName: actualPerson?.name || currentUser.name,
      proxyById: reportProxy ? currentUser.id : '',
      proxyByName: reportProxy ? currentUser.name : '',
      period: reportPeriod,
      odometerReading: reading,
      previousReading: prevReading,
      monthlyMileage,
      notes: reportNotes,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };

    let newRecords;
    if (existingIdx >= 0) {
      newRecords = [...monthlyRecords];
      newRecords[existingIdx] = record;
    } else {
      newRecords = [...monthlyRecords, record];
    }
    autoSave('monthly_records', newRecords, setMonthlyRecords);
    setReportVehicle('');
    setReportReading('');
    setReportNotes('');
    setReportProxy('');
    setShowModal(null);
  };

  // ── Submit adhoc report ─────────────────────────────────────────
  const handleSubmitAdhoc = () => {
    if (!adhocVehicle || !adhocStart || !adhocEnd || !adhocPurpose) return;
    const start = parseInt(adhocStart);
    const end = parseInt(adhocEnd);
    if (isNaN(start) || isNaN(end)) return;
    if (end <= start) {
      alert('錯誤：結束里程必須大於起始里程，里程表不可能倒退。');
      return;
    }
    const veh = vehicles.find(v => v.id === adhocVehicle);
    // Check against last known reading for this vehicle
    const lastKnown = getLastKnownMileage(veh.plate);
    if (lastKnown != null && start < lastKnown) {
      alert(`錯誤：起始里程 ${fmtNum(start)} 小於該車最近已知里程 ${fmtNum(lastKnown)}，里程表不可能倒退，請重新確認。`);
      return;
    }
    const actualUser = adhocProxy ? personnel.find(p => p.id === adhocProxy) : currentUser;
    const record = {
      id: `ar_${Date.now()}`,
      vehicleId: veh.id,
      vehiclePlate: veh.plate,
      userId: actualUser?.id || currentUser.id,
      userName: actualUser?.name || currentUser.name,
      proxyById: adhocProxy ? currentUser.id : '',
      proxyByName: adhocProxy ? currentUser.name : '',
      date: adhocDate,
      startMileage: start,
      endMileage: end,
      tripMileage: end - start,
      purpose: adhocPurpose,
      notes: adhocNotes,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };
    const newRecords = [...adhocRecords, record];
    autoSave('adhoc_records', newRecords, setAdhocRecords);
    setAdhocVehicle('');
    setAdhocStart('');
    setAdhocEnd('');
    setAdhocPurpose('');
    setAdhocNotes('');
    setAdhocProxy('');
    setShowModal(null);
  };

  // ── Approve / Reject ────────────────────────────────────────────
  const handleApprove = (recordId, type) => {
    if (type === 'monthly') {
      const newRecords = monthlyRecords.map(r => r.id === recordId ? { ...r, status: 'approved', approvedBy: currentUser.name, approvedAt: new Date().toISOString() } : r);
      autoSave('monthly_records', newRecords, setMonthlyRecords);
    } else {
      const newRecords = adhocRecords.map(r => r.id === recordId ? { ...r, status: 'approved', approvedBy: currentUser.name } : r);
      autoSave('adhoc_records', newRecords, setAdhocRecords);
    }
  };
  const handleReject = (recordId, type) => {
    const reason = window.prompt('請輸入退回原因：');
    if (!reason) return;
    if (type === 'monthly') {
      const newRecords = monthlyRecords.map(r => r.id === recordId ? { ...r, status: 'rejected', rejectReason: reason, approvedBy: currentUser.name } : r);
      autoSave('monthly_records', newRecords, setMonthlyRecords);
    } else {
      const newRecords = adhocRecords.map(r => r.id === recordId ? { ...r, status: 'rejected', rejectReason: reason } : r);
      autoSave('adhoc_records', newRecords, setAdhocRecords);
    }
  };
  const handleDeleteRecord = (recordId, type) => {
    if (!window.confirm('確定刪除此筆紀錄？')) return;
    if (type === 'monthly') {
      autoSave('monthly_records', monthlyRecords.filter(r => r.id !== recordId), setMonthlyRecords);
    } else {
      autoSave('adhoc_records', adhocRecords.filter(r => r.id !== recordId), setAdhocRecords);
    }
  };

  // ── Export CSV ──────────────────────────────────────────────────
  const exportCSV = (type) => {
    const BOM = '\uFEFF';
    let headers, rows;
    if (type === 'monthly') {
      headers = ['期別','車牌','累計里程','上期里程','本月里程','回報人','代填人','狀態','備註','回報時間'];
      rows = monthlyRecords.filter(r => filterDept === 'all' || vehicles.find(v => v.plate === r.vehiclePlate)?.deptId === filterDept)
        .sort((a, b) => a.period.localeCompare(b.period) || a.vehiclePlate.localeCompare(b.vehiclePlate))
        .map(r => [r.period, r.vehiclePlate, r.odometerReading, r.previousReading ?? '', r.monthlyMileage ?? '', r.reporterName, r.proxyByName || '', r.status === 'approved' ? '已審核' : r.status === 'rejected' ? '退回' : '待審', r.notes || '', r.submittedAt || '']);
    } else {
      headers = ['日期','車牌','使用人','代填人','起始里程','結束里程','區間里程','事由','狀態','備註'];
      rows = adhocRecords.map(r => [r.date, r.vehiclePlate, r.userName, r.proxyByName || '', r.startMileage, r.endMileage, r.tripMileage, r.purpose, r.status === 'approved' ? '已審核' : '待審', r.notes || '']);
    }
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${type === 'monthly' ? '月報里程' : '用車紀錄'}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Computed Stats ──────────────────────────────────────────────
  const periodRecords = useMemo(() =>
    monthlyRecords.filter(r => r.period === selectedPeriod), [monthlyRecords, selectedPeriod]);

  const reportProgress = useMemo(() => {
    const activeVehicles = vehicles.filter(v => v.status === 'active' && (filterDept === 'all' || v.deptId === filterDept));
    const reported = activeVehicles.filter(v => periodRecords.some(r => r.vehiclePlate === v.plate));
    return { total: activeVehicles.length, reported: reported.length, missing: activeVehicles.filter(v => !periodRecords.some(r => r.vehiclePlate === v.plate)) };
  }, [vehicles, periodRecords, filterDept]);

  // ── Reconciliation: odometer diff vs trip sum ───────────────────
  const reconciliation = useMemo(() => {
    return periodRecords.map(rec => {
      const tripSum = adhocRecords
        .filter(r => r.vehiclePlate === rec.vehiclePlate && r.date && r.date.startsWith(selectedPeriod))
        .reduce((s, r) => s + (r.tripMileage || 0), 0);
      const odometerDiff = rec.monthlyMileage || 0;
      const gap = odometerDiff - tripSum;
      return { plate: rec.vehiclePlate, odometerDiff, tripSum, gap, hasGap: gap !== 0 };
    });
  }, [periodRecords, adhocRecords, selectedPeriod]);

  const statusMap = { submitted: { label: '待審核', color: 'bg-amber-100 text-amber-700' }, approved: { label: '已審核', color: 'bg-green-100 text-green-700' }, rejected: { label: '已退回', color: 'bg-red-100 text-red-700' } };

  // ═════════════════════════════════════════════════════════════════
  // RENDER: Identity Selection (no password for users)
  // ═════════════════════════════════════════════════════════════════
  if (!currentUser) {
    return (
      <div style={{ minHeight: windowHeight + 'px' }} className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-start justify-center font-sans overflow-y-auto py-10">
        <div className="w-full max-w-md mx-4">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">📊</div>
            <h1 className="text-xl font-bold text-white tracking-wider">車輛里程管理系統</h1>
            <p className="text-emerald-400 text-xs tracking-widest mt-2 uppercase">Vehicle Mileage Management</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur rounded-2xl p-6 border border-white border-opacity-20 space-y-4">
            {!loginDept ? <>
              {/* Step 1: 選擇部門 */}
              <div className="text-xs text-emerald-300 font-bold tracking-wider">請選擇部門</div>
              <div className="grid grid-cols-2 gap-3">
                {departments.map(d => (
                  <button key={d.id} onClick={() => setLoginDept(d.id)}
                    className="py-4 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-xl text-white text-sm font-bold hover:bg-emerald-500 hover:bg-opacity-30 hover:border-emerald-400 transition-all">
                    {d.name}
                    <div className="text-[10px] text-white text-opacity-30 mt-1">{personnelByDept[d.id === 'dept_logi' ? 'logi' : 'sale'].length} 人</div>
                  </button>
                ))}
              </div>
            </> : <>
              {/* Step 2: 選擇姓名 */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-emerald-300 font-bold tracking-wider">{departments.find(d=>d.id===loginDept)?.name} — 請選擇姓名</div>
                <button onClick={() => setLoginDept('')} className="text-[10px] text-white text-opacity-40 hover:text-opacity-80 transition-all">← 返回</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {personnelByDept[loginDept === 'dept_logi' ? 'logi' : 'sale'].map(p => (
                  <button key={p.id} onClick={() => { setCurrentUser(p); setActiveSection('dashboard'); setLoginDept(''); }}
                    className="py-2.5 px-2 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white text-xs font-bold hover:bg-emerald-500 hover:bg-opacity-30 hover:border-emerald-400 transition-all">
                    {p.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input value={customName} onChange={e => setCustomName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && customName.trim()) { setCurrentUser({ id: `custom_${Date.now()}`, name: customName.trim(), deptId: loginDept, status: 'active' }); setActiveSection('dashboard'); setLoginDept(''); setCustomName(''); } }}
                  placeholder="不在名單內？輸入姓名"
                  className="flex-1 p-2 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white text-xs outline-none focus:border-emerald-400 placeholder-white placeholder-opacity-20" />
                <button onClick={() => { if (!customName.trim()) return; setCurrentUser({ id: `custom_${Date.now()}`, name: customName.trim(), deptId: loginDept, status: 'active' }); setActiveSection('dashboard'); setLoginDept(''); setCustomName(''); }}
                  disabled={!customName.trim()}
                  className="px-3 py-2 bg-emerald-500 bg-opacity-30 border border-emerald-400 border-opacity-30 rounded-lg text-emerald-300 text-xs font-bold hover:bg-opacity-50 disabled:opacity-30 transition-all">
                  進入
                </button>
              </div>
            </>}
            <div className="pt-2 flex gap-2">
              <button onClick={() => setShowAdminPw(true)}
                className="flex-1 py-2 text-emerald-400 text-opacity-50 text-[10px] border border-emerald-400 border-opacity-20 rounded-lg hover:border-opacity-50 hover:text-opacity-80 transition-all tracking-wider">
                🔐 管理者登入
              </button>
              <button onClick={onBack}
                className="flex-1 py-2 text-white text-opacity-30 text-[10px] border border-white border-opacity-10 rounded-lg hover:text-opacity-60 transition-all">
                返回首頁
              </button>
            </div>
          </div>
          {/* Admin password modal */}
          {showAdminPw && (
            <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center" onClick={() => { setShowAdminPw(false); setAdminPwInput(''); setAdminPwError(false); }}>
              <div className="bg-slate-800 rounded-2xl p-6 w-80 border border-emerald-500 border-opacity-30 space-y-4" onClick={e => e.stopPropagation()}>
                <div className="text-sm font-bold text-white">🔐 管理者驗證</div>
                <input type="password" value={adminPwInput} onChange={e => setAdminPwInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { if (adminPwInput === ADMIN_PW) { setIsAdmin(true); setCurrentUser({ id: 'admin', name: '管理者', deptId: 'dept_logi' }); setShowAdminPw(false); setAdminPwInput(''); setActiveSection('dashboard'); } else { setAdminPwError(true); setTimeout(() => setAdminPwError(false), 1500); } } }}
                  placeholder="輸入管理者密碼" autoFocus
                  className={`w-full p-2.5 bg-slate-700 border ${adminPwError ? 'border-red-500' : 'border-slate-600'} rounded-lg text-white text-sm outline-none`} />
                {adminPwError && <div className="text-red-400 text-xs">密碼錯誤</div>}
                <button onClick={() => { if (adminPwInput === ADMIN_PW) { setIsAdmin(true); setCurrentUser({ id: 'admin', name: '管理者', deptId: 'dept_logi' }); setShowAdminPw(false); setAdminPwInput(''); setActiveSection('dashboard'); } else { setAdminPwError(true); setTimeout(() => setAdminPwError(false), 1500); } }}
                  className="w-full py-2.5 bg-emerald-500 text-white rounded-lg font-bold text-sm hover:bg-emerald-600">驗證</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER: Main App
  // ═════════════════════════════════════════════════════════════════
  const menuItems = [
    { key: 'dashboard', icon: '📊', label: '儀表板' },
    { key: 'monthly', icon: '📋', label: '月報里程' },
    { key: 'adhoc', icon: '🚗', label: '用車紀錄' },
    ...(isAdmin ? [
      { key: 'vehicles', icon: '🔧', label: '車輛管理' },
      { key: 'personnel', icon: '👥', label: '人員管理' },
    ] : []),
    { key: 'export', icon: '⬇️', label: '匯出報表' },
  ];

  const getDeptName = (deptId) => departments.find(d => d.id === deptId)?.name || deptId;

  return (
    <div className="flex flex-col lg:flex-row font-sans text-gray-900 overflow-hidden" style={{ height: windowHeight + 'px' }}>
      {/* ── Mobile Top Nav ── */}
      <div className="flex lg:hidden bg-slate-900 border-b border-slate-700 px-3 py-2 flex-shrink-0">
        <div className="flex items-center gap-2 mr-3 flex-shrink-0">
          <span className="text-sm">📊</span>
          <div className="text-white text-[10px] font-bold">{currentUser.name}</div>
        </div>
        <div className="flex-1 overflow-x-auto flex gap-1">
          {menuItems.map(item => (
            <button key={item.key} onClick={() => setActiveSection(item.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all
                ${activeSection === item.key ? 'bg-emerald-500 bg-opacity-30 text-emerald-400' : 'text-slate-400'}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-2 flex-shrink-0">
          <button onClick={() => { setCurrentUser(null); setIsAdmin(false); }} className="text-[10px] text-slate-500 px-2">切換</button>
          <button onClick={onBack} className="text-[10px] text-slate-500 px-2">首頁</button>
        </div>
      </div>
      {/* ── Desktop Sidebar ── */}
      <div className="hidden lg:flex w-56 bg-slate-900 flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <div>
              <div className="text-white text-xs font-bold tracking-wider">車輛里程管理</div>
              <div className="text-slate-500 text-[10px]">
                {syncStatus === 'saving' && '● 儲存中…'}
                {syncStatus === 'saved' && '✓ 已同步'}
                {syncStatus.startsWith('error') && '✗ 同步失敗'}
                {!syncStatus && (dataLoading ? '⟳ 載入中…' : 'Firestore 同步')}
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {menuItems.map(item => (
            <button key={item.key} onClick={() => setActiveSection(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-all
                ${activeSection === item.key ? 'bg-emerald-500 bg-opacity-20 text-emerald-400 border-r-2 border-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <span className="text-sm">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <div className="text-slate-400 text-[10px] mb-2">
            {currentUser.name} · {getDeptName(currentUser.deptId)} · {isAdmin ? '👑 管理者' : '使用者'}
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setCurrentUser(null); setIsAdmin(false); }}
              className="flex-1 py-1.5 text-[10px] text-slate-500 border border-slate-700 rounded hover:bg-slate-800 transition-all">切換身份</button>
            <button onClick={onBack}
              className="flex-1 py-1.5 text-[10px] text-slate-500 border border-slate-700 rounded hover:bg-slate-800 transition-all">首頁</button>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="p-3 lg:p-6 max-w-6xl mx-auto space-y-4 lg:space-y-6">

          {/* ═══ DASHBOARD ═══ */}
          {activeSection === 'dashboard' && <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">儀表板</h2>
              <div className="flex items-center gap-3">
                <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs">
                  <option value="all">全部門</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <input type="month" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs" />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">回報進度</div>
                <div className="text-2xl font-bold text-blue-600">{reportProgress.reported}/{reportProgress.total}</div>
                <div className="text-[10px] text-gray-400 mt-1">{reportProgress.total - reportProgress.reported} 輛未回報</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">待審核</div>
                <div className="text-2xl font-bold text-amber-600">{periodRecords.filter(r => r.status === 'submitted').length}</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">本月平均里程</div>
                <div className="text-2xl font-bold text-emerald-600">
                  {periodRecords.filter(r => r.monthlyMileage > 0).length > 0
                    ? fmtNum(Math.round(periodRecords.filter(r => r.monthlyMileage > 0).reduce((s, r) => s + r.monthlyMileage, 0) / periodRecords.filter(r => r.monthlyMileage > 0).length))
                    : '—'}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">km / 車</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">用車紀錄（本月）</div>
                <div className="text-2xl font-bold text-purple-600">
                  {adhocRecords.filter(r => r.date?.startsWith(selectedPeriod)).length}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  {fmtNum(adhocRecords.filter(r => r.date?.startsWith(selectedPeriod)).reduce((s, r) => s + (r.tripMileage || 0), 0))} km
                </div>
              </div>
            </div>

            {/* Missing Reports */}
            {reportProgress.missing.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-amber-700 mb-2">⚠️ 尚未回報（{selectedPeriod}）</h3>
                <div className="flex flex-wrap gap-2">
                  {reportProgress.missing.map(v => (
                    <span key={v.id} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-lg font-bold">{v.plate}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}

            {/* Reconciliation: 勾稽比對 */}
            {isAdmin && reconciliation.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                <div className="text-sm font-bold text-gray-700">🔍 勾稽比對（{selectedPeriod}）</div>
                <div className="text-[10px] text-gray-400 mb-2">里程表差值 vs 用車紀錄加總，有差異代表有未回報的用車紀錄</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-3 py-2 font-bold text-gray-600">車牌</th>
                      <th className="text-right px-3 py-2 font-bold text-gray-600">里程表差值</th>
                      <th className="text-right px-3 py-2 font-bold text-gray-600">用車紀錄加總</th>
                      <th className="text-right px-3 py-2 font-bold text-gray-600">差異</th>
                    </tr></thead>
                    <tbody>
                      {reconciliation.map(r => (
                        <tr key={r.plate} className={`border-b border-gray-100 ${r.hasGap ? 'bg-red-50' : ''}`}>
                          <td className="px-3 py-2 font-bold">{r.plate}</td>
                          <td className="px-3 py-2 text-right font-mono">{fmtNum(r.odometerDiff)}</td>
                          <td className="px-3 py-2 text-right font-mono">{fmtNum(r.tripSum)}</td>
                          <td className={`px-3 py-2 text-right font-mono font-bold ${r.hasGap ? 'text-red-600' : 'text-green-600'}`}>
                            {r.hasGap ? `⚠️ ${fmtNum(r.gap)}` : '✓ 吻合'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowModal('monthly')}
                className="px-4 py-2.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-all shadow-sm">
                + 回報月里程
              </button>
              <button onClick={() => setShowModal('adhoc')}
                className="px-4 py-2.5 bg-purple-500 text-white rounded-lg text-xs font-bold hover:bg-purple-600 transition-all shadow-sm">
                + 回報用車紀錄
              </button>
            </div>
          </>}

          {/* ═══ MONTHLY RECORDS ═══ */}
          {activeSection === 'monthly' && <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">月報里程總表</h2>
              <div className="flex items-center gap-3">
                <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs">
                  <option value="all">全部門</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <input type="month" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs" />
                <button onClick={() => setShowModal('monthly')}
                  className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600">
                  + 回報
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-bold text-gray-600">車牌</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600">部門</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600">累計里程</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600">上期里程</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600">本月里程</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600">回報人</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-600">狀態</th>
                    {isAdmin && <th className="text-center px-4 py-3 font-bold text-gray-600">操作</th>}
                  </tr>
                </thead>
                <tbody>
                  {vehicles
                    .filter(v => v.status === 'active' && (filterDept === 'all' || v.deptId === filterDept))
                    .map(v => {
                      const rec = periodRecords.find(r => r.vehiclePlate === v.plate);
                      return (
                        <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-bold text-gray-800">{v.plate}</td>
                          <td className="px-4 py-3 text-gray-500">{getDeptName(v.deptId)}</td>
                          {rec ? <>
                            <td className="px-4 py-3 text-right font-mono">{fmtNum(rec.odometerReading)}</td>
                            <td className="px-4 py-3 text-right font-mono text-gray-400">{fmtNum(rec.previousReading)}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-blue-600">{fmtNum(rec.monthlyMileage)}</td>
                            <td className="px-4 py-3 text-xs">{rec.reporterName}{rec.proxyByName ? <span className="text-gray-400 ml-1">（{rec.proxyByName} 代填）</span> : ''}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusMap[rec.status]?.color || 'bg-gray-100'}`}>
                                {statusMap[rec.status]?.label || rec.status}
                              </span>
                            </td>
                            {isAdmin && (
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {rec.status === 'submitted' && <>
                                    <button onClick={() => handleApprove(rec.id, 'monthly')} className="text-[10px] px-2 py-1 bg-green-50 text-green-600 rounded font-bold hover:bg-green-100">通過</button>
                                    <button onClick={() => handleReject(rec.id, 'monthly')} className="text-[10px] px-2 py-1 bg-red-50 text-red-600 rounded font-bold hover:bg-red-100">退回</button>
                                  </>}
                                  <button onClick={() => handleDeleteRecord(rec.id, 'monthly')} className="text-[10px] px-2 py-1 text-gray-400 hover:text-red-500">刪</button>
                                </div>
                              </td>
                            )}
                          </> : <>
                            <td className="px-4 py-3 text-right text-gray-300">未回報</td>
                            <td className="px-4 py-3 text-right font-mono text-gray-300">{fmtNum(getPrevReading(v.plate, selectedPeriod))}</td>
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3 text-center"><span className="text-[10px] text-gray-400">—</span></td>
                            {isAdmin && <td className="px-4 py-3"></td>}
                          </>}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </>}

          {/* ═══ ADHOC RECORDS ═══ */}
          {activeSection === 'adhoc' && <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">用車紀錄</h2>
              <button onClick={() => setShowModal('adhoc')}
                className="px-4 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-bold hover:bg-purple-600">+ 回報</button>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-bold text-gray-600">日期</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600">車牌</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600">使用人</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600">起始里程</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600">結束里程</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600">區間里程</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600">事由</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-600">狀態</th>
                    {isAdmin && <th className="text-center px-4 py-3 font-bold text-gray-600">操作</th>}
                  </tr>
                </thead>
                <tbody>
                  {adhocRecords.sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(r => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">{r.date}</td>
                      <td className="px-4 py-3 font-bold">{r.vehiclePlate}</td>
                      <td className="px-4 py-3 text-xs">{r.userName}{r.proxyByName ? <span className="text-gray-400 ml-1">（{r.proxyByName} 代填）</span> : ''}</td>
                      <td className="px-4 py-3 text-right font-mono">{fmtNum(r.startMileage)}</td>
                      <td className="px-4 py-3 text-right font-mono">{fmtNum(r.endMileage)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-purple-600">{fmtNum(r.tripMileage)}</td>
                      <td className="px-4 py-3">{r.purpose}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusMap[r.status]?.color || ''}`}>
                          {statusMap[r.status]?.label || r.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {r.status === 'submitted' && <>
                              <button onClick={() => handleApprove(r.id, 'adhoc')} className="text-[10px] px-2 py-1 bg-green-50 text-green-600 rounded font-bold hover:bg-green-100">通過</button>
                              <button onClick={() => handleReject(r.id, 'adhoc')} className="text-[10px] px-2 py-1 bg-red-50 text-red-600 rounded font-bold hover:bg-red-100">退回</button>
                            </>}
                            <button onClick={() => handleDeleteRecord(r.id, 'adhoc')} className="text-[10px] px-2 py-1 text-gray-400 hover:text-red-500">刪</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {adhocRecords.length === 0 && (
                    <tr><td colSpan={isAdmin ? 9 : 8} className="px-4 py-8 text-center text-gray-400">尚無用車紀錄紀錄</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>}

          {/* ═══ VEHICLE MANAGEMENT ═══ */}
          {activeSection === 'vehicles' && isAdmin && <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">車輛管理（{vehicles.filter(v => v.status === 'active').length} 輛）</h2>
              <button onClick={() => { setEditItem({ plate: '', name: '', deptId: 'dept_logi', assignedTo: '', status: 'active' }); setShowModal('vehicle'); }}
                className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600">+ 新增車輛</button>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-bold text-gray-600">車牌</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600">部門</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600">負責人</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-600">狀態</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-600">2月里程</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map(v => (
                    <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold">{v.plate}</td>
                      <td className="px-4 py-3">{getDeptName(v.deptId)}</td>
                      <td className="px-4 py-3">{personnel.find(p => p.id === v.assignedTo)?.name || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${v.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                          {v.status === 'active' ? '使用中' : v.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-500">{fmtNum(FEB_MILEAGE[v.plate])}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => { setEditItem({ ...v }); setShowModal('vehicle'); }}
                          className="text-[10px] px-2 py-1 text-blue-600 hover:bg-blue-50 rounded font-bold">編輯</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>}

          {/* ═══ PERSONNEL MANAGEMENT ═══ */}
          {activeSection === 'personnel' && isAdmin && <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">人員管理（{personnel.filter(p => p.status === 'active').length} 人）</h2>
              <button onClick={() => { setEditItem({ name: '', role: 'driver', deptId: 'dept_logi', status: 'active' }); setShowModal('person'); }}
                className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600">+ 新增人員</button>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-bold text-gray-600">姓名</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-600">部門</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-600">角色</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-600">狀態</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {personnel.filter(p => p.id !== 'p_admin').map(p => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold">{p.name}</td>
                      <td className="px-4 py-3">{getDeptName(p.deptId)}</td>
                      <td className="px-4 py-3 text-center text-[10px]">{p.role === 'admin' ? '管理者' : '使用者'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                          {p.status === 'active' ? '在職' : '離職'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => { setEditItem({ ...p }); setShowModal('person'); }}
                          className="text-[10px] px-2 py-1 text-blue-600 hover:bg-blue-50 rounded font-bold">編輯</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>}

          {/* ═══ DEPARTMENTS ═══ */}
          {activeSection === 'departments' && isAdmin && <>
            <h2 className="text-lg font-bold text-gray-800">部門管理</h2>
            <div className="grid grid-cols-2 gap-4">
              {departments.map(d => (
                <div key={d.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-800">{d.name}</div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {vehicles.filter(v => v.deptId === d.id && v.status === 'active').length} 輛車・
                        {personnel.filter(p => p.deptId === d.id && p.status === 'active').length} 人
                      </div>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono">{d.code}</span>
                  </div>
                </div>
              ))}
            </div>
          </>}

          {/* ═══ EXPORT ═══ */}
          {activeSection === 'export' && <>
            <h2 className="text-lg font-bold text-gray-800">匯出報表</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-3">
                <div className="text-sm font-bold text-gray-800">📋 月報里程</div>
                <p className="text-xs text-gray-500">匯出所有月報里程紀錄，含審核狀態</p>
                <button onClick={() => exportCSV('monthly')}
                  className="w-full py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600">下載 CSV</button>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-3">
                <div className="text-sm font-bold text-gray-800">🚗 用車紀錄</div>
                <p className="text-xs text-gray-500">匯出所有用車紀錄紀錄</p>
                <button onClick={() => exportCSV('adhoc')}
                  className="w-full py-2 bg-purple-500 text-white rounded-lg text-xs font-bold hover:bg-purple-600">下載 CSV</button>
              </div>
            </div>
          </>}

        </div>
      </div>

      {/* ═══ MODALS ═══ */}
      {showModal === 'monthly' && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-4 lg:p-6 space-y-3 lg:space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-800">📋 回報月里程</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">期別</label>
                <input type="month" value={reportPeriod} onChange={e => setReportPeriod(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">車輛 *</label>
                <select value={reportVehicle} onChange={e => setReportVehicle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-emerald-500 outline-none">
                  <option value="">選擇車輛</option>
                  {vehicles.filter(v => v.status === 'active').map(v => (
                    <option key={v.id} value={v.id}>{v.plate} ({getDeptName(v.deptId)})</option>
                  ))}
                </select>
              </div>
              {reportVehicle && (() => {
                const veh = vehicles.find(v => v.id === reportVehicle);
                const prev = veh ? getPrevReading(veh.plate, reportPeriod) : null;
                return prev != null ? (
                  <div className="text-xs bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                    上期累計里程：<span className="font-bold font-mono">{fmtNum(prev)}</span> km
                  </div>
                ) : null;
              })()}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">本期累計里程表讀數 *（km）</label>
                <input type="number" value={reportReading} onChange={e => setReportReading(e.target.value)}
                  placeholder="例：45230"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-emerald-500 outline-none font-mono" />
              </div>
              {reportReading && reportVehicle && (() => {
                const veh = vehicles.find(v => v.id === reportVehicle);
                const prev = veh ? getPrevReading(veh.plate, reportPeriod) : null;
                const diff = prev != null ? parseInt(reportReading) - prev : null;
                if (diff == null) return null;
                const isAbnormal = diff < 0 || diff > 10000;
                return (
                  <div className={`text-xs rounded-lg p-2.5 border ${isAbnormal ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                    本月行駛里程：<span className="font-bold font-mono">{fmtNum(diff)}</span> km
                    {diff < 0 && ' ❌ 里程表不可能倒退，請重新確認'}
                    {diff >= 0 && diff > 10000 && ' ⚠️ 數值偏高，請確認'}
                  </div>
                );
              })()}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">代填（選填，幫他人填寫時選擇）</label>
                <select value={reportProxy} onChange={e => setReportProxy(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none">
                  <option value="">我自己填寫</option>
                  {personnel.filter(p => p.status === 'active' && p.id !== currentUser?.id).map(p => (
                    <option key={p.id} value={p.id}>代 {p.name} 填寫</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">備註</label>
                <input value={reportNotes} onChange={e => setReportNotes(e.target.value)}
                  placeholder="選填"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-emerald-500 outline-none" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(null)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 font-bold text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleSubmitMonthly} disabled={!reportVehicle || !reportReading}
                className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg font-bold text-sm hover:bg-emerald-600 disabled:opacity-40">送出回報</button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'adhoc' && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-4 lg:p-6 space-y-3 lg:space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-800">🚗 回報用車紀錄</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">車輛 *</label>
                <select value={adhocVehicle} onChange={e => setAdhocVehicle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none">
                  <option value="">選擇車輛</option>
                  {vehicles.filter(v => v.status === 'active').map(v => (
                    <option key={v.id} value={v.id}>{v.plate}</option>
                  ))}
                </select>
              </div>
              {adhocVehicle && (() => { const v = vehicles.find(x => x.id === adhocVehicle); const lk = v ? getLastKnownMileage(v.plate) : null; return lk != null ? <div className="text-xs bg-blue-50 border border-blue-200 rounded-lg p-2.5">該車最近已知里程：<span className="font-bold font-mono">{fmtNum(lk)}</span> km（起始里程不得低於此值）</div> : null; })()}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">日期 *</label>
                <input type="date" value={adhocDate} onChange={e => setAdhocDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">起始里程 *</label>
                  <input type="number" value={adhocStart} onChange={e => setAdhocStart(e.target.value)} placeholder="km"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none font-mono" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">結束里程 *</label>
                  <input type="number" value={adhocEnd} onChange={e => setAdhocEnd(e.target.value)} placeholder="km"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none font-mono" />
                </div>
              </div>
              {adhocStart && adhocEnd && (() => {
                const s = parseInt(adhocStart), e = parseInt(adhocEnd);
                const diff = e - s;
                const v = vehicles.find(x => x.id === adhocVehicle);
                const lk = v ? getLastKnownMileage(v.plate) : null;
                const startBad = lk != null && s < lk;
                const endBad = diff <= 0;
                return <div className={`text-xs rounded-lg p-2.5 border ${startBad || endBad ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                  區間里程：<span className="font-bold font-mono">{fmtNum(diff)}</span> km
                  {startBad && ` ⚠️ 起始里程低於已知里程 ${fmtNum(lk)}`}
                  {endBad && ' ⚠️ 結束里程必須大於起始里程'}
                </div>;
              })()}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">使用事由 *</label>
                <select value={adhocPurpose} onChange={e => setAdhocPurpose(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none">
                  <option value="">選擇事由</option>
                  <option>支援配送</option>
                  <option>臨時調度</option>
                  <option>客戶拜訪</option>
                  <option>維修保養</option>
                  <option>其他</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">代填（選填，幫他人填寫時選擇）</label>
                <select value={adhocProxy} onChange={e => setAdhocProxy(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none">
                  <option value="">我自己填寫</option>
                  {personnel.filter(p => p.status === 'active' && p.id !== currentUser?.id).map(p => (
                    <option key={p.id} value={p.id}>代 {p.name} 填寫</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">備註</label>
                <input value={adhocNotes} onChange={e => setAdhocNotes(e.target.value)} placeholder="選填"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(null)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 font-bold text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleSubmitAdhoc} disabled={!adhocVehicle || !adhocStart || !adhocEnd || !adhocPurpose}
                className="flex-1 py-2.5 bg-purple-500 text-white rounded-lg font-bold text-sm hover:bg-purple-600 disabled:opacity-40">送出回報</button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'vehicle' && editItem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => { setShowModal(null); setEditItem(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-4 lg:p-6 space-y-3 lg:space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-800">{editItem.id ? '編輯車輛' : '新增車輛'}</h3>
            <div className="space-y-3">
              <div><label className="text-xs font-bold text-gray-500 block mb-1">車牌 *</label>
                <input value={editItem.plate} onChange={e => setEditItem({ ...editItem, plate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none" /></div>
              <div><label className="text-xs font-bold text-gray-500 block mb-1">部門</label>
                <select value={editItem.deptId} onChange={e => setEditItem({ ...editItem, deptId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none">
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select></div>
              <div><label className="text-xs font-bold text-gray-500 block mb-1">負責人</label>
                <select value={editItem.assignedTo} onChange={e => setEditItem({ ...editItem, assignedTo: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none">
                  <option value="">未指定</option>
                  {personnel.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select></div>
              <div><label className="text-xs font-bold text-gray-500 block mb-1">狀態</label>
                <select value={editItem.status} onChange={e => setEditItem({ ...editItem, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none">
                  <option value="active">使用中</option>
                  <option value="maintenance">維修中</option>
                  <option value="retired">已報廢</option>
                </select></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowModal(null); setEditItem(null); }} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 font-bold text-sm hover:bg-gray-50">取消</button>
              <button onClick={() => {
                const plate = editItem.plate.trim();
                if (!plate) return;
                let newVehicles;
                if (editItem.id) {
                  newVehicles = vehicles.map(v => v.id === editItem.id ? { ...editItem, name: plate } : v);
                } else {
                  newVehicles = [...vehicles, { ...editItem, id: `v_${Date.now()}`, name: plate }];
                }
                autoSave('vehicles', newVehicles, setVehicles);
                setShowModal(null);
                setEditItem(null);
              }} className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg font-bold text-sm hover:bg-blue-600">儲存</button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'person' && editItem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => { setShowModal(null); setEditItem(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-4 lg:p-6 space-y-3 lg:space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-800">{editItem.id ? '編輯人員' : '新增人員'}</h3>
            <div className="space-y-3">
              <div><label className="text-xs font-bold text-gray-500 block mb-1">姓名 *</label>
                <input value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none" /></div>
              <div><label className="text-xs font-bold text-gray-500 block mb-1">部門</label>
                <select value={editItem.deptId} onChange={e => setEditItem({ ...editItem, deptId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none">
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select></div>
              <div><label className="text-xs font-bold text-gray-500 block mb-1">角色</label>
                <select value={editItem.role} onChange={e => setEditItem({ ...editItem, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none">
                  <option value="driver">使用者</option>
                  <option value="admin">管理者</option>
                </select></div>
              <div><label className="text-xs font-bold text-gray-500 block mb-1">狀態</label>
                <select value={editItem.status} onChange={e => setEditItem({ ...editItem, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none">
                  <option value="active">在職</option>
                  <option value="inactive">離職</option>
                </select></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowModal(null); setEditItem(null); }} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 font-bold text-sm hover:bg-gray-50">取消</button>
              <button onClick={() => {
                if (!editItem.name.trim()) return;
                let newPersonnel;
                if (editItem.id) {
                  newPersonnel = personnel.map(p => p.id === editItem.id ? editItem : p);
                } else {
                  newPersonnel = [...personnel, { ...editItem, id: `p_${Date.now()}` }];
                }
                autoSave('personnel', newPersonnel, setPersonnel);
                setShowModal(null);
                setEditItem(null);
              }} className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg font-bold text-sm hover:bg-blue-600">儲存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MileageTool;
