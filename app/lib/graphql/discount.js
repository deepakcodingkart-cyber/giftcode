// export function getCreateDiscountMutation() {
//   return `
//     mutation CreateIndividualDiscountCode($basicCodeDiscount: DiscountCodeBasicInput!) {
//       discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
//         codeDiscountNode {
//           id
//           codeDiscount {
//             ... on DiscountCodeBasic {
//               title
//               codes(first: 1) {
//                 nodes { code }
//               }
//               customerSelection {
//                 ... on DiscountCustomers { customers { id } }
//               }
//               customerGets {
//                 value {
//                   ... on DiscountAmount {
//                     amount { amount currencyCode }
//                     appliesOnEachItem
//                   }
//                   ... on DiscountPercentage {
//                     percentage
//                   }
//                 }
//                 items {
//                   ... on DiscountProducts {
//                     productVariants(first: 10) {
//                       nodes { id title }
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }
//         userErrors { field message }
//       }
//     }
//   `;
// }

// app/lib/graphql/discount.js

export function getCreateDiscountMutation() {
  return `
    mutation CreateSegmentDiscountCode($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              title
              codes(first: 10) {
                nodes {
                  code
                }
              }
              customerGets {
                value {
                  ... on DiscountAmount {
                    amount {
                      amount
                      currencyCode
                    }
                    appliesOnEachItem
                  }
                }
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
}
