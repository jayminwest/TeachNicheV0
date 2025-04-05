# Teach Niche - Kendama Tutorial Platform

A platform for kendama instructors to share tutorial videos and for students to learn. Teach Niche enables instructors to monetize their expertise by selling individual videos or bundled lesson packages.

<div align="center">
  <img src="https://placeholder.com/your-screenshot-here" alt="Teach Niche Platform" width="80%" />
</div>

## 📋 Project Overview

TeachNiche is a specialized platform designed to connect kendama instructors with students through high-quality video tutorials. The platform enables:

- **Instructors** to upload, organize, and monetize their tutorial content
- **Students** to discover, purchase, and learn from expert instructors
- **Seamless payment processing** with direct instructor payouts via Stripe Connect
- **Content organization** through individual videos and bundled lessons

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/teach-niche.git
cd teach-niche

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start the development server
pnpm dev

# Open http://localhost:3000 in your browser
```

## 🛠️ Technology Stack

<div align="center">
  <img src="https://placeholder.com/tech-stack-diagram.png" alt="Technology Stack" width="70%" />
</div>

- **Frontend**: [Next.js 15](https://nextjs.org/), [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Authentication**: [Supabase Auth](https://supabase.com/auth)
- **Database**: [Supabase PostgreSQL](https://supabase.com/database)
- **Storage**: [Supabase Storage](https://supabase.com/storage)
- **Payments**: [Stripe Connect](https://stripe.com/connect)
- **Styling**: [shadcn/ui](https://ui.shadcn.com/) components

## 📚 Documentation

We maintain comprehensive documentation to help developers understand and contribute to TeachNiche:

### Architecture and Design
- [System Architecture](./documentation/architecture/system-architecture.md)
- [Design Decisions](./documentation/architecture/design-decisions.md)
- [Database Schema](./documentation/architecture/database-schema.md)

### Development Guides
- [Environment Setup](./documentation/workflow/environment-setup.md)
- [Development Workflow](./documentation/workflow/development-workflow.md)
- [Code Style Guide](./documentation/workflow/code-style-guide.md)

### API Documentation
- [API Overview](./documentation/api/overview.md)
- [Authentication Endpoints](./documentation/api/auth)
- [Checkout Endpoints](./documentation/api/checkout)
- [Stripe Integration Endpoints](./documentation/api/stripe)
- [Video Management Endpoints](./documentation/api/video)
- [Admin Endpoints](./documentation/api/admin)

### Deployment and Operations
- [Deployment Guide](./documentation/deployment/deployment-guide.md)
- [Monitoring and Logging](./documentation/deployment/monitoring.md)
- [Scaling Considerations](./documentation/deployment/scaling.md)

### Troubleshooting
- [Common Issues and Solutions](./documentation/troubleshooting/common-issues.md)
- [Debugging Guide](./documentation/troubleshooting/debugging.md)

## 🌐 Environment Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and [pnpm](https://pnpm.io/)
- [Supabase](https://supabase.com/) account
- [Stripe](https://stripe.com/) account (with Connect capability)

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

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
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Refer to [Environment Setup Guide](./documentation/workflow/environment-setup.md) for detailed instructions.

## 🏗️ Project Structure

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
├── documentation/        # Project documentation
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and services
│   ├── stripe.ts         # Stripe integration
│   └── supabase/         # Supabase clients
├── public/               # Static assets
├── styles/               # Global styles
├── types/                # TypeScript type definitions
└── middleware.ts         # Next.js middleware for auth
```

## 🧩 Features

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

## 🔄 API Endpoints

The platform exposes several API endpoints for various functionalities. See our [API Documentation](./documentation/api/overview.md) for complete details.

Key endpoints include:

- `/api/checkout` - Process video purchases
- `/api/checkout-lesson` - Process lesson package purchases
- `/api/stripe/create-connect-account` - Set up Stripe Connect for instructors
- `/api/verify-purchase` - Verify user access to content
- `/api/webhooks/stripe` - Handle Stripe webhook events

## 🚢 Deployment

TeachNiche is designed to be deployed on [Vercel](https://vercel.com/). See our [Deployment Guide](./documentation/deployment/deployment-guide.md) for detailed instructions.

## 🤝 Contributing

We welcome contributions to TeachNiche! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a pull request

Please see our [Contributing Guidelines](./documentation/workflow/contributing.md) for more information.

## 📄 License

[MIT](LICENSE)

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Stripe](https://stripe.com/)
- [shadcn/ui](https://ui.shadcn.com/)
