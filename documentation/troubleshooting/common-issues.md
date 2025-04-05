# Common Issues and Solutions

This guide covers common issues you might encounter while developing or deploying TeachNiche, along with their solutions.

## Development Issues

### Next.js Development Server Won't Start

**Symptoms:**
- Error when running `pnpm dev`
- Server starts but crashes immediately

**Possible Causes and Solutions:**

1. **Missing dependencies**
   - Run `pnpm install` to ensure all dependencies are installed
   - Check for peer dependency warnings and resolve them

2. **Port already in use**
   - Error message: `Error: listen EADDRINUSE: address already in use :::3000`
   - Solution: Kill the process using the port or use a different port:
     ```bash
     npx kill-port 3000
     # OR
     pnpm dev -- -p 3001
     ```

3. **Environment variables not set**
   - Create a `.env.local` file based on `.env.example`
   - Ensure all required variables are defined

4. **TypeScript errors**
   - Check for TypeScript errors in the terminal
   - Fix the errors or run `pnpm dev --no-check` to temporarily bypass type checking

### Supabase Connection Issues

**Symptoms:**
- "Failed to connect to Supabase" errors
- Authentication not working
- Data not loading

**Possible Causes and Solutions:**

1. **Incorrect Supabase URL or API key**
   - Verify URL and keys in your `.env.local` file
   - Check for extra spaces or quotes around values

2. **Supabase service down**
   - Check the [Supabase Status page](https://status.supabase.com/)
   - Verify your project status in the Supabase dashboard

3. **Row Level Security blocking access**
   - Check if RLS policies are correctly configured
   - Temporarily enable the SQL editor in the Supabase dashboard to verify data exists

4. **CORS issues**
   - Ensure your local domain is added to the allowed origins in Supabase

### Stripe Integration Problems

**Symptoms:**
- Checkout sessions fail to create
- Webhooks not being received
- Stripe Connect onboarding issues

**Possible Causes and Solutions:**

1. **Using test keys in production or vice versa**
   - Verify you're using the correct type of API keys (test/live)
   - Check for the `pk_test_` or `pk_live_` prefix

2. **Webhook configuration**
   - Ensure webhook URL is correct
   - Verify webhook secret is correctly set in environment variables
   - For local testing, use Stripe CLI:
     ```bash
     stripe listen --forward-to localhost:3000/api/webhooks/stripe
     ```

3. **Stripe Connect issues**
   - Verify OAuth redirect URI is configured correctly
   - Ensure your platform is correctly set up for the account country

## Authentication Issues

### User Can't Sign Up

**Symptoms:**
- Sign up form submission fails
- Error message about invalid email or password

**Possible Causes and Solutions:**

1. **Email already in use**
   - Check if the email is already registered
   - Implement a "Forgot Password" flow

2. **Password requirements not met**
   - Ensure passwords meet requirements (min 8 characters, including numbers/symbols)
   - Provide clear feedback about requirements

3. **Email confirmation issues**
   - Check spam folder for confirmation emails
   - Verify email templates in Supabase

### User Can't Sign In

**Symptoms:**
- Login form submission fails
- "Invalid login credentials" error

**Possible Causes and Solutions:**

1. **Incorrect email or password**
   - Implement a "Forgot Password" functionality
   - Check if user has verified their email if required

2. **User deleted or disabled**
   - Check user status in Supabase Auth dashboard
   - Look for profile in the `profiles` table

3. **Invalid or expired session**
   - Clear browser cookies and localStorage
   - Try signing in again

## Video Upload Issues

### Video Upload Fails

**Symptoms:**
- Upload progress stops or fails
- Error message after upload completion

**Possible Causes and Solutions:**

1. **File too large**
   - Check for file size limitations
   - Implement file size verification on the client
   - Consider chunked uploads for large files

2. **Unsupported file format**
   - Ensure file format is supported (mp4, webm, etc.)
   - Add client-side validation for file types

3. **Storage bucket permissions**
   - Verify storage bucket exists
   - Check RLS policies for the storage bucket
   - Ensure user has permission to upload

4. **CORS issues with Supabase Storage**
   - Configure CORS settings in Supabase Storage:
     ```json
     {
       "allowedOrigins": ["*"],
       "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
       "allowedHeaders": ["*"]
     }
     ```

### Video Playback Issues

**Symptoms:**
- Video doesn't play
- Error loading video
- Black screen with controls

**Possible Causes and Solutions:**

1. **Invalid or expired URL**
   - Ensure signed URLs are generated correctly
   - Check URL expiration time

2. **CORS issues**
   - Add your domain to Supabase Storage CORS settings

3. **Browser compatibility**
   - Ensure video codec is widely supported
   - Provide multiple formats (mp4, webm)

4. **Permission issues**
   - Verify user has purchased the video
   - Check RLS policies for accessing videos

## Payment Processing Issues

### Checkout Session Creation Fails

**Symptoms:**
- Error when trying to redirect to checkout
- Stripe error message in console

**Possible Causes and Solutions:**

1. **Missing or invalid Stripe keys**
   - Verify Stripe public and secret keys are correct
   - Check if keys match the environment (test/live)

2. **Invalid product or price data**
   - Ensure price ID exists in Stripe
   - Verify currency configuration

3. **Missing required fields**
   - Check that all required fields are sent to the API
   - Validate request body server-side

### Stripe Connect Onboarding Issues

**Symptoms:**
- Instructor cannot complete onboarding
- Redirect back from Stripe fails

**Possible Causes and Solutions:**

1. **Incorrect redirect URLs**
   - Verify return URL is correctly configured
   - Check for URL encoding issues

2. **Account requirements not met**
   - Check Stripe logs for specific requirements
   - Guide users to complete all required fields

3. **Country restrictions**
   - Verify the user's country is supported by Stripe Connect
   - Check for specific requirements for their country

## Database and Schema Issues

### Migration Failures

**Symptoms:**
- Database migrations fail to apply
- Schema inconsistencies between environments

**Possible Causes and Solutions:**

1. **Conflicting migrations**
   - Ensure migration files are ordered correctly
   - Resolve conflicts in migration SQL

2. **Insufficient permissions**
   - Check if the service role has necessary permissions
   - Temporarily elevate permissions during migration

3. **Invalid SQL syntax**
   - Validate SQL before running migrations
   - Test migrations in a development environment first

### Missing Tables or Columns

**Symptoms:**
- "Table does not exist" errors
- "Column does not exist" errors

**Possible Causes and Solutions:**

1. **Migrations not applied**
   - Run pending migrations
   - Check migration history in Supabase

2. **Schema changes not synchronized**
   - Ensure all environments have the same schema
   - Document schema changes in migration files

## Deployment Issues

### Vercel Build Failures

**Symptoms:**
- Build fails in Vercel but works locally
- TypeScript or module resolution errors

**Possible Causes and Solutions:**

1. **TypeScript errors**
   - Fix type errors before deployment
   - Check for strict mode issues

2. **Environment variables missing**
   - Ensure all required environment variables are set in Vercel
   - Check for environment-specific variables

3. **Node.js version mismatch**
   - Set the same Node.js version as your local environment
   - Check `.nvmrc` or `engines` in `package.json`

### Performance Issues in Production

**Symptoms:**
- Slow page loads
- High server response times
- Timeouts

**Possible Causes and Solutions:**

1. **Missing or improper caching**
   - Implement CDN caching for static assets
   - Use SWR or React Query for data fetching

2. **Large bundle size**
   - Check bundle analyzer reports
   - Implement code splitting and lazy loading

3. **Database query performance**
   - Add indexes for frequently queried columns
   - Optimize complex queries
   - Check for missing JSON indices

## Getting Further Help

If you're unable to resolve an issue using this guide:

1. Check the [GitHub Issues](https://github.com/jayminwest/TeachNicheV0/issues) for similar problems and solutions
2. Search the documentation for specific error messages
3. Consult the documentation for the specific technology:
   - [Next.js Documentation](https://nextjs.org/docs)
   - [Supabase Documentation](https://supabase.io/docs)
   - [Stripe Documentation](https://stripe.com/docs)
4. Create a new GitHub issue with:
   - Detailed description of the problem
   - Steps to reproduce
   - Environment information
   - Error logs and screenshots
