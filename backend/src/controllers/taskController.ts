import { Request, Response } from 'express';
import pool from '../config/db';

/** POST /api/tasks/create  (JWT) — post a task as the signed-in client */
export const createTask = async (req: Request, res: Response) => {
  const { category, title, description, budget, location_address, scheduled_at } = req.body || {};
  const clientId = req.user?.id;

  if (!clientId) return res.status(401).json({ error: 'Login required to post a task' });
  if (!title || String(title).trim().length < 3) {
    return res.status(400).json({ error: 'Give your task a title (at least 3 characters)' });
  }
  if (!description || String(description).trim().length < 5) {
    return res.status(400).json({ error: 'Describe what you need done' });
  }
  const b = Number(budget);
  if (!Number.isFinite(b) || b <= 0) {
    return res.status(400).json({ error: 'Provide your budget in ₦' });
  }
  if (!location_address || String(location_address).trim().length < 3) {
    return res.status(400).json({ error: 'Where should the tasker come?' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO tasks (client_id, title, description, budget, location_address, location_lat, location_lng, scheduled_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open') RETURNING *`,
      [clientId, String(title).trim().slice(0, 160), String(description).trim().slice(0, 4000), b,
       String(location_address).trim().slice(0, 255),
       req.body.location_lat ?? null, req.body.location_lng ?? null,
       scheduled_at ? new Date(scheduled_at) : null]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    console.error('createTask failed:', err?.message);
    res.status(500).json({ error: 'Could not create the task' });
  }
};

/** GET /api/tasks/mine  (JWT) — tasks the user has posted */
export const myPostedTasks = async (req: Request, res: Response) => {
  const clientId = req.user?.id;
  if (!clientId) return res.status(401).json({ error: 'Login required' });
  try {
    const { rows } = await pool.query(
      `SELECT t.*, (SELECT COUNT(*) FROM bookings b WHERE b.task_id = t.id) AS offers
       FROM tasks t WHERE t.client_id = $1 ORDER BY t.created_at DESC LIMIT 100`,
      [clientId]
    );
    res.json({ tasks: rows });
  } catch (err: any) {
    console.error('myPostedTasks failed:', err?.message);
    res.status(500).json({ error: 'Could not load your posted tasks' });
  }
};

/** GET /api/tasks/helping  (JWT) — tasks booked/accepted by this tasker */
export const helpingTasks = async (req: Request, res: Response) => {
  const taskerId = req.user?.id;
  if (!taskerId) return res.status(401).json({ error: 'Login required' });
  try {
    const { rows } = await pool.query(
      `SELECT b.id AS booking_id, b.status AS booking_status, b.accepted_at, b.completed_at,
              t.id AS task_id, t.title, t.description, t.budget, t.location_address, t.status AS task_status,
              u.full_name AS client_name, u.email AS client_email
       FROM bookings b
       JOIN tasks t ON t.id = b.task_id
       LEFT JOIN users u ON u.id = t.client_id
       WHERE b.tasker_id = $1
       ORDER BY b.accepted_at DESC NULLS LAST
       LIMIT 100`,
      [taskerId]
    );
    res.json({ tasks: rows });
  } catch (err: any) {
    console.error('helpingTasks failed:', err?.message);
    res.status(500).json({ error: 'Could not load your booked jobs' });
  }
};

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM categories');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const getOpenTasks = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE status = $1', ['open']);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch open tasks' });
  }
};
