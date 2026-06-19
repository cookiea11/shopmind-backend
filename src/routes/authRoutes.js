// This script defines the Express router for authentication-related routes in the application.
//  Currently, it includes placeholder routes for Shopify OAuth authentication and callback
import { Router } from 'express';

const router = Router();

router.get('/shopify',  (_req, res) => res.status(501).json());
router.get('/callback', (_req, res) => res.status(501).json());

export default router;