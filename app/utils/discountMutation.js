// app/utils/createDiscount.server.js
import { callShopifyGraphQL } from "./shopifyGraphQL.js";
import { getCreateDiscountMutation } from "../lib/graphql/discount.js";

export async function createDiscountOnShopify(shop, accessToken, discountData) {
  const mutation = getCreateDiscountMutation();

  const { value, code, title } = discountData;

  const variables = {
    basicCodeDiscount: {
      title: title || `Discount ${code}`,
      code,
      startsAt: new Date().toISOString(),
      customerSelection: {
        all: true   // ✅ No specific customer, works for all
      },
      customerGets: {
        value: {
          discountAmount: {
            amount: value.toString(),
            // currencyCode: "INR", // or "INR", "EUR" etc.
            appliesOnEachItem: false
          }
        },
        items: {
          all: true  // ✅ No specific variants/products
        }
      },
      usageLimit: 1  // Optional
    }
  };

  const response = await callShopifyGraphQL(shop, accessToken, mutation, variables);

  if (response.errors) console.error("❌ GraphQL errors:", response.errors);
  const userErrors = response?.data?.discountCodeBasicCreate?.userErrors || [];
  if (userErrors.length > 0) console.warn("⚠️ User Errors:", userErrors);

  return response;
}
