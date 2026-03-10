// api/leave-notify.js
// Gmail 通知 + Google Calendar 新增事件
// 環境變數設定（Vercel Dashboard）：
//   GMAIL_USER         → 寄件 Gmail 帳號（如 notify@company.com）
//   GMAIL_APP_PASSWORD → Gmail 應用程式密碼（Google 帳號安全性 → 應用程式密碼）

const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { request, managerEmail } = req.body;
  if (!request || !managerEmail) {
    return res.status(400).json({ error: '缺少必要參數 request / managerEmail' });
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    return res.status(500).json({ error: 'GMAIL_USER / GMAIL_APP_PASSWORD 未設定' });
  }

  const statusMap = {
    pending:          '待審核',
    approved:         '已核准',
    rejected:         '已駁回',
    conflict_pending: '⚠️ 衝突待審',
  };

  try {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });

    const conflictNote = request.conflictWith?.length > 0
      ? `\n⚠️ 衝突提醒：${request.conflictWith.join('、')} 同日已排休\n`
      : '';

    const subject = `【休假申請通知】${request.employeeName}・${request.leaveTypeName}・${request.startDate}`;
    const text = `
休假申請通知
═══════════════════════════════

申請人：${request.employeeName}
部　門：${request.deptName}
假　別：${request.leaveTypeName}
日　期：${request.startDate} ～ ${request.endDate}
天　數：${request.days > 0 ? request.days + ' 天' : request.hours + ' 小時'}
事　由：${request.reason || '（未填寫）'}
狀　態：${statusMap[request.status] || request.status}
${conflictNote}
申請時間：${new Date(request.createdAt).toLocaleString('zh-TW')}

═══════════════════════════════
此信件由物流管理平台自動發送，請勿直接回覆。
`.trim();

    await transporter.sendMail({
      from: `物流管理平台 <${gmailUser}>`,
      to: managerEmail,
      subject,
      text,
    });

    return res.status(200).json({ ok: true, message: '郵件已發送' });
  } catch (err) {
    console.error('[leave-notify] Gmail error:', err);
    return res.status(500).json({ error: err.message });
  }
};
