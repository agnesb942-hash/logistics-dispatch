// api/ai-diagnose.js
// Vercel Serverless Function — AI 物流診斷 Proxy
// 放置路徑：專案根目錄 /api/ai-diagnose.js
//
// 環境變數設定（Vercel Dashboard → Settings → Environment Variables）：
//   ANTHROPIC_API_KEY = sk-ant-xxxxxxxxxxxxxxxxxx
//
// 前端呼叫：POST /api/ai-diagnose
// Body: { prompt: string }
// Response: { result: string } 或 { error: string }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: '缺少 prompt 參數' });
  }

  if (prompt.length > 4000) {
    return res.status(400).json({ error: 'Prompt 超過長度限制（4000 字元）' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[ai-diagnose] ANTHROPIC_API_KEY 未設定');
    return res.status(500).json({ error: '伺服器尚未設定 API Key，請聯絡管理者' });
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      console.error('[ai-diagnose] Anthropic API error:', anthropicRes.status, errBody);
      return res.status(502).json({
        error: `AI 服務異常（HTTP ${anthropicRes.status}），請稍後再試`,
      });
    }

    const data = await anthropicRes.json();
    const result = (data.content || [])
      .map(block => block.text || '')
      .join('')
      .trim();

    if (!result) {
      return res.status(502).json({ error: 'AI 回傳空白結果，請再試一次' });
    }

    return res.status(200).json({ result });

  } catch (err) {
    console.error('[ai-diagnose] fetch error:', err);
    return res.status(500).json({ error: '網路錯誤：' + err.message });
  }
}
