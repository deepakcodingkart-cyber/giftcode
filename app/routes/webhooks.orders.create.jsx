// import { authenticate } from "../shopify.server.js";
// import { isDuplicateWebhook } from "../helpers/duplicateWebhook.js";
// import db from "../db.server.js";
// import { sendGiftCardEmail } from "../utils/giftEmail.jsx";
// import { createDiscountOnShopify } from "../utils/discountMutation.js";
// import { getAccessToken } from "../utils/getAccessToken.js";
// // import { getCustomerFromShopify } from "../utils/getUserByEmail.js";

// export const action = async ({ request }) => {
//   console.log("👉 Webhook - orders/create triggered");

//   try {
//     // ✅ Shopify webhook unique event ID to prevent duplicate processing
//     const eventId = request.headers.get("x-shopify-event-id");

//     if (isDuplicateWebhook(eventId)) {
//       console.log(`⚠️ Duplicate Webhook received and ignored: ${eventId}`);
//       return new Response("ok", { status: 200 });
//     }

//     // ✅ Authenticate the incoming webhook request and extract payload
//     const { payload } = await authenticate.webhook(request);

//     const shopName = process.env.SHOP_NAME; // Shopify store name from environment variables
//     const accessToken = await getAccessToken(); // Securely fetch Shopify Access Token

//     console.log(`ℹ️ Processing Order ${payload.name} for shop: ${shopName}`);

//     // ✅ Detect if this order contains a gift product using line item properties
//     const giftItem = payload.line_items?.find(item =>
//       item.properties?.some(
//         prop =>
//           prop.name === "Recipient Name" ||
//           prop.name === "Recipient Email" ||
//           prop.name === "Gift Message"
//       )
//     );

//     console.log("🎁 Gift product detected. Starting gift card flow.");

//     // ❌ If no gift item found, exit early
//     if (!giftItem) {
//       console.log("ℹ️ No gift product detected. Exiting flow.");
//       return new Response("ok", { status: 200 });
//     }

//     // ✅ Extract gift recipient details from line item properties
//     const recipientProperty = giftItem.properties.find(p => p.name === "Recipient Email");
//     const recipientNameProperty = giftItem.properties.find(p => p.name === "Recipient Name");

//     // ✅ Generate a unique gift card/discount code
//     const giftCardCode = `GIFT${payload.order_number || Date.now()}`;

//     // ✅ Get order total price to set as gift card value
//     const orderTotalPrice = parseFloat(payload.current_total_price || payload.total_price).toFixed(2);

//     // ------------------------------------------------------------------
//     // 1️⃣ Create Discount Code in Shopify (as gift credit for recipient)
//     // ------------------------------------------------------------------
//     const discountData = {
//       code: giftCardCode, // Discount code value (e.g., GIFT12345)
//       title: `Gift Card Discount ${giftCardCode}`, // Visible name in Shopify
//       value: orderTotalPrice, // Amount-based discount (equal to order total)
//     };

//     try {
//       const discountResponse = await createDiscountOnShopify(shopName, accessToken, discountData);
//       console.log("✅ Discount Created Response:", JSON.stringify(discountResponse, null, 2));
//     } catch (discountError) {
//       console.error("❌ Discount Creation Failed:", discountError.message);
//     }

//     // ------------------------------------------------------------------
//     // 2️⃣ Save coupon details to database for tracking purposes
//     // ------------------------------------------------------------------
//     try {
//       await db.coupon.create({
//         data: {
//           order_id: payload.id.toString(),
//           coupon_code: giftCardCode,
//           variant_id: giftItem?.variant_id?.toString() || "0",
//           createdAt: new Date()
//         }
//       });
//       console.log("💾 Saved coupon details to DB");
//     } catch (dbError) {
//       console.error("❌ Database Save Failed:", dbError.message);
//     }

//     // ------------------------------------------------------------------
//     // 3️⃣ Send gift card email to the recipient
//     // ------------------------------------------------------------------
//     try {
//       await sendGiftCardEmail({
//         toEmail: recipientProperty?.value || payload.customer?.email, // Send to gift recipient or fallback to order buyer
//         recipientName: recipientNameProperty?.value || payload.customer?.first_name, // Personalization
//         giftCardCode, // Discount code sent to recipient
//         amount: orderTotalPrice, // Gift card value
//         fromEmail: payload?.email || payload?.customer?.email, // Sender's email
//       });
//       console.log("✅ Gift Card Email Sent");
//     } catch (emailError) {
//       console.error("❌ Gift Card Email Failed to Send:", emailError.message);
//     }

//     // ✅ Respond to Shopify that webhook was handled successfully
//     return new Response("ok", { status: 200 });

//   } catch (error) {
//     console.error("❌ Webhook processing failed (General Error):", error.message);
//     return new Response("ok", { status: 200 });
//   }
// };
