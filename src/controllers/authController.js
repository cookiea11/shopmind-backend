import axios from 'axios';
import crypto from 'crypto';
import Store from '../models/Store.js';
import { getShopDetails, validateShopifyCredentials } from '../services/shopify.service.js';
import generateToken from '../utils/generateToken.js';
import env from '../config/env.js';

/**
 * Test endpoint to validate Shopify credentials
 * Used for debugging without saving to database
 */
export const testShopifyCredentials = async (req, res) => {
  try {
    const { shopDomain, accessToken } = req.body;

    console.log('\n=== TEST CREDENTIALS REQUEST ===');
    console.log(`Domain: ${shopDomain}`);
    console.log(`Token length: ${accessToken?.length || 0}`);

    if (!shopDomain || !accessToken) {
      return res.status(400).json({
        success: false,
        message: 'shopDomain and accessToken are required',
      });
    }

    const shopDetails = await validateShopifyCredentials(shopDomain, accessToken);

    console.log('=== TEST CREDENTIALS SUCCESS ===\n');

    return res.status(200).json({
      success: true,
      message: 'Credentials are valid',
      data: shopDetails,
    });
  } catch (error) {
    console.error('\n=== TEST CREDENTIALS FAILED ===');
    console.error(`Error: ${error.message}`);
    console.error('===================================\n');
    
    return res.status(400).json({
      success: false,
      message: 'Credential validation failed',
      error: error.message,
      troubleshooting: {
        possibleCauses: [
          'Network connectivity issue',
          'Invalid shop domain format',
          'Expired or invalid access token',
          'Custom app missing required scopes',
          'Firewall or proxy blocking Shopify API',
          'DNS resolution failure'
        ],
        solutions: [
          'Verify shop domain: must end with .myshopify.com',
          'Verify access token is current and not revoked',
          'Check custom app has scopes: read_products, read_shops',
          'Try: curl -I https://' + shopDomain + '/admin/api/2024-10/shop.json',
          'Ensure no firewall is blocking outbound HTTPS to Shopify'
        ]
      }
    });
  }
};

/**
 * Start Shopify OAuth flow
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

    const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
    const state = crypto.randomBytes(16).toString('hex');

    req.session = req.session || {};
    req.session.oauthState = state;

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

    if (state !== (req.session?.oauthState)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid state parameter - possible CSRF attack',
      });
    }

    const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;

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
 * NO JWT required - bootstrap endpoint
 */
export const saveShopifyStore = async (req, res) => {
  try {
    const { shopDomain, accessToken, scope } = req.body;

    console.log('\n=== SAVE STORE REQUEST ===');
    console.log(`Domain: ${shopDomain}`);
    console.log(`Scope: ${scope}`);

    if (!shopDomain || !accessToken || !scope) {
      return res.status(400).json({
        success: false,
        message: 'shopDomain, accessToken, and scope are required',
      });
    }

    console.log('[Auth] Validating credentials with Shopify...');
    const shopDetails = await getShopDetails(shopDomain, accessToken);
    console.log('[Auth] ✓ Credentials validated');

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
    console.log('[Auth] ✓ Store saved:', store._id);

    const token = generateToken(store);
    console.log('=== SAVE STORE SUCCESS ===\n');

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
    console.error('\n=== SAVE STORE FAILED ===');
    console.error(`Error: ${error.message}`);
    console.error('==========================\n');
    
    return res.status(500).json({
      success: false,
      message: 'Failed to save store',
      error: error.message,
    });
  }
};
