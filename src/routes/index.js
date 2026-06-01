import { Router } from 'express';
import mongoose from 'mongoose';
import env from '../config/env.js';
import authRoutes from './authRoutes.js';
import storeRoutes from './store.routes.js';
import privateRoutes from './private.routes.js';
import productRoutes from './product.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    success: true,
    message: 'ShopMind API is healthy',
    environment: env.nodeEnv,
    uptime: Math.floor(process.uptime()),
    database: {
      state: dbStateMap[mongoose.connection.readyState] || 'unknown',
    },
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/stores', storeRoutes);
router.use('/private', privateRoutes);
router.use('/products', productRoutes);

export default router;