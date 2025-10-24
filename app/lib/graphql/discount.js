export function getCreateDiscountMutation() {
  return `
    mutation CreateIndividualDiscountCode($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              title
              codes(first: 1) {
                nodes { code }
              }
              customerSelection {
                ... on DiscountCustomers { customers { id } }
              }
              customerGets {
                value {
                  ... on DiscountAmount {
                    amount { amount currencyCode }
                    appliesOnEachItem
                  }
                  ... on DiscountPercentage {
                    percentage
                  }
                }
                items {
                  ... on DiscountProducts {
                    productVariants(first: 10) {
                      nodes { id title }
                    }
                  }
                }
              }
            }
          }
        }
        userErrors { field message }
      }
    }
  `;
}