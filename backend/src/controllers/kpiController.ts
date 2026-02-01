import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/authMiddleware';

// ==================== ADMIN ENDPOINTS ====================

// Получить все KPI (для админа)
export const getAllKpis = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) {
      where.status = status as string;
    }

    const kpis = await prisma.kpi.findMany({
      where,
      include: {
        createdByAdmin: {
          select: { id: true, username: true },
        },
        approver: {
          select: { id: true, fullName: true, position: true },
        },
        blocks: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
            },
          },
        },
        assignments: {
          include: {
            user: {
              select: { id: true, fullName: true, position: true },
            },
          },
        },
        _count: {
          select: { blocks: true, assignments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(kpis);
  } catch (error) {
    console.error('Get all KPIs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Получить один KPI
export const getKpi = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const kpi = await prisma.kpi.findUnique({
      where: { id: parseInt(id) },
      include: {
        createdByAdmin: {
          select: { id: true, username: true },
        },
        approver: {
          select: { id: true, fullName: true, position: true },
        },
        blocks: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
            },
          },
        },
        assignments: {
          include: {
            user: {
              select: { id: true, fullName: true, position: true, group: { select: { id: true, name: true } } },
            },
            factValues: true,
          },
        },
      },
    });

    if (!kpi) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    res.json(kpi);
  } catch (error) {
    console.error('Get KPI error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Создать KPI
export const createKpi = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.adminId;
    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, description, deadline, approverId } = req.body;

    if (!title || !deadline || !approverId) {
      return res.status(400).json({ error: 'Title, deadline, and approver are required' });
    }

    // Проверить, что approver существует
    const approver = await prisma.user.findUnique({
      where: { id: approverId },
    });

    if (!approver) {
      return res.status(404).json({ error: 'Approver not found' });
    }

    const kpi = await prisma.kpi.create({
      data: {
        title,
        description: description || null,
        deadline: new Date(deadline),
        createdById: adminId,
        approverId,
      },
      include: {
        createdByAdmin: {
          select: { id: true, username: true },
        },
        approver: {
          select: { id: true, fullName: true, position: true },
        },
        blocks: {
          include: {
            tasks: true,
          },
        },
        assignments: true,
      },
    });

    res.status(201).json(kpi);
  } catch (error) {
    console.error('Create KPI error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Обновить KPI (только DRAFT или REJECTED)
export const updateKpi = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, deadline, approverId } = req.body;

    const kpi = await prisma.kpi.findUnique({
      where: { id: parseInt(id) },
    });

    if (!kpi) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    if (kpi.status !== 'DRAFT' && kpi.status !== 'REJECTED') {
      return res.status(400).json({ error: 'Can only update KPI in DRAFT or REJECTED status' });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (deadline !== undefined) updateData.deadline = new Date(deadline);
    if (approverId !== undefined) {
      // Проверить, что approver существует
      const approver = await prisma.user.findUnique({
        where: { id: approverId },
      });
      if (!approver) {
        return res.status(404).json({ error: 'Approver not found' });
      }
      updateData.approverId = approverId;
    }

    // Если статус был REJECTED, вернуть в DRAFT
    if (kpi.status === 'REJECTED') {
      updateData.status = 'DRAFT';
      updateData.rejectionReason = null;
    }

    const updatedKpi = await prisma.kpi.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        createdByAdmin: {
          select: { id: true, username: true },
        },
        approver: {
          select: { id: true, fullName: true, position: true },
        },
        blocks: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
            },
          },
        },
        assignments: {
          include: {
            user: {
              select: { id: true, fullName: true, position: true },
            },
          },
        },
      },
    });

    res.json(updatedKpi);
  } catch (error) {
    console.error('Update KPI error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Удалить KPI (DRAFT, REJECTED или APPROVED)
export const deleteKpi = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const kpi = await prisma.kpi.findUnique({
      where: { id: parseInt(id) },
    });

    if (!kpi) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    // Нельзя удалить KPI на согласовании или завершённый
    if (kpi.status === 'PENDING_APPROVAL' || kpi.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot delete KPI in PENDING_APPROVAL or COMPLETED status' });
    }

    await prisma.kpi.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'KPI deleted' });
  } catch (error) {
    console.error('Delete KPI error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==================== BLOCK ENDPOINTS ====================

// Добавить блок
export const addBlock = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, weight } = req.body;

    if (!name || weight === undefined) {
      return res.status(400).json({ error: 'Name and weight are required' });
    }

    const kpi = await prisma.kpi.findUnique({
      where: { id: parseInt(id) },
      include: { blocks: true },
    });

    if (!kpi) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    if (kpi.status !== 'DRAFT' && kpi.status !== 'REJECTED') {
      return res.status(400).json({ error: 'Can only add blocks to KPI in DRAFT or REJECTED status' });
    }

    // Определить порядок для нового блока
    const maxOrder = kpi.blocks.reduce((max, block) => Math.max(max, block.order), -1);

    const block = await prisma.kpiBlock.create({
      data: {
        kpiId: parseInt(id),
        name,
        weight: parseFloat(weight),
        order: maxOrder + 1,
      },
      include: {
        tasks: true,
      },
    });

    res.status(201).json(block);
  } catch (error) {
    console.error('Add block error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Обновить блок
export const updateBlock = async (req: AuthRequest, res: Response) => {
  try {
    const { id, blockId } = req.params;
    const { name, weight, order } = req.body;

    const kpi = await prisma.kpi.findUnique({
      where: { id: parseInt(id) },
    });

    if (!kpi) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    if (kpi.status !== 'DRAFT' && kpi.status !== 'REJECTED') {
      return res.status(400).json({ error: 'Can only update blocks in KPI with DRAFT or REJECTED status' });
    }

    const block = await prisma.kpiBlock.findFirst({
      where: { id: parseInt(blockId), kpiId: parseInt(id) },
    });

    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (weight !== undefined) updateData.weight = parseFloat(weight);
    if (order !== undefined) updateData.order = order;

    const updatedBlock = await prisma.kpiBlock.update({
      where: { id: parseInt(blockId) },
      data: updateData,
      include: {
        tasks: {
          orderBy: { order: 'asc' },
        },
      },
    });

    res.json(updatedBlock);
  } catch (error) {
    console.error('Update block error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Удалить блок
export const deleteBlock = async (req: AuthRequest, res: Response) => {
  try {
    const { id, blockId } = req.params;

    const kpi = await prisma.kpi.findUnique({
      where: { id: parseInt(id) },
    });

    if (!kpi) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    if (kpi.status !== 'DRAFT' && kpi.status !== 'REJECTED') {
      return res.status(400).json({ error: 'Can only delete blocks from KPI with DRAFT or REJECTED status' });
    }

    const block = await prisma.kpiBlock.findFirst({
      where: { id: parseInt(blockId), kpiId: parseInt(id) },
    });

    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }

    await prisma.kpiBlock.delete({
      where: { id: parseInt(blockId) },
    });

    res.json({ message: 'Block deleted' });
  } catch (error) {
    console.error('Delete block error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==================== TASK ENDPOINTS ====================

// Добавить показатель в блок
export const addTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id, blockId } = req.params;
    const { name, weight, unit, planValue } = req.body;

    if (!name || weight === undefined) {
      return res.status(400).json({ error: 'Name and weight are required' });
    }

    const kpi = await prisma.kpi.findUnique({
      where: { id: parseInt(id) },
    });

    if (!kpi) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    if (kpi.status !== 'DRAFT' && kpi.status !== 'REJECTED') {
      return res.status(400).json({ error: 'Can only add tasks to KPI in DRAFT or REJECTED status' });
    }

    const block = await prisma.kpiBlock.findFirst({
      where: { id: parseInt(blockId), kpiId: parseInt(id) },
      include: { tasks: true },
    });

    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }

    // Определить порядок для новой задачи
    const maxOrder = block.tasks.reduce((max, task) => Math.max(max, task.order), -1);

    const task = await prisma.kpiTask.create({
      data: {
        blockId: parseInt(blockId),
        name,
        weight: parseFloat(weight),
        unit: unit || 'шт',
        planValue: planValue !== undefined ? parseFloat(planValue) : 100,
        order: maxOrder + 1,
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Add task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Обновить показатель
export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id, blockId, taskId } = req.params;
    const { name, weight, order, unit, planValue } = req.body;

    const kpi = await prisma.kpi.findUnique({
      where: { id: parseInt(id) },
    });

    if (!kpi) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    if (kpi.status !== 'DRAFT' && kpi.status !== 'REJECTED') {
      return res.status(400).json({ error: 'Can only update tasks in KPI with DRAFT or REJECTED status' });
    }

    const task = await prisma.kpiTask.findFirst({
      where: { id: parseInt(taskId), blockId: parseInt(blockId) },
      include: { block: true },
    });

    if (!task || task.block.kpiId !== parseInt(id)) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (weight !== undefined) updateData.weight = parseFloat(weight);
    if (order !== undefined) updateData.order = order;
    if (unit !== undefined) updateData.unit = unit;
    if (planValue !== undefined) updateData.planValue = parseFloat(planValue);

    const updatedTask = await prisma.kpiTask.update({
      where: { id: parseInt(taskId) },
      data: updateData,
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Удалить задачу
export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id, blockId, taskId } = req.params;

    const kpi = await prisma.kpi.findUnique({
      where: { id: parseInt(id) },
    });

    if (!kpi) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    if (kpi.status !== 'DRAFT' && kpi.status !== 'REJECTED') {
      return res.status(400).json({ error: 'Can only delete tasks from KPI with DRAFT or REJECTED status' });
    }

    const task = await prisma.kpiTask.findFirst({
      where: { id: parseInt(taskId), blockId: parseInt(blockId) },
      include: { block: true },
    });

    if (!task || task.block.kpiId !== parseInt(id)) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.kpiTask.delete({
      where: { id: parseInt(taskId) },
    });

    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==================== ASSIGNMENT ENDPOINTS ====================

// Назначить сотрудников
export const assignUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array is required' });
    }

    const kpi = await prisma.kpi.findUnique({
      where: { id: parseInt(id) },
    });

    if (!kpi) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    if (kpi.status !== 'DRAFT' && kpi.status !== 'REJECTED') {
      return res.status(400).json({ error: 'Can only assign users to KPI in DRAFT or REJECTED status' });
    }

    // Создать назначения (игнорировать дубликаты)
    const assignments = await Promise.all(
      userIds.map(async (userId: number) => {
        try {
          return await prisma.kpiAssignment.create({
            data: {
              kpiId: parseInt(id),
              userId,
            },
            include: {
              user: {
                select: { id: true, fullName: true, position: true },
              },
            },
          });
        } catch (error: any) {
          // Игнорировать ошибки уникальности (уже назначен)
          if (error.code === 'P2002') {
            return null;
          }
          throw error;
        }
      })
    );

    const createdAssignments = assignments.filter((a) => a !== null);
    res.status(201).json(createdAssignments);
  } catch (error) {
    console.error('Assign users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Убрать назначение
export const removeAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { id, userId } = req.params;

    const kpi = await prisma.kpi.findUnique({
      where: { id: parseInt(id) },
    });

    if (!kpi) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    if (kpi.status !== 'DRAFT' && kpi.status !== 'REJECTED') {
      return res.status(400).json({ error: 'Can only remove assignments from KPI in DRAFT or REJECTED status' });
    }

    const assignment = await prisma.kpiAssignment.findUnique({
      where: {
        kpiId_userId: {
          kpiId: parseInt(id),
          userId: parseInt(userId),
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await prisma.kpiAssignment.delete({
      where: { id: assignment.id },
    });

    res.json({ message: 'Assignment removed' });
  } catch (error) {
    console.error('Remove assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==================== SUBMIT FOR APPROVAL ====================

// Отправить на согласование
export const submitForApproval = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const kpi = await prisma.kpi.findUnique({
      where: { id: parseInt(id) },
      include: {
        blocks: {
          include: {
            tasks: true,
          },
        },
        assignments: true,
      },
    });

    if (!kpi) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    if (kpi.status !== 'DRAFT' && kpi.status !== 'REJECTED') {
      return res.status(400).json({ error: 'Can only submit KPI in DRAFT or REJECTED status' });
    }

    // Валидация
    const errors: string[] = [];

    // Минимум 1 блок
    if (kpi.blocks.length === 0) {
      errors.push('At least one block is required');
    }

    // Каждый блок должен иметь минимум 1 задачу
    for (const block of kpi.blocks) {
      if (block.tasks.length === 0) {
        errors.push(`Block "${block.name}" must have at least one task`);
      }

      // Сумма весов задач в блоке = 100%
      const taskWeight = block.tasks.reduce((sum, task) => sum + task.weight, 0);
      if (Math.abs(taskWeight - 100) > 0.01) {
        errors.push(`Tasks in block "${block.name}" must have total weight of 100%, current: ${taskWeight}%`);
      }
    }

    // Сумма весов блоков = 100%
    const blockWeight = kpi.blocks.reduce((sum, block) => sum + block.weight, 0);
    if (Math.abs(blockWeight - 100) > 0.01) {
      errors.push(`Total block weight must be 100%, current: ${blockWeight}%`);
    }

    // Минимум 1 назначенный сотрудник
    if (kpi.assignments.length === 0) {
      errors.push('At least one employee must be assigned');
    }

    // Срок в будущем
    if (new Date(kpi.deadline) <= new Date()) {
      errors.push('Deadline must be in the future');
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }

    const updatedKpi = await prisma.kpi.update({
      where: { id: parseInt(id) },
      data: {
        status: 'PENDING_APPROVAL',
        submittedAt: new Date(),
        rejectionReason: null,
      },
      include: {
        createdByAdmin: {
          select: { id: true, username: true },
        },
        approver: {
          select: { id: true, fullName: true, position: true },
        },
        blocks: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
            },
          },
        },
        assignments: {
          include: {
            user: {
              select: { id: true, fullName: true, position: true },
            },
          },
        },
      },
    });

    res.json(updatedKpi);
  } catch (error) {
    console.error('Submit for approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==================== APPROVER ENDPOINTS ====================

// Получить KPI на согласовании (для утверждающего)
export const getPendingApproval = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const kpis = await prisma.kpi.findMany({
      where: {
        approverId: userId,
        status: 'PENDING_APPROVAL',
      },
      include: {
        createdByAdmin: {
          select: { id: true, username: true },
        },
        approver: {
          select: { id: true, fullName: true, position: true },
        },
        blocks: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
            },
          },
        },
        assignments: {
          include: {
            user: {
              select: { id: true, fullName: true, position: true },
            },
          },
        },
        _count: {
          select: { blocks: true, assignments: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.json(kpis);
  } catch (error) {
    console.error('Get pending approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Утвердить KPI
export const approveKpi = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const kpi = await prisma.kpi.findUnique({
      where: { id: parseInt(id) },
    });

    if (!kpi) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    if (kpi.approverId !== userId) {
      return res.status(403).json({ error: 'You are not the approver for this KPI' });
    }

    if (kpi.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ error: 'KPI is not pending approval' });
    }

    const updatedKpi = await prisma.kpi.update({
      where: { id: parseInt(id) },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
      include: {
        createdByAdmin: {
          select: { id: true, username: true },
        },
        approver: {
          select: { id: true, fullName: true, position: true },
        },
        blocks: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
            },
          },
        },
        assignments: {
          include: {
            user: {
              select: { id: true, fullName: true, position: true },
            },
          },
        },
      },
    });

    res.json(updatedKpi);
  } catch (error) {
    console.error('Approve KPI error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Отклонить KPI
export const rejectKpi = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const kpi = await prisma.kpi.findUnique({
      where: { id: parseInt(id) },
    });

    if (!kpi) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    if (kpi.approverId !== userId) {
      return res.status(403).json({ error: 'You are not the approver for this KPI' });
    }

    if (kpi.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ error: 'KPI is not pending approval' });
    }

    const updatedKpi = await prisma.kpi.update({
      where: { id: parseInt(id) },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
      include: {
        createdByAdmin: {
          select: { id: true, username: true },
        },
        approver: {
          select: { id: true, fullName: true, position: true },
        },
        blocks: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
            },
          },
        },
        assignments: {
          include: {
            user: {
              select: { id: true, fullName: true, position: true },
            },
          },
        },
      },
    });

    res.json(updatedKpi);
  } catch (error) {
    console.error('Reject KPI error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==================== EMPLOYEE ENDPOINTS ====================

// Получить мои KPI (для сотрудника)
export const getMyKpis = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const assignments = await prisma.kpiAssignment.findMany({
      where: {
        userId,
        kpi: {
          status: { in: ['APPROVED', 'COMPLETED'] },
        },
      },
      include: {
        kpi: {
          include: {
            blocks: {
              orderBy: { order: 'asc' },
              include: {
                tasks: {
                  orderBy: { order: 'asc' },
                },
              },
            },
            approver: {
              select: { id: true, fullName: true, position: true },
            },
          },
        },
        factValues: true,
      },
      orderBy: {
        kpi: { deadline: 'asc' },
      },
    });

    res.json(assignments);
  } catch (error) {
    console.error('Get my KPIs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Получить детали моего KPI
export const getMyKpiDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const assignment = await prisma.kpiAssignment.findUnique({
      where: {
        kpiId_userId: {
          kpiId: parseInt(id),
          userId,
        },
      },
      include: {
        kpi: {
          include: {
            blocks: {
              orderBy: { order: 'asc' },
              include: {
                tasks: {
                  orderBy: { order: 'asc' },
                },
              },
            },
            approver: {
              select: { id: true, fullName: true, position: true },
            },
          },
        },
        factValues: true,
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'KPI assignment not found' });
    }

    if (assignment.kpi.status !== 'APPROVED' && assignment.kpi.status !== 'COMPLETED') {
      return res.status(403).json({ error: 'KPI is not available' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Get my KPI details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Сохранить факт-значения
export const saveFactValues = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { facts } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!facts || !Array.isArray(facts)) {
      return res.status(400).json({ error: 'facts array is required' });
    }

    const assignment = await prisma.kpiAssignment.findUnique({
      where: {
        kpiId_userId: {
          kpiId: parseInt(id),
          userId,
        },
      },
      include: {
        kpi: true,
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'KPI assignment not found' });
    }

    if (assignment.kpi.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Can only update facts for APPROVED KPI' });
    }

    if (assignment.isSubmitted) {
      return res.status(400).json({ error: 'Results already submitted' });
    }

    // Сохранить факт-значения
    const savedFacts = await Promise.all(
      facts.map(async (fact: { taskId: number; factValue: number | null; comment?: string }) => {
        return await prisma.kpiTaskFact.upsert({
          where: {
            taskId_assignmentId: {
              taskId: fact.taskId,
              assignmentId: assignment.id,
            },
          },
          update: {
            factValue: fact.factValue,
            comment: fact.comment || null,
          },
          create: {
            taskId: fact.taskId,
            assignmentId: assignment.id,
            factValue: fact.factValue,
            comment: fact.comment || null,
          },
        });
      })
    );

    res.json(savedFacts);
  } catch (error) {
    console.error('Save fact values error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Отправить результаты
export const submitResults = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const assignment = await prisma.kpiAssignment.findUnique({
      where: {
        kpiId_userId: {
          kpiId: parseInt(id),
          userId,
        },
      },
      include: {
        kpi: {
          include: {
            blocks: {
              include: {
                tasks: true,
              },
            },
          },
        },
        factValues: true,
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'KPI assignment not found' });
    }

    if (assignment.kpi.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Can only submit results for APPROVED KPI' });
    }

    if (assignment.isSubmitted) {
      return res.status(400).json({ error: 'Results already submitted' });
    }

    // Получить все ID задач
    const taskIds = assignment.kpi.blocks.flatMap((block) => block.tasks.map((t) => t.id));
    const filledTaskIds = assignment.factValues.filter((f) => f.factValue !== null).map((f) => f.taskId);

    const missingTasks = taskIds.filter((id) => !filledTaskIds.includes(id));
    if (missingTasks.length > 0) {
      return res.status(400).json({
        error: 'All tasks must have fact values',
        missingTasks,
      });
    }

    // Проверить срок
    if (new Date() > new Date(assignment.kpi.deadline)) {
      return res.status(400).json({ error: 'Deadline has passed' });
    }

    // Обновить назначение
    const updatedAssignment = await prisma.kpiAssignment.update({
      where: { id: assignment.id },
      data: {
        isSubmitted: true,
        submittedAt: new Date(),
      },
      include: {
        kpi: {
          include: {
            blocks: {
              include: {
                tasks: true,
              },
            },
            assignments: true,
          },
        },
        factValues: true,
      },
    });

    // Проверить, все ли сотрудники отправили результаты
    const allSubmitted = updatedAssignment.kpi.assignments.every((a) => a.isSubmitted);
    if (allSubmitted) {
      await prisma.kpi.update({
        where: { id: parseInt(id) },
        data: { status: 'COMPLETED' },
      });
    }

    res.json(updatedAssignment);
  } catch (error) {
    console.error('Submit results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
