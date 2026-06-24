import express from 'express';
import { register, login, googleLogin, getCurrentUser } from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Public auth actions
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);

// Protected auth profile query
router.get('/me', protect, getCurrentUser);

export default router;
