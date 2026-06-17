import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { dedupeStoreProducts } from '../src/services/shopifyProductImport.service.js';
import Store from '../src/models/Store.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const shopDomain = process.argv[2] || 'demo-jewellery-store.myshopify.com';
  const store = await Store.findOne({ shopDomain });

  if (!store) {
    console.error(`No store found for ${shopDomain}`);
    process.exit(1);
  }

  const removed = await dedupeStoreProducts(store._id);
  console.log(`Store ${store._id}: removed ${removed} duplicate product(s)`);

  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
