import express from 'express';
import {
  createProposal,
  counterProposal,
  acceptAgreement,
  rejectAgreement,
  cancelAgreement,
  getAgreementDetails,
  getAgreementsList
} from '../controllers/agreementController.js';
import {
  sendAgreementDelivery,
  acceptAgreementDelivery,
  rejectAgreementDelivery,
  retractAgreement,
  terminateAgreement,
  getAgreementDeliveries
} from '../controllers/agreementExecutionController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createProposal);
router.get('/', protect, getAgreementsList);
router.get('/:id', protect, getAgreementDetails);
router.post('/:id/counter', protect, counterProposal);
router.post('/:id/accept', protect, acceptAgreement);
router.post('/:id/reject', protect, rejectAgreement);
router.post('/:id/cancel', protect, cancelAgreement);

// Logistics & Execution
router.post('/:id/deliveries/send', protect, sendAgreementDelivery);
router.post('/deliveries/:id/accept', protect, acceptAgreementDelivery);
router.post('/deliveries/:id/reject', protect, rejectAgreementDelivery);
router.post('/:id/retract', protect, retractAgreement);
router.post('/:id/terminate', protect, terminateAgreement);
router.get('/:id/deliveries', protect, getAgreementDeliveries);

export default router;
