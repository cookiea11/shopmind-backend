// This script defines the Express router for store-related routes in the application
import { Router } from 'express';
import { saveShopifyStore, testShopifyCredentials } from '../controllers/authController.js';

const router = Router();

router.post('/test-credentials', testShopifyCredentials);
router.post('/save', saveShopifyStore);

export default router;
