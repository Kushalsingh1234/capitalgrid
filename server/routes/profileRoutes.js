import express from 'express';
import { getPublicProfile } from '../controllers/profileController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Allow authenticated users to view any company's public profile
router.get('/:id', protect, getPublicProfile);

export default router;
