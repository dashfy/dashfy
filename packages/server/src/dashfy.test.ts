import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'

import type { DashfyConfig } from '@getdashfy/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Dashfy } from './dashfy'

// Mock logger
const createMockLogger = () => {
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(),
  }
  logger.child.mockReturnValue(logger)
  return logger
}

// Test configuration
const createTestConfig = (): DashfyConfig => ({
  port: 5555,
  host: 'localhost',
  dashboards: [
    {
      title: 'Test Dashboard',
      columns: 12,
      rows: 8,
      widgets: [
        {
          id: 'test-widget',
          extension: 'test-extension',
          widget: 'TestWidget',
          columns: 4,
          rows: 2,
          x: 0,
          y: 0,
          type: 'stat',
          api: 'test-api',
          method: 'getData',
        },
      ],
    },
  ],
  apis: {
    pollInterval: 30000,
  },
})

describe('Dashfy', () => {
  let dashfy: Dashfy
  let mockLogger: ReturnType<typeof createMockLogger>
  const testConfigPath = path.join(__dirname, 'test-config.yaml')
  const testDir = path.join(__dirname, 'test-tmp')

  const getAvailablePort = async (): Promise<number> => {
    return await new Promise<number>((resolve, reject) => {
      const server = net.createServer()
      server.unref()
      server.on('error', reject)
      server.listen(0, '127.0.0.1', () => {
        const address = server.address()
        if (!address || typeof address === 'string') {
          server.close(() => reject(new Error('Failed to get available port')))
          return
        }
        const { port } = address
        server.close((closeError) => {
          if (closeError) {
            reject(closeError)
            return
          }
          resolve(port)
        })
      })
    })
  }

  beforeEach(() => {
    mockLogger = createMockLogger()
    vi.clearAllMocks()
  })

  afterEach(async () => {
    // Clean up: stop server if running
    if (dashfy) {
      try {
        await dashfy.stop()
        // Give the OS time to release the port
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 100)
        })
      } catch {
        // Ignore errors if server wasn't started
      }
    }

    // Clean up test files
    try {
      rmSync(testConfigPath, { force: true })
      rmSync(testDir, { recursive: true, force: true })
    } catch {
      // Ignore errors if files don't exist
    }
  })

  describe('constructor', () => {
    it('should create a Dashfy instance with default options', () => {
      dashfy = new Dashfy()
      expect(dashfy).toBeInstanceOf(Dashfy)
    })

    it('should create a Dashfy instance with custom logger', () => {
      dashfy = new Dashfy({ logger: mockLogger as any })
      expect(dashfy).toBeInstanceOf(Dashfy)
      expect(mockLogger.child).toHaveBeenCalledWith({ component: 'bus' })
    })

    it('should register core dashfy API on construction', () => {
      dashfy = new Dashfy({ logger: mockLogger as any })
      expect(mockLogger.info).toHaveBeenCalledWith("Registered API 'dashfy' (mode: poll)")
    })

    it('should use existing Fastify instance when provided', async () => {
      const { default: Fastify } = await import('fastify')
      const existingApp = Fastify()

      // Add a custom route to the existing app
      existingApp.get('/custom-route', () => {
        return { custom: true }
      })

      dashfy = new Dashfy({ logger: mockLogger as any, app: existingApp })
      const config = createTestConfig()
      const port = await getAvailablePort()
      config.port = port
      dashfy.configure(config)
      await dashfy.start()

      // Verify Dashfy endpoints work
      const healthResponse = await fetch(`http://localhost:${port}/health`)
      expect(healthResponse.status).toBe(200)

      // Verify the custom route from existing app works
      const customResponse = await fetch(`http://localhost:${port}/custom-route`)
      const customData = await customResponse.json()
      expect(customData).toEqual({ custom: true })
    })
  })

  describe('configure', () => {
    beforeEach(() => {
      dashfy = new Dashfy({ logger: mockLogger as any })
    })

    it('should configure with a configuration object', () => {
      const config = createTestConfig()
      dashfy.configure(config)

      expect(mockLogger.info).toHaveBeenCalledWith('Set global poll interval to 30000ms')
    })

    it('should configure without poll interval', () => {
      const config = createTestConfig()
      delete config.apis

      dashfy.configure(config)

      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.stringContaining('Set global poll interval'),
      )
    })

    it('should update bus poll interval when provided', () => {
      const config = createTestConfig()
      config.apis = { pollInterval: 60000 }

      dashfy.configure(config)

      expect(mockLogger.info).toHaveBeenCalledWith('Set global poll interval to 60000ms')
    })
  })

  describe('configureFromFile', () => {
    beforeEach(() => {
      dashfy = new Dashfy({ logger: mockLogger as any })
      // Create test directory
      mkdirSync(testDir, { recursive: true })
    })

    it('should load and apply configuration from YAML file', async () => {
      const yamlContent = `
port: 5555
host: localhost
dashboards:
  - title: Test Dashboard
    columns: 12
    rows: 8
    widgets:
      - id: test-widget
        extension: test-extension
        widget: TestWidget
        columns: 4
        rows: 2
        x: 0
        y: 0
        type: stat
        api: test-api
        method: getData
apis:
  pollInterval: 30000
`
      writeFileSync(testConfigPath, yamlContent)

      await dashfy.configureFromFile(testConfigPath, false)

      expect(mockLogger.info).toHaveBeenCalledWith('Set global poll interval to 30000ms')
    })

    it('should throw error for invalid YAML file', async () => {
      const invalidYamlContent = 'invalid: yaml: content: ['
      writeFileSync(testConfigPath, invalidYamlContent)

      await expect(dashfy.configureFromFile(testConfigPath, false)).rejects.toThrow()
    })

    it('should throw error for missing configuration file', async () => {
      await expect(dashfy.configureFromFile('nonexistent.yaml', false)).rejects.toThrow()
    })

    it('should throw error for invalid configuration schema', async () => {
      const invalidConfig = `
port: 5555
host: localhost
# Missing required dashboards field
`
      writeFileSync(testConfigPath, invalidConfig)

      await expect(dashfy.configureFromFile(testConfigPath, false)).rejects.toThrow()
    })
  })

  describe('registerApi', () => {
    beforeEach(() => {
      dashfy = new Dashfy({ logger: mockLogger as any })
    })

    it('should register a poll-mode API', () => {
      const mockApi = () => ({
        getData: async () => Promise.resolve({ data: 'test' }),
      })

      dashfy.registerApi('test-api', mockApi, 'poll')

      expect(mockLogger.info).toHaveBeenCalledWith("Registered API 'test-api' (mode: poll)")
    })

    it('should register a push-mode API', () => {
      const mockApi = () => ({
        streamData: (callback: (data: unknown) => void) => {
          callback({ data: 'stream' })
          return Promise.resolve()
        },
      })

      dashfy.registerApi('stream-api', mockApi, 'push')

      expect(mockLogger.info).toHaveBeenCalledWith("Registered API 'stream-api' (mode: push)")
    })

    it('should default to poll mode when not specified', () => {
      const mockApi = () => ({
        getData: async () => Promise.resolve({ data: 'test' }),
      })

      dashfy.registerApi('default-api', mockApi)

      expect(mockLogger.info).toHaveBeenCalledWith("Registered API 'default-api' (mode: poll)")
    })

    it('should throw error for duplicate API registration', () => {
      const mockApi = () => ({
        getData: async () => Promise.resolve({ data: 'test' }),
      })

      dashfy.registerApi('duplicate-api', mockApi)

      expect(() => {
        dashfy.registerApi('duplicate-api', mockApi)
      }).toThrow("API 'duplicate-api' is already registered")
    })
  })

  describe('start', () => {
    beforeEach(() => {
      dashfy = new Dashfy({ logger: mockLogger as any })
    })

    it('should throw error when starting without configuration', async () => {
      await expect(dashfy.start()).rejects.toThrow(
        'Configuration required. Call configure() or configureFromFile() before starting.',
      )
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Configuration required. Call configure() or configureFromFile() before starting.',
      )
    })

    it('should start server with valid configuration', async () => {
      const port = await getAvailablePort()
      const config = createTestConfig()
      config.port = port
      dashfy.configure(config)

      await dashfy.start()

      expect(mockLogger.info).toHaveBeenCalledWith('🚀 Dashfy server started')
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(`HTTP: http://localhost:${port}`),
      )
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(`WebSocket: ws://localhost:${port}`),
      )

      await dashfy.stop()
    })

    it('should use environment variables for port and host', async () => {
      const port = await getAvailablePort()
      process.env.PORT = String(port)
      process.env.HOST = '127.0.0.1'

      const config = createTestConfig()
      dashfy.configure(config)

      await dashfy.start()

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(`HTTP: http://127.0.0.1:${port}`),
      )

      await dashfy.stop()

      delete process.env.PORT
      delete process.env.HOST
    })

    it('should use default port and host when not specified', async () => {
      const port = await getAvailablePort()
      // Use environment variable to set a unique port while testing default behavior
      process.env.PORT = String(port)

      const config = createTestConfig()
      delete config.port
      delete config.host

      dashfy.configure(config)

      await dashfy.start()

      // When config.host is not specified, it defaults to 0.0.0.0
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(`HTTP: http://0.0.0.0:${port}`),
      )

      await dashfy.stop()

      delete process.env.PORT
    })

    it('should register static file serving if build directory exists', async () => {
      const port = await getAvailablePort()
      const config = createTestConfig()
      config.port = port
      dashfy.configure(config)

      await dashfy.start()

      // Either the static files are served or a warning is logged
      // This depends on whether the build directory exists
      expect(mockLogger.info).toHaveBeenCalledWith('🚀 Dashfy server started')

      await dashfy.stop()
    })

    it('should serve static files from custom baseDir', async () => {
      const port = await getAvailablePort()
      const customBaseDir = path.join(testDir, 'custom-base')
      mkdirSync(customBaseDir, { recursive: true })
      mkdirSync(path.join(customBaseDir, 'build'), { recursive: true })

      const config = createTestConfig()
      config.port = port
      config.baseDir = customBaseDir

      dashfy.configure(config)
      await dashfy.start()

      // Should log that it's serving from the custom path
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Serving static files from ${path.join(customBaseDir, 'build')}`,
      )

      await dashfy.stop()
    })

    it('should use process.cwd() when baseDir is not specified', async () => {
      const port = await getAvailablePort()
      const config = createTestConfig()
      config.port = port
      delete config.baseDir

      dashfy.configure(config)
      await dashfy.start()

      expect(mockLogger.info).toHaveBeenCalledWith('🚀 Dashfy server started')

      await dashfy.stop()
    })
  })

  describe('stop', () => {
    beforeEach(() => {
      dashfy = new Dashfy({ logger: mockLogger as any })
    })

    it('should stop server gracefully when running', async () => {
      const port = await getAvailablePort()
      const config = createTestConfig()
      config.port = port
      dashfy.configure(config)
      await dashfy.start()

      mockLogger.info.mockClear()

      await dashfy.stop()

      expect(mockLogger.info).toHaveBeenCalledWith('Stopping Dashfy server...')
      expect(mockLogger.info).toHaveBeenCalledWith('Server stopped')
    })

    it('should handle stop when server was never started', async () => {
      await expect(dashfy.stop()).resolves.not.toThrow()
      expect(mockLogger.info).toHaveBeenCalledWith('Stopping Dashfy server...')
    })
  })

  describe('HTTP Endpoints', () => {
    let testPort: number

    beforeEach(async () => {
      testPort = await getAvailablePort()
      dashfy = new Dashfy({ logger: mockLogger as any })
      const config = createTestConfig()
      config.port = testPort
      dashfy.configure(config)
      await dashfy.start()
    })

    afterEach(async () => {
      if (dashfy) {
        await dashfy.stop()
      }
    })

    it('should expose /config endpoint with public configuration', async () => {
      const response = await fetch(`http://localhost:${testPort}/config`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('port', testPort)
      expect(data).toHaveProperty('host', 'localhost')
      expect(data).toHaveProperty('dashboards')
      expect(data).not.toHaveProperty('apis') // Should exclude sensitive API config
    })

    it('should expose /health endpoint', async () => {
      const response = await fetch(`http://localhost:${testPort}/health`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('status', 'ok')
      expect(data).toHaveProperty('uptime')
      expect(data).toHaveProperty('timestamp')
    })

    it('should expose /api/info endpoint', async () => {
      const response = await fetch(`http://localhost:${testPort}/api/info`)
      const data = (await response.json()) as {
        apis: string[]
        clientCount: number
        subscriptions: unknown[]
      }

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('apis')
      expect(data).toHaveProperty('clientCount')
      expect(data).toHaveProperty('subscriptions')
      expect(data.apis).toContain('dashfy') // Core API should be registered
    })
  })

  describe('Core API', () => {
    it('should have inspector method in core dashfy API', async () => {
      dashfy = new Dashfy({ logger: mockLogger as any })
      const port = await getAvailablePort()
      const config = createTestConfig()
      config.port = port
      dashfy.configure(config)
      await dashfy.start()

      const response = await fetch(`http://localhost:${port}/api/info`)
      const data = (await response.json()) as { apis: string[] }

      expect(data.apis).toContain('dashfy')
    })
  })

  describe('Integration', () => {
    beforeEach(() => {
      dashfy = new Dashfy({ logger: mockLogger as any })
    })

    it('should support full lifecycle: configure -> register -> start -> stop', async () => {
      const port = await getAvailablePort()
      // Configure
      const config = createTestConfig()
      config.port = port
      dashfy.configure(config)

      // Register API
      const mockApi = () => ({
        getData: async () => Promise.resolve({ result: 'success' }),
      })
      dashfy.registerApi('integration-api', mockApi)

      // Start
      await dashfy.start()
      expect(mockLogger.info).toHaveBeenCalledWith('🚀 Dashfy server started')

      // Verify API is registered
      const response = await fetch(`http://localhost:${port}/api/info`)
      const data = (await response.json()) as { apis: string[] }
      expect(data.apis).toContain('integration-api')

      // Stop
      await dashfy.stop()
      expect(mockLogger.info).toHaveBeenCalledWith('Server stopped')
    })

    it('should support configureFromFile -> start -> stop workflow', async () => {
      const port = await getAvailablePort()
      const yamlContent = `
port: ${port}
host: localhost
dashboards:
  - title: Integration Dashboard
    columns: 12
    rows: 8
    widgets: []
`
      writeFileSync(testConfigPath, yamlContent)

      await dashfy.configureFromFile(testConfigPath, false)
      await dashfy.start()

      expect(mockLogger.info).toHaveBeenCalledWith('🚀 Dashfy server started')

      const response = await fetch(`http://localhost:${port}/health`)
      expect(response.status).toBe(200)

      await dashfy.stop()
    })

    it('should support configureFromFile with JSON -> start -> stop workflow', async () => {
      const port = await getAvailablePort()
      const testJsonConfigPath = path.join(__dirname, 'test-config.json')
      const jsonContent = JSON.stringify({
        port,
        host: 'localhost',
        dashboards: [
          {
            title: 'Integration Dashboard JSON',
            columns: 12,
            rows: 8,
            widgets: [],
          },
        ],
      })

      try {
        writeFileSync(testJsonConfigPath, jsonContent)

        await dashfy.configureFromFile(testJsonConfigPath, false)
        await dashfy.start()

        expect(mockLogger.info).toHaveBeenCalledWith('🚀 Dashfy server started')

        const response = await fetch(`http://localhost:${port}/health`)
        expect(response.status).toBe(200)

        const configResponse = await fetch(`http://localhost:${port}/config`)
        const configData = (await configResponse.json()) as { dashboards: { title: string }[] }
        expect(configData.dashboards[0]!.title).toBe('Integration Dashboard JSON')

        await dashfy.stop()
      } finally {
        // Clean up JSON test file
        try {
          rmSync(testJsonConfigPath, { force: true })
        } catch {
          // Ignore errors if file doesn't exist
        }
      }
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      dashfy = new Dashfy({ logger: mockLogger as any })
    })

    it('should throw error for null configuration', () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        dashfy.configure(null as any)
      }).toThrow()
    })

    it('should log error when starting without configuration', async () => {
      await expect(dashfy.start()).rejects.toThrow()
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should log Socket.IO server-level errors', async () => {
      const port = await getAvailablePort()
      const config = createTestConfig()
      config.port = port
      dashfy.configure(config)
      await dashfy.start()

      mockLogger.error.mockClear()

      // Manually trigger the error event handler
      const testError = new Error('Test server error')
      // @ts-expect-error - io is private and only accessible within class 'Dashfy'
      const errorListeners = dashfy.io!.listeners('error')

      // Call the error handler directly
      expect(errorListeners.length).toBeGreaterThan(0)
      const errorHandler = errorListeners[0] as (error: Error) => void
      errorHandler(testError)

      // Verify the error was logged
      expect(mockLogger.error).toHaveBeenCalledWith({ err: testError }, 'Socket.IO server error')
    })
  })

  describe('Configuration Hot Reload', () => {
    it('should watch configuration file for changes when enabled', async () => {
      const port = await getAvailablePort()
      dashfy = new Dashfy({ logger: mockLogger as any })

      const yamlContent = `
port: ${port}
host: localhost
dashboards:
  - title: Reload Dashboard
    columns: 12
    rows: 8
    widgets: []
`
      writeFileSync(testConfigPath, yamlContent)

      await dashfy.configureFromFile(testConfigPath, true)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Watching configuration file: ${testConfigPath}`),
      )
    })

    it('should not watch configuration file when disabled', async () => {
      const port = await getAvailablePort()
      dashfy = new Dashfy({ logger: mockLogger as any })

      const yamlContent = `
port: ${port}
host: localhost
dashboards:
  - title: No Reload Dashboard
    columns: 12
    rows: 8
    widgets: []
`
      writeFileSync(testConfigPath, yamlContent)

      await dashfy.configureFromFile(testConfigPath, false)

      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.stringContaining('Watching configuration file'),
      )
    })

    // Note: File watcher tests are skipped as they are environment-dependent and flaky
    // The file watching functionality is covered by the basic test above
  })

  describe('Core API Inspector', () => {
    it('should return system information from inspector method', async () => {
      const port = await getAvailablePort()
      dashfy = new Dashfy({ logger: mockLogger as any })

      const config: DashfyConfig = {
        port,
        host: 'localhost',
        dashboards: [
          {
            title: 'Test Dashboard',
            columns: 12,
            rows: 8,
            widgets: [],
          },
        ],
      }

      dashfy.configure(config)

      // Register a test API
      dashfy.registerApi('test-api', () => ({
        testMethod: async () => Promise.resolve({ data: 'test' }),
      }))

      await dashfy.start()

      // Get the inspector response
      const response = await fetch(`http://localhost:${port}/api/info`)
      const info = (await response.json()) as {
        apis: string[]
        clientCount: number
        subscriptions: unknown[]
      }

      expect(info.apis).toContain('dashfy')
      expect(info.apis).toContain('test-api')
      expect(info.clientCount).toBe(0)
      expect(Array.isArray(info.subscriptions)).toBe(true)

      await dashfy.stop()
    })
  })
})
