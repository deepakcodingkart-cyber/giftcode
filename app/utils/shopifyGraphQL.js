import fetch from "node-fetch"; // or just fetch in modern Node 18+

/**
 * Global function to call Shopify GraphQL API
 * @param {string} shop - Your shop domain (e.g., 'myshop.myshopify.com')
 * @param {string} accessToken - Shopify Admin API access token
 * @param {string} query - GraphQL query string
 * @param {Object} variables - Variables for the GraphQL query
 * @returns {Promise<Object>} - GraphQL response JSON
 */
export async function callShopifyGraphQL(shop, accessToken, query, variables = {}) {
  const shopDomain = shop || process.env.SHOP_NAME;
  const url = `https://${shopDomain}/admin/api/2025-10/graphql.json`; // Use your API version

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Shopify API error: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data;
}
