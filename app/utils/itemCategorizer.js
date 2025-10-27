// app/utils/itemCategorizer.js

/**
 * Categorizes line items into Gift, Subscription, and Normal products.
 * @param {Array<Object>} lineItems - Array of line item objects from the Shopify order payload.
 * @returns {{giftItems: Array, subscriptionItems: Array, normalItems: Array}}
 */
export const categorizeLineItems = (lineItems) => {
  const giftItems = [];
  const subscriptionItems = [];
  const normalItems = [];

  lineItems.forEach((item) => {
    const title = item.title?.toLowerCase() || "";

    // Check for "recipient name" or "recipient email" properties
    const hasGiftProperties =
      item.properties &&
      item.properties.some((p) =>
        ["recipient name", "recipient email"].includes(p.name.toLowerCase())
      );

    const isGiftProduct = title.includes("gift") || hasGiftProperties;
    const isSubscription =
      title.includes("subscription") || item.selling_plan_allocation;

    if (isGiftProduct) {
      giftItems.push(item);
    } else if (isSubscription) {
      subscriptionItems.push(item);
    } else {
      normalItems.push(item);
    }
  });

  return { giftItems, subscriptionItems, normalItems };
};