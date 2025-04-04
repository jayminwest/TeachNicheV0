# Teach Niche - Kendama Tutorial Platform

A platform for kendama instructors to share tutorial videos and for students to learn. Teach Niche enables instructors to monetize their expertise by selling individual videos or bundled lesson packages.

![Teach Niche Platform](https://placeholder.com/your-screenshot-here)

## Features

### For Instructors
- **Content Management**: Upload and manage tutorial videos and lesson packages
- **Monetization**: Set prices for individual videos and lesson packages
- **Stripe Integration**: Receive payments directly to your Stripe account
- **Dashboard**: Track earnings, video views, and student engagement
- **Analytics**: Monitor which content performs best

### For Students
- **Discover Content**: Browse videos and lessons from expert kendama instructors
- **Purchase Content**: Buy individual videos or complete lesson packages
- **Personal Library**: Access purchased content anytime
- **Secure Payments**: Pay securely through Stripe

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **Payments**: Stripe Connect
- **Styling**: shadcn/ui components

## Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account
- Stripe account (with Connect capability)

## Environment Configuration

Teach Niche uses a centralized environment configuration system to manage all environment variables in a type-safe and validated way. This helps prevent runtime errors and provides better developer experience.

### Environment Configuration System

All environment variables are managed through a centralized module in `lib/env.ts` which:

- **Validates** all environment variables with Zod schema validation
- Provides **strong TypeScript typing** for all variables
- Organizes variables into **logical groups** (Supabase, Stripe, Next.js, etc.)
- Includes **helpful error messages** when variables are missing or invalid
- Performs necessary **transformations** (like converting string values to numbers)
- Exports **convenience helpers** for environment-based conditions (`isDevelopment`, `isProduction`, etc.)

### Environment Variable Groups

The environment configuration is organized into the following logical groups:

1. **Supabase Configuration**: Variables related to Supabase authentication, database, and storage
2. **Stripe Configuration**: Variables for Stripe payments integration
3. **Stripe Connect Configuration**: Variables specific to the Stripe Connect platform for instructors
4. **Next.js Configuration**: Variables for Next.js application settings
5. **Miscellaneous Configuration**: Other application-specific variables

### Setting Up Environment Variables

1. Create a `.env.local` file in the root directory based on the `.env.example` file:

```bash
cp .env.example .env.local
```

2. Fill in the values in `.env.local` with your specific configuration:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_DB_PASSWORD=your_database_password

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_WEBHOOK_URL=your_stripe_webhook_url

# Stripe Connect Configuration
STRIPE_CONNECT_CLIENT_ID=your_stripe_connect_client_id
NEXT_PUBLIC_STRIPE_CONNECT_REDIRECT_URL=your_stripe_connect_redirect_url
STRIPE_PLATFORM_ACCOUNT_ID=your_stripe_platform_account_id
STRIPE_APPLICATION_FEE_PERCENT=15

# Next.js Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_AUTH_REDIRECT_URL=http://localhost:3000/auth/callback
```

### Environment-Specific Configuration

#### Development Environment

For local development, simply use the `.env.local` file as described above. The system will automatically detect a development environment when `NODE_ENV` is set to `development` (the default).

#### Test Environment

For test environments, you can create a `.env.test.local` file with test-specific values:

```bash
cp .env.example .env.test.local
```

Then modify the values as needed for your test environment. When running tests, ensure that `NODE_ENV` is set to `test`.

#### Production Environment

For production, you should set environment variables through your hosting platform (e.g., Vercel):

1. Go to your project settings in Vercel
2. Navigate to the Environment Variables section
3. Add all the required variables from `.env.example`
4. Ensure `NODE_ENV` is set to `production`

### Using Environment Variables in Your Code

The centralized environment configuration system should be used instead of directly accessing `process.env`:

```typescript
// ❌ Don't use process.env directly
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// ✅ Use the centralized environment configuration
import { supabaseEnv, nextEnv, isDevelopment } from '@/lib/env';

// Access grouped variables
const apiUrl = supabaseEnv.url;
const siteUrl = nextEnv.siteUrl;

// Use environment helpers
if (isDevelopment) {
  console.log('Running in development mode');
}
```

Each group exports related variables for convenient access:

```typescript
// Examples of available groups
import { 
  supabaseEnv,    // Supabase-related variables
  stripeEnv,      // Stripe payment variables
  stripeConnectEnv, // Stripe Connect variables
  nextEnv,        // Next.js application variables
} from '@/lib/env';
```

### Benefits of the Centralized Environment System

1. **Type Safety**: All environment variables have proper TypeScript types
2. **Validation**: Missing or invalid variables are caught early with clear error messages
3. **Organization**: Variables are grouped by their related services
4. **Documentation**: Each variable has detailed comments explaining its purpose
5. **Default Values**: Some variables have sensible defaults to simplify configuration
6. **Transformation**: String-based env variables are automatically converted to appropriate types

### Handling Environment Validation Errors

If your application fails to start with an error message about invalid environment variables, check the console for detailed information about which variables are missing or invalid.

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/teach-niche.git
cd teach-niche
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Supabase Setup

1. Create a new Supabase project
2. Run the migrations in the `supabase/migrations` directory
3. Set up storage buckets for videos and thumbnails
4. Configure RLS policies (see `app/admin/setup/rls-policies.tsx`)

## Stripe Setup

1. Create a Stripe account and enable Connect
2. Set up webhook endpoints for:
   - Payment success
   - Account updates
3. Configure payout settings

## Project Structure

```
teach-niche/
├── app/                  # Next.js app directory
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   ├── checkout/         # Checkout flow
│   ├── dashboard/        # Instructor dashboard
│   ├── lessons/          # Lesson browsing and viewing
│   └── videos/           # Video browsing and viewing
├── components/           # Reusable React components
├── lib/                  # Utility functions and services
│   ├── env.ts            # Centralized environment configuration
│   ├── stripe.ts         # Stripe integration
│   └── supabase/         # Supabase clients
├── public/               # Static assets
├── styles/               # Global styles
├── types/                # TypeScript type definitions
└── middleware.ts         # Next.js middleware for auth
```

## Usage

### For Instructors

1. Sign up for an account
2. Set up your Stripe Connect account
3. Upload videos or create lesson packages
4. Set prices and publish content
5. Monitor sales through the dashboard

### For Students

1. Browse available videos and lessons
2. Purchase content with a credit card
3. Access purchased content in your library

## API Endpoints

- `/api/checkout` - Process video purchases
- `/api/checkout-lesson` - Process lesson package purchases
- `/api/stripe/create-connect-account` - Set up Stripe Connect for instructors
- `/api/verify-purchase` - Verify user access to content
- `/api/webhooks/stripe` - Handle Stripe webhook events

## Deployment

This project can be deployed on Vercel:

```bash
vercel
```

Or any other platform that supports Next.js applications.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a pull request

## License

[MIT](LICENSE)

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Stripe](https://stripe.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Zod](https://github.com/colinhacks/zod) - For environment variable validation
