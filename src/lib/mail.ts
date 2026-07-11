import 'server-only';
import nodemailer from 'nodemailer';

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const email = process.env.SMTP_EMAIL;
  const appPassword = process.env.SMTP_APP_PASSWORD;
  if (!email || !appPassword) return null;

  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: email, pass: appPassword },
  });
  return cachedTransporter;
}

export async function sendMail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ sent: boolean }> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[PhotoSpot] SMTP not configured — would have sent "${subject}" to ${to}`);
    return { sent: false };
  }

  const fromEmail = process.env.SMTP_EMAIL;
  await transporter.sendMail({
    from: `"PhotoSpot Georgia" <${fromEmail}>`,
    to,
    subject,
    text,
    html,
  });
  return { sent: true };
}

export function passwordResetCodeEmail(code: string) {
  const subject = `${code} is your PhotoSpot Georgia password reset code`;
  const text = `Your password reset code is: ${code}\n\nThis code is valid for 15 minutes. Enter it on the reset password page along with your new password.\n\nIf you didn't request this, you can safely ignore this email.`;
  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111827;">Reset your password</h2>
      <p style="color: #4b5563; line-height: 1.6;">
        We received a request to reset your PhotoSpot Georgia password. Enter this code on the reset
        password page — it's valid for 15 minutes:
      </p>
      <p style="margin: 28px 0; text-align: center;">
        <span style="display: inline-block; background: #f0fdf4; border: 2px solid #16a34a; color: #15803d; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 16px 24px; border-radius: 12px;">
          ${code}
        </span>
      </p>
      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6;">
        If you didn't request this, you can safely ignore this email — your password will stay the same.
        Never share this code with anyone.
      </p>
    </div>
  `;
  return { subject, text, html };
}