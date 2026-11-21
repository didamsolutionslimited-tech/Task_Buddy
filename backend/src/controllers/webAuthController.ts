import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import pool from '../config/db';
import { signToken } from '../middleware/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:5000';

/** POST /api/auth/register  { full_name, email, password, phone? } */
export const register = async (req: Request, res: Response) => {
  const { full_name, email, password, phone } = req.body || {};

  if (!full_name || String(full_name).trim().length < 2) {
    return res.status(400).json({ error: 'Please provide your full name' });
  }
  if (!email || !EMAIL_REGEX.test(String(email))) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }
  if (!password || String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [String(email).toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists — please log in' });
    }

    const password_hash = await bcrypt.hash(String(password), 10);
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, phone_number, password_hash, role)
       VALUES ($1, $2, $3, $4, 'client') RETURNING id, full_name, email, role`,
      [String(full_name).trim().slice(0, 120), String(email).toLowerCase(), phone ? String(phone) : null, password_hash]
    );
    const user = rows[0];
    res.status(201).json({ token: signToken(user), user });
  } catch (err: any) {
    console.error('register failed:', err?.message);
    res.status(500).json({ error: 'Could not create the account. Maybe the users table is missing columns.' });
  }
};

/** POST /api/auth/login  { email, password } */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { rows } = await pool.query('SELECT id, full_name, email, role, password_hash FROM users WHERE email = $1', [String(email).toLowerCase()]);
    const user = rows[0];
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.json({ token: signToken(user), user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role } });
  } catch (err: any) {
    console.error('login failed:', err?.message);
    res.status(500).json({ error: 'Could not log in. Maybe the users table is missing columns.' });
  }
};

/** GET /api/auth/google — kicks off OAuth (or reports not configured) */
export const googleStart = async (_req: Request, res: Response) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(501).json({
      error: 'Google sign-in is not configured on the server yet.',
      how_to: 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env (Google Cloud console → OAuth client, redirect = ' + API_URL + '/api/auth/google/callback)',
    });
  }
  const state = crypto.randomBytes(10).toString('hex');
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${API_URL}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};

/** GET /api/auth/google/callback — exchanges code, upserts user, delivers token */
export const googleCallback = async (req: Request, res: Response) => {
  const code = (req.query.code as string) || '';
  if (!code) return res.status(400).send('Missing authorization code');

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(501).send('Google sign-in is not configured on the server.');
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${API_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });
    const tokenJson: any = await tokenRes.json();
    if (!tokenJson.access_token) {
      return res.status(401).send('Google rejected the sign-in: ' + (tokenJson.error_description || tokenJson.error));
    }

    const profileRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    const profile: any = await profileRes.json();
    if (!profile.email) return res.status(401).send('Google account has no email');

    let { rows } = await pool.query('SELECT id, full_name, email, role FROM users WHERE email = $1', [profile.email]);
    if (rows.length === 0) {
      const created = await pool.query(
        `INSERT INTO users (full_name, email, email_verified, role) VALUES ($1, $2, true, 'client')
         RETURNING id, full_name, email, role`,
        [profile.name || profile.email.split('@')[0], profile.email]
      );
      rows = created.rows;
    }
    const user = rows[0];
    const token = signToken(user);
    res.redirect(`${SITE_URL}/auth/callback?t=${encodeURIComponent(token)}`);
  } catch (err: any) {
    console.error('google callback failed:', err?.message);
    res.status(500).send('Google sign-in failed');
  }
};

/** GET /api/web-auth/google-status — is Google sign-in configured? */
export const googleStatus = async (_req: Request, res: Response) => {
  res.json({ enabled: Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) });
};

/** GET /api/auth/me — whoami from JWT */
export const me = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  const { rows } = await pool.query(
    'SELECT id, full_name, email, phone_number, role, is_verified FROM users WHERE id = $1',
    [req.user.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
  res.json({ user: rows[0] });
};
