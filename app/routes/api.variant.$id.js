import { callShopifyGraphQL } from '../utils/shopifyGraphQL';
import { GET_VARIANT_BY_ID } from '../lib/graphql/varients';
import { getAccessToken } from '../utils/getAccessToken';

// This runs for ALL requests (GET, POST, OPTIONS)
export const loader = async ({ request }) => {
  console.log("Come inside the function")
  const origin = request.headers.get("Origin") || "*";

  // ✅ If browser sends preflight (OPTIONS), return CORS headers with 200 OK
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },  
    });
  }

  // ✅ Normal GET request logic here
  try {
    const variantId = "42635337334845";

    const finalVariantId = `gid://shopify/ProductVariant/${variantId}`;
    const accessToken = await getAccessToken();

    const data = await callShopifyGraphQL(
      process.env.SHOP_NAME,
      accessToken,
      GET_VARIANT_BY_ID,
      { id: finalVariantId }
    );

    console.log(123, JSON.stringify(data, null, 2));

    return new Response(
      JSON.stringify({ success: true, variant: data.data.node }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin,
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed", message: err.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin,
        },
      }
    );
  }
};

