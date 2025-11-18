type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: any;
}

class Logger {
  private isDevelopment = __DEV__;

  private formatMessage(level: LogLevel, message: string, context?: string, data?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.isDevelopment && level === 'debug') {
      return false;
    }
    return true;
  }

  debug(message: string, context?: string, data?: any): void {
    if (this.shouldLog('debug')) {
      const entry = this.formatMessage('debug', message, context, data);
      console.log(`[DEBUG] ${entry.timestamp} ${context ? `[${context}]` : ''} ${message}`, data || '');
    }
  }

  info(message: string, context?: string, data?: any): void {
    if (this.shouldLog('info')) {
      const entry = this.formatMessage('info', message, context, data);
      console.info(`[INFO] ${entry.timestamp} ${context ? `[${context}]` : ''} ${message}`, data || '');
    }
  }

  warn(message: string, context?: string, data?: any): void {
    if (this.shouldLog('warn')) {
      const entry = this.formatMessage('warn', message, context, data);
      console.warn(`[WARN] ${entry.timestamp} ${context ? `[${context}]` : ''} ${message}`, data || '');
    }
  }

  error(message: string, context?: string, data?: any): void {
    if (this.shouldLog('error')) {
      const entry = this.formatMessage('error', message, context, data);
      console.error(`[ERROR] ${entry.timestamp} ${context ? `[${context}]` : ''} ${message}`, data || '');
    }
  }
}

export const logger = new Logger();