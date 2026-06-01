export const getShopDetails = async (shopDomain, accessToken) => {
  const url = `https://${shopDomain}/admin/api/2025-07/shop.json?fields=name,email,domain,currency,iana_timezone,plan_name,created_at`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch shop details: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.shop;
};