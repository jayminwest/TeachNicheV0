#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}TeachNiche Testing Environment Setup${NC}"
echo -e "${BLUE}======================================${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}No .env file found. Creating from .env.example...${NC}"
  cp .env.example .env
  echo -e "${GREEN}Created .env file. Please update with your test credentials.${NC}"
else
  echo -e "${GREEN}Found existing .env file.${NC}"
fi

# Verify required npm packages
echo -e "${BLUE}Checking required npm packages for testing...${NC}"
if ! grep -q '"jest"' package.json || ! grep -q '"ts-jest"' package.json; then
  echo -e "${YELLOW}Installing required testing packages...${NC}"
  npm install --save-dev jest ts-jest @types/jest jest-environment-node @testing-library/jest-dom @testing-library/react
  echo -e "${GREEN}Testing packages installed.${NC}"
else
  echo -e "${GREEN}Required testing packages already installed.${NC}"
fi

# Check if Stripe CLI is installed for webhook testing
echo -e "${BLUE}Checking for Stripe CLI...${NC}"
if ! command -v stripe &> /dev/null; then
    echo -e "${YELLOW}Stripe CLI not found. This is recommended for webhook testing.${NC}"
    echo -e "${YELLOW}Install with:${NC}"
    echo "brew install stripe/stripe-cli/stripe"
    echo "# OR"
    echo "https://stripe.com/docs/stripe-cli#install"
else
    echo -e "${GREEN}Stripe CLI found.${NC}"
    
    # Check if webhook listener is already running
    if pgrep -f "stripe listen" > /dev/null; then
        echo -e "${GREEN}Stripe webhook listener is already running.${NC}"
    else
        echo -e "${YELLOW}Starting Stripe webhook listener...${NC}"
        echo -e "${YELLOW}This will create a webhook signing secret for local testing.${NC}"
        echo -e "${YELLOW}Please copy the webhook signing secret and update it in .env file.${NC}"
        
        # Start the webhook listener in the background
        stripe listen --forward-to localhost:3000/api/webhooks/stripe &
        
        # Store the process ID to kill it later if needed
        STRIPE_PID=$!
        echo $STRIPE_PID > .stripe-cli-pid
        
        echo -e "${GREEN}Stripe webhook listener started. PID: ${STRIPE_PID}${NC}"
    fi
fi

# Check Supabase CLI if available
echo -e "${BLUE}Checking for Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}Supabase CLI not found. This is recommended for local Supabase testing.${NC}"
    echo -e "${YELLOW}Install with:${NC}"
    echo "npm install -g supabase"
    echo "# OR"
    echo "https://supabase.com/docs/guides/cli/getting-started"
else
    echo -e "${GREEN}Supabase CLI found.${NC}"
fi

# Final instructions
echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}Setup completed!${NC}"
echo -e "${GREEN}To run tests:${NC}"
echo -e "${BLUE}npm test${NC} - Run all tests"
echo -e "${BLUE}npm run test:watch${NC} - Run tests in watch mode"
echo -e "${BLUE}npm run test:coverage${NC} - Run tests with coverage report"
echo -e "${BLUE}npm test -- [test-file-pattern]${NC} - Run specific tests"
echo -e ""
echo -e "${YELLOW}Make sure your .env file has the correct test credentials before running tests.${NC}"
echo -e "${YELLOW}Tests should only be run in a development environment, never production.${NC}"
echo -e "${BLUE}======================================${NC}"

# Make the script executable
chmod +x scripts/setup-test-env.sh
