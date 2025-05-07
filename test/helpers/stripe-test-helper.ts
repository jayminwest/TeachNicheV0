/**
 * Stripe test helpers for integration tests
 * 
 * These functions provide utilities for working with Stripe's test environment
 */
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

/**
 * Creates a test product and price in Stripe
 * 
 * @param name Product name
 * @param description Product description
 * @param priceInCents Price in cents
 * @returns Object containing product and price information
 */
export async function createTestProductAndPrice(
  name: string,
  description: string,
  priceInCents: number
): Promise<{ product: Stripe.Product; price: Stripe.Price }> {
  // Create a product for testing
  const product = await stripe.products.create({
    name,
    description,
  });
  
  // Create a price for the product
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: priceInCents,
    currency: 'usd',
  });
  
  return { product, price };
}

/**
 * Creates a test customer in Stripe
 * 
 * @param email Customer email
 * @param name Customer name
 * @returns The created customer object
 */
export async function createTestCustomer(
  email: string, 
  name: string
): Promise<Stripe.Customer> {
  return stripe.customers.create({
    email,
    name,
    metadata: {
      test: 'true',
    },
  });
}

/**
 * Creates a test checkout session without requiring Stripe Connect
 * 
 * This function creates a regular checkout session that can be used
 * for testing purchase flows without requiring a fully onboarded
 * Stripe Connect account.
 * 
 * @param params Session creation parameters
 * @returns The created checkout session
 */
export async function createTestCheckoutSession(
  params: {
    priceId: string;
    customerId?: string;
    successUrl?: string;
    cancelUrl?: string;
    metadata?: Record<string, string>;
  }
): Promise<Stripe.Checkout.Session> {
  const {
    priceId,
    customerId,
    successUrl = 'https://example.com/success',
    cancelUrl = 'https://example.com/cancel',
    metadata = {},
  } = params;
  
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
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
  };
  
  // Add customer if provided
  if (customerId) {
    sessionParams.customer = customerId;
  }
  
  return stripe.checkout.sessions.create(sessionParams);
}

/**
 * Cleans up test resources in Stripe
 * 
 * @param productIds Array of product IDs to clean up
 * @param customerIds Array of customer IDs to clean up 
 */
export async function cleanupStripeTestResources(
  productIds: string[] = [],
  customerIds: string[] = [],
): Promise<void> {
  // Clean up products
  for (const productId of productIds) {
    try {
      if (!productId) continue;
      
      // Archive the product
      await stripe.products.update(productId, { active: false });
      console.log(`Archived Stripe product ${productId}`);
    } catch (error) {
      console.error(`Error archiving Stripe product ${productId}:`, error);
    }
  }
  
  // Clean up customers
  for (const customerId of customerIds) {
    try {
      if (!customerId) continue;
      
      // Delete the customer
      await stripe.customers.del(customerId);
      console.log(`Deleted Stripe customer ${customerId}`);
    } catch (error) {
      console.error(`Error deleting Stripe customer ${customerId}:`, error);
    }
  }
}