import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/authMiddleware';

// Параметры оценки для руководителей (Форма 1)
const MANAGER_PARAMS = [
  'quality', // Обеспечение качественного выполнения задач в курируемых подразделениях
  'deadlines', // Обеспечение соблюдения сроков выполнения задач в курируемых подразделениях
  'leadership', // Лидерство и навыки принятия решений
  'discipline', // Соблюдение трудовой дисциплины
  'noViolations', // Отсутствие дисциплинарных взысканий
];

// Параметры оценки для сотрудников (Форма 2)
const EMPLOYEE_PARAMS = [
  'quality', // Качество выполнения функциональных обязанностей
  'deadlines', // Соблюдение сроков выполнения задач
  'initiative', // Самостоятельность и инициативность
  'discipline', // Соблюдение трудовой дисциплины
  'noViolations', // Отсутствие дисциплинарных взысканий
];

// Определение типа формы на основе данных оцениваемого
const getFormType = (evaluatee: {
  subordinates: any[];
  canAccessPlatform: boolean;
}): 'manager' | 'employee' => {
  // Форма 1 для руководителей: имеет подчиненных ИЛИ имеет доступ к платформе
  if (evaluatee.subordinates.length > 0 || evaluatee.canAccessPlatform) {
    return 'manager';
  }
  // Форма 2 для обычных сотрудников
  return 'employee';
};

// Расчет результата по средней оценке
const getResultText = (averageScore: number): string => {
  if (averageScore >= 4.5) {
    return 'Выполняет функциональные обязанности эффективно';
  } else if (averageScore >= 3.5) {
    return 'Выполняет функциональные обязанности надлежащим образом';
  } else if (averageScore >= 2.5) {
    return 'Выполняет функциональные обязанности удовлетворительно';
  } else {
    return 'Выполняет функциональные обязанности неудовлетворительно';
  }
};

// Получить оценки текущего пользователя (для user)
export const getEvaluations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const evaluations = await prisma.evaluation.findMany({
      where: { evaluatorId: userId },
      include: {
        period: true,
        evaluatee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            group: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(evaluations);
  } catch (error) {
    console.error('Get evaluations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Получить все оценки (для админа)
export const getAllEvaluations = async (req: AuthRequest, res: Response) => {
  try {
    const { periodId } = req.query;

    const where: any = {};
    if (periodId) {
      where.periodId = parseInt(periodId as string);
    }

    const evaluations = await prisma.evaluation.findMany({
      where,
      include: {
        period: true,
        evaluator: {
          select: {
            id: true,
            fullName: true,
            position: true,
            group: { select: { id: true, name: true } },
          },
        },
        evaluatee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            group: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(evaluations);
  } catch (error) {
    console.error('Get all evaluations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Получить одну оценку
export const getEvaluation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const adminId = req.adminId;

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: parseInt(id) },
      include: {
        period: true,
        evaluator: {
          select: {
            id: true,
            fullName: true,
            position: true,
            group: { select: { id: true, name: true } },
          },
        },
        evaluatee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            group: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    // Проверка прав доступа: админ или владелец оценки
    if (!adminId && evaluation.evaluatorId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(evaluation);
  } catch (error) {
    console.error('Get evaluation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Рекурсивное получение всех подчиненных (прямых)
async function getDirectSubordinates(userId: number): Promise<number[]> {
  const subordinates = await prisma.user.findMany({
    where: { managerId: userId },
    select: { id: true },
  });
  return subordinates.map((s) => s.id);
}

// Получить список сотрудников, ожидающих оценки
export const getPendingEvaluations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Получить активный период
    const activePeriod = await prisma.evaluationPeriod.findFirst({
      where: { isActive: true },
      orderBy: { startDate: 'desc' },
    });

    if (!activePeriod) {
      return res.json({ period: null, subordinates: [] });
    }

    // Получить прямых подчиненных
    const subordinateIds = await getDirectSubordinates(userId);

    if (subordinateIds.length === 0) {
      return res.json({ period: activePeriod, subordinates: [] });
    }

    // Получить подчиненных с информацией об оценке
    const subordinates = await prisma.user.findMany({
      where: { id: { in: subordinateIds } },
      include: {
        group: { select: { id: true, name: true } },
        subordinates: { select: { id: true } },
        evaluationsReceived: {
          where: {
            periodId: activePeriod.id,
            evaluatorId: userId,
          },
          select: {
            id: true,
            averageScore: true,
            result: true,
            formType: true,
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    // Форматируем ответ
    const formattedSubordinates = subordinates.map((sub) => {
      const formType = getFormType(sub);
      const existingEvaluation = sub.evaluationsReceived[0] || null;

      return {
        id: sub.id,
        fullName: sub.fullName,
        position: sub.position,
        group: sub.group,
        canAccessPlatform: sub.canAccessPlatform,
        hasSubordinates: sub.subordinates.length > 0,
        formType,
        evaluation: existingEvaluation,
      };
    });

    res.json({
      period: activePeriod,
      subordinates: formattedSubordinates,
    });
  } catch (error) {
    console.error('Get pending evaluations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Создать или обновить оценку
export const createEvaluation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { periodId, evaluateeId, scores, comments } = req.body;

    if (!periodId || !evaluateeId || !scores) {
      return res.status(400).json({ error: 'Period ID, evaluatee ID, and scores are required' });
    }

    // Проверить период
    const period = await prisma.evaluationPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      return res.status(404).json({ error: 'Period not found' });
    }

    if (!period.isActive) {
      return res.status(400).json({ error: 'Period is not active' });
    }

    // Проверить, что evaluatee является подчиненным evaluator
    const evaluatee = await prisma.user.findUnique({
      where: { id: evaluateeId },
      include: {
        subordinates: { select: { id: true } },
      },
    });

    if (!evaluatee) {
      return res.status(404).json({ error: 'Evaluatee not found' });
    }

    if (evaluatee.managerId !== userId) {
      return res.status(403).json({ error: 'You can only evaluate your direct subordinates' });
    }

    // Определить тип формы
    const formType = getFormType(evaluatee);
    const expectedParams = formType === 'manager' ? MANAGER_PARAMS : EMPLOYEE_PARAMS;

    // Валидация оценок (только целые числа 1-5)
    const scoreValues: number[] = [];
    for (const param of expectedParams) {
      const score = scores[param];
      if (score === undefined || score === null) {
        return res.status(400).json({ error: `Missing score for parameter: ${param}` });
      }
      if (typeof score !== 'number' || !Number.isInteger(score) || score < 1 || score > 5) {
        return res.status(400).json({ error: `Invalid score for parameter: ${param}. Must be integer 1-5.` });
      }
      scoreValues.push(score);
    }

    // Расчет средней оценки
    const averageScore = Math.round((scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) * 100) / 100;
    const result = getResultText(averageScore);

    // Создать или обновить оценку
    const evaluation = await prisma.evaluation.upsert({
      where: {
        periodId_evaluatorId_evaluateeId: {
          periodId,
          evaluatorId: userId,
          evaluateeId,
        },
      },
      update: {
        formType,
        scores,
        comments: comments || null,
        averageScore,
        result,
      },
      create: {
        periodId,
        evaluatorId: userId,
        evaluateeId,
        formType,
        scores,
        comments: comments || null,
        averageScore,
        result,
      },
      include: {
        period: true,
        evaluatee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            group: { select: { id: true, name: true } },
          },
        },
      },
    });

    res.status(201).json(evaluation);
  } catch (error) {
    console.error('Create evaluation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
