import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Store from '../src/models/Store.js';
import generateToken from '../src/utils/generateToken.js';

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

 const shopDomain = 'demo-jewellery-store.myshopify.com'; // from mentor
  const realAccessToken = 'shpua_bc45594f81eb367ea812b5ea86627d06'; // from mentor

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
