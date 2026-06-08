import { Router } from 'express';
import { saveShopifyStore, testShopifyCredentials } from '../controllers/authController.js';

const router = Router();

// Test endpoint - validates credentials without saving
router.post('/test-credentials', testShopifyCredentials);

// NO JWT protection - user needs to save credentials first to get a token
router.post('/save', saveShopifyStore);

export default router;
