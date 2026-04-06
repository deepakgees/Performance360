/**
 * Unit tests for logger utility
 */

const mockAppendFileSync = jest.fn();
const mockExistsSync = jest.fn().mockReturnValue(true);
const mockMkdirSync = jest.fn();
const mockReaddirSync = jest.fn().mockReturnValue([]);
const mockReadFileSync = jest.fn().mockReturnValue('');

jest.mock('fs', () => ({
  appendFileSync: (...args: unknown[]) => mockAppendFileSync(...args),
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  mkdirSync: (...args: unknown[]) => mockMkdirSync(...args),
  readdirSync: (...args: unknown[]) => mockReaddirSync(...args),
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
}));

describe('logger', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalLogLevel = process.env.LOG_LEVEL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'INFO';
    mockExistsSync.mockReturnValue(true);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    process.env.LOG_LEVEL = originalLogLevel;
  });

  it('should log info and write to file', () => {
    const { logger } = require('./logger');
    logger.logInfo('Test message');
    expect(mockAppendFileSync).toHaveBeenCalled();
    expect(mockAppendFileSync.mock.calls[0][1]).toContain('Test message');
    expect(mockAppendFileSync.mock.calls[0][1]).toContain('INFO');
  });

  it('should log error with optional error object', () => {
    const { logger } = require('./logger');
    logger.logError('Error occurred', { code: 'ERR' });
    expect(mockAppendFileSync).toHaveBeenCalled();
    const content = mockAppendFileSync.mock.calls[0][1];
    expect(content).toContain('ERROR');
    expect(content).toContain('Error occurred');
  });

  it('should log warning', () => {
    const { logger } = require('./logger');
    logger.logWarning('Warning message');
    expect(mockAppendFileSync).toHaveBeenCalled();
    expect(mockAppendFileSync.mock.calls[0][1]).toContain('WARN');
  });

  it('should log API access', () => {
    const { logger } = require('./logger');
    logger.logApiAccess('user', 'GET', '/api/test', 200, 50);
    expect(mockAppendFileSync).toHaveBeenCalled();
    const content = mockAppendFileSync.mock.calls[0][1];
    expect(content).toContain('API Access');
    expect(content).toContain('200');
    expect(content).toContain('50');
  });

  it('should log auth action', () => {
    const { logger } = require('./logger');
    logger.logAuth('login', 'user@test.com', true);
    expect(mockAppendFileSync).toHaveBeenCalled();
    expect(mockAppendFileSync.mock.calls[0][1]).toContain('Authentication login successful');
  });

  it('should create log dir if not exists', () => {
    mockExistsSync.mockReturnValue(false);
    jest.isolateModules(() => {
      require('./logger');
      expect(mockMkdirSync).toHaveBeenCalledWith(expect.any(String), {
        recursive: true,
      });
    });
  });

  it('should respect LOG_LEVEL and not log DEBUG when INFO', () => {
    process.env.LOG_LEVEL = 'INFO';
    const { logger } = require('./logger');
    mockAppendFileSync.mockClear();
    logger.logDebug('Debug message');
    expect(mockAppendFileSync).not.toHaveBeenCalled();
  });

  it('should log when LOG_LEVEL is DEBUG', () => {
    process.env.LOG_LEVEL = 'DEBUG';
    jest.isolateModules(() => {
      const { logger } = require('./logger');
      mockAppendFileSync.mockClear();
      logger.logDebug('Debug message');
      expect(mockAppendFileSync).toHaveBeenCalled();
      expect(mockAppendFileSync.mock.calls[0][1]).toContain('DEBUG');
    });
  });

  it('should default to INFO for invalid LOG_LEVEL', () => {
    process.env.LOG_LEVEL = 'INVALID';
    jest.isolateModules(() => {
      const { logger } = require('./logger');
      expect(logger.getCurrentLogLevel()).toBe('INFO');
    });
  });

  it('should set LOG_LEVEL to ERROR when LOG_LEVEL is ERROR', () => {
    process.env.LOG_LEVEL = 'ERROR';
    jest.isolateModules(() => {
      const { logger } = require('./logger');
      expect(logger.getCurrentLogLevel()).toBe('ERROR');
    });
  });

  it('should respect LOG_LEVEL WARN and not log INFO', () => {
    process.env.LOG_LEVEL = 'WARN';
    jest.isolateModules(() => {
      const { logger } = require('./logger');
      mockAppendFileSync.mockClear();
      logger.logInfo('Info message');
      expect(mockAppendFileSync).not.toHaveBeenCalled();
    });
  });

  it('should log database operation', () => {
    const { logger } = require('./logger');
    mockAppendFileSync.mockClear();
    logger.logDatabaseOperation('create', 'User', 'admin@test.com');
    expect(mockAppendFileSync).toHaveBeenCalled();
    expect(mockAppendFileSync.mock.calls[0][1]).toContain('Database create on User');
  });

  it('should handle writeToFile when appendFileSync throws', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockAppendFileSync.mockImplementation(() => {
      throw new Error('Disk full');
    });
    const { logger } = require('./logger');
    logger.logInfo('Test');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to write to log file:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('getLogFiles should return sorted log files', () => {
    mockReaddirSync.mockReturnValue(['2024-01-02.log', '2024-01-01.log', 'other.txt']);
    const { logger } = require('./logger');
    const files = logger.getLogFiles();
    expect(files).toEqual(['2024-01-02.log', '2024-01-01.log']);
  });

  it('readLogFile should return file content', () => {
    mockReadFileSync.mockReturnValue('log content');
    const { logger } = require('./logger');
    const content = logger.readLogFile('2024-01-01.log');
    expect(content).toBe('log content');
  });

});
