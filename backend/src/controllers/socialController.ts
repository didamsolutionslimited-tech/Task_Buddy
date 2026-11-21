import { Request, Response } from 'express';
import pool from '../config/db';

// CHAT LOGIC
export const sendMessage = async (req: Request, res: Response) => {
  const { booking_id, sender_id, text } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO messages (booking_id, sender_id, text) VALUES ($1, $2, $3) RETURNING *',
      [booking_id, sender_id, text]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  const { booking_id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM messages WHERE booking_id = $1 ORDER BY created_at ASC',
      [booking_id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// RATING LOGIC
export const submitReview = async (req: Request, res: Response) => {
  const { booking_id, reviewer_id, reviewee_id, rating, comment } = req.body;
  try {
    await pool.query(
      'INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment) VALUES ($1, $2, $3, $4, $5)',
      [booking_id, reviewer_id, reviewee_id, rating, comment]
    );

    // Update Tasker's overall rating
    await pool.query(
      'UPDATE tasker_profiles SET rating = (SELECT AVG(rating) FROM reviews WHERE reviewee_id = $1), total_reviews = (SELECT COUNT(*) FROM reviews WHERE reviewee_id = $1) WHERE user_id = $1',
      [reviewee_id]
    );

    res.json({ message: 'Review submitted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
};

// ADMIN LOGIC
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const users = await pool.query('SELECT COUNT(*) FROM users');
    const tasks = await pool.query('SELECT COUNT(*) FROM tasks');
    const payments = await pool.query('SELECT SUM(amount) FROM payments WHERE status = $1', ['paid']);
    const kyc = await pool.query('SELECT COUNT(*) FROM kyc_verifications WHERE verification_status = $1', ['pending']);

    res.json({
      total_users: parseInt(users.rows[0].values[0]),
      total_tasks: parseInt(tasks.rows[0].values[0]),
      total_revenue: parseFloat(payments.rows[0].values[0] || '0'),
      pending_kyc: parseInt(kyc.rows[0].values[0]),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
};

export const approveKYC = async (req: Request, res: Response) => {
  const { user_id } = req.body;
  try {
    await pool.query('UPDATE kyc_verifications SET verification_status = $1, verified_at = NOW() WHERE user_id = $2', ['verified', user_id]);
    await pool.query('UPDATE users SET is_verified = true WHERE id = $1', [user_id]);
    res.json({ message: 'User verified successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to approve KYC' });
  }
};
