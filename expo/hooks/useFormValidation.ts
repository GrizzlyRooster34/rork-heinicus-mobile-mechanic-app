import { useState, useCallback, useRef } from 'react';
import { 
  ValidationResult, 
  ValidationOptions, 
  FormValidationResult,
  validateField,
  validateForm as validateFormUtil,
  debounceValidation
} from '@/utils/validation';

// Individual field state
export interface FieldState {
  value: string;
  error: string | null;
  warning: string | null;
  isValid: boolean;
  isTouched: boolean;
  isValidating: boolean;
}

// Form validation state
export interface FormState {
  fields: Record<string, FieldState>;
  isValid: boolean;
  isSubmitting: boolean;
  submitCount: number;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
}

// Form validation configuration
export interface FormConfig {
  [fieldName: string]: ValidationOptions & {
    initialValue?: string;
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    debounceMs?: number;
  };
}

// Form validation hook
export function useFormValidation(config: FormConfig) {
  const [formState, setFormState] = useState<FormState>(() => {
    const fields: Record<string, FieldState> = {};
    
    Object.entries(config).forEach(([fieldName, fieldConfig]) => {
      fields[fieldName] = {
        value: fieldConfig.initialValue || '',
        error: null,
        warning: null,
        isValid: !fieldConfig.required, // Start as valid if not required
        isTouched: false,
        isValidating: false,
      };
    });

    return {
      fields,
      isValid: true,
      isSubmitting: false,
      submitCount: 0,
      errors: {},
      warnings: {},
    };
  });

  const debounceRefs = useRef<Record<string, () => void>>({});

  // Validate a single field
  const validateSingleField = useCallback((fieldName: string, value: string): ValidationResult => {
    const fieldConfig = config[fieldName];
    if (!fieldConfig) {
      return { isValid: true, errors: [] };
    }

    return validateField(value, fieldConfig);
  }, [config]);

  // Update field value and optionally validate
  const setFieldValue = useCallback((fieldName: string, value: string, shouldValidate = false) => {
    setFormState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName],
          value,
          isTouched: true,
        },
      },
    }));

    const fieldConfig = config[fieldName];
    
    // Set up debounced validation if configured
    if (shouldValidate && fieldConfig?.validateOnChange) {
      if (!debounceRefs.current[fieldName]) {
        debounceRefs.current[fieldName] = debounceValidation(() => {
          validateFieldAsync(fieldName, value);
        }, fieldConfig.debounceMs || 300);
      }
      
      debounceRefs.current[fieldName]();
    }
  }, [config]);

  // Validate field asynchronously
  const validateFieldAsync = useCallback(async (fieldName: string, value?: string) => {
    const currentValue = value ?? formState.fields[fieldName]?.value ?? '';
    
    setFormState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName],
          isValidating: true,
        },
      },
    }));

    // Simulate async validation delay for UX
    await new Promise(resolve => setTimeout(resolve, 100));

    const result = validateSingleField(fieldName, currentValue);

    setFormState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName],
          error: result.errors.length > 0 ? result.errors[0] : null,
          warning: result.warnings && result.warnings.length > 0 ? result.warnings[0] : null,
          isValid: result.isValid,
          isValidating: false,
        },
      },
    }));

    return result;
  }, [formState.fields, validateSingleField]);

  // Handle field blur
  const handleFieldBlur = useCallback((fieldName: string) => {
    const fieldConfig = config[fieldName];
    
    setFormState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName],
          isTouched: true,
        },
      },
    }));

    if (fieldConfig?.validateOnBlur) {
      validateFieldAsync(fieldName);
    }
  }, [config, validateFieldAsync]);

  // Validate entire form
  const validateFormFn = useCallback((): FormValidationResult => {
    const fieldValues: Record<string, string> = {};
    const validationRules: Record<string, ValidationOptions> = {};

    Object.entries(formState.fields).forEach(([fieldName, fieldState]) => {
      fieldValues[fieldName] = fieldState.value;
      validationRules[fieldName] = config[fieldName];
    });

    const result = validateFormUtil(fieldValues, validationRules);

    // Update form state with validation results
    setFormState(prev => {
      const updatedFields = { ...prev.fields };
      
      Object.entries(updatedFields).forEach(([fieldName, fieldState]) => {
        const fieldErrors = result.errors[fieldName] || [];
        const fieldWarnings = result.warnings[fieldName] || [];
        
        updatedFields[fieldName] = {
          ...fieldState,
          error: fieldErrors.length > 0 ? fieldErrors[0] : null,
          warning: fieldWarnings.length > 0 ? fieldWarnings[0] : null,
          isValid: fieldErrors.length === 0,
          isTouched: true,
        };
      });

      return {
        ...prev,
        fields: updatedFields,
        isValid: result.isValid,
        errors: result.errors,
        warnings: result.warnings,
      };
    });

    return result;
  }, [formState.fields, config]);

  // Handle form submission
  const handleSubmit = useCallback(async (onSubmit: (values: Record<string, string>) => Promise<void> | void) => {
    setFormState(prev => ({
      ...prev,
      isSubmitting: true,
      submitCount: prev.submitCount + 1,
    }));

    try {
      const validationResult = validateFormFn();
      
      if (!validationResult.isValid) {
        setFormState(prev => ({ ...prev, isSubmitting: false }));
        return false;
      }

      const values: Record<string, string> = {};
      Object.entries(formState.fields).forEach(([fieldName, fieldState]) => {
        values[fieldName] = fieldState.value;
      });

      await onSubmit(values);
      
      setFormState(prev => ({ ...prev, isSubmitting: false }));
      return true;
    } catch (error) {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
      throw error;
    }
  }, [formState.fields, validateFormFn]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormState(prev => {
      const resetFields: Record<string, FieldState> = {};
      
      Object.entries(config).forEach(([fieldName, fieldConfig]) => {
        resetFields[fieldName] = {
          value: fieldConfig.initialValue || '',
          error: null,
          warning: null,
          isValid: !fieldConfig.required,
          isTouched: false,
          isValidating: false,
        };
      });

      return {
        fields: resetFields,
        isValid: true,
        isSubmitting: false,
        submitCount: 0,
        errors: {},
        warnings: {},
      };
    });
  }, [config]);

  // Get field props for easy integration with input components
  const getFieldProps = useCallback((fieldName: string) => {
    const fieldState = formState.fields[fieldName];
    const fieldConfig = config[fieldName];
    
    if (!fieldState) {
      throw new Error(`Field '${fieldName}' not found in form configuration`);
    }

    return {
      value: fieldState.value,
      error: fieldState.error,
      warning: fieldState.warning,
      isValid: fieldState.isValid,
      isTouched: fieldState.isTouched,
      isValidating: fieldState.isValidating,
      onChangeText: (value: string) => setFieldValue(fieldName, value, fieldConfig?.validateOnChange),
      onBlur: () => handleFieldBlur(fieldName),
    };
  }, [formState.fields, config, setFieldValue, handleFieldBlur]);

  // Set multiple field values at once
  const setFieldValues = useCallback((values: Record<string, string>) => {
    setFormState(prev => {
      const updatedFields = { ...prev.fields };
      
      Object.entries(values).forEach(([fieldName, value]) => {
        if (updatedFields[fieldName]) {
          updatedFields[fieldName] = {
            ...updatedFields[fieldName],
            value,
          };
        }
      });

      return {
        ...prev,
        fields: updatedFields,
      };
    });
  }, []);

  // Get all field values
  const getValues = useCallback((): Record<string, string> => {
    const values: Record<string, string> = {};
    Object.entries(formState.fields).forEach(([fieldName, fieldState]) => {
      values[fieldName] = fieldState.value;
    });
    return values;
  }, [formState.fields]);

  // Check if form has been modified
  const isDirty = useCallback((): boolean => {
    return Object.values(formState.fields).some(field => field.isTouched);
  }, [formState.fields]);

  // Get form errors
  const getFormErrors = useCallback((): string[] => {
    const errors: string[] = [];
    Object.values(formState.fields).forEach(field => {
      if (field.error) {
        errors.push(field.error);
      }
    });
    return errors;
  }, [formState.fields]);

  return {
    // State
    formState,
    
    // Actions
    setFieldValue,
    setFieldValues,
    validateField: validateFieldAsync,
    validateForm: validateFormFn,
    handleSubmit,
    resetForm,
    
    // Utilities
    getFieldProps,
    getValues,
    isDirty,
    getFormErrors,
    
    // Computed values
    isValid: formState.isValid,
    isSubmitting: formState.isSubmitting,
    hasErrors: Object.values(formState.fields).some(field => field.error !== null),
    hasWarnings: Object.values(formState.fields).some(field => field.warning !== null),
  };
}