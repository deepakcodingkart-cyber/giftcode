import { authenticate } from "../shopify.server.js";
import { isDuplicateWebhook } from "../helpers/duplicateWebhook.js";
import db from "../db.server.js";
import { sendGiftCardEmail } from "../utils/giftEmail.jsx";
import { createDiscountOnShopify } from "../utils/discountMutation.js";
import { getAccessToken } from "../utils/getAccessToken.js";

export const action = async ({ request }) => {
  console.log("👉 Webhook - orders/create triggered");

  try {
    const eventId = request.headers.get("x-shopify-event-id");
    if (isDuplicateWebhook(eventId)) {
      console.log(`⚠️ Duplicate Webhook received and ignored: ${eventId}`);
      return new Response("ok", { status: 200 });
    }

    const { admin, payload } = await authenticate.webhook(request);
    const shopName = process.env.SHOP_NAME;
    const accessToken = await getAccessToken();

    console.log(`ℹ️ Processing Order ${payload.name} for shop: ${shopName}`);

    // Check if the order contains a gift product
    const giftItem = payload.line_items?.find(item =>
      item.name?.toLowerCase().includes("gift") ||
      item.title?.toLowerCase().includes("gift") ||
      item.properties?.some(
        prop =>
          prop.name === "Recipient Name" ||
          prop.name === "Recipient Email" ||
          prop.name === "Gift Message"
      )
    );

    if (!giftItem) {
      console.log("ℹ️ No gift product detected. Exiting flow.");
      return new Response("ok", { status: 200 });
    }

    console.log("🎁 Gift product detected. Starting gift card flow.");

    const giftCardCode = `GIFT${payload.order_number || Date.now()}`;
    const orderTotalPrice = parseFloat(payload.current_total_price || payload.total_price).toFixed(2);

    // --- Create 100% Discount on Shopify ---
    const discountData = {
      selectedCustomersDetails: payload.customer.admin_graphql_api_id,
      selectedVariantsDetails: payload.line_items,
      discountSettings: {
        valueType: "Amount",
        value: orderTotalPrice,
        code: giftCardCode,
        title: `Discount for Gift Card ${giftCardCode}`
      }
    };

    try {
      const discountResponse = await createDiscountOnShopify(shopName, accessToken, discountData);
      console.log("✅ Discount Created Response:", JSON.stringify(discountResponse, null, 2));
    } catch (discountError) {
      console.error("❌ Discount Creation Failed:", discountError.message);
    }

    // --- Save to DB ---
    try {
      await db.coupon.create({
        data: {
          order_id: payload.id.toString(),
          coupon_code: giftCardCode,
          variant_id: giftItem?.variant_id?.toString() || "0",
          createdAt: new Date()
        }
      });
      console.log("💾 Saved coupon details to DB");
    } catch (dbError) {
      console.error("❌ Database Save Failed:", dbError.message);
    }

    // --- Send Gift Card Email ---
    try {
      const recipientProperty = giftItem.properties.find(p => p.name === "Recipient Email");
      const recipientNameProperty = giftItem.properties.find(p => p.name === "Recipient Name");

      await sendGiftCardEmail({
        toEmail: recipientProperty?.value || payload.customer?.email,
        recipientName: recipientNameProperty?.value || payload.customer?.first_name,
        giftCardCode,
        amount: orderTotalPrice,
        fromEmail: payload?.email || payload?.customer?.email,
      });
      console.log("✅ Gift Card Email Sent");
    } catch (emailError) {
      console.error("❌ Gift Card Email Failed to Send:", emailError.message);
    }

    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("❌ Webhook processing failed (General Error):", error.message);
    return new Response("ok", { status: 200 });
  }
};
