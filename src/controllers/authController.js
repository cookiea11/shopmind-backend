import axios from 'axios';
import crypto from 'crypto';
import Store from '../models/Store.js';
import { getShopDetails } from '../services/shopify.service.js';

export const saveShopifyStore = async (req, res) => {
  try {
    const { shopDomain, accessToken, scope } = req.body;

    if (!shopDomain || !accessToken || !scope) {
      return res.status(400).json({
        success: false,
        message: 'shopDomain, accessToken, and scope are required',
      });
    }

    const shopDetails = await getShopDetails(shopDomain, accessToken);

    const store = await Store.findOneAndUpdate(
      { shopDomain },
      {
        shopDomain,
        scope,
        shopName: shopDetails.name || null,
        shopEmail: shopDetails.email || null,
        shopOwner: shopDetails.shop_owner || null,
        currency: shopDetails.currency || null,
        timezone: shopDetails.iana_timezone || null,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    store.setAccessToken(accessToken);
    await store.save();

    return res.status(200).json({
      success: true,
      message: 'Store saved successfully',
      data: {
        shopDomain: store.shopDomain,
        shopName: store.shopName,
        shopEmail: store.shopEmail,
        currency: store.currency,
        timezone: store.timezone,
        scope: store.scope,
      },
    });
  } catch (error) {
    console.error('Error saving Shopify store:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save store',
      error: error.message,
    });
  }
};