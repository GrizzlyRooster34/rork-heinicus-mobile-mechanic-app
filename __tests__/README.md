# Test Suite Documentation

This directory contains comprehensive tests for the Heinicus Mobile Mechanic app.

## Test Structure

```
__tests__/
├── unit/                 # Unit tests
│   ├── components/       # Component tests
│   ├── lib/             # Library/utility tests
│   ├── stores/          # State management tests
│   └── utils/           # Utility function tests
├── integration/         # Integration tests
│   ├── auth/           # Authentication workflows
│   ├── database/       # Database operations
│   └── workflows/      # Multi-component workflows
├── e2e/                # End-to-end tests
└── utils/              # Test utilities and helpers
```

## Test Scripts

Run tests using these npm scripts:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in watch mode (for development)
npm run test:watch

# Run tests for CI/CD
npm run test:ci

# Run tests with verbose output
npm run test:verbose

# Debug tests
npm run test:debug
```

## Test Categories

### Unit Tests
Test individual components, functions, and modules in isolation.

**Coverage includes:**
- React components (rendering, props, events)
- Mobile database operations
- Store state management
- Utility functions
- Validation logic

### Integration Tests
Test interactions between multiple components and systems.

**Coverage includes:**
- Authentication workflows
- Database + store integration
- Complete user journeys
- API integrations
- Error handling across systems

### End-to-End Tests
Test complete user scenarios from start to finish.

**Coverage includes:**
- Customer registration → service request → payment
- Mechanic job acceptance → completion → payment
- Admin user management and oversight

## Test Utilities

### Test Utils (`__tests__/utils/test-utils.tsx`)
- Custom render function with providers
- Mock data factories
- Test environment setup
- Navigation helpers

### Database Test Utils (`__tests__/utils/database-test-utils.ts`)
- AsyncStorage mocking
- Database state management
- Test data creation
- Database operation testing

### Auth Test Utils (`__tests__/utils/auth-test-utils.ts`)
- Authentication state mocking
- User creation helpers
- Login/logout simulation
- Validation test data

## Writing Tests

### Component Tests
```typescript
import { render, fireEvent } from '../utils/test-utils';
import MyComponent from '@/components/MyComponent';

test('should render and handle interaction', () => {
  const mockOnPress = jest.fn();
  const { getByText } = render(
    <MyComponent title="Test" onPress={mockOnPress} />
  );
  
  fireEvent.press(getByText('Test'));
  expect(mockOnPress).toHaveBeenCalled();
});
```

### Store Tests
```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useMyStore } from '@/stores/my-store';

test('should update state correctly', () => {
  const { result } = renderHook(() => useMyStore());
  
  act(() => {
    result.current.updateValue('new value');
  });
  
  expect(result.current.value).toBe('new value');
});
```

### Integration Tests
```typescript
import { setupDatabaseTests } from '../utils/database-test-utils';
import { mobileDB } from '@/lib/mobile-database';

test('should complete user workflow', async () => {
  const { mockAsyncStorage } = setupDatabaseTests();
  
  const user = await mobileDB.createUser(userData);
  const authenticated = await mobileDB.authenticateUser(email, password);
  
  expect(authenticated).toEqual(user);
});
```

## Mocking Strategy

### External Dependencies
- **AsyncStorage**: Mocked for all database tests
- **expo-router**: Navigation mocked for component tests
- **expo-constants**: Configuration mocked
- **react-native-safe-area-context**: UI mocked

### Internal Modules
- **Mobile Database**: Mocked for auth/component tests
- **Stores**: Partial mocking when testing integration
- **Network**: Fetch mocked for API tests

## Coverage Goals

- **Overall Coverage**: 70%+ (lines, functions, branches, statements)
- **Critical Paths**: 90%+ (auth, database, payments)
- **Components**: 80%+ (all user-facing components)
- **Utilities**: 85%+ (business logic functions)

## Best Practices

### Test Organization
- One test file per source file
- Group related tests with `describe` blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Test Data
- Use factory functions for consistent test data
- Isolate tests with fresh data
- Mock external dependencies appropriately
- Clean up after tests

### Assertions
- Test behavior, not implementation
- Use semantic matchers when available
- Assert on user-visible outcomes
- Include negative test cases

### Performance
- Keep tests fast and focused
- Mock expensive operations
- Use `beforeEach`/`afterEach` for setup/cleanup
- Avoid testing multiple concerns in one test

## Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch commits
- Release builds

CI requirements:
- All tests must pass
- Coverage thresholds must be met
- No linting errors
- TypeScript compilation success

## Troubleshooting

### Common Issues
1. **AsyncStorage not mocked**: Import mock in test setup
2. **Component providers missing**: Use custom render from test-utils
3. **Timer issues**: Use `jest.useFakeTimers()` and `jest.runAllTimers()`
4. **Async test failures**: Ensure proper `await` usage

### Debug Tips
- Use `test:debug` script for debugging
- Add `console.log` statements for inspection
- Use `screen.debug()` to see rendered output
- Check mock call arguments with `jest.fn().mock.calls`