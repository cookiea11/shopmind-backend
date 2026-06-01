import axios from 'axios';
import crypto from 'crypto';
import Store from '../models/Store.js';
import { getShopDetails } from '../services/shopify.service.js';
import generateToken from '../utils/generateToken.js';
import env from '../config/env.js';

/**
 * Start Shopify OAuth flow
 * Redirects user to Shopify authorization endpoint
 */
export const startShopifyAuth = async (req, res) => {
  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({
        success: false,
        message: 'Shop domain is required',
      });
    }

    // Ensure shop domain ends with .myshopify.com
    const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;

    // Generate random state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');

    // Store state in session or cache (simplified - in production use Redis/session)
    req.session = req.session || {};
    req.session.oauthState = state;

    // Build Shopify authorization URL
    const scopes = env.shopifyScopes || 'read_products,write_products';
    const authUrl = `https://${shopDomain}/admin/oauth/authorize?client_id=${env.shopifyApiKey}&scope=${scopes}&redirect_uri=${env.shopifyAppUrl}/api/auth/callback&state=${state}`;

    return res.status(200).json({
      success: true,
      message: 'Redirect to Shopify authorization',
      authUrl,
    });
  } catch (error) {
    console.error('Error starting Shopify auth:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start Shopify authentication',
      error: error.message,
    });
  }
};

/**
 * Handle Shopify OAuth callback
 * Exchanges authorization code for access token
 */
export const shopifyCallback = async (req, res) => {
  try {
    const { code, shop, state } = req.query;

    if (!code || !shop) {
      return res.status(400).json({
        success: false,
        message: 'Missing authorization code or shop domain',
      });
    }

    // Verify state for CSRF protection (simplified)
    if (state !== (req.session?.oauthState)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid state parameter - possible CSRF attack',
      });
    }

    const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;

    // Exchange code for access token
    const tokenResponse = await axios.post(
      `https://${shopDomain}/admin/oauth/access_token`,
      {
        client_id: env.shopifyApiKey,
        client_secret: env.shopifyApiSecret,
        code,
      }
    );

    const accessToken = tokenResponse.data.access_token;
    const scope = tokenResponse.data.scope;

    if (!accessToken) {
      throw new Error('Failed to obtain access token from Shopify');
    }

    // Get shop details
    const shopDetails = await getShopDetails(shopDomain, accessToken);

    // Save or update store
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

    // Encrypt and save access token
    store.setAccessToken(accessToken);
    await store.save();

    // Generate JWT token
    const jwtToken = generateToken(store);

    return res.status(200).json({
      success: true,
      message: 'Successfully authenticated with Shopify',
      token: jwtToken,
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
    console.error('Error handling Shopify callback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete Shopify authentication',
      error: error.message,
    });
  }
};

/**
 * Save Shopify Store with manual credentials
 * User provides shopDomain, accessToken, and scope directly
 * NO JWT authentication required - this is the bootstrap endpoint
 */
export const saveShopifyStore = async (req, res) => {
  try {
    const { shopDomain, accessToken, scope } = req.body;

    if (!shopDomain || !accessToken || !scope) {
      return res.status(400).json({
        success: false,
        message: 'shopDomain, accessToken, and scope are required',
      });
    }

    // Validate credentials by fetching shop details from Shopify
    const shopDetails = await getShopDetails(shopDomain, accessToken);

    // Find or create store
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

    // Encrypt and save access token
    store.setAccessToken(accessToken);
    await store.save();

    // Generate JWT token for future requests
    const token = generateToken(store);

    return res.status(200).json({
      success: true,
      message: 'Store saved successfully',
      token,
      data: {
        storeId: store._id,
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