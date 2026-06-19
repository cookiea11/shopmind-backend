// This script defines the Express router for private routes in the application
// Currently, it includes a placeholder route for accessing user information.
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