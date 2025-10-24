export function getCustomerByEmailQuery(email) {
  return `
    query {
      customers(first: 1, query: "${email}") {
        edges {
          node {
            id
            firstName
            lastName
          }
        }
      }
    }
  `;
}
