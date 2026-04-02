# End-to-End Tests

This directory contains end-to-end tests for the mobile mechanic app. These tests simulate real user interactions across the entire application stack.

## Test Categories

### Customer Journey Tests
- Complete customer registration and login flow
- Vehicle management (add, edit, remove vehicles)
- Service request creation and management  
- Quote acceptance and payment flow
- Communication with mechanics

### Mechanic Journey Tests
- Mechanic login and dashboard access
- Job browsing and acceptance
- Customer communication
- Job completion workflow
- Payment and ratings

### Admin Journey Tests
- Admin login and system overview
- User management (customers, mechanics)
- Quote and job oversight
- System settings and configuration
- Analytics and reporting

## Test Setup

End-to-end tests require:
- Detox for React Native E2E testing
- Test environment with mock services
- Proper app build for testing

## Running E2E Tests

```bash
# Install Detox (if not already installed)
npm install -g detox-cli

# Build app for testing
detox build --configuration ios.sim.debug

# Run E2E tests
detox test --configuration ios.sim.debug
```

## Test Structure

Each E2E test should:
1. Start with app in clean state
2. Simulate real user interactions (taps, text input, navigation)
3. Verify expected outcomes (screen content, navigation, data persistence)
4. Clean up after test completion

## Best Practices

- Keep tests independent and isolated
- Use realistic test data
- Test critical user paths thoroughly
- Include error scenarios and edge cases
- Maintain tests as app evolves