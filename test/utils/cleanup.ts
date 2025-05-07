/**
 * Test utilities for cleaning up test data after tests
 */
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { stripe } from '@/lib/stripe';

// Create a Supabase client for test operations
const createTestClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for test cleanup
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials are missing. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.development');
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey);
};

/**
 * Deletes test purchases created during tests
 * @param userId The test user ID
 * @param identifiers An object with optional identifiers (lessonId, videoId, or stripePaymentId)
 */
export const deleteTestPurchases = async (
  userId: string,
  identifiers: {
    lessonId?: string;
    videoId?: string;
    stripePaymentId?: string;
  } = {}
) => {
  const supabase = createTestClient();
  let query = supabase.from('purchases').delete().eq('user_id', userId);
  
  if (identifiers.lessonId) {
    query = query.eq('lesson_id', identifiers.lessonId);
  }
  
  if (identifiers.videoId) {
    query = query.eq('video_id', identifiers.videoId);
  }
  
  if (identifiers.stripePaymentId) {
    query = query.eq('stripe_payment_id', identifiers.stripePaymentId);
  }
  
  const { error } = await query;
  
  if (error) {
    console.error('Error deleting test purchases:', error);
  }
};

/**
 * Deletes test Stripe products and prices created during tests
 * @param productIds Array of Stripe product IDs to delete
 */
export const deleteStripeTestProducts = async (productIds: string[]) => {
  for (const productId of productIds) {
    try {
      // Find and delete all prices for this product
      const prices = await stripe.prices.list({ product: productId });
      
      for (const price of prices.data) {
        await stripe.prices.update(price.id, { active: false });
      }
      
      // Then delete the product
      await stripe.products.update(productId, { active: false });
      
      console.log(`Deleted Stripe product ${productId}`);
    } catch (error) {
      console.error(`Error deleting Stripe product ${productId}:`, error);
    }
  }
};

/**
 * Helper to create a test user for integration tests
 * @param email Unique email for the test user
 * @param password Password for the test user
 */
export const createTestUser = async (email: string, password: string) => {
  const supabase = createTestClient();
  
  // Create a test user with a random email
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  
  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }
  
  return data.user;
};

/**
 * Helper to delete a test user
 * @param userId The user ID to delete
 */
export const deleteTestUser = async (userId: string) => {
  const supabase = createTestClient();
  
  // First delete all related records
  await deleteTestPurchases(userId);
  
  // Delete the user
  const { error } = await supabase.auth.admin.deleteUser(userId);
  
  if (error) {
    console.error(`Error deleting test user ${userId}:`, error);
  }
};