import nodemailer from 'nodemailer';

type MailResult =
  | { ok: true }
  | { ok: false; error: string };

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM
} = import.meta.env;

// Create transport lazily so local dev without SMTP still works (console fallback)
function getTransport() {
  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
  }
  return null;
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  resetUrl: string;
}): Promise<MailResult> {
  const from = EMAIL_FROM || 'no-reply@example.com';
  const transport = getTransport();

  const html = `
    <p>We received a request to reset your password.</p>
    <p><a href="${opts.resetUrl}">Reset your password</a></p>
    <p>If you didn’t request this, you can ignore this email.</p>
  `;

  const message = {
    from,
    to: opts.to,
    subject: 'Reset your password',
    text: `Reset your password: ${opts.resetUrl}`,
    html
  };

  // Fallback: log to console in dev if SMTP not configured
  if (!transport) {
    console.log('[DEV email preview] Password reset email:', message);
    return { ok: true };
  }

  try {
    await transport.sendMail(message);
    return { ok: true };
  } catch (error: any) {
    console.error('sendPasswordResetEmail error:', error);
    return { ok: false, error: error?.message || 'Email send failed' };
  }
}
