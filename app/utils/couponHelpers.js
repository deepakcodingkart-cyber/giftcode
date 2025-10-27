// app/utils/couponHelpers.js

/**
 * Generates a random string of uppercase letters.
 * @param {number} length - The length of the random string.
 * @returns {string} The generated random string.
 */
export const generateRandomString = (length = 4) => {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * Calculates the total price of a line item including tax.
 * @param {Object} lineItem - The line item object from the Shopify order payload.
 * @returns {number} The total price (price + taxes).
 */
export function getTotalPrice(lineItem) {
  const itemPrice = parseFloat(lineItem.price) || 0;
  const taxAmount = lineItem.tax_lines.reduce(
    (sum, tax) => sum + (parseFloat(tax.price) || 0),
    0
  );
  return itemPrice + taxAmount + 379;
}

/**
 * Extracts recipient details from line item properties.
 * @param {Object} giftLineItem - The line item object for the gift.
 * @returns {{name: string, email: string, message: string, deliveryDate: string}}
 */
export const getRecipientDetails = (giftLineItem) => {
  const findProp = (name) =>
    giftLineItem.properties?.find((p) => p.name === name)?.value;

  return {
    name: findProp("Recipient Name"),
    email: findProp("Recipient Email"),
    message: findProp("Personal Message"),
    deliveryDate: findProp("Delivery Date"),
  };
};

/**
 * Generates the unique gift code.
 * @param {string | number} orderId - The Shopify order ID.
 * @param {string | number} lineItemId - The Shopify line item ID.
 * @returns {string} The formatted gift code.
 */
export const generateGiftCode = (orderId, lineItemId) => {
  const orderShortId = String(orderId).slice(-4);
  const lineItemShortId = String(lineItemId).slice(-4);
  const randomPart = generateRandomString(4);
  return `GIFT_${orderShortId}_${randomPart}_${lineItemShortId}`;
};