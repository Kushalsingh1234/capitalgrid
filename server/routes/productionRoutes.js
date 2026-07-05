import express from 'express';
import { completeProduction, getInventory, startProduction } from '../controllers/productionController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/start', protect, startProduction);
router.post('/complete', protect, completeProduction);
router.get('/inventory', protect, getInventory);

export default router;
