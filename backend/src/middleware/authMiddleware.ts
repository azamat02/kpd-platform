import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  adminId?: number;
  userId?: number;
  role?: 'admin' | 'user';
}

interface JwtPayload {
  adminId?: number;
  userId?: number;
  role: 'admin' | 'user';
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;

    if (decoded.adminId) {
      req.adminId = decoded.adminId;
      req.role = 'admin';
    } else if (decoded.userId) {
      req.userId = decoded.userId;
      req.role = 'user';
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Middleware только для админов
export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

// Middleware для аутентифицированных пользователей (admin или user)
export const authenticatedOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.adminId && !req.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
