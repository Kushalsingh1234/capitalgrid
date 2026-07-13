import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { getRankings, getMyRankingSummary } from '../controllers/rankingsController.js';

const router = express.Router();

router.get('/', protect, getRankings);
router.get('/my-summary', protect, getMyRankingSummary);

export default router;
