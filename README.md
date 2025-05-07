<img src="public/favicon.png" alt="Teach Niche Logo" width="100" height="100" />

# Teach Niche - Kendama Tutorial Platform

A platform for kendama instructors to share tutorial videos and for students to learn. Teach Niche enables instructors to monetize their expertise by selling bundled lesson packages with secure video content.

## Features

### For Instructors
- **Content Management**: Create lessons and upload tutorial videos
- **Monetization**: Set prices for lesson packages (including free options)
- **Stripe Connect**: Receive payments directly to your Stripe account
- **Dashboard**: Track earnings, purchases, and lesson analytics
- **Security**: Content protected with secure access controls

### For Students
- **Discover Content**: Browse lessons from expert kendama instructors
- **Purchase Content**: Buy complete lesson packages with secure checkout
- **Personal Library**: Access purchased content anytime in your library
- **Secure Payments**: Pay securely through Stripe

## Tech Stack

- **Framework**: Next.js 15 App Router
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage with RLS policies
- **Payments**: Stripe Connect + Webhooks
- **UI**: Tailwind CSS + shadcn/ui components

## Local Development

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account and CLI
- Stripe account (with Connect capability)
- Stripe CLI for webhook testing

### Environment Setup

The project uses separate environments for development and production:

1. Create a development environment by copying the example file:

```bash
pnpm setup:env
# Or manually: cp .env.development.example .env.development
```

2. Fill in your development environment values in `.env.development`:

```
# Supabase Development Environment
NEXT_PUBLIC_SUPABASE_URL=your_dev_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_role_key

# Stripe Test Environment (Always use TEST MODE keys)
STRIPE_SECRET_KEY=sk_test_your_test_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Other settings
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

See `docs/environment-setup-guide.md` for complete environment setup details.

### Installation and Setup

1. Clone the repository:
```bash
git clone https://github.com/jayminwest/TeachNicheV0.git
cd TeachNicheV0
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up Stripe webhook forwarding in a separate terminal:
```bash
pnpm setup:stripe
# Or manually: stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Supabase Setup

Detailed setup instructions are available in `ai_docs/supabase_schema_setup.md`. The main steps include:

1. Run the migrations in the `supabase/migrations` directory
2. Set up secure storage buckets for videos with proper RLS policies
3. Configure authentication providers and email templates

Use the admin setup page at `/admin/setup` to configure storage and RLS policies.

### Stripe Setup

Detailed setup instructions are available in `ai_docs/stripe_test_setup.md` and `docs/stripe-setup-guide.md`. Key steps:

1. Create a Stripe account and enable Connect
2. Configure webhooks for payment events and account updates
3. Use the test script at `scripts/setup-stripe-dev.sh` for local webhook testing

## Security Features

- RLS policies for secure video access
- Server-side authentication and verification for purchases
- Secure video storage and delivery
- Video bucket security upgrade (see `supabase/migrations/20250426000000_fix_video_bucket_security.sql`)

## Commands

- `pnpm dev`: Run development server with development environment
- `pnpm dev:prod`: Run development server with production environment
- `pnpm build`: Build production version
- `pnpm build:dev`: Build with development environment
- `pnpm start`: Start production server
- `pnpm lint`: Run ESLint
- `pnpm typecheck`: Run TypeScript type checker
- `pnpm setup:stripe`: Start Stripe webhook forwarding
- `pnpm setup:env`: Create development environment file from template

## TypeScript and Code Quality

This project enforces strict TypeScript type checking and code quality throughout the development process:

- **TypeScript Type Checking**: All code must pass TypeScript type checking. Type checking is enforced:
  - During development with `pnpm typecheck`
  - During builds with `pnpm build` (which includes type checking)
  - In pre-commit hooks to prevent committing code with type errors
  - In CI/CD pipelines to ensure all merged code is type-safe

- **Supabase Type Safety**: When working with Supabase, follow these best practices:

1. **Awaiting Supabase Client**: In Next.js 15, the Supabase client from `createServerClient()` returns a Promise that must be awaited before use:
   ```typescript
   const supabase = await createServerClient()
   ```

2. **Database Types**: When working with database operations, use type assertions with the proper Database types:
   ```typescript
   .update({
     field1: value1,
     field2: value2,
   } as Database["public"]["Tables"]["table_name"]["Update"])
   ```

3. **Type Guards**: When working with Supabase query results, use type guards to handle potential `null` or error return values:
   ```typescript
   const { data, error } = await supabase.from("table").select("*")
   if (error || !data) {
     // Handle error
     return
   }
   // Now TypeScript knows data is not null
   const item = data[0]
   ```

4. **Null Check Patterns**: Always check for null Supabase clients and handle them gracefully:
   ```typescript
   if (!supabase) {
     throw new Error("Supabase client not initialized");
   }
   ```

5. **Error Handling**: For routes that use Supabase, always handle potential errors and provide appropriate HTTP status responses.

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
- [Supabase](https://supabase.com/)
- [Stripe](https://stripe.com/)
- [shadcn/ui](https://ui.shadcn.com/)
