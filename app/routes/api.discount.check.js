import { callShopifyGraphQL } from "../utils/shopifyGraphQL.js";
import db from "../db.server.js"; // Prisma client
import { getOrderByIdQuery } from "../lib/graphql/order.js";

const ALLOWED_ORIGINS = ["https://shop-with-liquid-dashboard.myshopify.com"];

function corsHeaders(origin) {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
  return {
    "Access-Control-Allow-Origin": isAllowed
      ? origin
      : "https://shop-with-liquid-dashboard.myshopify.com",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
    "Content-Type": "application/json",
  };
}

const shop =
  process.env.SHOPIFY_SHOP || "shop-with-liquid-dashboard.myshopify.com";
const accessToken =
  process.env.SHOPIFY_ACCESS_TOKEN ||
  "shpua_1381ce66ea046d6f5034ef792835ee49";

export const loader = async ({ request }) => {
  console.log("🔍 Loader called. Method:", request.method);
  const origin = request.headers.get("Origin");
  const CORS_HEADERS = corsHeaders(origin);

  // Handle preflight request
  if (request.method === "OPTIONS") {
    console.log("✈️ Handling preflight OPTIONS request");
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Discount code is required in the URL (e.g. ?code=DISCOUNT10)",
        }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // ✅ 1. Check MySQL Database for coupon
    const couponData = await db.coupon.findFirst({
      where: { coupon_code: code },
    });

    if (!couponData) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Coupon not found in database",
        }),
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const orderId = `gid://shopify/Order/${couponData.order_id}`;
    console.log("🧩 Found order ID:", orderId);

    // ✅ 2. Get order details from Shopify
    const query = getOrderByIdQuery();
    const variables = { id: orderId };

    const shopifyResponse = await callShopifyGraphQL(
      shop,
      accessToken,
      query,
      variables
    );

    console.log("🧾 Shopify GraphQL Response:", shopifyResponse);

    if (shopifyResponse.errors) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Error from Shopify GraphQL",
          errors: shopifyResponse.errors,
        }),
        { status: 500, headers: CORS_HEADERS }
      );
    }

    const order = shopifyResponse.data?.order;

    if (!order) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Order not found on Shopify",
        }),
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // ✅ 3. Return both DB + Shopify data
    return new Response(
      JSON.stringify({
        success: true,
        message: "Order details fetched successfully",
        source: "database + shopify",
        coupon: couponData,
        order,
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Error fetching order details",
        error: error.message,
      }),
      { status: 500, headers: corsHeaders(request.headers.get("Origin")) }
    );
  }
};
