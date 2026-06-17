import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Store from '../src/models/Store.js';
import generateToken from '../src/utils/generateToken.js';

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

 const shopDomain = 'demo-jewellery-store.myshopify.com'; // from mentor
  const realAccessToken = 'shpua_3a53bc2077efd3e5dbce1786f06edeca'; // from mentor

  let store = await Store.findOne({ shopDomain });
  if (!store) {
    store = new Store({ shopDomain, scope: 'read_products,write_products' });
  }
  store.setAccessToken(realAccessToken);
  await store.save();

  const token = generateToken(store);
  console.log('Store ID:', store._id.toString());
  console.log('Token:', token);

  process.exit(0);
};

run();
