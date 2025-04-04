import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';

// Initialize Stripe with the test API key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil', // Match the API version in lib/stripe.ts
});

/**
 * Creates a test Stripe customer for testing purposes
 */
export const createTestCustomer = async (email: string = `test-${uuidv4()}@example.com`) => {
  return await stripe.customers.create({
    email,
    name: 'Test Customer',
  });
};

/**
 * Creates a test payment method (card) for testing
 */
export const createTestPaymentMethod = async () => {
  return await stripe.paymentMethods.create({
    type: 'card',
    card: {
      number: '4242424242424242', // Test card number that always succeeds
      exp_month: 12,
      exp_year: new Date().getFullYear() + 1,
      cvc: '123',
    },
  });
};

/**
 * Creates a test product in Stripe for testing
 */
export const createTestProduct = async (name: string = `Test Product ${uuidv4()}`) => {
  return await stripe.products.create({
    name,
    active: true,
  });
};

/**
 * Creates a test price for a product in Stripe
 */
export const createTestPrice = async (
  productId: string,
  amount: number = 1000, // $10.00 in cents
  currency: string = 'usd'
) => {
  return await stripe.prices.create({
    product: productId,
    unit_amount: amount,
    currency,
  });
};

/**
 * Creates a test checkout session
 */
export const createTestCheckoutSession = async (
  priceId: string,
  customerId: string,
  metadata: Record<string, string> = {},
  successUrl: string = 'http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}',
  cancelUrl: string = 'http://localhost:3000/checkout/cancel'
) => {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  });
};

/**
 * Creates a test Connect account for an instructor
 */
export const createTestConnectAccount = async (
  email: string = `instructor-${uuidv4()}@example.com`,
  country: string = 'US',
  type: 'standard' | 'express' | 'custom' = 'express'
) => {
  return await stripe.accounts.create({
    type,
    country,
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
};

/**
 * Creates an account link for onboarding a Connect account
 */
export const createTestAccountLink = async (
  accountId: string,
  refreshUrl: string = 'http://localhost:3000/dashboard/stripe-connect',
  returnUrl: string = 'http://localhost:3000/dashboard/stripe-connect/success'
) => {
  return await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
};

/**
 * Simulates a successful payment intent for testing
 */
export const createTestPaymentIntent = async (
  amount: number = 1000,
  currency: string = 'usd',
  customerId?: string,
  transferData?: {
    destination: string;
    amount?: number;
  }
) => {
  const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
    amount,
    currency,
    payment_method_types: ['card'],
  };

  if (customerId) {
    paymentIntentParams.customer = customerId;
  }

  if (transferData) {
    paymentIntentParams.transfer_data = transferData;
  }

  return await stripe.paymentIntents.create(paymentIntentParams);
};

/**
 * Simulates a successful transfer to a Connect account
 */
export const createTestTransfer = async (
  amount: number = 850, // $8.50 (85% of $10)
  destinationAccountId: string,
  sourceTransaction?: string,
  currency: string = 'usd'
) => {
  const transferParams: Stripe.TransferCreateParams = {
    amount,
    currency,
    destination: destinationAccountId,
  };

  if (sourceTransaction) {
    transferParams.source_transaction = sourceTransaction;
  }

  return await stripe.transfers.create(transferParams);
};

/**
 * Cleans up test data from Stripe after tests
 */
export const cleanupStripeTestData = async (
  customerId?: string,
  connectAccountId?: string,
  paymentMethodId?: string,
  productId?: string,
  priceId?: string
) => {
  try {
    if (customerId) {
      await stripe.customers.del(customerId);
    }
    if (connectAccountId) {
      await stripe.accounts.del(connectAccountId);
    }
    if (paymentMethodId) {
      await stripe.paymentMethods.detach(paymentMethodId);
    }
    if (productId) {
      await stripe.products.update(productId, { active: false });
    }
    if (priceId) {
      await stripe.prices.update(priceId, { active: false });
    }
  } catch (error) {
    console.error('Error cleaning up Stripe test data:', error);
  }
};

/**
 * Creates a webhook event for testing
 */
export const createTestWebhookEvent = (
  type: string,
  data: any,
  id: string = `evt_${uuidv4()}`
): Stripe.Event => {
  return {
    id,
    object: 'event',
    api_version: '2025-03-31.basil',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: data,
    },
    livemode: false,
    pending_webhooks: 0,
    request: {
      id: `req_${uuidv4()}`,
      idempotency_key: uuidv4(),
    },
    type,
  } as Stripe.Event;
};

/**
 * Logs test transaction information for debugging
 */
export const logTestTransaction = (
  testName: string,
  transactionId: string,
  additionalInfo: Record<string, any> = {}
) => {
  console.log(`
    ======= TEST TRANSACTION =======
    Test: ${testName}
    ID: ${transactionId}
    Time: ${new Date().toISOString()}
    ${Object.entries(additionalInfo)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n    ')}
    ===============================
  `);
};
