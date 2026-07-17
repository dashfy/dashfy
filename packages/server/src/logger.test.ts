import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { createLogger } from './logger'

describe('createLogger', () => {
  const originalEnv = process.env
  const originalMaxListeners = process.getMaxListeners()

  beforeAll(() => {
    // Increase max listeners to prevent warnings when creating many logger instances
    process.setMaxListeners(150)
  })

  afterAll(() => {
    // Restore original max listeners after all tests complete
    process.setMaxListeners(originalMaxListeners)
  })

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    // Restore original environment after each test
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('Environment Configuration', () => {
    it('should create logger with info level in development by default', () => {
      process.env.NODE_ENV = 'development'
      delete process.env.LOG_LEVEL

      const logger = createLogger()

      expect(logger.level).toBe('info')
    })

    it('should create logger with warn level in production by default', () => {
      process.env.NODE_ENV = 'production'
      delete process.env.LOG_LEVEL

      const logger = createLogger()

      expect(logger.level).toBe('warn')
    })

    it('should create logger with info level when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV
      delete process.env.LOG_LEVEL

      const logger = createLogger()

      expect(logger.level).toBe('info')
    })

    it('should respect LOG_LEVEL environment variable over default', () => {
      process.env.NODE_ENV = 'production'
      process.env.LOG_LEVEL = 'debug'

      const logger = createLogger()

      expect(logger.level).toBe('debug')
    })

    it('should respect LOG_LEVEL environment variable in development', () => {
      process.env.NODE_ENV = 'development'
      process.env.LOG_LEVEL = 'error'

      const logger = createLogger()

      expect(logger.level).toBe('error')
    })
  })

  describe('Custom Options', () => {
    it('should accept custom log level via options', () => {
      process.env.NODE_ENV = 'production'
      delete process.env.LOG_LEVEL

      const logger = createLogger({ level: 'trace' })

      expect(logger.level).toBe('trace')
    })

    it('should merge custom options with defaults', () => {
      const logger = createLogger({
        level: 'debug',
        base: { service: 'test-service' },
      })

      expect(logger.level).toBe('debug')
      // Note: base field is set during logger creation
    })

    it('should allow overriding base fields', () => {
      const logger = createLogger({
        base: { pid: 12345, hostname: 'test-host' },
      })

      // Logger should be created without errors
      expect(logger).toBeDefined()
      expect(logger.level).toBeDefined()
    })
  })

  describe('Logger Methods', () => {
    it('should have all standard Pino log methods', () => {
      const logger = createLogger()

      expect(typeof logger.trace).toBe('function')
      expect(typeof logger.debug).toBe('function')
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.fatal).toBe('function')
    })

    it('should have child method for creating child loggers', () => {
      const logger = createLogger()

      expect(typeof logger.child).toBe('function')

      const childLogger = logger.child({ component: 'test' })
      expect(childLogger).toBeDefined()
      expect(typeof childLogger.info).toBe('function')
    })

    it('should log messages at appropriate levels', () => {
      process.env.LOG_LEVEL = 'info'
      const logger = createLogger()

      // These should not throw errors
      expect(() => logger.info('Test info message')).not.toThrow()
      expect(() => logger.warn('Test warn message')).not.toThrow()
      expect(() => logger.error('Test error message')).not.toThrow()
    })

    it('should log objects with messages', () => {
      const logger = createLogger()

      // Should not throw when logging objects
      expect(() => {
        logger.info({ key: 'value' }, 'Message with object')
      }).not.toThrow()

      expect(() => {
        logger.error({ err: new Error('Test error') }, 'Error with object')
      }).not.toThrow()
    })
  })

  describe('Log Level Filtering', () => {
    it('should not log debug messages when level is info', () => {
      process.env.LOG_LEVEL = 'info'
      const logger = createLogger()

      // Debug is below info, so it should be filtered
      expect(logger.isLevelEnabled('debug')).toBe(false)
      expect(logger.isLevelEnabled('info')).toBe(true)
      expect(logger.isLevelEnabled('warn')).toBe(true)
    })

    it('should only log error and above when level is error', () => {
      process.env.LOG_LEVEL = 'error'
      const logger = createLogger()

      expect(logger.isLevelEnabled('debug')).toBe(false)
      expect(logger.isLevelEnabled('info')).toBe(false)
      expect(logger.isLevelEnabled('warn')).toBe(false)
      expect(logger.isLevelEnabled('error')).toBe(true)
      expect(logger.isLevelEnabled('fatal')).toBe(true)
    })

    it('should log all levels when level is trace', () => {
      process.env.LOG_LEVEL = 'trace'
      const logger = createLogger()

      expect(logger.isLevelEnabled('trace')).toBe(true)
      expect(logger.isLevelEnabled('debug')).toBe(true)
      expect(logger.isLevelEnabled('info')).toBe(true)
      expect(logger.isLevelEnabled('warn')).toBe(true)
      expect(logger.isLevelEnabled('error')).toBe(true)
      expect(logger.isLevelEnabled('fatal')).toBe(true)
    })
  })

  describe('Child Loggers', () => {
    it('should create child logger with inherited level', () => {
      process.env.LOG_LEVEL = 'warn'
      const parentLogger = createLogger()
      const childLogger = parentLogger.child({ component: 'test' })

      expect(childLogger.level).toBe(parentLogger.level)
    })

    it('should create child logger with additional context', () => {
      const logger = createLogger()
      const childLogger = logger.child({ component: 'bus', id: '123' })

      // Should not throw when logging with child logger
      expect(() => {
        childLogger.info('Child logger message')
      }).not.toThrow()
    })

    it('should allow multiple levels of child loggers', () => {
      const rootLogger = createLogger()
      const childLogger = rootLogger.child({ component: 'dashfy' })
      const grandchildLogger = childLogger.child({ subcomponent: 'api' })

      expect(grandchildLogger).toBeDefined()
      expect(typeof grandchildLogger.info).toBe('function')
    })
  })

  describe('Production vs Development', () => {
    it('should configure transport for development', () => {
      // Temporarily clear LOG_LEVEL to test default behavior
      const originalLogLevel = process.env.LOG_LEVEL
      delete process.env.LOG_LEVEL

      process.env.NODE_ENV = 'development'
      const logger = createLogger()

      // Logger should be created successfully with transport
      expect(logger).toBeDefined()
      expect(logger.level).toBe('info')

      // Restore LOG_LEVEL
      if (originalLogLevel) {
        process.env.LOG_LEVEL = originalLogLevel
      }
    })

    it('should not configure transport for production', () => {
      // Temporarily clear LOG_LEVEL to test default behavior
      const originalLogLevel = process.env.LOG_LEVEL
      delete process.env.LOG_LEVEL

      process.env.NODE_ENV = 'production'
      const logger = createLogger()

      // Logger should be created successfully without transport
      expect(logger).toBeDefined()
      expect(logger.level).toBe('warn')

      // Restore LOG_LEVEL
      if (originalLogLevel) {
        process.env.LOG_LEVEL = originalLogLevel
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty options object', () => {
      const logger = createLogger({})

      expect(logger).toBeDefined()
      expect(logger.level).toBeDefined()
    })

    it('should handle undefined options', () => {
      const logger = createLogger(undefined)

      expect(logger).toBeDefined()
      expect(logger.level).toBeDefined()
    })

    it('should throw error for invalid log level', () => {
      // Pino throws an error for invalid log levels
      process.env.LOG_LEVEL = 'invalid-level'

      expect(() => {
        createLogger()
      }).toThrow('default level:invalid-level must be included in custom levels')
    })

    it('should handle multiple logger instances', () => {
      const logger1 = createLogger({ level: 'info' })
      const logger2 = createLogger({ level: 'debug' })

      expect(logger1.level).toBe('info')
      expect(logger2.level).toBe('debug')
      expect(logger1).not.toBe(logger2)
    })

    it('should allow changing log level after creation', () => {
      const logger = createLogger({ level: 'info' })

      expect(logger.level).toBe('info')

      // Change log level
      logger.level = 'debug'

      expect(logger.level).toBe('debug')
    })
  })

  describe('Integration Scenarios', () => {
    it('should work with Dashfy server logger', () => {
      const logger = createLogger()
      const busLogger = logger.child({ component: 'bus' })
      const dashfyLogger = logger.child({ component: 'dashfy' })

      expect(busLogger).toBeDefined()
      expect(dashfyLogger).toBeDefined()

      // Should not throw
      expect(() => {
        busLogger.info('Bus message')
        dashfyLogger.info('Dashfy message')
      }).not.toThrow()
    })

    it('should handle error objects correctly', () => {
      const logger = createLogger()
      const error = new Error('Test error')
      error.stack = 'Error: Test error\n    at Test'

      expect(() => {
        logger.error({ err: error }, 'Error occurred')
      }).not.toThrow()
    })

    it('should handle complex objects', () => {
      const logger = createLogger()
      const complexObject = {
        user: { id: 1, name: 'Test User' },
        timestamp: new Date().toISOString(),
        data: [1, 2, 3],
        nested: { deep: { value: 'test' } },
      }

      expect(() => {
        logger.info(complexObject, 'Complex object logged')
      }).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('should create logger instances quickly', () => {
      // Use production mode to avoid pino-pretty overhead
      process.env.NODE_ENV = 'production'

      const startTime = performance.now()

      for (let i = 0; i < 100; i++) {
        createLogger()
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      // Creating 100 loggers in production mode should be reasonably fast
      // Allow up to 3 seconds to account for slower CI environments
      expect(duration).toBeLessThan(3000)
    })

    it('should handle rapid logging without errors', () => {
      const logger = createLogger({ level: 'silent' }) // Silent to avoid console spam

      expect(() => {
        for (let i = 0; i < 1000; i++) {
          logger.info(`Message ${i}`)
        }
      }).not.toThrow()
    })
  })
})
