import { Router } from 'express';
import {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
} from '../controllers/groupController';
import { authMiddleware, adminOnly } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

// Все операции с группами только для админов
router.get('/', adminOnly, getGroups);
router.get('/:id', adminOnly, getGroup);
router.post('/', adminOnly, createGroup);
router.put('/:id', adminOnly, updateGroup);
router.delete('/:id', adminOnly, deleteGroup);

export default router;
