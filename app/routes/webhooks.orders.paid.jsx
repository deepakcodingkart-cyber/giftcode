// app/routes/webhooks/orders.create.js

import { authenticate } from "../shopify.server.js";
import { isDuplicateWebhook } from "../helpers/duplicateWebhook.js";
import { getAccessToken } from "../utils/getAccessToken.js";
import { processGiftItem } from "../utils/giftProcessor.js";
import { categorizeLineItems } from "../utils/itemCategorizer.js";

// NOTE: db, sendGiftCardEmail, createDiscountOnShopify, etc., are now imported within processGiftItem

export const action = async ({ request }) => {
  console.log("👉 Webhook - orders/create triggered");

  try {
    // 1. Prevent duplicate webhook calls
    const eventId = request.headers.get("x-shopify-event-id");
    if (isDuplicateWebhook(eventId)) {
      console.log(`⚠️ Duplicate Webhook received and ignored: ${eventId}`);
      return new Response("ok", { status: 200 });
    }

    // 2. Authenticate and get payload
    const { payload } = await authenticate.webhook(request);
    console.log("✅ Order payload received");

    const shopName = process.env.SHOP_NAME;
    const accessToken = await getAccessToken();

    const lineItems = payload?.line_items || [];
    const customer = payload?.customer;
    const orderEmail = payload?.email;

    // 3. Categorize products
    const { giftItems, subscriptionItems, normalItems } =
      categorizeLineItems(lineItems);

    // --- 4. Process Categorized Items ---

    // 🎁 Gift Products
    for (const gift of giftItems) {
      console.log("🎁 Gift Product Found:", gift.title);
      await processGiftItem({
        gift,
        payload, // Pass full payload for order ID/email
        shopName,
        accessToken,
        customer,
        orderEmail,
      });
    }

    // 🔁 Subscription Products
    for (const sub of subscriptionItems) {
      console.log("🔁 Subscription Product Found:", sub.title);
      // ➕ Add subscription-specific logic here or in a new utility
    }

    // 📦 Normal Products
    for (const normal of normalItems) {
      console.log("📦 Normal Product Found:", normal.title);
    }

    // 5. Respond to Shopify
    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("❌ Webhook processing failed:", error.message);
    // Respond with 200 to prevent repeated retries for non-fatal errors
    return new Response("ok", { status: 200 });
  }
};