// ✅ CORS headers (edit origin if needed)
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://shop-with-liquid-dashboard.myshopify.com", // or "*" while testing
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
  "Content-Type": "application/json"
};

// ✅ Handle GET (optional)
export const loader = async () => {
  return new Response(JSON.stringify({ message: "Use POST to check discount" }), {
    status: 200,
    headers: CORS_HEADERS
  });
};

// ✅ Handle POST + OPTIONS properly
export const action = async ({ request }) => {
  // ✅ 1. Handle OPTIONS preflight (must return 200 + CORS)
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  // ✅ 2. Handle POST request
  if (request.method === "POST") {
    try {
        const { code } = await request.json();
        console.log("Discount code received:", code);

      if (!code) {
        return new Response(
          JSON.stringify({ success: false, message: "Discount code is required" }),
          { status: 400, headers: CORS_HEADERS }
        );
      }

      // ✅ 3. Call Shopify API here
      const shopifyResponse = await fetch(
        `https://shop-with-liquid-dashboard.myshopify.com/admin/api/2024-10/discount_codes/lookup.json?code=${code}`,
        {
          method: "GET",
          headers: {
            "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN || "shpua_1381ce66ea046d6f5034ef792835ee49",
            "Content-Type": "application/json"
          }
        }
      );

      if (!shopifyResponse.ok) {
        return new Response(
          JSON.stringify({ success: false, message: "Invalid coupon or not found" }),
          { status: 404, headers: CORS_HEADERS }
        );
      }

      const result = await shopifyResponse.json();

      // ✅ 4. Return result back to frontend
      return new Response(
        JSON.stringify({
          success: true,
          message: "Discount is valid",
          data: result
        }),
        { status: 200, headers: CORS_HEADERS }
      );

    } catch (error) {
      console.error("Error checking discount:", error);
      return new Response(
        JSON.stringify({ success: false, message: "Server error", error: error.message }),
        { status: 500, headers: CORS_HEADERS }
      );
    }
  }

  // ✅ If method not allowed
  return new Response(JSON.stringify({ message: "Method Not Allowed" }), {
    status: 405,
    headers: CORS_HEADERS
  });
};
