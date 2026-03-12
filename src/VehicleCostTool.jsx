import React, { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════
// 車輛成本中心管理工具 — Firebase Firestore 版
// 整合至展儀物流管理平台（React + Vite + Tailwind + Firebase）
// ═══════════════════════════════════════════════════════════════════════

// ── Firebase 初始化 ──
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
  const fbApp = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
  const fstore = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
  const existingApps = fbApp.getApps();
  const app = existingApps.length > 0 ? existingApps[0] : fbApp.initializeApp(FIREBASE_CONFIG);
  const db = fstore.getFirestore(app);
  _fbInstance = { db, ...fstore };
  return _fbInstance;
};

const COLLECTION = 'vc_transactions';

// ── 車輛主檔（44 輛）──
const VEHICLES_MASTER = [
  { id:"BKE-7387", old:"RBX-1287", type:"NLR", ton:3.5, src:"租賃" },
  { id:"BMP-1612", old:"RCD-0575", type:"NLR", ton:3.5, src:"租賃" },
  { id:"BMQ-6180", old:"RCH-8512", type:"NLR", ton:3.5, src:"租賃" },
  { id:"BMT-5733", old:"RBY-7723", type:"NLR", ton:3.5, src:"租賃" },
  { id:"BMT-5803", old:"RBY-7730", type:"NLR", ton:3.5, src:"租賃" },
  { id:"BMT-6092", old:"RCK-0719", type:"NLR", ton:3.5, src:"租賃" },
  { id:"BQC-3661", old:"RCG-5327", type:"NLR", ton:3.5, src:"租賃" },
  { id:"BQC-3793", old:"RCG-5329", type:"NLR", ton:3.5, src:"租賃" },
  { id:"BQC-3973", old:"RCG-5330", type:"NLR", ton:3.5, src:"租賃" },
  { id:"BQC-7176", old:"RCP-0165", type:"NLR", ton:3.5, src:"租賃" },
  { id:"BSQ-7353", old:"RCG-7160", type:"NLR", ton:3.5, src:"租賃" },
  { id:"BUA-3107", old:"RCU-5527", type:"NLR", ton:3.5, src:"租賃" },
  { id:"BUA-3265", old:"RCU-5532", type:"NLR", ton:3.5, src:"租賃" },
  { id:"BUA-3721", old:"RCU-6921", type:"NLR", ton:3.5, src:"租賃" },
  { id:"BUB-0572", old:"RCV-5103", type:"NLR", ton:3.5, src:"租賃" },
  { id:"BUB-1036", old:"RCV-5227", type:"NLR", ton:3.5, src:"租賃" },
  { id:"BUB-1332", old:"RCV-6973", type:"NLR", ton:3.5, src:"租賃" },
  { id:"BUB-1562", old:"RCV-6981", type:"NLR", ton:3.5, src:"租賃" },
  { id:"BUC-6837", old:"RDA-3906", type:"NLR", ton:3.5, src:"租賃" },
  { id:"BUC-6933", old:"RDA-3907", type:"NLR", ton:3.5, src:"租賃" },
  { id:"BUC-7100", old:"RDA-3910", type:"NLR", ton:3.5, src:"租賃" },
  { id:"BUF-7506", old:null, type:"NLR", ton:3.5, src:"自購" },
  { id:"BUF-7507", old:null, type:"NLR", ton:3.5, src:"自購" },
  { id:"BVY-0363", old:null, type:"NLR", ton:3.5, src:"自購" },
  { id:"BVY-3570", old:"RDF-3532", type:"NLR", ton:3.5, src:"租賃" },
  { id:"BYV-2830", old:null, type:"NLR", ton:3.5, src:"自購" },
  { id:"BYV-2831", old:null, type:"NLR", ton:3.5, src:"自購" },
  { id:"BZH-3895", old:"RDQ-3217", type:"菱利", ton:0.8, src:"租賃" },
  { id:"BZH-3896", old:"RDQ-3212", type:"菱利", ton:0.8, src:"租賃" },
  { id:"BZH-3897", old:"RDQ-3211", type:"菱利", ton:0.8, src:"租賃" },
  { id:"BZH-7903", old:"RDS-0393", type:"菱利", ton:0.8, src:"租賃" },
  { id:"BZH-7913", old:"RDQ-9350", type:"菱利", ton:0.8, src:"租賃" },
  { id:"BZH-8131", old:"RDS-0536", type:"菱利", ton:0.8, src:"租賃" },
  { id:"BZH-8393", old:"RDS-0587", type:"菱利", ton:0.8, src:"租賃" },
  { id:"BZH-9217", old:null, type:"菱利", ton:0.8, src:"自購" },
  { id:"BZH-9223", old:null, type:"菱利", ton:0.8, src:"自購" },
  { id:"CAF-5712", old:null, type:"J SPACE", ton:0.8, src:"自購" },
  { id:"CAF-5715", old:null, type:"J SPACE", ton:0.8, src:"自購" },
  { id:"CAF-5721", old:null, type:"J SPACE", ton:0.8, src:"自購" },
  { id:"CAF-5752", old:null, type:"J SPACE", ton:0.8, src:"自購" },
  { id:"CAF-5761", old:null, type:"J SPACE", ton:0.8, src:"自購" },
  { id:"CAF-5771", old:null, type:"J SPACE", ton:0.8, src:"自購" },
  { id:"CAF-5772", old:null, type:"J SPACE", ton:0.8, src:"自購" },
];

// ── 廠商主檔 ──
const VENDORS_MASTER = [
  { name:"福興汽車", taxType:"exclusive", brand:"ISUZU/NLR" },
  { name:"順益安平", taxType:"inclusive", brand:"中華系" },
  { name:"宏明汽車玻璃行", taxType:"manual", brand:null },
  { name:"弘昇汽車", taxType:"manual", brand:null },
  { name:"甲益", taxType:"manual", brand:null },
  { name:"龍溪", taxType:"manual", brand:null },
  { name:"信勇力商行", taxType:"exclusive", brand:null },
];

// ── 7 大類 40 子類分類代碼 ──
const CATEGORIES_MASTER = [
  { code:"A01", major:"A", majorName:"A 資本成本", sub:"車輛購置", kw:"購車,交車,車價" },
  { code:"A02", major:"A", majorName:"A 資本成本", sub:"折舊攤提", kw:"折舊" },
  { code:"A03", major:"A", majorName:"A 資本成本", sub:"加裝設備", kw:"行車紀錄器,安裝,加裝,貨架" },
  { code:"B01", major:"B", majorName:"B 定期保養", sub:"引擎機油及濾芯", kw:"機油,油芯,濾芯" },
  { code:"B02", major:"B", majorName:"B 定期保養", sub:"變速箱油", kw:"變速箱油,ATF,齒輪油" },
  { code:"B03", major:"B", majorName:"B 定期保養", sub:"煞車油", kw:"煞車油,剎車油" },
  { code:"B04", major:"B", majorName:"B 定期保養", sub:"冷卻液", kw:"冷卻液,水箱水,LLC" },
  { code:"B05", major:"B", majorName:"B 定期保養", sub:"空氣濾清器", kw:"空氣濾,空濾" },
  { code:"B06", major:"B", majorName:"B 定期保養", sub:"柴油濾清器", kw:"柴油濾,油水分離" },
  { code:"B07", major:"B", majorName:"B 定期保養", sub:"全車油品更換", kw:"全車油品,大保養" },
  { code:"B08", major:"B", majorName:"B 定期保養", sub:"其他定保項目", kw:"火星塞,正時" },
  { code:"C01", major:"C", majorName:"C 故障維修", sub:"引擎系統", kw:"引擎,渦輪,汽缸" },
  { code:"C02", major:"C", majorName:"C 故障維修", sub:"傳動系統", kw:"離合器,傳動軸" },
  { code:"C03", major:"C", majorName:"C 故障維修", sub:"煞車系統", kw:"煞車碟,分泵,ABS" },
  { code:"C04", major:"C", majorName:"C 故障維修", sub:"懸吊/轉向", kw:"避震器,三角架,方向機" },
  { code:"C05", major:"C", majorName:"C 故障維修", sub:"電氣系統", kw:"發電機,馬達,線路" },
  { code:"C06", major:"C", majorName:"C 故障維修", sub:"排氣系統", kw:"排氣,觸媒,排氣煞車" },
  { code:"C07", major:"C", majorName:"C 故障維修", sub:"冷氣系統", kw:"冷氣,壓縮機,冷媒" },
  { code:"C08", major:"C", majorName:"C 故障維修", sub:"冷卻系統", kw:"水箱,水泵,水管" },
  { code:"C09", major:"C", majorName:"C 故障維修", sub:"其他維修", kw:"" },
  { code:"D01", major:"D", majorName:"D 消耗件", sub:"輪胎", kw:"輪胎,tire" },
  { code:"D02", major:"D", majorName:"D 消耗件", sub:"煞車來令片", kw:"來令片,brake pad" },
  { code:"D03", major:"D", majorName:"D 消耗件", sub:"雨刷", kw:"雨刷" },
  { code:"D04", major:"D", majorName:"D 消耗件", sub:"燈具", kw:"燈泡,大燈,方向燈" },
  { code:"D05", major:"D", majorName:"D 消耗件", sub:"皮帶", kw:"皮帶" },
  { code:"D06", major:"D", majorName:"D 消耗件", sub:"電瓶", kw:"電瓶,battery" },
  { code:"D07", major:"D", majorName:"D 消耗件", sub:"其他消耗件", kw:"" },
  { code:"E01", major:"E", majorName:"E 車體外觀", sub:"擋風玻璃", kw:"擋風玻璃,前擋" },
  { code:"E02", major:"E", majorName:"E 車體外觀", sub:"隔熱紙", kw:"隔熱紙" },
  { code:"E03", major:"E", majorName:"E 車體外觀", sub:"鈑金烤漆", kw:"鈑金,烤漆" },
  { code:"E04", major:"E", majorName:"E 車體外觀", sub:"其他外觀", kw:"貼紙,logo" },
  { code:"F01", major:"F", majorName:"F 營運成本", sub:"燃料", kw:"加油,油資" },
  { code:"F02", major:"F", majorName:"F 營運成本", sub:"ETC 通行費", kw:"ETC,通行費" },
  { code:"F03", major:"F", majorName:"F 營運成本", sub:"停車費", kw:"停車" },
  { code:"G01", major:"G", majorName:"G 法規成本", sub:"牌照稅", kw:"牌照稅" },
  { code:"G02", major:"G", majorName:"G 法規成本", sub:"燃料稅", kw:"燃料稅" },
  { code:"G03", major:"G", majorName:"G 法規成本", sub:"強制險", kw:"強制險" },
  { code:"G04", major:"G", majorName:"G 法規成本", sub:"任意險", kw:"任意險,車體險" },
  { code:"G05", major:"G", majorName:"G 法規成本", sub:"驗車費", kw:"驗車" },
  { code:"G06", major:"G", majorName:"G 法規成本", sub:"罰款", kw:"罰款,罰單" },
];

// ── 稅務計算 ──
const calcTax = (vendorName, amount) => {
  const v = VENDORS_MASTER.find(x => vendorName && vendorName.includes(x.name));
  if (!v) return { amountExTax: amount, taxAmount: 0, amountIncTax: amount, taxType: 'manual' };
  if (v.taxType === 'exclusive') {
    const tax = Math.round(amount * 0.05);
    return { amountExTax: amount, taxAmount: tax, amountIncTax: amount + tax, taxType: 'exclusive' };
  }
  if (v.taxType === 'inclusive') {
    const exTax = Math.round(amount / 1.05);
    const tax = amount - exTax;
    return { amountExTax: exTax, taxAmount: tax, amountIncTax: amount, taxType: 'inclusive' };
  }
  return { amountExTax: amount, taxAmount: 0, amountIncTax: amount, taxType: 'manual' };
};

// ── 關鍵字分類引擎 ──
const classifyItem = (desc) => {
  if (!desc) return null;
  const lower = desc.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const cat of CATEGORIES_MASTER) {
    if (!cat.kw) continue;
    const keywords = cat.kw.split(',').map(k => k.trim()).filter(Boolean);
    const matched = keywords.filter(kw => lower.includes(kw));
    if (matched.length > 0) {
      const score = matched.length / Math.max(keywords.length, 1) + 0.5;
      if (score > bestScore) {
        bestScore = score;
        best = { ...cat, confidence: Math.min(1, score), matchedKw: matched };
      }
    }
  }
  return best;
};

// ── 樣式常數 ──
const CATEGORY_COLORS = {
  'A 資本成本': '#8E44AD', 'B 定期保養': '#27AE60', 'C 故障維修': '#E74C3C',
  'D 消耗件': '#4472C4', 'E 車體外觀': '#F39C12', 'F 營運成本': '#1ABC9C', 'G 法規成本': '#95A5A6'
};
const TAG_COLORS = {
  A:{bg:'#E8D5F5',fg:'#6B21A8'}, B:{bg:'#D5F5E3',fg:'#1B7A3D'},
  C:{bg:'#FADBD8',fg:'#922B21'}, D:{bg:'#D6EAF8',fg:'#1B4F72'},
  E:{bg:'#FEF9E7',fg:'#7D6608'}, F:{bg:'#F5EEF8',fg:'#6C3483'},
  G:{bg:'#EAEDED',fg:'#515A5A'},
};
const VEHICLE_TYPES = ['全部', 'NLR', '菱利', 'J SPACE'];
const ACCENT_HEX = '#EAB308';

// ── 範例交易資料（Firestore seed 用）──
const SEED_TRANSACTIONS = [
  {date:"2026-01-04",vehicleId:"BUB-0572",vendor:"福興汽車",catCode:"B01",majorCat:"B 定期保養",subCat:"引擎機油及濾芯",desc:"機油+機油芯",qty:1,unitPrice:3826,amountExTax:3826,taxAmount:191,amountIncTax:4017,mileage:58420,invoiceNo:"1150104-福興-BUB0572",source:"OCR"},
  {date:"2026-01-04",vehicleId:"BUB-0572",vendor:"福興汽車",catCode:"B05",majorCat:"B 定期保養",subCat:"空氣濾清器",desc:"空氣濾清器",qty:1,unitPrice:680,amountExTax:680,taxAmount:34,amountIncTax:714,mileage:58420,invoiceNo:"1150104-福興-BUB0572",source:"OCR"},
  {date:"2026-01-04",vehicleId:"BUB-0572",vendor:"福興汽車",catCode:"B06",majorCat:"B 定期保養",subCat:"柴油濾清器",desc:"柴油濾清器",qty:1,unitPrice:950,amountExTax:950,taxAmount:48,amountIncTax:998,mileage:58420,invoiceNo:"1150104-福興-BUB0572",source:"OCR"},
  {date:"2026-01-15",vehicleId:"BZH-8131",vendor:"順益安平",catCode:"B01",majorCat:"B 定期保養",subCat:"引擎機油及濾芯",desc:"機油更換",qty:1,unitPrice:2800,amountExTax:2800,taxAmount:140,amountIncTax:2940,mileage:42100,invoiceNo:"1150115-順益-BZH8131",source:"OCR"},
  {date:"2026-01-15",vehicleId:"BZH-8131",vendor:"順益安平",catCode:"C03",majorCat:"C 故障維修",subCat:"煞車系統",desc:"煞車來令片更換",qty:1,unitPrice:4200,amountExTax:4200,taxAmount:210,amountIncTax:4410,mileage:42100,invoiceNo:"1150115-順益-BZH8131",source:"OCR"},
  {date:"2026-01-22",vehicleId:"BUF-7506",vendor:"福興汽車",catCode:"B01",majorCat:"B 定期保養",subCat:"引擎機油及濾芯",desc:"機油+機油芯",qty:1,unitPrice:3826,amountExTax:3826,taxAmount:191,amountIncTax:4017,mileage:71230,invoiceNo:"1150122-福興-BUF7506",source:"OCR"},
  {date:"2026-01-22",vehicleId:"BUF-7506",vendor:"福興汽車",catCode:"D01",majorCat:"D 消耗件",subCat:"輪胎",desc:"前輪胎更換x2",qty:2,unitPrice:4500,amountExTax:9000,taxAmount:450,amountIncTax:9450,mileage:71230,invoiceNo:"1150122-福興-BUF7506",source:"OCR"},
  {date:"2026-02-05",vehicleId:"BUB-1036",vendor:"福興汽車",catCode:"B01",majorCat:"B 定期保養",subCat:"引擎機油及濾芯",desc:"機油+機油芯",qty:1,unitPrice:3826,amountExTax:3826,taxAmount:191,amountIncTax:4017,mileage:63500,invoiceNo:"1150205-福興-BUB1036",source:"OCR"},
  {date:"2026-02-05",vehicleId:"BUB-1036",vendor:"福興汽車",catCode:"C07",majorCat:"C 故障維修",subCat:"冷氣系統",desc:"冷氣壓縮機維修",qty:1,unitPrice:12500,amountExTax:12500,taxAmount:625,amountIncTax:13125,mileage:63500,invoiceNo:"1150205-福興-BUB1036",source:"OCR"},
  {date:"2026-02-12",vehicleId:"BZH-3895",vendor:"順益安平",catCode:"B01",majorCat:"B 定期保養",subCat:"引擎機油及濾芯",desc:"機油更換",qty:1,unitPrice:2200,amountExTax:2200,taxAmount:110,amountIncTax:2310,mileage:35800,invoiceNo:"1150212-順益-BZH3895",source:"OCR"},
  {date:"2026-02-12",vehicleId:"BZH-3895",vendor:"順益安平",catCode:"D06",majorCat:"D 消耗件",subCat:"電瓶",desc:"電瓶更換",qty:1,unitPrice:3500,amountExTax:3500,taxAmount:175,amountIncTax:3675,mileage:35800,invoiceNo:"1150212-順益-BZH3895",source:"OCR"},
  {date:"2026-02-20",vehicleId:"CAF-5712",vendor:"順益安平",catCode:"B01",majorCat:"B 定期保養",subCat:"引擎機油及濾芯",desc:"機油更換",qty:1,unitPrice:1800,amountExTax:1800,taxAmount:90,amountIncTax:1890,mileage:28900,invoiceNo:"1150220-順益-CAF5712",source:"OCR"},
  {date:"2026-02-28",vehicleId:"BUB-0572",vendor:"福興汽車",catCode:"C04",majorCat:"C 故障維修",subCat:"懸吊/轉向",desc:"避震器更換x2",qty:2,unitPrice:7500,amountExTax:15000,taxAmount:750,amountIncTax:15750,mileage:60100,invoiceNo:"1150228-福興-BUB0572",source:"OCR"},
  {date:"2026-03-05",vehicleId:"BUF-7507",vendor:"福興汽車",catCode:"B01",majorCat:"B 定期保養",subCat:"引擎機油及濾芯",desc:"機油+機油芯",qty:1,unitPrice:3826,amountExTax:3826,taxAmount:191,amountIncTax:4017,mileage:62000,invoiceNo:"1150305-福興-BUF7507",source:"OCR"},
  {date:"2026-03-05",vehicleId:"BUF-7507",vendor:"福興汽車",catCode:"E01",majorCat:"E 車體外觀",subCat:"擋風玻璃",desc:"前擋風玻璃更換",qty:1,unitPrice:8500,amountExTax:8500,taxAmount:425,amountIncTax:8925,mileage:62000,invoiceNo:"1150305-福興-BUF7507",source:"OCR"},
  {date:"2026-03-10",vehicleId:"BUF-7507",vendor:"福興汽車",catCode:"B01",majorCat:"B 定期保養",subCat:"引擎機油及濾芯",desc:"機油+機油芯",qty:1,unitPrice:3826,amountExTax:3826,taxAmount:191,amountIncTax:4017,mileage:62480,invoiceNo:"1150310-福興-BUF7507",source:"OCR"},
  {date:"2026-03-10",vehicleId:"BUF-7507",vendor:"福興汽車",catCode:"B05",majorCat:"B 定期保養",subCat:"空氣濾清器",desc:"空氣濾清器",qty:1,unitPrice:680,amountExTax:680,taxAmount:34,amountIncTax:714,mileage:62480,invoiceNo:"1150310-福興-BUF7507",source:"OCR"},
  {date:"2026-03-10",vehicleId:"BUF-7507",vendor:"福興汽車",catCode:"B06",majorCat:"B 定期保養",subCat:"柴油濾清器",desc:"柴油濾清器",qty:1,unitPrice:950,amountExTax:950,taxAmount:48,amountIncTax:998,mileage:62480,invoiceNo:"1150310-福興-BUF7507",source:"OCR"},
];

// ═══════════════════════════════════════════════════════════════════════
// 主元件
// ═══════════════════════════════════════════════════════════════════════
export default function VehicleCostTool({ onBack, windowHeight }) {
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allTx, setAllTx] = useState([]);

  // Dashboard computed
  const [kpis, setKpis] = useState(null);
  const [costStructure, setCostStructure] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);

  // Vehicles
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleType, setVehicleType] = useState('全部');
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Categories
  const [openAccordion, setOpenAccordion] = useState(null);

  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  // Chart refs
  const pieRef = useRef(null);
  const barRef = useRef(null);
  const detailPieRef = useRef(null);
  const pieChart = useRef(null);
  const barChart = useRef(null);
  const detailPieChart = useRef(null);
  const chartLoaded = useRef(false);
  const searchTimer = useRef(null);
  const seeded = useRef(false);

  // ─── Load Chart.js ───
  useEffect(() => {
    if (window.Chart) { chartLoaded.current = true; return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
    s.onload = () => { chartLoaded.current = true; };
    document.head.appendChild(s);
  }, []);

  // ─── Seed + Load from Firestore ───
  const loadAllTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fb = await initFirebase();
      const col = fb.collection(fb.db, COLLECTION);

      // Check if need seed
      if (!seeded.current) {
        const snap = await fb.getDocs(fb.query(col, fb.limit(1)));
        if (snap.empty) {
          // Seed sample data
          for (const t of SEED_TRANSACTIONS) {
            await fb.addDoc(col, { ...t, createdAt: new Date().toISOString() });
          }
        }
        seeded.current = true;
      }

      // Load all
      const allSnap = await fb.getDocs(fb.query(col, fb.orderBy('date', 'desc')));
      const txList = [];
      allSnap.forEach(doc => txList.push({ id: doc.id, ...doc.data() }));
      setAllTx(txList);
      computeDashboard(txList);
    } catch (e) {
      console.error('Firestore error:', e);
      setError('無法連線至 Firebase，請檢查網路連線。');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAllTransactions(); }, [loadAllTransactions]);

  // ─── Compute Dashboard KPIs ───
  const computeDashboard = (txList) => {
    const now = new Date();
    const yearStr = String(now.getFullYear());
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const monthTx = txList.filter(t => t.date && t.date.startsWith(monthStr));
    const yearTx = txList.filter(t => t.date && t.date.startsWith(yearStr));

    const monthCost = monthTx.reduce((s, t) => s + (t.amountExTax || 0), 0);
    const ytdCost = yearTx.reduce((s, t) => s + (t.amountExTax || 0), 0);

    // Per-km cost (from mileage data)
    const vehMileage = {};
    yearTx.forEach(t => {
      if (t.mileage > 0) {
        if (!vehMileage[t.vehicleId]) vehMileage[t.vehicleId] = { min: Infinity, max: 0, cost: 0 };
        vehMileage[t.vehicleId].min = Math.min(vehMileage[t.vehicleId].min, t.mileage);
        vehMileage[t.vehicleId].max = Math.max(vehMileage[t.vehicleId].max, t.mileage);
        vehMileage[t.vehicleId].cost += (t.amountExTax || 0);
      }
    });
    let totalKm = 0, totalCostWithKm = 0;
    Object.values(vehMileage).forEach(v => {
      const diff = v.max - v.min;
      if (diff > 0) { totalKm += diff; totalCostWithKm += v.cost; }
    });
    const perKmCost = totalKm > 0 ? Math.round(totalCostWithKm / totalKm * 100) / 100 : 0;

    // Anomaly: vehicles > 2x fleet average
    const vehCosts = {};
    yearTx.forEach(t => { vehCosts[t.vehicleId] = (vehCosts[t.vehicleId] || 0) + (t.amountExTax || 0); });
    const costValues = Object.values(vehCosts);
    const fleetAvg = costValues.length > 0 ? costValues.reduce((a, b) => a + b, 0) / costValues.length : 0;
    const anomalies = Object.entries(vehCosts).filter(([, c]) => c > fleetAvg * 2);

    // Zero-cost vehicles
    const vehWithCost = new Set(monthTx.map(t => t.vehicleId));
    const zeroCost = VEHICLES_MASTER.filter(v => !vehWithCost.has(v.id)).length;

    setKpis({
      monthCost, monthTxCount: monthTx.length, perKmCost, ytdCost,
      anomalyCount: anomalies.length, zeroCostVehicles: zeroCost, fleetAvg: Math.round(fleetAvg),
    });

    // Cost structure (pie)
    const struct = {};
    yearTx.forEach(t => { struct[t.majorCat] = (struct[t.majorCat] || 0) + (t.amountExTax || 0); });
    const structArr = Object.entries(struct).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    setCostStructure(structArr);

    // Monthly trend (bar)
    const trend = {};
    txList.forEach(t => {
      const m = t.date ? t.date.substring(0, 7) : '';
      if (!m) return;
      if (!trend[m]) trend[m] = {};
      trend[m][t.majorCat] = (trend[m][t.majorCat] || 0) + (t.amountExTax || 0);
    });
    const trendArr = [];
    Object.entries(trend).forEach(([month, cats]) => {
      Object.entries(cats).forEach(([cat, total]) => {
        trendArr.push({ month, majorCat: cat, total });
      });
    });
    setMonthlyTrend(trendArr);
  };

  // ─── Render Charts ───
  useEffect(() => {
    if (!chartLoaded.current || !window.Chart || tab !== 'dashboard' || !costStructure.length) return;
    const timer = setTimeout(() => {
      if (pieRef.current) {
        if (pieChart.current) pieChart.current.destroy();
        pieChart.current = new window.Chart(pieRef.current, {
          type: 'doughnut',
          data: {
            labels: costStructure.map(s => s.label),
            datasets: [{ data: costStructure.map(s => s.value), backgroundColor: costStructure.map(s => CATEGORY_COLORS[s.label] || '#CCC'), borderWidth: 0 }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 10 }, padding: 6 } } }, cutout: '55%' }
        });
      }
      if (barRef.current && monthlyTrend.length) {
        if (barChart.current) barChart.current.destroy();
        const months = [...new Set(monthlyTrend.map(t => t.month))].sort().slice(-6);
        const cats = [...new Set(monthlyTrend.map(t => t.majorCat))];
        const datasets = cats.map(cat => ({
          label: cat,
          data: months.map(m => { const r = monthlyTrend.find(t => t.month === m && t.majorCat === cat); return r ? r.total : 0; }),
          backgroundColor: CATEGORY_COLORS[cat] || '#CCC'
        }));
        barChart.current = new window.Chart(barRef.current, {
          type: 'bar',
          data: { labels: months.map(m => m.substring(5) + '月'), datasets },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { font: { size: 9 }, padding: 4 } } },
            scales: { x: { stacked: true, ticks: { font: { size: 10 } } }, y: { stacked: true, ticks: { font: { size: 9 }, callback: v => '$' + Math.round(v / 1000) + 'K' } } }
          }
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [tab, costStructure, monthlyTrend]);

  // ─── Vehicles computed ───
  const filteredVehicles = VEHICLES_MASTER.filter(v => {
    if (vehicleType !== '全部' && v.type !== vehicleType) return false;
    if (vehicleSearch && !v.id.toLowerCase().includes(vehicleSearch.toLowerCase()) && !(v.old || '').toLowerCase().includes(vehicleSearch.toLowerCase())) return false;
    return true;
  }).map(v => {
    const yearStr = String(new Date().getFullYear());
    const vTx = allTx.filter(t => t.vehicleId === v.id && t.date && t.date.startsWith(yearStr));
    const ytdCost = vTx.reduce((s, t) => s + (t.amountExTax || 0), 0);
    const lastDate = vTx.length > 0 ? vTx.sort((a, b) => b.date.localeCompare(a.date))[0].date : null;
    return { ...v, ytdCost, txCount: vTx.length, lastDate };
  });

  // ─── Vehicle Detail ───
  const vehicleDetail = selectedVehicle ? (() => {
    const v = VEHICLES_MASTER.find(x => x.id === selectedVehicle);
    if (!v) return null;
    const yearStr = String(new Date().getFullYear());
    const vTx = allTx.filter(t => t.vehicleId === v.id && t.date && t.date.startsWith(yearStr)).sort((a, b) => b.date.localeCompare(a.date));
    const totalCost = vTx.reduce((s, t) => s + (t.amountExTax || 0), 0);
    const maxMileage = Math.max(0, ...vTx.map(t => t.mileage || 0));
    const minMileage = Math.min(Infinity, ...vTx.filter(t => t.mileage > 0).map(t => t.mileage));
    const lastDate = vTx.length > 0 ? vTx[0].date : null;
    const struct = {};
    vTx.forEach(t => { struct[t.majorCat] = (struct[t.majorCat] || 0) + (t.amountExTax || 0); });
    const structArr = Object.entries(struct).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    return { vehicle: v, transactions: vTx, totalCost, txCount: vTx.length, maxMileage, minMileage: minMileage === Infinity ? 0 : minMileage, lastDate, costStructure: structArr };
  })() : null;

  // Detail pie chart
  useEffect(() => {
    if (!vehicleDetail || !detailPieRef.current || !window.Chart || !vehicleDetail.costStructure.length) return;
    const timer = setTimeout(() => {
      if (detailPieChart.current) detailPieChart.current.destroy();
      detailPieChart.current = new window.Chart(detailPieRef.current, {
        type: 'doughnut',
        data: {
          labels: vehicleDetail.costStructure.map(s => s.label),
          datasets: [{ data: vehicleDetail.costStructure.map(s => s.value), backgroundColor: vehicleDetail.costStructure.map(s => CATEGORY_COLORS[s.label] || '#CCC'), borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 9 } } } }, cutout: '50%' }
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [vehicleDetail]);

  // ─── Categories grouped ───
  const categoriesGrouped = (() => {
    const groups = {};
    CATEGORIES_MASTER.forEach(c => {
      if (!groups[c.majorName]) groups[c.majorName] = { majorCode: c.major, majorName: c.majorName, items: [] };
      groups[c.majorName].items.push(c);
    });
    return Object.values(groups);
  })();

  // ─── Chat ───
  const initChat = useCallback(() => {
    if (chatMessages.length) return;
    setChatMessages([{
      role: 'ai',
      html: `歡迎使用車輛成本中心 AI 助手 👋<br/><br/>我可以幫您：<br/>• 查詢任何車輛的成本履歷（輸入車號）<br/>• 產出月度結算報表<br/>• 偵測異常維修模式<br/><br/><span style="font-size:11px;color:#999">點擊快速按鈕或直接輸入問題。</span>`
    }]);
  }, [chatMessages]);

  useEffect(() => { if (tab === 'chat') initChat(); }, [tab, initChat]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const addMsg = (role, html) => setChatMessages(prev => [...prev, { role, html }]);

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput('');
    addMsg('user', text);

    const plateMatch = text.match(/[A-Z]{2,3}[-]?\d{3,4}/i);
    if (plateMatch) {
      let plate = plateMatch[0].toUpperCase();
      if (!plate.includes('-')) plate = plate.replace(/(\D+)(\d+)/, '$1-$2');
      const v = VEHICLES_MASTER.find(x => x.id === plate);
      if (!v) { addMsg('ai', `找不到車號 ${plate} 的資料。`); return; }
      const yearStr = String(new Date().getFullYear());
      const vTx = allTx.filter(t => t.vehicleId === plate && t.date && t.date.startsWith(yearStr));
      const totalCost = vTx.reduce((s, t) => s + (t.amountExTax || 0), 0);
      const maxMileage = Math.max(0, ...vTx.map(t => t.mileage || 0));
      const lastDate = vTx.length > 0 ? vTx.sort((a, b) => b.date.localeCompare(a.date))[0].date : '無';
      let h = `<strong>${v.id}</strong> ${v.type} ${v.ton}t<br/><br/>`;
      h += `📊 累計成本：$${totalCost.toLocaleString()}<br/>`;
      h += `📝 交易筆數：${vTx.length} 筆<br/>`;
      h += `🛣️ 最高里程：${maxMileage.toLocaleString()} km<br/>`;
      h += `📅 最近維修：${lastDate}<br/>`;
      const struct = {};
      vTx.forEach(t => { struct[t.majorCat] = (struct[t.majorCat] || 0) + (t.amountExTax || 0); });
      const structEntries = Object.entries(struct).sort((a, b) => b[1] - a[1]);
      if (structEntries.length) {
        h += `<br/><strong>成本結構：</strong><br/>`;
        structEntries.forEach(([cat, cost]) => h += `${cat} $${cost.toLocaleString()}<br/>`);
      }
      addMsg('ai', h);
    } else if (text.includes('月報') || text.includes('結算')) {
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

      const monthTx = allTx.filter(t => t.date && t.date.startsWith(monthStr));
      const prevTx = allTx.filter(t => t.date && t.date.startsWith(prevMonthStr));
      const monthCost = monthTx.reduce((s, t) => s + (t.amountExTax || 0), 0);
      const prevCost = prevTx.reduce((s, t) => s + (t.amountExTax || 0), 0);
      const changePct = prevCost > 0 ? Math.round((monthCost - prevCost) / prevCost * 1000) / 10 : 0;

      // Top 5
      const vCosts = {};
      monthTx.forEach(t => { vCosts[t.vehicleId] = (vCosts[t.vehicleId] || 0) + (t.amountExTax || 0); });
      const top5 = Object.entries(vCosts).sort((a, b) => b[1] - a[1]).slice(0, 5);

      let h = `<strong>${now.getFullYear()}/${now.getMonth() + 1} 月度報表</strong><br/><br/>`;
      h += `💰 月度費用：$${monthCost.toLocaleString()}<br/>`;
      h += `📄 處理單據：${monthTx.length} 筆<br/>`;
      h += `📈 較上月：${changePct > 0 ? '+' : ''}${changePct}%<br/>`;
      if (top5.length) {
        h += `<br/><strong>Top 5：</strong><br/>`;
        top5.forEach(([vid, cost], i) => h += `${i + 1}. ${vid} $${cost.toLocaleString()}<br/>`);
      }
      addMsg('ai', h);
    } else if (text.includes('異常') || text.includes('警示')) {
      const yearStr = String(new Date().getFullYear());
      const yearTx = allTx.filter(t => t.date && t.date.startsWith(yearStr));
      const vCosts = {};
      yearTx.forEach(t => { vCosts[t.vehicleId] = (vCosts[t.vehicleId] || 0) + (t.amountExTax || 0); });
      const vals = Object.values(vCosts);
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      const anomalies = Object.entries(vCosts).filter(([, c]) => c > avg * 2);
      if (!anomalies.length) { addMsg('ai', '✅ 目前沒有偵測到異常車輛。'); return; }
      let h = `⚠️ <strong>偵測到 ${anomalies.length} 個異常</strong>（車隊平均 $${Math.round(avg).toLocaleString()}）<br/>`;
      anomalies.forEach(([vid, cost]) => {
        h += `🔴 <strong>${vid}</strong> — 年度累計 $${cost.toLocaleString()} 超過平均 2 倍<br/>`;
      });
      addMsg('ai', h);
    } else {
      addMsg('ai', `目前支援：<br/>• 輸入車號（如 BUB-0572）查詢履歷<br/>• 說「本月結算」產出月報<br/>• 說「異常警示」檢視異常`);
    }
  };

  const quickAction = (action) => {
    if (action === 'monthly') { setChatInput('本月結算'); setTimeout(sendChat, 100); }
    else if (action === 'anomaly') { setChatInput('異常警示'); setTimeout(sendChat, 100); }
    else if (action === 'history') addMsg('ai', '請輸入要查詢的車號，例如：BUB-0572、BZH-8131、CAF-5712');
  };

  // ─── Add Transaction to Firestore ───
  const addTransaction = async (txData) => {
    try {
      const fb = await initFirebase();
      const col = fb.collection(fb.db, COLLECTION);
      const cat = CATEGORIES_MASTER.find(c => c.code === txData.catCode);
      const tax = calcTax(txData.vendor, txData.amountExTax);
      const doc = {
        date: txData.date,
        vehicleId: txData.vehicleId,
        vendor: txData.vendor,
        catCode: txData.catCode,
        majorCat: cat ? cat.majorName : 'C 故障維修',
        subCat: cat ? cat.sub : '其他維修',
        desc: txData.desc || '',
        qty: txData.qty || 1,
        unitPrice: txData.unitPrice || tax.amountExTax,
        amountExTax: tax.amountExTax,
        taxAmount: tax.taxAmount,
        amountIncTax: tax.amountIncTax,
        mileage: txData.mileage || 0,
        invoiceNo: txData.invoiceNo || '',
        source: txData.source || 'manual',
        createdAt: new Date().toISOString(),
      };
      await fb.addDoc(col, doc);
      await loadAllTransactions();
      return { success: true };
    } catch (e) {
      console.error('Add transaction error:', e);
      return { success: false, error: e.message };
    }
  };

  // ─── Tag Component ───
  const Tag = ({ code }) => {
    const letter = code[0];
    const c = TAG_COLORS[letter] || { bg: '#EEE', fg: '#333' };
    return <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 3, fontSize: 10, fontWeight: 600, background: c.bg, color: c.fg, marginRight: 4 }}>{code}</span>;
  };

  // ─── Styles ───
  const headerStyle = { background: '#0f172a', color: '#fff', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 };
  const cardStyle = { background: '#fff', borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', padding: 14, marginBottom: 12 };
  const tabStyle = (active) => ({
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '7px 0', cursor: 'pointer',
    color: active ? ACCENT_HEX : '#999', fontSize: 10, transition: 'color 0.2s', background: 'none', border: 'none'
  });

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: windowHeight + 'px', display: 'flex', flexDirection: 'column', background: '#f5f7fa', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft JhengHei', sans-serif" }}>

      {/* Header */}
      <div style={headerStyle}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>車輛成本中心</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Vehicle Cost Center · Firebase</div>
        </div>
        <button onClick={onBack} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', padding: '4px 12px', borderRadius: 2, fontSize: 10, letterSpacing: 2, cursor: 'pointer', fontFamily: 'inherit' }}>HOME</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 60 }}>

        {/* ── Dashboard Tab ── */}
        {tab === 'dashboard' && (
          <div style={{ padding: 14 }}>
            {error ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#e74c3c' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
                <div style={{ fontSize: 13 }}>{error}</div>
                <button onClick={loadAllTransactions} style={{ marginTop: 12, padding: '8px 20px', border: `1px solid ${ACCENT_HEX}`, background: 'none', color: ACCENT_HEX, borderRadius: 6, cursor: 'pointer' }}>重試</button>
              </div>
            ) : loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: ACCENT_HEX, borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 10px' }} />
                載入中...
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : kpis && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                  {[
                    { label: '本月費用', value: `$${(kpis.monthCost || 0).toLocaleString()}` },
                    { label: '已處理單據', value: kpis.monthTxCount || 0, note: '張' },
                    { label: '每公里成本', value: kpis.perKmCost || '-', note: '元/km' },
                    { label: '本年累計', value: `$${(kpis.ytdCost || 0).toLocaleString()}` },
                    { label: '異常車輛', value: kpis.anomalyCount || 0, note: '輛', alert: kpis.anomalyCount > 0 },
                    { label: '零費用車輛', value: kpis.zeroCostVehicles || 0, note: '輛' },
                  ].map((k, i) => (
                    <div key={i} style={{ ...cardStyle, textAlign: 'center', padding: '10px 8px' }}>
                      <div style={{ fontSize: 10, color: '#999' }}>{k.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: k.alert ? '#e74c3c' : '#1B2A4A', margin: '3px 0' }}>{k.value}</div>
                      {k.note && <div style={{ fontSize: 9, color: '#999' }}>{k.note}</div>}
                    </div>
                  ))}
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: 12, color: '#999', fontWeight: 600, marginBottom: 8 }}>● 成本結構</div>
                  <div style={{ position: 'relative', height: 200 }}><canvas ref={pieRef} /></div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: 12, color: '#999', fontWeight: 600, marginBottom: 8 }}>● 月度趨勢</div>
                  <div style={{ position: 'relative', height: 200 }}><canvas ref={barRef} /></div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Vehicles Tab ── */}
        {tab === 'vehicles' && !selectedVehicle && (
          <div style={{ padding: 14 }}>
            <input
              type="text" placeholder="搜尋車號..."
              value={vehicleSearch} onChange={e => setVehicleSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
              {VEHICLE_TYPES.map(t => (
                <button key={t} onClick={() => setVehicleType(t)}
                  style={{ padding: '4px 12px', borderRadius: 16, border: `1px solid ${t === vehicleType ? ACCENT_HEX : '#e2e8f0'}`, background: t === vehicleType ? ACCENT_HEX : '#fff', color: t === vehicleType ? '#fff' : '#999', fontSize: 11, cursor: 'pointer' }}>
                  {t}
                </button>
              ))}
            </div>
            {filteredVehicles.map(v => (
              <div key={v.id} onClick={() => setSelectedVehicle(v.id)}
                style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EBF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginRight: 10 }}>🚛</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{v.id}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{v.type} {v.ton}t{v.old ? ` (原${v.old})` : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1B2A4A' }}>${(v.ytdCost || 0).toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: '#999' }}>{v.lastDate || '尚無紀錄'}</div>
                </div>
              </div>
            ))}
            {!filteredVehicles.length && <div style={{ textAlign: 'center', padding: 30, color: '#999' }}>沒有符合條件的車輛</div>}
          </div>
        )}

        {/* ── Vehicle Detail ── */}
        {tab === 'vehicles' && selectedVehicle && vehicleDetail && (
          <div>
            <div style={{ background: '#0f172a', color: '#fff', padding: 14 }}>
              <div onClick={() => setSelectedVehicle(null)} style={{ cursor: 'pointer', fontSize: 13, opacity: 0.7, marginBottom: 6 }}>← 返回</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{vehicleDetail.vehicle.id}</div>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 3 }}>{vehicleDetail.vehicle.type} {vehicleDetail.vehicle.ton}t | {vehicleDetail.vehicle.src}</div>
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[
                  { label: '累計成本', value: `$${(vehicleDetail.totalCost || 0).toLocaleString()}` },
                  { label: '交易筆數', value: vehicleDetail.txCount || 0 },
                  { label: '最高里程', value: `${(vehicleDetail.maxMileage || 0).toLocaleString()} km` },
                  { label: '最近維修', value: vehicleDetail.lastDate || '-' },
                ].map((k, i) => (
                  <div key={i} style={{ ...cardStyle, textAlign: 'center', padding: '10px 8px' }}>
                    <div style={{ fontSize: 10, color: '#999' }}>{k.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2A4A', marginTop: 3 }}>{k.value}</div>
                  </div>
                ))}
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 12, color: '#999', fontWeight: 600, marginBottom: 8 }}>● 成本結構</div>
                <div style={{ position: 'relative', height: 180 }}><canvas ref={detailPieRef} /></div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 12, color: '#999', fontWeight: 600, marginBottom: 8 }}>● 維修時間軸</div>
                {vehicleDetail.transactions.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 11, color: '#999', minWidth: 72 }}>{t.date}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12 }}><Tag code={t.catCode} /> {t.desc || t.subCat}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1B2A4A', marginTop: 2 }}>${(t.amountExTax || 0).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
                {!vehicleDetail.transactions.length && <div style={{ textAlign: 'center', padding: 20, color: '#999', fontSize: 12 }}>尚無維修紀錄</div>}
              </div>
            </div>
          </div>
        )}

        {/* ── Chat Tab ── */}
        {tab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: `calc(${windowHeight}px - 110px)` }}>
            <div style={{ display: 'flex', gap: 5, padding: '8px 14px', flexWrap: 'wrap' }}>
              {[
                { label: '本月結算', action: 'monthly' },
                { label: '查車輛履歷', action: 'history' },
                { label: '異常警示', action: 'anomaly' },
              ].map(b => (
                <button key={b.action} onClick={() => quickAction(b.action)}
                  style={{ padding: '5px 10px', borderRadius: 16, border: `1px solid ${ACCENT_HEX}`, background: '#fff', color: ACCENT_HEX, fontSize: 11, cursor: 'pointer' }}>
                  {b.label}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px' }}>
              {chatMessages.map((m, i) => (
                <div key={i} style={{ marginBottom: 10, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '85%', padding: '9px 13px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                    ...(m.role === 'user'
                      ? { background: '#0f172a', color: '#fff', borderBottomRightRadius: 3 }
                      : { background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderBottomLeftRadius: 3 })
                  }} dangerouslySetInnerHTML={{ __html: m.html }} />
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: 'flex', gap: 6, padding: '8px 14px', borderTop: '1px solid #e2e8f0' }}>
              <input
                type="text" placeholder="輸入車號或問題..."
                value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendChat(); }}
                style={{ flex: 1, padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 20, fontSize: 13, outline: 'none' }}
              />
              <button onClick={sendChat} style={{ padding: '9px 14px', borderRadius: 20, border: 'none', background: '#0f172a', color: '#fff', cursor: 'pointer', fontSize: 13 }}>發送</button>
            </div>
          </div>
        )}

        {/* ── Categories Tab ── */}
        {tab === 'categories' && (
          <div style={{ padding: 14 }}>
            {categoriesGrouped.map((g, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div onClick={() => setOpenAccordion(openAccordion === i ? null : i)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fff', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  <span><Tag code={g.majorCode} /> {g.majorName}（{g.items.length}）</span>
                  <span style={{ transform: openAccordion === i ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>▸</span>
                </div>
                {openAccordion === i && (
                  <div style={{ background: '#fff', borderRadius: '0 0 6px 6px', marginTop: -2 }}>
                    {g.items.map((item, j) => (
                      <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 14px', borderBottom: '1px solid #f8f8f8', fontSize: 12 }}>
                        <span style={{ fontWeight: 600, color: '#4472C4', minWidth: 36 }}>{item.code}</span>
                        <span style={{ flex: 1 }}>{item.sub}</span>
                        <span style={{ fontSize: 10, color: '#999' }}>{item.kw || ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Settings Tab ── */}
        {tab === 'settings' && (
          <div style={{ padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1B2A4A', marginBottom: 8 }}>廠商管理</div>
            {VENDORS_MASTER.map((v, i) => (
              <div key={i} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}>
                <span style={{ fontSize: 13 }}>{v.name} <span style={{ fontSize: 10, color: '#999' }}>({v.taxType === 'exclusive' ? '未稅' : v.taxType === 'inclusive' ? '含稅' : '依單據'})</span></span>
                {v.brand && <span style={{ fontSize: 10, color: '#999' }}>{v.brand}</span>}
              </div>
            ))}
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1B2A4A', marginBottom: 8, marginTop: 16 }}>車輛主檔</div>
            <div style={{ ...cardStyle, padding: '10px 14px', fontSize: 13 }}>
              管理 {VEHICLES_MASTER.length} 輛車輛
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1B2A4A', marginBottom: 8, marginTop: 16 }}>資料庫</div>
            <div style={{ ...cardStyle, padding: '10px 14px', fontSize: 12, color: '#999' }}>
              Firestore Collection: {COLLECTION}<br />
              交易筆數: {allTx.length} 筆<br />
              Project: jc-logi-map
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', zIndex: 10, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {[
          { id: 'dashboard', icon: '📊', label: '儀表板' },
          { id: 'vehicles', icon: '🚛', label: '車輛' },
          { id: 'chat', icon: '💬', label: 'AI 對話' },
          { id: 'categories', icon: '📋', label: '分類表' },
          { id: 'settings', icon: '⚙️', label: '更多' },
        ].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'vehicles') setSelectedVehicle(null); }}
            style={tabStyle(tab === t.id)}>
            <span style={{ fontSize: 20, marginBottom: 1 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
