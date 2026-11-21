import { Request, Response } from 'express';
import { getTierInfo, TIERS } from '../services/tierService';

/** GET /api/tiers/:userId — current tier, rating and progress */
export const getTier = async (req: Request, res: Response) => {
  try {
    const info = await getTierInfo(String(req.params.userId));
    res.json({ ...info, tiers_table: TIERS });
  } catch (err: any) {
    console.error('Failed to load tier:', err?.message || err);
    res.status(500).json({ error: 'Failed to load tier info' });
  }
};
