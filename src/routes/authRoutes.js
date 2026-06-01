import { Router } from 'express';
import { startShopifyAuth, shopifyCallback } from '../controllers/authController.js';

const router = Router();

router.get('/shopify', startShopifyAuth);
router.get('/callback', shopifyCallback);

export default router;