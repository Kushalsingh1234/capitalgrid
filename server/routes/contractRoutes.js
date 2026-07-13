import express from 'express';
import { publishContract, getContracts, getContract } from '../controllers/contractController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, publishContract);
router.get('/', protect, getContracts);
router.get('/:id', protect, getContract);

export default router;
