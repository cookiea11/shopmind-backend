import axios from 'axios';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Store from '../models/Store.js';

const API_VERSIONS = ['2025-07', '2025-04', '2024-10', '2024-07'];
const PAGE_LIMIT = 250;
const TIMEOUT = 15000;
const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseNextPageInfo(linkHeader) {
  if (!linkHeader) return null;
  const parts = linkHeader.split(',');
  const nextPart = parts.find((p) => p.includes('rel="next"'));
  if (!nextPart) return null;
  const match = nextPart.match(/<([^>]+)>/);
  if (!match) return null;
  const url = new URL(match[1]);
  return url.searchParams.get('page_info');
}

async function requestShopifyProducts(domain, accessToken, pageInfo = null) {
  for (const version of API_VERSIONS) {
    try {
      const url = new URL(`https://${domain}/admin/api/${version}/products.json`);
      url.searchParams.set('limit', String(PAGE_LIMIT));
      if (pageInfo) url.searchParams.set('page_info', pageInfo);

      const response = await axios.get(url.toString(), {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
          'User-Agent': 'ShopMind-Backend/1.0',
        },
        timeout: TIMEOUT,
      });

      return {
        data: response.data,
        nextPageInfo: parseNextPageInfo(response.headers?.link),
      };
    } catch (error) {
      console.error(`Shopify API error (version ${version}):`, error.response?.status, error.response?.data || error.message);
      if (error.response?.status === 401 || error.response?.status === 403) throw error;
      if (version === API_VERSIONS[API_VERSIONS.length - 1]) throw error;
    }
  }
}

async function fetchAllShopifyProducts(domain, accessToken) {
  let allProducts = [];
  let pageInfo = null;
  let safety = 0;

  while (true) {
    const res = await requestShopifyProducts(domain, accessToken, pageInfo);
    const products = res?.data?.products || [];
    allProducts = allProducts.concat(products);
    pageInfo = res?.nextPageInfo;
    safety += 1;
    if (!pageInfo || safety > 1000) break;
  }

  return allProducts;
}

function mapShopifyToProductDoc(shopifyProduct, storeId) {
  return {
    storeId,
    shopifyProductId: shopifyProduct.id,
    title: shopifyProduct.title || '',
    description: shopifyProduct.body_html || '',
    tags: shopifyProduct.tags
      ? shopifyProduct.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [],
    variants: shopifyProduct.variants || [],
  };
}

function buildBulkOps(products, storeId) {
  const storeObjectId = mongoose.Types.ObjectId.isValid(storeId)
    ? new mongoose.Types.ObjectId(storeId)
    : storeId;

  return products.map((product) => {
    const doc = mapShopifyToProductDoc(product, storeObjectId);
    return {
      updateOne: {
        filter: { storeId: storeObjectId, shopifyProductId: doc.shopifyProductId },
        update: { $set: doc },
        upsert: true,
      },
    };
  });
}

async function bulkWriteWithRetry(ops) {
  let attempt = 0;
  while (true) {
    try {
      if (!ops.length) return { acknowledged: true, modifiedCount: 0 };
      return await Product.bulkWrite(ops, { ordered: false });
    } catch (error) {
      attempt += 1;
      console.error('bulkWrite error:', error.message, error.writeErrors || '');
      const status = error.response?.status;
      const retryable = status === 429 || (status >= 500 && status <= 504);
      if (!retryable || attempt >= MAX_RETRIES) throw error;
      const retryAfter = Number(error.response?.headers?.['retry-after']);
      const delay = Number.isFinite(retryAfter)
        ? retryAfter * 1000
        : 1000 * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
}

export async function importProductsForStore(storeId) {
  const store = await Store.findById(storeId);
  if (!store) throw new Error('Store not found');
  if (!store.shopDomain) throw new Error('Store is missing shopDomain');
  if (!store.accessToken) throw new Error('Store does not have an access token');

  const products = await fetchAllShopifyProducts(store.shopDomain, store.accessToken);
  console.log(`Fetched ${products.length} products from Shopify for store ${storeId}`);

  const ops = buildBulkOps(products, store.id);
  const writeResult = await bulkWriteWithRetry(ops);

  console.log(`Imported ${products.length} products for store ${storeId}. bulkWrite result:`, {
    ok: Boolean(writeResult),
    insertedCount: writeResult.insertedCount ?? writeResult.nInserted ?? 0,
    upsertedCount: writeResult.upsertedCount ?? writeResult.nUpserted ?? 0,
    modifiedCount: writeResult.modifiedCount ?? writeResult.nModified ?? 0,
    writeErrors: writeResult.writeErrors || writeResult.writeErrorsCount || 0,
  });

  return {
    imported: products.length,
    rawCount: products.length,
    writeResult,
  };
}