import { Request, Response } from 'express';
import pool from '../config/db';
import { BookingRequest } from '../models/Booking';

export const acceptTask = async (req: Request, res: Response) => {
  const task_id = req.body?.task_id;
  // tasker identity comes from the JWT (falls back to body for the mobile app)
  const tasker_id = req.user?.id || req.body?.tasker_id;

  if (!task_id) return res.status(400).json({ error: 'task_id is required' });
  if (!tasker_id) return res.status(401).json({ error: 'Login required' });

  try {
    const clientResult = await pool.query('SELECT status, client_id FROM tasks WHERE id = $1', [task_id]);
    const task = clientResult.rows[0];
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (String(task.client_id) === String(tasker_id)) {
      return res.status(400).json({ error: 'You cannot accept your own task' });
    }
    if (clientResult.rows[0]?.status !== 'open') {
      return res.status(400).json({ error: 'Task is no longer available' });
    }

    const bookingResult = await pool.query(
      'INSERT INTO bookings (task_id, tasker_id, status) VALUES ($1, $2, $3) RETURNING *',
      [task_id, tasker_id, 'accepted']
    );

    await pool.query('UPDATE tasks SET status = $1 WHERE id = $2', ['assigned', task_id]);

    res.json({
      message: 'Task accepted successfully',
      booking: bookingResult.rows[0]
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error while accepting task' });
  }
};

export const confirmCompletion = async (req: Request, res: Response) => {
  const { booking_id } = req.body;

  try {
    // Update booking to completed
    await pool.query('UPDATE bookings SET status = $1, completed_at = NOW() WHERE id = $2', ['completed', booking_id]);

    // Update task to completed
    const bookingResult = await pool.query('SELECT task_id FROM bookings WHERE id = $1', [booking_id]);
    const taskId = bookingResult.rows[0].task_id;
    await pool.query('UPDATE tasks SET status = $1 WHERE id = $2', ['completed', taskId]);

    res.json({ message: 'Task marked as completed' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error while confirming completion' });
  }
};
