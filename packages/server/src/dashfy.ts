import path from 'node:path'

import type { APIRegistration, DashfyConfig, PollMode, Subscription } from '@dashfy/types'
import { WebSocketEvent } from '@dashfy/types'
import { getErrorMessage } from '@dashfy/utils'
import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import { watch } from 'chokidar'
import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'
import type { Logger } from 'pino'
import { Server as SocketIOServer } from 'socket.io'

import { Bus } from './bus'
import { loadConfig } from './config'
import { DEFAULT_HOST, DEFAULT_PORT, SOCKET_PING_INTERVAL, SOCKET_PING_TIMEOUT } from './constants'
import { createLogger } from './logger'
import type { DashfyOptions } from './types'

/**
 * Main Dashfy server class that manages the dashboard application.
 *
 * Orchestrates HTTP server (Fastify), WebSocket communication (Socket.IO),
 * API registration (Bus), and configuration handling with hot-reload support.
 *
 * @example
 * ```ts
 * import { Dashfy } from '@dashfy/server'
 *
 * const dashfy = new Dashfy()
 *
 * // Load configuration from JSON (or YAML)
 * await dashfy.configureFromFile('./dashfy.config.json')
 *
 * // Register APIs
 * dashfy.registerApi('github', () => ({
 *   async stars(params: { owner: string; repo: string }) {
 *     const res = await fetch(`https://api.github.com/repos/${params.owner}/${params.repo}`)
 *     const data = await res.json()
 *     return { stars: data.stargazers_count }
 *   }
 * }))
 *
 * // Start server
 * await dashfy.start()
 * // Server running at http://0.0.0.0:5001
 * ```
 *
 * @example
 * ```ts
 * // Push mode for real-time data
 * dashfy.registerApi('metrics', () => ({
 *   cpuUsage(callback: (data: unknown) => void) {
 *     const interval = setInterval(() => {
 *       callback({ usage: process.cpuUsage(), timestamp: Date.now() })
 *     }, 1000)
 *     return () => clearInterval(interval) // cleanup
 *   }
 * }), 'push')
 * ```
 */
export class Dashfy {
  private app: FastifyInstance
  private io?: SocketIOServer
  private bus: Bus
  private config?: DashfyConfig
  private logger: Logger
  private configPath?: string

  /**
   * Creates a new Dashfy instance.
   *
   * @param options - Dashfy options
   * @param options.logger - Logger instance
   * @param options.app - Existing Fastify instance. When provided,
   *                      Dashfy will use this instance instead of creating a new one,
   *                      allowing integration with existing Fastify middleware and routes.
   *
   * @example
   * ```ts
   * // Integrate Dashfy with existing Fastify app
   * import Fastify from 'fastify'
   * import { Dashfy } from '@dashfy/server'
   *
   * const app = Fastify()
   *
   * // Add your custom routes
   * app.get('/custom-api', async (request, reply) => {
   *   return { message: 'Custom endpoint' }
   * })
   *
   * // Initialize Dashfy with existing app
   * const dashfy = new Dashfy({ app })
   * await dashfy.configureFromFile('./dashfy.config.json')
   * await dashfy.start()
   * ```
   */
  constructor(options: DashfyOptions = {}) {
    this.logger = options.logger ?? createLogger()

    // Use existing Fastify instance if provided, otherwise create a new one
    // Disable Fastify's built-in logger when a custom logger is provided
    if (options.app) {
      this.app = options.app
    } else {
      this.app = Fastify({
        logger: options.logger ? false : true,
        disableRequestLogging: true,
      })
    }

    this.bus = new Bus({
      logger: this.logger.child({ component: 'bus' }),
    })

    // Register core API
    this.registerCoreApi()
  }

  /**
   * Configures the Dashfy server with the provided configuration object.
   *
   * This method accepts a configuration object and applies it to the server instance.
   * If a global poll interval is specified in the configuration, it will be applied
   * to the message bus for all poll-mode APIs.
   *
   * @param config - The Dashfy configuration object containing server settings,
   *                 dashboards, and optional API configuration
   *
   * @remarks
   * This method should be called before {@link start}. For loading configuration
   * from a JSON or YAML file, use {@link configureFromFile} instead.
   *
   * @example
   * ```ts
   * const dashfy = new Dashfy();
   *
   * // Configure with a configuration object
   * dashfy.configure({
   *   port: 5001,
   *   host: 'localhost',
   *   dashboards: [
   *     {
   *       id: 'main',
   *       title: 'Main Dashboard',
   *       widgets: []
   *     }
   *   ],
   *   apis: {
   *     pollInterval: 30000 // 30 seconds
   *   }
   * });
   *
   * await dashfy.start();
   * ```
   */
  public configure(config: DashfyConfig): void {
    this.config = config

    if (config.apis?.pollInterval) {
      this.bus.pollInterval = config.apis.pollInterval
      this.logger.info(`Set global poll interval to ${this.bus.pollInterval}ms`)
    }
  }

  /**
   * Loads and applies configuration from a file (JSON or YAML).
   *
   * This method reads a configuration file (supports .json, .yml, .yaml formats),
   * validates it against the schema, and applies it to the server instance. It also
   * optionally watches the file for changes and automatically reloads the configuration
   * when the file is modified. When changes are detected, all connected clients are
   * notified via Socket.IO.
   *
   * @param configPath - Path to the configuration file (absolute or relative).
   *                     Supports .json, .yml, .yaml extensions
   * @param watchConfig - Whether to watch the configuration file for changes.
   *                      When `true`, the configuration will be automatically reloaded
   *                      on file changes. Defaults to `true`
   *
   * @throws {Error} If the configuration file cannot be read or fails validation
   *
   * @remarks
   * This method should be called before {@link start}. If you already have a
   * configuration object, use {@link configure} instead.
   *
   * When the configuration is reloaded due to file changes:
   * - The new configuration is validated before applying
   * - Connected clients receive the updated configuration (excluding sensitive API data)
   * - If validation fails, the old configuration remains active
   *
   * @example
   * ```ts
   * const dashfy = new Dashfy();
   *
   * // Load configuration from JSON file with auto-reload
   * await dashfy.configureFromFile('./dashfy.config.json');
   *
   * // Load configuration from YAML file with auto-reload
   * await dashfy.configureFromFile('./dashfy.config.yaml');
   *
   * // Load without watching for changes (production)
   * await dashfy.configureFromFile('./dashfy.config.yaml', false);
   *
   * await dashfy.start();
   * ```
   */
  public async configureFromFile(configPath: string, watchConfig = true): Promise<void> {
    this.configPath = configPath
    const config = await loadConfig(configPath)
    this.configure(config)

    // Watch for configuration changes
    if (watchConfig) {
      const watcher = watch(configPath)

      watcher.on('change', async () => {
        this.logger.info('Configuration file changed, reloading...')

        try {
          const newConfig = await loadConfig(configPath)
          this.configure(newConfig)

          // Broadcast configuration update to connected clients
          if (this.io) {
            // Don't send sensitive api configuration
            this.io.emit('configuration', this.getPublicConfig(newConfig))
          }

          this.logger.info('Configuration reloaded successfully')
        } catch (error) {
          this.logger.error({ err: error }, 'Failed to reload configuration')
        }
      })

      this.logger.info(`Watching configuration file: ${configPath}`)
    }
  }

  /**
   * Registers an API with the message bus for data retrieval.
   *
   * This method allows you to register custom APIs that widgets can subscribe to
   * for fetching data. APIs can operate in either poll mode (periodic fetching)
   * or push mode (real-time updates via callbacks).
   *
   * @param id - Unique identifier for the API (e.g., 'github', 'weather', 'analytics')
   * @param api - Factory function that returns an object containing API methods.
   *              Each method should be async and return data that widgets can consume
   * @param mode - The API mode: `poll` (default) for periodic polling,
   *               or `push` for real-time push-based updates
   *
   * @throws {Error} If an API with the same ID is already registered
   * @throws {Error} If the API mode is invalid
   *
   * @remarks
   * - In **poll mode**, the bus automatically calls API methods at regular intervals
   * - In **push mode**, API methods receive a callback to push data when available
   * - APIs should be registered before calling {@link start}
   * - The core `dashfy` API is automatically registered and provides system information
   *
   * @example
   * ```ts
   * const dashfy = new Dashfy();
   *
   * // Register a poll-mode API (default)
   * dashfy.registerApi('github', () => ({
   *   async stars(params: { owner: string; repo: string }) {
   *     const response = await fetch(
   *       `https://api.github.com/repos/${params.owner}/${params.repo}`
   *     );
   *     const data = await response.json();
   *     return { stars: data.stargazers_count };
   *   }
   * }));
   *
   * // Register a push-mode API for real-time updates
   * dashfy.registerApi('metrics', () => ({
   *   async cpuUsage(callback: (data: unknown) => void) {
   *     const interval = setInterval(() => {
   *       const usage = process.cpuUsage();
   *       callback({ cpu: usage });
   *     }, 1000);
   *
   *     return () => clearInterval(interval);
   *   }
   * }), 'push');
   * ```
   */
  public registerApi(id: string, api: APIRegistration, mode: PollMode = 'poll'): void {
    this.bus.registerApi(id, api, mode)
  }

  /**
   * Starts the Dashfy server and begins listening for connections.
   *
   * This method initializes and starts all server components including the HTTP server,
   * WebSocket connections, static file serving, and API endpoints. It must be called
   * after configuration is loaded via {@link configure} or {@link configureFromFile}.
   *
   * @throws {Error} If configuration has not been set before calling this method
   *
   * @remarks
   * **What this method does:**
   * 1. Validates that configuration is loaded
   * 2. Sets up CORS for cross-origin requests
   * 3. Serves static files from the `build` directory (if available)
   * 4. Registers HTTP endpoints:
   *    - `GET /config` - Returns public configuration (excludes sensitive API data)
   *    - `GET /health` - Health check endpoint with uptime and status
   *    - `GET /api/info` - Returns registered APIs and connection info
   * 5. Initializes Socket.IO for real-time WebSocket communication
   * 6. Sets up Socket.IO event handlers:
   *    - `connection` - Client connects, receives configuration
   *    - `api.subscription` - Widget subscribes to data
   *    - `api.unsubscription` - Widget unsubscribes from data
   *    - `disconnect` - Client disconnects, cleanup performed
   *    - `error` - Socket error handling
   * 7. Starts listening on configured host and port
   *
   * **Port and Host Resolution:**
   * - Port: `process.env.PORT` → `config.port` → `5001` (default)
   * - Host: `process.env.HOST` → `config.host` → `0.0.0.0` (default)
   *
   * @example
   * ```ts
   * const dashfy = new Dashfy();
   *
   * // Configure the server
   * await dashfy.configureFromFile('./dashfy.config.json');
   *
   * // Register custom APIs
   * dashfy.registerApi('github', () => ({
   *   async stars(params: { owner: string; repo: string }) {
   *     // ... fetch GitHub stars
   *   }
   * }));
   *
   * // Start the server
   * await dashfy.start();
   * // Server is now running and accepting connections
   * ```
   *
   * @example
   * ```ts
   * // With environment variables
   * process.env.PORT = '3000';
   * process.env.HOST = 'localhost';
   *
   * const dashfy = new Dashfy();
   * await dashfy.configureFromFile('./dashfy.config.json');
   * await dashfy.start();
   * // Server running on http://localhost:3000
   * ```
   */
  public async start(): Promise<void> {
    if (!this.config) {
      const errorMessage =
        'Configuration required. Call configure() or configureFromFile() before starting.'
      this.logger.error(errorMessage)
      throw new Error(errorMessage)
    }

    // Setup CORS
    await this.app.register(cors, {
      origin: true,
      credentials: true,
    })

    // Serve static files (for production builds)
    const baseDir = this.config.baseDir ?? process.cwd()
    const staticPath = path.join(baseDir, 'build')

    try {
      await this.app.register(fastifyStatic, {
        root: staticPath,
        prefix: '/',
      })
      this.logger.info(`Serving static files from ${staticPath}`)
    } catch (_error) {
      this.logger.warn('Static files directory not found, skipping static serve')
    }

    // Configuration endpoint (don't expose sensitive api config)
    this.app.get('/config', () => {
      return this.getPublicConfig(this.config!)
    })

    // Health check endpoint
    this.app.get('/health', () => ({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }))

    // API info endpoint
    this.app.get('/api/info', () => ({
      apis: this.bus.listApis(),
      clientCount: this.bus.clientCount(),
      subscriptions: this.bus.getSubscriptionsInfo(),
    }))

    // Setup Socket.IO - attach to Fastify's server
    this.io = new SocketIOServer(this.app.server, {
      cors: {
        origin: '*',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: SOCKET_PING_TIMEOUT,
      pingInterval: SOCKET_PING_INTERVAL,
    })

    // Socket.IO server-level error handler
    this.io.on('error', (error: Error) => {
      this.logger.error({ err: error }, 'Socket.IO server error')
    })

    // Socket.IO connection handler
    this.io.on('connection', (socket) => {
      this.logger.info(`Socket connected: ${socket.id}`)

      this.bus.addClient(socket)

      // Send configuration to newly connected client
      if (this.config) {
        socket.emit('configuration', this.getPublicConfig(this.config))
      }

      socket.on(WebSocketEvent.API_SUBSCRIPTION, (subscription: Subscription) => {
        this.logger.debug(`Subscription request: ${subscription.id} from ${socket.id}`)
        try {
          this.bus.subscribe(socket.id, subscription)
        } catch (error) {
          this.logger.error({ err: error }, 'Subscription error')
          socket.emit(WebSocketEvent.API_ERROR, {
            id: subscription.id,
            error: {
              message: getErrorMessage(error),
            },
          })
        }
      })

      socket.on(WebSocketEvent.API_UNSUBSCRIPTION, (subscription: Subscription) => {
        this.logger.debug(`Unsubscription request: ${subscription.id} from ${socket.id}`)
        this.bus.unsubscribe(socket.id, subscription.id)
      })

      socket.on(WebSocketEvent.DISCONNECT, (reason) => {
        this.logger.info(`Socket disconnected: ${socket.id} (${reason})`)
        this.bus.removeClient(socket.id)
      })

      socket.on(WebSocketEvent.ERROR, (error) => {
        this.logger.error({ err: error, socketId: socket.id }, 'Socket error')
      })
    })

    const port = process.env.PORT ? Number(process.env.PORT) : (this.config.port ?? DEFAULT_PORT)
    const host = process.env.HOST ?? this.config.host ?? DEFAULT_HOST

    // Start both Fastify and Socket.IO
    await this.app.listen({ port, host })

    this.logger.info(`🚀 Dashfy server started`)
    this.logger.info(`   - HTTP: http://${host}:${port}`)
    this.logger.info(`   - WebSocket: ws://${host}:${port}`)
    this.logger.info(`   - Registered APIs: ${this.bus.listApis().join(', ')}`)
  }

  /**
   * Gracefully stops the Dashfy server and cleans up all resources.
   *
   * This method performs a graceful shutdown of the server, closing all active
   * connections and releasing resources. It closes the Socket.IO server (if initialized)
   * and the underlying Fastify HTTP server.
   *
   * @remarks
   * **Shutdown process:**
   * 1. Logs shutdown initiation
   * 2. Closes Socket.IO server (disconnects all WebSocket clients)
   * 3. Closes Fastify HTTP server (stops accepting new connections)
   * 4. Waits for all pending requests to complete
   * 5. Logs shutdown completion
   *
   * This method is safe to call even if the server was never started or is already stopped.
   * All connected clients will be disconnected, and their subscriptions will be cleaned up
   * automatically by the bus.
   *
   * @example
   * ```ts
   * const dashfy = new Dashfy();
   * await dashfy.configureFromFile('./dashfy.config.json');
   * await dashfy.start();
   *
   * // Later, gracefully shut down the server
   * await dashfy.stop();
   * ```
   *
   * @example
   * ```ts
   * // Graceful shutdown on process signals
   * const dashfy = new Dashfy();
   * await dashfy.configureFromFile('./dashfy.config.json');
   * await dashfy.start();
   *
   * process.on('SIGTERM', async () => {
   *   console.log('SIGTERM received, shutting down gracefully...');
   *   await dashfy.stop();
   *   process.exit(0);
   * });
   *
   * process.on('SIGINT', async () => {
   *   console.log('SIGINT received, shutting down gracefully...');
   *   await dashfy.stop();
   *   process.exit(0);
   * });
   * ```
   */
  public async stop(): Promise<void> {
    this.logger.info('Stopping Dashfy server...')

    if (this.io) {
      await new Promise<void>((resolve, reject) => {
        void this.io!.close((error) => {
          if (error) {
            reject(error)
          } else {
            resolve()
          }
        })
      })
    }

    await this.app.close()
    this.logger.info('Server stopped')
  }

  /**
   * Returns a sanitized configuration object without sensitive API data.
   *
   * Removes the `apis` property from the configuration before sending it to clients,
   * as it may contain sensitive server-side settings like polling intervals or API keys.
   *
   * @param config - The full Dashfy configuration object
   * @returns Configuration object without the `apis` property
   *
   * @internal
   */
  private getPublicConfig(config: DashfyConfig): Omit<DashfyConfig, 'apis'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { apis, ...publicConfig } = config
    return publicConfig
  }

  /**
   * Registers the core `dashfy` API that provides system introspection and monitoring.
   *
   * This internal method is automatically called during construction to register
   * a built-in API that exposes server health, statistics, and debugging information.
   * The `dashfy` API is available to all widgets for monitoring server state.
   *
   * @remarks
   * **Available methods:**
   * - `inspector()` - Returns comprehensive system information including:
   *   - `apis`: List of all registered API identifiers
   *   - `clientCount`: Number of currently connected WebSocket clients
   *   - `subscriptions`: Detailed information about all active subscriptions
   *   - `uptime`: Server process uptime in seconds
   *   - `version`: Dashfy server version (from package.json)
   *   - `nodeVersion`: Node.js runtime version
   *
   * This API is useful for:
   * - Building admin/monitoring dashboards
   * - Debugging subscription and connection issues
   * - Health checks and system monitoring
   * - Displaying server statistics to users
   *
   * @example
   * ```ts
   * // Widgets can subscribe to the dashfy API
   * // In a widget configuration:
   * {
   *   api: 'dashfy',
   *   method: 'inspector'
   * }
   *
   * // This returns:
   * {
   *   apis: ['dashfy', 'github', 'weather'],
   *   clientCount: 5,
   *   subscriptions: [...],
   *   uptime: 3600.5,
   *   version: '0.1.0',
   *   nodeVersion: 'v20.10.0'
   * }
   * ```
   *
   * @internal
   */
  private registerCoreApi(): void {
    this.registerApi('dashfy', () => ({
      inspector: async () =>
        Promise.resolve({
          apis: this.bus.listApis(),
          clientCount: this.bus.clientCount(),
          subscriptions: this.bus.getSubscriptionsInfo(),
          uptime: process.uptime(),
          version: process.env.npm_package_version ?? 'unknown',
          nodeVersion: process.version,
        }),
    }))
  }
}
