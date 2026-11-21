import { Request, Response } from 'express';
import pool from '../config/db';
import { recalcRating, updateTierFor, getTierInfo } from '../services/tierService';

/** POST /api/reviews  { reviewer_id, reviewee_id, rating, comment?, booking_id? } */
export const createReview = async (req: Request, res: Response) => {
  const { reviewer_id, reviewee_id, rating, comment, booking_id } = req.body || {};

  if (!reviewer_id || !reviewee_id) {
    return res.status(400).json({ error: 'reviewer_id and reviewee_id are required' });
  }
  if (reviewer_id === reviewee_id) {
    return res.status(400).json({ error: 'You cannot review yourself' });
  }
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    return res.status(400).json({ error: 'rating must be an integer from 1 to 5' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO reviews (reviewer_id, reviewee_id, rating, comment, booking_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [reviewer_id, reviewee_id, r, comment ? String(comment).slice(0, 2000) : null, booking_id || null]
    );

    const recalc = await recalcRating(reviewee_id);
    const tier = await updateTierFor(reviewee_id);
    const info = await getTierInfo(reviewee_id);

    return res.status(201).json({
      review: rows[0],
      rating_avg: recalc.rating,
      reviews_count: recalc.count,
      tier: tier.tier,
      tier_promoted: tier.promoted,
      tier_demoted: tier.demoted,
      progress: info.progress,
    });
  } catch (err: any) {
    console.error('Failed to create review:', err?.message || err);
    return res.status(500).json({ error: 'Failed to save review' });
  }
};

/** GET /api/reviews/:userId — list a tasker's reviews */
export const listReviews = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, reviewer_id, rating, comment, created_at
       FROM reviews WHERE reviewee_id = $1 ORDER BY id DESC LIMIT 100`,
      [req.params.userId]
    );
    res.json({ reviews: rows });
  } catch (err: any) {
    console.error('Failed to list reviews:', err?.message || err);
    res.status(500).json({ error: 'Failed to load reviews' });
  }
};
