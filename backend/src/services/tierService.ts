/*
 * Rating & reward tiers:
 *   Bronze  (everyone starts here)
 *   Silver  — keep rating >= 3.5 for 30 days
 *   Gold    — keep rating >= 4.2 for 60 days
 *   Platinum — keep rating >= 4.7 for 90 days
 *
 * The clock runs while your rating stays above the next tier's bar;
 * drop below it and the clock resets. Ratings come from client reviews
 * after completed jobs. Falling under the current tier's own minimum
 * demotes one step.
 */
import { Pool } from 'pg';
import pool from '../config/db';

export const TIERS = [
  { name: 'Bronze', icon: '🥉', color: '#B08D57', min_rating: 0 },
  { name: 'Silver', icon: '🥈', color: '#9FA6B2', min_rating: 3.5, sustain_days: 30, min_reviews: 3 },
  { name: 'Gold', icon: '🥇', color: '#E2B93B', min_rating: 4.2, sustain_days: 60, min_reviews: 10 },
  { name: 'Platinum', icon: '💎', color: '#7FE3E8', min_rating: 4.7, sustain_days: 90, min_reviews: 20 },
];

export const tierIndex = (name: string) => TIERS.findIndex((t) => t.name === name);

export const nextTier = (current: string) => {
  const i = tierIndex(current);
  return i >= 0 && i < TIERS.length - 1 ? TIERS[i + 1] : null;
};

export async function ensureTierRow(userId: string) {
  const { rows } = await pool.query(
    'INSERT INTO tasker_tiers (user_id, tier) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING',
    [userId, 'Bronze']
  );
  return rows;
}

export async function getTierInfo(userId: string) {
  await ensureTierRow(userId);
  const { rows } = await pool.query(
    `SELECT tier, next_since FROM tasker_tiers WHERE user_id = $1`,
    [userId]
  );
  const t = rows[0];

  // rating straight from reviews
  const { rows: r } = await pool.query(
    `SELECT COALESCE(AVG(rating), 0)::float AS rating, COUNT(*)::int AS count FROM reviews WHERE reviewee_id = $1`,
    [userId]
  );
  const rating = Math.round((r[0].rating || 0) * 10) / 10;
  const reviews = r[0].count;

  const tier = t?.tier || 'Bronze';
  const next = nextTier(tier);

  let progress: any = null;
  if (next) {
    const ms = (t?.next_since ? Date.now() - new Date(t.next_since).getTime() : 0);
    const daysKept = Math.max(0, ms / (24 * 3600 * 1000));
    const ratingOk = rating >= next.min_rating;
    const daysNeeded = next.sustain_days;
    progress = {
      next: next.name,
      rating_ok: ratingOk,
      rating_needed: Math.max(0, Math.round((next.min_rating - rating) * 10) / 10),
      days_kept: Math.floor(daysKept),
      days_needed: daysNeeded,
      reviews: reviews,
      reviews_needed: Math.max(0, (next.min_reviews || 0) - reviews),
    };
  }

  return { tier, rating, reviews, next_since: t?.next_since || null, progress };
}

/**
 * Called after every review. Updates tier, next_since clock, demotion.
 */
export async function updateTierFor(userId: string) {
  const info = await getTierInfo(userId);
  const currentIdx = tierIndex(info.tier);
  const next = TIERS[currentIdx + 1] || null;

  let tier = info.tier;
  let nextSince = info.next_since ? new Date(info.next_since) : null;
  let promoted = false;
  let demoted = false;

  // demotion: rating (with a few reviews behind it) fell below current tier's own bar
  const current = TIERS[currentIdx];
  if (currentIdx > 0 && info.reviews >= 3 && info.rating < current.min_rating) {
    tier = TIERS[currentIdx - 1].name;
    nextSince = null;
    demoted = true;
  }

  if (next) {
    const ratingOk = info.rating >= next.min_rating;
    const volumeOk = !next.min_reviews || info.reviews >= next.min_reviews;

    if (ratingOk && volumeOk) {
      // start the sustain clock if it isn't running
      if (!nextSince) nextSince = new Date();
      const daysKept = (Date.now() - nextSince.getTime()) / (24 * 3600 * 1000);
      if (tier !== next.name && daysKept >= (next.sustain_days || 0)) {
        tier = next.name;
        promoted = true;
        nextSince = new Date(); // clock restarts toward the tier after next
      }
    } else {
      // dropped below the next tier's bar — clock resets
      nextSince = null;
    }
  }

  await pool.query(
    `INSERT INTO tasker_tiers (user_id, tier, next_since, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id) DO UPDATE SET tier = $2, next_since = $3, updated_at = NOW()`,
    [userId, tier, nextSince]
  );

  return { tier, promoted, demoted };
}

export async function recalcRating(revieweeId: string) {
  const { rows } = await pool.query(
    `SELECT COALESCE(AVG(rating), 0)::float AS rating, COUNT(*)::int AS count FROM reviews WHERE reviewee_id = $1`,
    [revieweeId]
  );
  const rating = Math.round((rows[0].rating || 0) * 10) / 10;
  // keep tasker_profiles in sync if present
  await pool.query(
    `INSERT INTO tasker_profiles (user_id, rating, total_reviews)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET rating = $2, total_reviews = $3`,
    [revieweeId, rating, rows[0].count]
  );
  return { rating, count: rows[0].count };
}

export { pool };
