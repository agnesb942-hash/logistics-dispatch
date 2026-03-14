// api/google-geo.js
// Vercel Serverless Function — Google Maps API Proxy
// 解決前端直接呼叫 Google REST API 被 CORS 阻擋的問題
//
// 環境變數設定（Vercel Dashboard → Settings → Environment Variables）：
//   GOOGLE_MAPS_API_KEY = AIzaSy...
//   ALLOWED_ORIGIN     = https://your-domain.vercel.app（選填，預設 '*'）

const ORIGIN = process.env.ALLOWED_ORIGIN || '*';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', ORIGIN);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', ORIGIN);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { type, address, origins, destinations, departure_time } = req.body || {};

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY 未設定' });
  }

  try {
    if (type === 'geocode') {
      if (!address) return res.status(400).json({ error: '缺少 address 參數' });
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&language=zh-TW&region=TW&components=country:TW&key=${apiKey}`;
      const geoRes = await fetch(url);
      const data = await geoRes.json();
      return res.status(200).json(data);
    }

    if (type === 'distancematrix') {
      if (!origins || !destinations) return res.status(400).json({ error: '缺少 origins/destinations 參數' });
      let url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&mode=driving&language=zh-TW&key=${apiKey}`;
      if (departure_time) {
        url += `&departure_time=${departure_time}&traffic_model=best_guess`;
      }
      const dmRes = await fetch(url);
      const data = await dmRes.json();
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: '未知的 type 參數，支援 geocode / distancematrix' });
  } catch (err) {
    console.error('[google-geo] error:', err);
    return res.status(500).json({ error: err.message });
  }
}
