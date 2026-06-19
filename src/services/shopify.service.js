// This script defines the Shopify service functions for fetching shop details and validating credentials

import axios from 'axios';

export const getShopDetails = async (shopDomain, accessToken) => {
  try {
    // Ensure domain format is correct
    const domain = shopDomain.includes('.myshopify.com') 
      ? shopDomain 
      : `${shopDomain}.myshopify.com`;

    // Validate inputs
    if (!domain || !accessToken) {
      throw new Error('shopDomain and accessToken are required');
    }

    if (accessToken.length < 20) {
      throw new Error('Access token appears to be invalid (too short)');
    }

    console.log(`[Shopify] Starting validation for domain: ${domain}`);
    console.log(`[Shopify] Token length: ${accessToken.length}`);

    const apiVersions = ['2024-10', '2024-07', '2024-04', '2023-10'];
    let lastError = null;

    for (const version of apiVersions) {
      try {
        const url = `https://${domain}/admin/api/${version}/shop.json`;

        console.log(`\n[Shopify] Attempt with version ${version}`);
        console.log(`[Shopify] URL: ${url}`);

        const response = await axios.get(url, {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
            'User-Agent': 'ShopMind-Backend/1.0',
          },
          timeout: 10000,
        });

        console.log(`[Shopify] ✓ Response received: ${response.status}`);
        console.log(`[Shopify] ✅ SUCCESS - Shop: ${response.data.shop?.name}`);
        return response.data.shop;
      } catch (error) {
        console.error(`[Shopify] Error with v${version}:`, error.message);

        if (error.response?.status === 401) {
          throw new Error(`Unauthorized - Invalid or expired access token`);
        } else if (error.response?.status === 404) {
          throw new Error(`Shop not found - Invalid domain "${domain}"`);
        } else if (error.response?.status === 403) {
          throw new Error(`Forbidden - Check custom app scopes: read_shops, read_products`);
        } else if (error.code === 'ENOTFOUND') {
          throw new Error(`DNS Error - Cannot resolve domain "${domain}"`);
        } else if (error.code === 'ECONNREFUSED') {
          throw new Error(`Connection refused - Server at ${domain} is not responding`);
        } else if (error.code === 'ECONNRESET') {
          lastError = new Error(`Connection reset - Server closed connection`);
          continue;
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
          lastError = new Error(`Request timeout - API took too long to respond`);
          continue;
        } else if (error.message.includes('fetch failed')) {
          console.error(`[Shopify] Node.js fetch API issue - trying with axios`);
          lastError = error;
          continue;
        }

        lastError = error;
        continue;
      }
    }

    throw lastError || new Error('Failed all API versions');
  } catch (error) {
    console.error(`\n[Shopify Service] FINAL ERROR: ${error.message}\n`);
    throw error;
  }
};


export const validateShopifyCredentials = async (shopDomain, accessToken) => {
  try {
    return await getShopDetails(shopDomain, accessToken);
  } catch (error) {
    throw new Error(`Validation failed: ${error.message}`);
  }
};
