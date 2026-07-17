import { format } from 'date-fns'
import * as React from 'react'

import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  TerminalIcon,
  TrashIcon,
  XCircleIcon,
} from '@/components/common/Icons'
import { Scrollable } from '@/components/common/Scrollable'
import { cn, generateReactKey } from '@/lib/utils'

interface ConsoleMessage {
  id: string
  type: 'log' | 'info' | 'warn' | 'error' | 'success'
  message: string
  timestamp: number
  count?: number
}

export const ConsolePanel = () => {
  const [messages, setMessages] = React.useState<ConsoleMessage[]>([])
  const [filter, setFilter] = React.useState<ConsoleMessage['type'] | 'all'>('all')

  React.useEffect(() => {
    // Intercept console methods
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
    }

    const addMessage = (type: ConsoleMessage['type'], args: unknown[]) => {
      const message = args
        .map((arg) => {
          if (typeof arg === 'object' && arg !== null) {
            try {
              return JSON.stringify(arg, null, 2)
            } catch {
              return '[Object]'
            }
          }

          if (arg === null) {
            return 'null'
          }

          if (arg === undefined) {
            return 'undefined'
          }

          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          return String(arg)
        })
        .join(' ')

      setMessages((prev) => {
        // Check if last message is the same
        const lastMsg = prev[prev.length - 1]

        if (lastMsg?.message === message && lastMsg.type === type) {
          return [
            ...prev.slice(0, -1),
            { ...lastMsg, count: (lastMsg.count ?? 1) + 1, timestamp: Date.now() },
          ]
        }

        return [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            type,
            message,
            timestamp: Date.now(),
            count: 1,
          },
        ].slice(-100) // Keep last 100 messages
      })
    }

    console.log = (...args: unknown[]) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      originalConsole.log(...(args as any[]))
      addMessage('log', args)
    }

    console.info = (...args: unknown[]) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      originalConsole.info(...(args as any[]))
      addMessage('info', args)
    }

    console.warn = (...args: unknown[]) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      originalConsole.warn(...(args as any[]))
      addMessage('warn', args)
    }

    console.error = (...args: unknown[]) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      originalConsole.error(...(args as any[]))
      addMessage('error', args)
    }

    // Add welcome message
    addMessage('info', ['Console ready'])

    return () => {
      console.log = originalConsole.log
      console.info = originalConsole.info
      console.warn = originalConsole.warn
      console.error = originalConsole.error
    }
  }, [])

  const filteredMessages =
    filter === 'all' ? messages : messages.filter((msg) => msg.type === filter)

  const clearConsole = () => {
    setMessages([])
  }

  const getMessageIcon = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'error':
        return <XCircleIcon className="h-4 w-4 shrink-0 text-error" />
      case 'warn':
        return <AlertTriangleIcon className="h-4 w-4 shrink-0 text-warning" />
      case 'info':
        return <InfoIcon className="h-4 w-4 shrink-0 text-info" />
      case 'success':
        return <CheckCircleIcon className="h-4 w-4 shrink-0 text-success" />
      default:
        return <AlertCircleIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
    }
  }

  const getMessageColor = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'error':
        return 'border-l-error bg-error/5'
      case 'warn':
        return 'border-l-warning bg-warning/5'
      case 'info':
        return 'border-l-info bg-info/5'
      case 'success':
        return 'border-l-success bg-success/5'
      default:
        return 'border-l-border bg-muted/30'
    }
  }

  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp), 'HH:mm:ss')
  }

  const counts = {
    all: messages.length,
    log: messages.filter((message) => message.type === 'log').length,
    info: messages.filter((message) => message.type === 'info').length,
    warn: messages.filter((message) => message.type === 'warn').length,
    error: messages.filter((message) => message.type === 'error').length,
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
        {/* Filters */}
        <div className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
          <button
            className={cn(
              'rounded px-2 py-1 text-xs font-medium transition-colors',
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
            type="button"
            onClick={() => setFilter('all')}
          >
            All ({counts.all})
          </button>
          <button
            className={cn(
              'rounded px-2 py-1 text-xs font-medium transition-colors',
              filter === 'error'
                ? 'bg-error text-white'
                : 'text-muted-foreground hover:text-foreground',
            )}
            type="button"
            onClick={() => setFilter('error')}
          >
            Errors ({counts.error})
          </button>
          <button
            className={cn(
              'rounded px-2 py-1 text-xs font-medium transition-colors',
              filter === 'warn'
                ? 'bg-warning text-white'
                : 'text-muted-foreground hover:text-foreground',
            )}
            type="button"
            onClick={() => setFilter('warn')}
          >
            Warnings ({counts.warn})
          </button>
          <button
            className={cn(
              'rounded px-2 py-1 text-xs font-medium transition-colors',
              filter === 'info'
                ? 'bg-info text-white'
                : 'text-muted-foreground hover:text-foreground',
            )}
            type="button"
            onClick={() => setFilter('info')}
          >
            Info ({counts.info})
          </button>
        </div>

        {/* Clear button */}
        <button
          aria-label="Clear console"
          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          type="button"
          onClick={clearConsole}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <Scrollable className="flex-1 font-mono text-xs">
        {filteredMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TerminalIcon className="mx-auto h-8 w-8 opacity-50" />
              <p className="mt-2 text-xs">No console messages</p>
            </div>
          </div>
        ) : (
          <div className="space-y-px">
            {filteredMessages.map((msg) => (
              <div
                key={generateReactKey('message', msg.id)}
                className={cn(
                  'group relative flex gap-3 border-l-2 px-4 py-2 hover:bg-muted/50',
                  getMessageColor(msg.type),
                )}
              >
                {getMessageIcon(msg.type)}
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-start justify-between gap-2">
                    <pre className="whitespace-pre-wrap break-words text-xs text-foreground">
                      {msg.message}
                    </pre>
                    <div className="flex shrink-0 items-center gap-2">
                      {msg.count && msg.count > 1 && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                          {msg.count}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Scrollable>
    </div>
  )
}
