import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════════════
// 車輛成本中心管理工具 v2 — Firebase Firestore + Gemini AI
// 功能：響應式、總表(月/季/年/自訂)、AI對話(Gemini)、OCR上傳、行照辨識
// ═══════════════════════════════════════════════════════════════════════

// ── Firebase ──
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
const COL_TX = 'vc_transactions';
const COL_VEH = 'vc_vehicles';

// ── 車輛主檔 ──
const VEHICLES_MASTER = [
  {id:"BKE-7387",old:"RBX-1287",type:"NLR",ton:3.5,src:"租賃"},{id:"BMP-1612",old:"RCD-0575",type:"NLR",ton:3.5,src:"租賃"},
  {id:"BMQ-6180",old:"RCH-8512",type:"NLR",ton:3.5,src:"租賃"},{id:"BMT-5733",old:"RBY-7723",type:"NLR",ton:3.5,src:"租賃"},
  {id:"BMT-5803",old:"RBY-7730",type:"NLR",ton:3.5,src:"租賃"},{id:"BMT-6092",old:"RCK-0719",type:"NLR",ton:3.5,src:"租賃"},
  {id:"BQC-3661",old:"RCG-5327",type:"NLR",ton:3.5,src:"租賃"},{id:"BQC-3793",old:"RCG-5329",type:"NLR",ton:3.5,src:"租賃"},
  {id:"BQC-3973",old:"RCG-5330",type:"NLR",ton:3.5,src:"租賃"},{id:"BQC-7176",old:"RCP-0165",type:"NLR",ton:3.5,src:"租賃"},
  {id:"BSQ-7353",old:"RCG-7160",type:"NLR",ton:3.5,src:"租賃"},{id:"BUA-3107",old:"RCU-5527",type:"NLR",ton:3.5,src:"租賃"},
  {id:"BUA-3265",old:"RCU-5532",type:"NLR",ton:3.5,src:"租賃"},{id:"BUA-3721",old:"RCU-6921",type:"NLR",ton:3.5,src:"租賃"},
  {id:"BUB-0572",old:"RCV-5103",type:"NLR",ton:3.5,src:"租賃"},{id:"BUB-1036",old:"RCV-5227",type:"NLR",ton:3.5,src:"租賃"},
  {id:"BUB-1332",old:"RCV-6973",type:"NLR",ton:3.5,src:"租賃"},{id:"BUB-1562",old:"RCV-6981",type:"NLR",ton:3.5,src:"租賃"},
  {id:"BUC-6837",old:"RDA-3906",type:"NLR",ton:3.5,src:"租賃"},{id:"BUC-6933",old:"RDA-3907",type:"NLR",ton:3.5,src:"租賃"},
  {id:"BUC-7100",old:"RDA-3910",type:"NLR",ton:3.5,src:"租賃"},{id:"BUF-7506",old:null,type:"NLR",ton:3.5,src:"自購"},
  {id:"BUF-7507",old:null,type:"NLR",ton:3.5,src:"自購"},{id:"BVY-0363",old:null,type:"NLR",ton:3.5,src:"自購"},
  {id:"BVY-3570",old:"RDF-3532",type:"NLR",ton:3.5,src:"租賃"},{id:"BYV-2830",old:null,type:"NLR",ton:3.5,src:"自購"},
  {id:"BYV-2831",old:null,type:"NLR",ton:3.5,src:"自購"},
  {id:"BZH-3895",old:"RDQ-3217",type:"菱利",ton:0.8,src:"租賃"},{id:"BZH-3896",old:"RDQ-3212",type:"菱利",ton:0.8,src:"租賃"},
  {id:"BZH-3897",old:"RDQ-3211",type:"菱利",ton:0.8,src:"租賃"},{id:"BZH-7903",old:"RDS-0393",type:"菱利",ton:0.8,src:"租賃"},
  {id:"BZH-7913",old:"RDQ-9350",type:"菱利",ton:0.8,src:"租賃"},{id:"BZH-8131",old:"RDS-0536",type:"菱利",ton:0.8,src:"租賃"},
  {id:"BZH-8393",old:"RDS-0587",type:"菱利",ton:0.8,src:"租賃"},{id:"BZH-9217",old:null,type:"菱利",ton:0.8,src:"自購"},
  {id:"BZH-9223",old:null,type:"菱利",ton:0.8,src:"自購"},
  {id:"CAF-5712",old:null,type:"J SPACE",ton:0.8,src:"自購"},{id:"CAF-5715",old:null,type:"J SPACE",ton:0.8,src:"自購"},
  {id:"CAF-5721",old:null,type:"J SPACE",ton:0.8,src:"自購"},{id:"CAF-5752",old:null,type:"J SPACE",ton:0.8,src:"自購"},
  {id:"CAF-5761",old:null,type:"J SPACE",ton:0.8,src:"自購"},{id:"CAF-5771",old:null,type:"J SPACE",ton:0.8,src:"自購"},
  {id:"CAF-5772",old:null,type:"J SPACE",ton:0.8,src:"自購"},
];

// ── 廠商 ──
const VENDORS_MASTER = [
  {name:"福興汽車",taxType:"exclusive",brand:"ISUZU/NLR"},{name:"順益安平",taxType:"inclusive",brand:"中華系"},
  {name:"宏明汽車玻璃行",taxType:"manual",brand:null},{name:"弘昇汽車",taxType:"manual",brand:null},
  {name:"甲益",taxType:"manual",brand:null},{name:"龍溪",taxType:"manual",brand:null},
  {name:"信勇力商行",taxType:"exclusive",brand:null},
];

// ── 40 子類 + 市場參考價 ──
const CATEGORIES_MASTER = [
  {code:"A01",major:"A",majorName:"A 資本成本",sub:"車輛購置",kw:"購車,交車,車價",ref:""},
  {code:"A02",major:"A",majorName:"A 資本成本",sub:"折舊攤提",kw:"折舊",ref:""},
  {code:"A03",major:"A",majorName:"A 資本成本",sub:"加裝設備",kw:"行車紀錄器,安裝,加裝,貨架",ref:"行車紀錄器$3,000~8,000"},
  {code:"B01",major:"B",majorName:"B 定期保養",sub:"引擎機油及濾芯",kw:"機油,油芯,濾芯",ref:"NLR機油$3,500~4,200/菱利$1,800~2,500"},
  {code:"B02",major:"B",majorName:"B 定期保養",sub:"變速箱油",kw:"變速箱油,ATF,齒輪油",ref:"$2,000~4,500"},
  {code:"B03",major:"B",majorName:"B 定期保養",sub:"煞車油",kw:"煞車油,剎車油",ref:"$800~1,500"},
  {code:"B04",major:"B",majorName:"B 定期保養",sub:"冷卻液",kw:"冷卻液,水箱水,LLC",ref:"$500~1,200"},
  {code:"B05",major:"B",majorName:"B 定期保養",sub:"空氣濾清器",kw:"空氣濾,空濾",ref:"$500~900"},
  {code:"B06",major:"B",majorName:"B 定期保養",sub:"柴油濾清器",kw:"柴油濾,油水分離",ref:"$800~1,200"},
  {code:"B07",major:"B",majorName:"B 定期保養",sub:"全車油品更換",kw:"全車油品,大保養",ref:"$8,000~15,000"},
  {code:"B08",major:"B",majorName:"B 定期保養",sub:"其他定保項目",kw:"火星塞,正時",ref:""},
  {code:"C01",major:"C",majorName:"C 故障維修",sub:"引擎系統",kw:"引擎,渦輪,汽缸",ref:"$15,000~80,000"},
  {code:"C02",major:"C",majorName:"C 故障維修",sub:"傳動系統",kw:"離合器,傳動軸",ref:"$8,000~25,000"},
  {code:"C03",major:"C",majorName:"C 故障維修",sub:"煞車系統",kw:"煞車碟,分泵,ABS",ref:"$3,000~12,000"},
  {code:"C04",major:"C",majorName:"C 故障維修",sub:"懸吊/轉向",kw:"避震器,三角架,方向機",ref:"避震器$5,000~8,000/支"},
  {code:"C05",major:"C",majorName:"C 故障維修",sub:"電氣系統",kw:"發電機,馬達,線路",ref:"發電機$6,000~15,000"},
  {code:"C06",major:"C",majorName:"C 故障維修",sub:"排氣系統",kw:"排氣,觸媒,排氣煞車",ref:""},
  {code:"C07",major:"C",majorName:"C 故障維修",sub:"冷氣系統",kw:"冷氣,壓縮機,冷媒",ref:"壓縮機$8,000~18,000"},
  {code:"C08",major:"C",majorName:"C 故障維修",sub:"冷卻系統",kw:"水箱,水泵,水管",ref:"水箱$4,000~10,000"},
  {code:"C09",major:"C",majorName:"C 故障維修",sub:"其他維修",kw:"",ref:""},
  {code:"D01",major:"D",majorName:"D 消耗件",sub:"輪胎",kw:"輪胎,tire",ref:"NLR$3,500~5,500/條 菱利$1,800~3,000/條"},
  {code:"D02",major:"D",majorName:"D 消耗件",sub:"煞車來令片",kw:"來令片,brake pad",ref:"$1,500~4,000/組"},
  {code:"D03",major:"D",majorName:"D 消耗件",sub:"雨刷",kw:"雨刷",ref:"$200~800/支"},
  {code:"D04",major:"D",majorName:"D 消耗件",sub:"燈具",kw:"燈泡,大燈,方向燈",ref:"$300~3,000"},
  {code:"D05",major:"D",majorName:"D 消耗件",sub:"皮帶",kw:"皮帶",ref:"$800~2,500"},
  {code:"D06",major:"D",majorName:"D 消耗件",sub:"電瓶",kw:"電瓶,battery",ref:"NLR$3,000~5,000 菱利$2,000~3,500"},
  {code:"D07",major:"D",majorName:"D 消耗件",sub:"其他消耗件",kw:"",ref:""},
  {code:"E01",major:"E",majorName:"E 車體外觀",sub:"擋風玻璃",kw:"擋風玻璃,前擋",ref:"$6,000~12,000"},
  {code:"E02",major:"E",majorName:"E 車體外觀",sub:"隔熱紙",kw:"隔熱紙",ref:"$3,000~8,000"},
  {code:"E03",major:"E",majorName:"E 車體外觀",sub:"鈑金烤漆",kw:"鈑金,烤漆",ref:"$5,000~30,000"},
  {code:"E04",major:"E",majorName:"E 車體外觀",sub:"其他外觀",kw:"貼紙,logo",ref:""},
  {code:"F01",major:"F",majorName:"F 營運成本",sub:"燃料",kw:"加油,油資",ref:""},
  {code:"F02",major:"F",majorName:"F 營運成本",sub:"ETC 通行費",kw:"ETC,通行費",ref:""},
  {code:"F03",major:"F",majorName:"F 營運成本",sub:"停車費",kw:"停車",ref:""},
  {code:"G01",major:"G",majorName:"G 法規成本",sub:"牌照稅",kw:"牌照稅",ref:""},
  {code:"G02",major:"G",majorName:"G 法規成本",sub:"燃料稅",kw:"燃料稅",ref:""},
  {code:"G03",major:"G",majorName:"G 法規成本",sub:"強制險",kw:"強制險",ref:""},
  {code:"G04",major:"G",majorName:"G 法規成本",sub:"任意險",kw:"任意險,車體險",ref:""},
  {code:"G05",major:"G",majorName:"G 法規成本",sub:"驗車費",kw:"驗車",ref:"$450~1,500"},
  {code:"G06",major:"G",majorName:"G 法規成本",sub:"罰款",kw:"罰款,罰單",ref:""},
];

// ── 稅務計算 ──
const calcTax = (vendorName, amount) => {
  const v = VENDORS_MASTER.find(x => vendorName && vendorName.includes(x.name));
  if (!v) return { exTax: amount, tax: 0, incTax: amount, taxType: 'manual' };
  if (v.taxType === 'exclusive') { const t = Math.round(amount * 0.05); return { exTax: amount, tax: t, incTax: amount + t, taxType: 'exclusive' }; }
  if (v.taxType === 'inclusive') { const ex = Math.round(amount / 1.05); return { exTax: ex, tax: amount - ex, incTax: amount, taxType: 'inclusive' }; }
  return { exTax: amount, tax: 0, incTax: amount, taxType: 'manual' };
};

// ── 樣式 ──
const CAT_COLORS = {'A 資本成本':'#8E44AD','B 定期保養':'#27AE60','C 故障維修':'#E74C3C','D 消耗件':'#4472C4','E 車體外觀':'#F39C12','F 營運成本':'#1ABC9C','G 法規成本':'#95A5A6'};
const TAG_C = {A:{bg:'#E8D5F5',fg:'#6B21A8'},B:{bg:'#D5F5E3',fg:'#1B7A3D'},C:{bg:'#FADBD8',fg:'#922B21'},D:{bg:'#D6EAF8',fg:'#1B4F72'},E:{bg:'#FEF9E7',fg:'#7D6608'},F:{bg:'#F5EEF8',fg:'#6C3483'},G:{bg:'#EAEDED',fg:'#515A5A'}};
const V_TYPES = ['全部','NLR','菱利','J SPACE'];
const AX = '#EAB308';

// ── Seed 資料 ──
const SEED_TX = [
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
  // ── 響應式 ──
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allTx, setAllTx] = useState([]);
  const [fsVehicles, setFsVehicles] = useState({}); // Firestore vehicle overrides

  // Dashboard
  const [kpis, setKpis] = useState(null);
  const [costStructure, setCostStructure] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);

  // Vehicles
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleType, setVehicleType] = useState('全部');
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Report
  const [reportMode, setReportMode] = useState('monthly'); // monthly/quarterly/yearly/custom/compare
  const [reportMonth, setReportMonth] = useState(() => { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`; });
  const [reportQuarter, setReportQuarter] = useState(() => { const n=new Date(); return { year: n.getFullYear(), q: Math.ceil((n.getMonth()+1)/3) }; });
  const [reportYear, setReportYear] = useState(() => new Date().getFullYear());
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [reportSortBy, setReportSortBy] = useState('cost');
  const [pdfLoading, setPdfLoading] = useState(false);

  // Categories
  const [openAccordion, setOpenAccordion] = useState(null);

  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Settings - license upload
  const [licenseUploadVehicle, setLicenseUploadVehicle] = useState(null);
  const [licenseResult, setLicenseResult] = useState(null);
  const [licenseLoading, setLicenseLoading] = useState(false);
  const licenseFileRef = useRef(null);

  // Charts
  const pieRef = useRef(null); const barRef = useRef(null); const detailPieRef = useRef(null);
  const pieChart = useRef(null); const barChart = useRef(null); const detailPieChart = useRef(null);
  const chartLoaded = useRef(false); const seeded = useRef(false);

  // ── Load Chart.js + jsPDF ──
  useEffect(() => {
    if (window.Chart) { chartLoaded.current = true; } else {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
      s.onload = () => { chartLoaded.current = true; };
      document.head.appendChild(s);
    }
    // jsPDF for PDF export
    if (!window.jspdf) {
      const s2 = document.createElement('script');
      s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js';
      document.head.appendChild(s2);
      const s3 = document.createElement('script');
      s3.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
      document.head.appendChild(s3);
    }
  }, []);

  // ── Firestore Load ──
  const loadAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const fb = await initFirebase();
      const col = fb.collection(fb.db, COL_TX);
      if (!seeded.current) {
        const snap = await fb.getDocs(fb.query(col, fb.limit(1)));
        if (snap.empty) { for (const t of SEED_TX) await fb.addDoc(col, {...t, createdAt: new Date().toISOString()}); }
        seeded.current = true;
      }
      const allSnap = await fb.getDocs(col);
      const txList = []; allSnap.forEach(doc => txList.push({id:doc.id,...doc.data()}));
      txList.sort((a,b) => (b.date||'').localeCompare(a.date||''));
      setAllTx(txList);
      computeDashboard(txList);
      // Load vehicle overrides
      try {
        const vCol = fb.collection(fb.db, COL_VEH);
        const vSnap = await fb.getDocs(vCol);
        const vMap = {}; vSnap.forEach(doc => { const d = doc.data(); if (d.plateNumber) vMap[d.plateNumber] = d; });
        setFsVehicles(vMap);
      } catch {}
    } catch (e) {
      console.error('Firestore error:', e);
      setError(`Firebase 錯誤：${e.code || e.message}。請檢查 Firestore 安全規則。`);
    }
    setLoading(false);
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Get vehicle info (Firestore override > master) ──
  const getVehicle = useCallback((vid) => {
    const fs = fsVehicles[vid];
    const master = VEHICLES_MASTER.find(v => v.id === vid);
    if (fs) return { id: vid, type: fs.brandModel || master?.type || '未知', ton: fs.totalWeight ? (fs.totalWeight/1000).toFixed(1) : master?.ton || 0, old: master?.old, src: master?.src || '', fsData: fs };
    return master ? { ...master, fsData: null } : { id: vid, type: '未知', ton: 0, old: null, src: '', fsData: null };
  }, [fsVehicles]);

  // ── Dashboard KPIs ──
  const computeDashboard = (txList) => {
    const now = new Date();
    const yr = String(now.getFullYear());
    const mo = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const mTx = txList.filter(t => t.date?.startsWith(mo));
    const yTx = txList.filter(t => t.date?.startsWith(yr));
    const mCost = mTx.reduce((s,t) => s+(t.amountExTax||0),0);
    const yCost = yTx.reduce((s,t) => s+(t.amountExTax||0),0);
    const vCosts = {}; yTx.forEach(t => { vCosts[t.vehicleId] = (vCosts[t.vehicleId]||0)+(t.amountExTax||0); });
    const vals = Object.values(vCosts); const avg = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
    const anomalies = Object.entries(vCosts).filter(([,c]) => c > avg*2);
    const vWithCost = new Set(mTx.map(t=>t.vehicleId));
    const zeroCost = VEHICLES_MASTER.filter(v => !vWithCost.has(v.id)).length;
    setKpis({ mCost, mTxCount: mTx.length, yCost, anomalyCount: anomalies.length, zeroCost, avg: Math.round(avg) });
    // Cost structure
    const struct = {}; yTx.forEach(t => { struct[t.majorCat] = (struct[t.majorCat]||0)+(t.amountExTax||0); });
    setCostStructure(Object.entries(struct).map(([l,v])=>({label:l,value:v})).sort((a,b)=>b.value-a.value));
    // Monthly trend
    const trend = {}; txList.forEach(t => { const m=t.date?.substring(0,7); if(!m) return; if(!trend[m]) trend[m]={}; trend[m][t.majorCat]=(trend[m][t.majorCat]||0)+(t.amountExTax||0); });
    const tArr=[]; Object.entries(trend).forEach(([m,cats])=>Object.entries(cats).forEach(([c,tot])=>tArr.push({month:m,majorCat:c,total:tot})));
    setMonthlyTrend(tArr);
  };

  // ── Charts ──
  useEffect(() => {
    if (!chartLoaded.current || !window.Chart || tab !== 'dashboard' || !costStructure.length) return;
    const timer = setTimeout(() => {
      if (pieRef.current) {
        if (pieChart.current) pieChart.current.destroy();
        pieChart.current = new window.Chart(pieRef.current, { type:'doughnut', data:{ labels:costStructure.map(s=>s.label), datasets:[{data:costStructure.map(s=>s.value),backgroundColor:costStructure.map(s=>CAT_COLORS[s.label]||'#CCC'),borderWidth:0}]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{size:10},padding:6}}},cutout:'55%'}});
      }
      if (barRef.current && monthlyTrend.length) {
        if (barChart.current) barChart.current.destroy();
        const months=[...new Set(monthlyTrend.map(t=>t.month))].sort().slice(-6);
        const cats=[...new Set(monthlyTrend.map(t=>t.majorCat))];
        barChart.current = new window.Chart(barRef.current, { type:'bar', data:{ labels:months.map(m=>m.substring(5)+'月'), datasets:cats.map(c=>({label:c,data:months.map(m=>{const r=monthlyTrend.find(t=>t.month===m&&t.majorCat===c);return r?r.total:0;}),backgroundColor:CAT_COLORS[c]||'#CCC'}))}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:9},padding:4}}},scales:{x:{stacked:true,ticks:{font:{size:10}}},y:{stacked:true,ticks:{font:{size:9},callback:v=>'$'+Math.round(v/1000)+'K'}}}}});
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [tab, costStructure, monthlyTrend]);

  // ── Vehicles computed ──
  const filteredVehicles = useMemo(() => {
    const yr = String(new Date().getFullYear());
    return VEHICLES_MASTER.filter(v => {
      if (vehicleType !== '全部' && v.type !== vehicleType) return false;
      if (vehicleSearch && !v.id.toLowerCase().includes(vehicleSearch.toLowerCase()) && !(v.old||'').toLowerCase().includes(vehicleSearch.toLowerCase())) return false;
      return true;
    }).map(v => {
      const vTx = allTx.filter(t=>t.vehicleId===v.id && t.date?.startsWith(yr));
      return { ...v, ytdCost:vTx.reduce((s,t)=>s+(t.amountExTax||0),0), txCount:vTx.length, lastDate:vTx[0]?.date||null };
    });
  }, [allTx, vehicleSearch, vehicleType]);

  // ── Vehicle Detail ──
  const vehicleDetail = useMemo(() => {
    if (!selectedVehicle) return null;
    const v = getVehicle(selectedVehicle);
    const yr = String(new Date().getFullYear());
    const vTx = allTx.filter(t=>t.vehicleId===v.id && t.date?.startsWith(yr)).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    const struct={}; vTx.forEach(t=>{struct[t.majorCat]=(struct[t.majorCat]||0)+(t.amountExTax||0);});
    return { vehicle:v, transactions:vTx, totalCost:vTx.reduce((s,t)=>s+(t.amountExTax||0),0), txCount:vTx.length, maxMileage:Math.max(0,...vTx.map(t=>t.mileage||0)), lastDate:vTx[0]?.date||null, costStructure:Object.entries(struct).map(([l,v])=>({label:l,value:v})).sort((a,b)=>b.value-a.value) };
  }, [selectedVehicle, allTx, getVehicle]);

  useEffect(() => {
    if (!vehicleDetail || !detailPieRef.current || !window.Chart || !vehicleDetail.costStructure.length) return;
    const timer = setTimeout(() => {
      if (detailPieChart.current) detailPieChart.current.destroy();
      detailPieChart.current = new window.Chart(detailPieRef.current, { type:'doughnut', data:{labels:vehicleDetail.costStructure.map(s=>s.label),datasets:[{data:vehicleDetail.costStructure.map(s=>s.value),backgroundColor:vehicleDetail.costStructure.map(s=>CAT_COLORS[s.label]||'#CCC'),borderWidth:0}]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{size:9}}}},cutout:'50%'}});
    }, 300);
    return () => clearTimeout(timer);
  }, [vehicleDetail]);

  // ═══ REPORT TAB LOGIC ═══
  const reportData = useMemo(() => {
    let startDate = '', endDate = '', label = '';
    const now = new Date();
    if (reportMode === 'monthly') { startDate = reportMonth + '-01'; const [y,m]=reportMonth.split('-'); const last=new Date(+y,+m,0).getDate(); endDate=reportMonth+'-'+last; label=`${y}年${+m}月`; }
    else if (reportMode === 'quarterly') { const {year,q}=reportQuarter; const sm=(q-1)*3+1; startDate=`${year}-${String(sm).padStart(2,'0')}-01`; const em=q*3; const last=new Date(year,em,0).getDate(); endDate=`${year}-${String(em).padStart(2,'0')}-${last}`; label=`${year}年 Q${q}`; }
    else if (reportMode === 'yearly') { startDate=`${reportYear}-01-01`; endDate=`${reportYear}-12-31`; label=`${reportYear}年度`; }
    else if (reportMode === 'custom') { startDate=customStart; endDate=customEnd; label=`${customStart} ~ ${customEnd}`; }
    else if (reportMode === 'compare') { startDate=`${reportYear}-01-01`; endDate=`${reportYear}-12-31`; label=`${reportYear}年度對比`; }

    if (!startDate || !endDate) return { rows:[], label, total:{}, startDate, endDate };
    const filtered = allTx.filter(t => t.date && t.date >= startDate && t.date <= endDate);

    if (reportMode === 'compare') {
      // Year comparison: vehicle × 12 months
      const vMap = {};
      filtered.forEach(t => {
        const m = +t.date.substring(5,7);
        if (!vMap[t.vehicleId]) vMap[t.vehicleId] = { months: Array(12).fill(0), total: 0, count: 0 };
        vMap[t.vehicleId].months[m-1] += (t.amountExTax||0);
        vMap[t.vehicleId].total += (t.amountExTax||0);
        vMap[t.vehicleId].count++;
      });
      const rows = Object.entries(vMap).map(([vid,d]) => ({ vehicleId:vid, ...getVehicle(vid), ...d, avg:Math.round(d.total/12) }));
      rows.sort((a,b) => b.total - a.total);
      const allVals = rows.map(r=>r.total);
      const fleetAvg = allVals.length ? allVals.reduce((a,b)=>a+b,0)/allVals.length : 0;
      return { rows, label, fleetAvg, startDate, endDate };
    }

    // Standard report
    const vMap = {};
    filtered.forEach(t => {
      if (!vMap[t.vehicleId]) vMap[t.vehicleId] = { exTax:0, tax:0, incTax:0, count:0, maxSingle:0 };
      vMap[t.vehicleId].exTax += (t.amountExTax||0);
      vMap[t.vehicleId].tax += (t.taxAmount||0);
      vMap[t.vehicleId].incTax += (t.amountIncTax||0);
      vMap[t.vehicleId].count++;
      if ((t.amountExTax||0) > vMap[t.vehicleId].maxSingle) vMap[t.vehicleId].maxSingle = t.amountExTax;
    });
    let rows = Object.entries(vMap).map(([vid,d]) => ({ vehicleId:vid, ...getVehicle(vid), ...d }));
    if (reportSortBy === 'cost') rows.sort((a,b)=>b.exTax-a.exTax);
    else rows.sort((a,b)=>a.vehicleId.localeCompare(b.vehicleId));
    const total = { exTax:rows.reduce((s,r)=>s+r.exTax,0), tax:rows.reduce((s,r)=>s+r.tax,0), incTax:rows.reduce((s,r)=>s+r.incTax,0), count:rows.reduce((s,r)=>s+r.count,0) };
    return { rows, label, total, startDate, endDate };
  }, [allTx, reportMode, reportMonth, reportQuarter, reportYear, customStart, customEnd, reportSortBy, getVehicle]);

  // ── CSV Export ──
  const exportCSV = () => {
    const { rows, label } = reportData;
    if (!rows.length) return;
    let csv = '\uFEFF'; // BOM for Excel
    if (reportMode === 'compare') {
      csv += `${label}\n車號,車型,噸位,1月,2月,3月,4月,5月,6月,7月,8月,9月,10月,11月,12月,年合計,月平均\n`;
      rows.forEach(r => { csv += `${r.vehicleId},${r.type},${r.ton},${r.months.join(',')},${r.total},${r.avg}\n`; });
    } else {
      csv += `${label}\n車號,車型,噸位,未稅,稅額,含稅,筆數,最高單筆\n`;
      rows.forEach(r => { csv += `${r.vehicleId},${r.type},${r.ton},${r.exTax},${r.tax},${r.incTax},${r.count},${r.maxSingle||0}\n`; });
      csv += `合計,,,${reportData.total.exTax},${reportData.total.tax},${reportData.total.incTax},${reportData.total.count},\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `車輛成本_${label}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── PDF Export (with AI analysis) ──
  const exportPDF = async () => {
    setPdfLoading(true);
    try {
      // Get AI analysis
      let aiText = '';
      try {
        const summaryData = reportMode === 'compare'
          ? reportData.rows.slice(0,10).map(r=>({vid:r.vehicleId,type:r.type,total:r.total,avg:r.avg}))
          : reportData.rows.slice(0,15).map(r=>({vid:r.vehicleId,type:r.type,exTax:r.exTax,count:r.count}));
        const res = await fetch('/api/gemini-ocr', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ mode:'report', prompt:`報表期間：${reportData.label}\n總筆數：${reportData.rows.length} 輛\n資料：${JSON.stringify(summaryData)}` })
        });
        const data = await res.json();
        aiText = data.result || '（AI 分析暫時無法取得）';
      } catch { aiText = '（AI 分析暫時無法取得）'; }

      // Generate PDF
      if (!window.jspdf) { alert('PDF 元件載入中，請稍後再試'); setPdfLoading(false); return; }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      // Chinese font fallback - use built-in
      doc.setFont('helvetica');
      doc.setFontSize(16);
      doc.text(`Vehicle Cost Report - ${reportData.label}`, 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString('zh-TW')}`, 14, 22);

      // Table
      if (reportMode === 'compare') {
        doc.autoTable({
          startY: 28, head:[['Vehicle','Type','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Total','Avg']],
          body: reportData.rows.map(r=>[r.vehicleId,r.type,...r.months.map(m=>m.toLocaleString()),r.total.toLocaleString(),r.avg.toLocaleString()]),
          styles:{fontSize:7,cellPadding:1.5}, headStyles:{fillColor:[15,23,42]},
        });
      } else {
        doc.autoTable({
          startY: 28, head:[['Vehicle','Type','Ton','ExTax','Tax','IncTax','Count','MaxSingle']],
          body: reportData.rows.map(r=>[r.vehicleId,r.type,r.ton,r.exTax.toLocaleString(),r.tax.toLocaleString(),r.incTax.toLocaleString(),r.count,(r.maxSingle||0).toLocaleString()]),
          styles:{fontSize:8,cellPadding:2}, headStyles:{fillColor:[15,23,42]},
          foot:[['Total','','',reportData.total.exTax.toLocaleString(),reportData.total.tax.toLocaleString(),reportData.total.incTax.toLocaleString(),reportData.total.count,'']],
        });
      }

      // AI Analysis section
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.text('AI Analysis:', 14, finalY);
      doc.setFontSize(8);
      const lines = doc.splitTextToSize(aiText, 260);
      doc.text(lines, 14, finalY + 6);

      doc.save(`vehicle_cost_${reportData.label}.pdf`);
    } catch (e) { console.error('PDF export error:', e); alert('PDF 匯出失敗：' + e.message); }
    setPdfLoading(false);
  };

  // ═══ CHAT + OCR ═══
  const addMsg = (role, html) => setChatMessages(prev => [...prev, { role, html }]);

  useEffect(() => {
    if (tab === 'chat' && !chatMessages.length) {
      setChatMessages([{ role:'ai', html:'歡迎使用車輛成本中心 AI 助手 👋<br/><br/>我可以幫您：<br/>• 查詢車輛成本履歷（輸入車號）<br/>• 📎 上傳維修單據（OCR 自動辨識）<br/>• 產出月度結算報表<br/>• 偵測異常維修模式<br/>• 智慧分析與汰換建議<br/><br/><span style="font-size:11px;color:#999">點擊快速按鈕、上傳單據或直接輸入問題。</span>' }]);
    }
  }, [tab]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  // ── Gemini API call ──
  const callGemini = async (mode, body) => {
    const res = await fetch('/api/gemini-ocr', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({mode,...body}) });
    return await res.json();
  };

  // ── File upload for OCR ──
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) { addMsg('ai', '⚠️ 檔案大小超過 10MB 限制'); return; }

    addMsg('user', `📎 上傳單據：${file.name}`);
    setChatLoading(true);

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      addMsg('ai', '🔄 正在辨識單據...');
      const data = await callGemini('ocr', { imageBase64: base64, mimeType: file.type || 'image/jpeg' });

      if (data.result && !data.parseError) {
        const r = data.result;
        let h = `✅ <strong>OCR 辨識結果</strong><br/><br/>`;
        h += `📅 日期：${r.date || '未辨識'}<br/>`;
        h += `🚛 車號：${r.vehicleId || '未辨識'}<br/>`;
        h += `🏭 廠商：${r.vendor || '未辨識'}<br/>`;
        h += `🛣️ 里程：${r.mileage || 0} km<br/>`;
        if (r.items?.length) {
          h += `<br/><strong>明細（${r.items.length} 項）：</strong><br/>`;
          r.items.forEach((item, i) => {
            const cat = CATEGORIES_MASTER.find(c=>c.code===item.catCode);
            h += `${i+1}. ${item.desc} × ${item.qty} = $${(item.unitPrice*item.qty).toLocaleString()} [${item.catCode} ${cat?.sub||''}]<br/>`;
          });
        }
        h += `<br/><div id="ocr-confirm" style="display:flex;gap:8px;margin-top:8px"><button onclick="window._ocrConfirm()" style="padding:6px 16px;background:${AX};color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px">✅ 確認入帳</button><button onclick="window._ocrCancel()" style="padding:6px 16px;background:#e2e8f0;color:#333;border:none;border-radius:6px;cursor:pointer;font-size:12px">❌ 取消</button></div>`;

        // Store for confirm
        window._ocrData = r;
        window._ocrConfirm = async () => {
          try {
            const fb = await initFirebase();
            const col = fb.collection(fb.db, COL_TX);
            let count = 0;
            for (const item of (r.items || [])) {
              const cat = CATEGORIES_MASTER.find(c=>c.code===item.catCode);
              const tax = calcTax(r.vendor, item.unitPrice * (item.qty||1));
              await fb.addDoc(col, {
                date: r.date, vehicleId: r.vehicleId, vendor: r.vendor, catCode: item.catCode,
                majorCat: cat?.majorName || 'C 故障維修', subCat: cat?.sub || '其他維修',
                desc: item.desc, qty: item.qty||1, unitPrice: item.unitPrice,
                amountExTax: tax.exTax, taxAmount: tax.tax, amountIncTax: tax.incTax,
                mileage: r.mileage||0, invoiceNo: r.invoiceNo||'', source: 'OCR',
                createdAt: new Date().toISOString(),
              });
              count++;
            }
            addMsg('ai', `✅ 已成功入帳 ${count} 筆交易！資料已寫入 Firestore。`);
            loadAll(); // Refresh
          } catch (err) { addMsg('ai', `❌ 入帳失敗：${err.message}`); }
        };
        window._ocrCancel = () => addMsg('ai', '已取消入帳。');
        addMsg('ai', h);
      } else {
        addMsg('ai', `⚠️ OCR 辨識結果無法解析為結構化資料。<br/><br/>原始回覆：<br/>${data.raw || '無回覆'}`);
      }
    } catch (err) { addMsg('ai', `❌ OCR 處理失敗：${err.message}`); }
    setChatLoading(false);
  };

  // ── Send Chat ──
  const sendChat = async () => {
    const text = chatInput.trim(); if (!text) return;
    setChatInput(''); addMsg('user', text); setChatLoading(true);

    try {
      const plateMatch = text.match(/[A-Z]{2,3}[-]?\d{3,4}/i);
      if (plateMatch) {
        let plate = plateMatch[0].toUpperCase();
        if (!plate.includes('-')) plate = plate.replace(/(\D+)(\d+)/, '$1-$2');
        const v = getVehicle(plate);
        const yr = String(new Date().getFullYear());
        const vTx = allTx.filter(t=>t.vehicleId===plate && t.date?.startsWith(yr));
        if (!vTx.length && !VEHICLES_MASTER.find(x=>x.id===plate)) { addMsg('ai', `找不到車號 ${plate} 的資料。`); setChatLoading(false); return; }

        // Call Gemini for deep analysis
        const history = vTx.slice(0,20).map(t=>({date:t.date,desc:t.desc,cat:t.majorCat,cost:t.amountExTax}));
        const totalCost = vTx.reduce((s,t)=>s+(t.amountExTax||0),0);
        const data = await callGemini('analyze', {
          prompt: `車號 ${plate}（${v.type} ${v.ton}t），年度累計 $${totalCost.toLocaleString()}，共 ${vTx.length} 筆。用戶問：${text}`,
          vehicleHistory: { vehicle: v, totalCost, txCount: vTx.length, transactions: history }
        });

        let h = `<strong>${plate}</strong> ${v.type} ${v.ton}t<br/>📊 年度累計：$${totalCost.toLocaleString()} | 📝 ${vTx.length} 筆<br/><br/>`;
        h += `<strong>🤖 AI 分析：</strong><br/>${(data.result || '暫無分析').replace(/\n/g, '<br/>')}`;
        // Market price info
        const cats = [...new Set(vTx.map(t=>t.catCode))];
        const refs = cats.map(c => CATEGORIES_MASTER.find(x=>x.code===c)).filter(c=>c?.ref);
        if (refs.length) {
          h += `<br/><br/><strong>💰 市場參考價：</strong><br/>`;
          refs.forEach(r => h += `${r.sub}：${r.ref}<br/>`);
        }
        addMsg('ai', h);
      } else if (text.includes('月報') || text.includes('結算')) {
        // Keep existing local logic + Gemini summary
        const now = new Date();
        const mo = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
        const mTx = allTx.filter(t=>t.date?.startsWith(mo));
        const mCost = mTx.reduce((s,t)=>s+(t.amountExTax||0),0);
        const vCosts = {}; mTx.forEach(t=>{vCosts[t.vehicleId]=(vCosts[t.vehicleId]||0)+(t.amountExTax||0);});
        const top5 = Object.entries(vCosts).sort((a,b)=>b[1]-a[1]).slice(0,5);
        let h = `<strong>${now.getFullYear()}/${now.getMonth()+1} 月度報表</strong><br/><br/>💰 月度費用：$${mCost.toLocaleString()}<br/>📄 處理單據：${mTx.length} 筆<br/>`;
        if (top5.length) { h += `<br/><strong>Top 5：</strong><br/>`; top5.forEach(([v,c],i) => h += `${i+1}. ${v} $${c.toLocaleString()}<br/>`); }
        addMsg('ai', h);
      } else if (text.includes('異常') || text.includes('警示')) {
        const yr = String(new Date().getFullYear());
        const yTx = allTx.filter(t=>t.date?.startsWith(yr));
        const vCosts = {}; yTx.forEach(t=>{vCosts[t.vehicleId]=(vCosts[t.vehicleId]||0)+(t.amountExTax||0);});
        const vals = Object.values(vCosts); const avg = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
        const anomalies = Object.entries(vCosts).filter(([,c]) => c > avg*2);
        if (!anomalies.length) { addMsg('ai', '✅ 目前沒有偵測到異常車輛。'); }
        else {
          let h = `⚠️ <strong>偵測到 ${anomalies.length} 個異常</strong>（車隊平均 $${Math.round(avg).toLocaleString()}）<br/>`;
          anomalies.forEach(([v,c]) => h += `🔴 <strong>${v}</strong> — 年度 $${c.toLocaleString()}<br/>`);
          addMsg('ai', h);
        }
      } else {
        // General Gemini chat
        const data = await callGemini('chat', { prompt: text });
        addMsg('ai', (data.result || '抱歉，暫時無法回覆。').replace(/\n/g, '<br/>'));
      }
    } catch (err) { addMsg('ai', `❌ 處理失敗：${err.message}`); }
    setChatLoading(false);
  };

  const quickAction = (a) => {
    if (a==='monthly') { setChatInput('本月結算'); setTimeout(sendChat,100); }
    else if (a==='anomaly') { setChatInput('異常警示'); setTimeout(sendChat,100); }
    else if (a==='history') addMsg('ai','請輸入要查詢的車號，例如：BUB-0572、BZH-8131、CAF-5712');
    else if (a==='upload') fileInputRef.current?.click();
  };

  // ═══ LICENSE UPLOAD (Settings) ═══
  const handleLicenseUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = '';
    setLicenseLoading(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const data = await callGemini('license', { imageBase64: base64, mimeType: file.type });
      if (data.result && !data.parseError) setLicenseResult(data.result);
      else alert('行照辨識失敗，請重試');
    } catch (err) { alert('上傳失敗：' + err.message); }
    setLicenseLoading(false);
  };

  const saveLicenseData = async () => {
    if (!licenseResult || !licenseUploadVehicle) return;
    try {
      const fb = await initFirebase();
      const col = fb.collection(fb.db, COL_VEH);
      // Use vehicle plate as doc ID
      const plate = licenseResult.plateNumber || licenseUploadVehicle;
      await fb.setDoc(fb.doc(fb.db, COL_VEH, plate), { ...licenseResult, updatedAt: new Date().toISOString() });
      alert('✅ 車輛資料已更新！');
      setLicenseResult(null); setLicenseUploadVehicle(null);
      loadAll();
    } catch (err) { alert('儲存失敗：' + err.message); }
  };

  // ═══ COMPONENTS ═══
  const Tag = ({ code }) => { const l=code[0]; const c=TAG_C[l]||{bg:'#EEE',fg:'#333'}; return <span style={{display:'inline-block',padding:'1px 6px',borderRadius:3,fontSize:10,fontWeight:600,background:c.bg,color:c.fg,marginRight:4}}>{code}</span>; };

  // Categories grouped
  const catGroups = useMemo(() => {
    const g = {};
    CATEGORIES_MASTER.forEach(c => { if (!g[c.majorName]) g[c.majorName]={majorCode:c.major,majorName:c.majorName,items:[]}; g[c.majorName].items.push(c); });
    return Object.values(g);
  }, []);

  // ── Styles ──
  const hdr = { background:'#0f172a',color:'#fff',padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10 };
  const card = { background:'#fff',borderRadius:10,boxShadow:'0 1px 6px rgba(0,0,0,0.06)',padding:14,marginBottom:12 };
  const tabSt = (a) => ({ flex:1,display:'flex',flexDirection:'column',alignItems:'center',padding:'7px 0',cursor:'pointer',color:a?AX:'#999',fontSize:10,transition:'color 0.2s',background:'none',border:'none' });
  const btnPrimary = { padding:'6px 14px',background:AX,color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:600 };
  const btnOutline = { padding:'6px 14px',background:'none',border:`1px solid ${AX}`,color:AX,borderRadius:6,cursor:'pointer',fontSize:12 };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight:windowHeight+'px',display:'flex',flexDirection:'column',background:'#f5f7fa',fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft JhengHei',sans-serif" }}>
      {/* Header */}
      <div style={hdr}>
        <div>
          <div style={{fontSize:16,fontWeight:700}}>車輛成本中心</div>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.5)',marginTop:2}}>Vehicle Cost Center v2 · Firebase + Gemini AI</div>
        </div>
        <button onClick={onBack} style={{background:'none',border:'1px solid rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.5)',padding:'4px 12px',borderRadius:2,fontSize:10,letterSpacing:2,cursor:'pointer'}}>HOME</button>
      </div>

      <div style={{flex:1,overflowY:'auto',paddingBottom:60}}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

        {/* ═══ DASHBOARD ═══ */}
        {tab === 'dashboard' && (
          <div style={{padding:14}}>
            {error ? (
              <div style={{textAlign:'center',padding:40,color:'#e74c3c'}}>
                <div style={{fontSize:36,marginBottom:12}}>⚠️</div>
                <div style={{fontSize:13}}>{error}</div>
                <button onClick={loadAll} style={{marginTop:12,...btnOutline}}>重試</button>
              </div>
            ) : loading ? (
              <div style={{textAlign:'center',padding:40,color:'#999'}}>
                <div style={{width:28,height:28,border:'3px solid #e2e8f0',borderTopColor:AX,borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto 10px'}} />載入中...
              </div>
            ) : kpis && (
              <>
                <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(3,1fr)':'repeat(6,1fr)',gap:8,marginBottom:12}}>
                  {[
                    {label:'本月費用',value:`$${(kpis.mCost||0).toLocaleString()}`},
                    {label:'已處理單據',value:kpis.mTxCount||0,note:'張'},
                    {label:'本年累計',value:`$${(kpis.yCost||0).toLocaleString()}`},
                    {label:'車隊平均',value:`$${(kpis.avg||0).toLocaleString()}`,note:'元/輛'},
                    {label:'異常車輛',value:kpis.anomalyCount||0,note:'輛',alert:kpis.anomalyCount>0},
                    {label:'零費用車輛',value:kpis.zeroCost||0,note:'輛'},
                  ].map((k,i) => (
                    <div key={i} style={{...card,textAlign:'center',padding:'10px 8px'}}>
                      <div style={{fontSize:10,color:'#999'}}>{k.label}</div>
                      <div style={{fontSize:isMobile?16:20,fontWeight:700,color:k.alert?'#e74c3c':'#1B2A4A',margin:'3px 0'}}>{k.value}</div>
                      {k.note && <div style={{fontSize:9,color:'#999'}}>{k.note}</div>}
                    </div>
                  ))}
                </div>
                <div style={isMobile?{}:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div style={card}><div style={{fontSize:12,color:'#999',fontWeight:600,marginBottom:8}}>● 成本結構</div><div style={{position:'relative',height:200}}><canvas ref={pieRef}/></div></div>
                  <div style={card}><div style={{fontSize:12,color:'#999',fontWeight:600,marginBottom:8}}>● 月度趨勢</div><div style={{position:'relative',height:200}}><canvas ref={barRef}/></div></div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══ VEHICLES ═══ */}
        {tab === 'vehicles' && !selectedVehicle && (
          <div style={{padding:14}}>
            <input type="text" placeholder="搜尋車號..." value={vehicleSearch} onChange={e=>setVehicleSearch(e.target.value)} style={{width:'100%',padding:'9px 12px',border:'1px solid #e2e8f0',borderRadius:8,fontSize:13,outline:'none',marginBottom:10,boxSizing:'border-box'}} />
            <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:12}}>
              {V_TYPES.map(t => <button key={t} onClick={()=>setVehicleType(t)} style={{padding:'4px 12px',borderRadius:16,border:`1px solid ${t===vehicleType?AX:'#e2e8f0'}`,background:t===vehicleType?AX:'#fff',color:t===vehicleType?'#fff':'#999',fontSize:11,cursor:'pointer'}}>{t}</button>)}
            </div>
            {isMobile ? (
              filteredVehicles.map(v => (
                <div key={v.id} onClick={()=>setSelectedVehicle(v.id)} style={{display:'flex',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #f0f0f0',cursor:'pointer'}}>
                  <div style={{width:36,height:36,borderRadius:8,background:'#EBF5FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,marginRight:10}}>🚛</div>
                  <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14}}>{v.id}</div><div style={{fontSize:11,color:'#999'}}>{v.type} {v.ton}t{v.old?` (原${v.old})`:''}</div></div>
                  <div style={{textAlign:'right'}}><div style={{fontWeight:700,fontSize:14,color:'#1B2A4A'}}>${(v.ytdCost||0).toLocaleString()}</div><div style={{fontSize:10,color:'#999'}}>{v.lastDate||'尚無紀錄'}</div></div>
                </div>
              ))
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead><tr style={{background:'#f8fafc',borderBottom:'2px solid #e2e8f0'}}>
                  <th style={{padding:'8px 12px',textAlign:'left'}}>車號</th><th style={{textAlign:'left'}}>車型</th><th>噸位</th><th>原車牌</th><th style={{textAlign:'right'}}>年度累計</th><th>筆數</th><th>最近維修</th>
                </tr></thead>
                <tbody>{filteredVehicles.map(v => (
                  <tr key={v.id} onClick={()=>setSelectedVehicle(v.id)} style={{borderBottom:'1px solid #f0f0f0',cursor:'pointer'}} onMouseOver={e=>e.currentTarget.style.background='#f8fafc'} onMouseOut={e=>e.currentTarget.style.background=''}>
                    <td style={{padding:'8px 12px',fontWeight:600}}>{v.id}</td><td>{v.type}</td><td style={{textAlign:'center'}}>{v.ton}t</td><td style={{color:'#999'}}>{v.old||'-'}</td>
                    <td style={{textAlign:'right',fontWeight:700,color:'#1B2A4A'}}>${(v.ytdCost||0).toLocaleString()}</td><td style={{textAlign:'center'}}>{v.txCount}</td><td style={{color:'#999'}}>{v.lastDate||'-'}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
            {!filteredVehicles.length && <div style={{textAlign:'center',padding:30,color:'#999'}}>沒有符合條件的車輛</div>}
          </div>
        )}

        {/* Vehicle Detail */}
        {tab === 'vehicles' && selectedVehicle && vehicleDetail && (
          <div>
            <div style={{background:'#0f172a',color:'#fff',padding:14}}>
              <div onClick={()=>setSelectedVehicle(null)} style={{cursor:'pointer',fontSize:13,opacity:0.7,marginBottom:6}}>← 返回</div>
              <div style={{fontSize:20,fontWeight:700}}>{vehicleDetail.vehicle.id}</div>
              <div style={{fontSize:11,opacity:0.6,marginTop:3}}>{vehicleDetail.vehicle.type} {vehicleDetail.vehicle.ton}t | {vehicleDetail.vehicle.src}</div>
            </div>
            <div style={{padding:14}}>
              <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)',gap:8,marginBottom:12}}>
                {[{label:'累計成本',value:`$${(vehicleDetail.totalCost||0).toLocaleString()}`},{label:'交易筆數',value:vehicleDetail.txCount},{label:'最高里程',value:`${(vehicleDetail.maxMileage||0).toLocaleString()} km`},{label:'最近維修',value:vehicleDetail.lastDate||'-'}].map((k,i)=>(
                  <div key={i} style={{...card,textAlign:'center',padding:'10px 8px'}}><div style={{fontSize:10,color:'#999'}}>{k.label}</div><div style={{fontSize:16,fontWeight:700,color:'#1B2A4A',marginTop:3}}>{k.value}</div></div>
                ))}
              </div>
              <div style={isMobile?{}:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div style={card}><div style={{fontSize:12,color:'#999',fontWeight:600,marginBottom:8}}>● 成本結構</div><div style={{position:'relative',height:180}}><canvas ref={detailPieRef}/></div></div>
                <div style={card}>
                  <div style={{fontSize:12,color:'#999',fontWeight:600,marginBottom:8}}>● 維修時間軸</div>
                  {vehicleDetail.transactions.map((t,i) => (
                    <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid #f0f0f0'}}>
                      <div style={{fontSize:11,color:'#999',minWidth:72}}>{t.date}</div>
                      <div style={{flex:1}}><div style={{fontSize:12}}><Tag code={t.catCode}/> {t.desc||t.subCat}</div><div style={{fontSize:13,fontWeight:600,color:'#1B2A4A',marginTop:2}}>${(t.amountExTax||0).toLocaleString()}</div></div>
                    </div>
                  ))}
                  {!vehicleDetail.transactions.length && <div style={{textAlign:'center',padding:20,color:'#999',fontSize:12}}>尚無維修紀錄</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ REPORT ═══ */}
        {tab === 'report' && (
          <div style={{padding:14}}>
            {/* Mode selector */}
            <div style={{display:'flex',gap:4,marginBottom:12,flexWrap:'wrap'}}>
              {[{id:'monthly',label:'月度'},{id:'quarterly',label:'季度'},{id:'yearly',label:'年度'},{id:'custom',label:'自訂區間'},{id:'compare',label:'年度對比'}].map(m=>(
                <button key={m.id} onClick={()=>setReportMode(m.id)} style={{padding:'5px 12px',borderRadius:16,border:`1px solid ${reportMode===m.id?AX:'#e2e8f0'}`,background:reportMode===m.id?AX:'#fff',color:reportMode===m.id?'#fff':'#666',fontSize:11,cursor:'pointer'}}>{m.label}</button>
              ))}
            </div>
            {/* Period selectors */}
            <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
              {reportMode==='monthly' && <input type="month" value={reportMonth} onChange={e=>setReportMonth(e.target.value)} style={{padding:'6px 10px',border:'1px solid #e2e8f0',borderRadius:6,fontSize:13}} />}
              {reportMode==='quarterly' && (<>
                <input type="number" value={reportQuarter.year} onChange={e=>setReportQuarter(p=>({...p,year:+e.target.value}))} style={{width:80,padding:'6px 10px',border:'1px solid #e2e8f0',borderRadius:6,fontSize:13}} />
                {[1,2,3,4].map(q=><button key={q} onClick={()=>setReportQuarter(p=>({...p,q}))} style={{padding:'5px 10px',borderRadius:16,border:`1px solid ${reportQuarter.q===q?AX:'#e2e8f0'}`,background:reportQuarter.q===q?AX:'#fff',color:reportQuarter.q===q?'#fff':'#666',fontSize:11,cursor:'pointer'}}>Q{q}</button>)}
              </>)}
              {(reportMode==='yearly'||reportMode==='compare') && <input type="number" value={reportYear} onChange={e=>setReportYear(+e.target.value)} style={{width:80,padding:'6px 10px',border:'1px solid #e2e8f0',borderRadius:6,fontSize:13}} />}
              {reportMode==='custom' && (<>
                <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} style={{padding:'6px 10px',border:'1px solid #e2e8f0',borderRadius:6,fontSize:12}} />
                <span style={{color:'#999'}}>~</span>
                <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} style={{padding:'6px 10px',border:'1px solid #e2e8f0',borderRadius:6,fontSize:12}} />
              </>)}
              <div style={{marginLeft:'auto',display:'flex',gap:6}}>
                <button onClick={exportCSV} style={btnOutline}>📥 CSV</button>
                <button onClick={exportPDF} disabled={pdfLoading} style={{...btnPrimary,opacity:pdfLoading?0.6:1}}>{pdfLoading?'產出中...':'📄 PDF+AI'}</button>
              </div>
            </div>
            {/* Title */}
            <div style={{fontSize:14,fontWeight:600,color:'#1B2A4A',marginBottom:8}}>{reportData.label} {reportMode==='compare'?'車輛對比表':'結算總表'} ({reportData.rows.length} 輛)</div>

            {/* Table */}
            <div style={{overflowX:'auto'}}>
              {reportMode === 'compare' ? (
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:isMobile?10:12,minWidth:800}}>
                  <thead><tr style={{background:'#0f172a',color:'#fff'}}>
                    <th style={{padding:'6px 8px',textAlign:'left',position:'sticky',left:0,background:'#0f172a',zIndex:1}}>車號</th>
                    <th>車型</th>
                    {[...Array(12)].map((_,i)=><th key={i} style={{textAlign:'right'}}>{i+1}月</th>)}
                    <th style={{textAlign:'right'}}>合計</th><th style={{textAlign:'right'}}>月均</th>
                  </tr></thead>
                  <tbody>{reportData.rows.map((r,i) => (
                    <tr key={i} style={{borderBottom:'1px solid #f0f0f0'}}>
                      <td style={{padding:'5px 8px',fontWeight:600,position:'sticky',left:0,background:'#fff',zIndex:1}}>{r.vehicleId}</td>
                      <td style={{fontSize:10,color:'#999'}}>{r.type}</td>
                      {r.months.map((m,j)=><td key={j} style={{textAlign:'right',color:m>((reportData.fleetAvg||0)/12*2)?'#e74c3c':'#333',fontWeight:m>((reportData.fleetAvg||0)/12*2)?700:400}}>{m?'$'+m.toLocaleString():'-'}</td>)}
                      <td style={{textAlign:'right',fontWeight:700,color:r.total>(reportData.fleetAvg||0)*2?'#e74c3c':'#1B2A4A'}}>${r.total.toLocaleString()}</td>
                      <td style={{textAlign:'right',color:'#999'}}>${r.avg.toLocaleString()}</td>
                    </tr>
                  ))}</tbody>
                </table>
              ) : (
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:isMobile?11:13}}>
                  <thead><tr style={{background:'#0f172a',color:'#fff'}}>
                    <th style={{padding:'8px 10px',textAlign:'left'}}>車號</th><th>車型</th><th>噸位</th><th style={{textAlign:'right'}}>未稅</th><th style={{textAlign:'right'}}>稅額</th><th style={{textAlign:'right'}}>含稅</th><th style={{textAlign:'center'}}>筆數</th><th style={{textAlign:'right'}}>最高單筆</th>
                  </tr></thead>
                  <tbody>
                    {reportData.rows.map((r,i) => (
                      <tr key={i} style={{borderBottom:'1px solid #f0f0f0'}}>
                        <td style={{padding:'6px 10px',fontWeight:600}}>{r.vehicleId}</td><td style={{fontSize:11,color:'#999'}}>{r.type}</td><td style={{textAlign:'center'}}>{r.ton}t</td>
                        <td style={{textAlign:'right'}}>${r.exTax.toLocaleString()}</td><td style={{textAlign:'right',color:'#999'}}>${r.tax.toLocaleString()}</td><td style={{textAlign:'right',fontWeight:600}}>${r.incTax.toLocaleString()}</td>
                        <td style={{textAlign:'center'}}>{r.count}</td><td style={{textAlign:'right'}}>${(r.maxSingle||0).toLocaleString()}</td>
                      </tr>
                    ))}
                    {reportData.total && (
                      <tr style={{background:'#f8fafc',fontWeight:700,borderTop:'2px solid #e2e8f0'}}>
                        <td style={{padding:'8px 10px'}} colSpan={3}>合計</td>
                        <td style={{textAlign:'right'}}>${reportData.total.exTax?.toLocaleString()}</td><td style={{textAlign:'right'}}>${reportData.total.tax?.toLocaleString()}</td><td style={{textAlign:'right'}}>${reportData.total.incTax?.toLocaleString()}</td>
                        <td style={{textAlign:'center'}}>{reportData.total.count}</td><td></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            {!reportData.rows.length && <div style={{textAlign:'center',padding:30,color:'#999'}}>此期間沒有交易資料</div>}
          </div>
        )}

        {/* ═══ CHAT ═══ */}
        {tab === 'chat' && (
          <div style={{display:'flex',flexDirection:'column',height:`calc(${windowHeight}px - 110px)`}}>
            <input type="file" ref={fileInputRef} accept="image/*,application/pdf" capture="environment" onChange={handleFileUpload} style={{display:'none'}} />
            <div style={{display:'flex',gap:5,padding:'8px 14px',flexWrap:'wrap'}}>
              {[{label:'📎 上傳單據',action:'upload'},{label:'本月結算',action:'monthly'},{label:'查車輛履歷',action:'history'},{label:'異常警示',action:'anomaly'}].map(b=>(
                <button key={b.action} onClick={()=>quickAction(b.action)} style={{padding:'5px 10px',borderRadius:16,border:`1px solid ${b.action==='upload'?'#27AE60':AX}`,background:b.action==='upload'?'#27AE60':'#fff',color:b.action==='upload'?'#fff':AX,fontSize:11,cursor:'pointer'}}>{b.label}</button>
              ))}
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'8px 14px'}}>
              {chatMessages.map((m,i) => (
                <div key={i} style={{marginBottom:10,display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                  <div style={{maxWidth:'85%',padding:'9px 13px',borderRadius:12,fontSize:13,lineHeight:1.5,...(m.role==='user'?{background:'#0f172a',color:'#fff',borderBottomRightRadius:3}:{background:'#fff',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',borderBottomLeftRadius:3})}} dangerouslySetInnerHTML={{__html:m.html}} />
                </div>
              ))}
              {chatLoading && <div style={{display:'flex',justifyContent:'flex-start',marginBottom:10}}><div style={{padding:'9px 13px',background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',fontSize:13,color:'#999'}}>🤖 思考中...</div></div>}
              <div ref={chatEndRef}/>
            </div>
            <div style={{display:'flex',gap:6,padding:'8px 14px',borderTop:'1px solid #e2e8f0'}}>
              <input type="text" placeholder="輸入車號或問題..." value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!chatLoading)sendChat();}} style={{flex:1,padding:'9px 12px',border:'1px solid #e2e8f0',borderRadius:20,fontSize:13,outline:'none'}} />
              <button onClick={sendChat} disabled={chatLoading} style={{padding:'9px 14px',borderRadius:20,border:'none',background:'#0f172a',color:'#fff',cursor:'pointer',fontSize:13,opacity:chatLoading?0.6:1}}>發送</button>
            </div>
          </div>
        )}

        {/* ═══ CATEGORIES ═══ */}
        {tab === 'categories' && (
          <div style={{padding:14}}>
            {catGroups.map((g,i) => (
              <div key={i} style={{marginBottom:6}}>
                <div onClick={()=>setOpenAccordion(openAccordion===i?null:i)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'#fff',borderRadius:6,boxShadow:'0 1px 4px rgba(0,0,0,0.04)',cursor:'pointer',fontWeight:600,fontSize:13}}>
                  <span><Tag code={g.majorCode}/> {g.majorName}（{g.items.length}）</span>
                  <span style={{transform:openAccordion===i?'rotate(90deg)':'none',transition:'transform .2s'}}>▸</span>
                </div>
                {openAccordion===i && (
                  <div style={{background:'#fff',borderRadius:'0 0 6px 6px',marginTop:-2}}>
                    {g.items.map((item,j) => (
                      <div key={j} style={{display:'flex',justifyContent:'space-between',padding:'6px 14px',borderBottom:'1px solid #f8f8f8',fontSize:12,gap:8}}>
                        <span style={{fontWeight:600,color:'#4472C4',minWidth:36}}>{item.code}</span>
                        <span style={{flex:1}}>{item.sub}</span>
                        <span style={{fontSize:10,color:'#999',maxWidth:isMobile?80:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.ref||item.kw||''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ═══ SETTINGS ═══ */}
        {tab === 'settings' && (
          <div style={{padding:14}}>
            <div style={{fontSize:14,fontWeight:600,color:'#1B2A4A',marginBottom:8}}>廠商管理</div>
            {VENDORS_MASTER.map((v,i) => (
              <div key={i} style={{...card,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px'}}>
                <span style={{fontSize:13}}>{v.name} <span style={{fontSize:10,color:'#999'}}>({v.taxType==='exclusive'?'未稅':v.taxType==='inclusive'?'含稅':'依單據'})</span></span>
                {v.brand && <span style={{fontSize:10,color:'#999'}}>{v.brand}</span>}
              </div>
            ))}

            <div style={{fontSize:14,fontWeight:600,color:'#1B2A4A',marginBottom:8,marginTop:16}}>車輛主檔（📷 點擊上傳行照）</div>
            <input type="file" ref={licenseFileRef} accept="image/*" capture="environment" onChange={handleLicenseUpload} style={{display:'none'}} />
            {VEHICLES_MASTER.slice(0, isMobile ? 10 : 44).map((v,i) => {
              const fs = fsVehicles[v.id];
              return (
                <div key={i} style={{...card,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px'}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>{v.id} <span style={{fontSize:10,color:'#999'}}>{v.type} {v.ton}t</span></div>
                    {fs && <div style={{fontSize:10,color:'#27AE60'}}>✅ 行照已上傳 ({fs.brandModel||''})</div>}
                  </div>
                  <button onClick={()=>{setLicenseUploadVehicle(v.id);licenseFileRef.current?.click();}} style={{padding:'4px 10px',border:'1px solid #e2e8f0',background:'#fff',borderRadius:6,fontSize:11,cursor:'pointer'}}>📷 行照</button>
                </div>
              );
            })}
            {isMobile && VEHICLES_MASTER.length > 10 && <div style={{textAlign:'center',padding:10,color:'#999',fontSize:11}}>顯示前 10 輛，請在電腦版查看全部</div>}

            {/* License result modal */}
            {licenseResult && (
              <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
                <div style={{background:'#fff',borderRadius:12,padding:20,maxWidth:400,width:'100%',maxHeight:'80vh',overflowY:'auto'}}>
                  <div style={{fontSize:16,fontWeight:700,marginBottom:12}}>📷 行照辨識結果</div>
                  {Object.entries(licenseResult).map(([k,v]) => v && (
                    <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid #f0f0f0',fontSize:12}}>
                      <span style={{color:'#999'}}>{k}</span><span style={{fontWeight:600}}>{String(v)}</span>
                    </div>
                  ))}
                  <div style={{display:'flex',gap:8,marginTop:16}}>
                    <button onClick={saveLicenseData} style={btnPrimary}>✅ 確認儲存</button>
                    <button onClick={()=>{setLicenseResult(null);setLicenseUploadVehicle(null);}} style={btnOutline}>取消</button>
                  </div>
                </div>
              </div>
            )}

            <div style={{fontSize:14,fontWeight:600,color:'#1B2A4A',marginBottom:8,marginTop:16}}>資料庫</div>
            <div style={{...card,padding:'10px 14px',fontSize:12,color:'#999'}}>
              Firestore: {COL_TX} ({allTx.length} 筆) + {COL_VEH} ({Object.keys(fsVehicles).length} 輛)<br/>
              Project: jc-logi-map | Gemini: gemini-2.0-flash
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav — 6 tabs */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#fff',borderTop:'1px solid #e2e8f0',display:'flex',zIndex:10,paddingBottom:'env(safe-area-inset-bottom,0px)'}}>
        {[
          {id:'dashboard',icon:'📊',label:'儀表板'},
          {id:'vehicles',icon:'🚛',label:'車輛'},
          {id:'report',icon:'📑',label:'總表'},
          {id:'chat',icon:'💬',label:'AI 對話'},
          {id:'categories',icon:'📋',label:'分類表'},
          {id:'settings',icon:'⚙️',label:'更多'},
        ].map(t => (
          <button key={t.id} onClick={()=>{setTab(t.id);if(t.id==='vehicles')setSelectedVehicle(null);}} style={tabSt(tab===t.id)}>
            <span style={{fontSize:18,marginBottom:1}}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
