import { createStorefrontApiClient } from '@shopify/storefront-api-client';

// Shopify Storefront API Client for cart operations
// This handles real cart integration for the app proxy

interface CartItem {
  merchandiseId: string;
  quantity: number;
  attributes?: Array<{ key: string; value: string }>;
}

interface MapCartItem {
  location: string;
  style: string;
  size?: string;
  frame?: string;
}

export class StorefrontService {
  private client: any;
  private shop: string;

  constructor(shop: string, storefrontAccessToken: string) {
    this.shop = shop;
    this.client = createStorefrontApiClient({
      storeDomain: `https://${shop}`,
      apiVersion: '2024-01',
      publicAccessToken: storefrontAccessToken,
    });
  }

  // Create a cart with custom map product
  async createCartWithMap(mapData: MapCartItem, productId?: string) {
    const cartInput = {
      lines: [{
        merchandiseId: productId || 'gid://shopify/ProductVariant/default-map-product',
        quantity: 1,
        attributes: [
          { key: '_Map Builder', value: 'true' },
          { key: '_Map Location', value: mapData.location },
          { key: '_Map Style', value: mapData.style },
          { key: '_Map Size', value: mapData.size || 'standard' },
          { key: '_Map Frame', value: mapData.frame || 'none' },
          { key: '_Created At', value: new Date().toISOString() },
          { key: '_Custom Map Data', value: JSON.stringify(mapData) }
        ]
      }]
    };

    const query = `
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
            lines(first: 10) {
              nodes {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      title
                    }
                  }
                }
                attributes {
                  key
                  value
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

    try {
      const response = await this.client.request(query, {
        variables: { input: cartInput }
      });

      if (response.data?.cartCreate?.userErrors?.length > 0) {
        throw new Error(response.data.cartCreate.userErrors[0].message);
      }

      return response.data?.cartCreate?.cart;
    } catch (error) {
      console.error('Error creating cart:', error);
      throw error;
    }
  }

  // Add map item to existing cart
  async addMapToCart(cartId: string, mapData: MapCartItem, productId?: string) {
    const query = `
      mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart {
            id
            checkoutUrl
            lines(first: 10) {
              nodes {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      title
                    }
                  }
                }
                attributes {
                  key
                  value
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

    const lines = [{
      merchandiseId: productId || 'gid://shopify/ProductVariant/default-map-product',
      quantity: 1,
      attributes: [
        { key: '_Map Builder', value: 'true' },
        { key: '_Map Location', value: mapData.location },
        { key: '_Map Style', value: mapData.style },
        { key: '_Map Size', value: mapData.size || 'standard' },
        { key: '_Map Frame', value: mapData.frame || 'none' },
        { key: '_Created At', value: new Date().toISOString() },
        { key: '_Custom Map Data', value: JSON.stringify(mapData) }
      ]
    }];

    try {
      const response = await this.client.request(query, {
        variables: { cartId, lines }
      });

      if (response.data?.cartLinesAdd?.userErrors?.length > 0) {
        throw new Error(response.data.cartLinesAdd.userErrors[0].message);
      }

      return response.data?.cartLinesAdd?.cart;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  // Get available map products from the store
  async getMapProducts() {
    const query = `
      query getMapProducts {
        products(first: 10, query: "tag:map-builder OR title:*map*") {
          nodes {
            id
            title
            handle
            description
            variants(first: 5) {
              nodes {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
              }
            }
            images(first: 1) {
              nodes {
                url
                altText
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.client.request(query);
      return response.data?.products?.nodes || [];
    } catch (error) {
      console.error('Error fetching map products:', error);
      return [];
    }
  }

  // Create a direct checkout URL with map data
  async createDirectCheckout(mapData: MapCartItem, productId?: string) {
    try {
      const cart = await this.createCartWithMap(mapData, productId);
      return cart?.checkoutUrl;
    } catch (error) {
      console.error('Error creating direct checkout:', error);
      // Fallback to cart URL with query parameters
      const params = new URLSearchParams({
        'attributes[_Map Builder]': 'true',
        'attributes[_Map Location]': mapData.location,
        'attributes[_Map Style]': mapData.style,
        'attributes[_Created At]': new Date().toISOString()
      });
      return `https://${this.shop}/cart/add?${params.toString()}`;
    }
  }
}

// Helper function to get storefront access token from environment or config
export function getStorefrontAccessToken(shop: string): string {
  // In production, you'd store this securely per shop
  // For now, using a default token that should be configured in Shopify admin
  return process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || '';
}

// Factory function to create StorefrontService instance
export function createStorefrontService(shop: string): StorefrontService {
  const token = getStorefrontAccessToken(shop);
  if (!token) {
    throw new Error('Storefront access token not configured');
  }
  return new StorefrontService(shop, token);
}