import mongoose from 'mongoose';
import env from './env.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    console.log(`MongoDB database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('connected', () => {
  console.log('Mongoose connection established');
});

mongoose.connection.on('error', (error) => {
  console.error(`Mongoose connection error: ${error.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('Mongoose connection disconnected');
});

export default connectDB;