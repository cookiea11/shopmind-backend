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