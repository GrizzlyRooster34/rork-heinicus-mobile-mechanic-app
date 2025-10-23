import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import { Colors } from '@/constants/colors';
import { logger } from '@/utils/logger';
import * as Icons from 'lucide-react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'app' | 'screen' | 'component';
  resetOnPropsChange?: boolean;
  resetKeys?: (string | number)[];
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private prevResetKeys: (string | number)[] = [];

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      errorId: this.generateErrorId()
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error,
      errorId: ErrorBoundary.generateErrorId()
    };
  }

  static generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateErrorId(): string {
    return ErrorBoundary.generateErrorId();
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when resetKeys change
    if (hasError && resetKeys) {
      const hasResetKeyChanged = resetKeys.some((resetKey, index) => 
        prevProps.resetKeys?.[index] !== resetKey
      );
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }

    // Reset error boundary when props change (if enabled)
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError, level = 'component' } = this.props;

    // Log error with additional context
    logger.error(
      'ErrorBoundary caught an error',
      'ErrorBoundary',
      {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        level,
        errorId: this.state.errorId,
        timestamp: new Date().toISOString()
      }
    );

    // Update state with error info
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Report to crash analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // In a real app, this would send to crash reporting service (Sentry, Bugsnag, etc.)
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        level: this.props.level,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };
      
      // Could send to analytics service here
      console.error('Error Report:', errorReport);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private resetErrorBoundary = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: this.generateErrorId()
    });
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  handleShareError = async () => {
    if (!this.state.error) return;

    const errorDetails = `Error ID: ${this.state.errorId}
Error: ${this.state.error.message}
Level: ${this.props.level || 'component'}
Time: ${new Date().toLocaleString()}

App: Heinicus Mobile Mechanic
Version: ${process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0'}`;

    try {
      await Share.share({
        message: errorDetails,
        title: 'App Error Report',
      });
    } catch (error) {
      console.error('Failed to share error details:', error);
    }
  };

  handleShowDetails = () => {
    if (!this.state.error) return;

    const details = `Error ID: ${this.state.errorId}
Message: ${this.state.error.message}
Stack: ${this.state.error.stack?.split('\n').slice(0, 5).join('\n')}`;

    Alert.alert(
      'Error Details',
      details,
      [
        { text: 'Copy Error ID', onPress: () => this.copyErrorId() },
        { text: 'Share Report', onPress: this.handleShareError },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  copyErrorId = () => {
    // In a real app, would copy to clipboard
    Alert.alert('Error ID Copied', this.state.errorId);
  };

  getLevelConfig = (level: string) => {
    switch (level) {
      case 'app':
        return {
          title: 'Application Error',
          message: 'The application encountered a critical error. Please restart the app.',
          helpText: 'If this persists, please contact support with the error ID above.',
        };
      case 'screen':
        return {
          title: 'Screen Error',
          message: 'This screen encountered an error. Please try again or navigate to a different screen.',
          helpText: 'If this screen continues to fail, try restarting the app.',
        };
      case 'component':
      default:
        return {
          title: 'Component Error',
          message: 'A component encountered an error. This feature may not work properly.',
          helpText: 'If this persists, the feature may need server configuration.',
        };
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level = 'component' } = this.props;
      const levelConfig = this.getLevelConfig(level);

      return (
        <View style={styles.container}>
          <Icons.AlertTriangle size={64} color={Colors.error} />
          <Text style={styles.title}>{levelConfig.title}</Text>
          <Text style={styles.message}>
            {levelConfig.message}
          </Text>
          
          {this.state.error && (
            <View style={styles.errorDetails}>
              <Text style={styles.errorTitle}>Error Details:</Text>
              <Text style={styles.errorText}>{this.state.error.message}</Text>
              <TouchableOpacity 
                style={styles.detailsButton} 
                onPress={this.handleShowDetails}
              >
                <Text style={styles.detailsButtonText}>Show More Details</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.errorId}>Error ID: {this.state.errorId}</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Icons.RefreshCw size={20} color={Colors.white} />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareButton} onPress={this.handleShareError}>
              <Icons.Share size={20} color={Colors.primary} />
              <Text style={styles.shareText}>Share Report</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.helpText}>
            {levelConfig.helpText}
          </Text>
        </View>
      );
    }

    return this.props.children;
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
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  errorDetails: {
    backgroundColor: Colors.error + '10',
    borderColor: Colors.error + '30',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    width: '100%',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    fontFamily: 'monospace',
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
  retryText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  errorId: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: Colors.primary,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  shareText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  detailsButton: {
    marginTop: 8,
    paddingVertical: 4,
  },
  detailsButtonText: {
    fontSize: 12,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});