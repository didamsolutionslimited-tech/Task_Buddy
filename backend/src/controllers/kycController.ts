import { Request, Response } from 'express';
import pool from '../config/db';

export const submitKYC = async (req: Request, res: Response) => {
  const { id_type, id_number } = req.body;

  // In a real app, get userId from JWT middleware
  const userId = 'mock-user-id';

  if (!id_type || !id_number) {
    return res.status(400).json({ error: 'ID type and number are required' });
  }

  try {
    // 1. Save the verification request
    await pool.query(
      'INSERT INTO kyc_verifications (user_id, id_type, id_number, verification_status) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET id_type = $2, id_number = $3, verification_status = $4',
      [userId, id_type, id_number, 'pending']
    );

    // 2. INTEGRATION POINT: Call a verification API (e.g., Smile ID, YouVerify, or Mono)
    console.log(`[KYC Provider] Verifying ${id_type} number ${id_number} for user ${userId}...`);

    // Mocking a successful verification for this demo
    const isVerified = true;

    if (isVerified) {
      await pool.query('UPDATE kyc_verifications SET verification_status = $1, verified_at = NOW() WHERE user_id = $2', ['verified', userId]);
      await pool.query('UPDATE users SET is_verified = true WHERE id = $1', [userId]);

      return res.json({ status: 'verified', message: 'Identity verified successfully' });
    } else {
      await pool.query('UPDATE kyc_verifications SET verification_status = $1 WHERE user_id = $2', ['failed', userId]);
      return res.status(400).json({ status: 'failed', message: 'Identity verification failed' });
    }
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error during KYC process' });
  }
};

export const getKYCStatus = async (req: Request, res: Response) => {
  // userId from JWT
  const userId = 'mock-user-id';

  try {
    const result = await pool.query('SELECT verification_status FROM kyc_verifications WHERE user_id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.json({ status: 'not_started' });
    }
    res.json({ status: result.rows[0].verification_status });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch KYC status' });
  }
};
