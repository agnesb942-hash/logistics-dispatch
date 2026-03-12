// api/gemini-ocr.js
// Vercel Serverless Function — Gemini Vision API Proxy
// 用途：OCR 單據辨識 / AI 智慧分析 / 行照辨識 / 一般對話
//
// 環境變數（Vercel Dashboard → Settings → Environment Variables）：
//   GEMINI_API_KEY = 從 Google AI Studio 取得

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ── 系統 Prompt：OCR 單據辨識 ──
const OCR_SYSTEM_PROMPT = `你是展儀物流的車輛維修單據 OCR 辨識助手。請從圖片中辨識維修單據的所有資訊。

展儀物流已知廠商及稅務規則：
- 福興汽車：未稅（exclusive），金額為未稅價，需 ×1.05 算含稅
- 順益安平：含稅（inclusive），金額為含稅價，需 ÷1.05 算未稅
- 宏明汽車玻璃行：依單據（manual）
- 弘昇汽車：依單據（manual）
- 甲益：依單據（manual）
- 龍溪：依單據（manual）
- 信勇力商行：未稅（exclusive）

分類代碼表（7大類40子類）：
A01 車輛購置, A02 折舊攤提, A03 加裝設備,
B01 引擎機油及濾芯, B02 變速箱油, B03 煞車油, B04 冷卻液, B05 空氣濾清器, B06 柴油濾清器, B07 全車油品更換, B08 其他定保項目,
C01 引擎系統, C02 傳動系統, C03 煞車系統, C04 懸吊/轉向, C05 電氣系統, C06 排氣系統, C07 冷氣系統, C08 冷卻系統, C09 其他維修,
D01 輪胎, D02 煞車來令片, D03 雨刷, D04 燈具, D05 皮帶, D06 電瓶, D07 其他消耗件,
E01 擋風玻璃, E02 隔熱紙, E03 鈑金烤漆, E04 其他外觀,
F01 燃料, F02 ETC通行費, F03 停車費,
G01 牌照稅, G02 燃料稅, G03 強制險, G04 任意險, G05 驗車費, G06 罰款

請嚴格以下列 JSON 格式回傳（不要加任何 markdown 標記）：
{
  "date": "YYYY-MM-DD",
  "vehicleId": "車牌號碼（格式如 BUB-0572）",
  "vendor": "廠商名稱",
  "mileage": 里程數（數字，無則填0）,
  "invoiceNo": "單據編號",
  "items": [
    { "desc": "項目描述", "qty": 數量, "unitPrice": 單價, "catCode": "分類代碼如B01" }
  ]
}`;

// ── 系統 Prompt：行照辨識 ──
const LICENSE_SYSTEM_PROMPT = `你是車輛行車執照 OCR 辨識助手。請從行照圖片中辨識所有資訊。

請嚴格以下列 JSON 格式回傳（不要加任何 markdown 標記）：
{
  "plateNumber": "車牌號碼",
  "vehicleType": "車輛型式（如：自用小貨車）",
  "brandModel": "廠牌型式（如：三菱 VERYCA）",
  "bodyNumber": "車身號碼",
  "engineNumber": "引擎號碼",
  "manufactureDate": "出廠年月（YYYY-MM）",
  "totalWeight": 總重量kg（數字）,
  "ownerName": "車主名稱",
  "inspectionDate": "檢驗日期（YYYY-MM-DD）",
  "notes": "其他備註"
}`;

// ── 系統 Prompt：智慧分析 ──
const ANALYZE_SYSTEM_PROMPT = `你是展儀物流的車隊成本分析顧問。請根據提供的車輛歷史維修資料，用繁體中文回答問題。

回覆要求：
- 用具體數據支撐分析
- 指出異常模式和潛在問題
- 給出可行的改善建議
- 比較與車隊平均的差異
- 適當使用 emoji 讓回覆更易讀`;

// ── 系統 Prompt：一般對話 ──
const CHAT_SYSTEM_PROMPT = `你是展儀物流的車輛成本管理 AI 助手。用繁體中文回答車輛維修、保養、成本管理相關的問題。
回覆簡潔實用，適當使用 emoji。如果問題不在你的專業範圍，請禮貌說明。`;

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[gemini-ocr] GEMINI_API_KEY 未設定');
    return res.status(500).json({ error: '伺服器尚未設定 GEMINI_API_KEY，請在 Vercel Dashboard 設定' });
  }

  const { mode, imageBase64, mimeType, prompt, vehicleHistory } = req.body || {};

  if (!mode || !['ocr', 'license', 'analyze', 'chat', 'report'].includes(mode)) {
    return res.status(400).json({ error: '缺少或無效的 mode 參數（ocr/license/analyze/chat/report）' });
  }

  try {
    let systemPrompt = '';
    const parts = [];

    switch (mode) {
      case 'ocr':
        systemPrompt = OCR_SYSTEM_PROMPT;
        if (!imageBase64) return res.status(400).json({ error: '缺少 imageBase64' });
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: imageBase64,
          }
        });
        parts.push({ text: '請辨識這張維修單據的所有資訊，嚴格以 JSON 格式回傳。' });
        break;

      case 'license':
        systemPrompt = LICENSE_SYSTEM_PROMPT;
        if (!imageBase64) return res.status(400).json({ error: '缺少 imageBase64' });
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: imageBase64,
          }
        });
        parts.push({ text: '請辨識這張行車執照的所有資訊，嚴格以 JSON 格式回傳。' });
        break;

      case 'analyze':
        systemPrompt = ANALYZE_SYSTEM_PROMPT;
        let analyzeText = prompt || '請分析這輛車的維修狀況';
        if (vehicleHistory) {
          analyzeText += `\n\n車輛歷史資料：\n${JSON.stringify(vehicleHistory, null, 2)}`;
        }
        parts.push({ text: analyzeText });
        break;

      case 'report':
        systemPrompt = `你是展儀物流的車隊成本分析顧問。請根據提供的報表數據，用繁體中文產出分析摘要。
分析要包含：1) 重點摘要 2) 異常提醒 3) 趨勢觀察 4) 改善建議。回覆使用純文字，適合放入 PDF 報表。`;
        parts.push({ text: prompt || '請分析以下報表數據' });
        break;

      case 'chat':
      default:
        systemPrompt = CHAT_SYSTEM_PROMPT;
        if (!prompt) return res.status(400).json({ error: '缺少 prompt' });
        parts.push({ text: prompt });
        break;
    }

    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts }],
        generationConfig: {
          temperature: mode === 'ocr' || mode === 'license' ? 0.1 : 0.7,
          maxOutputTokens: mode === 'report' ? 4096 : 2048,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error('[gemini-ocr] Gemini API error:', geminiRes.status, errBody);
      return res.status(502).json({
        error: `Gemini API 異常（HTTP ${geminiRes.status}），請稍後再試`,
      });
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      return res.status(502).json({ error: 'Gemini 回傳空白結果' });
    }

    // For OCR/license modes, try to parse JSON
    if (mode === 'ocr' || mode === 'license') {
      try {
        // Strip markdown code fence if present
        let jsonStr = text.trim();
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
        }
        const parsed = JSON.parse(jsonStr);
        return res.status(200).json({ result: parsed, raw: text });
      } catch {
        // Return raw text if JSON parsing fails
        return res.status(200).json({ result: null, raw: text, parseError: true });
      }
    }

    return res.status(200).json({ result: text });

  } catch (err) {
    console.error('[gemini-ocr] fetch error:', err);
    return res.status(500).json({ error: '網路錯誤：' + err.message });
  }
}
