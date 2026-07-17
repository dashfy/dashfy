import { EventEmitter } from 'node:events'

import type { APIRegistration, PollMode, Subscription } from '@dashfy/types'
import { WebSocketEvent } from '@dashfy/types'
import { getErrorMessage } from '@dashfy/utils'
import type { Logger } from 'pino'
import type { Socket } from 'socket.io'

import { DEFAULT_POLL_INTERVAL } from './constants'
import { createPushIntervalFactory } from './pushInterval'
import { request } from './request'
import type { API, BusOptions, ClientInfo, SubscriptionData } from './types'

/**
 * Central message bus for managing real-time API communication between server and clients.
 *
 * Handles API registration, client lifecycle, subscription management, and data delivery
 * through polling (periodic fetch) or push (callback-based) mechanisms.
 */
export class Bus extends EventEmitter {
  public readonly logger: Logger
  public pollInterval: number
  private apis = new Map<string, API>()
  private clients = new Map<string, ClientInfo>()
  private subscriptions = new Map<string, SubscriptionData>()

  /**
   * Creates a new Bus instance.
   *
   * @param options - Bus options
   * @param options.logger - Logger instance
   * @param options.pollInterval - Poll interval in milliseconds (default: 15_000)
   */
  constructor(options: BusOptions) {
    super()
    this.logger = options.logger
    this.pollInterval = options.pollInterval ?? DEFAULT_POLL_INTERVAL
  }

  /**
   * Register a new API with the bus.
   *
   * An API is an object composed of various methods that can be called by clients.
   * APIs can operate in two modes:
   * - `poll`: Methods are called periodically at a fixed interval
   * - `push`: Methods push data to clients when available
   *
   * @param id - Unique identifier for the API
   * @param apiRegistration - Function that returns an object with API methods
   * @param mode - API mode: 'poll' (default) or 'push'
   * @throws {Error} If the API mode is not 'poll' or 'push'
   * @throws {Error} If an API with the same ID is already registered
   *
   * @example
   * ```ts
   * bus.registerApi('weather', ({ logger, request }) => ({
   *   getCurrentWeather: async () => {
   *     return request({ url: 'https://api.weather.com/current' })
   *   }
   * }), 'poll')
   * ```
   */
  public registerApi(id: string, apiRegistration: APIRegistration, mode: PollMode = 'poll'): void {
    if (mode !== 'poll' && mode !== 'push') {
      const errorMessage = `Invalid API mode: ${String(mode)}. Must be 'poll' or 'push'`
      this.logger.error(errorMessage)
      throw new Error(errorMessage)
    }

    if (this.apis.has(id)) {
      const errorMessage = `API '${id}' is already registered`
      this.logger.error(errorMessage)
      throw new Error(errorMessage)
    }

    const logger = this.logger.child({ api: id })

    const methods = apiRegistration({
      logger,
      request,
      createPushInterval: createPushIntervalFactory(logger, id),
    })

    this.apis.set(id, { mode, methods })
    this.logger.info(`Registered API '${id}' (mode: ${mode})`)
  }

  /**
   * Get all registered API identifiers.
   *
   * Returns an array of all API IDs that have been registered with the bus.
   * Useful for debugging, introspection, or displaying available APIs.
   *
   * @returns Array of registered API IDs (unordered)
   *
   * @example
   * ```ts
   * const apis = bus.listApis()
   * console.log(apis) // ['github', 'weather', 'news']
   *
   * // Check if a specific API is registered
   * if (bus.listApis().includes('github')) {
   *   console.log('GitHub API is available')
   * }
   * ```
   */
  public listApis(): string[] {
    return Array.from(this.apis.keys())
  }

  /**
   * Register a new client connection with the bus.
   *
   * This should be called when a client establishes a WebSocket connection. The client
   * is tracked with its socket, an empty subscriptions set, and a connection timestamp.
   * Once registered, the client can subscribe to API methods.
   *
   * @param socket - Socket.IO socket instance representing the connected client
   * @throws {Error} If a client with the same socket ID is already registered
   *
   * @example
   * ```ts
   * // In your Socket.IO connection handler
   * io.on('connection', (socket) => {
   *   bus.addClient(socket)
   *
   *   socket.on('disconnect', () => {
   *     bus.removeClient(socket.id)
   *   })
   * })
   * ```
   */
  public addClient(socket: Socket): void {
    if (this.clients.has(socket.id)) {
      const errorMessage = `Client with id ${socket.id} already registered`
      this.logger.error(errorMessage)
      throw new Error(errorMessage)
    }

    this.clients.set(socket.id, {
      socket,
      subscriptions: new Set(),
      connectedAt: new Date(),
    })

    this.logger.info(`Client with id ${socket.id} connected`)
  }

  /**
   * Remove a client and clean up all associated resources.
   *
   * This method removes the client from all subscriptions it was part of. If a subscription
   * has no remaining clients after removal, the subscription is cleaned up and any polling
   * timers are cleared. This should be called when a client disconnects to prevent memory leaks.
   *
   * @param clientId - The unique identifier of the client to remove (socket.id)
   * @throws {Error} If the client is not found
   *
   * @example
   * ```ts
   * // In your Socket.IO disconnect handler
   * socket.on('disconnect', () => {
   *   bus.removeClient(socket.id)
   *   console.log(`Client ${socket.id} removed`)
   * })
   * ```
   */
  public removeClient(clientId: string): void {
    const clientInfo = this.clients.get(clientId)

    if (!clientInfo) {
      const errorMessage = `Client with id ${clientId} not found`
      this.logger.error(errorMessage)
      throw new Error(errorMessage)
    }

    // Remove client from all subscriptions
    for (const subscriptionId of clientInfo.subscriptions) {
      const subscription = this.subscriptions.get(subscriptionId)

      if (!subscription) {
        continue
      }

      subscription.clients.delete(clientId)

      if (subscription.clients.size === 0) {
        this.teardownSubscription(subscriptionId)
      }
    }

    this.clients.delete(clientId)
    this.logger.info(`Client with id ${clientId} disconnected`)
  }

  /**
   * Get the current number of connected clients.
   *
   * Returns the real-time count of active client connections. Useful for monitoring,
   * health checks, or displaying connection statistics.
   *
   * @returns Number of currently connected clients
   *
   * @example
   * ```ts
   * // Display connection stats
   * const count = bus.clientCount()
   * console.log(`${count} client(s) connected`)
   *
   * // Health check endpoint
   * app.get('/health', (req, res) => {
   *   res.json({
   *     status: 'ok',
   *     clients: bus.clientCount()
   *   })
   * })
   * ```
   */
  public clientCount(): number {
    return this.clients.size
  }

  /**
   * Subscribe a client to an API method call.
   *
   * This creates or reuses a subscription for the specified API method and adds the client
   * to receive updates. For poll mode APIs, this starts periodic polling. For push mode APIs,
   * this sets up the push producer. If cached data exists, it's immediately sent to the client.
   *
   * The subscription ID must follow the format: `api.method` (e.g., 'github.repos', 'weather.current')
   *
   * @param clientId - The unique identifier of the connected client
   * @param subscription - Subscription details including ID and optional parameters
   * @throws {Error} If the subscription ID format is invalid (must be 'api.method')
   * @throws {Error} If the API ID is empty or undefined
   * @throws {Error} If the API is not registered
   * @throws {Error} If the API method does not exist or is not a function
   *
   * @example
   * ```ts
   * // Subscribe to a GitHub API method
   * bus.subscribe('client-123', {
   *   id: 'github.repos',
   *   params: { user: 'octocat' }
   * })
   *
   * // Subscribe without parameters
   * bus.subscribe('client-456', {
   *   id: 'weather.current'
   * })
   * ```
   */
  public subscribe(clientId: string, subscription: Subscription): void {
    const clientInfo = this.clients.get(clientId)

    if (!clientInfo) {
      this.logger.warn(`Cannot subscribe: client with id ${clientId} not found`)
      return
    }

    const subscriptionId = subscription.id

    // Use subscription.api and subscription.endpoint directly
    const apiId = subscription.api
    const methodName = subscription.endpoint

    if (!apiId) {
      const errorMessage = `Invalid API ID in subscription: ${subscriptionId}`
      this.logger.error(errorMessage)
      throw new Error(errorMessage)
    }

    if (!methodName) {
      const errorMessage = `Invalid endpoint in subscription: ${subscriptionId}`
      this.logger.error(errorMessage)
      throw new Error(errorMessage)
    }

    const api = this.apis.get(apiId)

    if (!api) {
      const errorMessage = `API not found: ${apiId}`
      this.logger.error(errorMessage)
      throw new Error(errorMessage)
    }

    const method = api.methods[methodName]

    if (!method || typeof method !== 'function') {
      const errorMessage = `API method not found: ${apiId}.${methodName}`
      this.logger.error(errorMessage)
      throw new Error(errorMessage)
    }

    // Create subscription if it doesn't exist
    if (!this.subscriptions.has(subscriptionId)) {
      this.subscriptions.set(subscriptionId, {
        id: subscriptionId,
        api: apiId,
        endpoint: methodName,
        params: subscription.params,
        clients: new Set(),
      })

      this.logger.info(`Created subscription ${subscriptionId}`)

      if (api.mode === 'poll') {
        // Make an immediate call to avoid waiting for the first interval
        void this.processApiCall(subscriptionId, method, subscription.params)

        // Set up polling to call the method periodically
        const timer = setInterval(() => {
          // Call the method periodically
          void this.processApiCall(subscriptionId, method, subscription.params)
        }, this.pollInterval)

        const sub = this.subscriptions.get(subscriptionId)

        if (sub) {
          sub.timer = timer
        }

        this.logger.info(
          `Started polling for subscription ${subscriptionId} every ${this.pollInterval}ms`,
        )
      } else if (api.mode === 'push') {
        // Set up push producer to call the method when data is available.
        // The producer may return a disposer that stops its underlying interval; capture it
        // so we can stop pushing when the last client unsubscribes or disconnects.
        const producerResult = method((data: unknown) => {
          const message = { id: subscriptionId, data }

          // Cache the response
          const sub = this.subscriptions.get(subscriptionId)

          if (sub) {
            sub.cached = message
          }

          // Send the data to all subscribed clients
          this.send(subscriptionId, message, WebSocketEvent.API_DATA)
        }, subscription.params)

        Promise.resolve(producerResult)
          .then((result) => {
            if (typeof result !== 'function') {
              return
            }

            const dispose = result as () => void
            const sub = this.subscriptions.get(subscriptionId)

            // Subscription may have been removed before the producer resolved.
            // In that case dispose immediately to avoid a leaked interval.
            if (sub) {
              sub.pushDispose = dispose
            } else {
              dispose()
            }
          })
          .catch((error) => {
            this.logger.error(
              `Push producer for ${subscriptionId} failed: ${getErrorMessage(error)}`,
            )
          })

        this.logger.info(`Created push producer for subscription ${subscriptionId}`)
      }
    }

    // Add client to subscription
    const sub = this.subscriptions.get(subscriptionId)

    if (!sub) {
      this.logger.warn(`Cannot subscribe: subscription ${subscriptionId} not found`)
      return
    }

    sub.clients.add(clientId)
    clientInfo.subscriptions.add(subscriptionId)

    // Send cached data immediately if available
    if (sub.cached) {
      this.logger.info(
        `Sending cached data to client with id ${clientId} for subscription ${subscriptionId}`,
      )
      clientInfo.socket.emit(WebSocketEvent.API_DATA, sub.cached)
    }
  }

  /**
   * Unsubscribe a client from an API method subscription.
   *
   * This removes the client from the specified subscription. If this was the last client
   * subscribed to this API method, the subscription is cleaned up entirely and any polling
   * timers are cleared to prevent unnecessary API calls and memory leaks.
   *
   * If the client or subscription doesn't exist, the method returns silently without error.
   * This is safe to call multiple times or for non-existent subscriptions.
   *
   * @param clientId - The unique identifier of the client to unsubscribe
   * @param subscriptionId - The subscription ID to unsubscribe from (format: 'api.method')
   *
   * @example
   * ```ts
   * // Unsubscribe from a specific API
   * socket.on('unsubscribe', (subscriptionId) => {
   *   bus.unsubscribe(socket.id, subscriptionId)
   * })
   *
   * // Unsubscribe when widget is removed
   * bus.unsubscribe('client-123', 'github.repos')
   * ```
   */
  public unsubscribe(clientId: string, subscriptionId: string): void {
    const clientInfo = this.clients.get(clientId)

    if (!clientInfo) {
      this.logger.warn(`Cannot unsubscribe: client with id ${clientId} not found`)
      return
    }

    const subscription = this.subscriptions.get(subscriptionId)

    if (!subscription) {
      this.logger.warn(`Cannot unsubscribe: subscription ${subscriptionId} not found`)
      return
    }

    subscription.clients.delete(clientId)
    clientInfo.subscriptions.delete(subscriptionId)

    if (subscription.clients.size === 0) {
      this.teardownSubscription(subscriptionId)
    }
  }

  /**
   * Get detailed information about all active subscriptions.
   *
   * Returns an array of subscription metadata including subscription IDs, client counts,
   * cache status, and timer status. Useful for monitoring, debugging, and displaying
   * real-time statistics about API subscriptions.
   *
   * @returns Array of subscription info objects, each containing:
   *   - `id`: Subscription identifier (format: 'api.method')
   *   - `clientCount`: Number of clients subscribed to this API method
   *   - `hasCachedData`: Whether cached data is available for immediate delivery
   *   - `hasTimer`: Whether a polling timer is active (poll mode only)
   *
   * @example
   * ```ts
   * // Get all subscription stats
   * const subs = bus.getSubscriptionsInfo()
   * console.log(subs)
   * // [
   * //   {
   * //     id: 'github.repos',
   * //     clientCount: 3,
   * //     hasCachedData: true,
   * //     hasTimer: true
   * //   },
   * //   {
   * //     id: 'weather.current',
   * //     clientCount: 1,
   * //     hasCachedData: false,
   * //     hasTimer: false
   * //   }
   * // ]
   *
   * // Debug endpoint for monitoring
   * app.get('/debug/subscriptions', (req, res) => {
   *   res.json({
   *     total: bus.getSubscriptionsInfo().length,
   *     subscriptions: bus.getSubscriptionsInfo()
   *   })
   * })
   *
   * // Find subscriptions with no clients (memory leak detection)
   * const orphaned = bus.getSubscriptionsInfo().filter(s => s.clientCount === 0)
   * if (orphaned.length > 0) {
   *   console.warn('Found orphaned subscriptions:', orphaned)
   * }
   * ```
   */
  public getSubscriptionsInfo() {
    return Array.from(this.subscriptions.entries()).map(([id, sub]) => ({
      id,
      clientCount: sub.clients.size,
      hasCachedData: !!sub.cached,
      hasTimer: !!sub.timer,
    }))
  }

  /**
   * Execute an API method call and distribute results to subscribed clients.
   *
   * This internal method is called either periodically (for poll mode) or on-demand (for push mode).
   * It executes the API method with the provided parameters, caches the result, and sends the data
   * to all clients subscribed to this API method. If the API call fails, an error message is sent
   * instead and logged.
   *
   * @param subscriptionId - The subscription identifier (format: 'api.method')
   * @param method - The API method function to execute
   * @param params - Optional parameters to pass to the API method
   *
   * @remarks
   * This method handles:
   * - Executing the API method with error handling
   * - Caching successful responses for immediate delivery to new subscribers
   * - Broadcasting data to all subscribed clients via 'api.data' event
   * - Broadcasting errors to all subscribed clients via 'api.error' event
   * - Logging execution details for debugging
   *
   * @internal
   */
  private async processApiCall(
    subscriptionId: string,
    method: (...args: any[]) => Promise<unknown>,
    params?: unknown,
  ): Promise<void> {
    try {
      this.logger.debug(`Calling subscription ${subscriptionId}`)

      const data = await method(params)
      const message = { id: subscriptionId, data }

      // Cache the response
      const subscription = this.subscriptions.get(subscriptionId)

      if (subscription) {
        this.logger.info(`Caching response for subscription ${subscriptionId}`)
        subscription.cached = message
      }

      // Send to all subscribed clients
      this.send(subscriptionId, message, WebSocketEvent.API_DATA)
    } catch (error) {
      const errorMessage = {
        id: subscriptionId,
        error: {
          message: getErrorMessage(error),
        },
      }

      this.logger.error({ err: error, subscriptionId }, 'Subscription execution error')
      this.send(subscriptionId, errorMessage, WebSocketEvent.API_ERROR)
    }
  }

  /**
   * Broadcast data to all clients subscribed to a specific API method.
   *
   * This internal method iterates through all clients subscribed to the given subscription
   * and emits the data via Socket.IO. It safely handles cases where clients may have
   * disconnected but haven't been cleaned up yet.
   *
   * @param subscriptionId - The subscription identifier (format: 'api.method')
   * @param data - The data payload to send (API response or error message)
   * @param type - The message type: 'api.data' for successful responses, 'api.error' for errors
   *
   * @remarks
   * This method:
   * - Returns silently if the subscription doesn't exist (already cleaned up)
   * - Skips clients that no longer exist (race condition handling)
   * - Uses Socket.IO's emit to send data to each client
   *
   * @internal
   */
  private send(subscriptionId: string, data: unknown, type: WebSocketEvent): void {
    const subscription = this.subscriptions.get(subscriptionId)

    if (!subscription) {
      this.logger.warn(`Cannot send data to subscription ${subscriptionId}: not found`)
      return
    }

    for (const clientId of subscription.clients) {
      const clientInfo = this.clients.get(clientId)

      if (clientInfo) {
        clientInfo.socket.emit(type, data)
      }
    }
  }

  /**
   * Tear down a subscription that has no clients remaining.
   *
   * Clears any poll-mode timer and invokes the push-mode disposer (if either is set),
   * then removes the subscription entry. Safe to call when the subscription is missing.
   *
   * @param subscriptionId - The subscription identifier (format: 'api.method')
   *
   * @internal
   */
  private teardownSubscription(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId)

    if (!subscription) {
      return
    }

    if (subscription.timer) {
      clearInterval(subscription.timer)
    }

    if (subscription.pushDispose) {
      try {
        subscription.pushDispose()
      } catch (error) {
        this.logger.error(`Push dispose for ${subscriptionId} failed: ${getErrorMessage(error)}`)
      }
    }

    this.subscriptions.delete(subscriptionId)
    this.logger.info(`Removed subscription ${subscriptionId} (no clients)`)
  }
}
