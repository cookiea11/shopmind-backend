import app from './app.js';
import env from './config/env.js';
import connectDB from './config/db.js';
import mongoose from 'mongoose';

const PORT = env.port;

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`ShopMind API running on port ${PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer();