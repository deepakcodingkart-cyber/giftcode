import { getCustomerByEmailQuery } from "../lib/graphql/user";
import { callShopifyGraphQL } from "./shopifyGraphQL";

export async function getCustomerFromShopify(shop, accessToken, email) {
  try {
    const query = getCustomerByEmailQuery(email);
    const result = await callShopifyGraphQL(shop, accessToken, query);

    if (result.errors) {
      console.error("❌ GraphQL errors:", result.errors);
      return null;
    }

    const customer =
      result?.data?.customers?.edges?.[0]?.node || null;

    if (!customer) {
      console.warn("⚠️ No customer found with this email:", email);
    }

    return customer;
  } catch (error) {
    console.error("❌ Error fetching customer:", error);
    return null;
  }
}