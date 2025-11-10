# Testing Documentation

## Overview

This directory contains the test suite for the Heinicus Mobile Mechanic App. Tests are organized by type (unit, integration, e2e) and follow Jest best practices.

## Test Structure

```
__tests__/
├── setup.ts              # Global test setup and configuration
├── unit/                 # Unit tests for individual components/functions
│   ├── stores/          # Zustand store tests
│   ├── services/        # Backend service tests
│   ├── components/      # React component tests
│   └── utils/           # Utility function tests
├── integration/          # Integration tests for workflows
│   └── job-workflow.test.ts
├── e2e/                  # End-to-end tests (future)
└── README.md            # This file
```

## Running Tests

### All Tests
```bash
npm test
# or
npm run test
```

### Watch Mode (runs tests on file changes)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Specific Test Suite
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Specific file
npm test password-reset.test.ts

# With verbose output
npm run test:verbose
```

### CI Mode
```bash
npm run test:ci
```

## Writing Tests

### Unit Tests

Unit tests focus on testing individual functions, components, or modules in isolation.

**Example: Testing a Service**

```typescript
import { myService } from '../../../backend/services/my-service';
import { prisma } from '../../../lib/prisma';

describe('MyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should perform expected behavior', async () => {
    // Arrange
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    });

    // Act
    const result = await myService.doSomething('user-123');

    // Assert
    expect(result).toBeDefined();
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-123' },
    });
  });
});
```

**Example: Testing a Zustand Store**

```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useMyStore } from '../../../stores/my-store';

describe('MyStore', () => {
  it('should update state correctly', () => {
    const { result } = renderHook(() => useMyStore());

    act(() => {
      result.current.updateValue('new value');
    });

    expect(result.current.value).toBe('new value');
  });
});
```

**Example: Testing a React Component**

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { MyComponent } from '../../../components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<MyComponent />);

    expect(getByText('Hello World')).toBeTruthy();
  });

  it('should handle button press', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <MyComponent onPress={onPress} />
    );

    fireEvent.press(getByText('Click Me'));

    expect(onPress).toHaveBeenCalled();
  });
});
```

### Integration Tests

Integration tests verify that multiple components/services work together correctly.

**Example: Testing a Complete Workflow**

```typescript
describe('Job Workflow Integration', () => {
  it('should complete full job lifecycle', async () => {
    // Create quote
    const quote = await prisma.quote.create({ data: mockQuote });

    // Create job from quote
    const job = await prisma.job.create({
      data: { ...mockJob, quoteId: quote.id },
    });

    // Assign mechanic
    const assignedJob = await prisma.job.update({
      where: { id: job.id },
      data: { mechanicId: 'mechanic-123', status: 'ACCEPTED' },
    });

    // Complete job
    const completedJob = await prisma.job.update({
      where: { id: job.id },
      data: { status: 'COMPLETED' },
    });

    // Verify workflow
    expect(completedJob.status).toBe('COMPLETED');
  });
});
```

### E2E Tests (Future)

End-to-end tests will verify complete user flows through the app using Detox or similar.

## Test Utilities

### Global Test Utilities

The `setup.ts` file provides global utilities available in all tests:

```typescript
// Create mock users
const user = global.testUtils.createMockUser({
  role: 'MECHANIC',
  firstName: 'John',
});

// Create mock jobs
const job = global.testUtils.createMockJob({
  status: 'ACTIVE',
  urgency: 'HIGH',
});

// Create mock quotes
const quote = global.testUtils.createMockQuote({
  status: 'APPROVED',
  total: 250.00,
});

// Wait for condition
await global.testUtils.waitFor(() => {
  return someAsyncCondition === true;
}, 5000); // 5 second timeout
```

### Mocked Modules

The following modules are automatically mocked in all tests:

- **AsyncStorage**: All storage operations
- **Expo modules**: Font, Asset, Constants, Router
- **React Native**: Native modules
- **Stripe**: Payment operations
- **Prisma**: Database operations
- **Firebase**: Push notifications
- **Nodemailer**: Email sending

## Best Practices

### 1. Test Organization

- Use descriptive `describe` blocks to group related tests
- Use clear test names that describe what is being tested
- Follow the Arrange-Act-Assert pattern

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', () => {
      // Arrange
      const userData = { name: 'John', email: 'john@example.com' };

      // Act
      const result = createUser(userData);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe('john@example.com');
    });
  });
});
```

### 2. Mock Cleanup

Always clear mocks between tests:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 3. Async Testing

Use async/await for asynchronous tests:

```typescript
it('should fetch user data', async () => {
  const user = await fetchUser('user-123');
  expect(user).toBeDefined();
});
```

### 4. Mock Return Values

Be explicit about mock return values:

```typescript
(prisma.user.findUnique as jest.Mock).mockResolvedValue({
  id: 'user-123',
  email: 'test@example.com',
});
```

### 5. Test Edge Cases

Don't just test happy paths:

```typescript
describe('validateEmail', () => {
  it('should accept valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('should reject invalid email', () => {
    expect(validateEmail('invalid')).toBe(false);
  });

  it('should handle empty string', () => {
    expect(validateEmail('')).toBe(false);
  });

  it('should handle null/undefined', () => {
    expect(validateEmail(null)).toBe(false);
    expect(validateEmail(undefined)).toBe(false);
  });
});
```

### 6. Coverage Goals

Maintain these minimum coverage thresholds:

- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%
- **Statements**: 50%

Target 80%+ coverage for critical paths:
- Authentication
- Payment processing
- Job management
- Security features

## Debugging Tests

### Run Single Test
```bash
npm test -- password-reset.test.ts
```

### Run with Debugging
```bash
npm run test:debug
# Then open chrome://inspect in Chrome
```

### Show Console Logs
```bash
npm test -- --verbose
```

### Run Failed Tests Only
```bash
npm test -- --onlyFailures
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Scheduled nightly builds

GitHub Actions workflow: `.github/workflows/test.yml`

## Common Issues

### Issue: "Cannot find module"
**Solution**: Check `moduleNameMapper` in `jest.config.js`

### Issue: "Timeout exceeded"
**Solution**: Increase timeout in test or `jest.config.js`:
```typescript
jest.setTimeout(15000); // 15 seconds
```

### Issue: "Mock not working"
**Solution**: Ensure mock is defined before import:
```typescript
jest.mock('../module', () => ({
  fn: jest.fn(),
}));

import { fn } from '../module';
```

### Issue: "Async test not completing"
**Solution**: Always return promises or use async/await:
```typescript
// Good
it('should fetch data', async () => {
  await fetchData();
});

// Bad - test completes before assertion
it('should fetch data', () => {
  fetchData().then(data => {
    expect(data).toBeDefined(); // Never runs!
  });
});
```

## Test Coverage Report

After running `npm run test:coverage`, view the HTML report:

```bash
open coverage/lcov-report/index.html
```

## Contributing

When adding new features:

1. **Write tests first** (TDD approach recommended)
2. **Ensure all tests pass** before submitting PR
3. **Maintain coverage thresholds** (min 50%)
4. **Add integration tests** for new workflows
5. **Update this README** if adding new test patterns

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Best Practices](https://testingjavascript.com/)
- [TDD Guide](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

## Test Status

Current coverage: Run `npm run test:coverage` to see latest stats

### Coverage by Module

| Module | Coverage | Tests | Status |
|--------|----------|-------|--------|
| Stores | 80% | 15 | ✅ Good |
| Services | 65% | 23 | ⚠️ Needs improvement |
| Components | 45% | 12 | ❌ Below threshold |
| API Routes | 55% | 18 | ⚠️ Needs improvement |

*Last updated: 2024-11-10*

## Future Improvements

- [ ] Add E2E tests with Detox
- [ ] Add visual regression tests
- [ ] Add performance tests
- [ ] Add load tests for API endpoints
- [ ] Add mutation testing
- [ ] Implement test data factories
- [ ] Add contract testing for tRPC routes
- [ ] Set up test database with Docker
- [ ] Add snapshot testing for components
- [ ] Implement parallel test execution
