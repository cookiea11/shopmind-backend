import dotenv from 'dotenv';

dotenv.config();
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  shopifyApiKey: process.env.SHOPIFY_API_KEY || '',
  shopifyApiSecret: process.env.SHOPIFY_API_SECRET || '',
  shopifyScopes: process.env.SHOPIFY_SCOPES || 'read_products,write_products',
  shopifyAppUrl: process.env.SHOPIFY_APP_URL || '',
};

export default env;