// This script defines the controller function for creating a new store in the application. 
// It checks if the store already exists based on the provided shop domain, and if it does, 
// it returns the existing store's information along with a generated token. 
// If the store does not exist, it creates a new store record in the database, generates a token for it, and returns the new store's information along with the token

import Store from '../models/Store.js';
import generateToken from '../utils/generateToken.js';

const createStore = async (req, res) => {
  try {
    const { shopDomain, accessToken, scope } = req.body;

    if (!shopDomain || !accessToken) {
      return res.status(400).json({
        success: false,
        message: 'shopDomain and accessToken are required',
      });
    }

    const existingStore = await Store.findOne({ shopDomain });
    if (existingStore) {
      const token = generateToken(existingStore);

      return res.status(200).json({
        success: true,
        message: 'Store already exists',
        token,
        data: existingStore,
      });
    }

    const newStore = new Store({
      shopDomain,
      accessToken,
      scope,
    });

    await newStore.save();

    const token = generateToken(newStore);

    return res.status(201).json({
      success: true,
      message: 'Store created successfully',
      token,
      data: newStore,
    });
  } catch (error) {
    console.error('Error creating store:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create store',
    });
  }
};

export { createStore };