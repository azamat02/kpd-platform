import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/authMiddleware';

// Рекурсивное получение всех подчиненных
async function getSubordinatesTree(userId: number): Promise<any[]> {
  const direct = await prisma.user.findMany({
    where: { managerId: userId },
    include: {
      group: true,
    },
  });
  const all: any[] = [...direct];
  for (const sub of direct) {
    const nested = await getSubordinatesTree(sub.id);
    all.push(...nested);
  }
  return all;
}

// POST /api/auth/login — Единая точка входа (admin или user)
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // 1. Сначала проверить Admin
    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (admin) {
      const isValidPassword = await bcrypt.compare(password, admin.passwordHash);

      if (isValidPassword) {
        const token = jwt.sign(
          { adminId: admin.id, role: 'admin' },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '24h' }
        );

        return res.json({
          token,
          role: 'admin',
          admin: {
            id: admin.id,
            username: admin.username,
          },
        });
      }
    }

    // 2. Затем проверить User (по login)
    const user = await prisma.user.findFirst({
      where: { login: username },
      include: {
        group: true,
        manager: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
      },
    });

    if (user && user.canAccessPlatform && user.passwordHash) {
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

      if (isValidPassword) {
        const token = jwt.sign(
          { userId: user.id, role: 'user' },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '24h' }
        );

        // Получаем дерево подчиненных
        const subordinatesTree = await getSubordinatesTree(user.id);

        return res.json({
          token,
          role: 'user',
          user: {
            id: user.id,
            fullName: user.fullName,
            position: user.position,
            groupId: user.groupId,
            group: user.group,
            managerId: user.managerId,
            manager: user.manager,
            login: user.login,
            submitsBasicReport: user.submitsBasicReport,
            submitsKpi: user.submitsKpi,
            canAccessPlatform: user.canAccessPlatform,
            subordinatesTree,
          },
        });
      }
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
};

// GET /api/auth/me — Возвращает данные текущего пользователя + иерархию
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    // Если это админ
    if (req.adminId) {
      const admin = await prisma.admin.findUnique({
        where: { id: req.adminId },
        select: {
          id: true,
          username: true,
          createdAt: true,
        },
      });

      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      return res.json({
        role: 'admin',
        admin,
      });
    }

    // Если это пользователь
    if (req.userId) {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: {
          group: true,
          manager: {
            select: {
              id: true,
              fullName: true,
              position: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Получаем дерево подчиненных
      const subordinatesTree = await getSubordinatesTree(user.id);

      return res.json({
        role: 'user',
        user: {
          id: user.id,
          fullName: user.fullName,
          position: user.position,
          groupId: user.groupId,
          group: user.group,
          managerId: user.managerId,
          manager: user.manager,
          login: user.login,
          submitsBasicReport: user.submitsBasicReport,
          submitsKpi: user.submitsKpi,
          canAccessPlatform: user.canAccessPlatform,
          subordinatesTree,
        },
      });
    }

    return res.status(401).json({ error: 'Unauthorized' });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
