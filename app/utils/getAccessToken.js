// utils/getAccessToken.js
import { sessionStorage } from "../shopify.server.js";

/**
 * Get Shopify access token for the shop specified in ENV
 * @returns {Promise<string>} Access token
 * @throws {Error} If SHOP_NAME is not defined or token not found
 */
export async function getAccessToken() {
  // 1️⃣ Read shop name from environment
  const shopName = process.env.SHOP_NAME;
  if (!shopName) {
    throw new Error("Environment variable SHOP_NAME is not defined.");
  }

  // 2️⃣ Fetch sessions for the shop
  const sessions = await sessionStorage.findSessionsByShop(shopName);
  
  if (!sessions || sessions.length === 0) {
    throw new Error(`No active sessions found for shop: ${shopName}`);
  }

  // 3️⃣ Pick the latest session or the first valid one
  const latestSession = sessions[0]; // or implement logic to pick the most recent

  // 4️⃣ Extract access token
  const accessToken = latestSession?.accessToken || latestSession?.access_token;
  if (!accessToken) {
    throw new Error(`Access token not found in session for shop: ${shopName}`);
  }

  return accessToken;
}
