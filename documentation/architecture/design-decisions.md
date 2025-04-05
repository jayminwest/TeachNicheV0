# Design Decisions

This document outlines the key design decisions made during the development of TeachNiche, including the rationale behind technology choices and architectural approaches.

## Frontend Framework: Next.js

### Decision
We chose Next.js 15 as our frontend framework.

### Rationale
- **Server Components**: Next.js 15's server components allow for faster page loads by rendering components on the server.
- **App Router**: The App Router provides a more intuitive file-based routing system.
- **Built-in API Routes**: Simplifies backend development by allowing API endpoints within the same project.
- **TypeScript Integration**: Excellent TypeScript support out of the box.
- **Static and Dynamic Rendering**: Flexibility to choose the rendering strategy based on the page requirements.

### Alternatives Considered
- **SvelteKit**: While promising, the ecosystem is not as mature as React/Next.js.
- **Remix**: Good framework but doesn't have the same level of community support.
- **Pure React SPA**: Would require separate backend and more complex deployment.

## Authentication: Supabase Auth

### Decision
We integrated Supabase Auth for user authentication.

### Rationale
- **Pre-built UI Components**: Accelerates development with ready-to-use auth components.
- **Multiple Auth Methods**: Supports email/password, OAuth providers, and magic links.
- **JWT-based**: Secure token-based authentication with minimal server-side state.
- **Integration with Supabase Database**: Seamless access control with Row Level Security (RLS).

### Alternatives Considered
- **Auth0**: More expensive and potentially over-featured for our needs.
- **Firebase Auth**: Would create a vendor split with our PostgreSQL database.
- **Custom Auth System**: Would require significant development time and security expertise.

## Database: Supabase PostgreSQL

### Decision
We chose Supabase's managed PostgreSQL service as our database.

### Rationale
- **Relational Model**: Appropriate for our data which has clear relationships between entities.
- **Row Level Security**: Allows for declarative access control at the database level.
- **Realtime Subscriptions**: Enables live updates for dashboard features.
- **SQL Interface**: Powerful querying capabilities and well-understood paradigm.
- **Managed Service**: Reduces operational overhead.

### Alternatives Considered
- **MongoDB**: Document database would be less appropriate for our relational data.
- **Firebase Firestore**: Less powerful querying and would separate from our auth provider.
- **Self-hosted PostgreSQL**: Would require more operational overhead.

## File Storage: Supabase Storage

### Decision
We use Supabase Storage for video files and thumbnails.

### Rationale
- **Integration with Auth**: Uses the same authentication system as the rest of the app.
- **Simple API**: Easy to use from both frontend and backend.
- **Security Rules**: Can define access policies similar to RLS.
- **Image Transformations**: Supports basic image processing for thumbnails.

### Alternatives Considered
- **AWS S3**: Would require separate authentication and more complex setup.
- **Cloudinary**: Good for images but potentially expensive for video storage.
- **Self-hosted Solution**: Would significantly increase operational complexity.

## Payment Processing: Stripe Connect

### Decision
We integrated Stripe Connect for payment processing and instructor payouts.

### Rationale
- **Multi-party Payments**: Designed specifically for marketplace models like ours.
- **Automated Payouts**: Handles complex money movement between platform and instructors.
- **Compliance**: Manages tax and regulatory requirements across jurisdictions.
- **Security**: PCI-compliant payment processing.
- **Webhook System**: Reliable event-driven architecture for payment updates.

### Alternatives Considered
- **PayPal**: Less developer-friendly and more limited for marketplace models.
- **Custom Payment Solution**: Would introduce significant regulatory and security challenges.
- **Standard Stripe (non-Connect)**: Would require manual handling of instructor payouts.

## UI Components: shadcn/ui

### Decision
We chose shadcn/ui as our component library.

### Rationale
- **Utility-first**: Built on Tailwind CSS for consistent styling.
- **Customizable**: Components can be copied and modified rather than imported as a black box.
- **Accessible**: Built with accessibility in mind.
- **TypeScript Support**: Well-typed components improve developer experience.
- **Modern Design**: Clean, minimal aesthetic that can be easily customized.

### Alternatives Considered
- **Material UI**: More opinionated design language and potentially heavier bundle size.
- **Chakra UI**: Good alternative but less integrated with Tailwind CSS.
- **Custom Components**: Would require significant design and development resources.

## Deployment: Vercel

### Decision
We deploy the application on Vercel.

### Rationale
- **Next.js Integration**: Purpose-built for hosting Next.js applications.
- **Edge Functions**: Global distribution of serverless functions.
- **Preview Deployments**: Automatic deployment previews for pull requests.
- **Analytics**: Built-in performance monitoring.
- **Scalability**: Handles traffic spikes without manual intervention.

### Alternatives Considered
- **AWS Amplify**: More complex setup and less optimized for Next.js.
- **Netlify**: Good alternative but less specialized for Next.js.
- **Self-hosted**: Would require significant DevOps resources.

## Monorepo vs. Separate Repositories

### Decision
We maintained a single repository for the entire application.

### Rationale
- **Simplified Workflow**: Easier to manage changes that span frontend and API.
- **Shared Types**: TypeScript types can be shared across the application.
- **Consistent Versioning**: All components are always in sync.
- **Simpler CI/CD**: Single pipeline for the entire application.

### Alternatives Considered
- **Separate Frontend and Backend Repos**: Would introduce complexity in coordinating changes.
- **Microservices Architecture**: Overkill for our current scale and would slow development.

## Future Considerations

As the platform grows, we anticipate these design decisions may need to be revisited:

1. **Video Processing**: May need to implement transcoding for different quality levels.
2. **Search Functionality**: Might require a dedicated search service like Algolia or Elasticsearch.
3. **Analytics**: Custom analytics solution may be needed for deeper insights.
4. **Internationalization**: Supporting multiple languages and currencies.
5. **Mobile App**: Native mobile applications might be considered for enhanced mobile experience.
