import type { PollMode, Subscription } from '@dashfy/types'
import type { FastifyInstance } from 'fastify'
import type { Logger } from 'pino'
import type { Socket } from 'socket.io'

export interface API {
  mode: PollMode
  methods: Record<string, (...args: any[]) => Promise<unknown>>
}

export interface BusOptions {
  logger: Logger
  pollInterval?: number
}

export interface ClientInfo {
  socket: Socket
  subscriptions: Set<string>
  connectedAt: Date
}

export interface DashfyOptions {
  logger?: Logger
  app?: FastifyInstance
}

export interface SubscriptionData extends Subscription {
  clients: Set<string>
  timer?: NodeJS.Timeout
  pushDispose?: () => void
  cached?: {
    id: string
    data: unknown
  }
}

export interface SubscriptionInfo {
  id: string
  clientCount: number
  hasCachedData: boolean
  hasTimer: boolean
}
