import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import * as Icons from 'lucide-react-native';

interface LoadingStateProps {
  isLoading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  emptyIcon?: keyof typeof Icons;
  loadingMessage?: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function LoadingState({
  isLoading = false,
  error = null,
  empty = false,
  emptyMessage = 'No data available',
  emptyIcon = 'Inbox',
  loadingMessage = 'Loading...',
  size = 'medium',
  style,
  children,
}: LoadingStateProps) {
  const getLoadingSize = () => {
    switch (size) {
      case 'small': return 20;
      case 'large': return 48;
      default: return 32;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 32;
      case 'large': return 80;
      default: return 48;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size={getLoadingSize()} color={Colors.primary} />
        <Text style={[styles.loadingText, size === 'small' && styles.smallText]}>
          {loadingMessage}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Icons.AlertCircle size={getIconSize()} color={Colors.error} />
        <Text style={[styles.errorTitle, size === 'small' && styles.smallTitle]}>
          Something went wrong
        </Text>
        <Text style={[styles.errorText, size === 'small' && styles.smallText]}>
          {error}
        </Text>
      </View>
    );
  }

  if (empty) {
    const EmptyIcon = Icons[emptyIcon] as React.ComponentType<{ size: number; color: string }>;
    
    return (
      <View style={[styles.container, styles.emptyContainer, style]}>
        <EmptyIcon size={getIconSize()} color={Colors.textMuted} />
        <Text style={[styles.emptyText, size === 'small' && styles.smallText]}>
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
}

export function LoadingOverlay({ 
  visible, 
  message = 'Loading...', 
  transparent = false 
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <View style={[
      styles.overlay, 
      transparent ? styles.transparentOverlay : styles.solidOverlay
    ]}>
      <View style={styles.overlayContent}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.overlayText}>{message}</Text>
      </View>
    </View>
  );
}

interface LoadingButtonProps {
  isLoading: boolean;
  title: string;
  loadingTitle?: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
}

export function LoadingButton({
  isLoading,
  title,
  loadingTitle,
  onPress,
  disabled = false,
  style,
  variant = 'primary',
  size = 'medium',
}: LoadingButtonProps) {
  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    if (variant === 'primary') {
      baseStyle.push(styles.primaryButton);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.secondaryButton);
    } else {
      baseStyle.push(styles.outlineButton);
    }

    if (size === 'small') {
      baseStyle.push(styles.smallButton);
    } else if (size === 'large') {
      baseStyle.push(styles.largeButton);
    }

    if (isLoading || disabled) {
      baseStyle.push(styles.disabledButton);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText];
    
    if (variant === 'primary') {
      baseStyle.push(styles.primaryButtonText);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.secondaryButtonText);
    } else {
      baseStyle.push(styles.outlineButtonText);
    }

    if (size === 'small') {
      baseStyle.push(styles.smallButtonText);
    } else if (size === 'large') {
      baseStyle.push(styles.largeButtonText);
    }

    return baseStyle;
  };

  const getSpinnerSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 24;
      default: return 20;
    }
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={isLoading || disabled}
    >
      {isLoading && (
        <ActivityIndicator 
          size={getSpinnerSize()} 
          color={variant === 'primary' ? Colors.white : Colors.primary} 
          style={styles.buttonSpinner}
        />
      )}
      <Text style={getTextStyle()}>
        {isLoading && loadingTitle ? loadingTitle : title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingContainer: {
    gap: 12,
  },
  errorContainer: {
    gap: 12,
  },
  emptyContainer: {
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  smallText: {
    fontSize: 12,
  },
  smallTitle: {
    fontSize: 14,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  transparentOverlay: {
    backgroundColor: 'transparent',
  },
  solidOverlay: {
    backgroundColor: Colors.background + 'E6', // 90% opacity
  },
  overlayContent: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    minWidth: 120,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  overlayText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disabledButton: {
    opacity: 0.6,
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButtonText: {
    color: Colors.white,
  },
  secondaryButtonText: {
    color: Colors.text,
  },
  outlineButtonText: {
    color: Colors.primary,
  },
  smallButtonText: {
    fontSize: 14,
  },
  largeButtonText: {
    fontSize: 18,
  },
  buttonSpinner: {
    marginRight: 4,
  },
});