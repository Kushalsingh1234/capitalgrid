import express from 'express';
import { completeProduction, getInventory } from '../controllers/productionController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/complete', protect, completeProduction);
router.get('/inventory', protect, getInventory);

export default router;
