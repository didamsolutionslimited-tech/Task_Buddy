import nodemailer, { TestAccount, Transporter } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Sends transactional emails (e.g., OTP codes) via SMTP.
 *
 * Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env
 * For Gmail: use an App Password (https://myaccount.google.com/apppasswords)
 * and set SMTP_HOST=smtp.gmail.com, SMTP_PORT=465.
 *
 * If no SMTP credentials are configured, a disposable Ethereal test
 * account is created automatically. Emails then land in Ethereal's web
 * inbox and a preview URL is printed to the server console.
 */

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

let cachedTransporter: Transporter | null = null;
let cachedFrom: string | null = null;
let cachedTestAccount: TestAccount | null = null;
let transportReady: Promise<void> | null = null;

// A custom user/pass (e.g. real Gmail) means real SMTP; otherwise fall back to Ethereal
const smtpUser = SMTP_USER && !SMTP_USER.includes('PASTE_') ? SMTP_USER : undefined;
const smtpPass = SMTP_PASS && !SMTP_PASS.includes('PASTE_') ? SMTP_PASS : undefined;
const hasCustomSmtp = Boolean(SMTP_HOST && smtpUser && smtpPass);

export const isEmailConfigured = hasCustomSmtp || Boolean(process.env.NODE_ENV !== 'production');

const ensureTransport = async () => {
  if (cachedTransporter) return;
  transportReady =
    transportReady ||
    (async () => {
      if (hasCustomSmtp) {
        cachedTransporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: SMTP_PORT,
          secure: SMTP_PORT === 465,
          auth: { user: smtpUser, pass: smtpPass },
        });
        cachedFrom = SMTP_FROM!;
      } else {
        // Dev fallback: disposable Ethereal test inbox
        cachedTestAccount = await nodemailer.createTestAccount();
        cachedTransporter = nodemailer.createTransport({
          host: cachedTestAccount.smtp.host,
          port: cachedTestAccount.smtp.port,
          secure: cachedTestAccount.smtp.secure,
          auth: { user: cachedTestAccount.user, pass: cachedTestAccount.pass },
        });
        cachedFrom = `"Task Buddy" <${cachedTestAccount.user}>`;
        console.log(`[Email] Using Ethereal test account: ${cachedTestAccount.user}`);
      }
    })();
  await transportReady;
};

export const sendOTPEmail = async (to: string, otp: string): Promise<{ previewUrl: string | null }> => {
  await ensureTransport();
  const transporter = cachedTransporter!;
  const from = cachedFrom!;

  const mailOptions = {
    from: from.startsWith('"') ? from : `"Task Buddy" <${from}>`,
    to,
    subject: `Your Task Buddy verification code: ${otp}`,
    text: `Welcome to Task Buddy!\n\nYour verification code is: ${otp}\n\nThis code expires in 5 minutes. If you didn't request it, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #00C853; margin: 0 0 8px;">Task Buddy</h2>
        <p style="color: #555; margin: 0 0 20px;">Use this code to verify your account:</p>
        <div style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #111; text-align: center; padding: 16px; background: #f6f6f6; border-radius: 8px;">${otp}</div>
        <p style="color: #888; font-size: 13px; margin-top: 20px;">This code expires in 5 minutes. If you didn't request it, you can safely ignore this email.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info) || null;

  if (previewUrl) {
    console.log(`[Email] OTP email sent to ${to}. Preview: ${previewUrl}`);
  } else {
    console.log(`[Email] OTP email sent to ${to} (message id: ${info.messageId})`);
  }

  return { previewUrl };
};

// Expose test account info so a preview inbox can be reopened
export const getTestAccount = () => cachedTestAccount;
