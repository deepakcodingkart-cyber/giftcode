import { authenticate } from "../shopify.server.js";
import { isDuplicateWebhook } from "../helpers/duplicateWebhook.js";
import db from "../db.server.js";
import { sendGiftCardEmail } from "../utils/giftEmail.jsx";

export const action = async ({ request }) => {
  console.log("✅ Webhook - orders/create triggered");

  try {
    const eventId = request.headers.get("x-shopify-event-id");
    if (isDuplicateWebhook(eventId)) return new Response("ok", { status: 200 });

    const { admin, payload } = await authenticate.webhook(request);

    const isGiftProduct = payload.line_items?.some(item =>
      (item.name?.toLowerCase().includes("gift") ||
        item.title?.toLowerCase().includes("gift")) ||
      item.properties?.some(
        prop =>
          prop.name === "Recipient Name" ||
          prop.name === "Recipient Email" ||
          prop.name === "Gift Message"
      )
    );

    if (isGiftProduct) {
      const giftCardCode = `GIFT${payload.order_number || Date.now()}`;
      const mutation = `
        mutation giftCardCreate($input: GiftCardCreateInput!) {
          giftCardCreate(input: $input) {
            giftCard { id lastCharacters }
            userErrors { field message }
          }
        }
      `;
      const variables = {
        input: {
          initialValue: parseFloat(payload.current_total_price || payload.total_price).toFixed(2),
          note: `Created from order ${payload.name}`,
          code: giftCardCode
        }
      };

      const response = await admin.graphql(mutation, { variables });
      const responseData = await response.json();

      if (responseData.data.giftCardCreate.userErrors?.length > 0) {
        console.error("⚠️ Gift Card Error:", responseData.data.giftCardCreate.userErrors);
      } else {
        // ✅ Save DB
        const giftItem = payload.line_items.find(item =>
          item.name?.toLowerCase().includes("gift") ||
          item.title?.toLowerCase().includes("gift")
        );

        await db.coupon.create({
          data: {
            order_id: payload.id.toString(),
            coupon_code: giftCardCode,
            variant_id: giftItem?.variant_id?.toString() || "0",
            createdAt: new Date()
          }
        });
        console.log("💾 Saved coupon to DB");

        // ✅ Send Email using helper
        const recipientProperty = giftItem.properties.find(p => p.name === "Recipient Email");
        const recipientNameProperty = giftItem.properties.find(p => p.name === "Recipient Name");
        console.log("📩 Recipient Email:", recipientProperty?.value);
        console.log("📩 Recipient Name:", recipientNameProperty?.value);

        // New (Correct) Call in orders/create.js
        await sendGiftCardEmail({
          toEmail: recipientProperty?.value || payload.customer?.email,
          recipientName: recipientNameProperty?.value || payload.customer?.first_name,
          giftCardCode: giftCardCode,
          amount: parseFloat(payload.total_price).toFixed(2),
          fromEmail: payload?.email || payload?.customer?.email,
        });
      }
    }

    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("❌ Webhook failed:", error.message);
    return new Response("ok", { status: 200 });
  }
};
