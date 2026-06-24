import express from 'express';
import { getMyEmployees, hireEmployee, fireEmployee } from '../controllers/employeeController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMyEmployees);
router.post('/hire', protect, hireEmployee);
router.post('/fire', protect, fireEmployee);

export default router;
