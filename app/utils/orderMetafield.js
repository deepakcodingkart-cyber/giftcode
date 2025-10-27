/**
 * Updates order metafield with gift codes
 * @param {string} orderId - Shopify order ID
 * @param {Array<string>} giftCodes - Array of gift codes
 * @param {string} shopName - Shopify store name
 * @param {string} accessToken - Shopify API access token
 */
export const updateOrderGiftMetafield = async (orderId, giftCodes, shopName, accessToken) => {
  try {
    const response = await fetch(
      `https://${shopName}/admin/api/2024-01/orders/${orderId}/metafields.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({
          metafield: {
            namespace: "custom",
            key: "gift_code",
            value: giftCodes.join("\n"),
            type: "multi_line_text_field",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Metafield update failed: ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ Order metafield updated with gift codes:", giftCodes);
    return result;
  } catch (error) {
    console.error("❌ Failed to update order metafield:", error.message);
    throw error;
  }
};