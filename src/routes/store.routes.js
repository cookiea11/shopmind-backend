import { Router } from 'express';
import { saveShopifyStore } from '../controllers/authController.js';

const router = Router();

// NO JWT protection - user needs to save credentials first to get a token
router.post('/save', saveShopifyStore);

export default router;