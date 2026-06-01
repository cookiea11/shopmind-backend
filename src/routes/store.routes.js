import { Router } from 'express';
import { saveShopifyStore } from '../controllers/auth.controller.js';
import protect from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/save', protect, saveShopifyStore);

export default router;