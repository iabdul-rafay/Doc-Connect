/**
 * utils/email.js
 * Transactional email.
 *
 * Primary path: Brevo's HTTPS REST API (https://api.brevo.com). This goes
 * over port 443 like any normal web request, so it works on hosts (like
 * Render's free tier) that block outbound SMTP ports 25/465/587 — raw SMTP
 * to Gmail or any other provider will NOT work on those hosts.
 *
 * Set BREVO_API_KEY (and optionally EMAIL_FROM) to use it. Without an API
 * key, falls back to a free Ethereal test inbox so emails still "send"
 * during local development — a clickable preview URL is printed to the
 * console for each one.
 */
const nodemailer = require('nodemailer');

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

let etherealTransporterPromise = null;

function parseFrom(fromString) {
  // Accepts "Doc-Connect <no-reply@docconnect.app>" or a bare email address.
  const fallback = { name: 'Doc-Connect', email: 'no-reply@docconnect.app' };
  if (!fromString) return fallback;
  const match = fromString.match(/^\s*(.*?)\s*<(.+?)>\s*$/);
  if (match) return { name: match[1] || fallback.name, email: match[2] };
  return { name: fallback.name, email: fromString.trim() };
}

async function sendViaBrevo({ to, subject, html }) {
  const sender = parseFrom(process.env.EMAIL_FROM);
  const res = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Brevo API error ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json().catch(() => ({}));
  console.log(`📧 Email sent to ${to} via Brevo (id: ${data.messageId || 'n/a'})`);
}

async function getEtherealTransporter() {
  if (etherealTransporterPromise) return etherealTransporterPromise;
  etherealTransporterPromise = (async () => {
    const testAccount = await nodemailer.createTestAccount();
    console.log('ℹ  No BREVO_API_KEY set — using Ethereal test inbox for outgoing email.');
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  })();
  return etherealTransporterPromise;
}

async function sendViaEthereal({ to, subject, html }) {
  const transporter = await getEtherealTransporter();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Doc-Connect <no-reply@docconnect.app>',
    to,
    subject,
    html,
  });
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log(`📧 Email to ${to} — preview: ${preview}`);
  else console.log(`📧 Email sent to ${to} (id: ${info.messageId})`);
}

function shell(title, bodyHtml) {
  return `
  <div style="background:#eef2f1;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #dfe7e5;">
      <div style="background:#0f766e;padding:28px 32px;">
        <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-.3px;">Doc&#8209;Connect</span>
        <div style="color:#9fded6;font-size:13px;margin-top:2px;">${title}</div>
      </div>
      <div style="padding:32px;color:#243634;font-size:15px;line-height:1.6;">
        ${bodyHtml}
      </div>
      <div style="padding:18px 32px;background:#f6faf9;color:#8aa39e;font-size:12px;border-top:1px solid #e6efed;">
        You received this email because an account action was requested on Doc-Connect.
        If this wasn't you, you can safely ignore it.
      </div>
    </div>
  </div>`;
}

function button(href, label) {
  return `<a href="${href}" style="display:inline-block;background:#0f766e;color:#fff;
    text-decoration:none;padding:13px 26px;border-radius:10px;font-weight:600;font-size:15px;">${label}</a>`;
}

async function send({ to, subject, html }) {
  if (process.env.BREVO_API_KEY) {
    await sendViaBrevo({ to, subject, html });
  } else {
    await sendViaEthereal({ to, subject, html });
  }
}

async function sendVerificationEmail(user, verifyUrl) {
  await send({
    to: user.email,
    subject: 'Verify your Doc-Connect email',
    html: shell(
      'Confirm your email address',
      `<p>Hi ${user.name},</p>
       <p>Welcome to Doc-Connect. Confirm your email address to activate your account.
          You won't be able to log in until this is done.</p>
       <p style="margin:26px 0;">${button(verifyUrl, 'Verify my email')}</p>
       <p style="color:#7b918d;font-size:13px;">This link expires in 24 hours. If the button
          doesn't work, paste this into your browser:</p>
       <p style="word-break:break-all;font-size:12px;color:#0f766e;">${verifyUrl}</p>`
    ),
  });
}

async function sendResetEmail(user, resetUrl) {
  await send({
    to: user.email,
    subject: 'Reset your Doc-Connect password',
    html: shell(
      'Reset your password',
      `<p>Hi ${user.name},</p>
       <p>We received a request to reset your password. Choose a new one using the link below.</p>
       <p style="margin:26px 0;">${button(resetUrl, 'Set a new password')}</p>
       <p style="color:#7b918d;font-size:13px;">This link expires in 1 hour. If you didn't
          request this, no action is needed.</p>`
    ),
  });
}

module.exports = { sendVerificationEmail, sendResetEmail };