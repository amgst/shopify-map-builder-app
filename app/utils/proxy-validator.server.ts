import crypto from 'crypto';

// Shopify App Proxy Request Validator
// Validates that requests are coming from Shopify's app proxy system

interface ProxyRequest {
  shop: string;
  signature: string;
  timestamp: string;
  path_prefix?: string;
  [key: string]: any;
}

export class ProxyValidator {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  // Validate Shopify app proxy request
  validateRequest(url: URL): { isValid: boolean; shop?: string; error?: string } {
    const params = new URLSearchParams(url.search);
    const shop = params.get('shop');
    const signature = params.get('signature');
    const timestamp = params.get('timestamp');

    // Check required parameters
    if (!shop) {
      return { isValid: false, error: 'Missing shop parameter' };
    }

    if (!signature) {
      return { isValid: false, error: 'Missing signature parameter' };
    }

    if (!timestamp) {
      return { isValid: false, error: 'Missing timestamp parameter' };
    }

    // Validate shop format
    if (!this.isValidShopDomain(shop)) {
      return { isValid: false, error: 'Invalid shop domain format' };
    }

    // Check timestamp (prevent replay attacks)
    const requestTime = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - requestTime);
    
    // Allow 5 minutes tolerance
    if (timeDiff > 300) {
      return { isValid: false, error: 'Request timestamp too old' };
    }

    // Validate signature
    if (!this.validateSignature(params, signature)) {
      return { isValid: false, error: 'Invalid signature' };
    }

    return { isValid: true, shop };
  }

  // Validate the HMAC signature
  private validateSignature(params: URLSearchParams, providedSignature: string): boolean {
    try {
      // Remove signature from params for validation
      const paramsForSigning = new URLSearchParams(params);
      paramsForSigning.delete('signature');
      
      // Sort parameters alphabetically
      const sortedParams = Array.from(paramsForSigning.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

      // Create HMAC signature
      const calculatedSignature = crypto
        .createHmac('sha256', this.secret)
        .update(sortedParams)
        .digest('hex');

      // Compare signatures (constant time comparison)
      return crypto.timingSafeEqual(
        Buffer.from(providedSignature, 'hex'),
        Buffer.from(calculatedSignature, 'hex')
      );
    } catch (error) {
      console.error('Signature validation error:', error);
      return false;
    }
  }

  // Validate shop domain format
  private isValidShopDomain(shop: string): boolean {
    // Shop should be in format: shop-name.myshopify.com
    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]\.myshopify\.com$/;
    return shopRegex.test(shop);
  }

  // Extract shop name from domain
  static getShopName(shop: string): string {
    return shop.replace('.myshopify.com', '');
  }

  // Create a development mode validator (less strict for testing)
  static createDevValidator(): ProxyValidator {
    return new ProxyValidator(process.env.SHOPIFY_API_SECRET || 'dev-secret');
  }

  // Create a production validator
  static createProdValidator(): ProxyValidator {
    const secret = process.env.SHOPIFY_API_SECRET;
    if (!secret) {
      throw new Error('SHOPIFY_API_SECRET environment variable is required');
    }
    return new ProxyValidator(secret);
  }
}

// Helper function to validate proxy request in routes
export function validateProxyRequest(request: Request): { isValid: boolean; shop?: string; error?: string } {
  const url = new URL(request.url);
  
  // Use development validator in dev mode, production validator in production
  const validator = process.env.NODE_ENV === 'production' 
    ? ProxyValidator.createProdValidator()
    : ProxyValidator.createDevValidator();

  return validator.validateRequest(url);
}

// Middleware function for proxy routes
export function requireValidProxy(request: Request) {
  const validation = validateProxyRequest(request);
  
  if (!validation.isValid) {
    throw new Response(`Proxy validation failed: ${validation.error}`, { 
      status: 403,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }

  return validation.shop!;
}

// Development helper - allows bypassing validation for local testing
export function validateProxyRequestDev(request: Request): { isValid: boolean; shop?: string; error?: string } {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');
  
  // In development, just check for shop parameter
  if (!shop) {
    return { isValid: false, error: 'Missing shop parameter' };
  }

  // Allow any shop format in development
  return { isValid: true, shop };
}