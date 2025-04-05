# Database Schema

TeachNiche uses PostgreSQL provided by Supabase as its primary database. This document outlines the database schema, table relationships, and security policies.

## Entity Relationship Diagram (ERD)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│                 │       │                 │       │                 │
│     profiles    │       │     videos      │◄──────┤   lessons       │
│                 │       │                 │       │                 │
└───────┬─────────┘       └───────┬─────────┘       └───────┬─────────┘
        │                         │                         │
        │                         │                         │
        │                         │                         │
        │                         │                         │
        │                         ▼                         │
        │               ┌─────────────────┐                 │
        │               │                 │                 │
        └──────────────►│  purchases      │◄────────────────┘
                        │                 │
                        └─────────────────┘
                                ▲
                                │
                                │
                        ┌───────┴─────────┐
                        │                 │
                        │ lesson_purchases│
                        │                 │
                        └─────────────────┘
```

## Tables

### profiles

Stores user profile information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, references auth.users.id |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |
| full_name | text | User's full name |
| avatar_url | text | URL to user's avatar image |
| stripe_customer_id | text | Stripe customer ID for payment processing |
| stripe_account_id | text | Stripe Connect account ID for instructors |
| account_type | text | Type of account ('student', 'instructor', 'admin') |
| stripe_account_status | text | Status of Stripe Connect onboarding |
| is_active | boolean | Whether the user account is active |

### videos

Stores information about individual tutorial videos.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |
| title | text | Video title |
| description | text | Video description |
| instructor_id | uuid | References profiles.id of the instructor |
| url | text | Storage URL for the video file |
| thumbnail | text | URL to video thumbnail |
| price | integer | Price in cents |
| stripe_price_id | text | Stripe Price ID |
| stripe_product_id | text | Stripe Product ID |
| is_published | boolean | Whether the video is published |
| duration | integer | Video duration in seconds |
| lessons | uuid[] | Array of lesson IDs this video belongs to |
| is_free | boolean | Whether the video is free to access |

### lessons

Stores information about lesson packages that contain multiple videos.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |
| title | text | Lesson package title |
| description | text | Lesson package description |
| instructor_id | uuid | References profiles.id of the instructor |
| thumbnail | text | URL to lesson thumbnail |
| price | integer | Price in cents |
| stripe_price_id | text | Stripe Price ID |
| stripe_product_id | text | Stripe Product ID |
| is_published | boolean | Whether the lesson is published |
| video_ids | uuid[] | Array of video IDs included in this lesson |
| is_free | boolean | Whether the lesson is free to access |

### purchases

Stores individual video purchase information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |
| user_id | uuid | References profiles.id of the purchaser |
| video_id | uuid | References videos.id |
| payment_intent_id | text | Stripe Payment Intent ID |
| status | text | Purchase status ('completed', 'refunded', etc.) |
| amount_paid | integer | Amount paid in cents |
| instructor_id | uuid | References profiles.id of the instructor |

### lesson_purchases

Stores lesson package purchase information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |
| user_id | uuid | References profiles.id of the purchaser |
| lesson_id | uuid | References lessons.id |
| payment_intent_id | text | Stripe Payment Intent ID |
| status | text | Purchase status ('completed', 'refunded', etc.) |
| amount_paid | integer | Amount paid in cents |
| instructor_id | uuid | References profiles.id of the instructor |

## Row Level Security (RLS) Policies

The database uses Supabase Row Level Security to control access to data. Below are the key policies implemented:

### profiles Table Policies

- **Select**: 
  - Public profiles: Anyone can read non-sensitive profile data
  - Own profile: Users can read all fields of their own profile
  - Admin access: Admins can read all profiles

- **Insert**: 
  - New users: Users can create their own profile upon signup
  
- **Update**: 
  - Own profile: Users can update their own profile data
  - Admin access: Admins can update any profile

### videos Table Policies

- **Select**: 
  - Published videos: Anyone can view published videos
  - Own videos: Instructors can see all their videos (published or unpublished)
  - Purchased videos: Users can access videos they've purchased
  - Admin access: Admins can see all videos

- **Insert**: 
  - Instructors only: Only users with 'instructor' account type can create videos
  
- **Update**: 
  - Own videos: Instructors can only update their own videos
  - Admin access: Admins can update any video

### lessons Table Policies

- **Select**: 
  - Published lessons: Anyone can view published lessons
  - Own lessons: Instructors can see all their lessons (published or unpublished)
  - Purchased lessons: Users can access lessons they've purchased
  - Admin access: Admins can see all lessons

- **Insert**: 
  - Instructors only: Only users with 'instructor' account type can create lessons
  
- **Update**: 
  - Own lessons: Instructors can only update their own lessons
  - Admin access: Admins can update any lesson

### purchases and lesson_purchases Table Policies

- **Select**: 
  - Own purchases: Users can see their own purchases
  - Instructor sales: Instructors can see purchases of their content
  - Admin access: Admins can see all purchases

- **Insert**: 
  - System only: Typically inserted by API routes or webhooks, not directly by users
  
- **Update**: 
  - System only: Updates handled by system processes, not directly by users

## Database Migrations

Database changes are managed through migration files located in the `supabase/migrations` directory. These migrations are automatically applied when the Supabase project is updated.

Key migrations include:

- `20250403000000_consolidated_schema.sql`: Initial schema setup
- `20250404000000_add_stripe_connect_fields.sql`: Added fields for Stripe Connect integration
- `20250404010000_add_free_lesson_support.sql`: Added support for free content

## Indexes

The following indexes are created to improve query performance:

- `profiles_id_idx`: Index on profiles.id
- `videos_instructor_id_idx`: Index on videos.instructor_id
- `purchases_user_id_idx`: Index on purchases.user_id
- `purchases_video_id_idx`: Index on purchases.video_id
- `lessons_instructor_id_idx`: Index on lessons.instructor_id
- `lesson_purchases_user_id_idx`: Index on lesson_purchases.user_id
- `lesson_purchases_lesson_id_idx`: Index on lesson_purchases.lesson_id

## Storage Buckets

In addition to the database tables, Supabase Storage is used to store video files and thumbnails in the following buckets:

- `videos`: Stores the actual video files
- `thumbnails`: Stores thumbnail images for videos and lessons

## Backup and Recovery

The Supabase PostgreSQL database is automatically backed up daily. These backups are retained for 7 days on the free tier and can be restored if needed.

For production environments, a more comprehensive backup strategy is recommended.
