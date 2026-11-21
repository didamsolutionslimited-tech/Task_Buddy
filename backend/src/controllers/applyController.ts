import { Request, Response } from 'express';
import path from 'path';
import pool from '../config/db';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d][\d\s-]{6,20}$/;

// Flat task list (categories reverted per product decision)
export const SERVICES = [
  { name: 'Cleaning', icon: '🧹' },
  { name: 'Plumbing', icon: '🚰' },
  { name: 'Electrical', icon: '⚡' },
  { name: 'Furniture', icon: '🛋️' },
  { name: 'Gardening', icon: '🌱' },
  { name: 'General Help', icon: '📦' },
  { name: 'Air Conditioner Repair', icon: '❄️' },
  { name: 'Auto Repair', icon: '🔧' },
];

export const getServices = async (_req: Request, res: Response) => {
  res.json({ services: SERVICES });
};

/**
 * POST /api/apply/become-tasker   (multipart/form-data)
 * fields: full_name, email, phone, services (JSON array)
 * files:  documents[]  (optional — technical college certificates,
 *          trade licenses etc., open to every applicant)
 */
export const becomeTasker = async (req: Request, res: Response) => {
  const { full_name, email, phone } = req.body || {};

  let services: string[] = [];
  try {
    services = typeof req.body.services === 'string' ? JSON.parse(req.body.services) : req.body.services ?? [];
  } catch {
    services = typeof req.body.services === 'string' ? String(req.body.services).split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  }

  if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
    return res.status(400).json({ error: 'Please provide your full name' });
  }
  if (!email || !EMAIL_REGEX.test(String(email))) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }
  if (!phone || !PHONE_REGEX.test(String(phone))) {
    return res.status(400).json({ error: 'Please provide a valid phone number' });
  }
  if (!Array.isArray(services) || services.length === 0) {
    return res.status(400).json({ error: 'Please pick at least one task/service' });
  }
  const validServices = services.filter((s) => SERVICES.some((x) => x.name === s));
  if (validServices.length !== services.length) {
    return res.status(400).json({ error: 'Unknown service selected' });
  }

  const files: Express.Multer.File[] = (req.files as any[]) || [];
  const docPaths = files.map((f) => `/uploads/${f.filename}`);

  try {
    const result = await pool.query(
      `INSERT INTO tasker_applications (full_name, email, phone, trade, services, documents)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        full_name.trim().slice(0, 120),
        String(email).trim().slice(0, 255),
        String(phone).trim().slice(0, 32),
        validServices.join(', ').slice(0, 250),
        JSON.stringify(validServices),
        JSON.stringify(docPaths),
      ]
    );
    return res.status(201).json({ status: 'received', application_id: result.rows[0].id, documents: docPaths });
  } catch (err: any) {
    console.error('Failed to save tasker application:', err?.message || err);
    return res.status(500).json({ error: 'Failed to submit application. Please try again.' });
  }
};

export const uploadDir = path.join(__dirname, '..', '..', 'uploads');
