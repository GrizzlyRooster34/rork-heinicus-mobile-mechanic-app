import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import { LoadingButton } from '@/components/LoadingState';
import { useFormValidation, FormConfig } from '@/hooks/useFormValidation';
import * as Icons from 'lucide-react-native';

export interface ValidatedFormProps {
  config: FormConfig;
  onSubmit: (values: Record<string, string>) => Promise<void> | void;
  children: (formApi: ReturnType<typeof useFormValidation>) => ReactNode;
  submitButtonTitle?: string;
  submitButtonLoadingTitle?: string;
  showSubmitButton?: boolean;
  showFormErrors?: boolean;
  containerStyle?: ViewStyle;
  scrollable?: boolean;
  resetOnSubmit?: boolean;
  validateOnMount?: boolean;
}

export function ValidatedForm({
  config,
  onSubmit,
  children,
  submitButtonTitle = 'Submit',
  submitButtonLoadingTitle = 'Submitting...',
  showSubmitButton = true,
  showFormErrors = true,
  containerStyle,
  scrollable = false,
  resetOnSubmit = false,
  validateOnMount = false,
}: ValidatedFormProps) {
  const formApi = useFormValidation(config);

  const handleSubmit = async () => {
    try {
      const success = await formApi.handleSubmit(onSubmit);
      if (success && resetOnSubmit) {
        formApi.resetForm();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Form submission error:', error);
    }
  };

  const formErrors = showFormErrors ? formApi.getFormErrors() : [];

  const content = (
    <View style={[styles.container, containerStyle]}>
      {/* Form errors summary */}
      {formErrors.length > 0 && (
        <View style={styles.errorSummary}>
          <View style={styles.errorHeader}>
            <Icons.AlertCircle size={20} color={Colors.error} />
            <Text style={styles.errorTitle}>Please fix the following errors:</Text>
          </View>
          {formErrors.map((error, index) => (
            <View key={index} style={styles.errorItem}>
              <Icons.X size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Form fields */}
      <View style={styles.fieldsContainer}>
        {children(formApi)}
      </View>

      {/* Submit button */}
      {showSubmitButton && (
        <View style={styles.submitContainer}>
          <LoadingButton
            title={submitButtonTitle}
            loadingTitle={submitButtonLoadingTitle}
            isLoading={formApi.isSubmitting}
            onPress={handleSubmit}
            disabled={!formApi.isValid && formApi.isDirty()}
            variant="primary"
            style={styles.submitButton}
          />
        </View>
      )}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    );
  }

  return content;
}

// Form section component for grouping related fields
export interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  containerStyle?: ViewStyle;
  collapsible?: boolean;
  initiallyCollapsed?: boolean;
}

export function FormSection({
  title,
  description,
  children,
  containerStyle,
  collapsible = false,
  initiallyCollapsed = false,
}: FormSectionProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(initiallyCollapsed);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <View style={[styles.sectionContainer, containerStyle]}>
      {title && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {collapsible && (
            <TouchableOpacity onPress={toggleCollapse}>
              <Icons.ChevronDown 
                size={20} 
                color={Colors.textMuted}
                style={[
                  styles.collapseIcon,
                  isCollapsed && styles.collapseIconRotated
                ]}
              />
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {description && (
        <Text style={styles.sectionDescription}>{description}</Text>
      )}
      
      {(!collapsible || !isCollapsed) && (
        <View style={styles.sectionContent}>
          {children}
        </View>
      )}
    </View>
  );
}

// Form field group for horizontal layouts
export interface FieldGroupProps {
  children: ReactNode;
  spacing?: 'small' | 'medium' | 'large';
  direction?: 'row' | 'column';
  containerStyle?: ViewStyle;
}

export function FieldGroup({
  children,
  spacing = 'medium',
  direction = 'column',
  containerStyle,
}: FieldGroupProps) {
  const getSpacing = () => {
    switch (spacing) {
      case 'small': return 8;
      case 'large': return 24;
      default: return 16;
    }
  };

  const groupStyle = [
    styles.fieldGroup,
    {
      flexDirection: direction,
      gap: getSpacing(),
    },
    containerStyle,
  ];

  return (
    <View style={groupStyle}>
      {children}
    </View>
  );
}

// Form validation summary component
export interface ValidationSummaryProps {
  formApi: ReturnType<typeof useFormValidation>;
  showWarnings?: boolean;
  containerStyle?: ViewStyle;
}

export function ValidationSummary({
  formApi,
  showWarnings = true,
  containerStyle,
}: ValidationSummaryProps) {
  const errors = formApi.getFormErrors();
  const hasWarnings = formApi.hasWarnings;

  if (errors.length === 0 && (!showWarnings || !hasWarnings)) {
    return null;
  }

  return (
    <View style={[styles.validationSummary, containerStyle]}>
      {errors.length > 0 && (
        <View style={styles.errorSection}>
          <View style={styles.summaryHeader}>
            <Icons.AlertCircle size={18} color={Colors.error} />
            <Text style={styles.summaryTitle}>Errors ({errors.length})</Text>
          </View>
          {errors.map((error, index) => (
            <Text key={index} style={styles.summaryError}>• {error}</Text>
          ))}
        </View>
      )}

      {showWarnings && hasWarnings && (
        <View style={styles.warningSection}>
          <View style={styles.summaryHeader}>
            <Icons.AlertTriangle size={18} color={Colors.warning} />
            <Text style={styles.summaryTitle}>Suggestions</Text>
          </View>
          {Object.values(formApi.formState.fields).map((field, index) => 
            field.warning ? (
              <Text key={index} style={styles.summaryWarning}>• {field.warning}</Text>
            ) : null
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  errorSummary: {
    backgroundColor: Colors.error + '10',
    borderColor: Colors.error + '30',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    flex: 1,
    lineHeight: 18,
  },
  fieldsContainer: {
    flex: 1,
  },
  submitContainer: {
    marginTop: 24,
  },
  submitButton: {
    // Default button styles will be applied
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  collapseIcon: {
    transform: [{ rotate: '0deg' }],
  },
  collapseIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  sectionContent: {
    // No additional styles needed
  },
  fieldGroup: {
    // Flexbox styles applied dynamically
  },
  validationSummary: {
    marginBottom: 20,
  },
  errorSection: {
    backgroundColor: Colors.error + '05',
    borderColor: Colors.error + '20',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  warningSection: {
    backgroundColor: Colors.warning + '05',
    borderColor: Colors.warning + '20',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryError: {
    fontSize: 12,
    color: Colors.error,
    marginBottom: 2,
    lineHeight: 16,
  },
  summaryWarning: {
    fontSize: 12,
    color: Colors.warning,
    marginBottom: 2,
    lineHeight: 16,
  },
});