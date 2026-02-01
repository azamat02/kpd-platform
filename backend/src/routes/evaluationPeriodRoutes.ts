import { Router } from 'express';
import {
  getPeriods,
  getPeriod,
  createPeriod,
  updatePeriod,
  deletePeriod,
} from '../controllers/evaluationPeriodController';
import { authMiddleware, adminOnly } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

// Все операции с периодами только для админов
router.get('/', adminOnly, getPeriods);
router.get('/:id', adminOnly, getPeriod);
router.post('/', adminOnly, createPeriod);
router.put('/:id', adminOnly, updatePeriod);
router.delete('/:id', adminOnly, deletePeriod);

export default router;
