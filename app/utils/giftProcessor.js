// app/utils/giftProcessor.js

import db from "../db.server.js";
import { sendGiftCardEmail } from "./giftEmail.jsx"; // Adjust path as needed
import { createDiscountOnShopify } from "./discountMutation.js"; // Adjust path as needed
import {
  getTotalPrice,
  getRecipientDetails,
  generateGiftCode,
} from "./couponHelpers.js";

/**
 * Processes a single gift line item: creates the discount, saves to DB, and sends email.
 * @param {Object} giftItemData
 * @param {Object} giftItemData.gift - The gift line item object.
 * @param {Object} giftItemData.payload - The full order payload (for order ID).
 * @param {string} giftItemData.shopName - The Shopify store name.
 * @param {string} giftItemData.accessToken - The Shopify API access token.
 * @param {Object} giftItemData.customer - The customer object from the order.
 * @param {string} giftItemData.orderEmail - The order's primary email.
 */
export const processGiftItem = async ({
  gift,
  payload,
  shopName,
  accessToken,
  customer,
  orderEmail,
}) => {
  const orderTotalPrice = getTotalPrice(gift);
  const giftCode = generateGiftCode(payload.id, gift.id);
  console.log("✅ Generated Gift Code:", giftCode);

  const recipientDetails = getRecipientDetails(gift);
  console.log("📩 Recipient Details:", recipientDetails);

  // 1. Create Discount on Shopify
  const discountData = {
    code: giftCode,
    title: `Gift Card Discount ${orderTotalPrice}`,
    value: orderTotalPrice,
  };

  try {
    await createDiscountOnShopify(
      shopName,
      accessToken,
      discountData
    );
    console.log("✅ Discount Created:", giftCode);
  } catch (discountError) {
    console.error("❌ Discount Creation Failed:", discountError.message);
    throw discountError; // Re-throw to stop further processing
  }

  // 2. Save gift in database
  try {
    await db.coupon.create({
      data: {
        order_id: payload.id.toString(),
        coupon_code: giftCode,
        variant_id: gift?.variant_id?.toString() || "0",
        createdAt: new Date(),
      },
    });
    console.log("💾 Saved coupon details to DB");
  } catch (dbError) {
    console.error("❌ Database Save Failed:", dbError.message);
    throw dbError;
  }

  // 3. Send email to recipient
  try {
    const toEmail = recipientDetails.email || orderEmail || customer?.email;
    const recipientName =
      recipientDetails.name || customer?.first_name || "Gift Recipient";

    await sendGiftCardEmail({
      toEmail,
      recipientName,
      giftCode,
      amount: orderTotalPrice,
      fromEmail: orderEmail || customer?.email,
      personalMessage: recipientDetails.message,
    });
    console.log("✅ Gift Card Email Sent to:", toEmail);
  } catch (emailError) {
    console.error("❌ Gift Card Email Failed to Send:", emailError.message);
    // Don't throw here - email failure shouldn't stop the whole process
  }

  // Return the gift code for metafield storage
  return giftCode;
};