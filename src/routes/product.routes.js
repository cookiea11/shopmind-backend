import { Router } from 'express';
import {
  getAllStoredProducts,
  getSingleStoredProduct,
  analyzeProduct,
  importProductsForStore
} from '../controllers/product.controller.js';
import protect from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/stores/:storeId/import-products', protect, importProductsForStore);
router.get('/', protect, getAllStoredProducts);
router.get('/:id', protect, getSingleStoredProduct);
router.post('/:id/analyze', protect, analyzeProduct);

export default router;