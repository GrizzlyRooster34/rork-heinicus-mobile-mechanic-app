# Form Validation & Input Sanitization Documentation

This document explains the comprehensive form validation and input sanitization system implemented in the Heinicus Mobile Mechanic app.

## Overview

The validation system provides:
- **Real-time validation** with debounced input checking
- **Input sanitization** to prevent XSS and injection attacks
- **Custom validation rules** for specific field types
- **User-friendly error messages** with actionable feedback
- **Accessibility support** for screen readers
- **Type-safe validation** with TypeScript integration

## Core Components

### 1. Validation Utilities (`utils/validation.ts`)

#### Basic Validators

```tsx
// Email validation with typo detection
const emailResult = validateEmail('user@gmail.com');
// Returns: { isValid: true, errors: [] }

// Password validation with strength checking
const passwordResult = validatePassword('mypassword123');
// Returns: { isValid: true, errors: [], warnings: ['Consider adding special characters...'] }

// Phone number validation with format flexibility
const phoneResult = validatePhoneNumber('(555) 123-4567');
// Returns: { isValid: true, errors: [] }

// Name validation with character restrictions
const nameResult = validateName('John Doe', 'First name');
// Returns: { isValid: true, errors: [] }

// VIN validation with format checking
const vinResult = validateVIN('1HGCM82633A123456');
// Returns: { isValid: true, errors: [] }
```

#### Input Sanitization

```tsx
// Email sanitization
const cleanEmail = sanitizeEmail('  USER@GMAIL.COM  ');
// Returns: 'user@gmail.com'

// Name sanitization
const cleanName = sanitizeName('John <script>alert("xss")</script> Doe');
// Returns: 'John Doe'

// Phone sanitization
const cleanPhone = sanitizePhoneNumber('555-123-4567 ext 123');
// Returns: '555-123-4567'

// Description sanitization (removes HTML/scripts)
const cleanDesc = sanitizeDescription('<p>Car won\'t start</p><script>evil()</script>');
// Returns: 'Car won\'t start'
```

### 2. Form Validation Hook (`hooks/useFormValidation.ts`)

```tsx
function MyForm() {
  const formConfig = {
    email: {
      required: true,
      validateOnChange: true,
      validateOnBlur: true,
      customValidator: (value: string) => validateEmail(value),
    },
    password: {
      required: true,
      validateOnChange: true,
      validateOnBlur: true,
      customValidator: (value: string) => validatePassword(value),
    },
  };

  const {
    formState,
    handleSubmit,
    getFieldProps,
    isValid,
    resetForm,
  } = useFormValidation(formConfig);

  const onSubmit = async (values: Record<string, string>) => {
    console.log('Form values:', values);
    // Process form submission
  };

  return (
    <View>
      <ValidatedTextInput
        label="Email"
        {...getFieldProps('email')}
      />
      <ValidatedTextInput
        label="Password"
        secureTextEntry
        {...getFieldProps('password')}
      />
      <Button
        title="Submit"
        onPress={() => handleSubmit(onSubmit)}
        disabled={!isValid}
      />
    </View>
  );
}
```

### 3. Validated Input Components (`components/forms/ValidatedTextInput.tsx`)

#### Basic Validated Input

```tsx
<ValidatedTextInput
  label="Email Address"
  value={email}
  onChangeText={setEmail}
  error={emailError}
  warning={emailWarning}
  required={true}
  sanitize={sanitizeEmail}
  leftIcon="Mail"
  helpText="We'll never share your email with anyone"
  showValidationIcon={true}
/>
```

#### Preset Input Components

```tsx
// Email input with built-in validation
<EmailInput
  label="Email Address"
  value={email}
  onChangeText={setEmail}
  error={error}
  required
/>

// Password input with show/hide toggle
<PasswordInput
  label="Password"
  value={password}
  onChangeText={setPassword}
  error={error}
  helpText="Use at least 6 characters"
  required
/>

// Phone input with formatting
<PhoneInput
  label="Phone Number"
  value={phone}
  onChangeText={setPhone}
  helpText="We'll use this to contact you"
/>

// Name input with proper capitalization
<NameInput
  label="Full Name"
  value={name}
  onChangeText={setName}
  required
/>

// VIN input with format validation
<VINInput
  label="VIN Number"
  value={vin}
  onChangeText={setVin}
  helpText="17-character vehicle identification number"
/>
```

### 4. Validated Form Component (`components/forms/ValidatedForm.tsx`)

```tsx
<ValidatedForm
  config={formConfig}
  onSubmit={handleSubmit}
  submitButtonTitle="Create Account"
  submitButtonLoadingTitle="Creating Account..."
  showSubmitButton={true}
  showFormErrors={true}
  scrollable={true}
  resetOnSubmit={false}
>
  {(formApi) => (
    <>
      <FormSection title="Personal Information">
        <FieldGroup direction="row" spacing="medium">
          <NameInput
            label="First Name"
            required
            {...formApi.getFieldProps('firstName')}
          />
          <NameInput
            label="Last Name"
            required
            {...formApi.getFieldProps('lastName')}
          />
        </FieldGroup>
      </FormSection>

      <FormSection title="Contact Information">
        <EmailInput
          label="Email Address"
          required
          {...formApi.getFieldProps('email')}
        />
        <PhoneInput
          label="Phone Number"
          {...formApi.getFieldProps('phone')}
        />
      </FormSection>
    </>
  )}
</ValidatedForm>
```

## Advanced Features

### 1. Real-time Validation with Debouncing

```tsx
const formConfig = {
  email: {
    required: true,
    validateOnChange: true,  // Validate as user types
    validateOnBlur: true,    // Validate when field loses focus
    debounceMs: 300,         // Wait 300ms after typing stops
    customValidator: (value: string) => validateEmail(value),
  },
};
```

### 2. Custom Validation Rules

```tsx
const formConfig = {
  confirmPassword: {
    required: true,
    customValidator: (value: string) => {
      if (value !== password) {
        return {
          isValid: false,
          errors: ['Passwords do not match'],
        };
      }
      return { isValid: true, errors: [] };
    },
  },
  username: {
    required: true,
    customValidator: async (value: string) => {
      // Check username availability
      const available = await checkUsernameAvailability(value);
      if (!available) {
        return {
          isValid: false,
          errors: ['Username is already taken'],
        };
      }
      return { isValid: true, errors: [] };
    },
  },
};
```

### 3. Input Sanitization

```tsx
const sanitizationOptions = {
  removeHTML: true,           // Remove HTML tags
  removeScripts: true,        // Remove script tags and javascript:
  removeSQLKeywords: true,    // Remove common SQL injection keywords
  normalizeWhitespace: true,  // Convert multiple spaces to single space
  maxLength: 1000,           // Truncate to max length
  allowedCharacters: /[a-zA-Z0-9\s\-']/g,  // Only allow specific characters
};

const cleanInput = sanitizeInput(userInput, sanitizationOptions);
```

### 4. Form Validation Summary

```tsx
<ValidationSummary
  formApi={formApi}
  showWarnings={true}
  containerStyle={styles.summary}
/>
```

## Security Considerations

### 1. Input Sanitization
- **HTML/Script Removal**: Prevents XSS attacks
- **SQL Keyword Filtering**: Basic protection against SQL injection
- **Character Whitelisting**: Only allow expected characters
- **Length Limits**: Prevent buffer overflow attacks

### 2. Validation Security
- **Client-side validation** for UX (not security)
- **Server-side validation** always required for security
- **Rate limiting** for validation endpoints
- **CSRF protection** for form submissions

### 3. Password Security
- **Minimum length requirements**
- **Complexity checking** (optional but recommended)
- **Common password detection**
- **Password confirmation matching**

## Implementation Examples

### 1. Auth Screen with Validation

```tsx
// app/auth/index.tsx
function AuthScreen() {
  const loginFormConfig = {
    email: {
      required: true,
      validateOnChange: true,
      customValidator: validateEmail,
    },
    password: {
      required: true,
      minLength: 1,
    },
  };

  const handleLogin = async (values: Record<string, string>) => {
    const success = await login(values.email, values.password);
    if (!success) {
      Alert.alert('Login Failed', 'Invalid credentials');
    }
  };

  return (
    <ValidatedForm config={loginFormConfig} onSubmit={handleLogin}>
      {(formApi) => (
        <>
          <EmailInput
            label="Email Address"
            required
            sanitize={sanitizeEmail}
            {...formApi.getFieldProps('email')}
          />
          <PasswordInput
            label="Password"
            required
            {...formApi.getFieldProps('password')}
          />
        </>
      )}
    </ValidatedForm>
  );
}
```

### 2. Service Request Form

```tsx
// components/forms/ServiceRequestForm.tsx
function ServiceRequestForm({ onSubmit }: Props) {
  const formConfig = {
    description: {
      required: true,
      minLength: 10,
      maxLength: 1000,
      validateOnChange: true,
      customValidator: (value: string) => {
        // Check for emergency keywords
        const emergencyKeywords = ['emergency', 'urgent', 'stranded'];
        const hasEmergency = emergencyKeywords.some(keyword => 
          value.toLowerCase().includes(keyword)
        );
        
        if (hasEmergency) {
          return {
            isValid: true,
            errors: [],
            warnings: ['This sounds urgent. Consider emergency priority.'],
          };
        }
        
        return { isValid: true, errors: [] };
      },
    },
    vin: {
      required: false,
      customValidator: validateVIN,
    },
  };

  return (
    <ValidatedForm config={formConfig} onSubmit={onSubmit}>
      {(formApi) => (
        <>
          <ValidatedTextInput
            label="Problem Description"
            required
            multiline
            numberOfLines={4}
            sanitize={sanitizeDescription}
            helpText="Describe the issue in detail"
            {...formApi.getFieldProps('description')}
          />
          <VINInput
            label="VIN Number (Optional)"
            sanitize={sanitizeVIN}
            helpText="17-character vehicle identification"
            {...formApi.getFieldProps('vin')}
          />
        </>
      )}
    </ValidatedForm>
  );
}
```

## Best Practices

### 1. Validation Strategy
- **Progressive validation**: Start with basic checks, add complexity
- **User-friendly messages**: Explain what's wrong and how to fix it
- **Real-time feedback**: Validate as users type (with debouncing)
- **Visual indicators**: Use colors and icons to show validation state

### 2. Error Handling
- **Graceful degradation**: Form works even if validation fails
- **Clear error messages**: Specific, actionable feedback
- **Error grouping**: Show related errors together
- **Recovery guidance**: Help users fix validation errors

### 3. Performance
- **Debounced validation**: Avoid excessive API calls
- **Lazy validation**: Only validate when necessary
- **Memoized validators**: Cache validation results
- **Async validation**: Handle network validation gracefully

### 4. Accessibility
- **Screen reader support**: Proper ARIA labels and live regions
- **Keyboard navigation**: Tab order and focus management
- **High contrast**: Ensure error states are visible
- **Error announcements**: Screen readers announce validation errors

## Testing Validation

### 1. Unit Tests
```tsx
describe('Email Validation', () => {
  it('should validate correct email format', () => {
    const result = validateEmail('user@example.com');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid email format', () => {
    const result = validateEmail('invalid-email');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Please enter a valid email address');
  });

  it('should detect common typos', () => {
    const result = validateEmail('user@gmai.com');
    expect(result.errors).toContain('Did you mean user@gmail.com?');
  });
});
```

### 2. Integration Tests
```tsx
describe('Auth Form', () => {
  it('should prevent submission with invalid data', async () => {
    const { getByLabelText, getByText } = render(<AuthScreen />);
    
    fireEvent.changeText(getByLabelText('Email'), 'invalid-email');
    fireEvent.press(getByText('Sign In'));
    
    expect(getByText('Please enter a valid email address')).toBeTruthy();
  });
});
```

This comprehensive validation system ensures data integrity, security, and excellent user experience throughout the mobile app.