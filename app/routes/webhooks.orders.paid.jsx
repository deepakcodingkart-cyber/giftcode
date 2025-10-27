import { authenticate } from "../shopify.server.js";
import { isDuplicateWebhook } from "../helpers/duplicateWebhook.js";
import { getAccessToken } from "../utils/getAccessToken.js";
import { processGiftItem } from "../utils/giftProcessor.js";
import { categorizeLineItems } from "../utils/itemCategorizer.js";
import { updateOrderGiftMetafield } from "../utils/orderMetafield.js"; // Add this import

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

    // Array to collect all gift codes from this order
    const allGiftCodes = [];

    // --- 4. Process Categorized Items ---

    // 🎁 Gift Products
    for (const gift of giftItems) {
      console.log("🎁 Gift Product Found:", gift.title);
      try {
        const giftCode = await processGiftItem({
          gift,
          payload,
          shopName,
          accessToken,
          customer,
          orderEmail,
        });
        
        // Add successful gift code to our collection
        allGiftCodes.push(giftCode);
        console.log("✅ Gift processing completed:", giftCode);
      } catch (giftError) {
        console.error("❌ Gift processing failed for item:", gift.id, giftError.message);
        // Continue with other gift items even if one fails
      }
    }

    // 5. Update Order Metafield with all gift codes
    if (allGiftCodes.length > 0) {
      try {
        await updateOrderGiftMetafield(
          payload.id,
          allGiftCodes,
          shopName,
          accessToken
        );
        console.log("🎯 Order metafield updated with all gift codes");
      } catch (metafieldError) {
        console.error("❌ Failed to update order metafield:", metafieldError.message);
        // Don't throw - metafield failure shouldn't break the whole process
      }
    } else {
      console.log("ℹ️ No gift codes to save in metafield");
    }

    // 🔁 Subscription Products
    for (const sub of subscriptionItems) {
      console.log("🔁 Subscription Product Found:", sub.title);
      // Add subscription-specific logic here
    }

    // 📦 Normal Products
    for (const normal of normalItems) {
      console.log("📦 Normal Product Found:", normal.title);
    }

    // 6. Respond to Shopify
    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("❌ Webhook processing failed:", error.message);
    return new Response("ok", { status: 200 });
  }
};