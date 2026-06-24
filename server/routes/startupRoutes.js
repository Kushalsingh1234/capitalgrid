import express from 'express';
import { createStartup, getStartup } from '../controllers/startupController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', protect, createStartup);
router.get('/my-startup', protect, getStartup);

export default router;
