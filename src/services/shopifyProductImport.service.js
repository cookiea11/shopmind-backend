import axios from 'axios';
import Product from '../models/Product.js';
import Store from '../models/Store.js';

export async function fetchShopifyProducts(domain, accessToken) {
  const apiVersions = ['2023-10', '2023-07', '2023-04', '2022-10'];
  let lastError = null;

  try {
    for (const version of apiVersions) {
      try {
        const url = `https://${domain}/admin/api/${version}/products.json?limit=250`;
        console.log(`Attempting to fetch products with API version ${version}...`);
        const response = await axios.get(url, {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
            'User-Agent': 'ShopMind-Backend/1.0',
          },
          timeout: 10000,
        });
        console.log(`✓ Successfully fetched products with API version ${version}`);
        return response.data;
      } catch (error) {
        console.error(`Error fetching products with API version ${version}:`, error.message);
        lastError = error;
      }
    }
    throw lastError || new Error('Failed to fetch products from Shopify');
  } catch (error) {
    if (error.response?.status === 401) {
      error.message = 'Unauthorized - Invalid or expired access token';
    } else if (error.response?.status === 403) {
      error.message = 'Forbidden - Check custom app scopes: read_products';
    }
    console.error(`Final error after trying all API versions: ${error.message}`);
    throw error;
  }
}

function mapShopifyToProducts(shopifyProduct, storeId) {
  return {
    storeId: storeId,
    shopifyProductId: shopifyProduct.id,
    title: shopifyProduct.title || '',
    description: shopifyProduct.body_html || '',
    tags: shopifyProduct.tags
      ? shopifyProduct.tags.split(',').map((tag) => tag.trim())
      : [],
    variants: shopifyProduct.variants || [],
  };
}
export async function importProductsForStore(storeId){
    const store = await Store.findById(storeId);
    if(!store){
        throw new Error('Store not found');
    }
    if(!store.accessToken){
        throw new Error('Store does not have an access token');
    }
  const shopDomain = store.shopDomain;
  const accessToken = store.accessToken; // virtual getter on Store model
    let nextPageInfo = null;
    let fetched=0;
    try{
    const respData = await fetchShopifyProducts(shopDomain, accessToken);
    const products = (respData && respData.products) || [];
        for(const shopifyProduct of products){
            const doc = mapShopifyToProductDoc(shopifyProduct, storeId);
            await Product.findOneAndUpdate(
                { shopifyProductId: doc.shopifyProductId, storeId: doc.storeId },
                { $set: doc },
                { upsert: true, new: true }
            );
            fetched++;
        }
          return { imported: fetched, rawCount: products.length };
    }catch(err){
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          err.message = 'Unauthorized - Invalid or expired access token';
        }
                throw err;
            }
        
    }
