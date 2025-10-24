export const GET_VARIANT_BY_ID = `
  query GetVariantById($id: ID!) {
    node(id: $id) {
      ... on ProductVariant {
        id
        title
        sku
        price
        compareAtPrice
        availableForSale
        
        image {
          url
          altText
          width
          height
        }
        product {
          id
          title
          handle
          description
          productType
          vendor
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
        }

        selectedOptions {
          name
          value
        }
      }
    }
  }
`;

export const GET_VARIANTS_BY_IDS = `
  query GetVariantsByIds($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        title
        sku
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        availableForSale
        quantityAvailable
        selectedOptions {
          name
          value
        }
        image {
          url
          altText
          width
          height
        }
        product {
          id
          title
          handle
          description
          productType
          vendor
        }
      }
    }
  }
`;