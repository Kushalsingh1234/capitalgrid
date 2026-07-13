import express from 'express';
import { 
  getLoanEligibility, 
  getActiveLoans, 
  getLoanHistory, 
  applyForLoan, 
  repayLoan 
} from '../controllers/loanController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/eligibility', protect, getLoanEligibility);
router.get('/active', protect, getActiveLoans);
router.get('/history', protect, getLoanHistory);
router.post('/apply', protect, applyForLoan);
router.post('/:id/repay', protect, repayLoan);

export default router;
