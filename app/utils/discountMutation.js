// app/utils/createDiscount.server.js
import { callShopifyGraphQL } from "./shopifyGraphQL.js";
import { getCreateDiscountMutation } from "../lib/graphql/discount.js"; // import the mutation

export async function createDiscountOnShopify(shop, accessToken, discountData) {
  // Get the mutation string from another file
  const mutation = getCreateDiscountMutation();

  const { selectedCustomersDetails, selectedVariantsDetails, discountSettings } = discountData;
  // const customerGIDs = selectedCustomersDetails.map(c => c.id);
  const variantGIDs = selectedVariantsDetails.map(
  v => `gid://shopify/ProductVariant/${v.variant_id}`
);
  console.log("🚀 ~ createDiscountOnShopify ~ variantGIDs:", variantGIDs)
  
  const { valueType, value, code, title } = discountSettings;

  const customerGetsValue =
    valueType === "Percentage"
      ? { percentage: parseFloat(value) / 100 }
      : {
          discountAmount: {
            amount: value.toString(),
            appliesOnEachItem: false,
          },
        };

  const variables = {
    basicCodeDiscount: {
      title: title || `Discount ${code}`,
      code,
      startsAt: new Date().toISOString(),
      appliesOncePerCustomer: true,
      customerSelection: {
        customers: { add: selectedCustomersDetails },
      },
      customerGets: {
        value: customerGetsValue,
        items: {
          products: {
            productVariantsToAdd: variantGIDs,
          },
        },
      },
    },
  };

  const result = await callShopifyGraphQL(shop, accessToken, mutation, variables);

  if (result.errors) console.error("❌ GraphQL errors:", result.errors);
  const userErrors = result?.data?.discountCodeBasicCreate?.userErrors || [];
  if (userErrors.length > 0) console.warn("⚠️ User Errors:", userErrors);

  return result;
}
