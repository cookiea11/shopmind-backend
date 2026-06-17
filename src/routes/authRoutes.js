import { Router } from 'express';

const router = Router();

// OAuth not implemented yet
router.get('/shopify',  (_req, res) => res.status(501).json({ message: 'OAuth not implemented' }));
router.get('/callback', (_req, res) => res.status(501).json({ message: 'OAuth not implemented' }));

export default router;