import express from 'express';
import { createListing, getAllListings, buyListing } from '../controllers/marketplaceController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/list', protect, createListing);
router.get('/', protect, getAllListings);
router.post('/buy/:id', protect, buyListing);

export default router;
