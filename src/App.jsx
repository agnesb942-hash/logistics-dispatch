import { useState } from "react";

const COLORS = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316','#6366f1'];

const mockStats = [
  { id: 0, name: '車輛 A', count: 52, estKm: 118.4, color: COLORS[0] },
  { id: 1, name: '車輛 B', count: 48, estKm: 103.7, color: COLORS[1] },
  { id: 2, name: '車輛 C', count: 55, estKm: 126.2, color: COLORS[2] },
  { id: 3, name: '車輛 D', count: 50, estKm: 110.9, color: COLORS[3] },
  { id: 4, name: '車輛 E', count: 47, estKm: 98.5,  color: COLORS[4] },
  { id: 5, name: '車輛 F', count: 51, estKm: 112.1, color: COLORS[5] },
  { id: 6, name: '車輛 G', count: 53, estKm: 121.3, color: COLORS[6] },
  { id: 7, name: '車輛 H', count: 52, estKm: 116.8, color: COLORS[7] },
];

const mockPoints = [
  { name: '國貫機電(尚億)', address: '臺南市安南區工業一路18號', route: '善化線', isManual: false },
  { name: '久豐科技股份有限公司', address: '臺南市安南區工業二路100號', route: '善化線', isManual: false },
  { name: '展立光學', address: '臺南市安南區工業二路58號', route: '善化線', isManual: true },
  { name: '冠毅國際', address: '臺南市安南區工業三路85號', route: '善化線', isManual: false },
];

export default function InterfacePreview() {
  const [activeTab, setActiveTab] = useState('settings');
  const [activeCluster, setActiveCluster] = useState(null);
  const [vehicleCount, setVehicleCount] = useState(8);
  const [balanceMode, setBalanceMode] = useState('combined');
  const [activeRegion, setActiveRegion] = useState('tainan');
  const [lookupAddr, setLookupAddr] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const maxCount = 55, minCount = 47;
  const stdDev = '2.8';
  const kmGap = '27.7';
  const minKm = 98.5, maxKm = 126.2;

  const mockLookup = () => {
    if (!lookupAddr.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const ok = Math.random() > 0.35;
      setLookupResult({
        ok,
        msg: ok ? '✅ 可配送' : '❌ 超出配送範圍',
        route: ok ? '善化線' : null,
        nearestName: '國貫機電(尚億)',
        distKm: (4.2 + Math.random() * 6).toFixed(1),
        roundTrip: (18 + Math.random() * 14).toFixed(1),
        resolved: lookupAddr + ', 臺南市, 台灣',
        trafficNote: '（估算值）',
      });
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-sm overflow-hidden">

      {/* ===== 左側控制面板 ===== */}
      <div className="w-96 flex flex-col bg-white shadow-xl overflow-hidden flex-shrink-0">

        {/* 標題 */}
        <div className="p-5 bg-slate-800 text-white flex-shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-blue-400 text-xl">🚛</span>
            <h1 className="text-lg font-bold tracking-wide">智能配送派車系統</h1>
          </div>
          <div className="text-xs text-slate-400">
            {activeRegion === 'tainan' ? '台南區' : '嘉義區'} ·{' '}
            <span className="text-white font-bold">{activeRegion === 'tainan' ? 408 : 217}</span> 筆
          </div>
        </div>

        {/* 數據卡片 */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border-b border-gray-200 flex-shrink-0">
          {[
            { label: '單量最大落差', value: maxCount - minCount, color: maxCount - minCount > 20 ? 'text-red-500' : 'text-green-600', suffix: '' },
            { label: '區域標準差',   value: stdDev,              color: 'text-slate-700',  suffix: '' },
            { label: '里程最大落差', value: kmGap,               color: parseFloat(kmGap) > 30 ? 'text-red-500' : 'text-green-600', suffix: 'km' },
            { label: '里程範圍',     value: `${minKm}~${maxKm}`, color: 'text-slate-700',  suffix: 'km', small: true },
          ].map(c => (
            <div key={c.label} className="text-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
              <div className="text-[10px] text-gray-500 font-bold mb-1">{c.label}</div>
              <div className={`${c.small ? 'text-sm' : 'text-xl'} font-black ${c.color}`}>
                {c.value} {c.suffix && <span className="text-xs font-bold text-gray-400">{c.suffix}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* 分頁 */}
        <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
          <button onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2.5 text-sm font-bold transition-all border-b-2 ${activeTab === 'settings' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500'}`}>
            🚛 派車設定
          </button>
          <button onClick={() => setActiveTab('lookup')}
            className={`flex-1 py-2.5 text-sm font-bold transition-all border-b-2 ${activeTab === 'lookup' ? 'border-amber-500 text-amber-600 bg-amber-50/50' : 'border-transparent text-gray-500'}`}>
            📦 指送查詢
          </button>
        </div>

        {/* 捲動區域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">

          {/* === 派車設定 === */}
          {activeTab === 'settings' && <>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">

              {/* 區域切換 */}
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-2">配送區域切換</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[['tainan','台南區 (408)'],['chiayi','嘉義區 (217)']].map(([k,l]) => (
                    <button key={k} onClick={() => setActiveRegion(k)}
                      className={`py-2 px-3 rounded-lg text-sm font-bold transition-all border ${activeRegion === k ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-300'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* 資料管理 */}
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="text-lg leading-none">+</span> 新增點位
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold bg-white text-gray-700 border border-gray-300 shadow-sm">
                  📊 匯入檔案
                </button>
              </div>
              <div className="text-[10px] text-gray-400 leading-relaxed bg-gray-50 p-2 rounded border border-gray-100">
                📋 匯入格式：客戶簡稱 | 配送路線說明 | 送貨地址 | 經緯度<br/>
                支援 .xlsx .csv .tsv .txt，第一列標題自動跳過
              </div>

              {/* 車隊規模 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-gray-700 font-bold text-sm">車隊規模配置</label>
                  <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{vehicleCount} 台</span>
                </div>
                <input type="range" min="1" max="10" value={vehicleCount} onChange={e => setVehicleCount(+e.target.value)}
                  className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>

              {/* 均分模式 */}
              <div className="space-y-2">
                <label className="text-sm text-gray-700 font-bold">均分模式</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[['points','依點數'],['mileage','依里程'],['combined','綜合均分']].map(([k,l]) => (
                    <button key={k} onClick={() => setBalanceMode(k)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${balanceMode === k ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-300'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 各車輛指派結果 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold text-gray-800">各車輛指派結果</h2>
                <button onClick={() => setActiveCluster(null)} className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">顯示全區</button>
              </div>
              {mockStats.slice(0, vehicleCount).map(stat => (
                <div key={stat.id} onClick={() => setActiveCluster(stat.id === activeCluster ? null : stat.id)}
                  className={`cursor-pointer rounded-xl border p-3 transition-all shadow-sm bg-white ${activeCluster === stat.id ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-200 hover:border-blue-300'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: stat.color }}></div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm">{stat.name}</h3>
                        <div className="text-[11px] text-gray-500 mt-0.5 flex gap-2">
                          <span>單量: <strong className="text-gray-700">{stat.count}</strong></span>
                          <span>·</span>
                          <span>里程: <strong className="text-gray-700">{stat.estKm.toFixed(1)}</strong> km</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-gray-300 text-lg">⬡</span>
                  </div>
                </div>
              ))}
              {activeCluster !== null && (
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl space-y-2">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">☰ 任務清單</h3>
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {mockPoints.map(p => (
                      <div key={p.name} className={`bg-white p-2.5 rounded-lg border text-xs shadow-sm ${p.isManual ? 'border-orange-300 bg-orange-50/30' : 'border-gray-200'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-gray-800">{p.name}</span>
                          {p.isManual && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">手動指定</span>}
                        </div>
                        <span className="text-gray-500">{p.address}</span>
                        <div className="text-[10px] text-gray-400 mt-1">原配置路線: {p.route}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>}

          {/* === 指送查詢 === */}
          {activeTab === 'lookup' && <>
            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-amber-700 border-b border-amber-100 pb-2">📦 指送地址可行性查詢</h3>
              <p className="text-xs text-gray-500 leading-relaxed">輸入客戶詢問的配送地址，系統自動比對全區 625 筆建檔點位，判斷是否在配送範圍內（往返 ≤ 25 分鐘）。</p>
              <div className="flex gap-2">
                <input value={lookupAddr} onChange={e => setLookupAddr(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && mockLookup()}
                  placeholder="例：臺南市善化區中正路100號"
                  className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" />
                <button onClick={mockLookup} disabled={loading || !lookupAddr.trim()}
                  className="px-4 py-2.5 rounded-lg bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 disabled:opacity-50 flex-shrink-0 min-w-[60px] flex items-center justify-center">
                  {loading ? <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></div> : '查詢'}
                </button>
              </div>

              {lookupResult && (
                <div className={`p-4 rounded-xl text-sm space-y-2 ${lookupResult.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className={`font-bold text-lg ${lookupResult.ok ? 'text-green-700' : 'text-red-700'}`}>{lookupResult.msg}</div>
                  {lookupResult.route && (
                    <div className="text-green-800 font-bold">建議由「<span className="text-green-600 bg-green-100 px-2 py-0.5 rounded">{lookupResult.route}</span>」承接配送</div>
                  )}
                  {lookupResult.nearestName && (
                    <div className="text-gray-600 text-xs space-y-1.5 pt-2 border-t border-gray-200 mt-2">
                      <div className="flex justify-between"><span className="text-gray-400">最近建檔點位</span><span className="font-bold text-gray-700">{lookupResult.nearestName}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">實際路程距離（單程）</span><span className="font-bold text-gray-700">{lookupResult.distKm} km</span></div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">預估往返時間</span>
                        <span className={`font-bold ${lookupResult.ok ? 'text-green-700' : 'text-red-600'}`}>
                          {lookupResult.roundTrip} 分鐘
                          <span className="ml-1 text-[10px] font-normal text-gray-400">{lookupResult.trafficNote}</span>
                        </span>
                      </div>
                      <div className="text-gray-400 text-[10px] mt-2 p-2 bg-gray-50 rounded">🗺️ 系統定位：{lookupResult.resolved}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1.5">
              <h4 className="text-xs font-bold text-gray-600">計算說明</h4>
              <div className="text-[10px] text-gray-400 leading-relaxed space-y-1">
                <div>• 地址轉座標：Google Maps Geocoding API（台灣完整覆蓋）</div>
                <div>• 距離公式：Haversine 直線距離 × 1.3 路網修正係數</div>
                <div>• 往返時間：路程距離 × 2 ÷ 平均車速 35 km/h</div>
                <div>• 門檻設定：往返 ≤ 25 分鐘判定為可配送</div>
              </div>
            </div>
          </>}
        </div>

        {/* 底部按鈕 */}
        <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0 grid grid-cols-2 gap-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button className="flex items-center justify-center gap-1.5 bg-gray-100 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-xs font-bold">
            ↻ 重新運算
          </button>
          <button className="flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-blue-700">
            ⬇ 匯出報表
          </button>
        </div>
      </div>

      {/* ===== 右側地圖區域 ===== */}
      <div className="flex-1 relative bg-slate-200 overflow-hidden">

        {/* 右上角系統操作提示 */}
        <div className="absolute top-4 right-4 z-10 bg-white rounded-xl shadow-lg p-4 w-72 text-xs space-y-2 border border-gray-100">
          <div className="flex items-center gap-2 font-bold text-gray-700 mb-2">
            <span>🧭</span> 系統操作提示
          </div>
          <div className="text-gray-500 leading-relaxed">• 調整左側滑桿可即時重畫區域。</div>
          <div className="text-gray-500 leading-relaxed">• <strong>手動微調</strong>：在地圖上點擊標點，即可強制將該客戶指派給特定司機。</div>
          <div className="text-gray-500 leading-relaxed">• 按下重新運算，將會清除所有微調並解除零。</div>
          <div className="flex flex-col gap-2 mt-3">
            <button className="w-full py-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs hover:bg-indigo-100 transition-all">
              📊 隨選勢力範圍圖
            </button>
            <button className="w-full py-2 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 font-bold text-xs hover:bg-gray-100 transition-all">
              📍 顯示行政區界
            </button>
          </div>
        </div>

        {/* 地圖底色模擬 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="text-6xl opacity-20">🗺️</div>
            <div className="text-gray-400 font-bold text-sm opacity-60">Leaflet 地圖（實際部署版本）</div>
            <div className="text-gray-300 text-xs opacity-60">logistics-dispatch.vercel.app</div>
          </div>
        </div>

        {/* 縮放控制按鈕（模擬 Leaflet） */}
        <div className="absolute top-4 left-4 flex flex-col gap-0.5">
          <button className="w-8 h-8 bg-white shadow rounded text-gray-700 font-bold text-lg hover:bg-gray-50 border border-gray-200 flex items-center justify-center">+</button>
          <button className="w-8 h-8 bg-white shadow rounded text-gray-700 font-bold text-lg hover:bg-gray-50 border border-gray-200 flex items-center justify-center">−</button>
        </div>

        {/* 右下浮水印 */}
        <div className="absolute bottom-3 right-3 text-[10px] text-gray-300">Leaflet | © CARTO</div>
      </div>
    </div>
  );
}
