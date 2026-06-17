import dotenv from 'dotenv';

dotenv.config();
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb+srv://siddhigulati_db_user:WXmFKd779t9NSd3f@cluster1.5f0puds.mongodb.net/shopmind?appName=Cluster1',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  encryptionKey: process.env.ENCRYPTION_KEY || '',
  shopifyApiKey: process.env.SHOPIFY_API_KEY || '',
  shopifyApiSecret: process.env.SHOPIFY_API_SECRET || '',
  shopifyScopes: process.env.SHOPIFY_SCOPES || 'read_products,write_products',
  shopifyAppUrl: process.env.SHOPIFY_APP_URL || '',
};

export default env;