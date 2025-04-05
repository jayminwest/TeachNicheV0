# System Architecture

## Overview

TeachNiche is a Next.js-based platform that allows kendama instructors to create, publish, and monetize tutorial videos. The platform uses Supabase for authentication, database, and storage, with Stripe Connect for payment processing.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        Next.js Frontend                         │
│                                                                 │
├─────────────┬─────────────────────────────────┬─────────────────┤
│             │                                 │                 │
│   Public    │        Protected Routes         │    Admin        │
│   Routes    │     (Auth Middleware)           │    Routes       │
│             │                                 │                 │
└─────┬───────┴──────────────┬──────────────────┴────────┬────────┘
      │                      │                           │
      │                      │                           │
      ▼                      ▼                           ▼
┌─────────────┐    ┌──────────────────┐        ┌──────────────────┐
│             │    │                  │        │                  │
│  Supabase   │    │  Next.js API     │        │  Supabase Admin  │
│  Auth       │    │  Routes          │        │  Functions       │
│             │    │                  │        │                  │
└─────┬───────┘    └─────────┬────────┘        └────────┬─────────┘
      │                      │                           │
      │                      │                           │
      ▼                      ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                     Supabase Backend                            │
│                                                                 │
├─────────────┬─────────────────────────────────┬─────────────────┤
│             │                                 │                 │
│  PostgreSQL │          Storage                │   Edge          │
│  Database   │          Buckets                │   Functions     │
│             │                                 │                 │
└─────────────┴─────────────────────────────────┴─────────────────┘
                                │
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                          Stripe                                 │
│                                                                 │
├─────────────┬─────────────────────────────────┬─────────────────┤
│             │                                 │                 │
│  Payments   │          Connect                │   Webhooks      │
│             │                                 │                 │
└─────────────┴─────────────────────────────────┴─────────────────┘
```

## Key Components

### Frontend (Next.js)

- **Public Routes**: Home, About, Login, Signup, Browse Lessons
- **Protected Routes**: Dashboard, User Library, Checkout, Profile Management
- **Admin Routes**: Platform Administration, System Setup

### Backend (Supabase)

- **Authentication**: User registration, login, password reset
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Storage**: Video files and thumbnails
- **Edge Functions**: Serverless functions for backend operations

### Payment Processing (Stripe)

- **Connect**: Managed accounts for instructors
- **Checkout**: Secure payment processing
- **Webhooks**: Event handling for payments and account updates

## Data Flow

1. **User Authentication**:
   - Users register/login through Supabase Auth
   - JWT tokens are used to authenticate API requests

2. **Video Upload**:
   - Instructors upload videos to Supabase Storage
   - Metadata is stored in the PostgreSQL database

3. **Payment Processing**:
   - Students initiate purchase through Stripe Checkout
   - Payments are processed and split between platform and instructor
   - Webhooks update database with purchase information

4. **Content Access**:
   - Purchased content is verified through database queries
   - Videos are streamed from Supabase Storage with signed URLs

## Security Measures

- **Authentication**: JWT-based auth with Supabase
- **Authorization**: Row Level Security (RLS) policies
- **Data Protection**: Encrypted storage and secure API endpoints
- **Payment Security**: PCI-compliant Stripe integration

## Design Decisions

### Next.js App Router

We've chosen Next.js App Router for its modern approach to routing, server components, and built-in API routes. This allows us to have a more integrated frontend and backend experience.

### Supabase vs. Custom Backend

Supabase was selected to accelerate development by providing a managed PostgreSQL database, authentication, and storage solution. This reduces operational overhead and provides a secure foundation.

### Stripe Connect

Stripe Connect was chosen to handle the complexities of multi-party payments, allowing the platform to take a commission while distributing earnings to instructors automatically.

### TypeScript

TypeScript is used throughout the application to provide type safety and better developer experience, reducing runtime errors and improving code maintainability.
