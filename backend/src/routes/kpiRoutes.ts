import { Router } from 'express';
import {
  // Admin endpoints
  getAllKpis,
  getKpi,
  createKpi,
  updateKpi,
  deleteKpi,
  // Block endpoints
  addBlock,
  updateBlock,
  deleteBlock,
  // Task endpoints
  addTask,
  updateTask,
  deleteTask,
  // Assignment endpoints
  assignUsers,
  removeAssignment,
  // Submit for approval
  submitForApproval,
  // Approver endpoints
  getPendingApproval,
  approveKpi,
  rejectKpi,
  // Employee endpoints
  getMyKpis,
  getMyKpiDetails,
  saveFactValues,
  submitResults,
} from '../controllers/kpiController';
import { authMiddleware, adminOnly } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

// ==================== EMPLOYEE ROUTES (must come before parameterized routes) ====================
// Мои KPI (для сотрудника)
router.get('/my', getMyKpis);
router.get('/my/:id', getMyKpiDetails);
router.put('/my/:id/facts', saveFactValues);
router.post('/my/:id/submit', submitResults);

// ==================== APPROVER ROUTES ====================
// KPI на согласовании (для утверждающего)
router.get('/pending-approval', getPendingApproval);

// ==================== ADMIN ROUTES ====================
// CRUD для KPI
router.get('/', adminOnly, getAllKpis);
router.post('/', adminOnly, createKpi);

// ==================== PARAMETERIZED ROUTES (must come last) ====================
// Получить один KPI (доступен и админу и пользователю)
router.get('/:id', getKpi);

// Обновление и удаление KPI (только админ)
router.put('/:id', adminOnly, updateKpi);
router.delete('/:id', adminOnly, deleteKpi);

// Блоки (только админ)
router.post('/:id/blocks', adminOnly, addBlock);
router.put('/:id/blocks/:blockId', adminOnly, updateBlock);
router.delete('/:id/blocks/:blockId', adminOnly, deleteBlock);

// Задачи внутри блоков (только админ)
router.post('/:id/blocks/:blockId/tasks', adminOnly, addTask);
router.put('/:id/blocks/:blockId/tasks/:taskId', adminOnly, updateTask);
router.delete('/:id/blocks/:blockId/tasks/:taskId', adminOnly, deleteTask);

// Назначения (только админ)
router.post('/:id/assign', adminOnly, assignUsers);
router.delete('/:id/assign/:userId', adminOnly, removeAssignment);

// Отправить на согласование (только админ)
router.post('/:id/submit', adminOnly, submitForApproval);

// Утвердить/Отклонить (для утверждающего - обычного пользователя)
router.post('/:id/approve', approveKpi);
router.post('/:id/reject', rejectKpi);

export default router;
