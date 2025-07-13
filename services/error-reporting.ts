import { logger } from '@/utils/logger';

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  level: 'info' | 'warn' | 'error' | 'fatal';
  context: string;
  timestamp: string;
  userId?: string;
  userAgent?: string;
  appVersion?: string;
  platform?: string;
  additional?: Record<string, any>;
}

export interface ErrorReportingConfig {
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  maxReports: number;
  retryAttempts: number;
  reportingLevel: 'error' | 'warn' | 'info';
}

class ErrorReportingService {
  private config: ErrorReportingConfig;
  private reportQueue: ErrorReport[] = [];
  private isProcessingQueue = false;

  constructor(config: Partial<ErrorReportingConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      maxReports: 100,
      retryAttempts: 3,
      reportingLevel: 'error',
      ...config,
    };
  }

  updateConfig(newConfig: Partial<ErrorReportingConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  async reportError(
    error: Error,
    context: string,
    level: 'info' | 'warn' | 'error' | 'fatal' = 'error',
    additional?: Record<string, any>
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Check if we should report this level
    if (!this.shouldReportLevel(level)) {
      return;
    }

    const report: ErrorReport = {
      id: this.generateReportId(),
      message: error.message,
      stack: error.stack,
      level,
      context,
      timestamp: new Date().toISOString(),
      userAgent: this.getUserAgent(),
      appVersion: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
      platform: this.getPlatform(),
      additional,
    };

    // Add to queue
    this.addToQueue(report);

    // Process queue
    this.processQueue();
  }

  async reportCustomError(
    message: string,
    context: string,
    level: 'info' | 'warn' | 'error' | 'fatal' = 'error',
    additional?: Record<string, any>
  ): Promise<void> {
    const error = new Error(message);
    await this.reportError(error, context, level, additional);
  }

  private shouldReportLevel(level: string): boolean {
    const levels = ['info', 'warn', 'error', 'fatal'];
    const reportingLevelIndex = levels.indexOf(this.config.reportingLevel);
    const currentLevelIndex = levels.indexOf(level);
    return currentLevelIndex >= reportingLevelIndex;
  }

  private addToQueue(report: ErrorReport): void {
    this.reportQueue.push(report);

    // Limit queue size
    if (this.reportQueue.length > this.config.maxReports) {
      this.reportQueue.shift(); // Remove oldest report
    }

    // Log locally
    logger[report.level](`Error Report Queued:`, {
      id: report.id,
      message: report.message,
      context: report.context,
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.reportQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.reportQueue.length > 0) {
      const report = this.reportQueue.shift();
      if (report) {
        await this.sendReport(report);
      }
    }

    this.isProcessingQueue = false;
  }

  private async sendReport(report: ErrorReport): Promise<void> {
    let attempts = 0;
    
    while (attempts < this.config.retryAttempts) {
      try {
        await this.performSend(report);
        logger.info(`Error report sent successfully:`, { id: report.id });
        return;
      } catch (error) {
        attempts++;
        logger.warn(`Failed to send error report (attempt ${attempts}):`, {
          id: report.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        if (attempts < this.config.retryAttempts) {
          // Exponential backoff
          await this.delay(Math.pow(2, attempts) * 1000);
        }
      }
    }

    logger.error(`Failed to send error report after ${this.config.retryAttempts} attempts:`, {
      id: report.id,
    });
  }

  private async performSend(report: ErrorReport): Promise<void> {
    // In a real app, this would send to a crash reporting service
    // Examples: Sentry, Bugsnag, LogRocket, custom endpoint
    
    if (this.config.endpoint) {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify(report),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } else {
      // For development/testing, just log the report
      console.log('Error Report (would be sent to service):', report);
    }
  }

  private generateReportId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserAgent(): string {
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
      return navigator.userAgent;
    }
    return 'React Native App';
  }

  private getPlatform(): string {
    // In React Native, you'd import Platform from 'react-native'
    if (typeof window !== 'undefined') {
      return 'web';
    }
    return 'mobile';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility methods
  getQueueStatus() {
    return {
      queueSize: this.reportQueue.length,
      isProcessing: this.isProcessingQueue,
      config: this.config,
    };
  }

  clearQueue() {
    this.reportQueue = [];
  }

  // Integration with React Error Boundaries
  createErrorHandler(context: string) {
    return (error: Error, errorInfo?: React.ErrorInfo) => {
      this.reportError(error, context, 'error', {
        componentStack: errorInfo?.componentStack,
      });
    };
  }
}

// Export singleton instance
export const errorReporting = new ErrorReportingService();

// Export convenience functions
export const reportError = errorReporting.reportError.bind(errorReporting);
export const reportCustomError = errorReporting.reportCustomError.bind(errorReporting);
export const createErrorHandler = errorReporting.createErrorHandler.bind(errorReporting);