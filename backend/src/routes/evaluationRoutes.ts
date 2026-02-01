import { Router } from 'express';
import {
  getEvaluations,
  getAllEvaluations,
  getEvaluation,
  createEvaluation,
  getPendingEvaluations,
} from '../controllers/evaluationController';
import { authMiddleware, adminOnly } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

// Specific routes MUST come before parameterized routes

// Список подчиненных для оценки (для user)
router.get('/subordinates/pending', getPendingEvaluations);

// Для обычных пользователей
router.get('/pending', getEvaluations); // Подчиненные, ожидающие оценки
router.get('/my', getEvaluations); // Оценки текущего пользователя
router.post('/', createEvaluation); // Создать/отправить оценку

// Для админов
router.get('/', adminOnly, getAllEvaluations); // Все оценки

// Parameterized route MUST be last
router.get('/:id', getEvaluation); // Одна оценка (с проверкой прав)

export default router;
