import { Request, Response } from 'express';
import pool from '../config/db';
import { UserRole } from '../models/User';
import { sendOTPEmail, isEmailConfigured } from '../services/emailService';
import { sendOTPSms, isSmsConfigured } from '../services/smsService';
import dotenv from 'dotenv';

dotenv.config();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_DEBUG = String(process.env.OTP_DEBUG || '').toLowerCase() === 'true';

// Mock OTP store - In production, use Redis with TTL
const otpStore = new Map<string, { otp: string, expiresAt: number, resends?: number }>();

export const sendOTP = async (req: Request, res: Response) => {
  const { phone_number, email } = req.body || {};

  if (!phone_number && !email) {
    return res.status(400).json({ error: 'Email address or phone number is required' });
  }

  if (email && !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }

  if (email) {
    if (!isEmailConfigured && !OTP_DEBUG) {
      return res.status(500).json({ error: 'Email sending is not configured on the server' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Rate-limit: max 3 requests per email within the code's validity window
    const stored = otpStore.get(email);
    const resends = stored && Date.now() < stored.expiresAt ? stored.resends ?? 0 : 0;
    if (resends >= 3) {
      return res.status(429).json({ error: 'Too many OTP requests. Please wait a few minutes and try again.' });
    }

    otpStore.set(email, { otp, expiresAt, resends: resends + 1 });

    try {
      const { previewUrl } = await sendOTPEmail(email, otp);
      if (previewUrl) {
        console.log(`[Email] View the OTP for ${email} here: ${previewUrl}`);
      }
    } catch (err: any) {
      console.error('[Email Gateway] Failed to send OTP:', err?.message || err);
      if (!OTP_DEBUG) {
        otpStore.delete(email);
        return res.status(500).json({ error: 'Failed to send OTP email. Please try again.' });
      }
      console.warn('[Email Gateway] OTP_DEBUG is on — leaving code valid so the flow can be tested.');
    }

    return res.json({ message: 'OTP sent successfully', channel: 'email', sent_to: email, ...(OTP_DEBUG ? { debug_otp: otp } : {}) });
  }

  // Phone flow (SMS) - Termii gateway when TERMII_API_KEY is set, console stub otherwise
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpStore.set(phone_number, { otp, expiresAt });

  if (isSmsConfigured) {
    try {
      await sendOTPSms(phone_number, otp);
    } catch (err: any) {
      console.error('[SMS Gateway] Failed to send OTP:', err?.message || err);
      if (!OTP_DEBUG) {
        otpStore.delete(phone_number);
        return res.status(500).json({ error: 'Failed to send OTP by SMS. Please try again.' });
      }
      console.warn('[SMS Gateway] OTP_DEBUG is on — leaving code valid so the flow can be tested.');
    }
  } else {
    console.log(`[SMS Gateway] Sending OTP ${otp} to ${phone_number}`);
  }

  res.json({ message: 'OTP sent successfully', channel: 'sms', sent_to: phone_number, ...(OTP_DEBUG ? { debug_otp: otp } : {}) });
};

export const verifyOTP = async (req: Request, res: Response) => {
  const { phone_number, email, otp } = req.body || {};

  if ((!phone_number && !email) || !otp) {
    return res.status(400).json({ error: 'Email address or phone number, and OTP are required' });
  }

  const identifier = email || phone_number;
  const stored = otpStore.get(identifier);

  if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  // Remove OTP after successful verification
  otpStore.delete(identifier);

  try {
    // Check if user exists, otherwise create them as a client by default
    const column = email ? 'email' : 'phone_number';
    let userResult = await pool.query(`SELECT * FROM users WHERE ${column} = $1`, [identifier]);
    let user = userResult.rows[0];

    if (!user) {
      const insertSql = email
        ? 'INSERT INTO users (email, role, is_verified) VALUES ($1, $2, $3) RETURNING *'
        : 'INSERT INTO users (phone_number, role, is_verified) VALUES ($1, $2, $3) RETURNING *';
      const newUserResult = await pool.query(insertSql, [identifier, UserRole.CLIENT, false]);
      user = newUserResult.rows[0];
    }

    // TODO: generate a real JWT in a production build
    const token = 'mock-jwt-token-for-' + user.id;

    res.json({
      token,
      user: {
        id: user.id,
        phone_number: user.phone_number,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified
      }
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error during verification' });
  }
};
