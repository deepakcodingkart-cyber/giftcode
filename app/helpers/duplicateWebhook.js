// helpers/duplicateWebhook.js

const processedEvents = new Map();

/**
 * Checks if the webhook event is a duplicate.
 * @param {string} eventId - The unique Shopify webhook event ID from headers.
 * @param {number} [maxSize=1000] - Maximum number of events to keep in memory.
 * @returns {boolean} - Returns true if duplicate, false otherwise.
 */
export function isDuplicateWebhook(eventId, maxSize = 1000) {
  if (!eventId) return false; // No eventId, cannot be duplicate

  if (processedEvents.has(eventId)) {
    console.log("⚠️ Duplicate webhook ignored:", eventId);
    return true;
  }

  processedEvents.set(eventId, Date.now());

  // Prevent memory leak
  if (processedEvents.size > maxSize) {
    processedEvents.clear();
  }

  return false;
}
