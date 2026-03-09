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

// ── 起始里程基準（來源：里程數據.xlsx／起始數據）──────────────────────────────
const BASELINE_PERIOD = '2025-12';
const BASELINE_MILEAGE = {
  'BKE-7387':325561,   'BMP-1612':330069,   'BMQ-6180':314385,   'BMT-5733':144530,
  'BMT-5803':135969,   'BMT-6092':285575,   'BQC-3661':188243,   'BQC-3793':102763,
  'BQC-3973':111634,   'BQC-7176':182481,   'BSQ-7353':193874,   'BUA-3107':197536,
  'BUA-3265':251404,   'BUA-3721':280118,   'BUB-0572':266082,   'BUB-1036':345494,
  'BUB-1332':356804,   'BUB-1562':302706,   'BUC-6837':53572,   'BUC-6933':257408,
  'BUC-7100':174298,   'BUF-7506':76128,   'BUF-7507':93171,   'BVY-0363':63747,
  'BVY-3570':99550,   'BYV-2830':75058,   'BYV-2831':44585,   'BZH-3895':77839,
  'BZH-3896':108845,   'BZH-3897':70460,   'BZH-7903':188081,   'BZH-7913':65990,
  'BZH-8131':151151,   'BZH-8393':118469,   'BZH-9217':28106,   'BZH-9223':33715,
};

// ── 月報批次匯入（來源：里程數據.xlsx／2026年1月 + 2026年2月）────────────────
const SEED_MONTHLY_RECORDS = [
  { id:'seed_jan_01', vehicleId:'', vehiclePlate:'BKE-7387', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:326874, previousReading:325561, monthlyMileage:1313, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_02', vehicleId:'', vehiclePlate:'BMP-1612', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:333899, previousReading:330069, monthlyMileage:3830, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_03', vehicleId:'', vehiclePlate:'BMQ-6180', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:318635, previousReading:314385, monthlyMileage:4250, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_04', vehicleId:'', vehiclePlate:'BMT-5733', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:145736, previousReading:144530, monthlyMileage:1206, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_05', vehicleId:'', vehiclePlate:'BMT-5803', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:137370, previousReading:135969, monthlyMileage:1401, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_06', vehicleId:'', vehiclePlate:'BMT-6092', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:289145, previousReading:285575, monthlyMileage:3570, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_07', vehicleId:'', vehiclePlate:'BQC-3661', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:189930, previousReading:188243, monthlyMileage:1687, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_08', vehicleId:'', vehiclePlate:'BQC-3793', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:103506, previousReading:102763, monthlyMileage:743, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_09', vehicleId:'', vehiclePlate:'BQC-3973', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:113178, previousReading:111634, monthlyMileage:1544, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_10', vehicleId:'', vehiclePlate:'BQC-7176', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:184875, previousReading:182481, monthlyMileage:2394, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_11', vehicleId:'', vehiclePlate:'BSQ-7353', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:196410, previousReading:193874, monthlyMileage:2536, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_12', vehicleId:'', vehiclePlate:'BUA-3107', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:200991, previousReading:197536, monthlyMileage:3455, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_13', vehicleId:'', vehiclePlate:'BUA-3265', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:255075, previousReading:251404, monthlyMileage:3671, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_14', vehicleId:'', vehiclePlate:'BUA-3721', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:284936, previousReading:280118, monthlyMileage:4818, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_15', vehicleId:'', vehiclePlate:'BUB-0572', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:270997, previousReading:266082, monthlyMileage:4915, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_16', vehicleId:'', vehiclePlate:'BUB-1036', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:351458, previousReading:345494, monthlyMileage:5964, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_17', vehicleId:'', vehiclePlate:'BUB-1332', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:358733, previousReading:356804, monthlyMileage:1929, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_18', vehicleId:'', vehiclePlate:'BUB-1562', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:307740, previousReading:302706, monthlyMileage:5034, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_19', vehicleId:'', vehiclePlate:'BUC-6837', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:54363, previousReading:53572, monthlyMileage:791, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_20', vehicleId:'', vehiclePlate:'BUC-6933', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:261514, previousReading:257408, monthlyMileage:4106, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_21', vehicleId:'', vehiclePlate:'BUC-7100', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:176937, previousReading:174298, monthlyMileage:2639, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_22', vehicleId:'', vehiclePlate:'BUF-7506', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:80187, previousReading:76128, monthlyMileage:4059, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_23', vehicleId:'', vehiclePlate:'BUF-7507', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:98952, previousReading:93171, monthlyMileage:5781, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_24', vehicleId:'', vehiclePlate:'BVY-0363', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:68463, previousReading:63747, monthlyMileage:4716, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_25', vehicleId:'', vehiclePlate:'BVY-3570', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:101858, previousReading:99550, monthlyMileage:2308, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_26', vehicleId:'', vehiclePlate:'BYV-2830', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:82068, previousReading:75058, monthlyMileage:7010, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_27', vehicleId:'', vehiclePlate:'BYV-2831', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:48939, previousReading:44585, monthlyMileage:4354, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_28', vehicleId:'', vehiclePlate:'BZH-3895', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:79340, previousReading:77839, monthlyMileage:1501, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_29', vehicleId:'', vehiclePlate:'BZH-3896', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:111107, previousReading:108845, monthlyMileage:2262, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_30', vehicleId:'', vehiclePlate:'BZH-3897', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:71685, previousReading:70460, monthlyMileage:1225, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_31', vehicleId:'', vehiclePlate:'BZH-7903', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:192480, previousReading:188081, monthlyMileage:4399, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_32', vehicleId:'', vehiclePlate:'BZH-7913', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:67151, previousReading:65990, monthlyMileage:1161, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_33', vehicleId:'', vehiclePlate:'BZH-8131', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:155125, previousReading:151151, monthlyMileage:3974, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_34', vehicleId:'', vehiclePlate:'BZH-8393', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:121225, previousReading:118469, monthlyMileage:2756, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_35', vehicleId:'', vehiclePlate:'BZH-9217', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:34932, previousReading:28106, monthlyMileage:6826, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_jan_36', vehicleId:'', vehiclePlate:'BZH-9223', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-01', odometerReading:33715, previousReading:33715, monthlyMileage:0, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_37', vehicleId:'', vehiclePlate:'BKE-7387', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:327615, previousReading:326874, monthlyMileage:741, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_38', vehicleId:'', vehiclePlate:'BMP-1612', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:336583, previousReading:333899, monthlyMileage:2684, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_39', vehicleId:'', vehiclePlate:'BMQ-6180', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:321243, previousReading:318635, monthlyMileage:2608, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_40', vehicleId:'', vehiclePlate:'BMT-5733', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:146226, previousReading:145736, monthlyMileage:490, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_41', vehicleId:'', vehiclePlate:'BMT-5803', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:137606, previousReading:137370, monthlyMileage:236, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_42', vehicleId:'', vehiclePlate:'BMT-6092', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:291555, previousReading:289145, monthlyMileage:2410, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_43', vehicleId:'', vehiclePlate:'BQC-3661', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:191364, previousReading:189930, monthlyMileage:1434, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_44', vehicleId:'', vehiclePlate:'BQC-3793', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:103949, previousReading:103506, monthlyMileage:443, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_45', vehicleId:'', vehiclePlate:'BQC-3973', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:115342, previousReading:113178, monthlyMileage:2164, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_46', vehicleId:'', vehiclePlate:'BQC-7176', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:186551, previousReading:184875, monthlyMileage:1676, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_47', vehicleId:'', vehiclePlate:'BSQ-7353', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:198144, previousReading:196410, monthlyMileage:1734, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_48', vehicleId:'', vehiclePlate:'BUA-3107', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:202919, previousReading:200991, monthlyMileage:1928, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_49', vehicleId:'', vehiclePlate:'BUA-3265', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:257677, previousReading:255075, monthlyMileage:2602, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_50', vehicleId:'', vehiclePlate:'BUA-3721', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:288001, previousReading:284936, monthlyMileage:3065, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_51', vehicleId:'', vehiclePlate:'BUB-0572', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:273964, previousReading:270997, monthlyMileage:2967, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_52', vehicleId:'', vehiclePlate:'BUB-1036', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:355468, previousReading:351458, monthlyMileage:4010, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_53', vehicleId:'', vehiclePlate:'BUB-1332', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:359884, previousReading:358733, monthlyMileage:1151, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_54', vehicleId:'', vehiclePlate:'BUB-1562', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:310872, previousReading:307740, monthlyMileage:3132, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_55', vehicleId:'', vehiclePlate:'BUC-6837', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:54956, previousReading:54363, monthlyMileage:593, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_56', vehicleId:'', vehiclePlate:'BUC-6933', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:264241, previousReading:261514, monthlyMileage:2727, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_57', vehicleId:'', vehiclePlate:'BUC-7100', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:178060, previousReading:176937, monthlyMileage:1123, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_58', vehicleId:'', vehiclePlate:'BUF-7506', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:82482, previousReading:80187, monthlyMileage:2295, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_59', vehicleId:'', vehiclePlate:'BUF-7507', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:102753, previousReading:98952, monthlyMileage:3801, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_60', vehicleId:'', vehiclePlate:'BVY-0363', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:71616, previousReading:68463, monthlyMileage:3153, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_61', vehicleId:'', vehiclePlate:'BVY-3570', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:103128, previousReading:101858, monthlyMileage:1270, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_62', vehicleId:'', vehiclePlate:'BYV-2830', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:86531, previousReading:82068, monthlyMileage:4463, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_63', vehicleId:'', vehiclePlate:'BYV-2831', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:51688, previousReading:48939, monthlyMileage:2749, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_64', vehicleId:'', vehiclePlate:'BZH-3895', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:80826, previousReading:79340, monthlyMileage:1486, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_65', vehicleId:'', vehiclePlate:'BZH-3896', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:113016, previousReading:111107, monthlyMileage:1909, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_66', vehicleId:'', vehiclePlate:'BZH-3897', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:72524, previousReading:71685, monthlyMileage:839, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_67', vehicleId:'', vehiclePlate:'BZH-7903', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:195169, previousReading:192480, monthlyMileage:2689, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_68', vehicleId:'', vehiclePlate:'BZH-7913', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:67859, previousReading:67151, monthlyMileage:708, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_69', vehicleId:'', vehiclePlate:'BZH-8131', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:157607, previousReading:155125, monthlyMileage:2482, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_70', vehicleId:'', vehiclePlate:'BZH-8393', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:122864, previousReading:121225, monthlyMileage:1639, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_71', vehicleId:'', vehiclePlate:'BZH-9217', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:38779, previousReading:34932, monthlyMileage:3847, submittedAt:'2026-03-09T00:00:00.000Z' },
  { id:'seed_feb_72', vehicleId:'', vehiclePlate:'BZH-9223', reporterId:'system', reporterName:'系統匯入', proxyById:'', proxyByName:'', notes:'批次匯入', retroactive:true, status:'submitted', period:'2026-02', odometerReading:33715, previousReading:33715, monthlyMileage:0, submittedAt:'2026-03-09T00:00:00.000Z' },
];

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

const SPIKE_KM_PER_MONTH = 10000; // 單月均值超過此數值視為異常跳躍（軟警告）

const monthDiffPeriod = (from, to) => {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
};

// 核心衝突偵測：分析補登/新增里程是否與現有記錄邏輯衝突
// 回傳 { conflicts, warnings, canOverride, canSubmitWithWarning }
const analyzeConflict = (monthlyRecords, vehiclePlate, period, odometer) => {
  const sorted = monthlyRecords
    .filter(r => r.vehiclePlate === vehiclePlate)
    .sort((a, b) => a.period.localeCompare(b.period));

  const conflicts = [];
  const warnings = [];

  // 1. 完全重複（同期同值）
  const exactSame = sorted.find(r => r.period === period && r.odometerReading === odometer);
  if (exactSame) {
    return {
      conflicts: [{ type: 'DUPLICATE_SAME', msg: `此期別已存在完全相同的里程數據（${fmtNum(odometer)} km），無需重複建立。`, record: exactSame }],
      warnings: [],
      canOverride: false,
      canSubmitWithWarning: false,
    };
  }

  // 2. 期別衝突（同期不同值）→ 可選擇覆蓋
  const samePeriod = sorted.find(r => r.period === period && r.odometerReading !== odometer);
  if (samePeriod) {
    const diff = odometer - samePeriod.odometerReading;
    conflicts.push({
      type: 'PERIOD_CONFLICT',
      msg: `此期別已有不同的里程數據：現有 ${fmtNum(samePeriod.odometerReading)} km，新值 ${fmtNum(odometer)} km（差異 ${diff > 0 ? '+' : ''}${fmtNum(diff)} km）。`,
      record: samePeriod,
    });
  }

  const others = sorted.filter(r => r.period !== period);
  const prev = [...others].reverse().find(r => r.period < period);
  const next = others.find(r => r.period > period);

  // 3. 里程倒退（< 前一期）→ 邏輯錯誤，阻擋
  if (prev && odometer < prev.odometerReading) {
    conflicts.push({
      type: 'REGRESSION',
      msg: `里程倒退：前一期（${prev.period}）為 ${fmtNum(prev.odometerReading)} km，本次輸入 ${fmtNum(odometer)} km，倒退 ${fmtNum(prev.odometerReading - odometer)} km。里程表為累計值，不應減少。`,
      record: prev,
    });
  }

  // 4. 超越後期（> 後一期）→ 邏輯錯誤，阻擋
  if (next && odometer > next.odometerReading) {
    conflicts.push({
      type: 'OVERFLOW',
      msg: `超越後期：後一期（${next.period}）僅 ${fmtNum(next.odometerReading)} km，本次輸入 ${fmtNum(odometer)} km，超出 ${fmtNum(odometer - next.odometerReading)} km。補登里程不應高於已知的後期數據。`,
      record: next,
    });
  }

  // 5. 異常跳躍（軟警告）
  if (prev && !conflicts.some(c => c.type === 'REGRESSION')) {
    const gap = monthDiffPeriod(prev.period, period);
    const km = odometer - prev.odometerReading;
    if (gap > 0 && km / gap > SPIKE_KM_PER_MONTH) {
      warnings.push({
        type: 'SPIKE',
        msg: `與前一期（${prev.period}）相差 ${gap} 個月，增加 ${fmtNum(km)} km（平均 ${fmtNum(Math.round(km / gap))} km/月），超過異常閾值 ${fmtNum(SPIKE_KM_PER_MONTH)} km/月，建議確認數值是否正確。`,
      });
    }
  }
  if (next && !conflicts.some(c => c.type === 'OVERFLOW')) {
    const gap = monthDiffPeriod(period, next.period);
    const km = next.odometerReading - odometer;
    if (gap > 0 && km / gap > SPIKE_KM_PER_MONTH) {
      warnings.push({
        type: 'SPIKE_NEXT',
        msg: `與後一期（${next.period}）相差 ${gap} 個月，增加 ${fmtNum(km)} km（平均 ${fmtNum(Math.round(km / gap))} km/月），超過異常閾值，建議確認後期數據是否準確。`,
      });
    }
  }

  return {
    conflicts,
    warnings,
    // 只有「期別衝突」可以由使用者選擇覆蓋；「倒退」和「超越」屬邏輯錯誤，直接阻擋
    canOverride: conflicts.length > 0 && conflicts.every(c => c.type === 'PERIOD_CONFLICT'),
    canSubmitWithWarning: conflicts.length === 0 && warnings.length > 0,
  };
};

// ═══════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════
// ═══ Sub-components (extracted to fix TDZ in esbuild minification) ═══

const TrendChart = ({ trendData }) => {
  const W = 560, H = 160, PL = 44, PR = 12, PT = 10, PB = 28;
  const cw = W - PL - PR;
  const ch = H - PT - PB;
  const maxVal = Math.max(...trendData.map(d => d.total), 1);
  const yTick = v => v >= 1000 ? (v/1000).toFixed(0)+'k' : String(v);
  const getPx = i => PL + (i / Math.max(trendData.length - 1, 1)) * cw;
  const getPy = v => PT + ch - (v / maxVal) * ch;
  const totalPts = trendData.map((d, i) => getPx(i) + ',' + getPy(d.total)).join(' ');
  const avgPts = trendData.map((d, i) => getPx(i) + ',' + getPy(d.avg)).join(' ');
  const ySteps = [0, 0.25, 0.5, 0.75, 1];
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="text-sm font-bold text-gray-700 mb-1">📈 月增幅趨勢（近 6 個月）</div>
      <div className="flex gap-4 mb-2">
        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="inline-block w-5 h-0.5 bg-emerald-500 rounded"></span>總里程</span>
        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="inline-block w-5 border-t-2 border-dashed border-indigo-400"></span>車均里程</span>
      </div>
      <svg viewBox={'0 0 ' + W + ' ' + H} className="w-full" style={{height:160}}>
        {ySteps.map((s, i) => (
          <g key={i}>
            <line x1={PL} y1={PT + ch - s*ch} x2={W-PR} y2={PT + ch - s*ch} stroke="#f0f0f0" strokeWidth="1"/>
            <text x={PL-4} y={PT + ch - s*ch + 4} textAnchor="end" fontSize="9" fill="#9ca3af">{yTick(Math.round(maxVal*s))}</text>
          </g>
        ))}
        <polyline points={totalPts} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round"/>
        <polyline points={avgPts} fill="none" stroke="#818cf8" strokeWidth="2" strokeDasharray="5 3" strokeLinejoin="round"/>
        {trendData.map((d, i) => (
          <g key={i}>
            <circle cx={getPx(i)} cy={getPy(d.total)} r="3.5" fill="#10b981"/>
            <circle cx={getPx(i)} cy={getPy(d.avg)} r="3" fill="#818cf8"/>
            <text x={getPx(i)} y={H-4} textAnchor="middle" fontSize="9" fill="#6b7280">{d.period}</text>
          </g>
        ))}
      </svg>
    </div>
  );
};

const MileageBarChart = ({ vehicleData, period }) => {
  const W = 560, H = 180, PL = 40, PR = 10, PT = 10, PB = 40;
  const cw = W - PL - PR;
  const ch = H - PT - PB;
  const maxVal = Math.max(...vehicleData.map(d => d.km), 1);
  const bw = Math.max(4, Math.floor(cw / vehicleData.length) - 4);
  const yTick = v => v >= 1000 ? (v/1000).toFixed(0)+'k' : String(v);
  const ySteps = [0, 0.5, 1];
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="text-sm font-bold text-gray-700 mb-3">🚗 本期里程 Top 10（{period}）</div>
      <svg viewBox={'0 0 ' + W + ' ' + H} className="w-full" style={{height:180}}>
        {ySteps.map((s, i) => (
          <g key={i}>
            <line x1={PL} y1={PT + ch - s*ch} x2={W-PR} y2={PT + ch - s*ch} stroke="#f0f0f0" strokeWidth="1"/>
            <text x={PL-4} y={PT + ch - s*ch + 4} textAnchor="end" fontSize="9" fill="#9ca3af">{yTick(Math.round(maxVal*s))}</text>
          </g>
        ))}
        <line x1={PL} y1={PT} x2={PL} y2={PT+ch} stroke="#e5e7eb" strokeWidth="1"/>
        {vehicleData.map((d, i) => {
          const bh = Math.max(2, (d.km / maxVal) * ch);
          const bx = PL + i * (cw / vehicleData.length) + 2;
          const by = PT + ch - bh;
          return (
            <g key={i}>
              <rect x={bx} y={by} width={bw} height={bh} fill={i < 3 ? '#10b981' : '#818cf8'} fillOpacity="0.85" rx="2"/>
              <text x={bx + bw/2} y={H-4} textAnchor="middle" fontSize="8.5" fill="#6b7280"
                transform={'rotate(-30,' + (bx+bw/2) + ',' + (H-4) + ')'}>{d.plate}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const DashAnalysis = ({ dashRecords, fmtNum }) => {
  const recWithKm = dashRecords.filter(r => (r.monthlyMileage || 0) > 0);
  if (!recWithKm.length) return null;
  const kms = [...recWithKm.map(r => r.monthlyMileage)].sort((a,b) => a-b);
  const avg = Math.round(kms.reduce((s,v) => s+v, 0) / kms.length);
  const median = kms[Math.floor(kms.length/2)];
  const maxKm = kms[kms.length-1];
  const minKm = kms[0];
  const maxRec = recWithKm.find(r => r.monthlyMileage === maxKm);
  const minRec = recWithKm.find(r => r.monthlyMileage === minKm);
  const highRisk = recWithKm.filter(r => r.monthlyMileage > avg * 1.8);
  const lowAlert = recWithKm.filter(r => r.monthlyMileage < avg * 0.2 && r.monthlyMileage > 0);
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
      <div className="text-sm font-bold text-gray-700">📊 數據分析</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '最高里程', value: fmtNum(maxKm) + ' km', sub: maxRec?.vehiclePlate || '', color: 'text-rose-600' },
          { label: '最低里程', value: fmtNum(minKm) + ' km', sub: minRec?.vehiclePlate || '', color: 'text-blue-600' },
          { label: '中位數', value: fmtNum(median) + ' km', sub: '排除極端值', color: 'text-indigo-600' },
          { label: '平均里程', value: fmtNum(avg) + ' km', sub: recWithKm.length + ' 輛計算', color: 'text-emerald-600' },
        ].map((item, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3">
            <div className="text-[10px] text-gray-500 mb-1">{item.label}</div>
            <div className={'text-base font-bold ' + item.color}>{item.value}</div>
            <div className="text-[10px] text-gray-400">{item.sub}</div>
          </div>
        ))}
      </div>
      {highRisk.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
          <div className="text-xs font-bold text-rose-700 mb-1">⚡ 高里程預警（超過平均 180%）</div>
          <div className="flex flex-wrap gap-2">
            {highRisk.map(r => <span key={r.id} className="text-xs bg-rose-100 text-rose-800 px-2 py-1 rounded font-bold">{r.vehiclePlate} {fmtNum(r.monthlyMileage)} km</span>)}
          </div>
          <div className="text-[10px] text-rose-500 mt-1">建議確認車輛使用狀況與里程紀錄正確性</div>
        </div>
      )}
      {lowAlert.length > 0 && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
          <div className="text-xs font-bold text-sky-700 mb-1">💤 低里程車輛（低於平均 20%）</div>
          <div className="flex flex-wrap gap-2">
            {lowAlert.map(r => <span key={r.id} className="text-xs bg-sky-100 text-sky-800 px-2 py-1 rounded font-bold">{r.vehiclePlate} {fmtNum(r.monthlyMileage)} km</span>)}
          </div>
          <div className="text-[10px] text-sky-500 mt-1">可能為維修中或出車次數少，請確認車輛狀態</div>
        </div>
      )}
      <div className="text-[10px] text-gray-500">
        里程分布：0~1,000km <strong>{recWithKm.filter(r=>r.monthlyMileage<1000).length}</strong> 輛 ／
        1,000~3,000 <strong>{recWithKm.filter(r=>r.monthlyMileage>=1000&&r.monthlyMileage<3000).length}</strong> 輛 ／
        3,000~5,000 <strong>{recWithKm.filter(r=>r.monthlyMileage>=3000&&r.monthlyMileage<5000).length}</strong> 輛 ／
        5,000km+ <strong>{recWithKm.filter(r=>r.monthlyMileage>=5000).length}</strong> 輛
      </div>
    </div>
  );
};


const ConflictDisplay = ({ conflictAnalysis, fmtNum }) => {
  if (!conflictAnalysis) return null;
  const { conflicts, suggestions } = conflictAnalysis;
  if (!conflicts || conflicts.length === 0) return null;
  const TYPE_LABEL = {
    DUPLICATE_SAME: { text: '重複回報（相同數值）', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
    PERIOD_CONFLICT: { text: '期別衝突（可覆蓋）', color: 'text-orange-700 bg-orange-50 border-orange-200' },
    REGRESSION: { text: '里程倒退（邏輯錯誤）', color: 'text-red-700 bg-red-50 border-red-200' },
    OVERFLOW: { text: '超越後期紀錄（邏輯錯誤）', color: 'text-red-700 bg-red-50 border-red-200' },
    SPIKE: { text: '里程異常暴增（警告）', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  };
  return (
    <div className="space-y-2 mt-2">
      {conflicts.map((c, i) => {
        const meta = TYPE_LABEL[c.type] || { text: c.type, color: 'text-gray-700 bg-gray-50 border-gray-200' };
        return (
          <div key={i} className={'text-xs border rounded-lg p-2.5 ' + meta.color}>
            <div className="font-bold mb-0.5">{meta.text}</div>
            <div>{c.message}</div>
          </div>
        );
      })}
      {suggestions && suggestions.length > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          {suggestions.map((s, i) => <div key={i}>💡 {s}</div>)}
        </div>
      )}
    </div>
  );
};

const AdhocMileagePreview = ({ adhocStart, adhocEnd }) => {
  const start = parseInt(adhocStart);
  const end = parseInt(adhocEnd);
  if (isNaN(start) || isNaN(end) || end <= start) return null;
  const dist = end - start;
  return (
    <div className="text-xs bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
      本次行駛里程：<span className="font-bold font-mono text-emerald-700">{dist.toLocaleString()}</span> km
    </div>
  );
};


const SubmitButtons = ({ conflictAnalysis, conflictOverrideMode, reportVehicle, reportReading, handleSubmitMonthly, setShowModal, setConflictOverrideMode, setEditingRecord }) => {
  if (conflictOverrideMode) return null;
  const hasBlocking = conflictAnalysis && conflictAnalysis.conflicts.length > 0 && !conflictAnalysis.canOverride;
  const hasOverridable = conflictAnalysis && conflictAnalysis.canOverride;
  const hasWarnOnly = conflictAnalysis && conflictAnalysis.canSubmitWithWarning;
  return (
    <div className="flex gap-3 pt-2">
      <button onClick={() => { setShowModal(null); setConflictOverrideMode(false); setEditingRecord(null); }}
        className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 font-bold text-sm hover:bg-gray-50">取消</button>
      {hasBlocking ? (
        <button disabled className="flex-1 py-2.5 bg-gray-200 text-gray-400 rounded-lg font-bold text-sm cursor-not-allowed">
          ✗ 無法送出（邏輯衝突）
        </button>
      ) : hasOverridable ? (
        <button onClick={() => handleSubmitMonthly(false)}
          className="flex-1 py-2.5 bg-amber-500 text-white rounded-lg font-bold text-sm hover:bg-amber-600">
          ⚠ 送出（覆蓋現有）
        </button>
      ) : hasWarnOnly ? (
        <button onClick={() => handleSubmitMonthly(false)}
          className="flex-1 py-2.5 bg-yellow-400 text-yellow-900 rounded-lg font-bold text-sm hover:bg-yellow-500">
          ⚡ 確認送出（已知警告）
        </button>
      ) : (
        <button onClick={() => handleSubmitMonthly(false)} disabled={!reportVehicle || !reportReading}
          className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg font-bold text-sm hover:bg-emerald-600 disabled:opacity-40">送出回報</button>
      )}
    </div>
  );
};

const PrevMileageHint = ({ reportVehicle, vehicles, getPrevReading, reportPeriod, fmtNum }) => {
  if (!reportVehicle) return null;
  const veh = vehicles.find(v => v.id === reportVehicle);
  const prev = veh ? getPrevReading(veh.plate, reportPeriod) : null;
  if (prev == null) return null;
  return (
    <div className="text-xs bg-blue-50 border border-blue-200 rounded-lg p-2.5">
      上期累計里程：<span className="font-bold font-mono">{fmtNum(prev)}</span> km
    </div>
  );
};


const AdhocVehicleHint = ({ adhocVehicle, vehicles, getLastKnownMileage, fmtNum }) => {
  if (!adhocVehicle) return null;
  const vAd = vehicles.find(x => x.id === adhocVehicle);
  const lkAd = vAd ? getLastKnownMileage(vAd.plate) : null;
  if (lkAd == null) return null;
  return <div className="text-xs bg-blue-50 border border-blue-200 rounded-lg p-2.5">該車最近已知里程：<span className="font-bold font-mono">{fmtNum(lkAd)}</span> km（起始里程不得低於此值）</div>;
};


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
  const [monthlyRecords, setMonthlyRecords] = useState(SEED_MONTHLY_RECORDS);
  const [adhocRecords, setAdhocRecords] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  // ── UI State ────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState('dashboard'); // dashboard | monthly | adhoc | vehicles | personnel | departments | export
  const [selectedPeriod, setSelectedPeriod] = useState(getTaiwanPeriod());
  // 儀表板週期範圍
  const [dashRange, setDashRange] = useState('month'); // month | quarter | year | custom
  const [dashFrom, setDashFrom] = useState('');
  const [dashTo, setDashTo] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [showModal, setShowModal] = useState(null); // null | 'monthly' | 'adhoc' | 'vehicle' | 'person' | 'dept'
  const [editItem, setEditItem] = useState(null);

  // ── Report Form State ───────────────────────────────────────────
  const [reportVehicle, setReportVehicle] = useState('');
  const [reportReading, setReportReading] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  const [reportPeriod, setReportPeriod] = useState(getTaiwanPeriod());
  const [reportProxy, setReportProxy] = useState(''); // 代填：實際回報人 ID

  // ── 衝突分析 state ────────────────────────────────────────────────
  const [conflictOverrideMode, setConflictOverrideMode] = useState(false); // 等待二次確認覆蓋

  // ── 操作記錄 Log ─────────────────────────────────────────────────
  const [auditLog, setAuditLog] = useState([]);
  const [logFilter, setLogFilter] = useState('all');

  // ── 刪除確認 modal ────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── 回報後確認 && 修改 ─────────────────────────────────────────────
  const [lastSubmitted, setLastSubmitted] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  // Adhoc form
  const [adhocVehicle, setAdhocVehicle] = useState('');
  const [adhocDate, setAdhocDate] = useState(new Date().toISOString().slice(0, 10));
  const [adhocStart, setAdhocStart] = useState('');
  const [adhocEnd, setAdhocEnd] = useState('');
  const [adhocPurpose, setAdhocPurpose] = useState('');
  const [adhocNotes, setAdhocNotes] = useState('');
  const [adhocProxy, setAdhocProxy] = useState(''); // 代填：實際使用人 ID
  const [exportType, setExportType] = useState('monthly');
  const [exportRange, setExportRange] = useState('month');
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [exportDept, setExportDept] = useState('all');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDept, setAiDept] = useState('all');
  const [aiPeriod, setAiPeriod] = useState('');

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
      try {
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
      if (monthly) {
        // 合併：Firestore 有的期別以 Firestore 為準，否則保留 seed 資料
        const cloudKeys = new Set(monthly.map(r => r.vehiclePlate + '_' + r.period));
        const seedOnly = SEED_MONTHLY_RECORDS.filter(r => !cloudKeys.has(r.vehiclePlate + '_' + r.period));
        setMonthlyRecords([...seedOnly, ...monthly]);
      }
      if (adhoc) setAdhocRecords(adhoc);
      } catch(e) { console.error('[MileageTool] initial load error:', e); }
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
    // 優先從 monthlyRecords 找前一期記錄
    const rec = monthlyRecords.find(r => r.vehiclePlate === vehiclePlate && r.period === prev);
    if (rec) return rec.odometerReading;
    return null;
  };

  // ── 即時衝突分析（月報表單）─────────────────────────────────────
  const conflictAnalysis = useMemo(() => {
    if (!reportVehicle || !reportPeriod || !reportReading) return null;
    const reading = parseInt(reportReading);
    if (isNaN(reading) || reading <= 0) return null;
    const veh = vehicles.find(v => v.id === reportVehicle);
    if (!veh) return null;

    const relevantRecords = monthlyRecords.filter(r => r.vehiclePlate === veh.plate);

    // 將起始基準納入衝突分析，補登 2026-01 時可偵測 OVERFLOW
    const baseReading = BASELINE_MILEAGE[veh.plate];
    const hasBaseline = relevantRecords.some(r => r.period === BASELINE_PERIOD);
    const allRecords = (baseReading && !hasBaseline)
      ? [...relevantRecords, { id: '__seed_baseline__', vehiclePlate: veh.plate, period: BASELINE_PERIOD, odometerReading: baseReading, retroactive: false, notes: '（起始基準）' }]
      : relevantRecords;
    if (allRecords.length === 0) return null;
    return analyzeConflict(allRecords, veh.plate, reportPeriod, reading);
  }, [reportVehicle, reportPeriod, reportReading, monthlyRecords, vehicles]);

  // ── Get last known mileage for a vehicle (from all sources) ─────
  const getLastKnownMileage = (vehiclePlate) => {
    const readings = [];
    // From monthly records
    monthlyRecords.filter(r => r.vehiclePlate === vehiclePlate).forEach(r => { if (r.odometerReading) readings.push(r.odometerReading); });
    // From trip/adhoc records
    adhocRecords.filter(r => r.vehiclePlate === vehiclePlate).forEach(r => { if (r.endMileage) readings.push(r.endMileage); });

    if (BASELINE_MILEAGE[vehiclePlate]) readings.push(BASELINE_MILEAGE[vehiclePlate]);
    return readings.length > 0 ? Math.max(...readings) : null;
  };

  // ── Submit monthly report ───────────────────────────────────────
  const handleSubmitMonthly = (forceOverride = false) => {
    if (!reportVehicle || !reportReading) return;
    const reading = parseInt(reportReading);
    if (isNaN(reading) || reading < 0) return;

    const veh = vehicles.find(v => v.id === reportVehicle);
    if (!veh) return;

    // ── 衝突判斷 ─────────────────────────────────────────────────
    if (conflictAnalysis && conflictAnalysis.conflicts.length > 0) {
      if (!conflictAnalysis.canOverride) {
        // 邏輯錯誤（倒退 / 超越後期）→ 完全阻擋，不應到達此處（按鈕已 disabled）
        return;
      }
      if (!forceOverride) {
        // 期別衝突，等待使用者在 UI 確認覆蓋
        setConflictOverrideMode(true);
        return;
      }
      // 使用者確認覆蓋：先移除舊記錄
      const filtered = monthlyRecords.filter(r => !(r.vehiclePlate === veh.plate && r.period === reportPeriod));
      const prevReading = getPrevReading(veh.plate, reportPeriod);
      const monthlyMileage = prevReading != null ? reading - prevReading : null;
      const actualPerson = reportProxy ? personnel.find(p => p.id === reportProxy) : currentUser;
      const record = {
        id: `mr_${Date.now()}`,
        vehicleId: veh.id, vehiclePlate: veh.plate,
        reporterId: actualPerson?.id || currentUser.id,
        reporterName: actualPerson?.name || currentUser.name,
        proxyById: reportProxy ? currentUser.id : '',
        proxyByName: reportProxy ? currentUser.name : '',
        period: reportPeriod, odometerReading: reading,
        previousReading: prevReading, monthlyMileage,
        notes: reportNotes || '（補登：覆蓋前期衝突數據）',
        retroactive: reportPeriod < getTaiwanPeriod(),
        status: 'submitted', submittedAt: new Date().toISOString(),
      };
      autoSave('monthly_records', [...filtered, record], setMonthlyRecords);
      logAction('edit', '覆蓋補登', `${veh.plate} ${reportPeriod} → ${fmtNum(reading)} km`);
      setLastSubmitted({ ...record, isOverride: true });
      setReportVehicle(''); setReportReading(''); setReportNotes(''); setReportProxy('');
      setConflictOverrideMode(false);
      setShowModal(null);
      return;
    }

    // ── 無衝突（或僅有軟警告）正常送出 ──────────────────────────
    const prevReading = getPrevReading(veh.plate, reportPeriod);
    const monthlyMileage = prevReading != null ? reading - prevReading : null;

    const actualPerson = reportProxy ? personnel.find(p => p.id === reportProxy) : currentUser;
    const isEdit = editingRecord != null;
    const existingIdx = isEdit
      ? monthlyRecords.findIndex(r => r.id === editingRecord)
      : monthlyRecords.findIndex(r => r.vehiclePlate === veh.plate && r.period === reportPeriod);
    const record = {
      id: existingIdx >= 0 ? monthlyRecords[existingIdx].id : `mr_${Date.now()}`,
      vehicleId: veh.id, vehiclePlate: veh.plate,
      reporterId: actualPerson?.id || currentUser.id,
      reporterName: actualPerson?.name || currentUser.name,
      proxyById: reportProxy ? currentUser.id : '',
      proxyByName: reportProxy ? currentUser.name : '',
      period: reportPeriod, odometerReading: reading,
      previousReading: prevReading, monthlyMileage,
      notes: reportNotes,
      retroactive: reportPeriod < getTaiwanPeriod(),
      status: 'submitted', submittedAt: new Date().toISOString(),
    };

    let newRecords;
    if (existingIdx >= 0) {
      newRecords = [...monthlyRecords];
      newRecords[existingIdx] = record;
    } else {
      newRecords = [...monthlyRecords, record];
    }
    autoSave('monthly_records', newRecords, setMonthlyRecords);
    logAction(isEdit ? 'edit' : 'monthly', isEdit ? '修改回報' : '回報里程',
      `${veh.plate} ${reportPeriod} ${fmtNum(reading)} km（${actualPerson?.name || currentUser.name}）`);
    setLastSubmitted({ ...record, isEdit });
    setReportVehicle(''); setReportReading(''); setReportNotes(''); setReportProxy('');
    setConflictOverrideMode(false); setEditingRecord(null);
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

  // ── 操作記錄 helper ─────────────────────────────────────────────
  const logAction = (category, action, detail) => {
    const entry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      category,   // monthly | adhoc | delete | approve | reject | edit
      action,
      detail,
      operator: currentUser?.name || '—',
      ts: new Date().toISOString(),
    };
    setAuditLog(prev => [entry, ...prev].slice(0, 500)); // 保留最近 500 筆
  };

  // ── Delete ────────────────────────────────────────
  const handleDeleteRecord = (recordId, type) => {
    let label = '';
    if (type === 'monthly') {
      const rec = monthlyRecords.find(r => r.id === recordId);
      label = rec ? `月報 ${rec.vehiclePlate} ${rec.period} ${fmtNum(rec.odometerReading)} km（${rec.reporterName}）` : recordId;
    } else {
      const rec = adhocRecords.find(r => r.id === recordId);
      label = rec ? `用車 ${rec.vehiclePlate} ${rec.date} ${rec.userName}` : recordId;
    }
    setDeleteTarget({ id: recordId, type, label });
  };

  // ── Export functions ──────────────────────────────────────────

  const getExportPeriods = useCallback(() => {
    const all = [...new Set([
      ...monthlyRecords.map(r => r.period),
      ...adhocRecords.map(r => r.date?.slice(0,7)).filter(Boolean)
    ])].sort();
    if (!all.length) return [];
    const latest = all[all.length - 1];
    const [y, m] = latest.split('-').map(Number);

    if (exportRange === 'month') {
      return [latest];
    } else if (exportRange === 'quarter') {
      const q = Math.floor((m - 1) / 3);
      return [0,1,2].map(i => {
        const mm = q * 3 + 1 + i;
        return `${y}-${String(mm).padStart(2,'0')}`;
      }).filter(p => all.includes(p) || monthlyRecords.some(r => r.period === p));
    } else if (exportRange === 'year') {
      return all.filter(p => p.startsWith(String(y)));
    } else if (exportRange === 'custom' && exportFrom && exportTo) {
      return all.filter(p => p >= exportFrom && p <= exportTo);
    }
    return all;
  }, [exportRange, exportFrom, exportTo, monthlyRecords, adhocRecords]);

  const buildExportRows = useCallback((type) => {
    const periods = getExportPeriods();
    if (type === 'monthly') {
      const recs = monthlyRecords
        .filter(r => periods.includes(r.period) &&
          (exportDept === 'all' || vehicles.find(v => v.plate === r.vehiclePlate)?.deptId === exportDept))
        .sort((a, b) => a.period.localeCompare(b.period) || a.vehiclePlate.localeCompare(b.vehiclePlate));
      return {
        headers: ['期別','部門','車牌','累計里程(km)','上期里程(km)','月增幅(km)','回報人','代填人','狀態','備註','回報時間'],
        rows: recs.map(r => [
          r.period,
          vehicles.find(v => v.plate === r.vehiclePlate) ? getDeptName(vehicles.find(v => v.plate === r.vehiclePlate).deptId) : '',
          r.vehiclePlate, r.odometerReading, r.previousReading ?? '', r.monthlyMileage ?? '',
          r.reporterName, r.proxyByName || '',
          '已回報',
          r.notes || '', r.submittedAt?.slice(0,10) || ''
        ]),
        summary: {
          total: recs.reduce((s, r) => s + (r.monthlyMileage || 0), 0),
          avg: recs.filter(r => r.monthlyMileage > 0).length
            ? Math.round(recs.reduce((s, r) => s + (r.monthlyMileage || 0), 0) / recs.filter(r => r.monthlyMileage > 0).length)
            : 0,
          count: recs.length
        }
      };
    } else {
      const recs = adhocRecords
        .filter(r => periods.includes(r.date?.slice(0,7)) &&
          (exportDept === 'all' || vehicles.find(v => v.plate === r.vehiclePlate)?.deptId === exportDept))
        .sort((a, b) => a.date?.localeCompare(b.date));
      return {
        headers: ['日期','部門','車牌','使用人','代填人','起始里程(km)','結束里程(km)','區間里程(km)','事由','狀態','備註'],
        rows: recs.map(r => [
          r.date,
          vehicles.find(v => v.plate === r.vehiclePlate) ? getDeptName(vehicles.find(v => v.plate === r.vehiclePlate).deptId) : '',
          r.vehiclePlate, r.userName, r.proxyByName || '',
          r.startMileage, r.endMileage, r.tripMileage, r.purpose,
          '已回報', r.notes || ''
        ]),
        summary: {
          total: recs.reduce((s, r) => s + (r.tripMileage || 0), 0),
          count: recs.length
        }
      };
    }
  }, [getExportPeriods, monthlyRecords, adhocRecords, exportDept, vehicles]);

  const exportCSV = (type) => {
    const { headers, rows } = buildExportRows(type);
    const BOM = '\uFEFF';
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${type === 'monthly' ? '月報里程' : '用車紀錄'}_${exportRange}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const exportXLSX = async (type) => {
    // 動態載入 SheetJS（避免打包體積問題）
    let XLSX;
    try {
      XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs');
    } catch {
      alert('無法載入 Excel 模組，請確認網路連線後再試。');
      return;
    }
    const { headers, rows, summary } = buildExportRows(type);
    const wsData = [headers, ...rows, [], ['── 統計摘要 ──']];
    if (type === 'monthly') {
      wsData.push(['總里程合計', summary.total + ' km'], ['車均月增幅', summary.avg + ' km'], ['回報筆數', summary.count]);
    } else {
      wsData.push(['用車總里程', summary.total + ' km'], ['紀錄筆數', summary.count]);
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = headers.map((_, i) => ({ wch: i < 2 ? 10 : i < 4 ? 20 : 14 }));
    XLSX.utils.book_append_sheet(wb, ws, type === 'monthly' ? '月報里程' : '用車紀錄');
    XLSX.writeFile(wb, `${type === 'monthly' ? '月報里程' : '用車紀錄'}_${exportRange}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportPDF = (type) => {
    const { headers, rows, summary } = buildExportRows(type);
    const title = type === 'monthly' ? '月報里程報表' : '用車紀錄報表';
    const rangeLabel = { month: '本月', quarter: '本季', year: '本年', custom: '自訂區間' }[exportRange];
    const deptLabel = exportDept === 'all' ? '全部部門' : departments.find(d=>d.id===exportDept)?.name || exportDept;
    // 分析數據
    const recWithKm = type === 'monthly' ? rows.filter(r => (r[5]||0) > 0) : [];
    const kmsArr = recWithKm.map(r => r[5]).sort((a,b)=>a-b);
    const pdfAvg = kmsArr.length ? Math.round(kmsArr.reduce((s,v)=>s+v,0)/kmsArr.length) : 0;
    const pdfMax = kmsArr.length ? kmsArr[kmsArr.length-1] : 0;
    const pdfMin = kmsArr.length ? kmsArr[0] : 0;
    const pdfMed = kmsArr.length ? kmsArr[Math.floor(kmsArr.length/2)] : 0;
    const highRisk = recWithKm.filter(r => r[5] > pdfAvg * 1.8);
    const thCells = headers.map(h => '<th>' + h + '</th>').join('');
    const tbodyRows = rows.map(r =>
      '<tr>' + r.map(c => '<td>' + (c ?? '') + '</td>').join('') + '</tr>'
    ).join('');
    const summaryText = type === 'monthly'
      ? '總里程合計：' + summary.total.toLocaleString() + ' km｜車均月增幅：' + summary.avg.toLocaleString() + ' km｜回報筆數：' + summary.count
      : '用車總里程：' + summary.total.toLocaleString() + ' km｜紀錄筆數：' + summary.count;
    const html = [
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + title + '</title>',
      '<style>',
      '  body { font-family: "Microsoft JhengHei", Arial, sans-serif; font-size: 11px; margin: 20px; }',
      '  h2 { font-size: 15px; margin-bottom: 4px; }',
      '  .meta { color: #666; font-size: 10px; margin-bottom: 14px; }',
      '  table { width: 100%; border-collapse: collapse; }',
      '  th { background: #1e293b; color: #fff; padding: 5px 7px; text-align: left; font-size: 10px; }',
      '  td { border-bottom: 1px solid #e2e8f0; padding: 4px 7px; }',
      '  tr:nth-child(even) td { background: #f8fafc; }',
      '  .summary { margin-top: 14px; background: #f1f5f9; padding: 10px 14px; border-radius: 6px; font-size: 11px; }',
      '  .analysis { margin-top: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }',
      '  .analysis-title { font-size: 11px; font-weight: bold; color: #475569; margin-bottom: 10px; }',
      '  .stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 10px; }',
      '  .stat-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; text-align: center; }',
      '  .stat-label { font-size: 9px; color: #9ca3af; margin-bottom: 4px; }',
      '  .stat-val { font-size: 13px; font-weight: bold; }',
      '  .stat-sub { font-size: 9px; color: #9ca3af; margin-top: 2px; }',
      '  .rose { color: #e11d48; } .blue { color: #2563eb; } .indigo { color: #4f46e5; } .green { color: #059669; }',
      '  .alert { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; padding: 8px 12px; font-size: 10px; color: #be123c; margin-top: 8px; }',
      '  @media print { button { display: none; } }',
      '</style></head><body>',
      '<h2>' + title + '</h2>',
      '<div class="meta">部門：' + deptLabel + '｜範圍：' + rangeLabel + '｜匯出時間：' + new Date().toLocaleString('zh-TW') + '</div>',
      '<table><thead><tr>' + thCells + '</tr></thead>',
      '<tbody>' + tbodyRows + '</tbody></table>',
      '<div class="summary">' + summaryText + '</div>',
      // 分析區塊（月報才顯示）
      type === 'monthly' && recWithKm.length > 0 ? [
        '<div class="analysis"><div class="analysis-title">數據分析摘要</div>',
        '<div class="stat-grid">',
        '<div class="stat-card"><div class="stat-label">最高月增幅</div><div class="stat-val rose">' + pdfMax.toLocaleString() + ' km</div><div class="stat-sub">' + (recWithKm.find(r=>r[5]===pdfMax)?.[2]||'') + '</div></div>',
        '<div class="stat-card"><div class="stat-label">最低月增幅</div><div class="stat-val blue">' + pdfMin.toLocaleString() + ' km</div><div class="stat-sub">' + (recWithKm.find(r=>r[5]===pdfMin)?.[2]||'') + '</div></div>',
        '<div class="stat-card"><div class="stat-label">中位數</div><div class="stat-val indigo">' + pdfMed.toLocaleString() + ' km</div></div>',
        '<div class="stat-card"><div class="stat-label">平均月增幅</div><div class="stat-val green">' + pdfAvg.toLocaleString() + ' km</div><div class="stat-sub">' + recWithKm.length + ' 輛</div></div>',
        '</div>',
        highRisk.length > 0 ? '<div class="alert">⚡ 高里程預警（超過平均 180%）：' + highRisk.map(r=>r[2]+' '+r[5].toLocaleString()+'km').join('、') + '</div>' : '',
        '</div>'
      ].join('') : '',
      '</body></html>'
    ].join('\n');
    // 使用隱藏 iframe 輸入 HTML，避免彈出視窗被欋截
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1200px;height:900px;border:none;opacity:0';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open(); doc.write(html); doc.close();
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch(e) {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
      setTimeout(() => { try { document.body.removeChild(iframe); } catch(e) {} }, 2000);
    }, 400);
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
  // 勾稽：僅供參考，差異屬正常（用車紀錄為選填，不強制等於月增幅）
  const reconciliation = useMemo(() => {
    return periodRecords.map(rec => {
      const tripSum = adhocRecords
        .filter(r => r.vehiclePlate === rec.vehiclePlate && r.date && r.date.startsWith(selectedPeriod))
        .reduce((s, r) => s + (r.tripMileage || 0), 0);
      const odometerDiff = rec.monthlyMileage || 0;
      const gap = odometerDiff - tripSum;
      return { plate: rec.vehiclePlate, odometerDiff, tripSum, gap };
    });
  }, [periodRecords, adhocRecords, selectedPeriod]);

  // ── 儀表板圖表資料 ────────────────────────────────────────────────
  const chartData = useMemo(() => {
    // 月趨勢：最近 6 個月所有車輛加總月增幅
    const periods = [];
    const base = selectedPeriod || '2026-02';
    let [y, m] = base.split('-').map(Number);
    for (let i = 5; i >= 0; i--) {
      let mm = m - i; let yy = y;
      if (mm <= 0) { mm += 12; yy -= 1; }
      periods.push(`${yy}-${String(mm).padStart(2,'0')}`);
    }
    const trendData = periods.map(p => {
      const recs = monthlyRecords.filter(r => r.period === p &&
        (filterDept === 'all' || vehicles.find(v => v.plate === r.vehiclePlate)?.deptId === filterDept));
      const total = recs.reduce((s, r) => s + (r.monthlyMileage || 0), 0);
      const avg = recs.filter(r => (r.monthlyMileage || 0) > 0).length > 0
        ? Math.round(total / recs.filter(r => (r.monthlyMileage || 0) > 0).length) : 0;
      return { period: p.slice(5) + '月', total, avg, count: recs.length };
    });

    // 當期各車里程（前10高）
    const vehicleData = [...periodRecords]
      .filter(r => (r.monthlyMileage || 0) > 0 &&
        (filterDept === 'all' || vehicles.find(v => v.plate === r.vehiclePlate)?.deptId === filterDept))
      .sort((a, b) => (b.monthlyMileage || 0) - (a.monthlyMileage || 0))
      .slice(0, 10)
      .map(r => ({ plate: r.vehiclePlate.replace(/^B/, ''), km: r.monthlyMileage || 0 }));

    return { trendData, vehicleData };
  }, [monthlyRecords, periodRecords, selectedPeriod, filterDept, vehicles]);

  // ── 儀表板週期範圍：計算要顯示的 period 清單 ─────────────────────
  const dashPeriods = useMemo(() => {
    const cur = selectedPeriod || getTaiwanPeriod();
    const [y, m] = cur.split('-').map(Number);
    if (dashRange === 'month') {
      return [cur];
    } else if (dashRange === 'quarter') {
      const qStart = Math.floor((m - 1) / 3) * 3 + 1;
      return [0, 1, 2].map(i => {
        const mm = qStart + i;
        return y + '-' + String(mm).padStart(2, '0');
      });
    } else if (dashRange === 'year') {
      return Array.from({ length: 12 }, (_, i) => y + '-' + String(i + 1).padStart(2, '0'));
    } else if (dashRange === 'custom' && dashFrom && dashTo) {
      const all = [...new Set(monthlyRecords.map(r => r.period))].sort();
      return all.filter(p => p >= dashFrom && p <= dashTo);
    }
    return [cur];
  }, [dashRange, dashFrom, dashTo, selectedPeriod, monthlyRecords]);

  const dashRecords = useMemo(() =>
    monthlyRecords.filter(r =>
      dashPeriods.includes(r.period) &&
      (filterDept === 'all' || vehicles.find(v => v.plate === r.vehiclePlate)?.deptId === filterDept)
    ),
  [monthlyRecords, dashPeriods, filterDept, vehicles]);

  const dashStats = useMemo(() => {
    const activeVehs = vehicles.filter(v => v.status === 'active' && (filterDept === 'all' || v.deptId === filterDept));
    // 回報進度：最新期別
    const latestPeriod = dashPeriods[dashPeriods.length - 1];
    const reportedInLatest = activeVehs.filter(v => dashRecords.some(r => r.vehiclePlate === v.plate && r.period === latestPeriod));
    const missingInLatest = activeVehs.filter(v => !dashRecords.some(r => r.vehiclePlate === v.plate && r.period === latestPeriod));
    const totalKm = dashRecords.reduce((s, r) => s + (r.monthlyMileage || 0), 0);
    const withKm = dashRecords.filter(r => (r.monthlyMileage || 0) > 0);
    const avgKm = withKm.length > 0 ? Math.round(totalKm / withKm.length) : 0;
    const adhocCount = adhocRecords.filter(r =>
      dashPeriods.includes(r.date?.slice(0, 7)) &&
      (filterDept === 'all' || vehicles.find(v => v.plate === r.vehiclePlate)?.deptId === filterDept)
    ).length;
    const adhocKm = adhocRecords
      .filter(r => dashPeriods.includes(r.date?.slice(0, 7)) && (filterDept === 'all' || vehicles.find(v => v.plate === r.vehiclePlate)?.deptId === filterDept))
      .reduce((s, r) => s + (r.tripMileage || 0), 0);
    return { reported: reportedInLatest.length, total: activeVehs.length, missing: missingInLatest, totalKm, avgKm, adhocCount, adhocKm, latestPeriod };
  }, [dashRecords, dashPeriods, vehicles, filterDept, adhocRecords]);


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
      { key: 'logs', icon: '🗂️', label: '操作記錄' },
    ] : []),
    { key: 'export', icon: '⬇️', label: '匯出報表' },
    { key: 'ai', icon: '🤖', label: 'AI 診斷' },
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
            {/* 頂部：標題 + 部門篩選 + 基準期別 */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-bold text-gray-800">儀表板</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs">
                  <option value="all">全部門</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <input type="month" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs" />
              </div>
            </div>

            {/* 週期範圍切換 */}
            <div className="flex items-center gap-2 flex-wrap">
              {[['month','本月'],['quarter','本季'],['year','本年'],['custom','自訂']].map(([v,l]) => (
                <button key={v} onClick={() => setDashRange(v)}
                  className={'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ' + (dashRange === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300')}>
                  {l}
                </button>
              ))}
              {dashRange === 'custom' && <>
                <input type="month" value={dashFrom} onChange={e => setDashFrom(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-xs" />
                <span className="text-gray-400 text-xs">～</span>
                <input type="month" value={dashTo} onChange={e => setDashTo(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-xs" />
              </>}
              <span className="text-[10px] text-gray-400 bg-gray-100 rounded-full px-2 py-1">
                {dashRange === 'month' ? dashPeriods[0]
                  : dashRange === 'quarter' ? dashPeriods[0] + ' ～ ' + dashPeriods[dashPeriods.length-1]
                  : dashRange === 'year' ? (selectedPeriod?.slice(0,4) + ' 全年')
                  : (dashFrom && dashTo ? dashFrom + ' ～ ' + dashTo : '請選擇區間')}
              </span>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">回報進度</div>
                <div className="text-2xl font-bold text-blue-600">{dashStats.reported}/{dashStats.total}</div>
                <div className="text-[10px] text-gray-400 mt-1">{dashStats.total - dashStats.reported} 輛未回報（{dashStats.latestPeriod}）</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">{dashRange === 'month' ? '月' : dashRange === 'quarter' ? '季' : dashRange === 'year' ? '年' : '期間'}總里程</div>
                <div className="text-2xl font-bold text-emerald-600">{fmtNum(dashStats.totalKm)}</div>
                <div className="text-[10px] text-gray-400 mt-1">km（{dashPeriods.length} 期）</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">車均里程</div>
                <div className="text-2xl font-bold text-indigo-600">{dashStats.avgKm > 0 ? fmtNum(dashStats.avgKm) : '—'}</div>
                <div className="text-[10px] text-gray-400 mt-1">km / 車 / 月</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">用車紀錄</div>
                <div className="text-2xl font-bold text-purple-600">{dashStats.adhocCount}</div>
                <div className="text-[10px] text-gray-400 mt-1">{fmtNum(dashStats.adhocKm)} km</div>
              </div>
            </div>

            {/* Missing Reports：只看最新期別 */}
            {dashStats.missing.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-amber-700 mb-2">⚠️ 尚未回報（{dashStats.latestPeriod}）</h3>
                <div className="flex flex-wrap gap-2">
                  {dashStats.missing.map(v => (
                    <span key={v.id} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-lg font-bold">{v.plate}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}


            {/* ── 趨勢圖：最近 6 個月月增幅（純 SVG） ── */}
            {chartData.trendData.some(d => d.total > 0) && <TrendChart trendData={chartData.trendData} />}
            {chartData.vehicleData.length > 0 && <MileageBarChart vehicleData={chartData.vehicleData} period={selectedPeriod} />}
            {/* 勾稽比對：僅管理者可見，標示為「參考資訊」而非異常警告 */}
            {isAdmin && reconciliation.filter(r => r.tripSum > 0).length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-600">🔍 里程勾稽參考（{selectedPeriod}）</span>
                  <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">僅限管理者</span>
                </div>
                <div className="text-[10px] text-slate-400">月增幅 vs 用車紀錄里程加總。用車紀錄屬選填，差異屬正常現象，此表僅供參考。</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-slate-200">
                      <th className="text-left px-3 py-2 font-bold text-slate-500">車牌</th>
                      <th className="text-right px-3 py-2 font-bold text-slate-500">月增幅</th>
                      <th className="text-right px-3 py-2 font-bold text-slate-500">用車里程加總</th>
                      <th className="text-right px-3 py-2 font-bold text-slate-500">差值</th>
                    </tr></thead>
                    <tbody>
                      {reconciliation.filter(r => r.tripSum > 0).map(r => (
                        <tr key={r.plate} className="border-b border-slate-100">
                          <td className="px-3 py-2 font-bold text-slate-700">{r.plate}</td>
                          <td className="px-3 py-2 text-right font-mono text-slate-600">{fmtNum(r.odometerDiff)}</td>
                          <td className="px-3 py-2 text-right font-mono text-slate-600">{fmtNum(r.tripSum)}</td>
                          <td className="px-3 py-2 text-right font-mono text-slate-400">{r.gap > 0 ? '+' : ''}{fmtNum(r.gap)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* ═══ 儀表板數據分析 ═══ */}
            <DashAnalysis dashRecords={dashRecords} fmtNum={fmtNum} />

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
                                  <button onClick={() => { const veh2 = vehicles.find(v => v.id === rec.vehicleId); setEditingRecord(rec.id); setReportVehicle(rec.vehicleId); setReportPeriod(rec.period); setReportReading(String(rec.odometerReading)); setReportNotes(rec.notes || ''); setShowModal('monthly'); }} className="text-[10px] px-2 py-1 bg-blue-50 text-blue-600 rounded font-bold hover:bg-blue-100">改</button>
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
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
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
                    
                    <th className="text-right px-4 py-3 font-bold text-gray-600">起始基準里程</th>
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
                      <td className="px-4 py-3 text-right font-mono text-gray-500">{fmtNum(BASELINE_MILEAGE[v.plate])}</td>
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

          {/* ═══ LOGS ═══ */}
          {activeSection === 'logs' && isAdmin && <>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-bold text-gray-800">🗂️ 操作記錄</h2>
              <div className="flex items-center gap-2">
                <select value={logFilter} onChange={e => setLogFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs">
                  <option value="all">全部類型</option>
                  <option value="monthly">里程回報</option>
                  <option value="edit">修改 / 覆蓋</option>
                  <option value="approve">審核通過</option>
                  <option value="delete">刪除</option>
                </select>
                <span className="text-xs text-gray-400">共 {auditLog.filter(l => logFilter === 'all' || l.category === logFilter).length} 筆</span>
              </div>
            </div>
            {auditLog.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
                目前尚無操作記錄。回報里程、審核、刪除等操作均會在此留下記錄。
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-bold text-gray-600">時間</th>
                      <th className="text-left px-4 py-3 font-bold text-gray-600">類型</th>
                      <th className="text-left px-4 py-3 font-bold text-gray-600">操作</th>
                      <th className="text-left px-4 py-3 font-bold text-gray-600">明細</th>
                      <th className="text-left px-4 py-3 font-bold text-gray-600">操作人</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog
                      .filter(l => logFilter === 'all' || l.category === logFilter)
                      .map((l, i) => {
                        const catStyle = {
                          monthly: 'bg-blue-100 text-blue-700',
                          edit: 'bg-purple-100 text-purple-700',
                          approve: 'bg-green-100 text-green-700',
                          delete: 'bg-gray-200 text-gray-600',
                        }[l.category] || 'bg-gray-100 text-gray-500';
                        const ts = new Date(l.ts);
                        const timeStr = `${ts.getFullYear()}-${String(ts.getMonth()+1).padStart(2,'0')}-${String(ts.getDate()).padStart(2,'0')} ${String(ts.getHours()).padStart(2,'0')}:${String(ts.getMinutes()).padStart(2,'0')}:${String(ts.getSeconds()).padStart(2,'0')}`;
                        return (
                          <tr key={l.id} className={`border-b border-gray-100 ${i % 2 === 0 ? '' : 'bg-gray-50'}`}>
                            <td className="px-4 py-2.5 font-mono text-gray-500 whitespace-nowrap">{timeStr}</td>
                            <td className="px-4 py-2.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catStyle}`}>{l.action}</span>
                            </td>
                            <td className="px-4 py-2.5 text-gray-700 font-bold">{l.action}</td>
                            <td className="px-4 py-2.5 text-gray-500">{l.detail}</td>
                            <td className="px-4 py-2.5 text-gray-600">{l.operator}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </>}

          {/* ═══ EXPORT ═══ */}
          {activeSection === 'export' && (true) && (() => {
            const { summary, rows, headers } = buildExportRows(exportType);
            const expPeriods = getExportPeriods();
            const recWithKm = exportType === 'monthly' ? rows.filter(r => (r[5]||0) > 0) : [];
            const kms = recWithKm.map(r => r[5]).sort((a,b)=>a-b);
            const expAvg = kms.length ? Math.round(kms.reduce((s,v)=>s+v,0)/kms.length) : 0;
            const expMax = kms.length ? kms[kms.length-1] : 0;
            const expMin = kms.length ? kms[0] : 0;
            const expMed = kms.length ? kms[Math.floor(kms.length/2)] : 0;
            const highRiskRows = recWithKm.filter(r => r[5] > expAvg * 1.8);
            const deptLabel = exportDept === 'all' ? '全部部門' : departments.find(d=>d.id===exportDept)?.name || exportDept;
            return (<>
            <h2 className="text-lg font-bold text-gray-800">匯出報表</h2>

            {/* 匯出設定 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
              <div className="font-bold text-sm text-gray-700">⚙️ 匯出設定</div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">資料類型</label>
                  <div className="flex gap-2">
                    {[['monthly','📋 月報里程'],['adhoc','🚗 用車紀錄']].map(([v,l]) => (
                      <button key={v} onClick={() => setExportType(v)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${exportType === v ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">部門篩選</label>
                  <select value={exportDept} onChange={e => setExportDept(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-400">
                    <option value="all">全部部門</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">時間範圍</label>
                  <div className="grid grid-cols-4 gap-1">
                    {[['month','本月'],['quarter','本季'],['year','本年'],['custom','自訂']].map(([v,l]) => (
                      <button key={v} onClick={() => setExportRange(v)}
                        className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${exportRange === v ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {exportRange === 'custom' && (
                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">起始期別</label>
                    <input type="month" value={exportFrom} onChange={e => setExportFrom(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-400" />
                  </div>
                  <div className="mt-4 text-gray-400">～</div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">結束期別</label>
                    <input type="month" value={exportTo} onChange={e => setExportTo(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-400" />
                  </div>
                </div>
              )}
            </div>

            {/* 統計摘要預覽 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="text-xs text-slate-600 flex flex-wrap gap-5">
                <span>📋 部門：<strong className="text-indigo-700">{deptLabel}</strong></span>
                <span>📅 期別：<strong>{expPeriods.join('、') || '—'}</strong></span>
                <span>筆數：<strong>{summary.count}</strong></span>
                {exportType === 'monthly' && <span>總里程：<strong>{fmtNum(summary.total)} km</strong></span>}
                {exportType === 'monthly' && <span>車均月增幅：<strong>{fmtNum(summary.avg)} km</strong></span>}
                {exportType === 'adhoc' && <span>用車總里程：<strong>{fmtNum(summary.total)} km</strong></span>}
              </div>
              {/* 月報里程分析預覽 */}
              {exportType === 'monthly' && recWithKm.length > 0 && (
                <div className="border-t border-slate-200 pt-3 space-y-2">
                  <div className="text-xs font-bold text-slate-600">📊 本次匯出數據分析</div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {[
                      { label: '最高月增幅', value: fmtNum(expMax)+' km', color:'text-rose-600' },
                      { label: '最低月增幅', value: fmtNum(expMin)+' km', color:'text-blue-600' },
                      { label: '中位數', value: fmtNum(expMed)+' km', color:'text-indigo-600' },
                      { label: '平均月增幅', value: fmtNum(expAvg)+' km', color:'text-emerald-600' },
                    ].map((s,i) => (
                      <div key={i} className="bg-white border border-slate-100 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-gray-400">{s.label}</div>
                        <div className={'text-sm font-bold '+s.color}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  {highRiskRows.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-xs">
                      <span className="font-bold text-rose-700">⚡ 高里程預警（超平均180%）：</span>
                      {highRiskRows.map((r,i) => <span key={i} className="ml-1 bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-mono">{r[2]} {fmtNum(r[5])}km</span>)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 匯出格式按鈕 */}
            <div className="grid grid-cols-3 gap-4">
              <button onClick={() => exportXLSX(exportType)}
                className="flex flex-col items-center gap-2 bg-white border border-gray-200 rounded-xl p-5 hover:border-green-400 hover:shadow-md transition-all group">
                <span className="text-2xl">📗</span>
                <span className="text-sm font-bold text-gray-700 group-hover:text-green-600">Excel (.xlsx)</span>
                <span className="text-[10px] text-gray-400">含統計摘要與分析，可直接用試算表開啟</span>
              </button>
              <button onClick={() => exportPDF(exportType)}
                className="flex flex-col items-center gap-2 bg-white border border-gray-200 rounded-xl p-5 hover:border-red-400 hover:shadow-md transition-all group">
                <span className="text-2xl">📕</span>
                <span className="text-sm font-bold text-gray-700 group-hover:text-red-600">PDF 列印</span>
                <span className="text-[10px] text-gray-400">含數據分析區塊，開啟列印視窗</span>
              </button>
              <button onClick={() => exportCSV(exportType)}
                className="flex flex-col items-center gap-2 bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all group">
                <span className="text-2xl">📄</span>
                <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600">CSV 純文字</span>
                <span className="text-[10px] text-gray-400">通用格式，適合進一步處理</span>
              </button>
            </div>
            </>);
          })()}

        </div>
      </div>

      {/* ═══ MODALS ═══ */}

          {activeSection === 'ai' && (() => {
            const runAiAnalysis = async () => {
              setAiLoading(true); setAiAnalysis('');
              const targetPeriod = aiPeriod || selectedPeriod;
              const deptFilter = aiDept === 'all' ? null : aiDept;
              const filteredRecs = monthlyRecords.filter(r =>
                r.period === targetPeriod &&
                (!deptFilter || vehicles.find(v => v.plate === r.vehiclePlate)?.deptId === deptFilter)
              );
              const recWithKm = filteredRecs.filter(r => (r.monthlyMileage||0) > 0);
              const kms = recWithKm.map(r => r.monthlyMileage).sort((a,b)=>a-b);
              const avg = kms.length ? Math.round(kms.reduce((s,v)=>s+v,0)/kms.length) : 0;
              const total = kms.reduce((s,v)=>s+v,0);
              const deptLabel = aiDept === 'all' ? '全部部門' : departments.find(d=>d.id===aiDept)?.name || aiDept;
              const top5 = [...recWithKm].sort((a,b)=>(b.monthlyMileage||0)-(a.monthlyMileage||0)).slice(0,5);
              const bottom5 = [...recWithKm].sort((a,b)=>(a.monthlyMileage||0)-(b.monthlyMileage||0)).slice(0,5);
              const anomalies = recWithKm.filter(r => r.monthlyMileage > avg * 2.0);
              const prompt = `你是一位專業的物流車隊管理顧問，請根據以下里程數據進行專業診斷分析，並以繁體中文（台灣用語）回覆。

【資料範圍】
- 期別：${targetPeriod}
- 部門：${deptLabel}
- 有效回報車輛數：${recWithKm.length} 輛

【關鍵指標】
- 總月增幅里程：${total.toLocaleString()} km
- 平均月增幅：${avg.toLocaleString()} km/輛
- 最高 5 輛（車牌 里程）：${top5.map(r=>r.vehiclePlate+' '+r.monthlyMileage+'km').join('、')}
- 最低 5 輛（車牌 里程）：${bottom5.map(r=>r.vehiclePlate+' '+r.monthlyMileage+'km').join('、')}
- 異常高里程車輛（>平均 200%）：${anomalies.length > 0 ? anomalies.map(r=>r.vehiclePlate+' '+r.monthlyMileage+'km').join('、') : '無'}

【請依序提供以下分析】：
1. **整體狀況評估**：本期車隊運作總體評估（100字以內）
2. **異常車輛分析**：針對高里程與低里程車輛的可能成因與風險提示
3. **管理建議**：至少 3 條具體可執行的管理改善建議
4. **下期預測**：根據趨勢，下期需注意的重點`;
              try {
                // 透過 Vercel Serverless Proxy 呼叫（API Key 安全存放於後端環境變數）
                const res = await fetch('/api/ai-diagnose', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ prompt })
                });
                const data = await res.json();
                if (!res.ok) {
                  setAiAnalysis('❌ ' + (data.error || '分析失敗，請稍後再試'));
                } else {
                  setAiAnalysis(data.result || '（AI 未回傳結果）');
                }
              } catch(e) {
                setAiAnalysis('❌ 網路錯誤：' + e.message);
              }
              setAiLoading(false);
            };
            return (
              <div className="space-y-4 pb-10">
                <h2 className="text-lg font-bold text-gray-800">🤖 AI 物流診斷分析</h2>

                {/* 設定區 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                  <div className="font-bold text-sm text-gray-700">⚙️ 分析設定</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1.5">分析期別</label>
                      <input type="month" value={aiPeriod || selectedPeriod} onChange={e => setAiPeriod(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 block mb-1.5">部門</label>
                      <select value={aiDept} onChange={e => setAiDept(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400">
                        <option value="all">全部部門</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <button onClick={runAiAnalysis} disabled={aiLoading}
                    className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl text-sm hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-md">
                    {aiLoading ? '⏳ AI 分析中（約 10 秒）...' : '🚀 開始 AI 診斷分析'}
                  </button>
                </div>

                {/* 分析結果 */}
                {aiAnalysis && (
                  <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">🤖</span>
                      <div className="font-bold text-gray-800">AI 診斷報告</div>
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Claude Sonnet</span>
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[60vh]">
                      {aiAnalysis}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

      {showModal === 'monthly' && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => { setShowModal(null); setConflictOverrideMode(false); setEditingRecord(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-4 lg:p-6 space-y-3 lg:space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-800">{editingRecord ? '✏️ 修改里程回報' : '📋 回報月里程'}</h3>
              {reportPeriod < getTaiwanPeriod() && (
                <span className="text-xs bg-amber-100 text-amber-700 border border-amber-300 rounded-full px-2.5 py-0.5 font-bold">補登前期</span>
              )}
            </div>

            <div className="space-y-3">
              {/* 期別 */}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">期別</label>
                <input type="month" value={reportPeriod} onChange={e => { setReportPeriod(e.target.value); setConflictOverrideMode(false); }}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-emerald-500 outline-none" />
              </div>

              {/* 車輛 */}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">車輛 *</label>
                <select value={reportVehicle} onChange={e => { setReportVehicle(e.target.value); setConflictOverrideMode(false); }}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-emerald-500 outline-none">
                  <option value="">選擇車輛</option>
                  {vehicles.filter(v => v.status === 'active').map(v => (
                    <option key={v.id} value={v.id}>{v.plate} ({getDeptName(v.deptId)})</option>
                  ))}
                </select>
              </div>

              {/* 上期里程提示 */}
              {reportVehicle && <PrevMileageHint reportVehicle={reportVehicle} vehicles={vehicles} getPrevReading={getPrevReading} reportPeriod={reportPeriod} fmtNum={fmtNum} />}
              {/* 里程輸入 */}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">本期累計里程表讀數 *（km）</label>
                <input type="number" value={reportReading} onChange={e => { setReportReading(e.target.value); setConflictOverrideMode(false); }}
                  placeholder="例：45230"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-emerald-500 outline-none font-mono" />
              </div>

              {/* ══ 衝突分析面板 ══ */}
              <ConflictDisplay conflictAnalysis={conflictAnalysis} fmtNum={fmtNum} />
              {/* 代填 */}
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

              {/* 備註 */}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">備註</label>
                <input value={reportNotes} onChange={e => setReportNotes(e.target.value)}
                  placeholder="選填（補登請說明原因）"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-emerald-500 outline-none" />
              </div>
            </div>

            {/* ══ 覆蓋確認區塊 ══ */}
            {conflictOverrideMode && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-2">
                <p className="text-sm font-bold text-amber-800">確認覆蓋現有數據？</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  將刪除 {reportPeriod} 現有里程記錄，以 {fmtNum(parseInt(reportReading))} km 取代，此動作無法還原。
                </p>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => handleSubmitMonthly(true)}
                    className="flex-1 py-2 bg-amber-500 text-white rounded-lg font-bold text-sm hover:bg-amber-600">確認覆蓋</button>
                  <button onClick={() => setConflictOverrideMode(false)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 font-bold text-sm hover:bg-gray-50">取消</button>
                </div>
              </div>
            )}

            {/* ══ 主按鈕 ══ */}
            <SubmitButtons conflictAnalysis={conflictAnalysis} conflictOverrideMode={conflictOverrideMode} reportVehicle={reportVehicle} reportReading={reportReading} handleSubmitMonthly={handleSubmitMonthly} setShowModal={setShowModal} setConflictOverrideMode={setConflictOverrideMode} setEditingRecord={setEditingRecord} />          </div>
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
              {adhocVehicle && <AdhocVehicleHint adhocVehicle={adhocVehicle} vehicles={vehicles} getLastKnownMileage={getLastKnownMileage} fmtNum={fmtNum} />}
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
              {adhocStart && adhocEnd && <AdhocMileagePreview adhocStart={adhocStart} adhocEnd={adhocEnd} />}              <div>
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

      {/* ═══ 刪除確認 Modal ═══ */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500 text-xl flex-shrink-0">🗑</div>
              <div>
                <h3 className="text-base font-bold text-gray-800">確認刪除</h3>
                <p className="text-xs text-gray-500 mt-0.5">此操作將由管理者記錄，無法復原</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 font-mono">
              {deleteTarget.label}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 font-bold text-sm hover:bg-gray-50">取消</button>
              <button onClick={doDelete}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-bold text-sm hover:bg-red-600">確認刪除</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 回報後確認 Toast Banner ═══ */}
      {lastSubmitted && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9998] w-full max-w-md px-4">
          <div className="bg-white border border-emerald-300 shadow-xl rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0">✓</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">
                  {lastSubmitted.isEdit ? '修改已送出' : lastSubmitted.isOverride ? '覆蓋完成' : '回報成功，請確認數據'}
                </p>
                <div className="mt-1.5 text-xs text-gray-600 space-y-0.5">
                  <div className="flex gap-4">
                    <span className="text-gray-400">車牌</span>
                    <span className="font-mono font-bold">{lastSubmitted.vehiclePlate}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-gray-400">期別</span>
                    <span className="font-mono">{lastSubmitted.period}</span>
                    {lastSubmitted.retroactive && <span className="text-amber-600 font-bold">（補登）</span>}
                  </div>
                  <div className="flex gap-4">
                    <span className="text-gray-400">里程</span>
                    <span className="font-mono font-bold text-blue-600">{fmtNum(lastSubmitted.odometerReading)} km</span>
                    {lastSubmitted.monthlyMileage != null && (
                      <span className="text-gray-500">本月 +{fmtNum(lastSubmitted.monthlyMileage)} km</span>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <span className="text-gray-400">回報人</span>
                    <span>{lastSubmitted.reporterName}{lastSubmitted.proxyByName ? `（${lastSubmitted.proxyByName} 代填）` : ''}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => {
                  setEditingRecord(lastSubmitted.id);
                  const veh = vehicles.find(v => v.plate === lastSubmitted.vehiclePlate);
                  if (veh) setReportVehicle(veh.id);
                  setReportPeriod(lastSubmitted.period);
                  setReportReading(String(lastSubmitted.odometerReading));
                  setReportNotes(lastSubmitted.notes || '');
                  setLastSubmitted(null);
                  setShowModal('monthly');
                }}
                className="flex-1 py-2 border border-blue-300 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50">
                ✏️ 數據有誤，修改
              </button>
              <button onClick={() => setLastSubmitted(null)}
                className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600">
                ✓ 確認無誤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MileageTool;
