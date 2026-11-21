import { Request, Response } from 'express';
import pool from '../config/db';
import { broadcastToEmails } from '../ws';

const conversationKey = (a: string, b: string) => [a, b].sort().join('|');

export const getMessages = async (req: Request, res: Response) => {
  const { me, other, since } = req.query as { me?: string; other?: string; since?: string };

  if (!me || !other) {
    return res.status(400).json({ error: 'me and other query params are required' });
  }

  try {
    const params: any[] = [conversationKey(me, other)];
    let sinceClause = '';
    if (since && !Number.isNaN(Number(since))) {
      sinceClause = ' AND id > $2';
      params.push(Number(since));
    }
    const result = await pool.query(
      `SELECT id, sender_email AS "from", sender_name AS "fromName", recipient_email AS "to",
              content, offer_amount AS "offerAmount", offer_status AS "offerStatus", created_at
       FROM chat_messages
       WHERE conversation_key = $1${sinceClause}
       ORDER BY id ASC
       LIMIT 500`,
      params
    );
    res.json({ messages: result.rows });
  } catch (err: any) {
    console.error('Failed to load messages:', err?.message || err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
};

/**
 * Accept or decline a price offer.
 * Only the recipient of the offer can decide.
 */
export const decideOffer = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, me } = req.body || {};

  if (!['accept', 'decline'].includes(action)) {
    return res.status(400).json({ error: 'action must be accept or decline' });
  }
  if (!me) {
    return res.status(400).json({ error: 'me is required' });
  }

  try {
    const existing = await pool.query(
      `SELECT id, conversation_key, sender_email AS "from", recipient_email AS "to",
              offer_amount AS "offerAmount", offer_status AS "offerStatus"
       FROM chat_messages WHERE id = $1 AND offer_amount IS NOT NULL`,
      [id]
    );
    const offer = existing.rows[0];
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    if (offer.to?.toLowerCase?.() !== String(me).toLowerCase()) {
      return res.status(403).json({ error: 'Only the recipient of the offer can respond' });
    }
    if (offer.offerStatus && offer.offerStatus !== 'proposed') {
      return res.status(400).json({ error: `This offer was already ${offer.offerStatus}` });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined';
    await pool.query('UPDATE chat_messages SET offer_status = $1 WHERE id = $2', [newStatus, id]);

    const updated = {
      ...offer,
      offerStatus: newStatus,
    };
    broadcastToEmails([offer.from, offer.to], { type: 'update-message', message: updated });
    res.json({ message: updated });
  } catch (err: any) {
    console.error('Failed to decide offer:', err?.message || err);
    res.status(500).json({ error: 'Failed to update the offer' });
  }
};
