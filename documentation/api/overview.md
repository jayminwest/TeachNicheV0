# API Documentation

## Overview

TeachNiche's API is built using Next.js API routes and organized around RESTful principles. The API provides access to resources related to user authentication, content management, payments, and video access.

## Base URL

All API routes are relative to the base URL of your deployment. In development, this is typically:

```
http://localhost:3000/api
```

In production, this would be your deployed domain:

```
https://your-domain.com/api
```

## Authentication

Most API endpoints require authentication. The application uses Supabase authentication with JWT tokens. These tokens are automatically included in requests made from the frontend application.

For external API access, you must include the JWT token in the Authorization header:

```
Authorization: Bearer [JWT_TOKEN]
```

## Response Format

All API responses are returned in JSON format. A typical successful response includes:

```json
{
  "data": { ... },  // Response data
  "success": true   // Operation status
}
```

Error responses include:

```json
{
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE"
  },
  "success": false
}
```

## Rate Limiting

The API is currently not rate-limited, but excessive usage may be subject to restrictions in the future.

## API Endpoints

The API is organized around the following categories:

### Authentication

- [Forgot Password](/documentation/api/auth/forgot-password.md)
- [Reset Password](/documentation/api/auth/reset-password.md)

### Checkout & Payments

- [Checkout Video](/documentation/api/checkout/checkout.md)
- [Checkout Lesson](/documentation/api/checkout/checkout-lesson.md)
- [Verify Purchase](/documentation/api/checkout/verify-purchase.md)
- [Verify Lesson Purchase](/documentation/api/checkout/verify-lesson-purchase.md)

### Stripe Integration

- [Create Connect Account](/documentation/api/stripe/create-connect-account.md)
- [Account Status](/documentation/api/stripe/account-status.md)
- [Create Login Link](/documentation/api/stripe/create-login-link.md)
- [Create Product](/documentation/api/stripe/create-product.md)
- [Stripe Webhook](/documentation/api/stripe/webhook.md)

### Video Management

- [Get Video URL](/documentation/api/video/get-video-url.md)

### Admin Functions

- [Setup RLS Policies](/documentation/api/admin/setup-rls-policies.md)
- [Setup Storage](/documentation/api/admin/setup-storage.md)

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_ERROR` | Authentication or authorization error |
| `INVALID_REQUEST` | Invalid request parameters |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `PAYMENT_ERROR` | Error processing payment |
| `STRIPE_ERROR` | Error from Stripe API |
| `SERVER_ERROR` | Internal server error |
| `SUPABASE_ERROR` | Error from Supabase API |

## Versioning

The API does not currently use versioning in the URL path. Future breaking changes will be communicated in advance.

## Support

For API support, please contact the development team or open an issue in the project repository.
