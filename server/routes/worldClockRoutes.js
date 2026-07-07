import express from 'express';
import { getClock, updateClock } from '../controllers/worldClockController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to get current clock parameters
router.get('/', getClock);

// Protected settings endpoint to modify settings
router.put('/settings', protect, updateClock);

export default router;
