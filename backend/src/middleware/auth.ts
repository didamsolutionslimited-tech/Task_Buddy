import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export interface AuthPayload {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const signToken = (user: AuthPayload) =>
  jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role || 'client' }, JWT_SECRET, { expiresIn: '7d' });

export const authOptional = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), JWT_SECRET) as AuthPayload;
    } catch {
      // invalid token stays anonymous
    }
  }
  next();
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Login required' });
  }
  next();
};
