import { authenticate } from "../shopify.server.js";
import { isDuplicateWebhook } from "../helpers/duplicateWebhook.js";
import  db  from "../db.server.js";

export const action = async ({ request }) => {
  console.log("✅ Webhook - orders/create triggered");

  try {
    const eventId = request.headers.get("x-shopify-event-id");
    if (isDuplicateWebhook(eventId)) {
      return new Response("ok", { status: 200 });
    }

    const { admin, payload } = await authenticate.webhook(request);

    // Check if order contains a gift product
    const isGiftProduct = payload.line_items?.some(item => {
      const name = item.name?.toLowerCase() || '';
      const title = item.title?.toLowerCase() || '';
      return (
        name.includes("gift") ||
        title.includes("gift") ||
        item.properties?.some(prop =>
          prop.name === "Recipient Name" ||
          prop.name === "Recipient Email" ||
          prop.name === "Gift Message"
        )
      );
    });

    if (isGiftProduct) {
      const totalAmount = payload.current_total_price || payload.total_price;
      const giftCardCode = `GIFT${payload.order_number || Date.now()}`;  // ✅ FIXED TEMPLATE STRING

      // GraphQL Mutation for Gift Card Creation
      const mutation = `
        mutation giftCardCreate($input: GiftCardCreateInput!) {
          giftCardCreate(input: $input) {
            giftCard {
              id
              lastCharacters
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        input: {
          initialValue: parseFloat(totalAmount).toFixed(2),
          note: `Created from order ${payload.name}`,  // ✅ FIXED TEMPLATE STRING
          code: giftCardCode
        }
      };

      const response = await admin.graphql(mutation, { variables });
      const responseData = await response.json();

      console.log("🎁 Gift card creation response:", JSON.stringify(responseData, null, 2));

      if (responseData.data.giftCardCreate.userErrors?.length > 0) {
        console.error("⚠️ Gift card creation failed:", responseData.data.giftCardCreate.userErrors);
      } else {
        console.log("✅ Gift card created:", responseData.data.giftCardCreate.giftCard);

        // Find gift line item to save variant
        const giftItem = payload.line_items.find(item =>
          item.name?.toLowerCase().includes("gift") ||
          item.title?.toLowerCase().includes("gift")
        );

        // ✅ Save gift card to Coupon table
        await db.coupon.create({
          data: {
            order_id: payload.id.toString(),
            coupon_code: giftCardCode,
            variant_id: giftItem?.variant_id?.toString() || "0",
            createdAt: new Date()
          }
        });

        console.log("💾 Saved gift card info to database (Coupon table)");
      }
    }

    return new Response("ok", { status: 200 });

  } catch (error) {
    console.error("❌ Webhook failed:", error.message);
    return new Response("ok", { status: 200 });
  }
};
