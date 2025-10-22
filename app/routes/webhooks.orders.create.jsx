import { authenticate } from "../shopify.server.js";
import { isDuplicateWebhook } from "../helpers/duplicateWebhook.js";

export const action = async ({ request }) => {
  try {
    const eventId = request.headers.get("x-shopify-event-id");
    if (isDuplicateWebhook(eventId)) {
      return new Response("ok", { status: 200 });
    }

    const { admin, payload } = await authenticate.webhook(request);
    console.log("payload", JSON.stringify(payload, null, 2));
    
    // Gift product check
    const isGiftProduct = payload.line_items?.some(item => {
      const itemName = item.name?.toLowerCase() || '';
      const itemTitle = item.title?.toLowerCase() || '';
      
      return (
        itemName.includes('gift') || 
        itemTitle.includes('gift') ||
        item.properties?.some(prop => 
          prop.name === 'Recipient Name' || 
          prop.name === 'Recipient Email' ||
          prop.name === 'Gift Message'
        )
      );
    });

    if (isGiftProduct) {
      const totalAmount = payload.current_total_price || payload.total_price;

      // Create gift card using GraphQL
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
          note: `Created from order ${payload.name}`,
          code: `GIFT${payload.order_number || Date.now()}`
        }
      };

      const response = await admin.graphql(mutation, { variables });
      console.log("response", response);

      const responseData = await response.json();
      console.log("Gift card creation response:", responseData);

      if (responseData.data.giftCardCreate.userErrors.length > 0) {
        console.error("Gift card creation errors:", responseData.data.giftCardCreate.userErrors);
      } else {
        console.log("Gift card created successfully:", responseData.data.giftCardCreate.giftCard);
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Webhook failed:", err.message);
    return new Response("ok", { status: 200 });
  }
};