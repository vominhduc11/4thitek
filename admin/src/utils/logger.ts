type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogConfig {
  enabledLevels: LogLevel[];
  isDevelopment: boolean;
}

class Logger {
  private config: LogConfig;

  constructor() {
    this.config = {
      enabledLevels: import.meta.env.DEV
        ? ['error', 'warn', 'info', 'debug']
        : ['error', 'warn'],
      isDevelopment: import.meta.env.DEV
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return this.config.enabledLevels.includes(level);
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (data) {
      return `${prefix} ${message}\n${JSON.stringify(data, null, 2)}`;
    }
    return `${prefix} ${message}`;
  }

  error(message: string, error?: unknown): void {
    if (!this.shouldLog('error')) return;

    if (error instanceof Error) {
      console.error(this.formatMessage('error', message), error);
    } else if (error) {
      console.error(this.formatMessage('error', message, error));
    } else {
      console.error(this.formatMessage('error', message));
    }
  }

  warn(message: string, data?: unknown): void {
    if (!this.shouldLog('warn')) return;
    console.warn(this.formatMessage('warn', message, data));
  }

  info(message: string, data?: unknown): void {
    if (!this.shouldLog('info')) return;
    console.info(this.formatMessage('info', message, data));
  }

  debug(message: string, data?: unknown): void {
    if (!this.shouldLog('debug')) return;
    console.debug(this.formatMessage('debug', message, data));
  }

  // API specific loggers
  apiRequest(method: string, url: string, data?: unknown): void {
    this.debug(`API ${method} ${url}`, data);
  }

  apiResponse(method: string, url: string, status: number, data?: unknown): void {
    this.debug(`API ${method} ${url} - ${status}`, data);
  }

  apiError(method: string, url: string, error: unknown): void {
    this.error(`API ${method} ${url} failed`, error);
  }
}

export const logger = new Logger();
