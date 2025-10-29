export function getOrderByIdQuery() {
    return `    
    query GetOrderById($id: ID!) {
      order(id: $id) {
        id
        name
        email
        createdAt
        updatedAt
        displayFulfillmentStatus
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        subtotalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        totalShippingPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        customer {
          id
          firstName
          lastName
          email
        }
        lineItems(first: 50) {
          edges {
            node {
              title
              quantity
              originalUnitPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              customAttributes {
                key
                value
              }
              variant {
                id
                title
                sku
                product {
                  id
                  title
                  handle
                }
              }
            }
          }
        }
      }
    }
  `;
}