# Deployment Instructions for Vercel

## Prerequisites

1. A PostgreSQL database (recommended: Vercel Postgres, Supabase, or Railway)
2. Vercel account with CLI installed
3. Shopify Partner account with app credentials

## Environment Variables Setup

You need to configure the following environment variables in your Vercel dashboard:

### Required Variables:

```bash
# Shopify App Configuration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_APP_URL=https://your-app-domain.vercel.app
SCOPES=write_products,read_products

# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database

# Optional Variables
SHOPIFY_PRODUCT_MAP_BUILDER_ID=your_product_map_builder_id
MAP_PRODUCT_ID=123456789
MAP_VARIANT_ID=987654321
SHOP_DOMAIN=your-shop.myshopify.com
```

## Deployment Steps

1. **Set up PostgreSQL Database**
   - Create a PostgreSQL database (Vercel Postgres recommended)
   - Copy the connection string

2. **Configure Environment Variables**
   ```bash
   vercel env add SHOPIFY_API_KEY
   vercel env add SHOPIFY_API_SECRET
   vercel env add SHOPIFY_APP_URL
   vercel env add SCOPES
   vercel env add DATABASE_URL
   ```

3. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

4. **Run Database Migration** (after first deployment)
   ```bash
   # Set DATABASE_URL to your production database
   npx prisma migrate deploy
   ```

## Troubleshooting

- **Serverless Function Crash**: Usually caused by missing environment variables
- **Database Connection Issues**: Verify DATABASE_URL format and database accessibility
- **Build Failures**: Check that all dependencies are in package.json

## Local Development

For local development, the app uses SQLite. The production deployment automatically switches to PostgreSQL using the production schema.