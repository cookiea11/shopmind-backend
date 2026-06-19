// this utility generates a JWT token for a given store, which can be used for authentication in API requests.

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