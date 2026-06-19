// This script is used to deduplicate products for a specific store in the database.

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { dedupeStoreProducts } from '../src/services/shopifyProductImport.service.js';
import Store from '../src/models/Store.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

// Get the store domain from command line arguments or use a default value

  const shopDomain = process.argv[2] || 'demo-jewellery-store.myshopify.com';
  const store = await Store.findOne({ shopDomain });

  // If the store is not found, log an error and exit

  if (!store) {
    console.error(`No store found for ${shopDomain}`);
    process.exit(1);
  }

  // Call the deduplication function and log the number of removed duplicates

  const removed = await dedupeStoreProducts(store._id);
  console.log(`Store ${store._id}: removed ${removed} duplicate product(s)`);

  process.exit(0);
};
// Run the script and handle any errors

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
