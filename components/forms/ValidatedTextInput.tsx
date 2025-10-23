import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TextInputProps, 
  ViewStyle, 
  TouchableOpacity,
  ActivityIndicator 
} from 'react-native';
import { Colors } from '@/constants/colors';
import * as Icons from 'lucide-react-native';

export interface ValidatedTextInputProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur'> {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string | null;
  warning?: string | null;
  isValid?: boolean;
  isValidating?: boolean;
  required?: boolean;
  helpText?: string;
  leftIcon?: keyof typeof Icons;
  rightIcon?: keyof typeof Icons;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  showValidationIcon?: boolean;
  sanitize?: (text: string) => string;
  validateOnMount?: boolean;
}

export function ValidatedTextInput({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  warning,
  isValid = true,
  isValidating = false,
  required = false,
  helpText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  showValidationIcon = true,
  sanitize,
  validateOnMount = false,
  style,
  ...textInputProps
}: ValidatedTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasBeenFocused, setHasBeenFocused] = useState(false);

  const handleChangeText = (text: string) => {
    const sanitizedText = sanitize ? sanitize(text) : text;
    onChangeText(sanitizedText);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setHasBeenFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) {
      onBlur();
    }
  };

  const showError = error && (hasBeenFocused || validateOnMount);
  const showWarning = warning && !error && (hasBeenFocused || validateOnMount);
  const showSuccess = isValid && !error && !warning && (hasBeenFocused || validateOnMount) && value.length > 0;

  const getInputStyle = () => {
    const baseStyle = [styles.input, style];
    
    if (isFocused) {
      baseStyle.push(styles.inputFocused);
    }
    
    if (showError) {
      baseStyle.push(styles.inputError);
    } else if (showWarning) {
      baseStyle.push(styles.inputWarning);
    } else if (showSuccess) {
      baseStyle.push(styles.inputSuccess);
    }

    return baseStyle;
  };

  const getLabelStyle = () => {
    const baseStyle = [styles.label];
    
    if (required) {
      baseStyle.push(styles.labelRequired);
    }
    
    if (showError) {
      baseStyle.push(styles.labelError);
    }

    return baseStyle;
  };

  const LeftIcon = leftIcon ? (Icons as any)[leftIcon] : null;
  const RightIcon = rightIcon ? (Icons as any)[rightIcon] : null;

  const getValidationIcon = () => {
    if (isValidating) {
      return <ActivityIndicator size="small" color={Colors.primary} />;
    }
    
    if (showError) {
      return <Icons.AlertCircle size={20} color={Colors.error} />;
    }
    
    if (showWarning) {
      return <Icons.AlertTriangle size={20} color={Colors.warning} />;
    }
    
    if (showSuccess) {
      return <Icons.CheckCircle size={20} color={Colors.success} />;
    }
    
    return null;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={getLabelStyle()}>
            {label}
            {required && <Text style={styles.requiredAsterisk}> *</Text>}
          </Text>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        {LeftIcon && (
          <View style={styles.leftIconContainer}>
            <LeftIcon 
              size={20} 
              color={showError ? Colors.error : Colors.textMuted} 
            />
          </View>
        )}
        
        <TextInput
          {...textInputProps}
          style={getInputStyle()}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={Colors.textMuted}
        />
        
        <View style={styles.rightIconContainer}>
          {showValidationIcon && getValidationIcon()}
          
          {RightIcon && !isValidating && (
            <TouchableOpacity
              onPress={onRightIconPress}
              style={styles.rightIconButton}
              disabled={!onRightIconPress}
            >
              <RightIcon 
                size={20} 
                color={Colors.textMuted} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {showError && (
        <View style={styles.messageContainer}>
          <Icons.AlertCircle size={16} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {showWarning && (
        <View style={styles.messageContainer}>
          <Icons.AlertTriangle size={16} color={Colors.warning} />
          <Text style={styles.warningText}>{warning}</Text>
        </View>
      )}
      
      {helpText && !showError && !showWarning && (
        <Text style={styles.helpText}>{helpText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  labelRequired: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  labelError: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.error,
  },
  requiredAsterisk: {
    color: Colors.error,
    fontWeight: '700',
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    color: Colors.text,
    fontSize: 16,
    minHeight: 52,
  },
  inputFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '05',
  },
  inputWarning: {
    borderColor: Colors.warning,
    backgroundColor: Colors.warning + '05',
  },
  inputSuccess: {
    borderColor: Colors.success,
    backgroundColor: Colors.success + '05',
  },
  leftIconContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  rightIconContainer: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1,
  },
  rightIconButton: {
    padding: 2,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    flex: 1,
    lineHeight: 16,
  },
  warningText: {
    fontSize: 12,
    color: Colors.warning,
    flex: 1,
    lineHeight: 16,
  },
  helpText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
    lineHeight: 16,
  },
});

// Preset input components for common use cases
export function EmailInput(props: Omit<ValidatedTextInputProps, 'keyboardType' | 'autoCapitalize' | 'autoCorrect'>) {
  return (
    <ValidatedTextInput
      {...props}
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      leftIcon="Mail"
      placeholder="Enter your email address"
    />
  );
}

export function PasswordInput(props: Omit<ValidatedTextInputProps, 'secureTextEntry'>) {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <ValidatedTextInput
      {...props}
      secureTextEntry={!showPassword}
      leftIcon="Lock"
      rightIcon={showPassword ? "EyeOff" : "Eye"}
      onRightIconPress={() => setShowPassword(!showPassword)}
      placeholder="Enter your password"
    />
  );
}

export function PhoneInput(props: Omit<ValidatedTextInputProps, 'keyboardType'>) {
  return (
    <ValidatedTextInput
      {...props}
      keyboardType="phone-pad"
      leftIcon="Phone"
      placeholder="(555) 123-4567"
    />
  );
}

export function NameInput(props: Omit<ValidatedTextInputProps, 'autoCapitalize'>) {
  return (
    <ValidatedTextInput
      {...props}
      autoCapitalize="words"
      leftIcon="User"
      placeholder="Enter your name"
    />
  );
}

export function VINInput(props: Omit<ValidatedTextInputProps, 'autoCapitalize' | 'maxLength'>) {
  return (
    <ValidatedTextInput
      {...props}
      autoCapitalize="characters"
      maxLength={17}
      leftIcon="Car"
      placeholder="Enter VIN (17 characters)"
    />
  );
}