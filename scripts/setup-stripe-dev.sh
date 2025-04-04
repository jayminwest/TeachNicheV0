#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Setting up Stripe development environment...${NC}"

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo -e "${YELLOW}Stripe CLI not found. Please install it first:${NC}"
    echo "brew install stripe/stripe-cli/stripe"
    exit 1
fi

# Start Stripe webhook listener
echo -e "${GREEN}Starting Stripe webhook listener...${NC}"
echo "This will create a webhook signing secret for local development."
echo "Please copy the webhook signing secret and update it in .env.development"

stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Note: The webhook secret will be displayed when the listener starts
# You should copy it and update STRIPE_WEBHOOK_SECRET in .env.development 