import { Router } from 'express';
import {
  syncStoreProducts,
  getAllStoredProducts,
  getSingleStoredProduct,
  analyzeProduct,
} from '../controllers/product.controller.js';
import protect from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/sync', protect, syncStoreProducts);
router.get('/', protect, getAllStoredProducts);
router.get('/:id', protect, getSingleStoredProduct);
router.post('/:id/analyze', protect, analyzeProduct);

export default router;