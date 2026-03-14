// api/leave-gcal.js
// 將核准假單新增至 Google Calendar
// 環境變數設定（Vercel Dashboard）：
//   GCAL_SERVICE_ACCOUNT → Google 服務帳號 JSON 字串（完整 JSON，需先在 GCP 建立）
//   GCAL_CALENDAR_ID     → 目標行事曆 ID（也可從前端傳入）

import { google } from 'googleapis';

const ORIGIN = process.env.ALLOWED_ORIGIN || '*';

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', ORIGIN);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', ORIGIN);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { request, calendarId } = req.body || {};
  if (!request) return res.status(400).json({ error: '缺少 request 參數' });

  const saJson = process.env.GCAL_SERVICE_ACCOUNT;
  if (!saJson) return res.status(500).json({ error: 'GCAL_SERVICE_ACCOUNT 未設定' });

  const targetCalId = calendarId || process.env.GCAL_CALENDAR_ID || 'primary';

  try {
    const sa = JSON.parse(saJson);
    const auth = new google.auth.GoogleAuth({
      credentials: sa,
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const leaveTypeEmoji = {
      annual:       '🏖️',
      personal:     '📝',
      sick:         '🤒',
      official:     '🏛️',
      compensatory: '⏰',
    };
    const emoji = leaveTypeEmoji[request.leaveType] || '📅';

    const conflictNote = request.conflictWith?.length > 0
      ? `\n⚠️ 衝突提醒：${request.conflictWith.join('、')} 同日排休`
      : '';

    const daysLabel = request.days > 0 ? request.days + '天' : (request.hours ? request.hours + '小時' : '—');
    const event = {
      summary: `${emoji} ${request.employeeName}・${request.leaveTypeName}`,
      description: `部門：${request.deptName}\n假別：${request.leaveTypeName}\n天數：${daysLabel}\n事由：${request.reason || '—'}${conflictNote}\n申請時間：${new Date(request.createdAt).toLocaleString('zh-TW')}`,
      start: {
        date: request.startDate,
        timeZone: 'Asia/Taipei',
      },
      end: {
        // Google Calendar end date is exclusive, add 1 day
        date: (() => {
          const [y, m, d] = request.endDate.split('-').map(Number);
          const next = new Date(y, m - 1, d + 1);
          return `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-${String(next.getDate()).padStart(2,'0')}`;
        })(),
        timeZone: 'Asia/Taipei',
      },
      colorId: { annual:'7', personal:'6', sick:'4', official:'2', compensatory:'3' }[request.leaveType] || '1',
    };

    const result = await calendar.events.insert({
      calendarId: targetCalId,
      requestBody: event,
    });

    return res.status(200).json({ ok: true, eventId: result.data.id, htmlLink: result.data.htmlLink });
  } catch (err) {
    console.error('[leave-gcal] error:', err);
    return res.status(500).json({ error: err.message });
  }
}
