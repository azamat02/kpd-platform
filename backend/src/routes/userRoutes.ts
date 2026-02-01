import { Router } from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  regeneratePassword,
} from '../controllers/userController';
import { authMiddleware, adminOnly } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

// Все CRUD операции только для админов
router.get('/', adminOnly, getUsers);
router.get('/:id', adminOnly, getUser);
router.post('/', adminOnly, createUser);
router.put('/:id', adminOnly, updateUser);
router.delete('/:id', adminOnly, deleteUser);

// Пересоздание пароля пользователя (только админ)
router.post('/:id/regenerate-password', adminOnly, regeneratePassword);

export default router;
