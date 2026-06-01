import { Router } from 'express';
import protect from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Protected route accessed',
    user: req.user,
  });
});

export default router;