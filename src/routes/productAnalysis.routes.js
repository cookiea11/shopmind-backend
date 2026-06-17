import { Router } from 'express';
import protect from '../middlewares/auth.middleware.js';
import {
  analyzeProductController,
  getAnalysisUsageController,
  getAnalyzedProductsController,
} from '../controllers/productAnalysis.controller.js';

const router = Router();

router.get('/stores/:storeId/analysis-usage', protect, getAnalysisUsageController);
router.get('/stores/:storeId/analyzed', protect, getAnalyzedProductsController);
router.post('/stores/:storeId/products/:productId/analyze', protect, analyzeProductController);

export default router;