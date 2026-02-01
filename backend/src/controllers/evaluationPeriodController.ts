import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/authMiddleware';

// Получить все периоды оценки
export const getPeriods = async (req: AuthRequest, res: Response) => {
  try {
    const periods = await prisma.evaluationPeriod.findMany({
      include: {
        _count: {
          select: { evaluations: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });
    res.json(periods);
  } catch (error) {
    console.error('Get periods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Получить один период
export const getPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const period = await prisma.evaluationPeriod.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { evaluations: true },
        },
      },
    });

    if (!period) {
      return res.status(404).json({ error: 'Period not found' });
    }

    res.json(period);
  } catch (error) {
    console.error('Get period error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Создать период
export const createPeriod = async (req: AuthRequest, res: Response) => {
  try {
    const { name, startDate, endDate, isActive = true } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ error: 'Name, start date, and end date are required' });
    }

    const period = await prisma.evaluationPeriod.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
      },
    });

    res.status(201).json(period);
  } catch (error) {
    console.error('Create period error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Обновить период
export const updatePeriod = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, isActive } = req.body;

    const existingPeriod = await prisma.evaluationPeriod.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingPeriod) {
      return res.status(404).json({ error: 'Period not found' });
    }

    const period = await prisma.evaluationPeriod.update({
      where: { id: parseInt(id) },
      data: {
        name: name ?? existingPeriod.name,
        startDate: startDate ? new Date(startDate) : existingPeriod.startDate,
        endDate: endDate ? new Date(endDate) : existingPeriod.endDate,
        isActive: isActive ?? existingPeriod.isActive,
      },
    });

    res.json(period);
  } catch (error) {
    console.error('Update period error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Удалить период
export const deletePeriod = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existingPeriod = await prisma.evaluationPeriod.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingPeriod) {
      return res.status(404).json({ error: 'Period not found' });
    }

    await prisma.evaluationPeriod.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Period deleted successfully' });
  } catch (error) {
    console.error('Delete period error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
