# Shopify App Proxy Setup Guide

This guide explains how to configure your Shopify app to work with the app proxy system, allowing your map editor to be accessible at `https://malihacollections.com/editor/`.

## 🎯 Overview

The app proxy allows your custom map builder to:
- Run on your store's domain (`malihacollections.com/editor/`)
- Integrate seamlessly with Shopify's cart system
- Maintain customer sessions and store context
- Provide a professional, branded experience

## 📋 Prerequisites

1. ✅ Shopify app created (you have this)
2. ✅ API keys configured (found in `.env` file)
3. ✅ App deployed to a public URL
4. ⏳ App proxy configured in Shopify Partner Dashboard

## 🔧 Step 1: Configure App Proxy in Shopify

### In Shopify Partner Dashboard:

1. **Go to your app** in the Partner Dashboard
2. **Navigate to App Setup** → **App Proxy**
3. **Configure the following settings:**

```
Subpath prefix: (leave empty)
Subpath: /editor
Proxy URL: https://your-deployed-app.com/proxy
```

### Example Configuration:
```
Subpath prefix: (leave empty)
Subpath: /editor
Proxy URL: https://your-app-domain.com/proxy
```

**Note:** Replace `your-app-domain.com` with your actual deployed app URL (e.g., from Railway, Heroku, or your custom domain).

**Result:** `https://malihacollections.com/editor/` → Your app's `/proxy` route

## 🚀 Step 2: Deploy Your App

### Option A: Using Shopify CLI (Recommended)
```bash
# Deploy using Shopify CLI
shopify app deploy
```

### Option B: Manual Deployment
1. Deploy to Vercel, Netlify, or Railway
2. Update the proxy URL in Shopify Partner Dashboard
3. Update environment variables on your hosting platform

## 🔑 Step 3: Environment Variables

Ensure these are set in your deployment:

```env
SHOPIFY_API_KEY=3a4811568d3fedf243ee35d222f2ed7c
SHOPIFY_API_SECRET=323b2ae1185bdce77b4bf614d1b7207d
SHOPIFY_APP_URL=https://your-deployed-app.com
SCOPES=write_products,read_products
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-storefront-token
```

## 🛒 Step 4: Configure Storefront API Access

### Create Storefront Access Token:

1. **In Shopify Admin** → **Apps** → **Manage private apps**
2. **Create private app** or **use existing app**
3. **Enable Storefront API access**
4. **Copy the Storefront access token**
5. **Add to environment variables:**

```env
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-storefront-token-here
```

### Required Storefront API Permissions:
- `unauthenticated_read_product_listings`
- `unauthenticated_write_checkouts`
- `unauthenticated_read_checkouts`

## 🧪 Step 5: Test the Integration

### Test URLs:

1. **Direct proxy test:**
   ```
   https://your-app.com/proxy?shop=malihacollections.myshopify.com&timestamp=1234567890&signature=abc123
   ```

2. **Through Shopify (after proxy setup):**
   ```
   https://malihacollections.com/editor/
```

### Expected Flow:
```
Customer visits: malihacollections.com/editor/
        ↓
Shopify proxies to: your-app.com/proxy
        ↓
Your app serves: Map builder interface
        ↓
Customer builds map and clicks "Add to Cart"
        ↓
Storefront API adds item to cart
        ↓
Customer proceeds to Shopify checkout
```

## 🔍 Troubleshooting

### Common Issues:

**1. "Proxy validation failed"**
- Check that `SHOPIFY_API_SECRET` is correct
- Verify the request is coming from Shopify
- In development, signature validation is relaxed

**2. "Storefront access token not configured"**
- Create a Storefront API access token in Shopify Admin
- Add it to your environment variables
- Redeploy your app

**3. "Cart integration not working"**
- Verify Storefront API permissions
- Check that products exist in your store
- Test with a simple product first

**4. "App proxy not found"**
- Verify proxy configuration in Partner Dashboard
- Check that your app is deployed and accessible
- Test the proxy URL directly

## 📱 Development vs Production

### Development Mode:
- Uses relaxed validation for testing
- Can test with `?shop=malihacollections.myshopify.com`
- Signature validation is optional

### Production Mode:
- Full signature validation required
- Must be accessed through Shopify proxy
- All security checks enabled

## 🎉 Success Indicators

✅ **App proxy configured** - URL shows in Partner Dashboard  
✅ **App deployed** - Public URL accessible  
✅ **Environment variables set** - All tokens configured  
✅ **Storefront API working** - Cart integration functional  
✅ **Proxy validation passing** - No 403 errors  
✅ **End-to-end flow working** - Customer can build maps and checkout  

## 🔗 Next Steps

1. **Test the complete flow** from map building to checkout
2. **Add custom products** for different map styles/sizes
3. **Customize the UI** to match your store's branding
4. **Add analytics** to track map builder usage
5. **Implement order fulfillment** for custom maps

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Review server logs for validation failures
3. Test the proxy URL directly
4. Verify all environment variables are set

---

**🎯 Goal:** `https://malihacollections.com/editor/` should load your custom map builder and allow customers to add maps to their cart seamlessly!