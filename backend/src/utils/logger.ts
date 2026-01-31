import fs from 'fs';
import path from 'path';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG';
  user?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  message: string;
  error?: any;
}

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

class Logger {
  private logDir: string;
  private currentLogLevel: LogLevel;

  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.currentLogLevel = this.getLogLevel();
    this.ensureLogDirectory();
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    switch (level) {
      case 'DEBUG':
        return 'DEBUG';
      case 'INFO':
        return 'INFO';
      case 'WARN':
        return 'WARN';
      case 'ERROR':
        return 'ERROR';
      default:
        return 'INFO';
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const currentLevelIndex = levels.indexOf(this.currentLogLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFileName(): string {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return `${today}.log`;
  }

  private getLogFilePath(): string {
    return path.join(this.logDir, this.getLogFileName());
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = new Date().toISOString();
    const userInfo = entry.user ? `[User: ${entry.user}]` : '';
    const apiInfo =
      entry.method && entry.url ? `[${entry.method} ${entry.url}]` : '';
    const statusInfo = entry.statusCode ? `[Status: ${entry.statusCode}]` : '';
    const durationInfo = entry.duration
      ? `[Duration: ${entry.duration}ms]`
      : '';

    let logMessage =
      `[${timestamp}] [${entry.level}] ${userInfo} ${apiInfo} ${statusInfo} ${durationInfo} ${entry.message}`.trim();

    if (entry.error) {
      // Sanitize error objects to remove sensitive information
      const { sanitizeForLogging } = require('./sanitizeLogs');
      const sanitizedError = sanitizeForLogging(entry.error);
      logMessage += `\nError: ${JSON.stringify(sanitizedError, null, 2)}`;
    }

    return logMessage;
  }

  private writeToFile(message: string): void {
    const logFilePath = this.getLogFilePath();
    const logEntry = `${message}\n`;

    try {
      fs.appendFileSync(logFilePath, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private log(
    level: LogEntry['level'],
    message: string,
    options: Partial<LogEntry> = {}
  ): void {
    // Check if this log level should be output
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...options,
    };

    const formattedMessage = this.formatLogEntry(entry);

    // Write to file
    this.writeToFile(formattedMessage);

    // Also log to console for development
    if (process.env.NODE_ENV !== 'production') {
      console.log(formattedMessage);
    }
  }

  // API Access Logging
  public logApiAccess(
    user: string,
    method: string,
    url: string,
    statusCode: number,
    duration: number
  ): void {
    this.log('INFO', 'API Access', {
      user,
      method,
      url,
      statusCode,
      duration,
    });
  }

  // Error Logging
  public logError(
    message: string,
    error?: any,
    user?: string,
    method?: string,
    url?: string
  ): void {
    this.log('ERROR', message, {
      user,
      method,
      url,
      error,
    });
  }

  // Warning Logging
  public logWarning(
    message: string,
    user?: string,
    method?: string,
    url?: string
  ): void {
    this.log('WARN', message, {
      user,
      method,
      url,
    });
  }

  // Info Logging
  public logInfo(
    message: string,
    user?: string,
    method?: string,
    url?: string
  ): void {
    this.log('INFO', message, {
      user,
      method,
      url,
    });
  }

  // Debug Logging
  public logDebug(
    message: string,
    user?: string,
    method?: string,
    url?: string
  ): void {
    this.log('DEBUG', message, {
      user,
      method,
      url,
    });
  }

  // Database Operation Logging
  public logDatabaseOperation(
    operation: string,
    table: string,
    user?: string
  ): void {
    this.log('INFO', `Database ${operation} on ${table}`, { user });
  }

  // Authentication Logging
  public logAuth(
    action: 'login' | 'logout' | 'register' | 'token_verify',
    user: string,
    success: boolean
  ): void {
    this.log(
      'INFO',
      `Authentication ${action} ${success ? 'successful' : 'failed'}`,
      { user }
    );
  }

  // Get current log level
  public getCurrentLogLevel(): LogLevel {
    return this.currentLogLevel;
  }

  // Get log files list
  public getLogFiles(): string[] {
    try {
      return fs
        .readdirSync(this.logDir)
        .filter(file => file.endsWith('.log'))
        .sort()
        .reverse();
    } catch (error) {
      console.error('Failed to read log directory:', error);
      return [];
    }
  }

  // Read log file content
  public readLogFile(filename: string): string {
    try {
      const filePath = path.join(this.logDir, filename);
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error(`Failed to read log file ${filename}:`, error);
      return '';
    }
  }
}

export const logger = new Logger();
