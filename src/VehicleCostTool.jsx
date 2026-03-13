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

// ── 主題系統（Light / Dark）──
const THEMES = {
  light: {
    bg:'#f5f7fa', cardBg:'#fff', text:'#1B2A4A', textLight:'#999', textMuted:'#666',
    border:'#e2e8f0', borderLight:'#f0f0f0', navBg:'#0f172a', navText:'rgba(255,255,255,0.7)',
    inputBg:'#fff', inputBorder:'#e2e8f0', hoverBg:'#f8fafc', shadow:'0 1px 6px rgba(0,0,0,0.06)',
    shadowLg:'0 4px 16px rgba(0,0,0,0.1)', tableHeaderBg:'#0f172a', tableHeaderColor:'#fff',
    tableStripeBg:'#f8fafc', chatUserBg:'#0f172a', chatAiBg:'#fff', chatAiShadow:'0 1px 4px rgba(0,0,0,0.06)',
    kpiAlert:'#e74c3c', success:'#27AE60', warning:'#F39C12',
  },
  dark: {
    bg:'#0f172a', cardBg:'#1e293b', text:'#e2e8f0', textLight:'#94a3b8', textMuted:'#64748b',
    border:'#334155', borderLight:'#1e293b', navBg:'#020617', navText:'rgba(255,255,255,0.7)',
    inputBg:'#1e293b', inputBorder:'#334155', hoverBg:'#334155', shadow:'0 1px 6px rgba(0,0,0,0.3)',
    shadowLg:'0 4px 16px rgba(0,0,0,0.4)', tableHeaderBg:'#020617', tableHeaderColor:'#e2e8f0',
    tableStripeBg:'#0f172a', chatUserBg:'#334155', chatAiBg:'#1e293b', chatAiShadow:'0 1px 4px rgba(0,0,0,0.2)',
    kpiAlert:'#f87171', success:'#34d399', warning:'#fbbf24',
  },
};

// ── 導覽項目 ──
const NAV_ITEMS = [
  {id:'dashboard',icon:'📊',label:'儀表板'},
  {id:'vehicles',icon:'🚛',label:'車輛'},
  {id:'manual',icon:'✏️',label:'記帳'},
  {id:'report',icon:'📑',label:'總表'},
  {id:'chat',icon:'💬',label:'AI 對話'},
  {id:'categories',icon:'📋',label:'分類表'},
  {id:'settings',icon:'⚙️',label:'更多'},
];

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

  // ── 主題 ──
  const [theme, setTheme] = useState(() => localStorage.getItem('vc-theme') || 'light');
  const T = useMemo(() => THEMES[theme] || THEMES.light, [theme]);
  const toggleTheme = useCallback(() => {
    setTheme(prev => { const next = prev === 'light' ? 'dark' : 'light'; localStorage.setItem('vc-theme', next); return next; });
  }, []);
  const isDark = theme === 'dark';
  const [sideHover, setSideHover] = useState(null);

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

  // Manual Entry
  const [manualVehicle, setManualVehicle] = useState('');
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().substring(0,10));
  const [manualVendor, setManualVendor] = useState('');
  const [manualMileage, setManualMileage] = useState('');
  const [manualItems, setManualItems] = useState([{catCode:'',desc:'',qty:1,unitPrice:''}]);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);

  // Vehicle CRUD
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({id:'',type:'NLR',ton:3.5,src:'自購',old:''});
  const [editForm, setEditForm] = useState({type:'',ton:'',src:'',old:''});

  // OCR pending confirmation
  const [ocrPending, setOcrPending] = useState(null);

  // Sort
  const [vehicleSortKey, setVehicleSortKey] = useState('id');
  const [vehicleSortDir, setVehicleSortDir] = useState('asc');

  // Charts
  const pieRef = useRef(null); const barRef = useRef(null); const detailPieRef = useRef(null);
  const rankRef = useRef(null); const vendorPieRef = useRef(null);
  const pieChart = useRef(null); const barChart = useRef(null); const detailPieChart = useRef(null);
  const rankChart = useRef(null); const vendorPieChart = useRef(null);
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
  const chartTextColor = isDark ? '#94a3b8' : '#666';
  const chartGridColor = isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.05)';
  useEffect(() => {
    if (!chartLoaded.current || !window.Chart || tab !== 'dashboard' || !costStructure.length) return;
    const legendOpts = {position:'right',labels:{font:{size:isMobile?10:11},padding:8,color:chartTextColor}};
    const timer = setTimeout(() => {
      // 成本結構
      if (pieRef.current) {
        if (pieChart.current) pieChart.current.destroy();
        pieChart.current = new window.Chart(pieRef.current, { type:'doughnut', data:{ labels:costStructure.map(s=>s.label), datasets:[{data:costStructure.map(s=>s.value),backgroundColor:costStructure.map(s=>CAT_COLORS[s.label]||'#CCC'),borderWidth:0}]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:legendOpts},cutout:'55%'}});
      }
      // 月度趨勢
      if (barRef.current && monthlyTrend.length) {
        if (barChart.current) barChart.current.destroy();
        const months=[...new Set(monthlyTrend.map(t=>t.month))].sort().slice(-6);
        const cats=[...new Set(monthlyTrend.map(t=>t.majorCat))];
        barChart.current = new window.Chart(barRef.current, { type:'bar', data:{ labels:months.map(m=>m.substring(5)+'月'), datasets:cats.map(c=>({label:c,data:months.map(m=>{const r=monthlyTrend.find(t=>t.month===m&&t.majorCat===c);return r?r.total:0;}),backgroundColor:CAT_COLORS[c]||'#CCC'}))}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:9},padding:4,color:chartTextColor}}},scales:{x:{stacked:true,ticks:{font:{size:10},color:chartTextColor},grid:{display:false}},y:{stacked:true,ticks:{font:{size:9},color:chartTextColor,callback:v=>'$'+Math.round(v/1000)+'K'},grid:{color:chartGridColor}}}}});
      }
      // 車輛成本排名 Top 10
      if (rankRef.current && allTx.length) {
        if (rankChart.current) rankChart.current.destroy();
        const yr = String(new Date().getFullYear());
        const vCosts = {}; allTx.filter(t=>t.date?.startsWith(yr)).forEach(t=>{vCosts[t.vehicleId]=(vCosts[t.vehicleId]||0)+(t.amountExTax||0);});
        const top10 = Object.entries(vCosts).sort((a,b)=>b[1]-a[1]).slice(0,10);
        rankChart.current = new window.Chart(rankRef.current, { type:'bar', data:{ labels:top10.map(([v])=>v), datasets:[{data:top10.map(([,c])=>c),backgroundColor:AX+'CC',borderRadius:4}]}, options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{font:{size:9},color:chartTextColor,callback:v=>'$'+Math.round(v/1000)+'K'},grid:{color:chartGridColor}},y:{ticks:{font:{size:10},color:chartTextColor},grid:{display:false}}}}});
      }
      // 廠商支出分佈
      if (vendorPieRef.current && allTx.length) {
        if (vendorPieChart.current) vendorPieChart.current.destroy();
        const yr = String(new Date().getFullYear());
        const vCosts = {}; allTx.filter(t=>t.date?.startsWith(yr)).forEach(t=>{vCosts[t.vendor||'未知']=(vCosts[t.vendor||'未知']||0)+(t.amountExTax||0);});
        const entries = Object.entries(vCosts).sort((a,b)=>b[1]-a[1]);
        const vendorColors = ['#3B82F6','#EF4444','#10B981','#F59E0B','#8B5CF6','#EC4899','#6B7280'];
        vendorPieChart.current = new window.Chart(vendorPieRef.current, { type:'doughnut', data:{ labels:entries.map(([v])=>v), datasets:[{data:entries.map(([,c])=>c),backgroundColor:vendorColors.slice(0,entries.length),borderWidth:0}]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:legendOpts},cutout:'50%'}});
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [tab, costStructure, monthlyTrend, allTx, theme, isMobile]);

  // ── All vehicles (master + Firestore additions) ──
  const allVehicles = useMemo(() => {
    const merged = [...VEHICLES_MASTER];
    // Add Firestore-only vehicles (not in master)
    Object.entries(fsVehicles).forEach(([plate, data]) => {
      if (data.deleted) return;
      if (!merged.find(v => v.id === plate)) {
        merged.push({ id: plate, type: data.brandModel || data.vehicleType || '未知', ton: data.totalWeight ? (data.totalWeight/1000) : (data.ton || 0), old: data.oldPlate || null, src: data.purchaseSource || '自購', fsData: data });
      }
    });
    // Filter out deleted vehicles
    return merged.filter(v => !fsVehicles[v.id]?.deleted);
  }, [fsVehicles]);

  // ── Vehicles computed ──
  const filteredVehicles = useMemo(() => {
    const yr = String(new Date().getFullYear());
    let list = allVehicles.filter(v => {
      if (vehicleType !== '全部' && v.type !== vehicleType) return false;
      if (vehicleSearch && !v.id.toLowerCase().includes(vehicleSearch.toLowerCase()) && !(v.old||'').toLowerCase().includes(vehicleSearch.toLowerCase())) return false;
      return true;
    }).map(v => {
      const vTx = allTx.filter(t=>t.vehicleId===v.id && t.date?.startsWith(yr));
      return { ...v, ytdCost:vTx.reduce((s,t)=>s+(t.amountExTax||0),0), txCount:vTx.length, lastDate:vTx[0]?.date||null };
    });
    // Sort
    list.sort((a,b) => {
      let cmp = 0;
      if (vehicleSortKey === 'id') cmp = a.id.localeCompare(b.id);
      else if (vehicleSortKey === 'type') cmp = (a.type||'').localeCompare(b.type||'');
      else if (vehicleSortKey === 'ytdCost') cmp = (a.ytdCost||0) - (b.ytdCost||0);
      else if (vehicleSortKey === 'txCount') cmp = (a.txCount||0) - (b.txCount||0);
      return vehicleSortDir === 'desc' ? -cmp : cmp;
    });
    return list;
  }, [allTx, vehicleSearch, vehicleType, allVehicles, vehicleSortKey, vehicleSortDir]);

  const toggleVehicleSort = (key) => {
    if (vehicleSortKey === key) setVehicleSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setVehicleSortKey(key); setVehicleSortDir(key === 'ytdCost' ? 'desc' : 'asc'); }
  };
  const sortArrow = (key) => vehicleSortKey === key ? (vehicleSortDir === 'asc' ? ' ▲' : ' ▼') : '';

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
      detailPieChart.current = new window.Chart(detailPieRef.current, { type:'doughnut', data:{labels:vehicleDetail.costStructure.map(s=>s.label),datasets:[{data:vehicleDetail.costStructure.map(s=>s.value),backgroundColor:vehicleDetail.costStructure.map(s=>CAT_COLORS[s.label]||'#CCC'),borderWidth:0}]}, options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{size:isMobile?9:11},color:chartTextColor}}},cutout:'50%'}});
    }, 300);
    return () => clearTimeout(timer);
  }, [vehicleDetail, theme, isMobile]);

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

  // ═══ FLEET CONTEXT BUILDER ═══
  const buildFleetContext = useCallback(() => {
    const yr = String(new Date().getFullYear());
    const mo = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
    const yTx = allTx.filter(t => t.date?.startsWith(yr));
    const mTx = allTx.filter(t => t.date?.startsWith(mo));

    // Per-vehicle summary
    const vehicles = allVehicles.map(v => {
      const vTx = yTx.filter(t => t.vehicleId === v.id);
      if (!vTx.length) return { id: v.id, type: v.type, ton: v.ton, src: v.src, ytdCost: 0, txCount: 0 };
      const catBreakdown = {};
      vTx.forEach(t => { catBreakdown[t.catCode || t.majorCat] = (catBreakdown[t.catCode || t.majorCat] || 0) + (t.amountExTax || 0); });
      return {
        id: v.id, type: v.type, ton: v.ton, src: v.src,
        ytdCost: vTx.reduce((s, t) => s + (t.amountExTax || 0), 0),
        monthCost: mTx.filter(t => t.vehicleId === v.id).reduce((s, t) => s + (t.amountExTax || 0), 0),
        txCount: vTx.length,
        lastDate: vTx.sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0]?.date || null,
        catBreakdown
      };
    });

    // Category totals
    const catTotals = {};
    yTx.forEach(t => { const k = t.majorCat || '未分類'; catTotals[k] = (catTotals[k] || 0) + (t.amountExTax || 0); });

    // Vendor totals
    const vendorTotals = {};
    yTx.forEach(t => { const k = t.vendor || '未知'; vendorTotals[k] = (vendorTotals[k] || 0) + (t.amountExTax || 0); });

    // All transactions (full detail for querying)
    const transactions = yTx.map(t => ({
      date: t.date, vehicleId: t.vehicleId, vendor: t.vendor,
      catCode: t.catCode, majorCat: t.majorCat, subCat: t.subCat,
      desc: t.desc, qty: t.qty, unitPrice: t.unitPrice,
      amountExTax: t.amountExTax, mileage: t.mileage, source: t.source
    }));

    return {
      queryDate: new Date().toISOString().substring(0, 10),
      year: yr, currentMonth: mo,
      fleetSize: allVehicles.length,
      activeVehicles: vehicles.filter(v => v.txCount > 0).length,
      ytdTotalCost: yTx.reduce((s, t) => s + (t.amountExTax || 0), 0),
      monthTotalCost: mTx.reduce((s, t) => s + (t.amountExTax || 0), 0),
      ytdTxCount: yTx.length,
      avgCostPerVehicle: vehicles.filter(v => v.txCount > 0).length ? Math.round(yTx.reduce((s, t) => s + (t.amountExTax || 0), 0) / vehicles.filter(v => v.txCount > 0).length) : 0,
      vehicles, catTotals, vendorTotals, transactions,
      categories: CATEGORIES_MASTER.map(c => ({ code: c.code, majorName: c.majorName, sub: c.sub, ref: c.ref })),
      vendors: VENDORS_MASTER.map(v => ({ name: v.name, taxType: v.taxType }))
    };
  }, [allTx, allVehicles]);

  // ═══ CONVERSATION HISTORY BUILDER ═══
  const buildConversationHistory = useCallback(() => {
    const stripHtml = (html) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };
    // Skip welcome message (index 0), keep last 20 messages (10 turns)
    return chatMessages
      .slice(1)
      .slice(-20)
      .map(m => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: stripHtml(m.html) }]
      }));
  }, [chatMessages]);

  // ═══ CHAT + OCR ═══
  const sanitizeHtml = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    div.querySelectorAll('script,iframe,object,embed,form,link,meta').forEach(el=>el.remove());
    div.querySelectorAll('*').forEach(el=>{
      for (const attr of [...el.attributes]) {
        if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
      }
    });
    return div.innerHTML;
  };
  const addMsg = (role, html) => setChatMessages(prev => [...prev, { role, html: sanitizeHtml(html) }]);

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
        setOcrPending(r);
        addMsg('ai', h);
      } else {
        addMsg('ai', `⚠️ OCR 辨識結果無法解析為結構化資料。<br/><br/>原始回覆：<br/>${data.raw || '無回覆'}`);
      }
    } catch (err) { addMsg('ai', `❌ OCR 處理失敗：${err.message}`); }
    setChatLoading(false);
  };

  // ── Send Chat (Unified Flow) ──
  const sendChat = async () => {
    const text = chatInput.trim(); if (!text) return;
    setChatInput(''); addMsg('user', text); setChatLoading(true);

    try {
      const data = await callGemini('chat', {
        prompt: text,
        fleetContext: buildFleetContext(),
        conversationHistory: buildConversationHistory()
      });
      addMsg('ai', (data.result || '抱歉，暫時無法回覆。').replace(/\n/g, '<br/>'));
    } catch (err) { addMsg('ai', `❌ 處理失敗：${err.message}`); }
    setChatLoading(false);
  };

  const quickAction = (a) => {
    if (a==='monthly') { setChatInput('請給我本月的費用結算報表與分析'); setTimeout(sendChat,100); }
    else if (a==='anomaly') { setChatInput('有沒有異常高費用的車輛？請分析原因'); setTimeout(sendChat,100); }
    else if (a==='history') addMsg('ai','請輸入要查詢的車號，例如：BUB-0572、BZH-8131、CAF-5712');
    else if (a==='upload') fileInputRef.current?.click();
  };

  // ── OCR Confirm / Cancel ──
  const ocrConfirm = async () => {
    if (!ocrPending) return;
    const r = ocrPending;
    setOcrPending(null);
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
      loadAll();
    } catch (err) { addMsg('ai', `❌ 入帳失敗：${err.message}`); }
  };
  const ocrCancel = () => { setOcrPending(null); addMsg('ai', '已取消入帳。'); };

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
      else alert('行照辨識失敗：' + (data.error || data.raw || JSON.stringify(data)));
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
    } catch (err) {
      alert('儲存失敗：' + err.message);
      setLicenseResult(null); setLicenseUploadVehicle(null);
    }
  };

  // ═══ COMPONENTS ═══
  const Tag = ({ code }) => { const l=code[0]; const c=TAG_C[l]||{bg:'#EEE',fg:'#333'}; return <span style={{display:'inline-block',padding:'1px 6px',borderRadius:3,fontSize:10,fontWeight:600,background:c.bg,color:c.fg,marginRight:4}}>{code}</span>; };

  // Categories grouped
  const catGroups = useMemo(() => {
    const g = {};
    CATEGORIES_MASTER.forEach(c => { if (!g[c.majorName]) g[c.majorName]={majorCode:c.major,majorName:c.majorName,items:[]}; g[c.majorName].items.push(c); });
    return Object.values(g);
  }, []);

  // ── Styles (theme-aware) ──
  const SIDEBAR_W = 220;
  const hdr = { background:T.navBg,color:'#fff',padding:isMobile?'14px 16px':'16px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10 };
  const card = { background:T.cardBg,borderRadius:12,boxShadow:T.shadow,padding:isMobile?14:20,marginBottom:isMobile?12:16,transition:'box-shadow 0.2s,transform 0.2s' };
  const cardHover = { boxShadow:T.shadowLg,transform:'translateY(-2px)' };
  const tabSt = (a) => ({ flex:1,display:'flex',flexDirection:'column',alignItems:'center',padding:'7px 0',cursor:'pointer',color:a?AX:T.textLight,fontSize:10,transition:'color 0.2s',background:'none',border:'none' });
  const btnPrimary = { padding:isMobile?'6px 14px':'8px 18px',background:AX,color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:isMobile?12:13,fontWeight:600,transition:'opacity 0.2s' };
  const btnOutline = { padding:isMobile?'6px 14px':'8px 18px',background:'none',border:`1px solid ${AX}`,color:AX,borderRadius:8,cursor:'pointer',fontSize:isMobile?12:13,transition:'all 0.2s' };
  const btnDanger = { padding:isMobile?'6px 14px':'8px 18px',background:'#e74c3c',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:isMobile?12:13,fontWeight:600,transition:'opacity 0.2s' };
  const inputSt = { width:'100%',padding:'9px 12px',border:`1px solid ${T.inputBorder}`,borderRadius:8,fontSize:13,outline:'none',background:T.inputBg,color:T.text,boxSizing:'border-box' };
  const selectSt = { ...inputSt,appearance:'auto' };
  const labelSt = { fontSize:12,color:T.textLight,fontWeight:600,marginBottom:4,display:'block' };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight:windowHeight+'px',display:'flex',background:T.bg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft JhengHei',sans-serif",color:T.text }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>

      {/* ═══ SIDEBAR (Desktop) ═══ */}
      {!isMobile && (
        <div style={{position:'fixed',left:0,top:0,bottom:0,width:SIDEBAR_W,background:T.navBg,zIndex:20,display:'flex',flexDirection:'column',borderRight:`1px solid ${isDark?'#1e293b':'transparent'}`}}>
          {/* Logo */}
          <div style={{padding:'20px 16px 12px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
            <div style={{fontSize:15,fontWeight:700,color:'#fff'}}>車輛成本中心</div>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.35)',marginTop:3}}>Vehicle Cost Center v2</div>
          </div>
          {/* Nav Items */}
          <div style={{flex:1,padding:'8px 0',overflowY:'auto'}}>
            {NAV_ITEMS.map(n => {
              const active = tab === n.id;
              const hover = sideHover === n.id;
              return (
                <div key={n.id}
                  onClick={()=>{setTab(n.id);if(n.id==='vehicles')setSelectedVehicle(null);}}
                  onMouseEnter={()=>setSideHover(n.id)} onMouseLeave={()=>setSideHover(null)}
                  style={{display:'flex',alignItems:'center',gap:12,padding:'10px 16px',cursor:'pointer',
                    borderLeft:active?`3px solid ${AX}`:'3px solid transparent',
                    background:active?'rgba(234,179,8,0.1)':hover?'rgba(255,255,255,0.05)':'transparent',
                    color:active?AX:'rgba(255,255,255,0.6)',fontSize:13,fontWeight:active?600:400,
                    transition:'all 0.15s'}}>
                  <span style={{fontSize:18,width:24,textAlign:'center'}}>{n.icon}</span>
                  <span>{n.label}</span>
                </div>
              );
            })}
          </div>
          {/* Dark mode toggle + Home */}
          <div style={{padding:'12px 16px',borderTop:'1px solid rgba(255,255,255,0.08)'}}>
            <div onClick={toggleTheme} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',cursor:'pointer',color:'rgba(255,255,255,0.5)',fontSize:12,transition:'color 0.2s'}}
              onMouseEnter={e=>e.currentTarget.style.color='rgba(255,255,255,0.8)'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.5)'}>
              <span style={{fontSize:16}}>{isDark?'☀️':'🌙'}</span>
              <span>{isDark?'淺色模式':'深色模式'}</span>
            </div>
            <div onClick={onBack} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',cursor:'pointer',color:'rgba(255,255,255,0.4)',fontSize:12,transition:'color 0.2s'}}
              onMouseEnter={e=>e.currentTarget.style.color='rgba(255,255,255,0.7)'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.4)'}>
              <span style={{fontSize:16}}>🏠</span><span>回首頁</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MAIN CONTENT AREA ═══ */}
      <div style={{flex:1,display:'flex',flexDirection:'column',marginLeft:isMobile?0:SIDEBAR_W,minHeight:windowHeight+'px'}}>
        {/* Header (mobile only shows full header, desktop shows compact) */}
        {isMobile && (
          <div style={hdr}>
            <div>
              <div style={{fontSize:16,fontWeight:700}}>車輛成本中心</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.5)',marginTop:2}}>Vehicle Cost Center v2</div>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <button onClick={toggleTheme} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',padding:4}}>{isDark?'☀️':'🌙'}</button>
              <button onClick={onBack} style={{background:'none',border:'1px solid rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.5)',padding:'4px 12px',borderRadius:2,fontSize:10,letterSpacing:2,cursor:'pointer'}}>HOME</button>
            </div>
          </div>
        )}

        <div style={{flex:1,overflowY:'auto',paddingBottom:isMobile?60:0}}>

        {/* ═══ DASHBOARD ═══ */}
        {tab === 'dashboard' && (
          <div style={{padding:isMobile?14:24,animation:'fadeIn 0.3s'}}>
            {error ? (
              <div style={{textAlign:'center',padding:40,color:T.kpiAlert}}>
                <div style={{fontSize:36,marginBottom:12}}>⚠️</div>
                <div style={{fontSize:13}}>{error}</div>
                <button onClick={loadAll} style={{marginTop:12,...btnOutline}}>重試</button>
              </div>
            ) : loading ? (
              <div style={{textAlign:'center',padding:40,color:T.textLight}}>
                <div style={{width:28,height:28,border:`3px solid ${T.border}`,borderTopColor:AX,borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto 10px'}} />載入中...
              </div>
            ) : kpis && (
              <>
                {!isMobile && <div style={{fontSize:18,fontWeight:700,marginBottom:16,color:T.text}}>儀表板總覽</div>}
                <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(3,1fr)':'repeat(6,1fr)',gap:isMobile?8:12,marginBottom:isMobile?12:20}}>
                  {[
                    {label:'本月費用',value:`$${(kpis.mCost||0).toLocaleString()}`},
                    {label:'已處理單據',value:kpis.mTxCount||0,note:'張'},
                    {label:'本年累計',value:`$${(kpis.yCost||0).toLocaleString()}`},
                    {label:'車隊平均',value:`$${(kpis.avg||0).toLocaleString()}`,note:'元/輛'},
                    {label:'異常車輛',value:kpis.anomalyCount||0,note:'輛',alert:kpis.anomalyCount>0},
                    {label:'零費用車輛',value:kpis.zeroCost||0,note:'輛'},
                  ].map((k,i) => (
                    <div key={i} style={{...card,textAlign:'center',padding:isMobile?'10px 8px':'16px 12px'}}
                      onMouseEnter={e=>{if(!isMobile){e.currentTarget.style.boxShadow=T.shadowLg;e.currentTarget.style.transform='translateY(-2px)'}}}
                      onMouseLeave={e=>{if(!isMobile){e.currentTarget.style.boxShadow=T.shadow;e.currentTarget.style.transform='none'}}}>
                      <div style={{fontSize:isMobile?10:11,color:T.textLight}}>{k.label}</div>
                      <div style={{fontSize:isMobile?16:24,fontWeight:700,color:k.alert?T.kpiAlert:T.text,margin:'3px 0'}}>{k.value}</div>
                      {k.note && <div style={{fontSize:isMobile?9:10,color:T.textLight}}>{k.note}</div>}
                    </div>
                  ))}
                </div>
                <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:isMobile?12:16}}>
                  <div style={card}><div style={{fontSize:isMobile?12:13,color:T.textLight,fontWeight:600,marginBottom:10}}>● 成本結構</div><div style={{position:'relative',height:isMobile?200:300}}><canvas ref={pieRef}/></div></div>
                  <div style={card}><div style={{fontSize:isMobile?12:13,color:T.textLight,fontWeight:600,marginBottom:10}}>● 月度趨勢</div><div style={{position:'relative',height:isMobile?200:300}}><canvas ref={barRef}/></div></div>
                </div>
                {/* 新增圖表：車輛成本排名 + 廠商分佈 */}
                <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:isMobile?12:16,marginTop:isMobile?12:16}}>
                  <div style={card}><div style={{fontSize:isMobile?12:13,color:T.textLight,fontWeight:600,marginBottom:10}}>● 車輛成本排名 Top 10</div><div style={{position:'relative',height:isMobile?200:300}}><canvas ref={rankRef}/></div></div>
                  <div style={card}><div style={{fontSize:isMobile?12:13,color:T.textLight,fontWeight:600,marginBottom:10}}>● 廠商支出分佈</div><div style={{position:'relative',height:isMobile?200:300}}><canvas ref={vendorPieRef}/></div></div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══ VEHICLES ═══ */}
        {tab === 'vehicles' && !selectedVehicle && (
          <div style={{padding:isMobile?14:24,animation:'fadeIn 0.3s'}}>
            <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center',flexWrap:'wrap'}}>
              <input type="text" placeholder="搜尋車號..." value={vehicleSearch} onChange={e=>setVehicleSearch(e.target.value)} style={{...inputSt,flex:1,minWidth:150}} />
              <button onClick={()=>{setShowAddVehicle(true);setNewVehicle({id:'',type:'NLR',ton:3.5,src:'自購',old:''});}} style={btnPrimary}>+ 新增車輛</button>
            </div>
            <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:12}}>
              {V_TYPES.map(t => <button key={t} onClick={()=>setVehicleType(t)} style={{padding:'4px 12px',borderRadius:16,border:`1px solid ${t===vehicleType?AX:T.border}`,background:t===vehicleType?AX:T.cardBg,color:t===vehicleType?'#fff':T.textLight,fontSize:11,cursor:'pointer',transition:'all 0.15s'}}>{t}</button>)}
              <span style={{fontSize:11,color:T.textLight,marginLeft:8,alignSelf:'center'}}>{filteredVehicles.length} 輛</span>
            </div>
            {isMobile ? (
              filteredVehicles.map(v => (
                <div key={v.id} onClick={()=>setSelectedVehicle(v.id)} style={{display:'flex',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${T.borderLight}`,cursor:'pointer'}}>
                  <div style={{width:36,height:36,borderRadius:8,background:isDark?'#1e3a5f':'#EBF5FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,marginRight:10}}>🚛</div>
                  <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14,color:T.text}}>{v.id}</div><div style={{fontSize:11,color:T.textLight}}>{v.type} {v.ton}t{v.old?` (原${v.old})`:''}</div></div>
                  <div style={{textAlign:'right'}}><div style={{fontWeight:700,fontSize:14,color:T.text}}>${(v.ytdCost||0).toLocaleString()}</div><div style={{fontSize:10,color:T.textLight}}>{v.lastDate||'尚無紀錄'}</div></div>
                </div>
              ))
            ) : (
              <div style={{...card,padding:0,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead><tr style={{background:T.tableHeaderBg,color:T.tableHeaderColor}}>
                  <th onClick={()=>toggleVehicleSort('id')} style={{padding:'10px 14px',textAlign:'left',cursor:'pointer',userSelect:'none'}}>車號{sortArrow('id')}</th>
                  <th onClick={()=>toggleVehicleSort('type')} style={{textAlign:'left',cursor:'pointer',userSelect:'none'}}>車型{sortArrow('type')}</th>
                  <th style={{textAlign:'center'}}>噸位</th><th style={{textAlign:'left'}}>原車牌</th>
                  <th onClick={()=>toggleVehicleSort('ytdCost')} style={{textAlign:'right',cursor:'pointer',userSelect:'none'}}>年度累計{sortArrow('ytdCost')}</th>
                  <th onClick={()=>toggleVehicleSort('txCount')} style={{textAlign:'center',cursor:'pointer',userSelect:'none'}}>筆數{sortArrow('txCount')}</th>
                  <th style={{textAlign:'left'}}>最近維修</th>
                </tr></thead>
                <tbody>{filteredVehicles.map((v,i) => (
                  <tr key={v.id} onClick={()=>setSelectedVehicle(v.id)} style={{borderBottom:`1px solid ${T.borderLight}`,cursor:'pointer',background:i%2===0?'transparent':T.tableStripeBg,transition:'background 0.15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background=T.hoverBg} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'transparent':T.tableStripeBg}>
                    <td style={{padding:'10px 14px',fontWeight:600,color:T.text}}>{v.id}</td><td style={{color:T.textMuted}}>{v.type}</td><td style={{textAlign:'center',color:T.textMuted}}>{v.ton}t</td><td style={{color:T.textLight}}>{v.old||'-'}</td>
                    <td style={{textAlign:'right',fontWeight:700,color:T.text}}>${(v.ytdCost||0).toLocaleString()}</td><td style={{textAlign:'center',color:T.textMuted}}>{v.txCount}</td><td style={{color:T.textLight}}>{v.lastDate||'-'}</td>
                  </tr>
                ))}</tbody>
              </table>
              </div>
            )}
            {!filteredVehicles.length && <div style={{textAlign:'center',padding:30,color:T.textLight}}>沒有符合條件的車輛</div>}

            {/* Add Vehicle Modal */}
            {showAddVehicle && (
              <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
                <div style={{background:T.cardBg,borderRadius:12,padding:24,maxWidth:420,width:'100%',maxHeight:'80vh',overflowY:'auto'}}>
                  <div style={{fontSize:16,fontWeight:700,marginBottom:16,color:T.text}}>新增車輛</div>
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    <div><label style={labelSt}>車牌號碼 *</label><input value={newVehicle.id} onChange={e=>setNewVehicle(p=>({...p,id:e.target.value.toUpperCase()}))} placeholder="ABC-1234" style={inputSt}/></div>
                    <div><label style={labelSt}>車型 *</label><select value={newVehicle.type} onChange={e=>setNewVehicle(p=>({...p,type:e.target.value}))} style={selectSt}><option>NLR</option><option>堅達</option><option>菱利</option><option>J SPACE</option><option>得利卡</option></select></div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                      <div><label style={labelSt}>噸位</label><input type="number" step="0.1" value={newVehicle.ton} onChange={e=>setNewVehicle(p=>({...p,ton:+e.target.value}))} style={inputSt}/></div>
                      <div><label style={labelSt}>來源</label><select value={newVehicle.src} onChange={e=>setNewVehicle(p=>({...p,src:e.target.value}))} style={selectSt}><option>自購</option><option>租賃</option></select></div>
                    </div>
                    <div><label style={labelSt}>原車牌（選填）</label><input value={newVehicle.old} onChange={e=>setNewVehicle(p=>({...p,old:e.target.value.toUpperCase()}))} placeholder="RAA-0000" style={inputSt}/></div>
                  </div>
                  <div style={{display:'flex',gap:8,marginTop:20}}>
                    <button onClick={async()=>{
                      if(!newVehicle.id||!/^[A-Z]{2,3}-?\d{3,4}$/.test(newVehicle.id)){alert('車牌格式錯誤');return;}
                      const plate=newVehicle.id.includes('-')?newVehicle.id:newVehicle.id.replace(/([A-Z]+)(\d+)/,'$1-$2');
                      try{const fb=await initFirebase();await fb.setDoc(fb.doc(fb.db,COL_VEH,plate),{vehicleType:newVehicle.type,ton:newVehicle.ton,purchaseSource:newVehicle.src,oldPlate:newVehicle.old||null,createdAt:new Date().toISOString()});setShowAddVehicle(false);loadAll();}catch(err){alert('新增失敗：'+err.message);}
                    }} style={btnPrimary}>確認新增</button>
                    <button onClick={()=>setShowAddVehicle(false)} style={btnOutline}>取消</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vehicle Detail */}
        {tab === 'vehicles' && selectedVehicle && vehicleDetail && (
          <div style={{animation:'fadeIn 0.3s'}}>
            <div style={{background:T.navBg,color:'#fff',padding:isMobile?14:20}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div onClick={()=>{setSelectedVehicle(null);setEditingVehicle(false);}} style={{cursor:'pointer',fontSize:13,opacity:0.7,marginBottom:6}}>← 返回</div>
                  <div style={{fontSize:isMobile?20:24,fontWeight:700}}>{vehicleDetail.vehicle.id}</div>
                  <div style={{fontSize:11,opacity:0.6,marginTop:3}}>{vehicleDetail.vehicle.type} {vehicleDetail.vehicle.ton}t | {vehicleDetail.vehicle.src||''}</div>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <button onClick={()=>{if(!editingVehicle){setEditForm({type:vehicleDetail.vehicle.type||'NLR',ton:vehicleDetail.vehicle.ton||3.5,src:vehicleDetail.vehicle.src||'自購',old:vehicleDetail.vehicle.old||''});}setEditingVehicle(!editingVehicle);}} style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',padding:'6px 12px',borderRadius:6,fontSize:11,cursor:'pointer'}}>✏️ 編輯</button>
                  <button onClick={async()=>{
                    if(!confirm(`確定要刪除 ${vehicleDetail.vehicle.id} 嗎？`))return;
                    try{const fb=await initFirebase();await fb.setDoc(fb.doc(fb.db,COL_VEH,vehicleDetail.vehicle.id),{deleted:true,deletedAt:new Date().toISOString()},{merge:true});setSelectedVehicle(null);loadAll();}catch(err){alert('刪除失敗：'+err.message);}
                  }} style={{background:'rgba(239,68,68,0.2)',border:'1px solid rgba(239,68,68,0.3)',color:'#fca5a5',padding:'6px 12px',borderRadius:6,fontSize:11,cursor:'pointer'}}>🗑️ 刪除</button>
                </div>
              </div>
              {/* Edit form */}
              {editingVehicle && (
                <div style={{marginTop:12,padding:12,background:'rgba(255,255,255,0.05)',borderRadius:8}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    <div><label style={{fontSize:10,color:'rgba(255,255,255,0.5)'}}>車型</label><select value={editForm.type} onChange={e=>setEditForm(f=>({...f,type:e.target.value}))} style={{...selectSt,background:'rgba(255,255,255,0.1)',color:'#fff',border:'1px solid rgba(255,255,255,0.2)'}}><option>NLR</option><option>堅達</option><option>菱利</option><option>J SPACE</option><option>得利卡</option></select></div>
                    <div><label style={{fontSize:10,color:'rgba(255,255,255,0.5)'}}>噸位</label><input type="number" step="0.1" value={editForm.ton} onChange={e=>setEditForm(f=>({...f,ton:e.target.value}))} style={{...inputSt,background:'rgba(255,255,255,0.1)',color:'#fff',border:'1px solid rgba(255,255,255,0.2)'}}/></div>
                    <div><label style={{fontSize:10,color:'rgba(255,255,255,0.5)'}}>來源</label><select value={editForm.src} onChange={e=>setEditForm(f=>({...f,src:e.target.value}))} style={{...selectSt,background:'rgba(255,255,255,0.1)',color:'#fff',border:'1px solid rgba(255,255,255,0.2)'}}><option>自購</option><option>租賃</option></select></div>
                    <div><label style={{fontSize:10,color:'rgba(255,255,255,0.5)'}}>原車牌</label><input value={editForm.old} onChange={e=>setEditForm(f=>({...f,old:e.target.value}))} style={{...inputSt,background:'rgba(255,255,255,0.1)',color:'#fff',border:'1px solid rgba(255,255,255,0.2)'}}/></div>
                  </div>
                  <button onClick={async()=>{
                    try{const fb=await initFirebase();await fb.setDoc(fb.doc(fb.db,COL_VEH,vehicleDetail.vehicle.id),{vehicleType:editForm.type,ton:+editForm.ton,purchaseSource:editForm.src,oldPlate:editForm.old||null,updatedAt:new Date().toISOString()},{merge:true});setEditingVehicle(false);loadAll();}catch(err){alert('儲存失敗：'+err.message);}
                  }} style={{marginTop:8,...btnPrimary,fontSize:11}}>💾 儲存變更</button>
                </div>
              )}
            </div>
            <div style={{padding:isMobile?14:24}}>
              <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)',gap:isMobile?8:12,marginBottom:isMobile?12:16}}>
                {[{label:'累計成本',value:`$${(vehicleDetail.totalCost||0).toLocaleString()}`},{label:'交易筆數',value:vehicleDetail.txCount},{label:'最高里程',value:`${(vehicleDetail.maxMileage||0).toLocaleString()} km`},{label:'最近維修',value:vehicleDetail.lastDate||'-'}].map((k,i)=>(
                  <div key={i} style={{...card,textAlign:'center',padding:isMobile?'10px 8px':'16px 12px'}}><div style={{fontSize:isMobile?10:11,color:T.textLight}}>{k.label}</div><div style={{fontSize:isMobile?16:20,fontWeight:700,color:T.text,marginTop:3}}>{k.value}</div></div>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:isMobile?12:16}}>
                <div style={card}><div style={{fontSize:isMobile?12:13,color:T.textLight,fontWeight:600,marginBottom:8}}>● 成本結構</div><div style={{position:'relative',height:isMobile?180:260}}><canvas ref={detailPieRef}/></div></div>
                <div style={card}>
                  <div style={{fontSize:isMobile?12:13,color:T.textLight,fontWeight:600,marginBottom:8}}>● 維修時間軸</div>
                  {vehicleDetail.transactions.map((t,i) => (
                    <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:`1px solid ${T.borderLight}`}}>
                      <div style={{fontSize:11,color:T.textLight,minWidth:72}}>{t.date}</div>
                      <div style={{flex:1}}><div style={{fontSize:12,color:T.text}}><Tag code={t.catCode}/> {t.desc||t.subCat}</div><div style={{fontSize:13,fontWeight:600,color:T.text,marginTop:2}}>${(t.amountExTax||0).toLocaleString()}</div></div>
                    </div>
                  ))}
                  {!vehicleDetail.transactions.length && <div style={{textAlign:'center',padding:20,color:T.textLight,fontSize:12}}>尚無維修紀錄</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ MANUAL ENTRY ═══ */}
        {tab === 'manual' && (
          <div style={{padding:isMobile?14:24,animation:'fadeIn 0.3s'}}>
            <div style={{...card,maxWidth:600,margin:isMobile?'0':'0 auto'}}>
              <div style={{fontSize:16,fontWeight:700,marginBottom:16,color:T.text}}>✏️ 手動記帳</div>
              {manualSuccess ? (
                <div style={{textAlign:'center',padding:30}}>
                  <div style={{fontSize:48,marginBottom:12}}>✅</div>
                  <div style={{fontSize:16,fontWeight:600,color:T.success,marginBottom:8}}>入帳成功！</div>
                  <button onClick={()=>{setManualSuccess(false);setManualItems([{catCode:'',desc:'',qty:1,unitPrice:''}]);}} style={btnPrimary}>繼續記帳</button>
                </div>
              ) : (
                <>
                  {/* 基本資訊 */}
                  <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:12,marginBottom:16}}>
                    <div>
                      <label style={labelSt}>車號 *</label>
                      <select value={manualVehicle} onChange={e=>setManualVehicle(e.target.value)} style={selectSt}>
                        <option value="">-- 選擇車號 --</option>
                        {allVehicles.map(v=><option key={v.id} value={v.id}>{v.id} ({v.type} {v.ton}t)</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelSt}>日期 *</label>
                      <input type="date" value={manualDate} onChange={e=>setManualDate(e.target.value)} style={inputSt}/>
                    </div>
                    <div>
                      <label style={labelSt}>廠商 *</label>
                      <select value={manualVendor} onChange={e=>setManualVendor(e.target.value)} style={selectSt}>
                        <option value="">-- 選擇廠商 --</option>
                        {VENDORS_MASTER.map(v=><option key={v.name} value={v.name}>{v.name} ({v.taxType==='exclusive'?'未稅':v.taxType==='inclusive'?'含稅':'依單據'})</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelSt}>里程 (km)</label>
                      <input type="number" value={manualMileage} onChange={e=>setManualMileage(e.target.value)} placeholder="例：58420" style={inputSt}/>
                    </div>
                  </div>

                  {/* 項目明細 */}
                  <div style={{borderTop:`1px solid ${T.border}`,paddingTop:16,marginBottom:16}}>
                    <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:10}}>項目明細</div>
                    {manualItems.map((item,idx)=>(
                      <div key={idx} style={{padding:12,background:T.hoverBg,borderRadius:8,marginBottom:8}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                          <span style={{fontSize:12,fontWeight:600,color:T.textLight}}>項目 {idx+1}</span>
                          {manualItems.length>1 && <button onClick={()=>setManualItems(p=>p.filter((_,i)=>i!==idx))} style={{background:'none',border:'none',color:T.kpiAlert,cursor:'pointer',fontSize:12}}>✕ 移除</button>}
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:8}}>
                          <div>
                            <label style={{...labelSt,fontSize:11}}>分類 *</label>
                            <select value={item.catCode} onChange={e=>{const v=e.target.value;setManualItems(p=>p.map((x,i)=>i===idx?{...x,catCode:v}:x));}} style={selectSt}>
                              <option value="">-- 選擇分類 --</option>
                              {['A','B','C','D','E','F','G'].map(major=>{
                                const cats=CATEGORIES_MASTER.filter(c=>c.major===major);
                                return <optgroup key={major} label={cats[0]?.majorName}>{cats.map(c=><option key={c.code} value={c.code}>{c.code} {c.sub}</option>)}</optgroup>;
                              })}
                            </select>
                          </div>
                          <div>
                            <label style={{...labelSt,fontSize:11}}>項目說明</label>
                            <input value={item.desc} onChange={e=>{const v=e.target.value;setManualItems(p=>p.map((x,i)=>i===idx?{...x,desc:v}:x));}} placeholder="例：機油+機油芯" style={inputSt}/>
                          </div>
                          <div>
                            <label style={{...labelSt,fontSize:11}}>數量</label>
                            <input type="number" min="1" value={item.qty} onChange={e=>{const v=+e.target.value;setManualItems(p=>p.map((x,i)=>i===idx?{...x,qty:v}:x));}} style={inputSt}/>
                          </div>
                          <div>
                            <label style={{...labelSt,fontSize:11}}>單價 *</label>
                            <input type="number" value={item.unitPrice} onChange={e=>{const v=e.target.value;setManualItems(p=>p.map((x,i)=>i===idx?{...x,unitPrice:v}:x));}} placeholder="例：3826" style={inputSt}/>
                          </div>
                        </div>
                        {item.catCode && item.unitPrice && (
                          <div style={{marginTop:6,fontSize:11,color:T.textLight}}>
                            小計：${((item.qty||1)*(+item.unitPrice||0)).toLocaleString()}
                            {manualVendor && (() => { const tax=calcTax(manualVendor,(item.qty||1)*(+item.unitPrice||0)); return ` → 未稅 $${tax.exTax.toLocaleString()} + 稅 $${tax.tax.toLocaleString()} = 含稅 $${tax.incTax.toLocaleString()}`; })()}
                          </div>
                        )}
                      </div>
                    ))}
                    <button onClick={()=>setManualItems(p=>[...p,{catCode:'',desc:'',qty:1,unitPrice:''}])} style={{...btnOutline,fontSize:12,width:'100%',marginTop:4}}>+ 新增項目</button>
                  </div>

                  {/* 預覽 & 提交 */}
                  {manualVehicle && manualVendor && manualItems.some(i=>i.catCode&&i.unitPrice) && (
                    <div style={{background:isDark?'#0f172a':'#f0fdf4',border:`1px solid ${isDark?'#334155':'#bbf7d0'}`,borderRadius:8,padding:12,marginBottom:16}}>
                      <div style={{fontSize:12,fontWeight:600,color:T.success,marginBottom:6}}>📋 入帳預覽</div>
                      {manualItems.filter(i=>i.catCode&&i.unitPrice).map((item,idx)=>{
                        const cat=CATEGORIES_MASTER.find(c=>c.code===item.catCode);
                        const tax=calcTax(manualVendor,(item.qty||1)*(+item.unitPrice||0));
                        return <div key={idx} style={{fontSize:12,color:T.text,padding:'2px 0'}}>① {item.catCode} {cat?.sub||''} — {item.desc||'(無說明)'} ×{item.qty} = 未稅 ${tax.exTax.toLocaleString()}</div>;
                      })}
                      {(()=>{
                        const totals=manualItems.filter(i=>i.catCode&&i.unitPrice).reduce((acc,item)=>{
                          const tax=calcTax(manualVendor,(item.qty||1)*(+item.unitPrice||0));
                          return {exTax:acc.exTax+tax.exTax,tax:acc.tax+tax.tax,incTax:acc.incTax+tax.incTax};
                        },{exTax:0,tax:0,incTax:0});
                        return <div style={{marginTop:6,fontSize:12,fontWeight:600,color:T.text}}>未稅合計: ${totals.exTax.toLocaleString()} | 稅額: ${totals.tax.toLocaleString()} | 含稅: ${totals.incTax.toLocaleString()}</div>;
                      })()}
                    </div>
                  )}

                  <div style={{display:'flex',gap:8}}>
                    <button disabled={manualSubmitting} onClick={async()=>{
                      if(!manualVehicle||!manualVendor||!manualDate){alert('請填寫車號、廠商、日期');return;}
                      const validItems=manualItems.filter(i=>i.catCode&&i.unitPrice);
                      if(!validItems.length){alert('請至少填寫一個項目');return;}
                      setManualSubmitting(true);
                      try{
                        const fb=await initFirebase();const col=fb.collection(fb.db,COL_TX);
                        for(const item of validItems){
                          const cat=CATEGORIES_MASTER.find(c=>c.code===item.catCode);
                          const tax=calcTax(manualVendor,(item.qty||1)*(+item.unitPrice||0));
                          await fb.addDoc(col,{date:manualDate,vehicleId:manualVehicle,vendor:manualVendor,catCode:item.catCode,majorCat:cat?.majorName||'C 故障維修',subCat:cat?.sub||'其他維修',desc:item.desc||(cat?.sub||''),qty:item.qty||1,unitPrice:+item.unitPrice,amountExTax:tax.exTax,taxAmount:tax.tax,amountIncTax:tax.incTax,mileage:+manualMileage||0,invoiceNo:'',source:'手動',createdAt:new Date().toISOString()});
                        }
                        setManualSuccess(true);setManualVehicle('');setManualVendor('');setManualMileage('');loadAll();
                      }catch(err){alert('入帳失敗：'+err.message);}
                      setManualSubmitting(false);
                    }} style={{...btnPrimary,flex:1,opacity:manualSubmitting?0.6:1}}>{manualSubmitting?'入帳中...':'✅ 確認入帳'}</button>
                    <button onClick={()=>{setManualItems([{catCode:'',desc:'',qty:1,unitPrice:''}]);setManualVehicle('');setManualVendor('');setManualMileage('');}} style={btnOutline}>清除</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ═══ REPORT ═══ */}
        {tab === 'report' && (
          <div style={{padding:isMobile?14:24,animation:'fadeIn 0.3s'}}>
            {/* Mode selector */}
            <div style={{display:'flex',gap:4,marginBottom:12,flexWrap:'wrap'}}>
              {[{id:'monthly',label:'月度'},{id:'quarterly',label:'季度'},{id:'yearly',label:'年度'},{id:'custom',label:'自訂區間'},{id:'compare',label:'年度對比'}].map(m=>(
                <button key={m.id} onClick={()=>setReportMode(m.id)} style={{padding:'5px 12px',borderRadius:16,border:`1px solid ${reportMode===m.id?AX:T.border}`,background:reportMode===m.id?AX:T.cardBg,color:reportMode===m.id?'#fff':T.textMuted,fontSize:11,cursor:'pointer',transition:'all 0.15s'}}>{m.label}</button>
              ))}
            </div>
            {/* Period selectors */}
            <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
              {reportMode==='monthly' && <input type="month" value={reportMonth} onChange={e=>setReportMonth(e.target.value)} style={{...inputSt,width:'auto'}} />}
              {reportMode==='quarterly' && (<>
                <input type="number" value={reportQuarter.year} onChange={e=>setReportQuarter(p=>({...p,year:+e.target.value}))} style={{...inputSt,width:80}} />
                {[1,2,3,4].map(q=><button key={q} onClick={()=>setReportQuarter(p=>({...p,q}))} style={{padding:'5px 10px',borderRadius:16,border:`1px solid ${reportQuarter.q===q?AX:T.border}`,background:reportQuarter.q===q?AX:T.cardBg,color:reportQuarter.q===q?'#fff':T.textMuted,fontSize:11,cursor:'pointer'}}>Q{q}</button>)}
              </>)}
              {(reportMode==='yearly'||reportMode==='compare') && <input type="number" value={reportYear} onChange={e=>setReportYear(+e.target.value)} style={{...inputSt,width:80}} />}
              {reportMode==='custom' && (<>
                <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} style={{...inputSt,width:'auto'}} />
                <span style={{color:T.textLight}}>~</span>
                <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} style={{...inputSt,width:'auto'}} />
              </>)}
              <div style={{marginLeft:'auto',display:'flex',gap:6}}>
                <button onClick={exportCSV} style={btnOutline}>📥 CSV</button>
                <button onClick={exportPDF} disabled={pdfLoading} style={{...btnPrimary,opacity:pdfLoading?0.6:1}}>{pdfLoading?'產出中...':'📄 PDF+AI'}</button>
              </div>
            </div>
            {/* Title */}
            <div style={{fontSize:isMobile?14:16,fontWeight:600,color:T.text,marginBottom:8}}>{reportData.label} {reportMode==='compare'?'車輛對比表':'結算總表'} ({reportData.rows.length} 輛)</div>

            {/* Table */}
            <div style={{...card,padding:0,overflow:'hidden'}}>
            <div style={{overflowX:'auto'}}>
              {reportMode === 'compare' ? (
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:isMobile?10:12,minWidth:800}}>
                  <thead><tr style={{background:T.tableHeaderBg,color:T.tableHeaderColor}}>
                    <th style={{padding:'8px',textAlign:'left',position:'sticky',left:0,background:T.tableHeaderBg,zIndex:1}}>車號</th>
                    <th>車型</th>
                    {[...Array(12)].map((_,i)=><th key={i} style={{textAlign:'right'}}>{i+1}月</th>)}
                    <th style={{textAlign:'right'}}>合計</th><th style={{textAlign:'right'}}>月均</th>
                  </tr></thead>
                  <tbody>{reportData.rows.map((r,i) => (
                    <tr key={i} style={{borderBottom:`1px solid ${T.borderLight}`,background:i%2?T.tableStripeBg:'transparent',transition:'background 0.15s'}}
                      onMouseEnter={e=>e.currentTarget.style.background=T.hoverBg} onMouseLeave={e=>e.currentTarget.style.background=i%2?T.tableStripeBg:'transparent'}>
                      <td style={{padding:'5px 8px',fontWeight:600,position:'sticky',left:0,background:T.cardBg,zIndex:1,color:T.text}}>{r.vehicleId}</td>
                      <td style={{fontSize:10,color:T.textLight}}>{r.type}</td>
                      {r.months.map((m,j)=><td key={j} style={{textAlign:'right',color:m>((reportData.fleetAvg||0)/12*2)?T.kpiAlert:T.text,fontWeight:m>((reportData.fleetAvg||0)/12*2)?700:400}}>{m?'$'+m.toLocaleString():'-'}</td>)}
                      <td style={{textAlign:'right',fontWeight:700,color:r.total>(reportData.fleetAvg||0)*2?T.kpiAlert:T.text}}>${r.total.toLocaleString()}</td>
                      <td style={{textAlign:'right',color:T.textLight}}>${r.avg.toLocaleString()}</td>
                    </tr>
                  ))}</tbody>
                </table>
              ) : (
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:isMobile?11:13}}>
                  <thead><tr style={{background:T.tableHeaderBg,color:T.tableHeaderColor}}>
                    <th style={{padding:'10px 12px',textAlign:'left'}}>車號</th><th>車型</th><th>噸位</th><th style={{textAlign:'right'}}>未稅</th><th style={{textAlign:'right'}}>稅額</th><th style={{textAlign:'right'}}>含稅</th><th style={{textAlign:'center'}}>筆數</th><th style={{textAlign:'right'}}>最高單筆</th>
                  </tr></thead>
                  <tbody>
                    {reportData.rows.map((r,i) => (
                      <tr key={i} style={{borderBottom:`1px solid ${T.borderLight}`,background:i%2?T.tableStripeBg:'transparent',transition:'background 0.15s'}}
                        onMouseEnter={e=>e.currentTarget.style.background=T.hoverBg} onMouseLeave={e=>e.currentTarget.style.background=i%2?T.tableStripeBg:'transparent'}>
                        <td style={{padding:'8px 12px',fontWeight:600,color:T.text}}>{r.vehicleId}</td><td style={{fontSize:11,color:T.textLight}}>{r.type}</td><td style={{textAlign:'center',color:T.textMuted}}>{r.ton}t</td>
                        <td style={{textAlign:'right',color:T.text}}>${r.exTax.toLocaleString()}</td><td style={{textAlign:'right',color:T.textLight}}>${r.tax.toLocaleString()}</td><td style={{textAlign:'right',fontWeight:600,color:T.text}}>${r.incTax.toLocaleString()}</td>
                        <td style={{textAlign:'center',color:T.textMuted}}>{r.count}</td><td style={{textAlign:'right',color:T.text}}>${(r.maxSingle||0).toLocaleString()}</td>
                      </tr>
                    ))}
                    {reportData.total && (
                      <tr style={{background:T.tableStripeBg,fontWeight:700,borderTop:`2px solid ${T.border}`}}>
                        <td style={{padding:'10px 12px',color:T.text}} colSpan={3}>合計</td>
                        <td style={{textAlign:'right',color:T.text}}>${reportData.total.exTax?.toLocaleString()}</td><td style={{textAlign:'right',color:T.text}}>${reportData.total.tax?.toLocaleString()}</td><td style={{textAlign:'right',color:T.text}}>${reportData.total.incTax?.toLocaleString()}</td>
                        <td style={{textAlign:'center',color:T.text}}>{reportData.total.count}</td><td></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            </div>
            {!reportData.rows.length && <div style={{textAlign:'center',padding:30,color:T.textLight}}>此期間沒有交易資料</div>}
          </div>
        )}

        {/* ═══ CHAT ═══ */}
        {tab === 'chat' && (
          <div style={{display:'flex',flexDirection:'column',height:`calc(${windowHeight}px - ${isMobile?110:0}px)`}}>
            <input type="file" ref={fileInputRef} accept="image/*,application/pdf" capture="environment" onChange={handleFileUpload} style={{display:'none'}} />
            <div style={{display:'flex',gap:5,padding:isMobile?'8px 14px':'12px 24px',flexWrap:'wrap'}}>
              {[{label:'📎 上傳單據',action:'upload'},{label:'本月結算',action:'monthly'},{label:'查車輛履歷',action:'history'},{label:'異常警示',action:'anomaly'}].map(b=>(
                <button key={b.action} onClick={()=>quickAction(b.action)} style={{padding:'5px 10px',borderRadius:16,border:`1px solid ${b.action==='upload'?T.success:AX}`,background:b.action==='upload'?T.success:T.cardBg,color:b.action==='upload'?'#fff':AX,fontSize:11,cursor:'pointer',transition:'all 0.15s'}}>{b.label}</button>
              ))}
            </div>
            <div style={{flex:1,overflowY:'auto',padding:isMobile?'8px 14px':'8px 24px'}}>
              {chatMessages.map((m,i) => (
                <div key={i} style={{marginBottom:10,display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                  <div style={{maxWidth:isMobile?'85%':'70%',padding:'9px 13px',borderRadius:12,fontSize:13,lineHeight:1.5,...(m.role==='user'?{background:T.chatUserBg,color:'#fff',borderBottomRightRadius:3}:{background:T.chatAiBg,boxShadow:T.chatAiShadow,borderBottomLeftRadius:3,color:T.text})}} dangerouslySetInnerHTML={{__html:m.html}} />
                </div>
              ))}
              {ocrPending && (
                <div style={{display:'flex',gap:8,marginBottom:10,justifyContent:'flex-start'}}>
                  <button onClick={ocrConfirm} style={{padding:'6px 16px',background:AX,color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontSize:12}}>✅ 確認入帳</button>
                  <button onClick={ocrCancel} style={{padding:'6px 16px',background:isDark?'#374151':'#e2e8f0',color:isDark?'#d1d5db':'#333',border:'none',borderRadius:6,cursor:'pointer',fontSize:12}}>❌ 取消</button>
                </div>
              )}
              {chatLoading && <div style={{display:'flex',justifyContent:'flex-start',marginBottom:10}}><div style={{padding:'9px 13px',background:T.chatAiBg,borderRadius:12,boxShadow:T.chatAiShadow,fontSize:13,color:T.textLight}}>🤖 思考中...</div></div>}
              <div ref={chatEndRef}/>
            </div>
            <div style={{display:'flex',gap:6,padding:isMobile?'8px 14px':'12px 24px',borderTop:`1px solid ${T.border}`}}>
              <input type="text" placeholder="輸入車號或問題..." value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!chatLoading)sendChat();}} style={{flex:1,padding:'9px 12px',border:`1px solid ${T.inputBorder}`,borderRadius:20,fontSize:13,outline:'none',background:T.inputBg,color:T.text}} />
              <button onClick={sendChat} disabled={chatLoading} style={{padding:'9px 14px',borderRadius:20,border:'none',background:T.navBg,color:'#fff',cursor:'pointer',fontSize:13,opacity:chatLoading?0.6:1}}>發送</button>
            </div>
          </div>
        )}

        {/* ═══ CATEGORIES ═══ */}
        {tab === 'categories' && (
          <div style={{padding:isMobile?14:24,animation:'fadeIn 0.3s'}}>
            {!isMobile && <div style={{fontSize:18,fontWeight:700,marginBottom:16,color:T.text}}>成本分類表（7 大類 40 子類）</div>}
            {catGroups.map((g,i) => (
              <div key={i} style={{marginBottom:8}}>
                <div onClick={()=>setOpenAccordion(openAccordion===i?null:i)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:isMobile?'10px 14px':'12px 16px',background:T.cardBg,borderRadius:8,boxShadow:T.shadow,cursor:'pointer',fontWeight:600,fontSize:isMobile?13:14,color:T.text,transition:'box-shadow 0.2s'}}
                  onMouseEnter={e=>{if(!isMobile)e.currentTarget.style.boxShadow=T.shadowLg}} onMouseLeave={e=>{if(!isMobile)e.currentTarget.style.boxShadow=T.shadow}}>
                  <span><Tag code={g.majorCode}/> {g.majorName}（{g.items.length}）</span>
                  <span style={{transform:openAccordion===i?'rotate(90deg)':'none',transition:'transform .2s',color:T.textLight}}>▸</span>
                </div>
                {openAccordion===i && (
                  <div style={{background:T.cardBg,borderRadius:'0 0 8px 8px',marginTop:-2,overflow:'hidden'}}>
                    {g.items.map((item,j) => (
                      <div key={j} style={{display:'flex',justifyContent:'space-between',padding:isMobile?'6px 14px':'8px 16px',borderBottom:`1px solid ${T.borderLight}`,fontSize:isMobile?12:13,gap:8,transition:'background 0.15s'}}
                        onMouseEnter={e=>{if(!isMobile)e.currentTarget.style.background=T.hoverBg}} onMouseLeave={e=>{if(!isMobile)e.currentTarget.style.background='transparent'}}>
                        <span style={{fontWeight:600,color:'#4472C4',minWidth:36}}>{item.code}</span>
                        <span style={{flex:1,color:T.text}}>{item.sub}</span>
                        <span style={{fontSize:isMobile?10:11,color:T.textLight,maxWidth:isMobile?80:250,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.ref||item.kw||''}</span>
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
          <div style={{padding:isMobile?14:24,animation:'fadeIn 0.3s'}}>
            <div style={{fontSize:isMobile?14:18,fontWeight:700,color:T.text,marginBottom:12}}>廠商管理</div>
            {VENDORS_MASTER.map((v,i) => (
              <div key={i} style={{...card,display:'flex',justifyContent:'space-between',alignItems:'center',padding:isMobile?'10px 14px':'12px 16px'}}>
                <span style={{fontSize:13,color:T.text}}>{v.name} <span style={{fontSize:10,color:T.textLight}}>({v.taxType==='exclusive'?'未稅':v.taxType==='inclusive'?'含稅':'依單據'})</span></span>
                {v.brand && <span style={{fontSize:10,color:T.textLight}}>{v.brand}</span>}
              </div>
            ))}

            <div style={{fontSize:isMobile?14:18,fontWeight:700,color:T.text,marginBottom:12,marginTop:20}}>車輛主檔（📷 點擊上傳行照）</div>
            <input type="file" ref={licenseFileRef} accept="image/*,application/pdf" onChange={handleLicenseUpload} style={{display:'none'}} />
            {allVehicles.slice(0, isMobile ? 10 : 999).map((v,i) => {
              const fs = fsVehicles[v.id];
              return (
                <div key={i} style={{...card,display:'flex',justifyContent:'space-between',alignItems:'center',padding:isMobile?'10px 14px':'12px 16px'}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:T.text}}>{v.id} <span style={{fontSize:10,color:T.textLight}}>{v.type} {v.ton}t</span></div>
                    {fs && !fs.deleted && <div style={{fontSize:10,color:T.success}}>✅ 行照已上傳 ({fs.brandModel||''})</div>}
                  </div>
                  <button onClick={()=>{setLicenseUploadVehicle(v.id);licenseFileRef.current?.click();}} style={{padding:'4px 10px',border:`1px solid ${T.border}`,background:T.cardBg,color:T.text,borderRadius:6,fontSize:11,cursor:'pointer',transition:'all 0.15s'}}>📷 行照</button>
                </div>
              );
            })}
            {isMobile && allVehicles.length > 10 && <div style={{textAlign:'center',padding:10,color:T.textLight,fontSize:11}}>顯示前 10 輛，請在電腦版查看全部</div>}

            {/* License result modal */}
            {licenseResult && (
              <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
                <div style={{background:T.cardBg,borderRadius:12,padding:24,maxWidth:400,width:'100%',maxHeight:'80vh',overflowY:'auto'}}>
                  <div style={{fontSize:16,fontWeight:700,marginBottom:12,color:T.text}}>📷 行照辨識結果</div>
                  {Object.entries(licenseResult).map(([k,v]) => v && (
                    <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${T.borderLight}`,fontSize:12}}>
                      <span style={{color:T.textLight}}>{k}</span><span style={{fontWeight:600,color:T.text}}>{String(v)}</span>
                    </div>
                  ))}
                  <div style={{display:'flex',gap:8,marginTop:16}}>
                    <button onClick={saveLicenseData} style={btnPrimary}>✅ 確認儲存</button>
                    <button onClick={()=>{setLicenseResult(null);setLicenseUploadVehicle(null);}} style={btnOutline}>取消</button>
                  </div>
                </div>
              </div>
            )}

            <div style={{fontSize:isMobile?14:18,fontWeight:700,color:T.text,marginBottom:12,marginTop:20}}>資料庫</div>
            <div style={{...card,padding:isMobile?'10px 14px':'14px 16px',fontSize:12,color:T.textLight}}>
              Firestore: {COL_TX} ({allTx.length} 筆) + {COL_VEH} ({Object.keys(fsVehicles).length} 輛)<br/>
              Project: jc-logi-map | Gemini: gemini-2.5-flash
            </div>
          </div>
        )}
        </div>
        {/* end scrollable content */}

        {/* Bottom Nav — Mobile only */}
        {isMobile && (
          <div style={{position:'fixed',bottom:0,left:0,right:0,background:T.cardBg,borderTop:`1px solid ${T.border}`,display:'flex',zIndex:10,paddingBottom:'env(safe-area-inset-bottom,0px)'}}>
            {NAV_ITEMS.map(t => (
              <button key={t.id} onClick={()=>{setTab(t.id);if(t.id==='vehicles')setSelectedVehicle(null);}} style={tabSt(tab===t.id)}>
                <span style={{fontSize:18,marginBottom:1}}>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* end main content area */}
    </div>
  );
}
