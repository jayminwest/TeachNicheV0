# Stripe and Supabase Integration Testing Plan

## Overview
This document outlines the comprehensive testing plan for verifying the integration between our application, Supabase, and Stripe using real API calls in the development environment.

## Prerequisites
- [ ] Supabase development environment is synced with production
- [ ] Stripe test account is configured
- [ ] Stripe webhook is properly configured for development
- [ ] Test instructor account with completed Stripe Connect onboarding

## 1. Instructor Onboarding Flow
### 1.1 Create Instructor Profile
- [ ] Create new instructor account
- [ ] Verify Supabase record creation
- [ ] Check `instructor_profiles` table population

### 1.2 Stripe Connect Setup
- [ ] Complete Stripe Connect onboarding
- [ ] Verify `stripe_account_id` storage
- [ ] Confirm `stripe_account_enabled` flag update

## 2. Lesson Management
### 2.1 Paid Lesson Creation
- [ ] Create lesson with price > 0
- [ ] Verify Stripe product creation
- [ ] Verify Stripe price creation
- [ ] Confirm Supabase records have `stripe_product_id` and `stripe_price_id`

### 2.2 Free Lesson Creation
- [ ] Create lesson with price = 0
- [ ] Verify no Stripe product creation
- [ ] Confirm proper Supabase record creation

## 3. Purchase Flows
### 3.1 Successful Paid Lesson Purchase
```
Test Card: 4242 4242 4242 4242
```
- [ ] Verify checkout session creation
- [ ] Confirm payment success
- [ ] Check purchase record in Supabase
- [ ] Verify fee calculations
- [ ] Confirm instructor earnings update
- [ ] Check transfer to instructor's account

### 3.2 Failed Payment Handling
```
Test Card: 4000 0000 0000 0002
```
- [ ] Verify proper error handling
- [ ] Confirm no purchase record created
- [ ] Check error messaging

### 3.3 Free Lesson Access
- [ ] Verify free lesson access flow
- [ ] Check purchase record with:
  - `is_free = true`
  - `amount = 0`
  - `payout_status = 'free_lesson'`
- [ ] Confirm no Stripe interaction

## 4. Webhook Processing
### 4.1 checkout.session.completed
- [ ] Trigger test event
- [ ] Verify purchase record
- [ ] Check instructor earnings update

### 4.2 transfer.created
- [ ] Trigger test event
- [ ] Verify `payout_status = 'transferred'`
- [ ] Check `stripe_transfer_id` update

### 4.3 transfer.failed
- [ ] Trigger test event
- [ ] Verify `payout_status = 'failed'`
- [ ] Check error handling

## 5. Edge Cases
### 5.1 Duplicate Purchase Prevention
- [ ] Attempt duplicate purchase
- [ ] Verify error handling
- [ ] Check no duplicate records

### 5.2 Price Mismatch Protection
- [ ] Attempt purchase with modified price
- [ ] Verify security check works
- [ ] Confirm transaction blocked

### 5.3 Instructor Account Status
- [ ] Test purchases with disabled instructor
- [ ] Verify proper blocking
- [ ] Check error messaging

## Test Data Requirements
### Accounts Needed
- [ ] Test instructor account
- [ ] Test student account
- [ ] Stripe Connect test account

### Content Required
- [ ] Paid lesson ($19.99)
- [ ] Free lesson
- [ ] Various thumbnail images

## Success Criteria
1. All test cases execute successfully
2. Data consistency between Supabase and Stripe
3. Proper error handling in all cases
4. Accurate financial calculations
5. Clean webhook processing

## Testing Notes
- Use Stripe test mode exclusively
- Document all test transaction IDs
- Monitor both Supabase and Stripe dashboards
- Test in development environment first
- Verify webhook endpoints are properly configured

## Test Results Documentation
For each test case, document:
- Date and time of test
- Test environment details
- Transaction IDs (if applicable)
- Screenshots of relevant dashboards
- Any deviations from expected behavior
- Error messages encountered 