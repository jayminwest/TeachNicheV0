# Deployment Guide

This guide provides instructions for deploying the TeachNiche platform to various environments.

## Deployment Environments

TeachNiche supports the following deployment environments:

- **Development**: Local environment for development work
- **Staging**: Pre-production environment for testing
- **Production**: Live environment for end users

## Prerequisites

Before deploying, ensure you have:

1. Access to the deployment platform (Vercel)
2. Access to the Supabase project
3. Access to the Stripe Dashboard
4. Environment variables for the target environment

## Vercel Deployment

TeachNiche is designed to be deployed on Vercel, which provides seamless integration with Next.js applications.

### Initial Setup

1. Create a new project in the Vercel dashboard
2. Link to the GitHub repository
3. Configure build settings:
   - Framework Preset: Next.js
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

### Environment Variables

Configure the following environment variables in the Vercel project settings:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

Ensure you use appropriate values for each environment (development, staging, production).

### Deployment Process

#### Automatic Deployments

Vercel automatically deploys when changes are pushed to specific branches:

- Push to `main` branch: Deploys to production
- Push to `development` branch: Deploys to staging
- All other branches: Creates preview deployments

#### Manual Deployments

To deploy manually:

1. Go to the Vercel dashboard
2. Select the project
3. Click "Deploy" and select the branch to deploy

### Domain Configuration

1. In the Vercel dashboard, go to the project settings
2. Navigate to the "Domains" section
3. Add your custom domain(s)
4. Configure DNS settings as instructed by Vercel

### Vercel Regions

For optimal performance, deploy to regions close to your users:

1. In the project settings, go to "Functions"
2. Select the regions where you want to deploy
3. Save your settings

## Supabase Configuration

### Database Migrations

Before deploying to a new environment, ensure the database schema is up to date:

1. Connect to the Supabase instance using the Supabase CLI
2. Apply migrations:

```bash
supabase db push
```

Or manually apply the SQL migrations from the `supabase/migrations` directory.

### Storage Buckets

Ensure the necessary storage buckets are created and configured:

1. Create `videos` and `thumbnails` buckets
2. Configure CORS settings:

```json
{
  "allowedOrigins": ["https://your-domain.com"],
  "allowedMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "allowedHeaders": ["*"],
  "maxAgeSeconds": 3600
}
```

### Row Level Security (RLS) Policies

Ensure RLS policies are properly configured for each table:

1. Navigate to the Supabase dashboard
2. Go to Authentication > Policies
3. Verify that policies match those in `app/admin/setup/rls-policies.tsx`
4. If needed, run the RLS setup endpoint:

```
POST /api/setup-rls-policies
```

## Stripe Configuration

### Webhook Configuration

Configure Stripe webhooks for your environment:

1. Go to the Stripe Dashboard > Developers > Webhooks
2. Click "Add Endpoint"
3. Enter your webhook URL: `https://your-domain.com/api/webhooks/stripe`
4. Select the following events:
   - `checkout.session.completed`
   - `account.updated`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Get the webhook signing secret and add it to your environment variables

### Stripe Connect Settings

For production environments, configure Stripe Connect settings:

1. Go to Settings > Connect settings
2. Configure branding, terms of service, and privacy policy URLs
3. Set up your platform profile
4. Configure payout schedules

## SSL Certificates

Ensure your domain has a valid SSL certificate:

1. Vercel automatically provisions SSL certificates for domains added through their dashboard
2. Verify the certificate is valid and renewed automatically

## Post-Deployment Verification

After deployment, verify:

1. The application loads correctly
2. Authentication flows work (signup, login, logout)
3. Video uploads function properly
4. Payment processing is successful
5. Stripe webhooks are being received (check Stripe dashboard > Webhooks > Recent events)

## Rollback Procedure

If issues are encountered after deployment:

1. In the Vercel dashboard, go to the Deployments tab
2. Find the last stable deployment
3. Click the "..." menu and select "Promote to Production"

## Performance Monitoring

Monitor application performance:

1. Use Vercel Analytics to track performance metrics
2. Set up error monitoring with a service like Sentry
3. Monitor Supabase usage in the Supabase dashboard
4. Check Stripe dashboard for payment processing metrics

## Troubleshooting

### Common Issues

#### Deployment Fails

1. Check build logs in Vercel
2. Verify environment variables are correctly set
3. Ensure dependencies are properly installed

#### Database Connection Issues

1. Verify Supabase URL and keys
2. Check if IP is allowed in Supabase settings
3. Test connection using Supabase client

#### Payment Processing Failures

1. Verify Stripe keys are correct
2. Check Stripe dashboard for error logs
3. Ensure webhook endpoint is receiving events

## Security Considerations

1. Regularly rotate API keys and secrets
2. Implement rate limiting for API routes
3. Keep dependencies updated
4. Follow Supabase and Stripe security best practices

## Continuous Deployment

Set up continuous deployment with GitHub Actions:

1. Configure GitHub Actions workflow in `.github/workflows/deploy.yml`
2. Integrate with Vercel for automatic previews
3. Add status checks to protect branches
