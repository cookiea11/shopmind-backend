import jwt from 'jsonwebtoken';

const generateToken = (store) => {
  return jwt.sign(
    {
      storeId: store._id,
      shopDomain: store.shopDomain,
      scope: store.scope,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

export default generateToken;