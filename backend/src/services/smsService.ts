import dotenv from 'dotenv';

dotenv.config();

/**
 * OTP delivery via SMS (Termii).
 *
 * Configure TERMII_API_KEY (from termii.com), optionally TERMII_SENDER_ID
 * (must be an approved Sender ID in your Termii account) and
 * DEFAULT_COUNTRY_CODE (default 234 / Nigeria) in .env.
 *
 * If TERMII_API_KEY is not set, the send is a logged stub so local dev
 * keeps working: the OTP is only printed to the server console.
 */

const TERMII_API_KEY = process.env.TERMII_API_KEY || '';
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || 'Generic';
const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE || '234';

export const isSmsConfigured = Boolean(TERMII_API_KEY);

/** Normalizes input like "08031234567", "+234 803...", "234803..." to Termii's 234803... format. */
export const normalizePhone = (raw: string): string => {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return digits;
  if (digits.startsWith(DEFAULT_COUNTRY_CODE)) return digits;
  if (digits.startsWith('0')) return DEFAULT_COUNTRY_CODE + digits.slice(1);
  return DEFAULT_COUNTRY_CODE + digits;
};

export const sendOTPSms = async (phone: string, otp: string): Promise<void> => {
  if (!TERMII_API_KEY) {
    console.log(`[SMS Gateway] (stub, no TERMII_API_KEY) OTP ${otp} for ${phone}`);
    return;
  }

  const to = normalizePhone(phone);
  const res = await fetch('https://api.ng.termii.com/api/sms/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to,
      from: TERMII_SENDER_ID,
      sms: `Your Task Buddy verification code is ${otp}. It expires in 5 minutes.`,
      type: 'plain',
      channel: 'generic',
      api_key: TERMII_API_KEY,
    }),
  });

  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || (data.status && data.status !== 'success')) {
    throw new Error(data.message || `Termii HTTP ${res.status}`);
  }
  console.log(`[SMS Gateway] OTP sent to ${to} via Termii (message_id: ${data.message_id || 'n/a'})`);
};
