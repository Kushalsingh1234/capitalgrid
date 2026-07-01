import express from 'express';
import { 
  createListing, 
  getAllListings, 
  buyListing, 
  getNcrCatalog, 
  buyFromNcr, 
  sellToNcr 
} from '../controllers/marketplaceController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/list', protect, createListing);
router.get('/', protect, getAllListings);
router.post('/buy/:id', protect, buyListing);

// NCR routes
router.get('/ncr/catalog', protect, getNcrCatalog);
router.post('/ncr/buy', protect, buyFromNcr);
router.post('/ncr/sell', protect, sellToNcr);

export default router;
