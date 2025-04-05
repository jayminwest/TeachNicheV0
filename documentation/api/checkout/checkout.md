# Checkout API

The Checkout API handles the process of creating a payment session for purchasing a video.

## Create Checkout Session

Creates a new Stripe Checkout session for a video purchase.

### Endpoint

```
POST /api/checkout
```

### Authentication

Requires a valid JWT token.

### Request Parameters

The request body should contain the following JSON properties:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `videoId` | string | Yes | The ID of the video being purchased |
| `priceId` | string | Yes | The Stripe Price ID associated with the video |
| `instructorId` | string | Yes | The user ID of the video's instructor |
| `title` | string | Yes | The title of the video |
| `description` | string | No | Brief description of the video |
| `imageUrl` | string | No | Thumbnail URL for the checkout page |

### Example Request

```json
{
  "videoId": "123e4567-e89b-12d3-a456-426614174000",
  "priceId": "price_1AbCdEfGhIjKlMnOpQrStUvW",
  "instructorId": "user_1AbCdEfGhIjKlMnOpQrStUvW",
  "title": "Advanced Kendama Tutorial",
  "description": "Learn advanced kendama techniques",
  "imageUrl": "https://example.com/thumbnail.jpg"
}
```

### Response

#### Success Response

Status Code: 200 OK

```json
{
  "sessionId": "cs_test_a1b2c3d4e5f6g7h8i9j0",
  "sessionUrl": "https://checkout.stripe.com/pay/cs_test_a1b2c3d4e5f6g7h8i9j0",
  "success": true
}
```

#### Error Response

Status Code: 400 Bad Request

```json
{
  "error": {
    "message": "Missing required parameters",
    "code": "INVALID_REQUEST"
  },
  "success": false
}
```

Status Code: 401 Unauthorized

```json
{
  "error": {
    "message": "Authentication required",
    "code": "AUTH_ERROR"
  },
  "success": false
}
```

Status Code: 500 Internal Server Error

```json
{
  "error": {
    "message": "Failed to create checkout session",
    "code": "STRIPE_ERROR"
  },
  "success": false
}
```

### Workflow

1. The client sends a POST request with video and price information
2. The server validates the request and user authentication
3. The server creates a Stripe Checkout session with the appropriate configuration
4. The session ID and URL are returned to the client
5. The client redirects the user to the Stripe Checkout page
6. After successful payment, Stripe redirects to the success URL
7. A webhook is triggered to update the user's purchase in the database

### Notes

- The checkout session includes application fee information for the platform's commission
- The session is configured to send the payment to the instructor's connected Stripe account
- The platform takes a configurable percentage as defined by `PLATFORM_FEE_PERCENTAGE`

### See Also

- [Checkout Lesson API](/documentation/api/checkout/checkout-lesson.md)
- [Verify Purchase API](/documentation/api/checkout/verify-purchase.md)
- [Stripe Webhook API](/documentation/api/stripe/webhook.md)
