import express from 'express';
import {
  getRetailStatus,
  updatePricing,
  startSalesCycle,
  stopSalesCycle,
  completeSalesCycle
} from '../controllers/retailController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/status', protect, getRetailStatus);
router.post('/pricing/update', protect, updatePricing);
router.post('/cycle/start', protect, startSalesCycle);
router.post('/cycle/stop', protect, stopSalesCycle);
router.post('/cycle/complete', protect, completeSalesCycle);

export default router;
