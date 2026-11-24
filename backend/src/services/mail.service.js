import nodemailer from 'nodemailer';

// If SMTP_HOST is set, real email is sent. Otherwise emails are printed to the console
// ("dev mailbox"), so features like password reset still work locally.
let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

export const mailEnabled = () => Boolean(transporter);

const layout = (title, body) => `
<div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#0a8577,#6366f1);color:#fff;padding:20px 24px;font-size:18px;font-weight:700">MindCare Clinic</div>
  <div style="padding:24px;color:#334155;font-size:15px;line-height:1.6"><h2 style="margin-top:0;color:#0f172a">${title}</h2>${body}</div>
  <div style="padding:14px 24px;background:#f8fafc;color:#94a3b8;font-size:12px">Mental Health Care AFMS · This is an automated message.</div>
</div>`;

export async function sendMail({ to, subject, title, html }) {
  if (!to) return;
  const content = layout(title || subject, html);
  try {
    if (transporter) {
      await transporter.sendMail({ from: process.env.MAIL_FROM || 'MindCare <no-reply@mindcare.local>', to, subject, html: content });
    } else {
      const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(`\n[dev-mail] To: ${to}\n[dev-mail] Subject: ${subject}\n[dev-mail] ${text}\n`);
    }
  } catch (err) {
    console.error('sendMail failed:', err.message);
  }
}
