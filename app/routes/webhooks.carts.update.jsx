// ✅ No import needed for json or TypeScript types

export async function action({ request }) {
  try {
    const cartData = await request.json(); // Read Shopify webhook data
    console.log('🛒 Cart Created Webhook Triggered:', cartData);


    // ✅ Send success response to Shopify
    return new Response('Webhook received', { status: 200 });
  } catch (error) {
    console.error('❌ Error handling carts/create webhook:', error);
    return new Response('Error processing webhook', { status: 500 });
  }
}

export function loader() {
  // Optional: Prevent GET access or return a simple message
  return new Response('Cart webhook endpoint active', { status: 200 });
}
