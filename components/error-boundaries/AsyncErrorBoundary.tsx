import React, { ReactNode, Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/colors';
import * as Icons from 'lucide-react-native';

interface Props {
  children: ReactNode;
  onRetry?: () => void | Promise<void>;
  retryText?: string;
  fallbackComponent?: ReactNode;
}

interface State {
  hasError: boolean;
  isRetrying: boolean;
  error?: Error;
}

export class AsyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isRetrying: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AsyncErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = async () => {
    const { onRetry } = this.props;
    
    this.setState({ isRetrying: true });
    
    try {
      if (onRetry) {
        await onRetry();
      }
      
      // Reset error state after successful retry
      this.setState({ hasError: false, error: undefined, isRetrying: false });
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      this.setState({ isRetrying: false });
    }
  };

  render() {
    const { children, fallbackComponent, retryText = 'Try Again' } = this.props;
    const { hasError, isRetrying, error } = this.state;

    if (hasError) {
      if (fallbackComponent) {
        return fallbackComponent;
      }

      return (
        <View style={styles.container}>
          <Icons.Wifi size={48} color={Colors.textMuted} />
          <Text style={styles.title}>Connection Error</Text>
          <Text style={styles.message}>
            {error?.message || 'Something went wrong while loading data.'}
          </Text>
          
          <TouchableOpacity 
            style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]} 
            onPress={this.handleRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Icons.RefreshCw size={16} color={Colors.white} />
            )}
            <Text style={styles.retryText}>
              {isRetrying ? 'Retrying...' : retryText}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.helpText}>
            Check your internet connection and try again
          </Text>
        </View>
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  retryButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },
  retryText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});