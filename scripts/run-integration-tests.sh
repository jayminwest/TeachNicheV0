#!/bin/bash

# Run integration tests using real development environment
# This script ensures the development environment is used for all tests

# Set environment to development
export NODE_ENV=development

# Run only the integration tests
echo "🧪 Running integration tests against development environment..."
echo "Stripe API Key: ${STRIPE_SECRET_KEY:0:8}..."
echo "Supabase URL: ${NEXT_PUBLIC_SUPABASE_URL}"

npx jest test/integration/ --testTimeout=30000

# Check if tests passed
if [ $? -eq 0 ]; then
    echo "✅ Integration tests passed!"
else
    echo "❌ Integration tests failed. See above for details."
    exit 1
fi