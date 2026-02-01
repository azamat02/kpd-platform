import { Router } from 'express';
import {
  getGroupScores,
  getGroupScoreDetails,
  calculateGroupScores,
  getGroupScoresSummary,
} from '../controllers/groupScoreController';
import { authMiddleware, adminOnly } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);
router.use(adminOnly);

// GET /api/group-scores - Get group scores with hierarchy
router.get('/', getGroupScores);

// GET /api/group-scores/summary - Get summary statistics for scoring report
router.get('/summary', getGroupScoresSummary);

// POST /api/group-scores/calculate - Recalculate all group scores
router.post('/calculate', calculateGroupScores);

// GET /api/group-scores/:groupId - Get detailed info for a group
router.get('/:groupId', getGroupScoreDetails);

export default router;
